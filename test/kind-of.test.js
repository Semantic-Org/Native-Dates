import {
  CalendarDate,
  date,
  DateRange,
  dateRange,
  DateTime,
  datetime,
  DateTimeRange,
  datetimeRange,
  Duration,
  hours,
  IS_CALENDAR_DATE,
  IS_DATE_RANGE,
  IS_DATE_TIME,
  IS_DATE_TIME_RANGE,
  IS_DURATION,
  IS_MONTH_DAY,
  IS_RANGE,
  IS_TIME,
  IS_TIME_RANGE,
  IS_YEAR_MONTH,
  isCalendarDate,
  isDateRange,
  isDateTime,
  isDateTimeRange,
  isDuration,
  isMonthDay,
  isTime,
  isTimeRange,
  isYearMonth,
  kindOf,
  MonthDay,
  monthDay,
  Time,
  time,
  TimeRange,
  timeRange,
  YearMonth,
  yearMonth,
} from 'native-dates';
import { describe, expect, it } from 'vitest';

const kinds = [
  { kind: 'datetime', Class: DateTime, guard: isDateTime, brand: IS_DATE_TIME, value: datetime(1794850200000, 'UTC') },
  { kind: 'date', Class: CalendarDate, guard: isCalendarDate, brand: IS_CALENDAR_DATE, value: date('2026-11-16') },
  { kind: 'time', Class: Time, guard: isTime, brand: IS_TIME, value: time('9:30am') },
  { kind: 'duration', Class: Duration, guard: isDuration, brand: IS_DURATION, value: hours(2) },
  { kind: 'yearMonth', Class: YearMonth, guard: isYearMonth, brand: IS_YEAR_MONTH, value: yearMonth('2026-11') },
  { kind: 'monthDay', Class: MonthDay, guard: isMonthDay, brand: IS_MONTH_DAY, value: monthDay('10-17') },
  {
    kind: 'dateRange',
    Class: DateRange,
    guard: isDateRange,
    brand: IS_DATE_RANGE,
    value: dateRange('2026-11-01', '2026-11-07'),
  },
  {
    kind: 'datetimeRange',
    Class: DateTimeRange,
    guard: isDateTimeRange,
    brand: IS_DATE_TIME_RANGE,
    value: datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z', 'UTC'),
  },
  {
    kind: 'timeRange',
    Class: TimeRange,
    guard: isTimeRange,
    brand: IS_TIME_RANGE,
    value: timeRange('9:00am', '5:00pm'),
  },
];

// what a caller might hold in place of a value: every one of these is read by some factory
const rawInputs = [
  new Date(1794850200000),
  '2026-11-16',
  '9:30am',
  1794850200000,
  { year: 2026, month: 11, day: 16 },
  Temporal.PlainDate.from('2026-11-16'),
  Temporal.Duration.from('PT2H'),
];

describe('kindOf()', () => {
  it.each(kinds)("returns '$kind' for a $Class.name", ({ kind, value }) => {
    expect(kindOf(value)).toBe(kind);
  });

  it('names the kind of a value that another value produced', () => {
    const moment = datetime('2026-11-16T17:30:00Z', 'UTC');
    expect(kindOf(moment.date)).toBe('date');
    expect(kindOf(moment.time)).toBe('time');
    expect(kindOf(moment.yearMonth)).toBe('yearMonth');
    expect(kindOf(moment.monthDay)).toBe('monthDay');
    expect(kindOf(moment.until('2026-11-17T17:30:00Z'))).toBe('duration');
    expect(kindOf(moment.to('2026-11-17T17:30:00Z'))).toBe('datetimeRange');
    expect(kindOf(moment.date.to('2026-11-20'))).toBe('dateRange');
    expect(kindOf(moment.time.to('7:00pm'))).toBe('timeRange');
    expect(kindOf(moment.date.at('9:30am', 'UTC'))).toBe('datetime');
  });

  it('returns undefined for Dates, strings, numbers, plain objects and Temporal objects', () => {
    expect(rawInputs.map(kindOf)).toEqual(rawInputs.map(() => undefined));
  });

  it('returns undefined for null, undefined, booleans, arrays, functions and symbols without throwing', () => {
    const others = [null, undefined, true, [], () => {}, Symbol('date')];
    expect(others.map(kindOf)).toEqual(others.map(() => undefined));
  });
});

describe('type guards', () => {
  it.each(kinds)('$guard.name() accepts a $Class.name and rejects the other eight kinds', ({ kind, guard }) => {
    const accepted = kinds.filter((other) => guard(other.value)).map((other) => other.kind);
    expect(accepted).toEqual([kind]);
  });

  it.each(kinds)('$guard.name() rejects raw inputs, null and undefined', ({ guard }) => {
    expect([...rawInputs, null, undefined].filter(guard)).toEqual([]);
  });
});

describe('instanceof', () => {
  it.each(kinds)('is true of a $Class.name for its own class and for no other', ({ kind, value }) => {
    const matched = kinds.filter((other) => value instanceof other.Class).map((other) => other.kind);
    expect(matched).toEqual([kind]);
  });

  it.each(kinds)(
    'is false against $Class.name for raw inputs, primitives and null, and does not throw',
    ({ Class }) => {
      const matched = [...rawInputs, null, undefined, 'text', 5].filter((input) => input instanceof Class);
      expect(matched).toEqual([]);
    },
  );
});

describe('brand symbols', () => {
  it.each([
    ['IS_DATE_TIME', 'native-dates/DateTime', IS_DATE_TIME],
    ['IS_CALENDAR_DATE', 'native-dates/CalendarDate', IS_CALENDAR_DATE],
    ['IS_TIME', 'native-dates/Time', IS_TIME],
    ['IS_DURATION', 'native-dates/Duration', IS_DURATION],
    ['IS_YEAR_MONTH', 'native-dates/YearMonth', IS_YEAR_MONTH],
    ['IS_MONTH_DAY', 'native-dates/MonthDay', IS_MONTH_DAY],
    ['IS_RANGE', 'native-dates/Range', IS_RANGE],
    ['IS_DATE_RANGE', 'native-dates/DateRange', IS_DATE_RANGE],
    ['IS_DATE_TIME_RANGE', 'native-dates/DateTimeRange', IS_DATE_TIME_RANGE],
    ['IS_TIME_RANGE', 'native-dates/TimeRange', IS_TIME_RANGE],
  ])("%s is the global registry symbol Symbol.for('%s')", (name, key, brand) => {
    expect(brand).toBe(Symbol.for(key));
  });

  it.each(kinds)('a $Class.name carries the brand of its kind and of no other kind', ({ kind, value }) => {
    const carried = kinds.filter((other) => value[other.brand]).map((other) => other.kind);
    expect(carried).toEqual([kind]);
  });

  it('IS_RANGE marks all three kinds of range and nothing else', () => {
    const marked = kinds.filter(({ value }) => value[IS_RANGE]).map(({ kind }) => kind);
    expect(marked).toEqual(['dateRange', 'datetimeRange', 'timeRange']);
  });

  it('a brand reads as true on its value', () => {
    expect(datetime(1794850200000)[IS_DATE_TIME]).toBe(true);
    expect(timeRange('9:00am', '5:00pm')[IS_RANGE]).toBe(true);
  });
});
