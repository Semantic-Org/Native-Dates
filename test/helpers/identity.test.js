import { build } from 'esbuild';
import * as nativeDates from 'native-dates';
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
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

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

const crossKinds = kinds.map(({ Class, guard, kind }) => [Class.name, guard.name, kind]);

const rawInputs = [
  new Date(1794850200000),
  '2026-11-16',
  '9:30am',
  1794850200000,
  { year: 2026, month: 11, day: 16 },
  Temporal.PlainDate.from('2026-11-16'),
  Temporal.Duration.from('PT2H'),
];

const valuesFrom = (copy) => ({
  DateTime: copy.datetime('2026-11-16T10:30', 'UTC'),
  CalendarDate: copy.date('2026-11-20'),
  Time: copy.time('10:30'),
  Duration: copy.hours(2),
  YearMonth: copy.yearMonth('2026-12'),
  MonthDay: copy.monthDay('10-18'),
  DateRange: copy.dateRange('2026-11-05', '2026-11-10'),
  DateTimeRange: copy.datetimeRange('2026-11-16T09:30Z', '2026-11-16T11:00Z', 'UTC'),
  TimeRange: copy.timeRange('1:00pm', '6:00pm'),
});

let secondCopy;
let otherRealm;
let otherRealmCopy;

beforeAll(async () => {
  const bundle = await build({
    bundle: true,
    format: 'iife',
    globalName: 'nativeDates',
    write: false,
    logLevel: 'silent',
    stdin: { contents: "export * from 'native-dates';", resolveDir: fileURLToPath(new URL('../..', import.meta.url)) },
  });
  const code = `(() => { ${bundle.outputFiles[0].text}\nreturn nativeDates; })()`;
  secondCopy = vm.runInThisContext(code);
  otherRealm = vm.createContext({});
  otherRealmCopy = vm.runInContext(code, otherRealm);
}, 30_000);

describe('kindOf()', () => {
  it.each(kinds)("returns '$kind' for a $Class.name instance", ({ kind, value }) => {
    expect(kindOf(value)).toBe(kind);
  });

  it('returns the expected kind for values derived via getters and methods', () => {
    const standup = datetime('2026-11-16T17:30:00Z', 'UTC');
    expect(kindOf(standup.date)).toBe('date');
    expect(kindOf(standup.time)).toBe('time');
    expect(kindOf(standup.yearMonth)).toBe('yearMonth');
    expect(kindOf(standup.monthDay)).toBe('monthDay');
    expect(kindOf(standup.until('2026-11-17T17:30:00Z'))).toBe('duration');
    expect(kindOf(standup.to('2026-11-17T17:30:00Z'))).toBe('datetimeRange');
    expect(kindOf(standup.date.to('2026-11-20'))).toBe('dateRange');
    expect(kindOf(standup.time.to('7:00pm'))).toBe('timeRange');
    expect(kindOf(standup.date.at('9:30am', 'UTC'))).toBe('datetime');
  });

  it('returns undefined for Date, string, number, plain object, and Temporal inputs', () => {
    expect(rawInputs.map(kindOf)).toEqual(rawInputs.map(() => undefined));
  });

  it('returns undefined for null, undefined, booleans, arrays, functions, and symbols without throwing', () => {
    const others = [null, undefined, true, [], () => {}, Symbol('date')];
    expect(others.map(kindOf)).toEqual(others.map(() => undefined));
  });
});

describe('type guards (isDateTime, isCalendarDate, ...)', () => {
  it.each(kinds)('accepts $Class.name in $guard.name() and rejects the other eight kinds', ({ kind, guard }) => {
    const accepted = kinds.filter((other) => guard(other.value)).map((other) => other.kind);
    expect(accepted).toEqual([kind]);
  });

  it.each(kinds)('rejects raw inputs, null, and undefined in $guard.name()', ({ guard }) => {
    expect([...rawInputs, null, undefined].filter(guard)).toEqual([]);
  });
});

