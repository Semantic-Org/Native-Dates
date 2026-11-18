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
import { inspect, isTemporalDuration, unit } from './helpers/units.js';
import { checkedLocale, locale as pickLocale } from './helpers/zones.js';

/*
  a length of time. fields stay as written (90 minutes is 90 minutes until you balance it), and a
  duration that came from until() or since() remembers where it started, so months and years total
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
    // the parts are own properties, so a value prints them in a console without a click. the text is
    // keyed first so a preview leads with it
    this.text = undefined;
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

  // the locale this duration is written in, or the same duration written in another. an unset tag
  // clears it
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

  // a string has an anchor method of its own, so only another duration is asked for one
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

  // carries overflow upward: 90 minutes balances to an hour and a half, 18 months to a year and a
  // half. a length stops at hours, since a day is a calendar unit and folding 36 hours into one would
  // move a deadline across a daylight saving change. an anchored duration knows its calendar, so days
  // are its ceiling until asked for weeks, months or years, and an explicit unit is taken at its
  // word either way
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
            ? "months, quarters, and years vary in length, so balancing to them requires a starting date. measure between two dates with `a.until(b)`, or balance up to 'week' or 'day'"
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

  // Temporal treats a week as seven days only when told where it starts. in the ISO calendar that is
  // always true, so an unanchored duration folds weeks into days before it totals or balances. reads
  // through the public face, so a duration from another copy of this package fixes the same way
  static #fixed(duration) {
    const temporal = duration.toTemporal();
    if (duration.anchor || !temporal.weeks) {
      return temporal;
    }
    return temporalDurationOf(addFields({ ...duration.toFields(), weeks: 0 }, { days: temporal.weeks * 7 }, 1));
  }

  // weeks are already days here. a year is always twelve months, so months carry into years with no
  // anchor, where days carry into nothing and stay as they are
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

  // a week is seven days in the ISO calendar, so it needs no anchor: the days fold in sevens
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

  // a year is twelve months in the ISO calendar, so a duration of only years and months counts in
  // months, anchored or not. undefined once it carries weeks, days or a clock, which a month cannot hold
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
          ? 'months and years vary in length, so converting or comparing them with weeks, days, or clock units requires a starting date. measure between two dates with `a.until(b)`, or construct the duration in weeks or days'
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
    // years and months count in twelfths with or without an anchor, so 18 months is a year and a half
    // however it was measured
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
          ? "months, quarters, and years vary in length, so totaling in them requires a starting date. measure between two dates with `a.until(b)`, or total in 'weeks' or 'days'"
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
    // the same fields are the same length in any calendar, so a month equals a month without an anchor
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

  // Intl.DurationFormat over the calendar fields as written and the clock balanced, so a stored count of
  // milliseconds reads as hours and minutes. the sub-second fields only show when nothing larger is set,
  // so a wall-clock difference reads as hours and minutes and a timer reads as milliseconds
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
    const shown = {};
    each(fieldNames, (field, index) => {
      if (fields[field] && (!large || index < subsecond)) {
        shown[field] = fields[field];
      }
    });
    // Intl.DurationFormat prints nothing for a zero duration, so zero is spelled out as seconds
    if (this.isZero()) {
      const unitDisplay = style === 'long' ? 'long' : style === 'narrow' ? 'narrow' : 'short';
      return style === 'digital'
        ? durationFormat(pickLocale(locale), style, 'always').format({ hours: 0 })
        : unitFormat(pickLocale(locale), 'second', unitDisplay).format(0);
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

  // + gives the string and < and - the number, the way Date decides
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.toMilliseconds() : this.toString();
  }

  [inspect]() {
    return `Duration(${this.#temporal})${this.#anchor ? ` from ${this.#anchor}` : ''}`;
  }
}

Duration.prototype.add = Duration.prototype.plus;
Duration.prototype.subtract = Duration.prototype.minus;
Duration.prototype.lang = Duration.prototype.locale;
Duration.prototype.as = Duration.prototype.total;

// duration(input, unit), or duration(input, { loose, locale })
export const duration = (input, unitOrOptions) => {
  const hasOptions = isPlainObject(unitOrOptions);
  const name = hasOptions ? undefined : unitOrOptions;
  const locale = hasOptions ? unitOrOptions.locale : undefined;
  const build = () =>
    input instanceof Duration && name === undefined
      ? (locale === undefined ? input : input.locale(locale))
      : new Duration(input, name, { locale });
  return hasOptions && unitOrOptions.loose ? loosely(build, unreadable.length) : build();
};

// a duration that remembers the point it was measured from, so months and years can total
export const anchored = (temporal, anchor, locale) => new Duration(temporal, undefined, { anchor, locale });

export const isDuration = (value) => value instanceof Duration;

// a duration is a fields object, a phrase, or one of these: hours(2), days(3)
export const years = (count) => new Duration(count, 'year');
export const months = (count) => new Duration(count, 'month');
export const weeks = (count) => new Duration(count, 'week');
export const days = (count) => new Duration(count, 'day');
export const hours = (count) => new Duration(count, 'hour');
export const minutes = (count) => new Duration(count, 'minute');
export const seconds = (count) => new Duration(count, 'second');
export const milliseconds = (count) => new Duration(count, 'millisecond');
