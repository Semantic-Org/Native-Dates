import { build } from 'esbuild';
import {
  compare,
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  dayMonth,
  dayOfWeek,
  duration,
  earliest,
  hours,
  latest,
  monthDay,
  months,
  monthYear,
  now,
  time,
  timeRange,
  today,
  yearMonth,
} from 'native-dates';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

const catchError = (call) => {
  try {
    call();
  }
  catch (error) {
    return error;
  }
};

const expectCodedError = (call, ErrorClass, code) => {
  const error = catchError(call);
  expect(error).toBeInstanceOf(ErrorClass);
  expect(error.code).toBe(code);
  expect(error.at).toBeTypeOf('string');
  const [firstLine, explanation] = error.message.split('\n');
  expect(firstLine).toBe(`dates refused [${code}] ${error.at}`);
  expect(explanation).toBeTruthy();
};

describe('coded error shape (RangeError and TypeError)', () => {
  it('throws a RangeError with .code and .at for an out-of-range calendar date', () => {
    const error = catchError(() => date('2026-02-30'));
    expect(error).toBeInstanceOf(RangeError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RangeError');
    expect(error.code).toBe('invalidDate');
    expect(error.at).toBe('2026-02-30');
  });

  it('throws a TypeError rather than RangeError for nullish input', () => {
    const error = catchError(() => date(null));
    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(RangeError);
    expect(error.name).toBe('TypeError');
    expect(error.code).toBe('missingDate');
  });

  it('formats error.message with "dates refused [code] at" on line one and an explanation on line two', () => {
    const error = catchError(() => date('2026-02-30'));
    const lines = error.message.split('\n');
    expect(lines[0]).toBe('dates refused [invalidDate] 2026-02-30');
    expect(lines).toHaveLength(2);
    expect(lines[1]).not.toBe('');
  });

  it('allows catching a specific error.code while rethrowing others', () => {
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
    ['an unparseable string', () => datetime('not-a-date'), 'not-a-date'],
    ['null', () => time(null), 'null'],
    ['undefined', () => datetime(undefined), 'undefined'],
    ['a boolean', () => date(true), 'true'],
    ['a number', () => date(2026), '2026'],
    ['NaN', () => datetime(NaN), 'NaN'],
    ['an unknown unit', () => date('2026-11-16').plus(1, 'fortnight'), 'fortnight'],
    ['an unknown zone', () => datetime(0, 'Mars/Phobos'), 'Mars/Phobos'],
    ['an unknown locale', () => date('2026-11-16').locale('not a locale'), 'not a locale'],
  ])('formats %s into error.at as a string', (label, call, at) => {
    expect(catchError(call).at).toBe(at);
  });

  it('formats multi-argument numbers and plain field objects into error.at', () => {
    expect(catchError(() => date(2026, 13, 1)).at).toBe('2026-13-1');
    expect(catchError(() => datetime({ year: 2026, month: 2, day: 30 })).at).toBe('{"year":2026,"month":2,"day":30}');
  });

  it.each([
    ['TypeError', TypeError, 'missingDateTime', 'datetime(null)', () => datetime(null)],
    ['TypeError', TypeError, 'missingDate', 'date(undefined)', () => date(undefined)],
    ['TypeError', TypeError, 'invalidDate', 'date(true)', () => date(true)],
    ['TypeError', TypeError, 'invalidDuration', 'duration(null)', () => duration(null)],
    [
      'TypeError',
      TypeError,
      'unsupportedCalendar',
      'yearMonth(non-ISO Temporal.PlainYearMonth)',
      () => yearMonth(Temporal.PlainYearMonth.from({ year: 2026, month: 11, calendar: 'hebrew' })),
    ],
    [
      'TypeError',
      TypeError,
      'conflictingKinds',
      'compare(date, datetime)',
      () => compare(date('2026-11-16'), datetime(0)),
    ],
    ['RangeError', RangeError, 'invalidDateTime', "datetime('not-a-date')", () => datetime('not-a-date')],
    ['RangeError', RangeError, 'invalidNumber', 'datetime(NaN)', () => datetime(NaN)],
    [
      'RangeError',
      RangeError,
      'invalidRange',
      "dateRange('2026-11-07', '2026-11-01')",
      () => dateRange('2026-11-07', '2026-11-01'),
    ],
    ['RangeError', RangeError, 'unknownZone', "datetime(0, 'Mars/Phobos')", () => datetime(0, 'Mars/Phobos')],
    [
      'RangeError',
      RangeError,
      'unknownUnit',
      "date.plus(1, 'fortnight')",
      () => date('2026-11-16').plus(1, 'fortnight'),
    ],
    ['RangeError', RangeError, 'missingAnchor', "months(1).total('days')", () => months(1).total('days')],
    ['RangeError', RangeError, 'unsupportedComparison', '+date', () => +date('2026-11-16')],
    ['RangeError', RangeError, 'missingPlugin', 'configure({ dayFirst: true })', () => configure({ dayFirst: true })],
  ])('throws %s [%s] for %s', (errorName, ErrorClass, code, expr, call) => {
    expectCodedError(call, ErrorClass, code);
  });
});

describe('invalid input fuzzing across factories and methods', () => {
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

  const leaksFrom = (calls, inputs) => {
    const leaks = [];
    for (const [written, call] of Object.entries(calls)) {
      for (const input of inputs) {
        const error = catchError(() => call(input));
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

  it('returns a value or throws a coded error across all factories and helpers without leaking engine errors', () => {
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
      'compare(datetime, x)': (x) => compare(datetime(0, 'UTC'), x),
      'earliest(x)': (x) => earliest(x),
      'earliest(date, x)': (x) => earliest(date('2026-11-16'), x),
      'latest(x, x)': (x) => latest(x, x),
      'dayOfWeek(x)': (x) => dayOfWeek(x),
    }, [...junk, ...temporalObjects]);
    expect(leaks).toEqual([]);
  });

  it('returns a value or throws a coded error across instance methods of all nine classes', () => {
    const point = datetime('2026-11-16T09:30', 'UTC');
    const day = date('2026-11-16');
    const clock = time('09:30');
    const span = hours(2);
    const month = yearMonth('2026-11');
    const birthday = monthDay('10-17');
    const week = dateRange('2026-11-01', '2026-11-07');
    const hour = datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:00Z', 'UTC');
    const shift = timeRange('9am', '5pm');
    const leaks = leaksFrom({
      'datetime.plus(x)': (x) => point.plus(x),
      'datetime.plus(1, x)': (x) => point.plus(1, x),
      'datetime.minus(x, days)': (x) => point.minus(x, 'days'),
      'datetime.set(x)': (x) => point.set(x),
      'datetime.set(hour, x)': (x) => point.set('hour', x),
      'datetime.in(x)': (x) => point.in(x),
      'datetime.at(x)': (x) => point.at(x),
      'datetime.startOf(x)': (x) => point.startOf(x),
      'datetime.endOf(x)': (x) => point.endOf(x),
      'datetime.round(x)': (x) => point.round(x),
      'datetime.next(x)': (x) => point.next(x),
      'datetime.startOfNext(x)': (x) => point.startOfNext(x),
      'datetime.startOfNext(week, x)': (x) => point.startOfNext('week', x),
      'datetime.startOfPrevious(x)': (x) => point.startOfPrevious(x),
      'datetime.startOfPrevious(week, x)': (x) => point.startOfPrevious('week', x),
      'datetime.equals(x)': (x) => point.equals(x),
      'datetime.isBefore(x)': (x) => point.isBefore(x),
      'datetime.isSame(point, x)': (x) => point.isSame(point, x),
      'datetime.until(x)': (x) => point.until(x),
      'datetime.until(point, x)': (x) => point.until(point, x),
      'datetime.to(x)': (x) => point.to(x),
      'datetime.range(x)': (x) => point.range(x),
      'datetime.from(x)': (x) => point.from(x),
      'datetime.locale(x)': (x) => point.locale(x),
      'datetime.as(x)': (x) => point.as(x),
      'date.plus(x)': (x) => day.plus(x),
      'date.minus(1, x)': (x) => day.minus(1, x),
      'date.set(x)': (x) => day.set(x),
      'date.at(x)': (x) => day.at(x),
      'date.at(9am, x)': (x) => day.at('9am', x),
      'date.startOf(x)': (x) => day.startOf(x),
      'date.startOf(week, x)': (x) => day.startOf('week', x),
      'date.next(x)': (x) => day.next(x),
      'date.startOfNext(x)': (x) => day.startOfNext(x),
      'date.startOfNext(week, x)': (x) => day.startOfNext('week', x),
      'date.startOfPrevious(x)': (x) => day.startOfPrevious(x),
      'date.startOfPrevious(week, x)': (x) => day.startOfPrevious('week', x),
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
      'time.startOfNext(x)': (x) => clock.startOfNext(x),
      'time.startOfPrevious(x)': (x) => clock.startOfPrevious(x),
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

  it.todo('accepts null-prototype unit objects (Object.create(null)) in plus() and minus(), matching duration()');
});

describe('error explanation stripping under NODE_ENV', () => {
  const script = `
    import { date } from 'native-dates';
    const errors = [() => date(null), () => date('2026-02-30')].map((call) => {
      try {
        call();
      }
      catch (error) {
        return { name: error.name, code: error.code, at: error.at, message: error.message };
      }
    });
    console.log(JSON.stringify(errors));
  `;

  const errorsUnder = (nodeEnv) => {
    const { NODE_ENV: inherited, ...env } = process.env;
    const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      env: nodeEnv === undefined ? env : { ...env, NODE_ENV: nodeEnv },
      encoding: 'utf8',
    });
    return JSON.parse(output);
  };

  let production;
  let unset;

  beforeAll(() => {
    production = errorsUnder('production');
    unset = errorsUnder(undefined);
  }, 30_000);

  it('strips line-two explanations when NODE_ENV=production while preserving error class, code, at, and line one', () => {
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

  it('includes line-two explanations when NODE_ENV is unset', () => {
    const [missing, impossible] = unset;
    expect(missing.message.split('\n')).toHaveLength(2);
    expect(impossible.message.split('\n')).toHaveLength(2);
    expect(production[1].message).not.toContain(impossible.message.split('\n')[1]);
  });
});

describe('errors in browser bundles without a process global', () => {
  const pageFrom = async (options) => {
    const bundle = await build({
      bundle: true,
      format: 'iife',
      globalName: 'nativeDates',
      write: false,
      logLevel: 'silent',
      stdin: {
        contents: "export * from 'native-dates';",
        resolveDir: fileURLToPath(new URL('../..', import.meta.url)),
      },
      ...options,
    });
    return vm.runInContext(`(() => { ${bundle.outputFiles[0].text}\nreturn nativeDates; })()`, vm.createContext({}));
  };

  // unbundled ESM or neutral bundles served via CDN or import map have neither process nor bundler-defined NODE_ENV
  it(
    'throws coded errors without ReferenceError when bundled with platform: "neutral" and no process global',
    async () => {
      const page = await pageFrom({ platform: 'neutral' });
      expect(page.date('2026-11-16').plus(1, 'day').toString()).toBe('2026-11-17');
      const [missing, impossible] = [catchError(() => page.date(null)), catchError(() => page.date('2026-02-30'))];
      expect([missing.name, missing.code, missing.at]).toEqual(['TypeError', 'missingDate', 'null']);
      expect([impossible.name, impossible.code, impossible.at]).toEqual(['RangeError', 'invalidDate', '2026-02-30']);
      expect(impossible.message.split('\n')[0]).toBe('dates refused [invalidDate] 2026-02-30');
    },
    30_000,
  );

  it('keeps the exported ErrorCode union in sync with every code thrown across src/ and packages/', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const dts = fs.readFileSync(path.join(root, 'types/helpers/errors.d.ts'), 'utf8');
    const declared = new Set([...dts.matchAll(/\|\s*'([a-zA-Z]+)'/g)].map((match) => match[1]));
    const codePattern = /'((?:missing|invalid|cannot|unknown|unsupported|conflicting)[A-Z][a-zA-Z]*|immutable)'/g;
    const thrown = new Set();
    for (const folder of ['src', 'packages/plugins/src']) {
      for (const entry of fs.readdirSync(path.join(root, folder), { recursive: true })) {
        if (!entry.endsWith('.js')) {
          continue;
        }
        const source = fs.readFileSync(path.join(root, folder, entry), 'utf8');
        for (const match of source.matchAll(codePattern)) {
          thrown.add(match[1]);
        }
      }
    }
    expect([...declared].sort()).toEqual([...thrown].sort());
  });
});
