import * as nativeDates from 'native-dates';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const classes = [
  'CalendarDate',
  'DateRange',
  'DateTime',
  'DateTimeRange',
  'Duration',
  'MonthDay',
  'Time',
  'TimeRange',
  'YearMonth',
];

const factories = [
  'date',
  'dateRange',
  'datetime',
  'datetimeRange',
  'dayMonth',
  'days',
  'duration',
  'endOfToday',
  'hours',
  'milliseconds',
  'minutes',
  'monthDay',
  'months',
  'monthYear',
  'now',
  'seconds',
  'startOfToday',
  'time',
  'timeRange',
  'today',
  'tomorrow',
  'weeks',
  'yearMonth',
  'years',
  'yesterday',
];

const guards = [
  'isCalendarDate',
  'isDateRange',
  'isDateTime',
  'isDateTimeRange',
  'isDuration',
  'isMonthDay',
  'isTime',
  'isTimeRange',
  'isYearMonth',
];

const helpers = ['compare', 'configure', 'dayOfWeek', 'earliest', 'kindOf', 'latest', 'monthNames', 'weekdayNames'];

const brands = [
  'IS_CALENDAR_DATE',
  'IS_DATE_RANGE',
  'IS_DATE_TIME',
  'IS_DATE_TIME_RANGE',
  'IS_DURATION',
  'IS_MONTH_DAY',
  'IS_RANGE',
  'IS_TIME',
  'IS_TIME_RANGE',
  'IS_YEAR_MONTH',
];

describe('native-dates exports', () => {
  it('exports the complete set of public classes, factories, guards, helpers, and brand symbols', () => {
    const expected = [...classes, ...factories, ...guards, ...helpers, ...brands];
    expect(Object.keys(nativeDates).sort()).toEqual(expected.sort());
  });

  it('preserves class .name and expected runtime typeof for every export', () => {
    for (const name of classes) {
      expect(nativeDates[name].name).toBe(name);
    }
    for (const name of [...factories, ...guards, ...helpers]) {
      expect(nativeDates[name]).toBeTypeOf('function');
    }
    for (const name of brands) {
      expect(nativeDates[name]).toBeTypeOf('symbol');
    }
  });

  it('matches every value export declared in types/index.d.ts', () => {
    const declarations = readFileSync(new URL('../../types/index.d.ts', import.meta.url), 'utf8');
    const declared = [...declarations.matchAll(/^export \{([^}]+)\} from/gm)]
      .flatMap(([, names]) => names.split(','))
      .map((name) => name.trim())
      .filter(Boolean);
    expect(declared.sort()).toEqual(Object.keys(nativeDates).sort());
  });

  // test files are ES modules, so require() runs in a second Node process started as CommonJS
  it('resolves require() from a CommonJS module to the same named exports as import', () => {
    const script = `console.log(JSON.stringify(Object.keys(require('native-dates'))));`;
    const printed = execFileSync(process.execPath, ['--input-type=commonjs', '--eval', script], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      encoding: 'utf8',
    });
    expect(JSON.parse(printed).sort()).toEqual(Object.keys(nativeDates).sort());
  });
});
