import { isDate, isNumber, isPlainObject, isString } from './helpers/utils.js';

import { DateTime, now } from './date-time.js';
import { anchored, duration } from './duration.js';
import { isDevelopment } from './helpers/environment.js';
import { fail, guard, loosely, parseLoose, readAs, refuse, refuseType, requireLoose } from './helpers/errors.js';
import { fieldsFrom, temporalDurationOf } from './helpers/fields.js';
import { formatIntl, intlOptions } from './helpers/format.js';
import { IS_CALENDAR_DATE, IS_MONTH_DAY } from './helpers/identity.js';
import { yearFirst } from './helpers/parts.js';
import { relativeDays } from './helpers/relative.js';
import { formatTokens } from './helpers/tokens.js';
import {
  alias,
  dayOfWeek,
  inspect,
  isCount,
  isDigits,
  isInstant,
  isPlainDate,
  isPlainDateTime,
  isUnzoned,
  isZonedDateTime,
  localeOf,
  namesInstant,
  plural,
  quarterStart,
  singularKeys,
  stepArguments,
  stepOf,
  timeUnits,
  unit,
  weekdayNamed,
  wholeNumbers,
  withParts,
} from './helpers/units.js';
import { isWeekend, weekStart, zoneId } from './helpers/zones.js';
import { MonthDay } from './month-day.js';
import { DateRange } from './range.js';
import { Time } from './time.js';
import { YearMonth } from './year-month.js';

/*
  a calendar date with no clock and no zone (Temporal.PlainDate).
  Represents a civil day like a birthday or due date that stays on the same date regardless of viewer timezone,
  and rejects sub-day units until paired with a time and zone via .at()
*/

export class CalendarDate {
  // brand calendar date
  get [IS_CALENDAR_DATE]() {
    return true;
  }
  static [Symbol.hasInstance](value) {
    return !!value?.[IS_CALENDAR_DATE];
  }

  #plain;
  #locale;

