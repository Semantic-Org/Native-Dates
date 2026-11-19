import {
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  duration,
  minutes,
  monthDay,
  time,
  timeRange,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ locale: null });
});

const meeting = datetime('2026-05-04T09:30:15', 'America/Los_Angeles');
const monday = date('2026-11-16');
const afternoon = time('17:30:15');
const november = yearMonth('2026-11');
const birthday = monthDay(10, 17);

const presets = [
  'short',
  'medium',
  'long',
  'full',
  'date',
  'time',
  'month',
  'text',
  'LT',
  'LTS',
  'L',
  'l',
  'LL',
  'll',
  'LLL',
  'lll',
  'LLLL',
  'llll',
];

describe('text', () => {
  it('reads a datetime as its date, clock and short zone name', () => {
    const standup = datetime('2026-11-16T09:30', { zone: 'America/Los_Angeles', locale: 'en-US' });
    expect(standup.text).toBe('Nov 16, 2026, 9:30 AM PST');
  });

  it('reads a date, a time, a year-month and a month-day as the fields each one carries', () => {
    expect(date('2026-11-16', { locale: 'en-US' }).text).toBe('Nov 16, 2026');
    expect(time('9:30am', { locale: 'en-US' }).text).toBe('9:30 AM');
    expect(yearMonth('2026-11', { locale: 'en-US' }).text).toBe('Nov 2026');
    expect(monthDay('10-17', { locale: 'en-US' }).text).toBe('Oct 17');
  });

  it('reads a duration in words', () => {
    expect(duration('1h 30m').locale('en-US').text).toBe('1 hour, 30 minutes');
  });

  it('is written in the locale the value carries', () => {
    expect(date('2026-05-01', { locale: 'de' }).text).toBe('01.05.2026');
    expect(duration('1h 30m').locale('de').text).toBe('1 Stunde, 30 Minuten');
  });
});

describe('DateTime format() presets', () => {
  it('prints the date and the clock without a zone name when given no preset', () => {
    expect(meeting.locale('en-US').format()).toBe('May 4, 2026, 9:30 AM');
  });

  it('prints more of the date from short through full, each with the short clock', () => {
    expect(meeting.format('short', 'en-US')).toBe('5/4/26, 9:30 AM');
    expect(meeting.format('medium', 'en-US')).toBe('May 4, 2026, 9:30 AM');
    expect(meeting.format('long', 'en-US')).toBe('May 4, 2026 at 9:30 AM');
    expect(meeting.format('full', 'en-US')).toBe('Monday, May 4, 2026 at 9:30 AM');
  });

  it('prints only the date, the clock or the month for date, time and month', () => {
    expect(meeting.format('date', 'en-US')).toBe('May 4, 2026');
    expect(meeting.format('time', 'en-US')).toBe('9:30 AM');
    expect(meeting.format('month', 'en-US')).toBe('May 2026');
  });

  it('adds the short zone name for text', () => {
    expect(meeting.format('text', 'en-US')).toBe('May 4, 2026, 9:30 AM PDT');
  });

  it('prints the Moment and Day.js names LT through llll', () => {
    expect(meeting.format('LT', 'en-US')).toBe('9:30 AM');
    expect(meeting.format('LTS', 'en-US')).toBe('9:30:15 AM');
    expect(meeting.format('L', 'en-US')).toBe('05/04/2026');
    expect(meeting.format('l', 'en-US')).toBe('5/4/2026');
    expect(meeting.format('LL', 'en-US')).toBe('May 4, 2026');
    expect(meeting.format('LLL', 'en-US')).toBe('May 4, 2026 at 9:30 AM');
    expect(meeting.format('LLLL', 'en-US')).toBe('Monday, May 4, 2026 at 9:30 AM');
  });

  it('abbreviates the month and the weekday for the lowercase names ll, lll and llll', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.format('ll', 'en-US')).toBe('Nov 16, 2026');
    expect(standup.format('lll', 'en-US')).toBe('Nov 16, 2026, 9:30 AM');
    expect(standup.format('llll', 'en-US')).toBe('Mon, Nov 16, 2026, 9:30 AM');
  });

  it('reads the date and the clock in the zone the value is in', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.in('Asia/Tokyo').format('LLLL', 'en-US')).toBe('Tuesday, November 17, 2026 at 2:30 AM');
  });

  // a month longer than May, which is spelled the same abbreviated and in full
  it('abbreviates the month for date, as medium does', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.format('date', 'en-US')).toBe('Nov 16, 2026');
  });
});

