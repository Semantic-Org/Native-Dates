import { mergeRanges } from '@native-dates/plugins/ranges';
import { dateRange, datetimeRange, timeRange } from 'native-dates';
import { describe, expect, it } from 'vitest';

describe('@native-dates/plugins/ranges DateRange.subtract()', () => {
  it('returns the original range when subtracting a disjoint range', () => {
    const trip = dateRange('2026-11-01', '2026-11-10');
    expect(trip.subtract(dateRange('2026-11-12', '2026-11-15')).map(String)).toEqual(['2026-11-01/2026-11-10']);
    expect(trip.subtract(dateRange('2026-10-01', '2026-10-31')).map(String)).toEqual(['2026-11-01/2026-11-10']);
  });

  it('returns an empty array when the subtracted range covers the entire span', () => {
    const trip = dateRange('2026-11-01', '2026-11-10');
    expect(trip.subtract(dateRange('2026-11-01', '2026-11-10'))).toEqual([]);
    expect(trip.subtract(dateRange('2026-10-25', '2026-11-20'))).toEqual([]);
    expect(dateRange('2026-11-05', '2026-11-05').subtract('2026-11-05/2026-11-05')).toEqual([]);
  });

  it('trims the start or end inclusively without off-by-one overlap', () => {
    const trip = dateRange('2026-11-01', '2026-11-10');
    expect(trip.subtract('2026-11-01/2026-11-03').map(String)).toEqual(['2026-11-04/2026-11-10']);
    expect(trip.subtract('2026-10-28/2026-11-03').map(String)).toEqual(['2026-11-04/2026-11-10']);
    expect(trip.subtract('2026-11-08/2026-11-10').map(String)).toEqual(['2026-11-01/2026-11-07']);
    expect(trip.subtract('2026-11-08/2026-11-15').map(String)).toEqual(['2026-11-01/2026-11-07']);
  });

  it('splits into two ranges when the subtracted span sits strictly inside', () => {
    const trip = dateRange('2026-11-01', '2026-11-10');
    expect(trip.subtract('2026-11-04/2026-11-06').map(String)).toEqual([
      '2026-11-01/2026-11-03',
      '2026-11-07/2026-11-10',
    ]);
    expect(trip.subtract('2026-11-05/2026-11-05').map(String)).toEqual([
      '2026-11-01/2026-11-04',
      '2026-11-06/2026-11-10',
    ]);
  });

  it('preserves locale on remaining DateRanges', () => {
    const trip = dateRange('2026-11-01', '2026-11-10').locale('de-DE');
    const parts = trip.subtract('2026-11-04/2026-11-06');
    expect(parts.map((part) => part.locale())).toEqual(['de-DE', 'de-DE']);
  });

  it('throws conflictingRanges for a range of a different kind', () => {
    const trip = dateRange('2026-11-01', '2026-11-10');
    expect(() => trip.subtract(timeRange('09:00', '17:00'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });
});

describe('@native-dates/plugins/ranges DateTimeRange.subtract()', () => {
  it('handles disjoint, covering, trimming, and splitting half-open spans', () => {
    const workday = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York');
    expect(workday.subtract('2026-11-02T17:00/2026-11-02T18:00').map(String)).toEqual([workday.toString()]);
    expect(workday.subtract('2026-11-02T08:00/2026-11-02T09:00').map(String)).toEqual([workday.toString()]);
    expect(workday.subtract('2026-11-02T08:00/2026-11-02T18:00')).toEqual([]);
    expect(workday.subtract('2026-11-02T09:00/2026-11-02T11:00').map((part) => [part.start.hour, part.end.hour]))
      .toEqual(
        [[11, 17]],
      );
    expect(workday.subtract('2026-11-02T15:00/2026-11-02T18:00').map((part) => [part.start.hour, part.end.hour]))
      .toEqual(
        [[9, 15]],
      );
    expect(workday.subtract('2026-11-02T12:00/2026-11-02T13:00').map((part) => [part.start.hour, part.end.hour]))
      .toEqual(
        [[9, 12], [13, 17]],
      );
  });

  it('handles empty DateTimeRanges cleanly', () => {
    const empty = datetimeRange('2026-11-02T09:00Z', '2026-11-02T09:00Z');
    const slot = datetimeRange('2026-11-02T09:00Z', '2026-11-02T11:00Z');
    expect(empty.subtract(slot)).toEqual([]);
    expect(empty.subtract(empty)).toEqual([]);
    expect(slot.subtract(empty).map(String)).toEqual([slot.toString()]);
  });

  it('preserves zone and locale when subtracting a range in another zone', () => {
    const ny = datetimeRange('2026-11-02T09:00', '2026-11-02T17:00', 'America/New_York').locale('fr-FR');
    const utcLunch = datetimeRange('2026-11-02T17:00Z', '2026-11-02T18:00Z', 'UTC');
    const parts = ny.subtract(utcLunch);
    expect(parts.map((part) => [part.start.zone, part.start.hour, part.end.hour, part.locale()])).toEqual([
      ['America/New_York', 9, 12, 'fr-FR'],
      ['America/New_York', 13, 17, 'fr-FR'],
    ]);
  });

  it('stays exact across spring-forward and fall-back DST transitions', () => {
    // 2026-03-08 springs forward at 02:00 -> 03:00 in America/New_York (00:00..05:00 is 4 real hours)
    const springNight = datetimeRange('2026-03-08T00:00', '2026-03-08T05:00', 'America/New_York');
    const maintenance = datetimeRange('2026-03-08T01:30', '2026-03-08T03:30', 'America/New_York');
    const springParts = springNight.subtract(maintenance);
    expect(springParts.map((part) => part.duration.total('minutes'))).toEqual([90, 90]);
    expect(springParts[0].end.hour).toBe(1);
    expect(springParts[1].start.hour).toBe(3);

    // 2026-11-01 falls back at 02:00 -> 01:00 in America/New_York (00:00..04:00 is 5 real hours)
    const fallNight = datetimeRange('2026-11-01T00:00', '2026-11-01T04:00', 'America/New_York');
    const firstOneAm = datetimeRange('2026-11-01T05:00Z', '2026-11-01T06:00Z', 'America/New_York');
    const fallParts = fallNight.subtract(firstOneAm);
    expect(fallParts.map((part) => part.duration.total('hours'))).toEqual([1, 3]);
    expect(fallParts[1].start.offset).toBe('-05:00');
  });

  it('throws conflictingRanges for a range of a different kind', () => {
    const slot = datetimeRange('2026-11-02T09:00Z', '2026-11-02T11:00Z');
    expect(() => slot.subtract(dateRange('2026-11-02', '2026-11-03'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'dateRange as datetimeRange' }),
    );
  });
});

describe('@native-dates/plugins/ranges TimeRange.subtract()', () => {
  it('subtracts daytime windows and empty ranges', () => {
    const shift = timeRange('09:00', '17:00');
    expect(shift.subtract('17:00 - 18:00').map(String)).toEqual(['09:00:00/17:00:00']);
    expect(shift.subtract('12:00 - 13:00').map(String)).toEqual(['09:00:00/12:00:00', '13:00:00/17:00:00']);
    expect(shift.subtract('08:00 - 18:00')).toEqual([]);
    expect(shift.subtract(timeRange('10:00', '10:00')).map(String)).toEqual(['09:00:00/17:00:00']);
    expect(timeRange('10:00', '10:00').subtract(shift)).toEqual([]);
  });

  it('subtracts across midnight on overnight ranges and stitches pieces cleanly', () => {
    const night = timeRange('22:00', '06:00');
    expect(night.subtract('23:00 - 02:00').map(String)).toEqual(['22:00:00/23:00:00', '02:00:00/06:00:00']);
    expect(night.subtract('01:00 - 03:00').map(String)).toEqual(['22:00:00/01:00:00', '03:00:00/06:00:00']);
    expect(night.subtract('23:00 - 23:30').map(String)).toEqual(['22:00:00/23:00:00', '23:30:00/06:00:00']);
    expect(night.subtract('04:00 - 06:00').map(String)).toEqual(['22:00:00/04:00:00']);
    expect(night.subtract('22:00 - 00:00').map(String)).toEqual(['00:00:00/06:00:00']);
    expect(night.subtract('00:00 - 06:00').map(String)).toEqual(['22:00:00/00:00:00']);
    expect(night.subtract('10:00 - 14:00').map(String)).toEqual(['22:00:00/06:00:00']);
    expect(night.subtract('21:00 - 07:00')).toEqual([]);
  });

  it('handles subtracting an overnight range from a daytime range spanning both ends', () => {
    expect(timeRange('05:00', '23:00').subtract(timeRange('22:00', '06:00')).map(String)).toEqual([
      '06:00:00/22:00:00',
    ]);
  });

  it('preserves locale on returned TimeRanges', () => {
    const night = timeRange('22:00', '06:00').locale('ja-JP');
    const parts = night.subtract('01:00 - 03:00');
    expect(parts.map((part) => part.locale())).toEqual(['ja-JP', 'ja-JP']);
  });
});

describe('@native-dates/plugins/ranges union()', () => {
  it('merges overlapping or directly adjacent DateRanges and returns null across a gap', () => {
    const first = dateRange('2026-11-01', '2026-11-05');
    expect(first.union('2026-11-06/2026-11-10')?.toString()).toBe('2026-11-01/2026-11-10');
    expect(dateRange('2026-11-06', '2026-11-10').union(first)?.toString()).toBe('2026-11-01/2026-11-10');
    expect(first.union('2026-11-03/2026-11-08')?.toString()).toBe('2026-11-01/2026-11-08');
    expect(first.union('2026-11-07/2026-11-10')).toBeNull();
    expect(first.locale('de-DE').union('2026-11-06/2026-11-10')?.locale()).toBe('de-DE');
  });

  it('merges overlapping or touching DateTimeRanges and handles empty spans and DST', () => {
    const a = datetimeRange('2026-11-02T09:00', '2026-11-02T10:00', 'America/New_York').locale('en-GB');
    const b = datetimeRange('2026-11-02T15:00Z', '2026-11-02T16:30Z', 'UTC');
    const united = a.union(b);
    expect(united?.start.zone).toBe('America/New_York');
    expect(united?.locale()).toBe('en-GB');
    expect(united?.duration.total('minutes')).toBe(150);
    expect(a.union('2026-11-02T10:01/2026-11-02T11:00')).toBeNull();

    const empty = datetimeRange('2026-11-02T14:00Z', '2026-11-02T14:00Z');
    expect(a.union(empty)?.toString()).toBe(a.toString());
    expect(empty.union(a)?.toString()).toBe(a.toString());
    expect(empty.union(empty)?.isEmpty()).toBe(true);

    // back-to-back across spring-forward DST keeps real duration
    const before = datetimeRange('2026-03-08T00:00', '2026-03-08T01:30', 'America/New_York');
    const after = datetimeRange('2026-03-08T01:30', '2026-03-08T04:00', 'America/New_York');
    expect(before.union(after)?.duration.total('hours')).toBe(3);
  });

  it('merges daytime and overnight TimeRanges across midnight', () => {
    expect(timeRange('09:00', '10:00').union('10:00 - 11:00')?.toString()).toBe('09:00:00/11:00:00');
    expect(timeRange('09:00', '10:00').union('10:30 - 11:00')).toBeNull();
    expect(timeRange('22:00', '06:00').union('06:00 - 08:00')?.toString()).toBe('22:00:00/08:00:00');
    expect(timeRange('20:00', '22:00').union('22:00 - 06:00')?.toString()).toBe('20:00:00/06:00:00');
    expect(timeRange('22:00', '00:00').union('00:00 - 06:00')?.toString()).toBe('22:00:00/06:00:00');
    expect(timeRange('22:00', '06:00').union('10:00 - 14:00')).toBeNull();
    expect(timeRange('22:00', '06:00').locale('fr-FR').union('06:00 - 08:00')?.locale()).toBe('fr-FR');
  });

  it('throws unsupportedUnion when two TimeRanges cover the full 24-hour clock', () => {
    expect(() => timeRange('22:00', '06:00').union(timeRange('06:00', '22:00'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnion' }),
    );
    expect(() => timeRange('22:00', '08:00').union(timeRange('06:00', '23:00'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnion' }),
    );
    expect(() => timeRange('00:00', '12:00').union(timeRange('12:00', '00:00'))).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnion' }),
    );
  });

  it('throws conflictingRanges for mismatched range kinds', () => {
    expect(() => dateRange('2026-11-01', '2026-11-05').union(timeRange('09:00', '10:00'))).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges', at: 'timeRange as dateRange' }),
    );
  });
});

describe('@native-dates/plugins/ranges mergeRanges()', () => {
  it('returns an empty array for empty iterables and drops empty moment or clock ranges', () => {
    expect(mergeRanges([])).toEqual([]);
    expect(mergeRanges(new Set())).toEqual([]);
    expect(mergeRanges([datetimeRange('2026-11-02T09:00Z', '2026-11-02T09:00Z')])).toEqual([]);
    expect(mergeRanges([timeRange('09:00', '09:00')])).toEqual([]);
  });

  it('sorts and coalesces overlapping and adjacent DateRanges from any iterable', () => {
    const input = new Set([
      dateRange('2026-11-12', '2026-11-15'),
      dateRange('2026-11-01', '2026-11-05'),
      dateRange('2026-11-06', '2026-11-08'),
      dateRange('2026-11-03', '2026-11-04'),
      dateRange('2026-11-08', '2026-11-10'),
    ]);
    expect(mergeRanges(input).map(String)).toEqual(['2026-11-01/2026-11-10', '2026-11-12/2026-11-15']);
  });

  it('sorts and coalesces DateTimeRanges across zones while ignoring empty slots', () => {
    const merged = mergeRanges([
      datetimeRange('2026-11-02T14:00Z', '2026-11-02T14:00Z'),
      datetimeRange('2026-11-02T11:00', '2026-11-02T12:00', 'America/New_York'),
      datetimeRange('2026-11-02T14:00Z', '2026-11-02T15:30Z', 'UTC'),
      datetimeRange('2026-11-02T10:30', '2026-11-02T11:00', 'America/New_York'),
    ]);
    expect(merged.map((part) => part.duration.total('hours'))).toEqual([3]);
  });

  it('coalesces TimeRanges including overnight wrap-around across midnight', () => {
    const merged = mergeRanges([
      timeRange('00:00', '06:00'),
      timeRange('10:00', '12:00'),
      timeRange('11:30', '14:00'),
      timeRange('22:00', '02:00'),
    ]);
    expect(merged.map(String)).toEqual(['10:00:00/14:00:00', '22:00:00/06:00:00']);
  });

  it('throws unsupportedUnion when merged TimeRanges cover all 24 hours', () => {
    expect(() =>
      mergeRanges([
        timeRange('00:00', '08:00'),
        timeRange('08:00', '16:00'),
        timeRange('16:00', '00:00'),
      ])
    ).toThrowError(expect.objectContaining({ name: 'RangeError', code: 'unsupportedUnion' }));
  });

  it('throws conflictingRanges on mixed range kinds and invalidRange on bad inputs', () => {
    expect(() => mergeRanges([dateRange('2026-11-01', '2026-11-02'), timeRange('09:00', '10:00')])).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'conflictingRanges' }),
    );
    expect(() => mergeRanges(['2026-11-01/2026-11-02'])).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidRange' }),
    );
    expect(() => mergeRanges('2026-11-01/2026-11-02')).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidRange' }),
    );
    expect(() => mergeRanges(null)).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidRange' }),
    );
  });
});
