import { configure, date, datetime, days, time, timeRange, yearMonth } from 'native-dates';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ locale: null });
});

// allow \s* around range separators because ICU spacing differs across Node and Chromium
describe('format() and from() in Arabic locales (ar-EG, ar-MA, ar-SA)', () => {
  beforeEach(() => {
    configure({ locale: 'ar-EG' });
  });

  it('formats Duration days across Arabic dual, paucal, accusative, and hundred plural forms', () => {
    expect(days(1).text).toBe('يوم');
    expect(days(2).text).toBe('يومان');
    expect(days(5).text).toBe('٥ أيام');
    expect(days(11).text).toBe('١١ يومًا');
    expect(days(100).text).toBe('١٠٠ يوم');
  });

  it('formats long dates with Eastern Arabic digits in ar-EG and Western digits with Maghrebi months in ar-MA', () => {
    const day = date('2026-05-01');
    expect(day.format('long')).toBe('١ مايو ٢٠٢٦');
    expect(day.locale('ar-MA').format('long')).toBe('1 ماي 2026');
  });

  it('collapses shared month and year in a same-month DateRange', () => {
    const day = date('2026-05-01');
    expect(day.to(day.plus(4, 'days')).format('long')).toMatch(/^١\s*–\s*٥ مايو ٢٠٢٦$/);
  });

  it('converts dates to the Umm al-Qura calendar when the locale tag specifies -u-ca-islamic-umalqura', () => {
    const eid = date('2026-03-20').format('long', 'ar-SA-u-ca-islamic-umalqura');
    expect(eid).toContain('شوال');
    expect(eid).toContain('١٤٤٧');
  });

  it('keeps MonthDay on the Gregorian calendar in ar-EG', () => {
    expect(date('2026-05-01').monthDay.format('long')).toBe('١ مايو');
  });

  it('formats relative day phrases for yesterday and tomorrow', () => {
    const day = date('2026-05-01');
    expect(day.minus(1, 'day').from(day)).toBe('أمس');
    expect(day.plus(1, 'day').from(day)).toBe('غدًا');
  });
});

describe('format() and from() in Chinese locales (zh-CN, zh-TW)', () => {
  beforeEach(() => {
    configure({ locale: 'zh-CN' });
  });

  it('formats a full date with year, month, and day counters followed by the weekday', () => {
    expect(date('2026-02-17').format('full')).toBe('2026年2月17日星期二');
  });

  it('places the day period before the hour on a 12-hour clock', () => {
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    expect(date('2026-02-17').at('09:30', 'Asia/Shanghai').format(options)).toBe('上午9:30');
    expect(date('2026-02-17').at('14:30', 'Asia/Shanghai').format(options)).toBe('下午2:30');
  });

  it('formats MonthDay with month and day counters and no year', () => {
    expect(date('2026-02-17').monthDay.format('long')).toBe('2月17日');
  });

  it('formats Lunar New Year with stem-branch year and lunar month/day when the locale tag specifies -u-ca-chinese', () => {
    const lunar = date('2026-02-17').format('long', 'zh-CN-u-ca-chinese');
    expect(lunar).toContain('丙午');
    expect(lunar).toContain('正月初一');
  });

  it('formats years on the Minguo calendar when the locale tag specifies -u-ca-roc', () => {
    expect(date('2026-02-17').format('long', 'zh-TW-u-ca-roc')).toBe('民國115年2月17日');
  });

  it('formats relative day phrases for yesterday and tomorrow', () => {
    const day = date('2026-02-17');
    expect(day.minus(1, 'day').from(day)).toBe('昨天');
    expect(day.plus(1, 'day').from(day)).toBe('明天');
  });
});

describe('format() and from() in French locales (fr, fr-CA)', () => {
  beforeEach(() => {
    configure({ locale: 'fr' });
  });

  it('formats a full date in lowercase without a comma after the weekday', () => {
    expect(date('2026-05-15').format('full')).toBe('vendredi 15 mai 2026');
  });

  it('joins the date and 24-hour time with à in long format', () => {
    expect(date('2026-05-15').at('09:30', 'Europe/Paris').format('long')).toBe('15 mai 2026 à 09:30');
  });

  it('formats hours and minutes with h in fr-CA', () => {
    const montreal = date('2026-05-15').at('09:30', 'America/Montreal').locale('fr-CA');
    expect(montreal.format('long')).toMatch(/^15 mai 2026 à 09\sh\s30$/);
  });

  it('collapses shared month and year within a month and includes both months across a boundary', () => {
    const start = date('2026-05-15');
    expect(start.to(start.plus(4, 'days')).text).toMatch(/^15\s*–\s*19 mai 2026$/);
    expect(start.to(start.plus(20, 'days')).text).toMatch(/^15 mai\s*–\s*4 juin 2026$/);
  });

  it('formats relative day phrases for two days ago, yesterday, and tomorrow', () => {
    const day = date('2026-05-15');
    expect(day.minus(2, 'days').from(day)).toBe('avant-hier');
    expect(day.minus(1, 'day').from(day)).toBe('hier');
    expect(day.plus(1, 'day').from(day)).toBe('demain');
  });
});

