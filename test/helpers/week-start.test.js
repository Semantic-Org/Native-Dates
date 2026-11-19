import { configure, date, datetime, dayOfWeek, weekdayNames } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ locale: null, weekStart: null });
});

// 2026-11-18 is a Wednesday, with the preceding Sunday on 2026-11-15
const wednesday = date('2026-11-18');

describe('dayOfWeek()', () => {
  it.each([
    ['monday', 1],
    ['tuesday', 2],
    ['wednesday', 3],
    ['thursday', 4],
    ['friday', 5],
    ['saturday', 6],
    ['sunday', 7],
  ])('parses %s as %i', (name, number) => {
    expect(dayOfWeek(name)).toBe(number);
  });

  it.each([
    ['mon', 1],
    ['Tue', 2],
    ['WED', 3],
    ['thu', 4],
    ['Fri', 5],
    ['sat', 6],
    ['SUN', 7],
  ])('parses three-letter prefix %s case-insensitively as %i', (prefix, number) => {
    expect(dayOfWeek(prefix)).toBe(number);
  });

  it('parses full weekday names case-insensitively', () => {
    expect(dayOfWeek('Monday')).toBe(1);
    expect(dayOfWeek('SUNDAY')).toBe(7);
  });

  it('trims surrounding spaces and newlines from weekday names', () => {
    expect(dayOfWeek(' monday ')).toBe(1);
    expect(dayOfWeek('Fri\n')).toBe(5);
  });

  it('returns integers 1 through 7 unchanged', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('matches the .dayOfWeek numbering on CalendarDate instances', () => {
    const monday = date('2026-11-16');
    expect(monday.dayOfWeek).toBe(dayOfWeek('monday'));
    expect(monday.plus(6, 'days').dayOfWeek).toBe(dayOfWeek('sunday'));
  });

  it.each([
    ['an unrecognized weekday string', 'funday', 'funday'],
    ['an empty string', '', ''],
    ['an ambiguous single-letter prefix', 't', 't'],
    ['0 (Date.prototype.getDay() Sunday)', 0, '0'],
    ['8', 8, '8'],
    ['a fractional number', 1.5, '1.5'],
    ['NaN', NaN, 'NaN'],
    ['null', null, 'null'],
    ['undefined', undefined, 'undefined'],
  ])('throws unknownDayOfWeek RangeError for %s', (label, input, at) => {
    expect(() => dayOfWeek(input)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at }),
    );
  });

  it.each(['month', 'months', 'monkey', 'sunshine', 'fritter'])(
    'rejects %s, a non-weekday word sharing a three-letter prefix with a weekday',
    (word) => {
      expect(() => dayOfWeek(word)).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: word }),
      );
    },
  );

  it('parses longer prefixes of a weekday name such as tues and thurs', () => {
    expect(dayOfWeek('tues')).toBe(2);
    expect(dayOfWeek('Thurs')).toBe(4);
    expect(dayOfWeek('wednes')).toBe(3);
  });
});

describe('weekStart resolution', () => {
  it('resolves weekStart (1 = Monday through 7 = Sunday) from the instance locale on CalendarDate and DateTime', () => {
    expect(wednesday.locale('en-US').weekStart).toBe(7);
    expect(wednesday.locale('de-DE').weekStart).toBe(1);
    expect(wednesday.locale('ar-EG').weekStart).toBe(6);
    expect(datetime('2026-11-18T14:45', 'UTC').locale('en-US').weekStart).toBe(7);
  });

  it('resolves weekStart from locale region subtags and -u-fw- Unicode extensions', () => {
    expect(wednesday.locale('en-GB').weekStart).toBe(1);
    expect(wednesday.locale('en-GB-u-fw-sun').weekStart).toBe(7);
  });

  it('resolves weekStart for language-only tags via CLDR likely subtags', () => {
    expect(wednesday.locale('en').weekStart).toBe(7);
    expect(wednesday.locale('fr').weekStart).toBe(1);
    expect(wednesday.locale('ja').weekStart).toBe(7);
  });

  it('uses the primary tag from locale arrays and HTTP Accept-Language headers', () => {
    expect(wednesday.locale(['en-US', 'de-DE']).weekStart).toBe(7);
    expect(wednesday.locale('de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7').weekStart).toBe(1);
  });

  it('rotates weekdayNames() to begin with the resolved first day of the week', () => {
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Sun');
    expect(weekdayNames('short', undefined, 'en-GB')[0]).toBe('Mon');
  });

  it('uses configure({ locale }) when the instance has no explicit locale', () => {
    configure({ locale: 'de-DE' });
    expect(wednesday.startOf('week').toString()).toBe('2026-11-16');
    expect(wednesday.weekStart).toBe(1);
    expect(weekdayNames()).toEqual(weekdayNames('short', 'monday'));
  });

  it('prefers instance .locale() over configure({ locale })', () => {
    configure({ locale: 'de-DE' });
    expect(wednesday.locale('en-US').startOf('week').toString()).toBe('2026-11-15');
  });

  it('prefers configure({ weekStart }) over both configured and instance locales', () => {
    configure({ locale: 'de-DE', weekStart: 'saturday' });
    expect(wednesday.startOf('week').toString()).toBe('2026-11-14');
    expect(wednesday.locale('en-US').startOf('week').toString()).toBe('2026-11-14');
    expect(wednesday.locale('en-US').weekStart).toBe(6);
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Sat');
  });

  it('prefers an explicit call-site weekStart argument over configure({ weekStart }) and locales', () => {
    configure({ locale: 'de-DE', weekStart: 'saturday' });
    const american = wednesday.locale('en-US');
    expect(american.startOf('week', 'monday').toString()).toBe('2026-11-16');
    expect(american.endOf('week', 'monday').toString()).toBe('2026-11-22');
    expect(american.range('week', 'monday').toString()).toBe('2026-11-16/2026-11-22');
    expect(weekdayNames('short', 'monday', 'en-US')[0]).toBe('Mon');
  });

  it('falls back to locale weekStart when the call-site argument is undefined', () => {
    expect(wednesday.locale('en-US').startOf('week', undefined).toString()).toBe('2026-11-15');
  });

  it('keeps ISO weekOfYear and format("W") anchored to Monday regardless of configured weekStart', () => {
    configure({ weekStart: 'sunday' });
    expect(date('2026-11-15').weekOfYear).toBe(46);
    expect(date('2026-11-16').weekOfYear).toBe(47);
    expect(date('2026-11-15').format('W')).toBe('46');
    expect(datetime('2026-11-15T12:00', 'UTC').weekOfYear).toBe(46);
  });

  it.todo('falls back to locale weekStart when the call-site argument is null');
});

