import * as nativeDates from 'native-dates';
import { readFileSync } from 'node:fs';
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
  it('are the nine classes, their factories and guards, eight helpers and ten brand symbols, and nothing else', () => {
    const expected = [...classes, ...factories, ...guards, ...helpers, ...brands];
    expect(Object.keys(nativeDates).sort()).toEqual(expected.sort());
  });

  it('are classes named as they are exported, functions, and symbols', () => {
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

  // a name declared and never exported compiles and then fails at import, and the reverse has no types
  it('match, name for name, the values that types/index.d.ts declares', () => {
    const declarations = readFileSync(new URL('../types/index.d.ts', import.meta.url), 'utf8');
    const declared = [...declarations.matchAll(/^export \{([^}]+)\} from/gm)]
      .flatMap(([, names]) => names.split(','))
      .map((name) => name.trim())
      .filter(Boolean);
    expect(declared.sort()).toEqual(Object.keys(nativeDates).sort());
  });

  // the exports map names only the import condition, so require('native-dates') finds no entry
  it.todo('load with require() from a CommonJS file, as Node 26 loads any ES module');
});
