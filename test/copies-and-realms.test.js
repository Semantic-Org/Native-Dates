import { build } from 'esbuild';
import * as nativeDates from 'native-dates';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

// each class with its guard and the kind kindOf() gives it
const kinds = [
  ['DateTime', 'isDateTime', 'datetime'],
  ['CalendarDate', 'isCalendarDate', 'date'],
  ['Time', 'isTime', 'time'],
  ['Duration', 'isDuration', 'duration'],
  ['YearMonth', 'isYearMonth', 'yearMonth'],
  ['MonthDay', 'isMonthDay', 'monthDay'],
  ['DateRange', 'isDateRange', 'dateRange'],
  ['DateTimeRange', 'isDateTimeRange', 'datetimeRange'],
  ['TimeRange', 'isTimeRange', 'timeRange'],
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

// the package bundled a second time is what an app holds when two of its dependencies each ship
// their own native-dates, and the same bundle run in a fresh context is what an iframe holds
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
    stdin: { contents: "export * from 'native-dates';", resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
  });
  const code = `(() => { ${bundle.outputFiles[0].text}\nreturn nativeDates; })()`;
  secondCopy = vm.runInThisContext(code);
  otherRealm = vm.createContext({});
  otherRealmCopy = vm.runInContext(code, otherRealm);
}, 30_000);

describe('a second copy of native-dates in one app', () => {
  it('has classes of its own and shares the brand symbols', () => {
    expect(secondCopy.DateTime).not.toBe(nativeDates.DateTime);
    expect(secondCopy.IS_DATE_TIME).toBe(nativeDates.IS_DATE_TIME);
  });

  it.each(kinds)('makes a %s that the first copy recognises by %s(), instanceof and kindOf()', (name, guard, kind) => {
    const theirs = valuesFrom(secondCopy)[name];
    expect(nativeDates[guard](theirs)).toBe(true);
    expect(theirs instanceof nativeDates[name]).toBe(true);
    expect(nativeDates.kindOf(theirs)).toBe(kind);
  });

  it.each(kinds)('recognises a %s made by the first copy by %s(), instanceof and kindOf()', (name, guard, kind) => {
    const mine = valuesFrom(nativeDates)[name];
    expect(secondCopy[guard](mine)).toBe(true);
    expect(mine instanceof secondCopy[name]).toBe(true);
    expect(secondCopy.kindOf(mine)).toBe(kind);
  });

  it('has its values ordered against the first copy by compare(), earliest() and latest()', () => {
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

  it('has its values read by the methods of the first copy', () => {
    const theirs = valuesFrom(secondCopy);
    const moment = nativeDates.datetime('2026-11-16T09:30', 'UTC');
    const day = nativeDates.date('2026-11-16');
    expect(moment.isBefore(theirs.DateTime)).toBe(true);
    expect(moment.until(theirs.DateTime).toString()).toBe('PT1H');
    expect(moment.plus(theirs.Duration).toString()).toBe('2026-11-16T11:30:00.000Z');
    expect(day.equals(theirs.CalendarDate)).toBe(false);
    expect(day.isSame(theirs.CalendarDate, 'month')).toBe(true);
    expect(day.until(theirs.CalendarDate).days).toBe(4);
    expect(day.at(theirs.Time, 'UTC').toString()).toBe('2026-11-16T10:30:00.000Z');
    expect(nativeDates.time('09:30').on(theirs.CalendarDate, 'UTC').toString()).toBe('2026-11-20T09:30:00.000Z');
    expect(nativeDates.yearMonth('2026-11').until(theirs.YearMonth).months).toBe(1);
    expect(nativeDates.monthDay('10-18').equals(theirs.MonthDay)).toBe(true);
    expect(day.next(theirs.MonthDay).toString()).toBe('2027-10-18');
  });

  it('has its points and ranges taken by the ranges of the first copy', () => {
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

  it('has its values handed back as they are by a factory, or read again when options are given', () => {
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

describe('another realm with its own copy of native-dates', () => {
  it('has a Temporal and an Object of its own and shares the brand symbols', () => {
    expect(vm.runInContext('Temporal', otherRealm)).not.toBe(Temporal);
    expect(vm.runInContext('Object', otherRealm)).not.toBe(Object);
    expect(otherRealmCopy.IS_DATE_TIME).toBe(nativeDates.IS_DATE_TIME);
  });

  it.each(kinds)('makes a %s that this realm recognises by %s(), instanceof and kindOf()', (name, guard, kind) => {
    const theirs = valuesFrom(otherRealmCopy)[name];
    expect(nativeDates[guard](theirs)).toBe(true);
    expect(theirs instanceof nativeDates[name]).toBe(true);
    expect(nativeDates.kindOf(theirs)).toBe(kind);
  });

  it('has its values ordered against this realm by compare(), earliest() and latest()', () => {
    const mine = nativeDates.date('2026-11-16');
    const theirs = otherRealmCopy.date('2026-11-20');
    expect(nativeDates.compare(mine, theirs)).toBe(-1);
    expect(nativeDates.compare(theirs, mine)).toBe(1);
    expect(nativeDates.earliest(theirs, mine)).toBe(mine);
    expect(nativeDates.latest(mine, theirs)).toBe(theirs);
    expect(nativeDates.compare(nativeDates.datetime(0), otherRealmCopy.datetime(1))).toBe(-1);
  });

  it('has its Date read by a factory in this realm', () => {
    const theirs = vm.runInContext('new Date(1794850200000)', otherRealm);
    expect(theirs instanceof Date).toBe(false);
    expect(nativeDates.datetime(theirs, 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
  });

  it.todo('has its dates built into a range here whose length can be measured');

  it.todo('has its Temporal objects and its fields objects read by a factory in this realm');
});
