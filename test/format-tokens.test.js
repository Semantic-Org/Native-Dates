import { configure, date, dateRange, datetime, monthDay, time, yearMonth } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const standup = datetime('2026-11-16T09:05:08.428', 'America/Los_Angeles');
const friday = date('2026-11-06');

afterEach(() => {
  configure({ locale: null });
});

describe('format() token patterns', () => {
  it('prints a fixed layout from year, month, day, hour and minute tokens', () => {
    expect(standup.format('YYYY-MM-DD HH:mm')).toBe('2026-11-16 09:05');
  });

  it('copies text in square brackets as written', () => {
    expect(standup.format('dddd, MMM D [at] h:mm A', 'en-US')).toBe('Monday, Nov 16 at 9:05 AM');
    expect(standup.format('[YYYY] YYYY')).toBe('YYYY 2026');
  });

  it('lets a bare T through so an ISO timestamp needs no brackets', () => {
    expect(standup.format('YYYY-MM-DDTHH:mm:ss.SSSZ')).toBe('2026-11-16T09:05:08.428-08:00');
  });

  it('copies punctuation, digits and letters outside the English alphabet as written', () => {
    expect(friday.format('YYYY年M月D日')).toBe('2026年11月6日');
    expect(friday.format('YYYY년 M월 D일')).toBe('2026년 11월 6일');
    expect(friday.format('D/M/YYYY, 100%')).toBe('6/11/2026, 100%');
  });

  it('prints the same tokens on each kind of value that has the fields', () => {
    expect(date('2026-11-16').format('ddd, MMM D', 'en-US')).toBe('Mon, Nov 16');
    expect(time('17:30:15').format('HH:mm:ss')).toBe('17:30:15');
    expect(time('17:30:15').format('h:mm a', 'en-US')).toBe('5:30 pm');
    expect(yearMonth('2026-11').format('MMM YYYY', 'en-US')).toBe('Nov 2026');
    expect(yearMonth('2026-11').format('MM/YY')).toBe('11/26');
    expect(monthDay('11-16').format('MMMM Do', 'en-US')).toBe('November 16th');
  });

  it('formats each end of a range and joins them with a spaced en dash', () => {
    expect(dateRange('2026-09-01', '2026-09-07').format('MMM D', 'en-US')).toBe('Sep 1 – Sep 7');
  });
});

describe('year, quarter, month and day tokens', () => {
  it('prints YYYY as four digits and YY as the last two', () => {
    expect(friday.format('YYYY YY')).toBe('2026 26');
    expect(date('2005-03-04').format('YY')).toBe('05');
  });

  it('pads a year before 1000 to four digits and signs a year before 0', () => {
    expect(date('0005-03-04').format('YYYY-MM-DD')).toBe('0005-03-04');
    expect(date('-000043-03-15').format('YYYY-MM-DD')).toBe('-0043-03-15');
  });

  it('prints Q as the quarter from 1 through 4', () => {
    expect(date('2026-03-31').format('Q')).toBe('1');
    expect(date('2026-04-01').format('Q')).toBe('2');
    expect(date('2026-12-31').format('Q')).toBe('4');
  });

  it('prints M and D bare and MM and DD padded to two digits', () => {
    expect(date('2026-05-04').format('M/D')).toBe('5/4');
    expect(date('2026-05-04').format('MM/DD')).toBe('05/04');
  });

  it('prints MMM as the abbreviated month name and MMMM as the full one', () => {
    expect(friday.format('MMM', 'en-US')).toBe('Nov');
    expect(friday.format('MMMM', 'en-US')).toBe('November');
  });

  it('prints Do with the English ordinal suffix, including the teens', () => {
    const days = [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 24, 31];
    const ordinals = days.map((day) => date(2026, 1, day).format('Do', 'en-US'));
    expect(ordinals.join(' ')).toBe('1st 2nd 3rd 4th 11th 12th 13th 21st 22nd 23rd 24th 31st');
  });

  it('prints DDD as the day of the year and DDDD padded to three digits', () => {
    expect(date('2026-02-14').format('DDD')).toBe('45');
    expect(date('2026-02-14').format('DDDD')).toBe('045');
    expect(date('2024-12-31').format('DDD')).toBe('366');
  });
});

