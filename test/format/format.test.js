import {
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  duration,
  hours,
  minutes,
  monthDay,
  time,
  timeRange,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

// normalize U+202F narrow no-break space before AM/PM across ICU versions
const ascii = (text) => text.replaceAll('\u202f', ' ');

afterEach(() => {
  configure({ locale: null, formats: null });
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

describe('.text property', () => {
  it('formats DateTime with medium date, short time, and short timezone name', () => {
    const standup = datetime('2026-11-16T09:30', { zone: 'America/Los_Angeles', locale: 'en-US' });
    expect(ascii(standup.text)).toBe('Nov 16, 2026, 9:30 AM PST');
  });

  it('formats CalendarDate, Time, YearMonth, and MonthDay using only their own fields', () => {
    expect(date('2026-11-16', { locale: 'en-US' }).text).toBe('Nov 16, 2026');
    expect(ascii(time('9:30am', { locale: 'en-US' }).text)).toBe('9:30 AM');
    expect(yearMonth('2026-11', { locale: 'en-US' }).text).toBe('Nov 2026');
    expect(monthDay('10-17', { locale: 'en-US' }).text).toBe('Oct 17');
  });

  it('formats Duration in long unit style', () => {
    expect(duration('1h 30m').locale('en-US').text).toBe('1 hour, 30 minutes');
  });

  it('formats in the locale attached to the instance', () => {
    expect(date('2026-05-01', { locale: 'de' }).text).toBe('01.05.2026');
    expect(duration('1h 30m').locale('de').text).toBe('1 Stunde, 30 Minuten');
  });
});

describe('DateTime format() presets', () => {
  it('defaults to the medium preset without a timezone name when called with no arguments', () => {
    expect(ascii(meeting.locale('en-US').format())).toBe('May 4, 2026, 9:30 AM');
  });

  it('formats short, medium, long, and full date styles paired with short time', () => {
    expect(ascii(meeting.format('short', 'en-US'))).toBe('5/4/26, 9:30 AM');
    expect(ascii(meeting.format('medium', 'en-US'))).toBe('May 4, 2026, 9:30 AM');
    expect(ascii(meeting.format('long', 'en-US'))).toBe('May 4, 2026 at 9:30 AM');
    expect(ascii(meeting.format('full', 'en-US'))).toBe('Monday, May 4, 2026 at 9:30 AM');
  });

  it('formats date-only, time-only, and month-year presets', () => {
    expect(meeting.format('date', 'en-US')).toBe('May 4, 2026');
    expect(ascii(meeting.format('time', 'en-US'))).toBe('9:30 AM');
    expect(meeting.format('month', 'en-US')).toBe('May 2026');
  });

  it('appends the short timezone name for the text preset', () => {
    expect(ascii(meeting.format('text', 'en-US'))).toBe('May 4, 2026, 9:30 AM PDT');
  });

  it('formats Moment and Day.js localized presets LT through LLLL', () => {
    expect(ascii(meeting.format('LT', 'en-US'))).toBe('9:30 AM');
    expect(ascii(meeting.format('LTS', 'en-US'))).toBe('9:30:15 AM');
    expect(meeting.format('L', 'en-US')).toBe('05/04/2026');
    expect(meeting.format('l', 'en-US')).toBe('5/4/2026');
    expect(meeting.format('LL', 'en-US')).toBe('May 4, 2026');
    expect(ascii(meeting.format('LLL', 'en-US'))).toBe('May 4, 2026 at 9:30 AM');
    expect(ascii(meeting.format('LLLL', 'en-US'))).toBe('Monday, May 4, 2026 at 9:30 AM');
  });

  it('abbreviates month and weekday names for lowercase presets ll, lll, and llll', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.format('ll', 'en-US')).toBe('Nov 16, 2026');
    expect(ascii(standup.format('lll', 'en-US'))).toBe('Nov 16, 2026, 9:30 AM');
    expect(ascii(standup.format('llll', 'en-US'))).toBe('Mon, Nov 16, 2026, 9:30 AM');
  });

  it('formats date and time in the instance timezone', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(ascii(standup.in('Asia/Tokyo').format('LLLL', 'en-US'))).toBe('Tuesday, November 17, 2026 at 2:30 AM');
  });

  // use November because May has identical short and long spellings in English
  it('abbreviates the month name for the date preset, matching medium', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.format('date', 'en-US')).toBe('Nov 16, 2026');
  });
});