describe('CalendarDate format() presets', () => {
  it('prints the medium date when given no preset', () => {
    expect(monday.locale('en-US').format()).toBe('Nov 16, 2026');
  });

  it('prints more of the date from short through full and never a clock', () => {
    expect(monday.format('short', 'en-US')).toBe('11/16/26');
    expect(monday.format('medium', 'en-US')).toBe('Nov 16, 2026');
    expect(monday.format('long', 'en-US')).toBe('November 16, 2026');
    expect(monday.format('full', 'en-US')).toBe('Monday, November 16, 2026');
  });

  it('prints the month and year for month', () => {
    expect(monday.format('month', 'en-US')).toBe('November 2026');
  });

  it('prints the medium date for date', () => {
    expect(monday.format('date', 'en-US')).toBe('Nov 16, 2026');
  });

  it('keeps the date part of the Moment and Day.js names', () => {
    expect(monday.format('L', 'en-US')).toBe('11/16/2026');
    expect(monday.format('LL', 'en-US')).toBe('November 16, 2026');
    expect(monday.format('LLL', 'en-US')).toBe('November 16, 2026');
    expect(monday.format('LLLL', 'en-US')).toBe('Monday, November 16, 2026');
    expect(monday.format('llll', 'en-US')).toBe('Mon, Nov 16, 2026');
  });
});

describe('Time format() presets', () => {
  it('prints the short clock when given no preset', () => {
    expect(afternoon.locale('en-US').format()).toBe('5:30 PM');
  });

  it('prints seconds from medium up and never a zone name', () => {
    expect(afternoon.format('short', 'en-US')).toBe('5:30 PM');
    expect(afternoon.format('medium', 'en-US')).toBe('5:30:15 PM');
    expect(afternoon.format('long', 'en-US')).toBe('5:30:15 PM');
    expect(afternoon.format('full', 'en-US')).toBe('5:30:15 PM');
  });

  it('prints LT without seconds and LTS with them', () => {
    expect(afternoon.format('LT', 'en-US')).toBe('5:30 PM');
    expect(afternoon.format('LTS', 'en-US')).toBe('5:30:15 PM');
  });
});

describe('YearMonth format() presets', () => {
  it('prints the abbreviated month and the year when given no preset', () => {
    expect(november.locale('en-US').format()).toBe('Nov 2026');
  });

  it('prints a four-digit year in every preset so short never reads as a month and a day', () => {
    expect(november.format('short', 'en-US')).toBe('11/2026');
    expect(november.format('medium', 'en-US')).toBe('Nov 2026');
    expect(november.format('long', 'en-US')).toBe('November 2026');
    expect(november.format('full', 'en-US')).toBe('November 2026');
  });

  it('keeps the month and year of the Moment and Day.js names', () => {
    expect(november.format('L', 'en-US')).toBe('11/2026');
    expect(november.format('LL', 'en-US')).toBe('November 2026');
  });

  it('prints a month below ten without a leading zero for short', () => {
    expect(yearMonth('2026-05').format('short', 'en-US')).toBe('5/2026');
  });

  it('counts the year as the locale does, in the Buddhist era in Thai and by imperial era when the tag asks', () => {
    expect(november.format('long', 'th')).toBe('พฤศจิกายน 2569');
    expect(november.format('short', 'th')).toBe('11/2569');
    expect(november.format('long', 'ja-u-ca-japanese')).toBe('令和8年11月');
  });

  it('names the Gregorian month where the locale counts months on its own calendar', () => {
    expect(november.format('long', 'fa')).toBe('نوامبر ۲۰۲۶');
  });
});