describe('format() and from() in German (de)', () => {
  beforeEach(() => {
    configure({ locale: 'de' });
  });

  it('formats a full date with capitalized weekday and month and an ordinal period after the day', () => {
    expect(date('2026-05-01').format('full')).toBe('Freitag, 1. Mai 2026');
  });

  it('formats .text as a zero-padded DD.MM.YYYY numeric date', () => {
    expect(date('2026-05-01').text).toBe('01.05.2026');
  });

  it('joins the date and 24-hour time with um in long format', () => {
    expect(datetime('2026-11-23T09:30', 'Europe/Berlin').format('long')).toBe('23. November 2026 um 09:30');
  });

  it('preserves ordinal periods on both days of a formatted DateRange', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^1\.\s*–\s*5\. Mai 2026$/);
    expect(start.to(start.plus(35, 'days')).format('long')).toMatch(/^1\. Mai\s*–\s*5\. Juni 2026$/);
  });

  it('formats ISO week token W with 2027-01-01 in week 53', () => {
    expect(`KW ${date('2027-01-01').format('W')}`).toBe('KW 53');
    expect(`KW ${date('2027-01-04').format('W')}`).toBe('KW 1');
  });

  it('formats relative day phrases for two days ago, yesterday, and in two days', () => {
    const day = date('2026-05-01');
    expect(day.minus(2, 'days').from(day)).toBe('vorgestern');
    expect(day.minus(1, 'day').from(day)).toBe('gestern');
    expect(day.plus(2, 'days').from(day)).toBe('übermorgen');
  });
});

describe('format() and from() in Japanese (ja)', () => {
  beforeEach(() => {
    configure({ locale: 'ja' });
  });

  it('formats a full date with unpadded numbers, kanji counters, and trailing weekday', () => {
    expect(date('2026-05-01').format('full')).toBe('2026年5月1日金曜日');
  });

  it('formats YearMonth.text without a day counter', () => {
    expect(date('2026-05-01').yearMonth.text).toBe('2026年5月');
  });

  it('formats long DateTime with a space between date and time', () => {
    expect(datetime('2026-11-16T09:30', 'Asia/Tokyo').format('long')).toBe('2026年11月16日 9:30');
  });

  it('formats imperial era years with 元年 for year 1 when the locale tag specifies -u-ca-japanese', () => {
    expect(date('2019-04-30').format('long', 'ja-u-ca-japanese')).toBe('平成31年4月30日');
    expect(date('2019-05-01').format('long', 'ja-u-ca-japanese')).toBe('令和元年5月1日');
    expect(date('2026-05-01').format('long', 'ja-u-ca-japanese')).toBe('令和8年5月1日');
  });

  it('joins DateRange endpoints with a wave dash in .text', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).text).toMatch(/^2026\/05\/01\s*～\s*2026\/05\/05$/);
  });

  it('joins overnight TimeRange endpoints with a wave dash and omits date counters', () => {
    const shift = timeRange('22:00', '06:00').text;
    expect(shift).toMatch(/^22\D+00\D*～\s*6\D+00\D*$/);
    expect(shift).not.toMatch(/[年月日]/);
  });

  it('formats relative day phrases for yesterday and tomorrow', () => {
    const day = date('2026-05-01');
    expect(day.minus(1, 'day').from(day)).toBe('昨日');
    expect(day.plus(1, 'day').from(day)).toBe('明日');
  });
});

describe('format() and from() in Korean (ko)', () => {
  beforeEach(() => {
    configure({ locale: 'ko' });
  });

  it('formats a full date with spaces after year, month, and day counters', () => {
    expect(date('2026-05-01').format('full')).toBe('2026년 5월 1일 금요일');
  });

  it('collapses shared year and month within a month and includes the end month across a boundary', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^2026년 5월 1일\s*~\s*5일$/);
    expect(start.to(start.plus(35, 'days')).format('long')).toMatch(/^2026년 5월 1일\s*~\s*6월 5일$/);
  });

  it('places the day period before the hour on a 12-hour clock', () => {
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    expect(time('09:30').format(options)).toBe('오전 9:30');
    expect(time('14:30').format(options)).toBe('오후 2:30');
  });

  it('formats YearMonth.text without a day counter', () => {
    expect(date('2026-05-01').yearMonth.text).toBe('2026년 5월');
  });

  it('formats relative day phrases for yesterday and tomorrow', () => {
    const day = date('2026-05-01');
    expect(day.minus(1, 'day').from(day)).toBe('어제');
    expect(day.plus(1, 'day').from(day)).toBe('내일');
  });
});