describe('CalendarDate format() presets', () => {
  it('defaults to the medium preset when called with no arguments', () => {
    expect(monday.locale('en-US').format()).toBe('Nov 16, 2026');
  });

  it('formats short, medium, long, and full date styles without a time component', () => {
    expect(monday.format('short', 'en-US')).toBe('11/16/26');
    expect(monday.format('medium', 'en-US')).toBe('Nov 16, 2026');
    expect(monday.format('long', 'en-US')).toBe('November 16, 2026');
    expect(monday.format('full', 'en-US')).toBe('Monday, November 16, 2026');
  });

  it('formats full month and year for the month preset', () => {
    expect(monday.format('month', 'en-US')).toBe('November 2026');
  });

  it('formats the medium date for the date preset', () => {
    expect(monday.format('date', 'en-US')).toBe('Nov 16, 2026');
  });

  it('omits time components from Moment and Day.js localized presets', () => {
    expect(monday.format('L', 'en-US')).toBe('11/16/2026');
    expect(monday.format('LL', 'en-US')).toBe('November 16, 2026');
    expect(monday.format('LLL', 'en-US')).toBe('November 16, 2026');
    expect(monday.format('LLLL', 'en-US')).toBe('Monday, November 16, 2026');
    expect(monday.format('llll', 'en-US')).toBe('Mon, Nov 16, 2026');
  });
});

describe('Time format() presets', () => {
  it('defaults to the short time preset when called with no arguments', () => {
    expect(ascii(afternoon.locale('en-US').format())).toBe('5:30 PM');
  });

  it('includes seconds for medium, long, and full presets without appending a timezone', () => {
    expect(ascii(afternoon.format('short', 'en-US'))).toBe('5:30 PM');
    expect(ascii(afternoon.format('medium', 'en-US'))).toBe('5:30:15 PM');
    expect(ascii(afternoon.format('long', 'en-US'))).toBe('5:30:15 PM');
    expect(ascii(afternoon.format('full', 'en-US'))).toBe('5:30:15 PM');
  });

  it('formats LT without seconds and LTS with seconds', () => {
    expect(ascii(afternoon.format('LT', 'en-US'))).toBe('5:30 PM');
    expect(ascii(afternoon.format('LTS', 'en-US'))).toBe('5:30:15 PM');
  });
});

describe('YearMonth format() presets', () => {
  it('defaults to abbreviated month and year when called with no arguments', () => {
    expect(november.locale('en-US').format()).toBe('Nov 2026');
  });

  it('keeps a four-digit year across short, medium, long, and full presets', () => {
    expect(november.format('short', 'en-US')).toBe('11/2026');
    expect(november.format('medium', 'en-US')).toBe('Nov 2026');
    expect(november.format('long', 'en-US')).toBe('November 2026');
    expect(november.format('full', 'en-US')).toBe('November 2026');
  });

  it('formats month and year for Moment and Day.js presets L and LL', () => {
    expect(november.format('L', 'en-US')).toBe('11/2026');
    expect(november.format('LL', 'en-US')).toBe('November 2026');
  });

  it('formats single-digit months without a leading zero in the short preset', () => {
    expect(yearMonth('2026-05').format('short', 'en-US')).toBe('5/2026');
  });

  it('formats years in the locale calendar era for Thai Buddhist and Japanese imperial locales', () => {
    expect(november.format('long', 'th')).toBe('พฤศจิกายน 2569');
    expect(november.format('short', 'th')).toBe('11/2569');
    expect(november.format('long', 'ja-u-ca-japanese')).toBe('令和8年11月');
  });

  it('keeps Gregorian month names in locales whose default calendar is non-Gregorian', () => {
    expect(november.format('long', 'fa')).toBe('نوامبر ۲۰۲۶');
  });
});