describe('MonthDay format() presets', () => {
  it('prints the abbreviated month and the day when given no preset', () => {
    expect(birthday.locale('en-US').format()).toBe('Oct 17');
  });

  it('prints the month as a number, abbreviated or in full, and never a year', () => {
    expect(birthday.format('short', 'en-US')).toBe('10/17');
    expect(birthday.format('medium', 'en-US')).toBe('Oct 17');
    expect(birthday.format('long', 'en-US')).toBe('October 17');
    expect(birthday.format('full', 'en-US')).toBe('October 17');
  });

  it('orders the month and the day the way the locale does', () => {
    expect(birthday.format('short', 'en-GB')).toBe('17/10');
  });

  it('prints a month and a day below ten without leading zeros for short', () => {
    expect(monthDay(5, 6).format('short', 'en-US')).toBe('5/6');
  });

  // a Gregorian birthday falls on a different Persian date each year, so it is not converted
  it('prints the Gregorian month and day where the locale counts on its own calendar', () => {
    expect(monthDay(11, 6).format('long', 'fa')).toBe('۶ نوامبر');
  });
});

describe('format() presets across kinds', () => {
  it('accepts every preset name on a date, a year-month and a month-day without ever printing a clock', () => {
    for (const value of [monday, november, birthday]) {
      for (const preset of presets) {
        expect(value.format(preset, 'en-US')).not.toMatch(/\d:\d\d|AM|PM/);
      }
    }
  });

  it('accepts every preset name on a time without ever printing a date or a zone', () => {
    for (const preset of presets) {
      expect(afternoon.format(preset, 'en-US')).toMatch(/^5:30(:15)? PM$/);
    }
  });

  it('accepts every preset name on a month-day without ever printing a year', () => {
    for (const preset of presets) {
      expect(birthday.format(preset, 'en-US')).not.toMatch(/\d{3}/);
    }
  });
});