describe('startOf("week") and endOf("week")', () => {
  it.each([
    ['en-US', 'Sunday', '2026-11-15'],
    ['de-DE', 'Monday', '2026-11-16'],
    ['ar-EG', 'Saturday', '2026-11-14'],
  ])('aligns startOf("week") for %s (%s) to %s', (tag, day, start) => {
    expect(wednesday.locale(tag).startOf('week').toString()).toBe(start);
  });

  it('ends the CalendarDate week six days after startOf("week") and matches range("week")', () => {
    expect(wednesday.locale('en-US').endOf('week').toString()).toBe('2026-11-21');
    expect(wednesday.locale('de-DE').endOf('week').toString()).toBe('2026-11-22');
    expect(wednesday.locale('en-US').range('week').toString()).toBe('2026-11-15/2026-11-21');
  });

  it('starts a DateTime week at local midnight in the instance timezone', () => {
    const afternoon = datetime('2026-11-18T14:45', 'America/New_York').locale('en-US');
    expect(afternoon.startOf('week').toString()).toBe('2026-11-15T05:00:00.000Z');
  });

  it('computes startOf("week"), endOf("week"), and range("week") on DateTime using the instance locale', () => {
    const afternoon = datetime('2026-11-18T14:45', 'UTC');
    expect(afternoon.locale('de-DE').weekStart).toBe(1);
    expect(afternoon.locale('de-DE').startOf('week').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(afternoon.locale('de-DE').endOf('week').toString()).toBe('2026-11-22T23:59:59.999Z');
    expect(afternoon.locale('en-US').startOf('week').toString()).toBe('2026-11-15T00:00:00.000Z');
    expect(afternoon.locale('en-US').range('week').toString()).toBe(
      '2026-11-15T00:00:00.000Z/2026-11-22T00:00:00.000Z',
    );
  });
});

describe('isSame(..., "week")', () => {
  // 2026-11-15 (Sunday) belongs to the week of 2026-11-18 under en-US (Sun-Sat) but the prior week under de-DE (Mon-Sun)
  it('compares CalendarDates using the week boundaries of the receiver locale', () => {
    const sunday = date('2026-11-15');
    expect(wednesday.locale('en-US').isSame(sunday.locale('de-DE'), 'week')).toBe(true);
    expect(wednesday.locale('de-DE').isSame(sunday.locale('en-US'), 'week')).toBe(false);
  });

  it('compares DateTimes using the week boundaries of the receiver locale', () => {
    const wednesdayNoon = datetime('2026-11-18T12:00', 'UTC');
    const sundayNoon = datetime('2026-11-15T12:00', 'UTC');
    expect(wednesdayNoon.locale('en-US').isSame(sundayNoon.locale('de-DE'), 'week')).toBe(true);
    expect(wednesdayNoon.locale('de-DE').isSame(sundayNoon.locale('en-US'), 'week')).toBe(false);
  });

  it('compares using an explicit weekStart argument when provided', () => {
    expect(wednesday.locale('en-US').isSame('2026-11-15', 'week', 'monday')).toBe(false);
  });
});

describe('weekStart fallback without Intl.Locale.prototype.getWeekInfo', () => {
  const withoutWeekInfo = (run) => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl.Locale.prototype, 'getWeekInfo');
    try {
      delete Intl.Locale.prototype.getWeekInfo;
      run();
    }
    finally {
      if (descriptor) {
        Object.defineProperty(Intl.Locale.prototype, 'getWeekInfo', descriptor);
      }
    }
  };

  // use Sunday-first locales not yet memoized in firstDays so fallback runs uncached
  it('defaults weekStart and startOf("week") to Monday (1) without getWeekInfo', () => {
    withoutWeekInfo(() => {
      const canadian = wednesday.locale('en-CA');
      expect(canadian.weekStart).toBe(1);
      expect(canadian.startOf('week').toString()).toBe('2026-11-16');
      expect(wednesday.locale('he-IL').weekStart).toBe(1);
    });
    expect(Object.getOwnPropertyDescriptor(Intl.Locale.prototype, 'getWeekInfo')?.enumerable).toBe(false);
  });

  it('orders weekdayNames() starting on Monday without getWeekInfo', () => {
    withoutWeekInfo(() => {
      expect(weekdayNames('short', undefined, 'en-PH')[0]).toBe('Mon');
    });
  });

  it('honors explicit call-site overrides and configure({ weekStart }) without getWeekInfo', () => {
    withoutWeekInfo(() => {
      const saudi = wednesday.locale('ar-SA');
      expect(saudi.startOf('week', 'sunday').toString()).toBe('2026-11-15');
      configure({ weekStart: 'sunday' });
      expect(saudi.startOf('week').toString()).toBe('2026-11-15');
    });
  });
});
