import {
  configure,
  date,
  dateRange,
  datetime,
  monthDay,
  monthNames,
  time,
  weekdayNames,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const standup = datetime('2026-11-16T09:05:08.428', 'America/Los_Angeles');
const friday = date('2026-11-06');

afterEach(() => {
  configure({ locale: null, weekStart: null, weekdayNames: null, ordinals: null });
});

describe('format() token patterns', () => {
  it('formats fixed layouts with year, month, day, hour, and minute tokens', () => {
    expect(standup.format('YYYY-MM-DD HH:mm')).toBe('2026-11-16 09:05');
  });

  it('escapes literal text enclosed in square brackets', () => {
    expect(standup.format('dddd, MMM D [at] h:mm A', 'en-US')).toBe('Monday, Nov 16 at 9:05 AM');
    expect(standup.format('[YYYY] YYYY')).toBe('YYYY 2026');
  });

  it('passes an unbracketed T literal through in ISO-style patterns', () => {
    expect(standup.format('YYYY-MM-DDTHH:mm:ss.SSSZ')).toBe('2026-11-16T09:05:08.428-08:00');
  });

  it('passes punctuation, digits, and non-ASCII characters through as literals', () => {
    expect(friday.format('YYYY年M月D日')).toBe('2026年11月6日');
    expect(friday.format('YYYY년 M월 D일')).toBe('2026년 11월 6일');
    expect(friday.format('D/M/YYYY, 100%')).toBe('6/11/2026, 100%');
  });

  it('formats supported tokens across CalendarDate, Time, YearMonth, and MonthDay', () => {
    expect(date('2026-11-16').format('ddd, MMM D', 'en-US')).toBe('Mon, Nov 16');
    expect(time('17:30:15').format('HH:mm:ss')).toBe('17:30:15');
    expect(time('17:30:15').format('h:mm a', 'en-US')).toBe('5:30 pm');
    expect(yearMonth('2026-11').format('MMM YYYY', 'en-US')).toBe('Nov 2026');
    expect(yearMonth('2026-11').format('MM/YY')).toBe('11/26');
    expect(monthDay('11-16').format('MMMM Do', 'en-US')).toBe('November 16th');
  });

  it('formats both endpoints of a DateRange joined by a spaced en dash', () => {
    expect(dateRange('2026-09-01', '2026-09-07').format('MMM D', 'en-US')).toBe('Sep 1 – Sep 7');
  });
});

describe('year, quarter, month, and day tokens', () => {
  it('formats YYYY as four digits and YY as two digits', () => {
    expect(friday.format('YYYY YY')).toBe('2026 26');
    expect(date('2005-03-04').format('YY')).toBe('05');
  });

  it('zero-pads positive years below 1000 to four digits and prefixes negative years with a minus sign', () => {
    expect(date('0005-03-04').format('YYYY-MM-DD')).toBe('0005-03-04');
    expect(date('-000043-03-15').format('YYYY-MM-DD')).toBe('-0043-03-15');
  });

  it('formats Q as the quarter number 1 through 4', () => {
    expect(date('2026-03-31').format('Q')).toBe('1');
    expect(date('2026-04-01').format('Q')).toBe('2');
    expect(date('2026-12-31').format('Q')).toBe('4');
  });

  it('formats unpadded M and D and zero-padded MM and DD', () => {
    expect(date('2026-05-04').format('M/D')).toBe('5/4');
    expect(date('2026-05-04').format('MM/DD')).toBe('05/04');
  });

  it('formats MMM as the abbreviated month name and MMMM as the full month name', () => {
    expect(friday.format('MMM', 'en-US')).toBe('Nov');
    expect(friday.format('MMMM', 'en-US')).toBe('November');
  });

  it('formats Do with English ordinal suffixes including 11th, 12th, and 13th', () => {
    const days = [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 24, 31];
    const ordinals = days.map((day) => date(2026, 1, day).format('Do', 'en-US'));
    expect(ordinals.join(' ')).toBe('1st 2nd 3rd 4th 11th 12th 13th 21st 22nd 23rd 24th 31st');
  });

  it('formats DDD as unpadded day of year and DDDD as three-digit zero-padded day of year', () => {
    expect(date('2026-02-14').format('DDD')).toBe('45');
    expect(date('2026-02-14').format('DDDD')).toBe('045');
    expect(date('2024-12-31').format('DDD')).toBe('366');
  });
});

describe('weekday and ISO week tokens', () => {
  it('formats d as 0 for Sunday through 6 for Saturday', () => {
    expect(date('2026-11-15').format('d')).toBe('0');
    expect(date('2026-11-16').format('d')).toBe('1');
    expect(date('2026-11-14').format('d')).toBe('6');
  });

  it('formats dd, ddd, and dddd as narrow, short, and long weekday names', () => {
    expect(date('2026-11-16').format('dd ddd dddd', 'en-US')).toBe('Mo Mon Monday');
  });

  it('formats W as the ISO week number, placing 2027-01-01 in week 53', () => {
    expect(date('2027-01-01').format('W')).toBe('53');
    expect(date('2027-01-04').format('W')).toBe('1');
  });

  it('zero-pads WW to two digits', () => {
    expect(date('2026-02-01').format('WW')).toBe('05');
  });
});

describe('time tokens', () => {
  it('formats unpadded H, m, s and zero-padded HH, mm, ss', () => {
    expect(standup.format('H:m:s')).toBe('9:5:8');
    expect(standup.format('HH:mm:ss')).toBe('09:05:08');
  });

  it('formats 12-hour h and hh with 12 for midnight and noon', () => {
    expect(time('00:05').format('h:mm A', 'en-US')).toBe('12:05 AM');
    expect(time('12:05').format('h:mm A', 'en-US')).toBe('12:05 PM');
    expect(time('13:05').format('hh:mm A', 'en-US')).toBe('01:05 PM');
  });

  it('formats uppercase A and lowercase a day periods in English', () => {
    expect(time('09:00').format('A a', 'en-US')).toBe('AM am');
    expect(time('15:00').format('A a', 'en-US')).toBe('PM pm');
  });

  it('formats fractional seconds S, SS, and SSS as tenths, hundredths, and milliseconds', () => {
    expect(standup.format('S SS SSS')).toBe('4 42 428');
    expect(time('09:00:00.007').format('S SS SSS')).toBe('0 00 007');
  });
});

describe('timezone and epoch timestamp tokens', () => {
  it('formats Z with a colon separator and ZZ without a colon', () => {
    expect(standup.format('Z ZZ')).toBe('-08:00 -0800');
    expect(datetime('2026-11-16T09:30', 'UTC').format('Z ZZ')).toBe('+00:00 +0000');
    expect(datetime('2026-11-16T09:30', 'Asia/Kolkata').format('Z')).toBe('+05:30');
  });

  it('formats z and zz as the short timezone name and zzz and zzzz as the long timezone name', () => {
    expect(standup.format('z', 'en-US')).toBe('PST');
    expect(standup.format('zz', 'en-US')).toBe('PST');
    expect(standup.format('zzz', 'en-US')).toBe('Pacific Standard Time');
    expect(standup.format('zzzz', 'en-US')).toBe('Pacific Standard Time');
  });

  it('reflects daylight saving time in timezone name and offset tokens on summer dates', () => {
    const july = datetime('2026-07-04T09:30', 'America/Los_Angeles');
    expect(july.format('z', 'en-US')).toBe('PDT');
    expect(july.format('Z')).toBe('-07:00');
  });

  it('formats X as Unix epoch seconds and x as Unix epoch milliseconds', () => {
    const sent = datetime('2026-11-16T17:30:00.500Z', 'UTC');
    expect(sent.format('X')).toBe('1794850200');
    expect(sent.format('x')).toBe('1794850200500');
  });
});

describe('localized token patterns', () => {
  it('formats month and weekday tokens in the call-site locale', () => {
    expect(friday.format('dddd D MMMM YYYY', 'fr')).toBe('vendredi 6 novembre 2026');
    expect(friday.format('dddd, D. MMMM YYYY', 'de')).toBe('Freitag, 6. November 2026');
  });

  it('resolves instance locale over configured locale for localized tokens', () => {
    expect(friday.locale('es').format('dddd D [de] MMMM')).toBe('viernes 6 de noviembre');
    configure({ locale: 'pt-BR' });
    expect(friday.format('dddd, D [de] MMMM')).toBe('sexta-feira, 6 de novembro');
  });

  it('keeps ASCII digits and Gregorian years in locales with non-Latin digits or non-Gregorian calendars', () => {
    const sent = datetime('2026-11-06T09:05', 'UTC');
    expect(sent.format('YYYY-MM-DD HH:mm', 'ar-EG')).toBe('2026-11-06 09:05');
    expect(sent.format('YYYY-MM-DD HH:mm', 'th')).toBe('2026-11-06 09:05');
    expect(sent.format('YYYY-MM-DD HH:mm', 'fa')).toBe('2026-11-06 09:05');
  });

  it('formats Gregorian month names in locales whose default calendar is non-Gregorian', () => {
    expect(friday.format('D MMMM YYYY', 'fa')).toBe('6 نوامبر 2026');
  });

  it('uses genitive/format month names adjacent to a day token and standalone month names otherwise', () => {
    expect(friday.format('D MMMM YYYY', 'ru')).toBe('6 ноября 2026');
    expect(friday.format('Do MMMM', 'ru')).toBe('6 ноября');
    expect(friday.format('MMMM YYYY', 'ru')).toBe('ноябрь 2026');
    expect(friday.format('D MMMM YYYY', 'el')).toBe('6 Νοεμβρίου 2026');
    expect(friday.format('MMMM YYYY', 'el')).toBe('Νοέμβριος 2026');
  });

  it('uses standalone month names when an explicit case suffix follows MMMM in brackets', () => {
    expect(friday.format('D. MMMM[ta] YYYY', 'fi')).toBe('6. marraskuuta 2026');
  });

  it('uses genitive/format month names when a day token is followed by an ordinal period', () => {
    expect(friday.format('D. MMMM YYYY', 'cs')).toBe('6. listopadu 2026');
    expect(friday.format('D. MMMM YYYY', 'fi')).toBe('6. marraskuuta 2026');
  });

  // Intl formats Japanese and Korean day+month numerically (11月6日), so MMMM after D still keeps its month counter
  it('preserves month counters on MMMM adjacent to D in Japanese and Korean', () => {
    expect(friday.format('D MMMM YYYY', 'ja')).toBe('6 11月 2026');
    expect(friday.format('D MMMM YYYY', 'ko')).toBe('6 11월 2026');
  });

  it('formats Do with the locale day marker instead of English suffixes outside English', () => {
    expect(friday.format('Do MMMM', 'de')).toBe('6. November');
    expect(friday.format('M月Do', 'ja')).toBe('11月6日');
    expect(friday.format('Do MMMM', 'en-GB')).toBe('6th November');
  });

  it('formats A and a with the localized day period outside English', () => {
    expect(time('09:00').format('A h:mm', 'ja')).toBe('午前 9:00');
    expect(time('15:00').format('a h:mm', 'ja')).toBe('午後 3:00');
    expect(time('15:00').format('A h:mm', 'ko')).toBe('오후 3:00');
    expect(time('15:00').format('h:mm A', 'ar')).toBe('3:00 م');
  });

  // allow any whitespace inside Spanish day periods because ICU space characters vary across engines
  it('preserves native day-period casing for both A and a outside English', () => {
    expect(time('15:00').format('h:mm A', 'es')).toMatch(/^3:00 p\.\sm\.$/);
    expect(time('09:00').format('h:mm a', 'es')).toMatch(/^9:00 a\.\sm\.$/);
  });

  it('formats dd as two-letter prefixes where unambiguous and narrow calendar symbols elsewhere', () => {
    expect(friday.format('dd', 'de')).toBe('Fr');
    expect(friday.format('dd', 'ru')).toBe('пт');
    expect(friday.format('dd', 'pt-BR')).toBe('S');
    expect(friday.format('dd', 'ja')).toBe('金');
  });
});

describe('invalid patterns and unsupported tokens', () => {
  it('throws unknownFormat for misspelled preset names', () => {
    expect(() => standup.format('meduim')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'meduim' }),
    );
    expect(() => friday.format('iso')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'iso' }),
    );
  });

  it('throws unknownFormat for unbracketed ASCII word literals', () => {
    expect(() => standup.format('MMM D at h:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'MMM D at h:mm' }),
    );
  });

  it('throws unknownFormat for lowercase yyyy and dd date tokens from other libraries', () => {
    expect(() => friday.format('yyyy-MM-dd')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'yyyy-MM-dd' }),
    );
  });

  it('throws unsupportedToken when formatting CalendarDate with time tokens', () => {
    expect(() => friday.format('HH:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: "HH in 'HH:mm'" }),
    );
  });

  it('throws unsupportedToken when formatting CalendarDate with timezone or epoch tokens', () => {
    for (const token of ['Z', 'z', 'X', 'x']) {
      expect(() => friday.format(token)).toThrowError(expect.objectContaining({ code: 'unsupportedToken' }));
    }
  });

  it('throws unsupportedToken when formatting Time with date, week, or timezone tokens', () => {
    for (const token of ['YYYY', 'MMMM', 'D', 'dddd', 'W', 'Z']) {
      expect(() => time('17:30').format(token)).toThrowError(
        expect.objectContaining({ code: 'unsupportedToken', at: `${token} in '${token}'` }),
      );
    }
  });

  it('throws unsupportedToken when formatting YearMonth with day tokens or MonthDay with year tokens', () => {
    expect(() => yearMonth('2026-11').format('YYYY-MM-DD')).toThrowError(
      expect.objectContaining({ code: 'unsupportedToken', at: "DD in 'YYYY-MM-DD'" }),
    );
    expect(() => monthDay('11-16').format('YYYY-MM-DD')).toThrowError(
      expect.objectContaining({ code: 'unsupportedToken', at: "YYYY in 'YYYY-MM-DD'" }),
    );
  });

  it('throws unsupportedToken when formatting MonthDay with weekday, day-of-year, or week tokens', () => {
    for (const token of ['d', 'dddd', 'DDD', 'W']) {
      expect(() => monthDay('11-16').format(token)).toThrowError(expect.objectContaining({ code: 'unsupportedToken' }));
    }
  });

  it('throws unsupportedToken when formatting DateRange with time tokens', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').format('HH:mm')).toThrowError(
      expect.objectContaining({ code: 'unsupportedToken', at: "HH in 'HH:mm'" }),
    );
  });
});