describe('brand symbols and instanceof', () => {
  it.each(kinds)('matches $Class.name via instanceof only against its own class', ({ kind, value }) => {
    const matched = kinds.filter((other) => value instanceof other.Class).map((other) => other.kind);
    expect(matched).toEqual([kind]);
  });

  it.each(kinds)(
    'returns false from instanceof $Class.name for raw inputs, primitives, and nullish values',
    ({ Class }) => {
      const matched = [...rawInputs, null, undefined, 'text', 5].filter((input) => input instanceof Class);
      expect(matched).toEqual([]);
    },
  );

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
  ])("registers %s in the global symbol registry as Symbol.for('%s')", (name, key, brand) => {
    expect(brand).toBe(Symbol.for(key));
  });

  it.each(kinds)('exposes only the matching kind brand symbol on $Class.name', ({ kind, value }) => {
    const carried = kinds.filter((other) => value[other.brand]).map((other) => other.kind);
    expect(carried).toEqual([kind]);
  });

  it('exposes IS_RANGE on all three Range classes and on no other kind', () => {
    const marked = kinds.filter(({ value }) => value[IS_RANGE]).map(({ kind }) => kind);
    expect(marked).toEqual(['dateRange', 'datetimeRange', 'timeRange']);
  });

  it('evaluates brand symbol getters to true on matching instances', () => {
    expect(datetime(1794850200000)[IS_DATE_TIME]).toBe(true);
    expect(timeRange('9:00am', '5:00pm')[IS_RANGE]).toBe(true);
  });
});

describe('cross-bundle instance interoperability', () => {
  it('creates distinct class constructors while sharing global Symbol.for brand symbols', () => {
    expect(secondCopy.DateTime).not.toBe(nativeDates.DateTime);
    expect(secondCopy.IS_DATE_TIME).toBe(nativeDates.IS_DATE_TIME);
  });

  it.each(crossKinds)('recognizes a second-bundle %s via %s(), instanceof, and kindOf()', (name, guard, kind) => {
    const theirs = valuesFrom(secondCopy)[name];
    expect(nativeDates[guard](theirs)).toBe(true);
    expect(theirs instanceof nativeDates[name]).toBe(true);
    expect(nativeDates.kindOf(theirs)).toBe(kind);
  });

  it.each(crossKinds)(
    'recognizes a primary-bundle %s inside the second bundle via %s(), instanceof, and kindOf()',
    (name, guard, kind) => {
      const mine = valuesFrom(nativeDates)[name];
      expect(secondCopy[guard](mine)).toBe(true);
      expect(mine instanceof secondCopy[name]).toBe(true);
      expect(secondCopy.kindOf(mine)).toBe(kind);
    },
  );

  it('orders cross-bundle instances in compare(), earliest(), and latest()', () => {
    const mine = nativeDates.date('2026-11-16');
    const theirs = secondCopy.date('2026-11-20');
    expect(nativeDates.compare(mine, theirs)).toBe(-1);
    expect(nativeDates.compare(theirs, mine)).toBe(1);
    expect(nativeDates.earliest(theirs, mine)).toBe(mine);
    expect(nativeDates.latest(mine, theirs)).toBe(theirs);
    expect(nativeDates.compare(nativeDates.hours(1), secondCopy.hours(2))).toBe(-1);
    const firstWeek = nativeDates.dateRange('2026-11-01', '2026-11-07');
    expect(nativeDates.compare(firstWeek, secondCopy.dateRange('2026-11-05', '2026-11-10'))).toBe(-1);
  });

  it('accepts cross-bundle instances across comparison, arithmetic, and conversion methods', () => {
    const theirs = valuesFrom(secondCopy);
    const morning = nativeDates.datetime('2026-11-16T09:30', 'UTC');
    const day = nativeDates.date('2026-11-16');
    expect(morning.isBefore(theirs.DateTime)).toBe(true);
    expect(morning.until(theirs.DateTime).toString()).toBe('PT1H');
    expect(morning.plus(theirs.Duration).toString()).toBe('2026-11-16T11:30:00.000Z');
    expect(day.equals(theirs.CalendarDate)).toBe(false);
    expect(day.isSame(theirs.CalendarDate, 'month')).toBe(true);
    expect(day.until(theirs.CalendarDate).days).toBe(4);
    expect(day.at(theirs.Time, 'UTC').toString()).toBe('2026-11-16T10:30:00.000Z');
    expect(nativeDates.time('09:30').on(theirs.CalendarDate, 'UTC').toString()).toBe('2026-11-20T09:30:00.000Z');
    expect(nativeDates.yearMonth('2026-11').until(theirs.YearMonth).months).toBe(1);
    expect(nativeDates.monthDay('10-18').equals(theirs.MonthDay)).toBe(true);
    expect(day.next(theirs.MonthDay).toString()).toBe('2027-10-18');
  });

  it('accepts cross-bundle points and ranges in contains(), overlaps(), intersection(), to(), and range factories', () => {
    const theirs = valuesFrom(secondCopy);
    const week = nativeDates.dateRange('2026-11-01', '2026-11-07');
    expect(week.contains(secondCopy.date('2026-11-05'))).toBe(true);
    expect(week.overlaps(theirs.DateRange)).toBe(true);
    expect(week.intersection(theirs.DateRange).toString()).toBe('2026-11-05/2026-11-07');
    expect(nativeDates.date('2026-11-16').to(theirs.CalendarDate).duration.days).toBe(5);
    expect(nativeDates.dateRange(theirs.CalendarDate, secondCopy.date('2026-11-25')).duration.days).toBe(6);
    expect(nativeDates.timeRange('9:00am', '5:00pm').intersection(theirs.TimeRange).toString()).toBe(
      '13:00:00/17:00:00',
    );
  });

  it('returns cross-bundle instances as-is from factories unless options are passed', () => {
    const theirs = valuesFrom(secondCopy);
    expect(nativeDates.date(theirs.CalendarDate)).toBe(theirs.CalendarDate);
    expect(nativeDates.datetime(theirs.DateTime)).toBe(theirs.DateTime);
    expect(nativeDates.duration(theirs.Duration)).toBe(theirs.Duration);
    expect(nativeDates.date(theirs.CalendarDate, { locale: 'de' }).plus(1, 'day').toString()).toBe('2026-11-21');
    expect(nativeDates.datetime(theirs.DateTime, 'Asia/Tokyo').plus(1, 'day').toString()).toBe(
      '2026-11-17T10:30:00.000Z',
    );
    expect(new nativeDates.Time(theirs.Time).plus(1, 'hour').toString()).toBe('11:30:00');
  });
});