describe('MonthDay format() presets', () => {
  it('defaults to abbreviated month and day when called with no arguments', () => {
    expect(birthday.locale('en-US').format()).toBe('Oct 17');
  });

  it('formats numeric, abbreviated, and full month styles without a year', () => {
    expect(birthday.format('short', 'en-US')).toBe('10/17');
    expect(birthday.format('medium', 'en-US')).toBe('Oct 17');
    expect(birthday.format('long', 'en-US')).toBe('October 17');
    expect(birthday.format('full', 'en-US')).toBe('October 17');
  });

  it('orders month and day according to the locale', () => {
    expect(birthday.format('short', 'en-GB')).toBe('17/10');
  });

  it('formats single-digit months and days without leading zeros in the short preset', () => {
    expect(monthDay(5, 6).format('short', 'en-US')).toBe('5/6');
  });

  // a Gregorian birthday falls on a different Persian date each year, so it is not converted
  it('keeps Gregorian month and day in locales whose default calendar is non-Gregorian', () => {
    expect(monthDay(11, 6).format('long', 'fa')).toBe('۶ نوامبر');
  });
});

describe('format() presets across kinds', () => {
  it('omits time fields across all presets on CalendarDate, YearMonth, and MonthDay', () => {
    for (const value of [monday, november, birthday]) {
      for (const preset of presets) {
        expect(value.format(preset, 'en-US')).not.toMatch(/\d:\d\d|AM|PM/);
      }
    }
  });

  it('omits date and timezone fields across all presets on Time', () => {
    for (const preset of presets) {
      expect(afternoon.format(preset, 'en-US')).toMatch(/^5:30(:15)?\sPM$/);
    }
  });

  it('omits the year across all presets on MonthDay', () => {
    for (const preset of presets) {
      expect(birthday.format(preset, 'en-US')).not.toMatch(/\d{3}/);
    }
  });
});