describe('format() and from() in Brazilian Portuguese (pt-BR)', () => {
  beforeEach(() => {
    configure({ locale: 'pt-BR' });
  });

  it('formats a full DateTime with hyphenated weekday, de before month and year, and às before time', () => {
    const friday = date('2026-05-15').at('09:30', 'America/Sao_Paulo');
    const sunday = date('2026-05-17').at('09:30', 'America/Sao_Paulo');
    expect(friday.format('full')).toBe('sexta-feira, 15 de maio de 2026 às 09:30');
    expect(sunday.format('full')).toBe('domingo, 17 de maio de 2026 às 09:30');
  });

  it('collapses shared month and year within a month and includes both months across a boundary', () => {
    const start = date('2026-05-15');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^15\s*–\s*19 de maio de 2026$/);
    expect(start.to(start.plus(20, 'days')).format('long')).toMatch(/^15 de maio\s*–\s*4 de junho de 2026$/);
  });

  it('includes de between month and year on YearMonth', () => {
    expect(date('2026-05-15').yearMonth.format('long')).toBe('maio de 2026');
  });

  it('formats relative day phrases for two days ago, yesterday, and tomorrow', () => {
    const day = date('2026-05-15');
    expect(day.minus(2, 'days').from(day)).toBe('anteontem');
    expect(day.minus(1, 'day').from(day)).toBe('ontem');
    expect(day.plus(1, 'day').from(day)).toBe('amanhã');
  });
});

describe('format() and from() in Russian (ru)', () => {
  beforeEach(() => {
    configure({ locale: 'ru' });
  });

  it('formats nominative month names on YearMonth and genitive month names on CalendarDate', () => {
    expect(yearMonth('2026-05').text).toBe('май 2026 г.');
    expect(date('2026-05-01').text).toBe('1 мая 2026 г.');
    expect(yearMonth('2026-03').format('long')).toBe('март 2026 г.');
    expect(date('2026-03-01').format('long')).toBe('1 марта 2026 г.');
    expect(date('2026-08-01').format('long')).toBe('1 августа 2026 г.');
  });

  it('formats the shared month once in the genitive case for a same-month DateRange', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).text).toMatch(/^1\s*–\s*5 мая 2026 г\.$/);
  });

  it('declines Duration days across singular, paucal, and genitive plural forms including teens', () => {
    expect(days(1).text).toBe('1 день');
    expect(days(2).text).toBe('2 дня');
    expect(days(5).text).toBe('5 дней');
    expect(days(11).text).toBe('11 дней');
    expect(days(21).text).toBe('21 день');
  });

  it('formats relative day phrases for two days ago, yesterday, and tomorrow', () => {
    const day = date('2026-05-01');
    expect(day.minus(2, 'days').from(day)).toBe('позавчера');
    expect(day.minus(1, 'day').from(day)).toBe('вчера');
    expect(day.plus(1, 'day').from(day)).toBe('завтра');
  });
});

describe('format() and from() in Spanish (es)', () => {
  beforeEach(() => {
    configure({ locale: 'es' });
  });

  it('formats full and long dates in lowercase with de before month and year', () => {
    expect(date('2026-05-01').format('full')).toBe('viernes, 1 de mayo de 2026');
    expect(date('2026-05-15').format('long')).toBe('15 de mayo de 2026');
  });

  it('collapses shared month and year within a month and includes both months across a boundary', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^1\s*–\s*5 de mayo de 2026$/);
    expect(start.to(start.plus(35, 'days')).format('long')).toMatch(/^1 de mayo\s*–\s*5 de junio de 2026$/);
  });

  it('includes de between month and year on YearMonth', () => {
    expect(date('2026-05-01').yearMonth.format('long')).toBe('mayo de 2026');
  });

  it('pluralizes Duration day units', () => {
    expect(days(1).text).toBe('1 día');
    expect(days(2).text).toBe('2 días');
  });

  it('formats relative hour and day phrases including anteayer, ayer, and mañana', () => {
    const noon = datetime('2026-05-01T12:00', 'Europe/Madrid');
    const day = date('2026-05-01');
    expect(noon.minus(3, 'hours').from(noon)).toBe('hace 3 horas');
    expect(day.minus(2, 'days').from(day)).toBe('anteayer');
    expect(day.minus(1, 'day').from(day)).toBe('ayer');
    expect(day.plus(1, 'day').from(day)).toBe('mañana');
  });
});
