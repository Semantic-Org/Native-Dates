import { each, isPlainObject } from './helpers/utils.js';

import { isDevelopment } from './helpers/environment.js';
import { guard, loosely, refuse, unreadable } from './helpers/errors.js';
import {
  addFields,
  carriedMonths,
  clockFields,
  fieldNames,
  fieldsFrom,
  fieldsOf,
  spill,
  temporalDurationOf,
} from './helpers/fields.js';
import { IS_DURATION } from './helpers/identity.js';
import { durationFormat, unitFormat } from './helpers/intl.js';
import { alias, inspect, isTemporalDuration, unit } from './helpers/units.js';
import { checkedLocale, locale as pickLocale } from './helpers/zones.js';

/*
  a span of calendar and clock units (Temporal.Duration).
  Fields keep their written units (90 minutes remains 90 minutes until .balance()), while durations
  measured by .until() or .since() record their starting point as `anchor` so months and years can total
*/

const subsecond = fieldNames.indexOf('milliseconds');
const styles = ['long', 'short', 'narrow', 'digital'];

export class Duration {
  // brand duration
  get [IS_DURATION]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_DURATION];
  }

  #temporal;
  #anchor;
  #locale;

  constructor(input, name, { anchor, locale } = {}) {
    this.#temporal = isTemporalDuration(input) && name === undefined
      ? input
      : temporalDurationOf(fieldsFrom(input, name));
    this.#anchor = anchor;
    this.#locale = locale ? checkedLocale(locale) : undefined;
    this.text = undefined; // keep text first in console previews
    const temporal = this.#temporal;
    this.years = temporal.years;
    this.months = temporal.months;
    this.weeks = temporal.weeks;
    this.days = temporal.days;
    this.hours = temporal.hours;
    this.minutes = temporal.minutes;
    this.seconds = temporal.seconds;
    this.milliseconds = temporal.milliseconds;
    this.sign = temporal.sign;
    this.anchor = anchor;
    this.text = this.format('long');
    Object.freeze(this);
  }

  locale(...tag) {
    return tag.length
      ? new Duration(this.#temporal, undefined, { anchor: this.#anchor, locale: tag[0] })
      : this.#locale;
  }

  #next(temporal, anchor) {
    return new Duration(temporal, undefined, { anchor, locale: this.#locale });
  }

  /*******************************
              Reads
  *******************************/

  get microseconds() {
    return this.#temporal.microseconds;
  }
  get nanoseconds() {
    return this.#temporal.nanoseconds;
  }
  isZero() {
    return this.#temporal.blank;
  }
  isNegative() {
    return this.#temporal.sign < 0;
  }

  toFields() {
    return fieldsOf(this.#temporal);
  }

  /*******************************
            Arithmetic
  *******************************/

  plus(other, name) {
    return this.#add(other, name, 1);
  }

  minus(other, name) {
    return this.#add(other, name, -1);
  }

  // String.prototype.anchor is a legacy HTML method, so check instanceof Duration rather than truthy .anchor
  #add(other, name, sign) {
    const anchor = this.#anchor ?? (other instanceof Duration ? other.anchor : undefined);
    return this.#next(temporalDurationOf(addFields(this.toFields(), fieldsFrom(other, name), sign, anchor)), anchor);
  }

  times(factor) {
    const fields = {};
    each(this.toFields(), (value, field) => {
      spill(fields, unit(field), value * factor);
    });
    return this.#next(temporalDurationOf(fields), this.#anchor);
  }

  negated() {
    return this.#next(this.#temporal.negated(), this.#anchor);
  }

  abs() {
    return this.#next(this.#temporal.abs(), this.#anchor);
  }

  // unanchored balance() stops clock overflow at hours (calendar days can be 23 or 25h across DST)
  // while still carrying months into 12-month ISO years
  balance(largest) {
    if (!this.#anchor) {
      if (largest === undefined) {
        return Duration.#balancedClock(this);
      }
      const whole = Duration.#wholeMonths(this);
      const into = unit(largest);
      if (whole !== undefined && (into === 'year' || into === 'quarter' || into === 'month')) {
        return this.#next(
          temporalDurationOf(
            into === 'year' ? carriedMonths(0, whole) : { months: whole },
          ),
        );
      }
      Duration.#requireAnchor(this, 'balance');
      if (into === 'week') {
        return Duration.#balancedWeeks(this);
      }
      if (into === 'month' || into === 'quarter' || into === 'year') {
        refuse('missingAnchor', `balance to ${into}`, {
          explanation: isDevelopment
            ? "months, quarters, and years vary in length, so balancing to them requires a starting date. Measure between two dates with `a.until(b)`, or balance up to 'week' or 'day'"
            : 0,
        });
      }
      return this.#next(
        guard(() => Duration.#fixed(this).round({ largestUnit: into }), 'cannotBalance', String(this)),
      );
    }
    return this.#next(
      guard(
        () => this.#temporal.round({ largestUnit: unit(largest ?? 'day'), relativeTo: this.#anchor }),
        'cannotBalance',
        String(this),
      ),
      this.#anchor,
    );
  }

  round(smallest) {
    const target = unit(smallest);
    return this.#next(
      guard(
        () => Duration.#fixed(this).round({ smallestUnit: target, relativeTo: this.#anchor }),
        'cannotRound',
        String(this),
      ),
      this.#anchor,
    );
  }

  // Temporal.Duration.round/total/compare throw on `weeks` without relativeTo, even though ISO weeks are
  // always 7 days. Fold weeks into days via public getters so cross-bundle Duration instances work too
  static #fixed(duration) {
    const temporal = duration.toTemporal();
    if (duration.anchor || !temporal.weeks) {
      return temporal;
    }
    return temporalDurationOf(addFields({ ...duration.toFields(), weeks: 0 }, { days: temporal.weeks * 7 }, 1));
  }

  static #balancedClock(duration) {
    const { years, months, days, ...clock } = fieldsOf(Duration.#fixed(duration));
    const balanced = fieldsOf(temporalDurationOf(clock).round({ largestUnit: 'hour' }));
    return new Duration(
      temporalDurationOf({
        ...carriedMonths(years, months),
        ...(days && { days }),
        ...balanced,
      }),
      undefined,
      { locale: duration.locale() },
    );
  }

  // convert back from days in sevens since Temporal.Duration.round({ largestUnit: 'week' }) requires relativeTo
  static #balancedWeeks(duration) {
    const { days = 0, ...clock } = fieldsOf(Duration.#fixed(duration).round({ largestUnit: 'day' }));
    const weeks = Math.trunc(days / 7);
    const rest = days - weeks * 7;
    return new Duration(
      temporalDurationOf({ ...(weeks && { weeks }), ...(rest && { days: rest }), ...clock }),
      undefined,
      { locale: duration.locale() },
    );
  }

  // pure year/month durations convert 12:1 without an anchor, returning undefined when sub-month fields exist
  static #wholeMonths(duration) {
    const fields = duration.toFields();
    return fieldNames.slice(2).some((name) => fields[name])
      ? undefined
      : (fields.years ?? 0) * 12 + (fields.months ?? 0);
  }

  static #requireAnchor(duration, verb) {
    const fields = duration.toFields();
    if (!duration.anchor && (fields.years || fields.months)) {
      refuse('missingAnchor', `${verb} of ${duration}`, {
        explanation: isDevelopment
          ? 'months and years vary in length, so converting or comparing them with weeks, days, or clock units requires a starting date. Measure between two dates with `a.until(b)`, or construct the duration in weeks or days'
          : 0,
      });
    }
  }

  /*******************************
             Measure
  *******************************/

  total(name) {
    const target = unit(name);
    if (target === 'quarter') {
      return this.total('month') / 3;
    }
    const whole = Duration.#wholeMonths(this);
    if (whole !== undefined && (target === 'year' || target === 'month')) {
      return target === 'year' ? whole / 12 : whole;
    }
    if (this.#anchor) {
      return guard(
        () => this.#temporal.total({ unit: target, relativeTo: this.#anchor }),
        'cannotTotal',
        `${this} in ${target}`,
      );
    }
    Duration.#requireAnchor(this, `total in ${target}`);
    if (target === 'year' || target === 'month') {
      refuse('missingAnchor', `total in ${target}`, {
        explanation: isDevelopment
          ? "months, quarters, and years vary in length, so totaling in them requires a starting date. Measure between two dates with `a.until(b)`, or total in 'weeks' or 'days'"
          : 0,
      });
    }
    const fixed = Duration.#fixed(this);
    return guard(
      () => (target === 'week' ? fixed.total('day') / 7 : fixed.total(target)),
      'cannotTotal',
      `${this} in ${target}`,
    );
  }

  compare(other) {
    const rival = other instanceof Duration ? other : new Duration(other);
    const [mine, theirs] = [Duration.#fixed(this), Duration.#fixed(rival)];
    // identical ISO strings are equal even for unanchored months/years where Temporal.Duration.compare() throws
    if (mine.toString() === theirs.toString()) {
      return 0;
    }
    const [myMonths, theirMonths] = [Duration.#wholeMonths(this), Duration.#wholeMonths(rival)];
    if (myMonths !== undefined && theirMonths !== undefined) {
      return Math.sign(myMonths - theirMonths);
    }
    const anchor = this.#anchor ?? rival.anchor;
    if (!anchor) {
      Duration.#requireAnchor(this, 'compare');
      Duration.#requireAnchor(rival, 'compare');
    }
    return Temporal.Duration.compare(mine, theirs, anchor ? { relativeTo: anchor } : undefined);
  }

  equals(other) {
    return this.compare(other) === 0;
  }

  /*******************************
              Output
  *******************************/

  // keep calendar fields as written, balance clock overflow up to hours, and hide sub-second fields when >= 1s is set
  format(style = 'long', locale = this.#locale) {
    if (!styles.includes(style)) {
      refuse('unknownFormat', String(style), {
        explanation: isDevelopment ? `expected a duration format style in [${styles.join(', ')}]` : 0,
      });
    }
    const written = this.toFields();
    const clock = fieldsOf(temporalDurationOf(clockFields(written)).round({ largestUnit: 'hour' }));
    const fields = { ...written, ...Object.fromEntries(fieldNames.slice(4).map((field) => [field, clock[field]])) };
    const large = fieldNames.slice(0, subsecond).some((field) => fields[field]);
    // hoursDisplay: 'auto' omits zero hours so digital zero formats as '00:00'
    const shown = {};
    each(fieldNames, (field, index) => {
      if (field === 'hours' || (fields[field] && (!large || index < subsecond))) {
        shown[field] = fields[field] || 0;
      }
    });
    // Intl.DurationFormat omits zero fields by default (returning '' for { seconds: 0 } and throwing on {})
    if (this.isZero() && style !== 'digital') {
      const unitDisplay = style === 'long' ? 'long' : style === 'narrow' ? 'narrow' : 'short';
      return unitFormat(pickLocale(locale), 'second', unitDisplay).format(0);
    }
    return durationFormat(pickLocale(locale), style, 'auto').format(shown);
  }

  toString() {
    return this.#temporal.toString();
  }

  toJSON() {
    return this.#temporal.toString();
  }

  toTemporal() {
    return this.#temporal;
  }

  toMilliseconds() {
    return this.total('millisecond');
  }

  valueOf() {
    return this.toMilliseconds();
  }

  // '+' sends hint 'default', which would return ms instead of toString() without this
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.toMilliseconds() : this.toString();
  }

  [inspect]() {
    return `Duration(${this.#temporal})${this.#anchor ? ` from ${this.#anchor}` : ''}`;
  }
}

alias(Duration, { add: 'plus', subtract: 'minus', lang: 'locale', as: 'total' });

export const duration = (input, unitOrOptions) => {
  const hasOptions = isPlainObject(unitOrOptions);
  const name = hasOptions ? undefined : unitOrOptions;
  const locale = hasOptions && unitOrOptions.locale !== undefined ? checkedLocale(unitOrOptions.locale) : undefined;
  const build = () =>
    input instanceof Duration && name === undefined
      ? (hasOptions && Object.hasOwn(unitOrOptions, 'locale') ? input.locale(locale) : input)
      : new Duration(input, name, { locale });
  return hasOptions && unitOrOptions.loose ? loosely(build, unreadable.length) : build();
};

export const anchored = (temporal, anchor, locale) => new Duration(temporal, undefined, { anchor, locale });

export const isDuration = (value) => value instanceof Duration;

export const years = (count) => new Duration(count, 'year');
export const months = (count) => new Duration(count, 'month');
export const weeks = (count) => new Duration(count, 'week');
export const days = (count) => new Duration(count, 'day');
export const hours = (count) => new Duration(count, 'hour');
export const minutes = (count) => new Duration(count, 'minute');
export const seconds = (count) => new Duration(count, 'second');
export const milliseconds = (count) => new Duration(count, 'millisecond');