describe('monthNames()', () => {
  it('returns the twelve long month names starting at January when style is omitted', () => {
    expect(monthNames(undefined, 'en-US').join(' ')).toBe(
      'January February March April May June July August September October November December',
    );
  });

  it('returns abbreviated month names for short', () => {
    expect(monthNames('short', 'en-US').join(' ')).toBe('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec');
  });

  it('resolves the call-site locale over the configured locale', () => {
    expect(monthNames('long', 'fr-FR').slice(0, 3)).toEqual(['janvier', 'février', 'mars']);
    configure({ locale: 'es-ES' });
    expect(monthNames('short').slice(0, 3)).toEqual(['ene', 'feb', 'mar']);
  });

  it('returns standalone nominative month names rather than genitive forms', () => {
    expect(monthNames('long', 'ru')[10]).toBe('ноябрь');
    expect(monthNames('long', 'el')[10]).toBe('Νοέμβριος');
  });

  it('returns Gregorian month names in locales whose default calendar is non-Gregorian', () => {
    expect(monthNames('long', 'fa').slice(0, 3)).toEqual(['ژانویه', 'فوریه', 'مارس']);
    expect(monthNames('long', 'ar-SA').slice(0, 3)).toEqual(['يناير', 'فبراير', 'مارس']);
  });

  it('returns a new array on each call so mutating the result does not affect later calls', () => {
    monthNames('long', 'en-US').reverse();
    expect(monthNames('long', 'en-US')[0]).toBe('January');
  });

  it.todo(
    'throws unknownFormat when monthNames() receives an unrecognized style such as a locale tag in the first argument',
  );

  it('throws unknownLocale when given an invalid locale tag', () => {
    expect(() => monthNames('long', 'not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('weekdayNames()', () => {
  it('returns the seven short weekday names when style is omitted', () => {
    expect(weekdayNames(undefined, 'monday', 'en-US')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('returns full weekday names for long', () => {
    expect(weekdayNames('long', 'monday', 'en-US').join(' ')).toBe(
      'Monday Tuesday Wednesday Thursday Friday Saturday Sunday',
    );
  });

  it('returns two-letter prefixes for narrow in English and single-character headers where standard', () => {
    expect(weekdayNames('narrow', 'monday', 'en-US')).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    expect(weekdayNames('narrow', 'sunday', 'pt-BR')).toEqual(['D', 'S', 'T', 'Q', 'Q', 'S', 'S']);
    expect(weekdayNames('narrow', 'sunday', 'ja')).toEqual(['日', '月', '火', '水', '木', '金', '土']);
  });

  // Turkish 2-letter prefixes collide on Pazar/Pazartesi -> Pz, so narrow headers fall back to 1-letter forms
  it.each([
    ['fr', ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']],
    ['es', ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']],
    ['de', ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']],
    ['ru', ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']],
    ['zh-CN', ['一', '二', '三', '四', '五', '六', '日']],
    ['ko', ['월', '화', '수', '목', '금', '토', '일']],
    ['ar-EG', ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح']],
    ['tr', ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']],
  ])('returns distinct narrow weekday headers for %s', (locale, headers) => {
    expect(weekdayNames('narrow', 'monday', locale)).toEqual(headers);
  });

  it('defaults the first day of the week to the locale week start when weekStart is omitted', () => {
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Sun');
    expect(weekdayNames('short', undefined, 'de-DE')[0]).toBe('Mo');
    expect(weekdayNames('long', undefined, 'ar-EG')[0]).toBe('السبت');
  });

  it('accepts weekStart as a full weekday name, three-letter prefix, or ISO weekday number 1..7', () => {
    expect(weekdayNames('short', 'monday', 'en-US')[0]).toBe('Mon');
    expect(weekdayNames('short', 'Fri', 'en-US')[0]).toBe('Fri');
    expect(weekdayNames('short', 7, 'en-US')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('uses configured weekStart by default and lets the call-site argument override it', () => {
    configure({ weekStart: 'monday' });
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Mon');
    expect(weekdayNames('short', 'sunday', 'en-US')[0]).toBe('Sun');
  });

  it('uses the configured locale when no locale argument is passed', () => {
    configure({ locale: 'es' });
    expect(weekdayNames('long', 'monday')[0]).toBe('lunes');
    expect(weekdayNames('long', 'monday', 'de')[0]).toBe('Montag');
  });

  it('returns a new array on each call so mutating the result does not affect later calls', () => {
    weekdayNames('long', 'monday', 'en-US').reverse();
    expect(weekdayNames('long', 'monday', 'en-US')[0]).toBe('Monday');
  });

  it('throws unknownDayOfWeek for an unrecognized weekStart value', () => {
    expect(() => weekdayNames('short', 'funday', 'en-US')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
  });

  it('throws unknownLocale when given an invalid locale tag', () => {
    expect(() => weekdayNames('short', 'monday', 'not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('configure({ weekdayNames })', () => {
  it('overrides specified weekday entries while keeping runtime defaults for remaining days', () => {
    configure({ weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } } });
    expect(weekdayNames('narrow', 'monday', 'lv')).toEqual(['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']);
    expect(date('2026-11-01').format('dd', 'lv')).toBe('Sv');
  });

  it('applies narrow overrides to dd, short overrides to ddd, and long overrides to dddd', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues', thu: 'Thurs' } } } });
    expect(date('2026-11-03').format('dd ddd dddd', 'en-US')).toBe('Tu Tues Tuesday');
    expect(weekdayNames('short', 'monday', 'en-US')).toEqual(['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']);
  });

  it('inherits base-language overrides in regional locales and layers regional overrides on top', () => {
    configure({
      weekdayNames: {
        en: { long: { sun: 'Sunday (closed)' } },
        'en-US': { long: { mon: 'Monday (late)' } },
      },
    });
    expect(weekdayNames('long', 'sunday', 'en-US').slice(0, 2)).toEqual(['Sunday (closed)', 'Monday (late)']);
    expect(weekdayNames('long', 'sunday', 'en-GB').slice(0, 2)).toEqual(['Sunday (closed)', 'Monday']);
  });

  it('matches locale keys case-insensitively', () => {
    configure({ weekdayNames: { 'PT-br': { short: { sat: 'sab' } } } });
    expect(date('2026-11-07').format('ddd', 'pt-BR')).toBe('sab');
  });

  it('does not affect other locales, format presets, or Intl options objects', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    expect(date('2026-11-03').format('ddd', 'de')).toBe('Di');
    expect(date('2026-11-03').format('llll', 'en-US')).toBe('Tue, Nov 3, 2026');
    expect(date('2026-11-03').format({ weekday: 'short' }, 'en-US')).toBe('Tue');
  });

  it('applies overrides even after the locale has already been formatted', () => {
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tue');
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tues');
  });

  it('replaces previous weekdayNames overrides when called again', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    configure({ weekdayNames: { en: { short: { thu: 'Thurs' } } } });
    expect(weekdayNames('short', 'monday', 'en-US')).toEqual(['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']);
  });

  it('restores default runtime weekday names when set to null', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    configure({ weekdayNames: null });
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tue');
  });

  it('throws unknownWidth when a width key is missing or not narrow, short, or long', () => {
    expect(() => configure({ weekdayNames: { lv: { min: { fri: 'Pk' } } } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownWidth', at: 'min' }),
    );
    expect(() => configure({ weekdayNames: { lv: { fri: 'Pk' } } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownWidth', at: 'fri' }),
    );
  });

  it('throws unknownDayOfWeek for an unrecognized day key', () => {
    expect(() => configure({ weekdayNames: { lv: { narrow: { funday: 'Pk' } } } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
  });

  it('preserves previously configured weekdayNames when a subsequent call throws', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    expect(() => configure({ weekdayNames: { en: { short: { tue: 'Tu.' } }, lv: { min: {} } } })).toThrowError(
      expect.objectContaining({ code: 'unknownWidth' }),
    );
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tues');
  });
});

describe('configure({ ordinals })', () => {
  const firstAsPremier = { fr: (day) => (day === 1 ? '1er' : day) };

  it('formats Do using the custom ordinal function configured for the language', () => {
    configure({ ordinals: firstAsPremier });
    expect(date('2026-11-01').format('Do MMMM', 'fr')).toBe('1er novembre');
    expect(date('2026-11-02').format('Do MMMM', 'fr')).toBe('2 novembre');
  });

  it('applies custom ordinals across CalendarDate, MonthDay, and DateTime', () => {
    configure({ ordinals: firstAsPremier });
    expect(monthDay('11-01').format('Do MMMM', 'fr')).toBe('1er novembre');
    expect(datetime('2026-11-01T09:00', 'Europe/Paris').format('dddd Do MMMM', 'fr')).toBe('dimanche 1er novembre');
  });

  it('matches regional subtags of the configured language and instance locales', () => {
    configure({ ordinals: firstAsPremier });
    expect(date('2026-11-01').format('Do MMMM', 'fr-CA')).toBe('1er novembre');
    expect(date('2026-11-01').locale('fr').format('Do MMMM')).toBe('1er novembre');
  });

  it('leaves unconfigured languages on their built-in ordinal formatting', () => {
    configure({ ordinals: firstAsPremier });
    expect(date('2026-11-01').format('Do', 'en-US')).toBe('1st');
    expect(date('2026-11-01').format('Do', 'de')).toBe('1.');
  });

  it('overrides built-in English ordinal suffixes when en is configured', () => {
    configure({ ordinals: { en: (day) => `${day}.` } });
    expect(date('2026-11-01').format('Do', 'en-US')).toBe('1.');
  });

  it('replaces previous ordinals when called again', () => {
    configure({ ordinals: firstAsPremier });
    configure({ ordinals: { en: (day) => `${day}.` } });
    expect(date('2026-11-01').format('Do MMMM', 'fr')).toBe('1 novembre');
    expect(date('2026-11-01').format('Do', 'en-US')).toBe('1.');
  });

  it('restores default built-in ordinals when set to null', () => {
    configure({ ordinals: { en: (day) => `${day}.` } });
    configure({ ordinals: null });
    expect(date('2026-11-01').format('Do', 'en-US')).toBe('1st');
  });
});
