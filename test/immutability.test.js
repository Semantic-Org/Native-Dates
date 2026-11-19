import {
  CalendarDate,
  date,
  dateRange,
  datetime,
  datetimeRange,
  duration,
  hours,
  monthDay,
  time,
  timeRange,
  yearMonth,
} from 'native-dates';
import { describe, expect, it } from 'vitest';

const values = {
  DateTime: datetime('2026-11-16T09:30', 'America/Los_Angeles'),
  CalendarDate: date('2026-11-16'),
  Time: time('9:30am'),
  Duration: duration('1h 30m'),
  YearMonth: yearMonth('2026-11'),
  MonthDay: monthDay('10-17'),
  DateRange: dateRange('2026-11-01', '2026-11-07'),
  DateTimeRange: datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z', 'UTC'),
  TimeRange: timeRange('9:00am', '5:00pm'),
};

const classNames = Object.keys(values);

describe('a value once made', () => {
  it.each(classNames)('is frozen when it is a %s', (className) => {
    expect(Object.isFrozen(values[className])).toBe(true);
  });

  it.each(classNames)('throws a TypeError when a property of a %s is assigned, added or deleted', (className) => {
    const value = values[className];
    const before = { ...value };
    expect(() => {
      value.text = 'changed';
    }).toThrowError(TypeError);
    expect(() => {
      value.extra = 1;
    }).toThrowError(TypeError);
    expect(() => {
      delete value.text;
    }).toThrowError(TypeError);
    expect({ ...value }).toEqual(before);
  });

  it('holds frozen values at both ends of a range', () => {
    for (const range of [values.DateRange, values.DateTimeRange, values.TimeRange]) {
      expect(Object.isFrozen(range.start)).toBe(true);
      expect(Object.isFrozen(range.end)).toBe(true);
    }
  });

  it.each([
    ['DateTime', 'plus()', values.DateTime, (moment) => moment.plus(1, 'hour')],
    ['DateTime', 'set()', values.DateTime, (moment) => moment.set('hour', 17)],
    ['DateTime', 'in()', values.DateTime, (moment) => moment.in('Asia/Tokyo')],
    ['DateTime', 'startOf()', values.DateTime, (moment) => moment.startOf('day')],
    ['DateTime', 'locale()', values.DateTime, (moment) => moment.locale('de')],
    ['CalendarDate', 'plus()', values.CalendarDate, (day) => day.plus(2, 'weeks')],
    ['CalendarDate', 'set()', values.CalendarDate, (day) => day.set('day', 1)],
    ['CalendarDate', 'endOf()', values.CalendarDate, (day) => day.endOf('month')],
    ['Time', 'minus()', values.Time, (clock) => clock.minus(45, 'minutes')],
    ['Time', 'round()', values.Time, (clock) => clock.round('hour')],
    ['Duration', 'plus()', values.Duration, (span) => span.plus(hours(1))],
    ['Duration', 'negated()', values.Duration, (span) => span.negated()],
    ['Duration', 'balance()', duration('90 minutes'), (span) => span.balance()],
    ['YearMonth', 'plus()', values.YearMonth, (month) => month.plus(1, 'month')],
    ['MonthDay', 'locale()', values.MonthDay, (birthday) => birthday.locale('de')],
    ['DateRange', 'in()', values.DateRange, (range) => range.in('Asia/Tokyo')],
    ['DateTimeRange', 'in()', values.DateTimeRange, (range) => range.in('Asia/Tokyo')],
    ['TimeRange', 'locale()', values.TimeRange, (range) => range.locale('de')],
  ])('leaves a %s as it was when %s returns another', (className, method, value, change) => {
    const [written, text] = [value.toString(), value.text];
    const changed = change(value);
    expect(changed).not.toBe(value);
    expect(value.toString()).toBe(written);
    expect(value.text).toBe(text);
  });
});

describe('what a caller passes in', () => {
  it('a fields object is left as given, and changing it later changes no value read from it', () => {
    const fields = { year: 2026, month: 11, day: 16, hour: 9 };
    const moment = datetime(fields, 'UTC');
    expect(fields).toEqual({ year: 2026, month: 11, day: 16, hour: 9 });
    fields.year = 1999;
    expect(moment.year).toBe(2026);
  });

  it('a units object is left as given by duration(), plus() and set()', () => {
    const units = { hours: 1, minutes: 30 };
    const span = duration(units);
    values.DateTime.plus(units);
    values.DateTime.set({ hour: 5 });
    expect(units).toEqual({ hours: 1, minutes: 30 });
    units.hours = 99;
    expect(span.hours).toBe(1);
  });

  it('a Date is left as given, and changing it later changes no value read from it', () => {
    const native = new Date('2026-11-16T17:30:00Z');
    const moment = datetime(native, 'UTC');
    expect(native.toISOString()).toBe('2026-11-16T17:30:00.000Z');
    native.setUTCFullYear(1999);
    expect(moment.year).toBe(2026);
  });

  it('an options object is left as given', () => {
    const options = { zone: 'Asia/Tokyo', locale: 'ja' };
    datetime('2026-11-16T09:30', options);
    date('2026-11-16', options);
    expect(options).toEqual({ zone: 'Asia/Tokyo', locale: 'ja' });
  });
});

describe('what a value hands back', () => {
  it('toJSDate() is a new Date each time, so changing one changes neither the value nor the next Date', () => {
    const moment = values.DateTime;
    const native = moment.toJSDate();
    native.setFullYear(1999);
    expect(moment.year).toBe(2026);
    expect(moment.toJSDate().getFullYear()).toBe(2026);
  });

  it('toFields() on a duration is a new object each time', () => {
    const span = values.Duration;
    const fields = span.toFields();
    fields.hours = 99;
    expect(span.toFields()).toEqual({ hours: 1, minutes: 30 });
    expect(span.hours).toBe(1);
  });
});

describe('a class prototype', () => {
  // values are frozen and classes are not, which is how a plugin adds a method
  it('takes a new method that every value of the class can call, made before or after', () => {
    const before = date('2026-11-13');
    CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
      return this.plus(this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1, 'days');
    };
    try {
      expect(before.nextBusinessDay().toString()).toBe('2026-11-16');
      expect(date('2026-11-16').nextBusinessDay().toString()).toBe('2026-11-17');
    }
    finally {
      delete CalendarDate.prototype.nextBusinessDay;
    }
  });
});