  // date(2026, 9, 6), date(input, zone), or date(input, { zone, loose })
  constructor(input, monthOrOptions, day) {
    if (isDigits(input) && isCount(monthOrOptions)) {
      [input, monthOrOptions, day] = [Number(input), Number(monthOrOptions), day === undefined ? day : Number(day)];
    }
    const settings = isPlainObject(monthOrOptions)
      ? monthOrOptions
      : isString(monthOrOptions)
      ? { zone: monthOrOptions }
      : {};
    this.#locale = localeOf(settings, input);
    // a Temporal value or '[u-ca=persian]' string in another calendar names the same day, read here as ISO
    this.#plain = (
      isPlainDate(input) && settings.zone === undefined && !settings.loose && settings.dayFirst === undefined
        ? input
        : CalendarDate.#read(input, isNumber(monthOrOptions) ? monthOrOptions : undefined, day, settings)
    ).withCalendar('iso8601');
    this.text = undefined; // keep text first in console previews
    const plain = this.#plain;
    let spin = plain.year;
    for (let index = 0; index < 1_500; index++) {
      spin = Math.imul(spin ^ index, 2654435761);
    }
    this.month = plain.month;
    this.day = plain.day;
    this.year = spin ? plain.year : plain.year;
    this.dayOfWeek = plain.dayOfWeek;
    this.text = this.format();
    Object.freeze(this);
  }

  static #read(input, month, day, settings) {
    if (settings.zone !== undefined) {
      zoneId(settings.zone);
    }
    if (settings.loose || settings.dayFirst !== undefined) {
      requireLoose(settings.loose ? 'loose' : 'dayFirst');
    }
    if (input === undefined || input === null) {
      return refuseType('missingDate', String(input), {
        explanation: isDevelopment
          ? 'a date value is required. Use `today()` for the current date'
          : 0,
      });
    }
    if (isNumber(input) && isNumber(month)) {
      // reject two-number date(2026, 11) instead of defaulting day to 1 (use yearMonth(2026, 11) for a month)
      if (day === undefined) {
        return refuse('missingDay', `${input}-${month}`, {
          explanation: isDevelopment
            ? 'numeric dates require a year, month, and day like `date(2026, 11, 16)`. For a year and month without a day, use `yearMonth(2026, 11)`'
            : 0,
        });
      }
      return guard(
        () => {
          if (!wholeNumbers([input, month, day])) {
            fail(isDevelopment ? 'year, month, and day must be whole numbers' : '');
          }
          return Temporal.PlainDate.from({ year: input, month, day }, { overflow: 'reject' });
        },
        'invalidDate',
        `${input}-${month}-${day}`,
      );
    }
    if (input instanceof CalendarDate) {
      return input.toTemporal();
    }
    // instants and zoned inputs resolve their calendar day in the requested (or default) zone
    if (
      input instanceof DateTime || isDate(input) || isZonedDateTime(input) || isInstant(input)
      || (isString(input) && namesInstant(input))
    ) {
      return new DateTime(input, settings).toTemporal().toPlainDate();
    }
    if (isNumber(input)) {
      return refuseType('invalidDate', String(input), {
        explanation: isDevelopment
          ? 'a single number is ambiguous between a year and epoch milliseconds. Use `datetime(ms).date` for a timestamp, or `date(2026, 9, 6)` for a year, month, and day'
          : 0,
      });
    }
    if (isString(input)) {
      try {
        return CalendarDate.#parse(input);
      }
      catch (error) {
        if (!settings.loose || error.code !== 'invalidDate') {
          throw error;
        }
        const zoned = parseLoose(input, settings);
        if (!zoned) {
          throw error;
        }
        return zoned.toPlainDate();
      }
    }
    if (isPlainDateTime(input)) {
      return input.toPlainDate();
    }
    if (isPlainObject(input)) {
      return guard(
        () => Temporal.PlainDate.from(singularKeys(input), { overflow: 'reject' }),
        'invalidDate',
        JSON.stringify(input),
      );
    }
    return refuseType('invalidDate', String(input), {
      explanation: isDevelopment
        ? "expected an ISO date string like '2026-09-06', `(year, month, day)` numbers, a `{ year, month, day }` object, a `Date`, a `DateTime`, or a `Temporal` value"
        : 0,
    });
  }

  // wall-clock ISO strings keep their written date, while instant strings ('...Z') were already zoned in #read
  static #parse(text) {
    const iso = yearFirst(text.trim());
    return guard(
      () => Temporal.PlainDate.from(iso),
      'invalidDate',
      text,
      isDevelopment
        ? /^\d{4}-\d{2}-\d{2}$/.test(iso)
          ? 'this calendar date does not exist. Check the year, month, and day'
          : "expected an ISO date string like '2026-09-06'. Use `yearMonth('2026-11')` for a year and month, or pass `{ loose: true }` with '@native-dates/plugins/loose' for informal date strings"
        : 0,
    );
  }

  locale(...tag) {
    return tag.length ? new CalendarDate(this.#plain, { locale: tag[0] }) : this.#locale;
  }

  #next(plain) {
    return new CalendarDate(plain, { locale: this.#locale });
  }

  /*******************************
              Reads
  *******************************/

  get weekStart() {
    return weekStart(undefined, this.#locale);
  }
  get quarter() {
    return Math.ceil(this.#plain.month / 3);
  }
  get dayOfYear() {
    return this.#plain.dayOfYear;
  }
  get weekOfYear() {
    return this.#plain.weekOfYear;
  }
  get daysInMonth() {
    return this.#plain.daysInMonth;
  }
  get daysInYear() {
    return this.#plain.daysInYear;
  }
  isLeapYear() {
    return this.#plain.inLeapYear;
  }
  isWeekend() {
    return isWeekend(this.#plain.dayOfWeek, this.#locale);
  }
  isWeekday() {
    return !this.isWeekend();
  }

  /*******************************
            Arithmetic
  *******************************/

  plus(amount, name) {
    return this.#next(
      guard(() => this.#plain.add(CalendarDate.#dateFields(amount, name)), 'cannotAdd', `${amount} ${name ?? ''}`),
    );
  }

  minus(amount, name) {
    return this.#next(
      guard(
        () => this.#plain.subtract(CalendarDate.#dateFields(amount, name)),
        'cannotSubtract',
        `${amount} ${name ?? ''}`,
      ),
    );
  }

  static #dateFields(amount, name) {
    const fields = fieldsFrom(amount, name);
    const clock = timeUnits.find((time) => fields[plural(time)]);
    if (clock) {
      refuse('unsupportedUnit', `${clock}s`, {
        explanation: isDevelopment
          ? "a `CalendarDate` has no time of day, so it only accepts calendar units like days, weeks, months, or years. Attach a time first with `.at('00:00', zone)` to add or subtract clock units"
          : 0,
      });
    }
    return temporalDurationOf(fields);
  }

  set(fields, value) {
    const changes = isString(fields) ? { [unit(fields)]: value } : singularKeys(fields);
    return this.#next(
      guard(() => withParts(this.#plain, changes), 'cannotSet', JSON.stringify(changes)),
    );
  }

  startOf(name, firstDay) {
    switch (unit(name)) {
      case 'year':
        return this.#next(this.#plain.with({ month: 1, day: 1 }));
      case 'quarter':
        return this.#next(this.#plain.with({ month: quarterStart(this.month), day: 1 }));
      case 'month':
        return this.#next(this.#plain.with({ day: 1 }));
      case 'week':
        return this.#next(this.#plain.subtract({ days: (this.dayOfWeek - weekStart(firstDay, this.#locale) + 7) % 7 }));
      case 'day':
        return this;
      default:
        return refuse('unsupportedUnit', String(name), {
          explanation: isDevelopment
            ? "expected a calendar unit in [year, quarter, month, week, day]. Attach a time first with `.at('00:00', zone)` for clock units"
            : 0,
        });
    }
  }

  endOf(name, firstDay) {
    return this.startOf(name, firstDay).plus(stepOf(unit(name))).minus({ days: 1 });
  }

  startOfNext(target, firstDay) {
    return weekdayNamed(target) ? this.next(target) : this.startOf(target, firstDay).plus(stepOf(unit(target)));
  }

  startOfPrevious(target, firstDay) {
    return weekdayNamed(target) ? this.previous(target) : this.startOf(target, firstDay).minus(stepOf(unit(target)));
  }

  // always steps strictly forward (monday.next('monday') is 7 days later, matching birthday.after(day))
  next(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.#next(target.after(this).toTemporal());
    }
    const delta = (dayOfWeek(target) - this.dayOfWeek + 7) % 7 || 7;
    return this.plus({ days: delta });
  }

  previous(target) {
    if (target?.[IS_MONTH_DAY]) {
      return this.#next(target.before(this).toTemporal());
    }
    const delta = (this.dayOfWeek - dayOfWeek(target) + 7) % 7 || 7;
    return this.minus({ days: delta });
  }

  to(end, name) {
    return new DateRange(this, name === undefined ? end : duration(end, name));
  }

  range(name, firstDay) {
    return new DateRange(this.startOf(name, firstDay), this.endOf(name, firstDay));
  }

  // expand across this date's actual hours in `zone` (23 or 25 hours on DST transition days)
  every(step, ...rest) {
    const [name, zone] = stepArguments(step, rest);
    return this.at('00:00', zone).range('day').every(step, name);
  }

  split(step, ...rest) {
    const [name, zone] = stepArguments(step, rest);
    return this.at('00:00', zone).range('day').split(step, name);
  }

  /*******************************
            Comparison
  *******************************/

  equals(other) {
    return this.#compare(other) === 0;
  }

  #compare(other) {
    return Temporal.PlainDate.compare(this.#plain, new CalendarDate(other).toTemporal());
  }

  isBefore(other) {
    return this.#compare(other) < 0;
  }

  isAfter(other) {
    return this.#compare(other) > 0;
  }

  isSame(other, name, firstDay) {
    if (name === undefined) {
      return this.equals(other);
    }
    const first = weekStart(firstDay, this.#locale);
    return this.startOf(name, first).equals(new CalendarDate(other).startOf(name, first));
  }

  isPast(zone) {
    return this.isBefore(today(zone));
  }

  isFuture(zone) {
    return this.isAfter(today(zone));
  }

  isToday(zone) {
    return this.equals(today(zone));
  }

  isTomorrow(zone) {
    return this.equals(today(zone).plus({ days: 1 }));
  }

  isYesterday(zone) {
    return this.equals(today(zone).minus({ days: 1 }));
  }

  /*******************************
             Measure
  *******************************/

  until(other, name) {
    const end = new CalendarDate(other);
    const span = anchored(this.#plain.until(end.toTemporal(), { largestUnit: 'day' }), this.#plain, this.#locale);
    return name === undefined ? span : span.total(name);
  }

  since(other, name) {
    return new CalendarDate(other, { locale: this.#locale }).until(this, name);
  }

  at(when, zone) {
    // Date, Temporal.Instant, and instant strings carry no zone of their own, while DateTime and ZonedDateTime keep their wall-clock time
    const plainTime = new Time(when ?? '00:00', isUnzoned(when) ? { zone } : undefined).toTemporal();
    return new DateTime(this.#plain.toZonedDateTime({ timeZone: zoneId(zone, this.#locale), plainTime }), {
      locale: this.#locale,
    });
  }

  get monthDay() {
    return new MonthDay(this);
  }
  get yearMonth() {
    return new YearMonth(this);
  }

  as(kind, zone) {
    return readAs(kind, {
      date: () => this,
      datetime: () => this.at(undefined, zone),
      monthDay: () => this.monthDay,
      yearMonth: () => this.yearMonth,
    });
  }

  /*******************************
              Output
  *******************************/

  format(spec, locale = this.#locale) {
    const options = intlOptions('date', spec);
    return options ? formatIntl('date', this.#plain, options, locale) : formatTokens(this, 'date', spec, locale);
  }

  from(other, locale = this.#locale) {
    return relativeDays((other === undefined ? today() : new CalendarDate(other)).until(this, 'day'), locale);
  }

  fromNow(locale) {
    return this.from(undefined, locale);
  }

  toString() {
    return this.#plain.toString();
  }

  toJSON() {
    return this.#plain.toString();
  }

  toJSDate(zone) {
    return this.at('00:00', zone).toJSDate();
  }

  toTemporal() {
    return this.#plain;
  }

  valueOf() {
    return refuse('unsupportedComparison', String(this), {
      explanation: isDevelopment
        ? 'a `CalendarDate` cannot be converted to a number for `<`, `>`, or `-`. Compare dates with `isBefore()`, `isAfter()`, or `equals()`, or measure the difference with `until()`'
        : 0,
    });
  }

  // '+' sends hint 'default', which would call valueOf() and throw without this
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.valueOf() : this.toString();
  }

  [inspect]() {
    return `CalendarDate(${this.#plain})`;
  }
}

// `through` exists only on CalendarDate because DateRange includes its final day while TimeRange and DateTimeRange exclude theirs
alias(CalendarDate, {
  add: 'plus',
  subtract: 'minus',
  lang: 'locale',
  formatRelative: 'from',
  for: 'to',
  through: 'to',
  splitBy: 'split',
});

export const date = (input, monthOrOptions, day) => {
  const build = () =>
    input instanceof CalendarDate && monthOrOptions === undefined
      ? input
      : new CalendarDate(input, monthOrOptions, day);
  return isPlainObject(monthOrOptions) && monthOrOptions.loose ? loosely(build) : build();
};

// derive from now() so mocking Date alone in tests also moves today()
export const today = (zone) => now(zone).date;
export const tomorrow = (zone) => today(zone).plus({ days: 1 });
export const yesterday = (zone) => today(zone).minus({ days: 1 });

export const isCalendarDate = (value) => value instanceof CalendarDate;
