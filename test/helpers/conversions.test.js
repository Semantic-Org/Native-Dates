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

describe('DateTime property and as() conversions', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

  it('extracts date, time, yearMonth, and monthDay in the DateTime zone', () => {
    const meeting = datetime('2026-11-16T09:30:15', 'America/Los_Angeles');
    expect(meeting.date.toString()).toBe('2026-11-16');
    expect(meeting.time.toString()).toBe('09:30:15');
    expect(meeting.yearMonth.toString()).toBe('2026-11');
    expect(meeting.monthDay.toString()).toBe('11-16');
  });

  it('updates date, time, yearMonth, and monthDay across midnight and month end after in(zone)', () => {
    const lateUtc = datetime('2026-11-30T23:30:00Z', 'UTC');
    const tokyo = lateUtc.in('Asia/Tokyo');
    expect(lateUtc.date.toString()).toBe('2026-11-30');
    expect(tokyo.date.toString()).toBe('2026-12-01');
    expect(tokyo.time.toString()).toBe('08:30:00');
    expect(tokyo.yearMonth.toString()).toBe('2026-12');
    expect(tokyo.monthDay.toString()).toBe('12-01');
  });

  it('preserves nanosecond precision when extracting Time from a DateTime', () => {
    expect(datetime('2026-11-16T09:30:15.123456789Z', 'UTC').time.toString()).toBe('09:30:15.123456789');
  });

  it('extracts 02-29 as MonthDay on a leap day', () => {
    expect(datetime('2028-02-29T12:00', 'UTC').monthDay.toString()).toBe('02-29');
  });

  it.each(['date', 'time', 'yearMonth', 'monthDay'])(
    "returns the same value from as('%s') as the .%s getter",
    (kind) => {
      expect(standup.as(kind).toString()).toBe(standup[kind].toString());
      expect(standup.as(kind).constructor).toBe(standup[kind].constructor);
    },
  );

  it('chains timezone conversion with as() for date and time', () => {
    expect(standup.in('Asia/Tokyo').as('date').toString()).toBe('2026-11-17');
    expect(standup.in('Asia/Tokyo').as('time').toString()).toBe('02:30:00');
  });

  it("returns the same DateTime instance from as('datetime')", () => {
    expect(standup.as('datetime')).toBe(standup);
  });
});

describe('CalendarDate conversions', () => {
  const due = date('2026-11-16');

  afterEach(() => {
    configure({ zone: null });
  });

  it('converts to YearMonth and MonthDay via getters and as()', () => {
    expect(due.yearMonth.toString()).toBe('2026-11');
    expect(due.monthDay.toString()).toBe('11-16');
    expect(due.as('yearMonth').toString()).toBe('2026-11');
    expect(due.as('monthDay').toString()).toBe('11-16');
  });

  it("returns the same CalendarDate instance from as('date')", () => {
    expect(due.as('date')).toBe(due);
  });

  it("converts to midnight in the given zone via as('datetime', zone)", () => {
    expect(due.as('datetime', 'UTC').toString()).toBe('2026-11-16T00:00:00.000Z');
    const tokyo = due.as('datetime', 'Asia/Tokyo');
    expect(tokyo.zone).toBe('Asia/Tokyo');
    expect(tokyo.date.toString()).toBe('2026-11-16');
    expect(tokyo.time.toString()).toBe('00:00:00');
  });

  it("uses the configured default zone when calling as('datetime') without a zone", () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(due.as('datetime').zone).toBe('Asia/Tokyo');
    expect(due.as('datetime').toString()).toBe('2026-11-15T15:00:00.000Z');
  });

  // Brazil DST sprang forward from 00:00 to 01:00 on this date so local 00:00 never existed
  it("resolves as('datetime', zone) to the first valid instant of the day when DST skips midnight", () => {
    const start = date('2018-11-04').as('datetime', 'America/Sao_Paulo');
    expect(start.toString()).toBe('2018-11-04T03:00:00.000Z');
    expect(start.date.toString()).toBe('2018-11-04');
    expect(start.time.toString()).toBe('01:00:00');
  });
});

describe('Time, YearMonth, MonthDay, and Range as()', () => {
  it('returns the same instance when converting Time, YearMonth, or MonthDay to its own kind', () => {
    const [opens, billing, birthday] = [time('9:30am'), yearMonth('2026-11'), monthDay('10-17')];
    expect(opens.as('time')).toBe(opens);
    expect(billing.as('yearMonth')).toBe(billing);
    expect(birthday.as('monthDay')).toBe(birthday);
  });

  it.each([
    ['DateRange (inclusive of end day)', dateRange('2026-09-01', '2026-09-07'), 'P7D'],
    ['DateTimeRange', datetimeRange('2026-11-16T09:00Z', '2026-11-16T10:30Z'), 'PT1H30M'],
    ['TimeRange', timeRange('9:00am', '5:00pm'), 'PT8H'],
  ])("returns the span Duration from as('duration') on %s", (label, range, iso) => {
    expect(range.as('duration').toString()).toBe(iso);
    expect(range.as('duration').equals(range.duration)).toBe(true);
  });
});

describe('as() unknownKind errors', () => {
  it.each([
    ['DateTime', 'duration', datetime('2026-11-16T09:30', 'UTC')],
    ['CalendarDate', 'time', date('2026-11-16')],
    ['Time', 'date', time('9:30am')],
    ['Time', 'datetime', time('9:30am')],
    ['YearMonth', 'date', yearMonth('2026-11')],
    ['MonthDay', 'date', monthDay('10-17')],
    ['DateRange', 'date', dateRange('2026-09-01', '2026-09-07')],
  ])("throws unknownKind RangeError on %s.as('%s') for unsupported target kinds", (className, kind, value) => {
    expect(() => value.as(kind)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at: kind }),
    );
  });

  it.each([
    ['wrong letter case', 'DateTime', 'DateTime'],
    ['an Object.prototype method name', 'toString', 'toString'],
    ['undefined', undefined, 'undefined'],
    ['null', null, 'null'],
  ])('throws unknownKind RangeError when given %s', (label, kind, at) => {
    expect(() => datetime('2026-11-16T09:30', 'UTC').as(kind)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownKind', at }),
    );
  });
});

describe('locale preservation across conversions', () => {
  it.each(['date', 'time', 'yearMonth', 'monthDay'])('preserves instance locale from DateTime to %s', (kind) => {
    const standup = datetime('2026-11-16T09:30', 'Europe/Berlin').locale('es-ES');
    expect(standup[kind].locale()).toBe('es-ES');
    expect(standup.as(kind).locale()).toBe('es-ES');
  });

  it('preserves instance locale from CalendarDate to YearMonth, MonthDay, and DateTime', () => {
    const due = date('2026-11-16').locale('es-ES');
    expect(due.yearMonth.locale()).toBe('es-ES');
    expect(due.monthDay.locale()).toBe('es-ES');
    expect(due.as('datetime', 'UTC').locale()).toBe('es-ES');
  });

  it('leaves locale undefined on the converted instance when the source has no explicit locale', () => {
    expect(datetime('2026-11-16T09:30', 'UTC').date.locale()).toBeUndefined();
  });
});
