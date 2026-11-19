import {
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  monthDay,
  time,
  timeRange,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

describe('DateTime date, time, yearMonth and monthDay', () => {
  it('read each part in the zone the moment is viewed in', () => {
    const standup = datetime('2026-11-16T09:30:15', 'America/Los_Angeles');
    expect(standup.date.toString()).toBe('2026-11-16');
    expect(standup.time.toString()).toBe('09:30:15');
    expect(standup.yearMonth.toString()).toBe('2026-11');
    expect(standup.monthDay.toString()).toBe('11-16');
  });

  it('follow the moment into another zone, across midnight and the end of a month', () => {
    const lateUtc = datetime('2026-11-30T23:30:00Z', 'UTC');
    const tokyo = lateUtc.in('Asia/Tokyo');
    expect(lateUtc.date.toString()).toBe('2026-11-30');
    expect(tokyo.date.toString()).toBe('2026-12-01');
    expect(tokyo.time.toString()).toBe('08:30:00');
    expect(tokyo.yearMonth.toString()).toBe('2026-12');
    expect(tokyo.monthDay.toString()).toBe('12-01');
  });

  it('keep the digits below a second when a moment becomes a time', () => {
    expect(datetime('2026-11-16T09:30:15.123456789Z', 'UTC').time.toString()).toBe('09:30:15.123456789');
  });

  it('read February 29 as a month-day of 02-29', () => {
    expect(datetime('2028-02-29T12:00', 'UTC').monthDay.toString()).toBe('02-29');
  });
});

describe('DateTime as()', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  it.each(['date', 'time', 'yearMonth', 'monthDay'])("as('%s') gives what the property of that name gives", (kind) => {
    expect(standup.as(kind).toString()).toBe(standup[kind].toString());
    expect(standup.as(kind).constructor).toBe(standup[kind].constructor);
  });

  it('reads the date and the time after a change of zone in one chain', () => {
    expect(standup.in('Asia/Tokyo').as('date').toString()).toBe('2026-11-17');
    expect(standup.in('Asia/Tokyo').as('time').toString()).toBe('02:30:00');
  });

  it("as('datetime') returns the moment itself", () => {
    expect(standup.as('datetime')).toBe(standup);
  });
});

describe('CalendarDate yearMonth, monthDay and as()', () => {
  const due = date('2026-11-16');

  afterEach(() => {
    configure({ zone: null });
  });

  it('drop the day or the year', () => {
    expect(due.yearMonth.toString()).toBe('2026-11');
    expect(due.monthDay.toString()).toBe('11-16');
    expect(due.as('yearMonth').toString()).toBe('2026-11');
    expect(due.as('monthDay').toString()).toBe('11-16');
  });

  it("as('date') returns the date itself", () => {
    expect(due.as('date')).toBe(due);
  });

  it("as('datetime', zone) is midnight at the start of that date in the zone", () => {
    expect(due.as('datetime', 'UTC').toString()).toBe('2026-11-16T00:00:00.000Z');
    const tokyo = due.as('datetime', 'Asia/Tokyo');
    expect(tokyo.zone).toBe('Asia/Tokyo');
    expect(tokyo.date.toString()).toBe('2026-11-16');
    expect(tokyo.time.toString()).toBe('00:00:00');
  });

  it("as('datetime') with no zone uses the configured zone", () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(due.as('datetime').zone).toBe('Asia/Tokyo');
    expect(due.as('datetime').toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  // clocks in São Paulo jumped from 00:00 to 01:00 on this date, so the day has no midnight
  it("as('datetime', zone) is the first moment of a day whose midnight was skipped", () => {
    const start = date('2018-11-04').as('datetime', 'America/Sao_Paulo');
    expect(start.toString()).toBe('2018-11-04T03:00:00.000Z');
    expect(start.date.toString()).toBe('2018-11-04');
    expect(start.time.toString()).toBe('01:00:00');
  });
});

describe('as() on a Time, YearMonth, MonthDay and the ranges', () => {
  it('returns the value itself when asked for its own kind', () => {
    const [opens, billing, birthday] = [time('9:30am'), yearMonth('2026-11'), monthDay('10-17')];
    expect(opens.as('time')).toBe(opens);
    expect(billing.as('yearMonth')).toBe(billing);
    expect(birthday.as('monthDay')).toBe(birthday);
  });

  it.each([
    ['a date range, counting its last day', dateRange('2026-09-01', '2026-09-07'), 'P7D'],
    ['a moment range', datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:30Z'), 'PT1H30M'],
    ['a time range', timeRange('9:00am', '5:00pm'), 'PT8H'],
  ])("as('duration') gives the length of %s", (label, range, length) => {
    expect(range.as('duration').toString()).toBe(length);
    expect(range.as('duration').equals(range.duration)).toBe(true);
  });
});

describe('as() with a kind the value cannot become', () => {
  it.each([
    ['DateTime', 'duration', datetime('2026-11-16T09:30', 'UTC')],
    ['CalendarDate', 'time', date('2026-11-16')],
    ['Time', 'date', time('9:30am')],
    ['Time', 'datetime', time('9:30am')],
    ['YearMonth', 'date', yearMonth('2026-11')],
    ['MonthDay', 'date', monthDay('10-17')],
    ['DateRange', 'date', dateRange('2026-09-01', '2026-09-07')],
  ])("refuses a %s asked for '%s' with an unknownKind RangeError", (className, kind, value) => {
    expect(() => value.as(kind)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: kind }),
    );
  });

  it.each([
    ['a kind in the wrong letter case', 'DateTime', 'DateTime'],
    ['a method name', 'toString', 'toString'],
    ['undefined', undefined, 'undefined'],
    ['null', null, 'null'],
  ])('refuses %s with an unknownKind RangeError', (label, kind, at) => {
    expect(() => datetime('2026-11-16T09:30', 'UTC').as(kind)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at }),
    );
  });
});

describe('a locale carried into another kind', () => {
  it.each(['date', 'time', 'yearMonth', 'monthDay'])('travels from a moment to its %s', (kind) => {
    const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');
    expect(standup[kind].locale()).toBe('es-ES');
    expect(standup.as(kind).locale()).toBe('es-ES');
  });

  it('travels from a date to its year-month, its month-day and the moment it becomes', () => {
    const due = date('2026-11-16').locale('es-ES');
    expect(due.yearMonth.locale()).toBe('es-ES');
    expect(due.monthDay.locale()).toBe('es-ES');
    expect(due.as('datetime', 'UTC').locale()).toBe('es-ES');
  });

  it('is absent on the new value when the first carried none', () => {
    expect(datetime('2026-11-16T09:30', 'UTC').date.locale()).toBeUndefined();
  });
});