describe('format() locale', () => {
  it('writes in the locale passed to the call, then the one the value carries, then the configured one', () => {
    const day = date('2026-05-15');
    configure({ locale: 'es' });
    expect(day.format('long')).toBe('15 de mayo de 2026');
    expect(day.locale('de').format('long')).toBe('15. Mai 2026');
    expect(day.locale('de').format('long', 'fr')).toBe('15 mai 2026');
  });

  it('writes a time, a year-month and a month-day in the locale each one carries, unless one is passed', () => {
    expect(afternoon.locale('ko').format('short')).toBe('오후 5:30');
    expect(afternoon.locale('ko').format('short', 'de')).toBe('17:30');
    expect(yearMonth('2026-05').locale('ru').format('long')).toBe('май 2026 г.');
    expect(yearMonth('2026-05').locale('ru').format('long', 'fr')).toBe('mai 2026');
    expect(monthDay(5, 1).locale('ru').format('long')).toBe('1 мая');
    expect(monthDay(5, 1).locale('ru').format('long', 'de')).toBe('1. Mai');
  });

  it('writes a duration by the same order of locales', () => {
    const span = duration('2h 30m');
    configure({ locale: 'es' });
    expect(span.format()).toBe('2 horas y 30 minutos');
    expect(span.locale('de').format()).toBe('2 Stunden, 30 Minuten');
    expect(span.locale('de').format('long', 'en-US')).toBe('2 hours, 30 minutes');
  });

  it('throws unknownLocale at the tag when it is not a locale', () => {
    expect(() => monday.format('long', 'not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('Duration format()', () => {
  const span = duration('2h 30m');

  it('spells the units out when given no style', () => {
    expect(span.locale('en-US').format()).toBe('2 hours, 30 minutes');
  });

  it('prints the long, short, narrow and digital styles', () => {
    expect(span.format('long', 'en-US')).toBe('2 hours, 30 minutes');
    expect(span.format('short', 'en-US')).toBe('2 hr, 30 min');
    expect(span.format('narrow', 'en-US')).toBe('2h 30m');
    expect(span.format('digital', 'en-US')).toBe('2:30:00');
  });

  it('carries clock overflow up to hours in the text and leaves the stored fields as written', () => {
    const ninety = minutes(90);
    expect(ninety.format('long', 'en-US')).toBe('1 hour, 30 minutes');
    expect(ninety.minutes).toBe(90);
  });

  it('prints calendar units as written', () => {
    expect(duration({ years: 1, months: 2, days: 3 }).format('long', 'en-US')).toBe('1 year, 2 months, 3 days');
    expect(duration('2 weeks and 3 days').format('long', 'en-US')).toBe('2 weeks, 3 days');
  });

  it('prints a zero duration as zero seconds instead of an empty string', () => {
    expect(duration('0s').format('long', 'en-US')).toBe('0 seconds');
    expect(duration('0s').format('digital', 'en-US')).toBe('0:00:00');
  });

  it.todo('separates calendar units from a digital clock whose hours are zero, as in 1 day, 0:05:00');

  it('throws unknownFormat for a style a duration does not have', () => {
    expect(() => span.format('medium')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'medium' }),
    );
    expect(() => span.format('HH:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'HH:mm' }),
    );
  });
});

// \s* around the dash of a preset range, where ICU versions differ: Node 26 prints thin spaces in English
describe('range format()', () => {
  const week = dateRange('2026-09-01', '2026-09-07');

  it('prints the month and year of a date range once when both ends share them', () => {
    expect(week.format('medium', 'en-US')).toMatch(/^Sep 1\s*–\s*7, 2026$/);
    expect(week.format('long', 'en-US')).toMatch(/^September 1\s*–\s*7, 2026$/);
  });

  it('prints both months or both years when a date range crosses them', () => {
    expect(dateRange('2026-09-28', '2026-10-02').format('medium', 'en-US')).toMatch(/^Sep 28\s*–\s*Oct 2, 2026$/);
    expect(dateRange('2026-12-28', '2027-01-02').format('medium', 'en-US')).toMatch(
      /^Dec 28, 2026\s*–\s*Jan 2, 2027$/,
    );
  });

  it('prints the date of a same-day datetime range once', () => {
    const shift = datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', 'America/Los_Angeles');
    expect(shift.format('medium', 'en-US')).toMatch(/^Sep 1, 2026, 9:00 AM\s*–\s*5:00 PM$/);
  });

  it('prints a time range that crosses midnight from its start to its end', () => {
    expect(timeRange('22:00', '06:00').format('short', 'en-US')).toMatch(/^10:00 PM\s*–\s*6:00 AM$/);
  });

  it('formats both ends with a token pattern and joins them with a spaced en dash', () => {
    expect(week.format('YYYY-MM-DD')).toBe('2026-09-01 – 2026-09-07');
    expect(timeRange('22:00', '06:00').format('HH:mm')).toBe('22:00 – 06:00');
  });

  it('names the month at both ends of a token pattern in the locale passed to the call', () => {
    expect(week.format('D MMMM', 'fr')).toBe('1 septembre – 7 septembre');
  });

  it('reads as its medium form in text, with the zone name on a datetime range', () => {
    const shift = datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', {
      zone: 'America/Los_Angeles',
      locale: 'en-US',
    });
    expect(week.locale('en-US').text).toMatch(/^Sep 1\s*–\s*7, 2026$/);
    expect(shift.text).toMatch(/^Sep 1, 2026, 9:00 AM\s*–\s*5:00 PM PDT$/);
  });
});
