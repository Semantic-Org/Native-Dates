import '@native-dates/plugins/parse';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import {
  CalendarDate,
  configure,
  date,
  dateRange,
  DateTime,
  datetime,
  datetimeRange,
  dayMonth,
  MonthDay,
  monthDay,
  monthYear,
  Time,
  time,
  timeRange,
  YearMonth,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const errorCode = (code, at) => expect.objectContaining({ name: 'RangeError', code, ...(at !== undefined && { at }) });

afterEach(() => {
  configure({ zone: null, locale: null, formats: null, weekdayNames: null, dayFirst: null });
});

describe('@native-dates/plugins/parse — CalendarDate', () => {
  it('parses compact numeric bank/EDI formats deterministically', () => {
    expect(date('24112026', { format: 'DDMMYYYY' }).toString()).toBe('2026-11-24');
    expect(date('20261124', { format: 'YYYYMMDD' }).toString()).toBe('2026-11-24');
    expect(date('11242026', { format: 'MMDDYYYY' }).toString()).toBe('2026-11-24');
    expect(date('03/05/2026', { format: 'DD/MM/YYYY' }).toString()).toBe('2026-05-03');
    expect(date('03/05/2026', { format: 'MM/DD/YYYY' }).toString()).toBe('2026-03-05');
  });

  it('parses variable-width tokens, 2-digit years, and ordinals', () => {
    expect(date('6/9/26', { format: 'D/M/YY' }).toString()).toBe('2026-09-06');
    expect(date('31/12/99', { format: 'DD/MM/YY' }).toString()).toBe('1999-12-31');
    expect(date('01/01/70', { format: 'DD/MM/YY' }).toString()).toBe('1970-01-01');
    expect(date('01/01/69', { format: 'DD/MM/YY' }).toString()).toBe('2069-01-01');
    expect(date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString()).toBe('2026-11-24');
    expect(date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString()).toBe('2026-11-06');
    expect(date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString()).toBe('2026-11-06');
  });

  it('parses ISO ordinal dates and ISO week dates', () => {
    expect(date('2026-328', { format: 'YYYY-DDDD' }).toString()).toBe('2026-11-24');
    expect(date('2024-366', { format: 'YYYY-DDDD' }).toString()).toBe('2024-12-31');
    expect(date('2026-1', { format: 'YYYY-DDD' }).toString()).toBe('2026-01-01');
    expect(date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString()).toBe('2026-11-24');
    expect(date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString()).toBe('2025-12-29');
    expect(date('2026-W48', { format: 'YYYY-[W]WW' }).toString()).toBe('2026-11-23');
    expect(date('2026-W48 Tue', { format: 'YYYY-[W]WW ddd', locale: 'en-US' }).toString()).toBe('2026-11-24');
  });

  it('parses localized standalone and genitive month names case-insensitively', () => {
    expect(date('24/NOV/2026', { format: 'DD/MMM/YYYY', locale: 'en-US' }).toString()).toBe('2026-11-24');
    expect(date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString()).toBe('2026-11-06');
    expect(date('16 février 2026', { format: 'DD MMMM YYYY', locale: 'fr' }).toString()).toBe('2026-02-16');
    expect(date('6 Νοεμβρίου 2026', { format: 'D MMMM YYYY', locale: 'el' }).toString()).toBe('2026-11-06');
  });

  it('validates weekday consistency and rejects impossible calendar dates', () => {
    expect(date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString()).toBe('2026-11-24');
    expect(date('2 2026-11-24', { format: 'E YYYY-MM-DD' }).toString()).toBe('2026-11-24');
    expect(date('0 2026-11-22', { format: 'd YYYY-MM-DD' }).toString()).toBe('2026-11-22');

    // Nov 24, 2026 is Tuesday, not Monday
    expect(() => date('Mon 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' })).toThrowError(
      errorCode('invalidDate'),
    );
    expect(() => date('2026-02-30', { format: 'YYYY-MM-DD' })).toThrowError(errorCode('invalidDate'));
    expect(() => date('2026-366', { format: 'YYYY-DDDD' })).toThrowError(errorCode('invalidDate'));
    expect(() => date('2025-W53-1', { format: 'YYYY-[W]WW-E' })).toThrowError(errorCode('invalidDate'));
    expect(() => date('November 24st, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' })).toThrowError(
      errorCode('invalidDate'),
    );
  });

  it('enforces exact token widths, case-sensitive literals, and rejects trailing garbage', () => {
    expect(() => date('6/11/2026', { format: 'DD/MM/YYYY' })).toThrowError(errorCode('invalidDate'));
    expect(() => date('2026-w48-2', { format: 'YYYY-[W]WW-E' })).toThrowError(errorCode('invalidDate'));
    expect(() => date('24112026 extra', { format: 'DDMMYYYY' })).toThrowError(errorCode('invalidDate'));
    expect(() => date('01-02-24-2026', { format: 'MM-MM-DD-YYYY' })).toThrowError(errorCode('invalidDate'));
  });

  it('supports named formats registered via configure({ formats })', () => {
    configure({ formats: { bank: 'DDMMYYYY' } });
    const parsed = date('24112026', { format: 'bank' });
    expect(parsed.toString()).toBe('2026-11-24');
    expect(parsed.format('bank')).toBe('24112026');
  });
});

