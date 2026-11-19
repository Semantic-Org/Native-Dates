import {
  compare,
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  dayMonth,
  dayOfWeek,
  days,
  duration,
  earliest,
  hours,
  latest,
  monthDay,
  monthNames,
  months,
  monthYear,
  now,
  time,
  timeRange,
  today,
  yearMonth,
} from 'native-dates';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

const refusal = (call) => {
  try {
    call();
  }
  catch (error) {
    return error;
  }
};

// the shape every refusal shares: its class, its code, the input echoed as a string,
// a first line built from those two and a second line that explains
const expectRefusal = (call, ErrorClass, code) => {
  const error = refusal(call);
  expect(error).toBeInstanceOf(ErrorClass);
  expect(error.code).toBe(code);
  expect(error.at).toBeTypeOf('string');
  const [firstLine, explanation] = error.message.split('\n');
  expect(firstLine).toBe(`dates refused [${code}] ${error.at}`);
  expect(explanation).toBeTruthy();
};

describe('a refusal from native-dates', () => {
  it('is a standard RangeError carrying code and at for an impossible date', () => {
    const error = refusal(() => date('2026-02-30'));
    expect(error).toBeInstanceOf(RangeError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RangeError');
    expect(error.code).toBe('invalidDate');
    expect(error.at).toBe('2026-02-30');
  });

  it('is a TypeError, and not a RangeError, for a missing value', () => {
    const error = refusal(() => date(null));
    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(RangeError);
    expect(error.name).toBe('TypeError');
    expect(error.code).toBe('missingDate');
  });

  it('opens its message with one line made of the code and the input, then explains on a second line', () => {
    const error = refusal(() => date('2026-02-30'));
    const lines = error.message.split('\n');
    expect(lines[0]).toBe('dates refused [invalidDate] 2026-02-30');
    expect(lines).toHaveLength(2);
    expect(lines[1]).not.toBe('');
  });

  it('lets a caller turn one code into null and rethrow every other', () => {
    const parseTimestamp = (raw, zone) => {
      try {
        return datetime(raw, zone);
      }
      catch (error) {
        if (error.code === 'invalidDateTime') {
          return null;
        }
        throw error;
      }
    };
    expect(parseTimestamp('2026-11-16T17:30:00Z', 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(parseTimestamp('not-a-date', 'UTC')).toBeNull();
    expect(() => parseTimestamp('2026-11-16T17:30:00Z', 'Mars/Phobos')).toThrowError(
      expect.objectContaining({ code: 'unknownZone', at: 'Mars/Phobos' }),
    );
  });

  it.each([
    ['a string', () => date('2026-02-30'), '2026-02-30'],
    ['an unreadable string', () => datetime('not-a-date'), 'not-a-date'],
    ['null', () => time(null), 'null'],
    ['undefined', () => datetime(undefined), 'undefined'],
    ['a boolean', () => date(true), 'true'],
    ['a number', () => date(2026), '2026'],
    ['NaN', () => datetime(NaN), 'NaN'],
    ['an unknown unit', () => date('2026-11-16').plus(1, 'fortnight'), 'fortnight'],
    ['an unknown zone', () => datetime(0, 'Mars/Phobos'), 'Mars/Phobos'],
    ['an unknown locale', () => date('2026-11-16').locale('not a locale'), 'not a locale'],
  ])('echoes %s in at as a string', (label, call, at) => {
    expect(refusal(call).at).toBe(at);
  });

  it('echoes numbers and fields objects in at as text that names each of them', () => {
    expect(refusal(() => date(2026, 13, 1)).at).toBe('2026-13-1');
    expect(refusal(() => datetime({ year: 2026, month: 2, day: 30 })).at).toBe('{"year":2026,"month":2,"day":30}');
  });
});

describe('TypeError codes', () => {
  it.each([
    ['missingDateTime', 'datetime(null)', () => datetime(null)],
    ['missingDate', 'date(undefined)', () => date(undefined)],
    ['missingTime', 'time(null)', () => time(null)],
    ['missingYearMonth', 'yearMonth(null)', () => yearMonth(null)],
    ['missingYearMonth', 'monthYear(undefined)', () => monthYear(undefined)],
    ['missingMonthDay', 'monthDay(null)', () => monthDay(null)],
    ['missingMonthDay', 'dayMonth(undefined)', () => dayMonth(undefined)],
    ['invalidDateTime', 'datetime(true)', () => datetime(true)],
    ['invalidDate', 'date(2026)', () => date(2026)],
    ['invalidDate', 'date(true)', () => date(true)],
    ['invalidTime', 'time(true)', () => time(true)],
    ['invalidYearMonth', 'yearMonth(2026)', () => yearMonth(2026)],
    ['invalidMonthDay', 'monthDay(10)', () => monthDay(10)],
    ['invalidDuration', 'duration(null)', () => duration(null)],
    ['invalidDuration', 'duration(true)', () => duration(true)],
    ['invalidDuration', "duration('2h', 'minutes')", () => duration('2h', 'minutes')],
    ['invalidDuration', 'date.plus(null)', () => date('2026-11-16').plus(null)],
    [
      'unsupportedCalendar',
      'yearMonth(a Hebrew Temporal.PlainYearMonth)',
      () => yearMonth(Temporal.PlainYearMonth.from({ year: 2026, month: 11, calendar: 'hebrew' })),
    ],
    [
      'unsupportedCalendar',
      'monthDay(a Hebrew Temporal.PlainMonthDay)',
      () => monthDay(Temporal.PlainMonthDay.from({ monthCode: 'M01', day: 1, calendar: 'hebrew' })),
    ],
    ['invalidPoint', 'compare({}, {})', () => compare({}, {})],
    ['invalidPoint', 'earliest({})', () => earliest({})],
    ['conflictingKinds', 'compare(a date, a moment)', () => compare(date('2026-11-16'), datetime(0))],
    ['conflictingKinds', 'latest(a date, a time)', () => latest(date('2026-11-16'), time('9am'))],
    ['conflictingRanges', 'dateRange(a time range)', () => dateRange(timeRange('9am', '5pm'))],
  ])('%s is a TypeError from %s', (code, written, call) => {
    expectRefusal(call, TypeError, code);
  });
});

describe('RangeError codes for parsing and values', () => {
  it.each([
    ['invalidDateTime', "datetime('not-a-date')", () => datetime('not-a-date')],
    ['invalidDateTime', "datetime('2026-02-30T10:00')", () => datetime('2026-02-30T10:00')],
    [
      'invalidDateTime',
      'datetime({ year: 2026, month: 2, day: 30 })',
      () => datetime({ year: 2026, month: 2, day: 30 }),
    ],
    ['invalidDate', "date('2026-02-30')", () => date('2026-02-30')],
    ['invalidDate', "date('nope')", () => date('nope')],
    ['invalidDate', 'date(2026.5, 1, 1)', () => date(2026.5, 1, 1)],
    ['invalidDate', 'date(2026, 13, 1)', () => date(2026, 13, 1)],
    ['missingDay', 'date(2026, 11)', () => date(2026, 11)],
    ['invalidTime', "time('25:00')", () => time('25:00')],
    ['invalidTime', "time('13pm')", () => time('13pm')],
    ['invalidTime', 'time(24, 0)', () => time(24, 0)],
    ['invalidYearMonth', "yearMonth('2026-13')", () => yearMonth('2026-13')],
    ['invalidYearMonth', 'yearMonth(2026.5, 1)', () => yearMonth(2026.5, 1)],
    ['invalidMonthDay', "monthDay('13-40')", () => monthDay('13-40')],
    ['invalidMonthDay', 'monthDay(2, 30)', () => monthDay(2, 30)],
    ['invalidMonthDay', "monthDay('10-17').equals('10/17')", () => monthDay('10-17').equals('10/17')],
    ['invalidYear', "monthDay('02-29').in(2026.5)", () => monthDay('02-29').in(2026.5)],
    ['invalidDay', "yearMonth('2026-11').on(32)", () => yearMonth('2026-11').on(32)],
    ['invalidDuration', "duration('')", () => duration('')],
    ['invalidDuration', "duration('whenever')", () => duration('whenever')],
    ['invalidDuration', "duration('P1X')", () => duration('P1X')],
    ['invalidNumber', 'datetime(NaN)', () => datetime(NaN)],
    ['invalidNumber', 'datetime(new Date(NaN))', () => datetime(new Date(NaN))],
    ['invalidNumber', 'duration(Infinity)', () => duration(Infinity)],
    ['invalidNumber', 'hours(NaN)', () => hours(NaN)],
    ['conflictingSigns', "duration('1h -30m')", () => duration('1h -30m')],
    ['conflictingSigns', 'days(1).minus(hours(1))', () => days(1).minus(hours(1))],
    ['invalidFraction', 'months(1.5)', () => months(1.5)],
    ['invalidFraction', 'months(1).times(1.5)', () => months(1).times(1.5)],
  ])('%s is a RangeError from %s', (code, written, call) => {
    expectRefusal(call, RangeError, code);
  });
});

describe('RangeError codes for units, zones and formats', () => {
  it.each([
    ['unknownUnit', "date.plus(1, 'fortnight')", () => date('2026-11-16').plus(1, 'fortnight')],
    ['unknownUnit', "datetime.round('fortnight')", () => datetime(0).round('fortnight')],
    ['unknownUnit', "datetime.set('fortnight', 1)", () => datetime(0).set('fortnight', 1)],
    ['unknownUnit', "duration(2, 'fortnights')", () => duration(2, 'fortnights')],
    ['unknownDayOfWeek', "dayOfWeek('funday')", () => dayOfWeek('funday')],
    ['unknownDayOfWeek', "date.next('funday')", () => date('2026-11-16').next('funday')],
    ['unknownDayOfWeek', 'date.previous(0)', () => date('2026-11-16').previous(0)],
    ['unknownDayOfWeek', "configure({ weekStart: 'funday' })", () => configure({ weekStart: 'funday' })],
    [
      'unknownWidth',
      "configure({ weekdayNames: { lv: { fri: 'Pk' } } })",
      () => configure({ weekdayNames: { lv: { fri: 'Pk' } } }),
    ],
    ['unknownZone', "datetime(0, 'Mars/Phobos')", () => datetime(0, 'Mars/Phobos')],
    ['unknownZone', 'datetime(0, 5)', () => datetime(0, 5)],
    ['unknownZone', "datetime(0, '+25:00')", () => datetime(0, '+25:00')],
    ['unknownZone', "datetime.in('Mars/Phobos')", () => datetime(0).in('Mars/Phobos')],
    ['unknownZone', "now('Mars/Phobos')", () => now('Mars/Phobos')],
    ['unknownZone', "configure({ zone: 'Mars/Phobos' })", () => configure({ zone: 'Mars/Phobos' })],
    ['unknownLocale', "date.locale('not a locale')", () => date('2026-11-16').locale('not a locale')],
    ['unknownLocale', "date(input, { locale: 'not a locale' })", () => date('2026-11-16', { locale: 'not a locale' })],
    ['unknownLocale', "date.format('short', 'not a locale')", () => date('2026-11-16').format('short', 'not a locale')],
    ['unknownLocale', "monthNames('long', 'not a locale')", () => monthNames('long', 'not a locale')],
    ['unknownLocale', "configure({ locale: 'not a locale' })", () => configure({ locale: 'not a locale' })],
    ['unknownFormat', 'date.format(5)', () => date('2026-11-16').format(5)],
    ['unknownFormat', "duration.format('medium')", () => hours(1).format('medium')],
    ['unsupportedToken', "date.format('HH')", () => date('2026-11-16').format('HH')],
    ['unsupportedToken', "time.format('YYYY')", () => time('9am').format('YYYY')],
    ['unknownKind', "time.as('date')", () => time('9am').as('date')],
  ])('%s is a RangeError from %s', (code, written, call) => {
    expectRefusal(call, RangeError, code);
  });
});

describe('RangeError codes for arithmetic, measurement and ranges', () => {
  it.each([
    ['unsupportedUnit', "date.plus(1, 'hour')", () => date('2026-11-16').plus(1, 'hour')],
    ['unsupportedUnit', "time.plus(1, 'day')", () => time('9am').plus(1, 'day')],
    ['unsupportedUnit', "yearMonth.plus(1, 'day')", () => yearMonth('2026-11').plus(1, 'day')],
    ['cannotAdd', "date.plus(999999, 'years')", () => date('2026-11-16').plus(999999, 'years')],
    ['cannotAdd', "date.add(999999, 'years')", () => date('2026-11-16').add(999999, 'years')],
    ['cannotSubtract', "date.minus(999999, 'years')", () => date('2026-11-16').minus(999999, 'years')],
    ['cannotSubtract', "datetime.subtract(999999, 'years')", () => datetime(0).subtract(999999, 'years')],
    ['cannotSet', "date('2026-11-16').set('day', 31)", () => date('2026-11-16').set('day', 31)],
    ['cannotSet', "time.set('hour', 1.5)", () => time('9am').set('hour', 1.5)],
    ['cannotRound', "datetime.round(7, 'minutes')", () => datetime(0).round(7, 'minutes')],
    ['cannotRound', "time.floor(7, 'minutes')", () => time('9am').floor(7, 'minutes')],
    ['cannotRound', "time.ceil(7, 'minutes')", () => time('9am').ceil(7, 'minutes')],
    ['cannotRound', "time.startOf('day')", () => time('9am').startOf('day')],
    ['missingAnchor', "months(1).total('days')", () => months(1).total('days')],
    ['missingAnchor', "months(1).balance('day')", () => months(1).balance('day')],
    ['missingAnchor', 'months(1).compare(days(30))', () => months(1).compare(days(30))],
    ['missingPoints', 'earliest()', () => earliest()],
    ['missingPoints', 'latest([])', () => latest([])],
    ['unsupportedComparison', 'unary plus on a date', () => +date('2026-11-16')],
    ['unsupportedComparison', 'a time < a time', () => time('9am') < time('10am')],
    ['unsupportedComparison', 'yearMonth.valueOf()', () => yearMonth('2026-11').valueOf()],
    ['unsupportedComparison', 'a month-day - 1', () => monthDay('10-17') - 1],
    ['unsupportedComparison', 'a range > 1', () => dateRange('2026-11-01', '2026-11-07') > 1],
    ['invalidRange', 'dateRange(a later day, an earlier day)', () => dateRange('2026-11-07', '2026-11-01')],
    [
      'invalidRange',
      'datetimeRange(a later moment, an earlier moment)',
      () => datetimeRange('2026-11-16T10:00Z', '2026-11-16T09:00Z'),
    ],
    ['invalidRange', 'date.to(an earlier day)', () => date('2026-11-07').to('2026-11-01')],
    ['invalidStep', "range.points('0 days')", () => dateRange('2026-11-01', '2026-11-07').points('0 days')],
    ['invalidStep', "range.split(-1, 'day')", () => dateRange('2026-11-01', '2026-11-07').split(-1, 'day')],
    [
      'unsupportedIntersection',
      'two overnight time ranges that overlap twice',
      () => timeRange('22:00', '06:00').intersection(timeRange('05:00', '23:00')),
    ],
    ['unsupportedZone', "timeRange.in('UTC')", () => timeRange('9am', '5pm').in('UTC')],
  ])('%s is a RangeError from %s', (code, written, call) => {
    expectRefusal(call, RangeError, code);
  });
});

describe('RangeError codes for plugins that were not imported', () => {
  it.each([
    ['missingPlugin', "date('x', { loose: true })", () => date('x', { loose: true })],
    ['missingPlugin', "date('07.09.2026', { dayFirst: true })", () => date('07.09.2026', { dayFirst: true })],
    ['missingPlugin', 'configure({ dayFirst: true })', () => configure({ dayFirst: true })],
    [
      'missingPlugin',
      "configure({ zoneAliases: { hq: 'Europe/Berlin' } })",
      () => configure({ zoneAliases: { hq: 'Europe/Berlin' } }),
    ],
  ])('%s is a RangeError from %s', (code, written, call) => {
    expectRefusal(call, RangeError, code);
  });
});

describe('junk passed where a value was expected', () => {
  const junk = [
    undefined,
    null,
    true,
    false,
    NaN,
    Infinity,
    -1,
    1.5,
    '',
    ' ',
    'garbage',
    '2026-02-30',
    '25:00',
    {},
    [],
    [1, 2],
    () => {},
    new Date(NaN),
    new Map(),
    { year: 2026 },
    { hours: 'x' },
    { zone: 5 },
    { locale: 'not a locale' },
    datetime(0, 'UTC'),
    date('2026-11-16'),
    time('09:00'),
    hours(1),
    yearMonth('2026-11'),
    monthDay('10-17'),
    dateRange('2026-11-01', '2026-11-07'),
  ];

  const temporalObjects = [
    Temporal.Instant.fromEpochMilliseconds(0),
    Temporal.PlainDate.from('2026-11-16'),
    Temporal.PlainTime.from('09:00'),
    Temporal.Duration.from('PT1H'),
  ];

  // a call may answer junk with a value, and when it refuses the refusal must be one of ours
  const leaksFrom = (calls, inputs) => {
    const leaks = [];
    for (const [written, call] of Object.entries(calls)) {
      for (const input of inputs) {
        const error = refusal(() => call(input));
        const coded = error === undefined
          || ((error instanceof RangeError || error instanceof TypeError)
            && typeof error.code === 'string' && typeof error.at === 'string');
        if (!coded) {
          leaks.push(`${written} given ${inspect(input)} threw ${error}`);
        }
      }
    }
    return leaks;
  };

  it('is answered by every factory and helper with a value or a coded refusal, never a bare engine error', () => {
    const leaks = leaksFrom({
      'datetime(x)': (x) => datetime(x),
      'datetime(ok, x)': (x) => datetime('2026-11-16T09:30', x),
      'date(x)': (x) => date(x),
      'date(ok, x)': (x) => date('2026-11-16', x),
      'date(2026, x, 1)': (x) => date(2026, x, 1),
      'time(x)': (x) => time(x),
      'time(9, x)': (x) => time(9, x),
      'duration(x)': (x) => duration(x),
      'duration(2, x)': (x) => duration(2, x),
      'hours(x)': (x) => hours(x),
      'months(x)': (x) => months(x),
      'yearMonth(x)': (x) => yearMonth(x),
      'monthYear(x)': (x) => monthYear(x),
      'monthDay(x)': (x) => monthDay(x),
      'dayMonth(x)': (x) => dayMonth(x),
      'dateRange(x)': (x) => dateRange(x),
      'dateRange(ok, x)': (x) => dateRange('2026-11-01', x),
      'datetimeRange(x)': (x) => datetimeRange(x),
      'timeRange(x)': (x) => timeRange(x),
      'timeRange(ok, x)': (x) => timeRange('9am', x),
      'now(x)': (x) => now(x),
      'today(x)': (x) => today(x),
      'compare(x, x)': (x) => compare(x, x),
      'compare(moment, x)': (x) => compare(datetime(0, 'UTC'), x),
      'earliest(x)': (x) => earliest(x),
      'earliest(date, x)': (x) => earliest(date('2026-11-16'), x),
      'latest(x, x)': (x) => latest(x, x),
      'dayOfWeek(x)': (x) => dayOfWeek(x),
    }, [...junk, ...temporalObjects]);
    expect(leaks).toEqual([]);
  });

  it('is answered by the methods of every kind of value with a value or a coded refusal', () => {
    const moment = datetime('2026-11-16T09:30', 'UTC');
    const day = date('2026-11-16');
    const clock = time('09:30');
    const span = hours(2);
    const month = yearMonth('2026-11');
    const birthday = monthDay('10-17');
    const week = dateRange('2026-11-01', '2026-11-07');
    const hour = datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z', 'UTC');
    const shift = timeRange('9am', '5pm');
    const leaks = leaksFrom({
      'datetime.plus(x)': (x) => moment.plus(x),
      'datetime.plus(1, x)': (x) => moment.plus(1, x),
      'datetime.minus(x, days)': (x) => moment.minus(x, 'days'),
      'datetime.set(x)': (x) => moment.set(x),
      'datetime.set(hour, x)': (x) => moment.set('hour', x),
      'datetime.in(x)': (x) => moment.in(x),
      'datetime.at(x)': (x) => moment.at(x),
      'datetime.startOf(x)': (x) => moment.startOf(x),
      'datetime.endOf(x)': (x) => moment.endOf(x),
      'datetime.round(x)': (x) => moment.round(x),
      'datetime.next(x)': (x) => moment.next(x),
      'datetime.equals(x)': (x) => moment.equals(x),
      'datetime.isBefore(x)': (x) => moment.isBefore(x),
      'datetime.isSame(moment, x)': (x) => moment.isSame(moment, x),
      'datetime.until(x)': (x) => moment.until(x),
      'datetime.until(moment, x)': (x) => moment.until(moment, x),
      'datetime.to(x)': (x) => moment.to(x),
      'datetime.range(x)': (x) => moment.range(x),
      'datetime.from(x)': (x) => moment.from(x),
      'datetime.locale(x)': (x) => moment.locale(x),
      'datetime.as(x)': (x) => moment.as(x),
      'date.plus(x)': (x) => day.plus(x),
      'date.minus(1, x)': (x) => day.minus(1, x),
      'date.set(x)': (x) => day.set(x),
      'date.at(x)': (x) => day.at(x),
      'date.at(9am, x)': (x) => day.at('9am', x),
      'date.startOf(x)': (x) => day.startOf(x),
      'date.startOf(week, x)': (x) => day.startOf('week', x),
      'date.next(x)': (x) => day.next(x),
      'date.equals(x)': (x) => day.equals(x),
      'date.until(x)': (x) => day.until(x),
      'date.to(x)': (x) => day.to(x),
      'date.from(x)': (x) => day.from(x),
      'date.toJSDate(x)': (x) => day.toJSDate(x),
      'date.as(datetime, x)': (x) => day.as('datetime', x),
      'time.plus(x)': (x) => clock.plus(x),
      'time.set(x)': (x) => clock.set(x),
      'time.on(x)': (x) => clock.on(x),
      'time.equals(x)': (x) => clock.equals(x),
      'time.until(x)': (x) => clock.until(x),
      'time.to(x)': (x) => clock.to(x),
      'time.round(x)': (x) => clock.round(x),
      'time.startOf(x)': (x) => clock.startOf(x),
      'duration.plus(x)': (x) => span.plus(x),
      'duration.times(x)': (x) => span.times(x),
      'duration.total(x)': (x) => span.total(x),
      'duration.balance(x)': (x) => span.balance(x),
      'duration.round(x)': (x) => span.round(x),
      'duration.compare(x)': (x) => span.compare(x),
      'yearMonth.plus(x)': (x) => month.plus(x),
      'yearMonth.set(x)': (x) => month.set(x),
      'yearMonth.on(x)': (x) => month.on(x),
      'yearMonth.compare(x)': (x) => month.compare(x),
      'yearMonth.contains(x)': (x) => month.contains(x),
      'yearMonth.until(x)': (x) => month.until(x),
      'monthDay.in(x)': (x) => birthday.in(x),
      'monthDay.next(x)': (x) => birthday.next(x),
      'monthDay.equals(x)': (x) => birthday.equals(x),
      'monthDay.fallsOn(x)': (x) => birthday.fallsOn(x),
      'dateRange.contains(x)': (x) => week.contains(x),
      'dateRange.overlaps(x)': (x) => week.overlaps(x),
      'dateRange.intersection(x)': (x) => week.intersection(x),
      'dateRange.equals(x)': (x) => week.equals(x),
      'dateRange.in(x)': (x) => week.in(x),
      'datetimeRange.contains(x)': (x) => hour.contains(x),
      'datetimeRange.in(x)': (x) => hour.in(x),
      'timeRange.contains(x)': (x) => shift.contains(x),
      'timeRange.overlaps(x)': (x) => shift.overlaps(x),
    }, junk);
    expect(leaks).toEqual([]);
  });

  it.todo('refuses an epoch number beyond the supported range, such as nanoseconds since 1970, with a code');

  it.todo('reads a units object that has no prototype in plus() and minus(), as duration() reads it');
});

describe('a refusal in a Node process started with NODE_ENV', () => {
  const script = `
    import { date } from 'native-dates';
    const refusals = [() => date(null), () => date('2026-02-30')].map((call) => {
      try {
        call();
      }
      catch (error) {
        return { name: error.name, code: error.code, at: error.at, message: error.message };
      }
    });
    console.log(JSON.stringify(refusals));
  `;

  const refusalsUnder = (nodeEnv) => {
    const { NODE_ENV: inherited, ...env } = process.env;
    const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: nodeEnv === undefined ? env : { ...env, NODE_ENV: nodeEnv },
      encoding: 'utf8',
    });
    return JSON.parse(output);
  };

  let production;
  let unset;

  // each read starts a Node process, slow when the machine is busy
  beforeAll(() => {
    production = refusalsUnder('production');
    unset = refusalsUnder(undefined);
  }, 30_000);

  it('set to production drops the explanation and keeps the class, the code, at and the first line', () => {
    const [missing, impossible] = production;
    expect(missing).toEqual({
      name: 'TypeError',
      code: 'missingDate',
      at: 'null',
      message: 'dates refused [missingDate] null',
    });
    expect(impossible).toMatchObject({ name: 'RangeError', code: 'invalidDate', at: '2026-02-30' });
    expect(impossible.message.split('\n')[0]).toBe('dates refused [invalidDate] 2026-02-30');
  });

  it('left unset explains, in words the production message no longer holds', () => {
    const [missing, impossible] = unset;
    expect(missing.message.split('\n')).toHaveLength(2);
    expect(impossible.message.split('\n')).toHaveLength(2);
    expect(production[1].message).not.toContain(impossible.message.split('\n')[1]);
  });
});