describe('weekday and week tokens', () => {
  it('prints d as the day of the week from 0 on Sunday through 6 on Saturday', () => {
    expect(date('2026-11-15').format('d')).toBe('0');
    expect(date('2026-11-16').format('d')).toBe('1');
    expect(date('2026-11-14').format('d')).toBe('6');
  });

  it('prints dd, ddd and dddd as the two-letter, abbreviated and full weekday name', () => {
    expect(date('2026-11-16').format('dd ddd dddd', 'en-US')).toBe('Mo Mon Monday');
  });

  it('prints W as the ISO week, which puts January 1, 2027 in week 53 of the year before', () => {
    expect(date('2027-01-01').format('W')).toBe('53');
    expect(date('2027-01-04').format('W')).toBe('1');
  });

  it('pads WW to two digits', () => {
    expect(date('2026-02-01').format('WW')).toBe('05');
  });
});

describe('clock tokens', () => {
  it('prints H, m and s bare and HH, mm and ss padded to two digits', () => {
    expect(standup.format('H:m:s')).toBe('9:5:8');
    expect(standup.format('HH:mm:ss')).toBe('09:05:08');
  });

  it('prints h on the 12-hour clock, where midnight and noon are both 12', () => {
    expect(time('00:05').format('h:mm A', 'en-US')).toBe('12:05 AM');
    expect(time('12:05').format('h:mm A', 'en-US')).toBe('12:05 PM');
    expect(time('13:05').format('hh:mm A', 'en-US')).toBe('01:05 PM');
  });

  it('prints A in capitals and a in lowercase in English', () => {
    expect(time('09:00').format('A a', 'en-US')).toBe('AM am');
    expect(time('15:00').format('A a', 'en-US')).toBe('PM pm');
  });

  it('prints S, SS and SSS as tenths, hundredths and milliseconds', () => {
    expect(standup.format('S SS SSS')).toBe('4 42 428');
    expect(time('09:00:00.007').format('S SS SSS')).toBe('0 00 007');
  });
});

describe('zone and timestamp tokens', () => {
  it('prints Z as the offset with a colon and ZZ without one', () => {
    expect(standup.format('Z ZZ')).toBe('-08:00 -0800');
    expect(datetime('2026-11-16T09:30', 'UTC').format('Z ZZ')).toBe('+00:00 +0000');
    expect(datetime('2026-11-16T09:30', 'Asia/Kolkata').format('Z')).toBe('+05:30');
  });

  it('prints z and zz as the short zone name and zzz and zzzz as the full one', () => {
    expect(standup.format('z', 'en-US')).toBe('PST');
    expect(standup.format('zz', 'en-US')).toBe('PST');
    expect(standup.format('zzz', 'en-US')).toBe('Pacific Standard Time');
    expect(standup.format('zzzz', 'en-US')).toBe('Pacific Standard Time');
  });

  it('names the zone as it stands on that date, daylight time in summer', () => {
    const july = datetime('2026-07-04T09:30', 'America/Los_Angeles');
    expect(july.format('z', 'en-US')).toBe('PDT');
    expect(july.format('Z')).toBe('-07:00');
  });

  it('prints X as whole seconds since 1970 and x as milliseconds', () => {
    const sent = datetime('2026-11-16T17:30:00.500Z', 'UTC');
    expect(sent.format('X')).toBe('1794850200');
    expect(sent.format('x')).toBe('1794850200500');
  });
});