describe('cross-realm vm.Context interoperability', () => {
  it('uses distinct Temporal and Object intrinsics while sharing global Symbol.for brand symbols', () => {
    expect(vm.runInContext('Temporal', otherRealm)).not.toBe(Temporal);
    expect(vm.runInContext('Object', otherRealm)).not.toBe(Object);
    expect(otherRealmCopy.IS_DATE_TIME).toBe(nativeDates.IS_DATE_TIME);
  });

  it.each(crossKinds)('recognizes a cross-realm %s via %s(), instanceof, and kindOf()', (name, guard, kind) => {
    const theirs = valuesFrom(otherRealmCopy)[name];
    expect(nativeDates[guard](theirs)).toBe(true);
    expect(theirs instanceof nativeDates[name]).toBe(true);
    expect(nativeDates.kindOf(theirs)).toBe(kind);
  });

  it('orders cross-realm instances in compare(), earliest(), and latest()', () => {
    const mine = nativeDates.date('2026-11-16');
    const theirs = otherRealmCopy.date('2026-11-20');
    expect(nativeDates.compare(mine, theirs)).toBe(-1);
    expect(nativeDates.compare(theirs, mine)).toBe(1);
    expect(nativeDates.earliest(theirs, mine)).toBe(mine);
    expect(nativeDates.latest(mine, theirs)).toBe(theirs);
    expect(nativeDates.compare(nativeDates.datetime(0), otherRealmCopy.datetime(1))).toBe(-1);
  });

  it('accepts a cross-realm Date instance in datetime()', () => {
    const theirs = vm.runInContext('new Date(1794850200000)', otherRealm);
    expect(theirs instanceof Date).toBe(false);
    expect(nativeDates.datetime(theirs, 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it.todo('constructs a DateRange from cross-realm CalendarDate instances and computes its duration');

  it.todo('accepts cross-realm Temporal instances and plain field objects in factories');
});