describe('format() locale resolution', () => {
  it('resolves call-site locale over instance locale over configured locale', () => {
    const day = date('2026-05-15');
    configure({ locale: 'es' });
    expect(day.format('long')).toBe('15 de mayo de 2026');
    expect(day.locale('de').format('long')).toBe('15. Mai 2026');
    expect(day.locale('de').format('long', 'fr')).toBe('15 mai 2026');
  });

  it('uses instance locale on Time, YearMonth, and MonthDay unless overridden at the call site', () => {
    expect(afternoon.locale('ko').format('short')).toBe('오후 5:30');
    expect(afternoon.locale('ko').format('short', 'de')).toBe('17:30');
    expect(yearMonth('2026-05').locale('ru').format('long')).toBe('май 2026 г.');
    expect(yearMonth('2026-05').locale('ru').format('long', 'fr')).toBe('mai 2026');
    expect(monthDay(5, 1).locale('ru').format('long')).toBe('1 мая');
    expect(monthDay(5, 1).locale('ru').format('long', 'de')).toBe('1. Mai');
  });

  it('resolves locale precedence in the same order on Duration', () => {
    const span = duration('2h 30m');
    configure({ locale: 'es' });
    expect(span.format()).toBe('2 horas y 30 minutos');
    expect(span.locale('de').format()).toBe('2 Stunden, 30 Minuten');
    expect(span.locale('de').format('long', 'en-US')).toBe('2 hours, 30 minutes');
  });

  it('throws unknownLocale when given an invalid locale tag', () => {
    expect(() => monday.format('long', 'not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('Duration format()', () => {
  const span = duration('2h 30m');

  it('defaults to the long style when called with no arguments', () => {
    expect(span.locale('en-US').format()).toBe('2 hours, 30 minutes');
  });

  it('formats long, short, narrow, and digital styles', () => {
    expect(span.format('long', 'en-US')).toBe('2 hours, 30 minutes');
    expect(span.format('short', 'en-US')).toBe('2 hr, 30 min');
    expect(span.format('narrow', 'en-US')).toBe('2h 30m');
    expect(span.format('digital', 'en-US')).toBe('2:30:00');
  });

  it('balances sub-hour overflow in formatted output without mutating stored fields', () => {
    const ninety = minutes(90);
    expect(ninety.format('long', 'en-US')).toBe('1 hour, 30 minutes');
    expect(ninety.minutes).toBe(90);
  });

  it('formats calendar units as stored', () => {
    expect(duration({ years: 1, months: 2, days: 3 }).format('long', 'en-US')).toBe('1 year, 2 months, 3 days');
    expect(duration('2 weeks and 3 days').format('long', 'en-US')).toBe('2 weeks, 3 days');
  });

  it('formats a zero duration as zero seconds rather than an empty string', () => {
    expect(duration('0s').format('long', 'en-US')).toBe('0 seconds');
    expect(duration('0s').format('digital', 'en-US')).toBe('00:00');
  });

  it('throws unknownFormat for unsupported presets or token patterns', () => {
    expect(() => span.format('medium')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'medium' }),
    );
    expect(() => span.format('HH:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'HH:mm' }),
    );
  });
});

// allow optional spaces around the range dash because ICU spacing varies across engines
describe('range format()', () => {
  const week = dateRange('2026-09-01', '2026-09-07');

  it('collapses shared month and year in a same-month DateRange', () => {
    expect(week.format('medium', 'en-US')).toMatch(/^Sep 1\s*–\s*7, 2026$/);
    expect(week.format('long', 'en-US')).toMatch(/^September 1\s*–\s*7, 2026$/);
  });

  it('includes both months or both years when a DateRange spans month or year boundaries', () => {
    expect(dateRange('2026-09-28', '2026-10-02').format('medium', 'en-US')).toMatch(/^Sep 28\s*–\s*Oct 2, 2026$/);
    expect(dateRange('2026-12-28', '2027-01-02').format('medium', 'en-US')).toMatch(
      /^Dec 28, 2026\s*–\s*Jan 2, 2027$/,
    );
  });

  it('formats the shared date once in a same-day DateTimeRange', () => {
    const shift = datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', 'America/Los_Angeles');
    expect(shift.format('medium', 'en-US')).toMatch(/^Sep 1, 2026, 9:00\sAM\s*–\s*5:00\sPM$/);
  });

  it('formats an overnight TimeRange from start to end across midnight', () => {
    expect(timeRange('22:00', '06:00').format('short', 'en-US')).toMatch(/^10:00\sPM\s*–\s*6:00\sAM$/);
  });

  it('formats both endpoints with a token pattern joined by a spaced en dash', () => {
    expect(week.format('YYYY-MM-DD')).toBe('2026-09-01 – 2026-09-07');
    expect(timeRange('22:00', '06:00').format('HH:mm')).toBe('22:00 – 06:00');
  });

  it('localizes month tokens on both endpoints in the call-site locale', () => {
    expect(week.format('D MMMM', 'fr')).toBe('1 septembre – 7 septembre');
  });

  it('formats .text in medium style and includes the timezone name on DateTimeRange', () => {
    const shift = datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', {
      zone: 'America/Los_Angeles',
      locale: 'en-US',
    });
    expect(week.locale('en-US').text).toMatch(/^Sep 1\s*–\s*7, 2026$/);
    expect(shift.text).toMatch(/^Sep 1, 2026, 9:00\sAM\s*–\s*5:00\sPM PDT$/);
  });
});

describe('format() with an Intl options object', () => {
  it('formats only the requested Intl fields', () => {
    expect(monday.format({ weekday: 'long' }, 'en-US')).toBe('Monday');
    expect(monday.format({ month: 'short', day: 'numeric' }, 'en-US')).toBe('Nov 16');
  });

  it('formats DateTime with requested date and time fields in the given locale', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(standup.format({ weekday: 'short', hour: '2-digit', minute: '2-digit' }, 'de-DE')).toBe('Mo., 09:30');
  });

  it('filters a shared options object to the fields supported by DateTime, CalendarDate, and Time', () => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    expect(ascii(standup.format(options, 'en-US'))).toBe('Monday, November 16, 2026 at 9:30 AM PST');
    expect(monday.format(options, 'en-US')).toBe('Monday, November 16, 2026');
    expect(ascii(afternoon.format(options, 'en-US'))).toBe('5:30 PM');
  });

  it('omits year on MonthDay and day on YearMonth when given a full date options object', () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    expect(birthday.format(options, 'en-US')).toBe('October 17');
    expect(november.format(options, 'en-US')).toBe('November 2026');
  });

  it('formats a DateRange with Intl options, collapsing shared fields', () => {
    const week = dateRange('2026-09-01', '2026-09-07');
    expect(week.format({ month: 'long', day: 'numeric' }, 'en-US')).toMatch(/^September 1\s*–\s*7$/);
  });

  it('falls back to default date fields instead of midnight when CalendarDate receives only time options', () => {
    expect(monday.format({ timeStyle: 'short' }, 'en-US')).toBe('Nov 16, 2026');
    expect(monday.format({ hour: 'numeric', minute: '2-digit' }, 'en-US')).toBe('Nov 16, 2026');
  });

  it('falls back to default time fields instead of 1970 when Time receives only date options', () => {
    expect(ascii(afternoon.format({ year: 'numeric' }, 'en-US'))).toBe('5:30 PM');
    expect(ascii(afternoon.format({ dateStyle: 'full' }, 'en-US'))).toBe('5:30 PM');
  });

  it('applies hour-cycle options such as hour12 to the default Time format', () => {
    expect(afternoon.format({ hour12: false }, 'en-US')).toBe('17:30');
  });

  it('keeps the default fields on Time, CalendarDate, MonthDay, and YearMonth when an option is undefined', () => {
    expect(afternoon.format({ hour12: false, timeStyle: undefined }, 'en-US')).toBe('17:30');
    expect(monday.format({ dateStyle: undefined }, 'en-US')).toBe('Nov 16, 2026');
    expect(birthday.format({ month: undefined }, 'en-US')).toBe('Oct 17');
    expect(november.format({ year: undefined, era: 'short' }, 'en-US')).toBe('Nov 2026 AD');
  });

  it('overrides the DateTime timezone for a single call when options include timeZone', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    const clock = { hour: 'numeric', minute: '2-digit' };
    expect(ascii(standup.format({ ...clock, timeZone: 'Asia/Tokyo' }, 'en-US'))).toBe('2:30 AM');
    expect(
      ascii(standup.format({ dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo' }, 'en-US')),
    ).toBe('Nov 17, 2026, 2:30 AM');
    expect(ascii(standup.format(clock, 'en-US'))).toBe('9:30 AM');
  });

  // test two timezones so at least one differs from the host, and check that the formatter cache does not conflate them
  it('preserves the DateTime timezone when options.timeZone is undefined across cached calls', () => {
    const clock = { hour: 'numeric', minute: '2-digit', second: '2-digit' };
    for (const zone of ['Asia/Tokyo', 'America/Los_Angeles']) {
      const standup = datetime('2026-11-16T09:30', zone);
      expect(ascii(standup.format({ ...clock, timeZone: undefined }, 'en-US'))).toBe('9:30:00 AM');
      expect(ascii(standup.format(clock, 'en-US'))).toBe('9:30:00 AM');
    }
  });

  // options reused from toLocaleDateString() can include a western timeZone that would shift UTC midnight back a day
  it('ignores options.timeZone on CalendarDate, Time, MonthDay, and YearMonth', () => {
    const inHonolulu = { timeZone: 'Pacific/Honolulu' };
    expect(monday.format({ dateStyle: 'long', ...inHonolulu }, 'en-US')).toBe('November 16, 2026');
    expect(ascii(afternoon.format({ timeStyle: 'short', ...inHonolulu }, 'en-US'))).toBe('5:30 PM');
    expect(birthday.format({ month: 'long', day: 'numeric', ...inHonolulu }, 'en-US')).toBe('October 17');
    expect(november.format({ year: 'numeric', month: 'long', ...inHonolulu }, 'en-US')).toBe('November 2026');
  });

  it('omits timezone names on Time when options specify timeStyle long or full', () => {
    expect(ascii(afternoon.format({ timeStyle: 'long' }, 'en-US'))).toBe('5:30:15 PM');
    expect(ascii(afternoon.format({ timeStyle: 'full' }, 'en-US'))).toBe('5:30:15 PM');
  });

  // test year alone because Intl formats pre-1582 Temporal dates on the Julian calendar
  it('preserves two-digit years 0..99 instead of mapping them to 1900..1999', () => {
    expect(date('0099-06-15').format({ year: 'numeric' }, 'en-US')).toBe('99');
    expect(date('0005-06-15').format({ year: 'numeric' }, 'en-US')).toBe('5');
  });

  it('formats fractional seconds on Time when fractionalSecondDigits is set', () => {
    const lap = time('17:30:15.123');
    const options = { hour: 'numeric', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 };
    expect(ascii(lap.format(options, 'en-US'))).toBe('5:30:15.123 PM');
  });

  it('throws unknownFormat for an invalid Intl option value', () => {
    expect(() => monday.format({ month: 'bogus' }, 'en-US')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: '{"month":"bogus"}' }),
    );
  });

  it('throws unknownFormat when the format argument is neither a string nor a plain object', () => {
    expect(() => monday.format(123)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: '123' }),
    );
  });
});

