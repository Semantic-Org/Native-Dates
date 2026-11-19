import { build } from 'esbuild';
import * as nativeDates from 'native-dates';
import { Console } from 'node:console';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const printed = (make) => [
  [
    'a moment',
    'DateTime(2026-11-16T09:30:00-08:00[America/Los_Angeles])',
    make.datetime('2026-11-16T09:30', 'America/Los_Angeles'),
  ],
  ['a date', 'CalendarDate(2026-11-16)', make.date('2026-11-16')],
  ['a time', 'Time(09:30:00)', make.time('9:30am')],
  ['a duration', 'Duration(PT1H30M)', make.duration('1h 30m')],
  ['a duration measured from a date', 'Duration(P15D) from 2026-11-01', make.date('2026-11-01').until('2026-11-16')],
  ['a year-month', 'YearMonth(2026-11)', make.yearMonth('2026-11')],
  ['a month-day', 'MonthDay(10-17)', make.monthDay('10-17')],
  ['a date range', 'DateRange(2026-11-01 through 2026-11-07)', make.dateRange('2026-11-01', '2026-11-07')],
  ['a time range', 'TimeRange(09:00:00 until 17:00:00)', make.timeRange('9:00am', '5:00pm')],
];

const meetingFrom = (make) => make.datetime('2026-11-16T09:00', 'America/Los_Angeles').to('2026-11-16T10:00');

const logged = (...values) => {
  let output = '';
  const stream = new Writable({
    write(chunk, encoding, done) {
      output += chunk;
      done();
    },
  });
  new Console(stream).log(...values);
  return output.trimEnd();
};

describe('console.log() and util.inspect() in Node', () => {
  it.each(printed(nativeDates))('print %s as %s', (label, text, value) => {
    expect(inspect(value)).toBe(text);
    expect(logged(value)).toBe(text);
  });

  it('print a moment range as DateTimeRange around its two ends', () => {
    expect(logged(meetingFrom(nativeDates))).toMatch(/^DateTimeRange\(\S+ until \S+\)$/);
  });

  it('say through for a date range, which holds its last day, and until for ranges that stop short of their end', () => {
    expect(inspect(nativeDates.dateRange('2026-11-01', '2026-11-07'))).toContain(' through ');
    expect(inspect(nativeDates.timeRange('9:00am', '5:00pm'))).toContain(' until ');
    expect(inspect(meetingFrom(nativeDates))).toContain(' until ');
  });

  it('print values held in objects and arrays the same way', () => {
    expect(logged({ due: nativeDates.date('2026-11-16') })).toBe('{ due: CalendarDate(2026-11-16) }');
    expect(logged([nativeDates.time('9:30am'), nativeDates.time('2:00pm')])).toBe('[ Time(09:30:00), Time(14:00:00) ]');
  });

  it('print a value in full at a depth where Node would cut an object down to its class name', () => {
    const deep = { order: { line: { due: nativeDates.date('2026-11-16') } } };
    expect(logged(deep)).toContain('due: CalendarDate(2026-11-16)');
  });

  // a minifier renames classes, and a console line reading V(...) would tell a reader nothing
  it('keep every class name when the package is bundled and minified', async () => {
    const bundle = await build({
      bundle: true,
      minify: true,
      format: 'iife',
      globalName: 'nativeDates',
      write: false,
      logLevel: 'silent',
      stdin: { contents: "export * from 'native-dates';", resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
    });
    const minified = vm.runInThisContext(`(() => { ${bundle.outputFiles[0].text}\nreturn nativeDates; })()`);
    expect(minified.DateRange.name).not.toBe('DateRange');
    for (const [, text, value] of printed(minified)) {
      expect(inspect(value)).toBe(text);
    }
    expect(inspect(meetingFrom(minified))).toMatch(/^DateTimeRange\(/);
  }, 30_000);
});