describe('token patterns in other locales', () => {
  it('prints month and weekday names in the locale passed to the call', () => {
    expect(friday.format('dddd D MMMM YYYY', 'fr')).toBe('vendredi 6 novembre 2026');
    expect(friday.format('dddd, D. MMMM YYYY', 'de')).toBe('Freitag, 6. November 2026');
  });

  it('prints names in the locale the value carries, then in the configured one', () => {
    expect(friday.locale('es').format('dddd D [de] MMMM')).toBe('viernes 6 de noviembre');
    configure({ locale: 'pt-BR' });
    expect(friday.format('dddd, D [de] MMMM')).toBe('sexta-feira, 6 de novembro');
  });

  it('keeps Western digits and the Gregorian year where the locale writes its own', () => {
    const sent = datetime('2026-11-06T09:05', 'UTC');
    expect(sent.format('YYYY-MM-DD HH:mm', 'ar-EG')).toBe('2026-11-06 09:05');
    expect(sent.format('YYYY-MM-DD HH:mm', 'th')).toBe('2026-11-06 09:05');
    expect(sent.format('YYYY-MM-DD HH:mm', 'fa')).toBe('2026-11-06 09:05');
  });

  it('prints the Gregorian month name beside a Gregorian day where the locale has its own calendar', () => {
    expect(friday.format('D MMMM YYYY', 'fa')).toBe('6 نوامبر 2026');
  });

  it('gives the month the form it takes beside a day only straight after a day token', () => {
    expect(friday.format('D MMMM YYYY', 'ru')).toBe('6 ноября 2026');
    expect(friday.format('Do MMMM', 'ru')).toBe('6 ноября');
    expect(friday.format('MMMM YYYY', 'ru')).toBe('ноябрь 2026');
    expect(friday.format('D MMMM YYYY', 'el')).toBe('6 Νοεμβρίου 2026');
    expect(friday.format('MMMM YYYY', 'el')).toBe('Νοέμβριος 2026');
  });

  it('leaves the month alone when its ending is written in brackets by hand', () => {
    expect(friday.format('D. MMMM[ta] YYYY', 'fi')).toBe('6. marraskuuta 2026');
  });

  it('prints Do with the mark the locale puts after a day number instead of an English suffix', () => {
    expect(friday.format('Do MMMM', 'de')).toBe('6. November');
    expect(friday.format('M月Do', 'ja')).toBe('11月6日');
    expect(friday.format('Do MMMM', 'en-GB')).toBe('6th November');
  });

  it('prints A and a as the day period of the locale outside English', () => {
    expect(time('09:00').format('A h:mm', 'ja')).toBe('午前 9:00');
    expect(time('15:00').format('a h:mm', 'ja')).toBe('午後 3:00');
    expect(time('15:00').format('A h:mm', 'ko')).toBe('오후 3:00');
    expect(time('15:00').format('h:mm A', 'ar')).toBe('3:00 م');
  });

  it('prints dd as two letters where the language abbreviates that way and as its calendar letter elsewhere', () => {
    expect(friday.format('dd', 'de')).toBe('Fr');
    expect(friday.format('dd', 'ru')).toBe('пт');
    expect(friday.format('dd', 'pt-BR')).toBe('S');
    expect(friday.format('dd', 'ja')).toBe('金');
  });
});

describe('token patterns that cannot be printed', () => {
  it('throws unknownFormat at the pattern for a misspelled preset instead of printing its letters', () => {
    expect(() => standup.format('meduim')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'meduim' }),
    );
    expect(() => friday.format('iso')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'iso' }),
    );
  });

  it('throws unknownFormat for a literal word left outside brackets', () => {
    expect(() => standup.format('MMM D at h:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'MMM D at h:mm' }),
    );
  });

  it('throws unknownFormat for the lowercase year and day letters of other libraries', () => {
    expect(() => friday.format('yyyy-MM-dd')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'yyyy-MM-dd' }),
    );
  });

  it.todo('throws unknownFormat for a run of one letter longer than any token, such as SSSSSS or YYYYYY');

  it('throws unsupportedToken naming the token when a date is asked for the clock', () => {
    expect(() => friday.format('HH:mm')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: "HH in 'HH:mm'" }),
    );
  });

  it('throws unsupportedToken when a date is asked for an offset, a zone name or a timestamp', () => {
    for (const token of ['Z', 'z', 'X', 'x']) {
      expect(() => friday.format(token)).toThrowError(expect.objectContaining({ code: 'unsupportedToken' }));
    }
  });

  it('throws unsupportedToken when a time is asked for a year, a month, a day or a weekday', () => {
    for (const token of ['YYYY', 'MMMM', 'D', 'dddd', 'W', 'Z']) {
      expect(() => time('17:30').format(token)).toThrowError(
        expect.objectContaining({ code: 'unsupportedToken', at: `${token} in '${token}'` }),
      );
    }
  });

  it('throws unsupportedToken when a year-month is asked for a day and a month-day for a year', () => {
    expect(() => yearMonth('2026-11').format('YYYY-MM-DD')).toThrowError(
      expect.objectContaining({ code: 'unsupportedToken', at: "DD in 'YYYY-MM-DD'" }),
    );
    expect(() => monthDay('11-16').format('YYYY-MM-DD')).toThrowError(
      expect.objectContaining({ code: 'unsupportedToken', at: "YYYY in 'YYYY-MM-DD'" }),
    );
  });

  it('throws unsupportedToken when a value with no year is asked for a weekday or a day of the year', () => {
    for (const token of ['d', 'dddd', 'DDD', 'W']) {
      expect(() => monthDay('11-16').format(token)).toThrowError(expect.objectContaining({ code: 'unsupportedToken' }));
    }
  });

  it('throws unsupportedToken when a date range is asked for the clock', () => {
    expect(() => dateRange('2026-09-01', '2026-09-07').format('HH:mm')).toThrowError(
      expect.objectContaining({ code: 'unsupportedToken', at: "HH in 'HH:mm'" }),
    );
  });
});