describe('configure({ formats })', () => {
  const friday = date('2026-11-06');

  it('registers named formats backed by token patterns or Intl options objects', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', receipt: { dateStyle: 'long' } } });
    expect(friday.format('invoice')).toBe('2026-11-06');
    expect(friday.format('receipt', 'en-US')).toBe('November 6, 2026');
  });

  it('formats a named token pattern across every type that supports its tokens', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', stamp: 'HH:mm', heading: 'MMMM' } });
    expect(datetime('2026-11-06T09:05', 'Europe/Berlin').format('invoice')).toBe('2026-11-06');
    expect(datetime('2026-11-06T09:05', 'Europe/Berlin').format('stamp')).toBe('09:05');
    expect(time('17:30').format('stamp')).toBe('17:30');
    expect(yearMonth('2026-11').format('heading', 'en-US')).toBe('November');
    expect(monthDay('11-06').format('heading', 'en-US')).toBe('November');
  });

  it('filters a named Intl options object to the fields supported by each type', () => {
    configure({ formats: { receipt: { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric' } } });
    expect(ascii(datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt', 'en-US'))).toBe(
      'Friday, November 6 at 9 AM',
    );
    expect(friday.format('receipt', 'en-US')).toBe('Friday, November 6');
    expect(ascii(time('17:30').format('receipt', 'en-US'))).toBe('5 PM');
    expect(yearMonth('2026-11').format('receipt', 'en-US')).toBe('November');
    expect(monthDay('11-06').format('receipt', 'en-US')).toBe('November 6');
  });

  it('formats both endpoints of a range with a named token pattern', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', stamp: 'HH:mm' } });
    expect(dateRange('2026-11-06', '2026-11-20').format('invoice')).toBe('2026-11-06 – 2026-11-20');
    expect(timeRange('09:00', '17:30').format('stamp')).toBe('09:00 – 17:30');
    expect(datetimeRange('2026-11-06T09:00', '2026-11-06T17:30', 'Europe/Berlin').format('stamp')).toBe(
      '09:00 – 17:30',
    );
  });

  it('formats a range via Intl with a named options object, collapsing shared fields', () => {
    configure({ formats: { receipt: { month: 'long', day: 'numeric' } } });
    expect(dateRange('2026-11-06', '2026-11-20').format('receipt', 'en-US')).toMatch(/^November 6\s*–\s*20$/);
  });

  it('resolves instance locale and call-site locale override for named formats', () => {
    configure({ formats: { receipt: { weekday: 'long', month: 'long', day: 'numeric' } } });
    expect(friday.locale('fr').format('receipt')).toBe('vendredi 6 novembre');
    expect(friday.locale('fr').format('receipt', 'de')).toBe('Freitag, 6. November');
  });

  it('lets custom format names override built-in presets', () => {
    configure({ formats: { short: 'YYYY-MM-DD' } });
    expect(friday.format('short')).toBe('2026-11-06');
    expect(friday.format('long', 'en-US')).toBe('November 6, 2026');
  });

  it('restores built-in presets and clears custom formats when set to null', () => {
    configure({ formats: { short: 'YYYY-MM-DD', invoice: 'YYYY-MM-DD' } });
    configure({ formats: null });
    expect(friday.format('short', 'en-US')).toBe('11/6/26');
    expect(() => friday.format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'invoice' }),
    );
  });

  it('replaces previous custom formats when configure({ formats }) is called again', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    configure({ formats: { stamp: 'HH:mm' } });
    expect(time('17:30').format('stamp')).toBe('17:30');
    expect(() => friday.format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'invoice' }),
    );
  });

  // 'HH:mm' on CalendarDate and 'YYYY' on Time/MonthDay would throw unsupportedToken if .text resolved custom formats
  it('does not affect .text or zero-arg format() when overriding medium, short, or text', () => {
    configure({ formats: { medium: 'HH:mm', text: 'HH:mm' } });
    const day = date('2026-11-06', { locale: 'en-US' });
    expect(day.text).toBe('Nov 6, 2026');
    expect(day.format()).toBe('Nov 6, 2026');

    configure({ formats: { text: 'YYYY', medium: 'YYYY', short: 'YYYY' } });
    const inLosAngeles = { zone: 'America/Los_Angeles', locale: 'en-US' };
    expect(ascii(datetime('2026-11-16T09:30', inLosAngeles).text)).toBe('Nov 16, 2026, 9:30 AM PST');
    expect(ascii(time('9:30am', { locale: 'en-US' }).text)).toBe('9:30 AM');
    expect(yearMonth('2026-11', { locale: 'en-US' }).text).toBe('Nov 2026');
    expect(monthDay('10-17', { locale: 'en-US' }).text).toBe('Oct 17');
    expect(datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', inLosAngeles).text).toMatch(
      /^Sep 1, 2026, 9:00\sAM\s*–\s*5:00\sPM PDT$/,
    );
  });

  it('aliases custom format names to built-in presets', () => {
    configure({ formats: { table: 'medium', card: 'full' } });
    expect(friday.format('table', 'en-US')).toBe('Nov 6, 2026');
    expect(friday.format('card', 'en-US')).toBe('Friday, November 6, 2026');
    expect(ascii(time('17:30:15').format('table', 'en-US'))).toBe('5:30:15 PM');
    expect(yearMonth('2026-11').format('table', 'en-US')).toBe('Nov 2026');
    expect(monthDay('11-06').format('card', 'en-US')).toBe('November 6');
  });

  it('ignores mutations to the caller formats object after configure()', () => {
    const formats = { invoice: 'YYYY-MM-DD' };
    configure({ formats });
    formats.invoice = 'DD/MM/YYYY';
    expect(friday.format('invoice')).toBe('2026-11-06');
  });

  it('throws unknownFormat for an unregistered format name', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    expect(() => friday.format('receipt')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'receipt' }),
    );
  });

  it('throws unknownFormat for inherited Object.prototype keys such as constructor', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    expect(() => friday.format('constructor')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'constructor' }),
    );
  });

  it('throws unsupportedToken when a named token pattern uses tokens unsupported by the type', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    expect(() => time('17:30').format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: "YYYY in 'YYYY-MM-DD'" }),
    );
  });

  it('does not apply custom formats or preset overrides to Duration format()', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', long: 'YYYY-MM-DD' } });
    expect(hours(2).format('long', 'en-US')).toBe('2 hours');
    expect(() => hours(2).format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'invoice' }),
    );
  });
});