describe('@native-dates/plugins/parse — DateTime', () => {
  it('parses Apache/Nginx logs with compact offsets into the target zone', () => {
    const hit = datetime('24/Nov/2026:12:40:01 -0500', {
      format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
      zone: 'America/New_York',
      locale: 'en-US',
    });
    expect(hit.toString()).toBe('2026-11-24T17:40:01.000Z');
    expect(hit).toMatchObject({ zone: 'America/New_York', hour: 12, minute: 40, second: 1 });
  });

  it('parses colon offsets, Z suffix, fractional seconds, and 12-hour clocks', () => {
    const dt = datetime('2026/11/24 02:30:15.25 PM -05:00', {
      format: 'YYYY/MM/DD hh:mm:ss.SS A Z',
      zone: 'UTC',
      locale: 'en-US',
    });
    expect(dt.toString()).toBe('2026-11-24T19:30:15.250Z');

    const midnight = datetime('2026-11-24 12:15 AM', {
      format: 'YYYY-MM-DD hh:mm A',
      zone: 'UTC',
      locale: 'en-US',
    });
    expect(midnight.toString()).toBe('2026-11-24T00:15:00.000Z');

    const noon = datetime('2026-11-24 12:15 PM', {
      format: 'YYYY-MM-DD hh:mm A',
      zone: 'UTC',
      locale: 'en-US',
    });
    expect(noon.toString()).toBe('2026-11-24T12:15:00.000Z');
  });

  it('parses inline zone tokens via zoneId (including zones plugin aliases) and honors disambiguation', () => {
    const tokyo = datetime('24 Nov 2026 15:45 JST', { format: 'DD MMM YYYY HH:mm z', locale: 'en-US' });
    expect(tokyo.zone).toBe('Asia/Tokyo');
    expect(tokyo.toString()).toBe('2026-11-24T06:45:00.000Z');

    const converted = datetime('24 Nov 2026 15:45 JST', {
      format: 'DD MMM YYYY HH:mm z',
      zone: 'UTC',
      locale: 'en-US',
    });
    expect(converted.zone).toBe('UTC');
    expect(converted.toString()).toBe('2026-11-24T06:45:00.000Z');

    expect(() =>
      datetime('08/03/2026 02:30', {
        format: 'DD/MM/YYYY HH:mm',
        zone: 'America/New_York',
        disambiguation: 'reject',
      })
    ).toThrowError(errorCode('invalidDateTime'));

    // conflicting offset and zone token rejects
    expect(() =>
      datetime('08/03/2026 12:00 -05:00 America/New_York', {
        format: 'DD/MM/YYYY HH:mm Z z',
      })
    ).toThrowError(errorCode('invalidDateTime'));
  });

  it('parses unix epoch seconds (X) and milliseconds (x) and date-only masks', () => {
    expect(datetime('1795542001', { format: 'X', zone: 'UTC' }).toString()).toBe('2026-11-24T17:40:01.000Z');
    expect(datetime('1795542001250', { format: 'x', zone: 'UTC' }).toString()).toBe('2026-11-24T17:40:01.250Z');
    expect(datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString()).toBe(
      '2026-11-24T05:00:00.000Z',
    );
  });
});

describe('@native-dates/plugins/parse — Time, YearMonth, MonthDay, and Ranges', () => {
  it('parses Time values including compact 24h, 12h, and sub-second masks', () => {
    expect(time('1430', { format: 'HHmm' }).toString()).toBe('14:30:00');
    expect(time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString()).toBe('21:05:12.500');
    expect(() => time('14:30 AM', { format: 'HH:mm A', locale: 'en-US' })).toThrowError(errorCode('invalidTime'));
  });

  it('parses YearMonth and MonthDay including leap day Feb 29', () => {
    expect(yearMonth('11/2026', { format: 'MM/YYYY' }).toString()).toBe('2026-11');
    expect(monthYear('202611', { format: 'YYYYMM' }).toString()).toBe('2026-11');
    expect(yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString()).toBe('2026-02');
    expect(monthDay('29/02', { format: 'DD/MM' }).toString()).toBe('02-29');
    expect(dayMonth('6 ноября', { format: 'D MMMM', locale: 'ru' }).toString()).toBe('11-06');
    expect(() => monthDay('30/02', { format: 'DD/MM' })).toThrowError(errorCode('invalidMonthDay'));
  });

  it('forwards { format } across dateRange, datetimeRange, and timeRange', () => {
    expect(dateRange('24112026', '30112026', { format: 'DDMMYYYY' }).toString()).toBe('2026-11-24/2026-11-30');
    expect(dateRange('24112026', '5 days', { format: 'DDMMYYYY' }).toString()).toBe('2026-11-24/2026-11-28');
    expect(
      datetimeRange('24/Nov/2026:09:00', '24/Nov/2026:10:30', {
        format: 'DD/MMM/YYYY:HH:mm',
        zone: 'UTC',
        locale: 'en-US',
      }).toString(),
    ).toBe('2026-11-24T09:00:00.000Z/2026-11-24T10:30:00.000Z');
    expect(timeRange('0930', '1700', { format: 'HHmm' }).toString()).toBe('09:30:00/17:00:00');
  });
});

describe('@native-dates/plugins/parse — loose integration, class constructors, and error contracts', () => {
  it('returns null on bad input when paired with { loose: true }, while bad format options still throw', () => {
    expect(date('not-a-date', { format: 'DDMMYYYY', loose: true })).toBeNull();
    expect(date('30022026', { format: 'DDMMYYYY', loose: true })).toBeNull();
    expect(date(undefined, { format: 'DDMMYYYY', loose: true })).toBeNull();
    expect(date(12345, { format: 'DDMMYYYY', loose: true })).toBeNull();
    expect(datetime('bad', { format: 'DD/MMM/YYYY:HH:mm:ss ZZ', loose: true })).toBeNull();

    // bad format masks and unsupported tokens are caller errors and still throw even in loose mode
    expect(() => date('24112026', { format: '', loose: true })).toThrowError(errorCode('unknownFormat'));
    expect(() => date('24112026', { format: 'yyyy-MM-dd', loose: true })).toThrowError(errorCode('unknownFormat'));
    expect(() => date('24112026', { format: 'DDMMYYYY HH:mm', loose: true })).toThrowError(
      errorCode('unsupportedToken'),
    );
    expect(() => time('1430', { format: 'YYYY HHmm', loose: true })).toThrowError(errorCode('unsupportedToken'));
    expect(() => date('11', { format: 'MM', loose: true })).toThrowError(errorCode('unknownFormat'));
    expect(() => datetime('24112026 30', { format: 'DDMMYYYY mm', loose: true })).toThrowError(
      errorCode('unknownFormat'),
    );
  });

  it('works with class constructors and rejects non-string inputs cleanly', () => {
    expect(new CalendarDate('24112026', { format: 'DDMMYYYY' }).toString()).toBe('2026-11-24');
    expect(new DateTime('24112026 0930', { format: 'DDMMYYYY HHmm', zone: 'UTC' }).toString()).toBe(
      '2026-11-24T09:30:00.000Z',
    );
    expect(new Time('0930', { format: 'HHmm' }).toString()).toBe('09:30:00');
    expect(new YearMonth('112026', { format: 'MMYYYY' }).toString()).toBe('2026-11');
    expect(new MonthDay('2411', { format: 'DDMM' }).toString()).toBe('11-24');

    expect(() => date(null, { format: 'DDMMYYYY' })).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'missingDate' }),
    );
    expect(() => date(24112026, { format: 'DDMMYYYY' })).toThrowError(
      expect.objectContaining({ name: 'TypeError', code: 'invalidDate' }),
    );
  });

  it('invalidates cached weekday patterns when configure({ weekdayNames }) changes', () => {
    configure({ weekdayNames: { en: { short: { tuesday: 'Marsday' } } } });
    expect(date('Marsday 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString()).toBe('2026-11-24');
  });
});
