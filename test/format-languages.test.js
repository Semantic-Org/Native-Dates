import { configure, date, datetime, days, time, timeRange, yearMonth } from 'native-dates';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ locale: null });
});

// \s* around the dash of a range, where ICU versions differ: Node 26 prints 1일~5일 and Chromium 159 prints 1일 ~ 5일
describe('Arabic', () => {
  beforeEach(() => {
    configure({ locale: 'ar-EG' });
  });

  it('writes a duration of days in each of the plural forms, with no digit for one and two', () => {
    expect(days(1).text).toBe('يوم');
    expect(days(2).text).toBe('يومان');
    expect(days(5).text).toBe('٥ أيام');
    expect(days(11).text).toBe('١١ يومًا');
    expect(days(100).text).toBe('١٠٠ يوم');
  });

  it('writes presets in Eastern Arabic digits for Egypt and in Western digits and Maghrebi months for Morocco', () => {
    const day = date('2026-05-01');
    expect(day.format('long')).toBe('١ مايو ٢٠٢٦');
    expect(day.locale('ar-MA').format('long')).toBe('1 ماي 2026');
  });

  it('collapses a date range inside one month', () => {
    const day = date('2026-05-01');
    expect(day.to(day.plus(4, 'days')).format('long')).toMatch(/^١\s*–\s*٥ مايو ٢٠٢٦$/);
  });

  it('converts a date to the Umm al-Qura calendar when the tag passed to the call asks for it', () => {
    const eid = date('2026-03-20').format('long', 'ar-SA-u-ca-islamic-umalqura');
    expect(eid).toContain('شوال');
    expect(eid).toContain('١٤٤٧');
  });

  it('keeps a month-day on the Gregorian calendar beside a Hijri date', () => {
    expect(date('2026-05-01').monthDay.format('long')).toBe('١ مايو');
  });

  it('says yesterday and tomorrow in Arabic', () => {
    const day = date('2026-05-01');
    expect(day.minus(1, 'day').from(day)).toBe('أمس');
    expect(day.plus(1, 'day').from(day)).toBe('غدًا');
  });
});

describe('Chinese', () => {
  beforeEach(() => {
    configure({ locale: 'zh-CN' });
  });

  it('writes a full date with its counters and the weekday last', () => {
    expect(date('2026-02-17').format('full')).toBe('2026年2月17日星期二');
  });

  it('puts the day period before the hour on a 12-hour clock', () => {
    const bag = { hour: 'numeric', minute: '2-digit', hour12: true };
    expect(date('2026-02-17').at('09:30', 'Asia/Shanghai').format(bag)).toBe('上午9:30');
    expect(date('2026-02-17').at('14:30', 'Asia/Shanghai').format(bag)).toBe('下午2:30');
  });

  it('writes a month-day with its counters and no year', () => {
    expect(date('2026-02-17').monthDay.format('long')).toBe('2月17日');
  });

  it('writes the lunar new year as the first day of the first month of a stem-branch year', () => {
    const lunar = date('2026-02-17').format('long', 'zh-CN-u-ca-chinese');
    expect(lunar).toContain('丙午');
    expect(lunar).toContain('正月初一');
  });

  it('counts the year on the Minguo calendar when the tag passed to the call asks for it', () => {
    expect(date('2026-02-17').format('long', 'zh-TW-u-ca-roc')).toBe('民國115年2月17日');
  });

  it('says yesterday and tomorrow in Chinese', () => {
    const day = date('2026-02-17');
    expect(day.minus(1, 'day').from(day)).toBe('昨天');
    expect(day.plus(1, 'day').from(day)).toBe('明天');
  });
});

describe('French', () => {
  beforeEach(() => {
    configure({ locale: 'fr' });
  });

  it('writes a full date in lowercase with no comma after the weekday', () => {
    expect(date('2026-05-15').format('full')).toBe('vendredi 15 mai 2026');
  });

  it('joins the date and the 24-hour clock with à', () => {
    expect(date('2026-05-15').at('09:30', 'Europe/Paris').format('long')).toBe('15 mai 2026 à 09:30');
  });

  it('writes the clock with an h for a value that carries the locale of Québec', () => {
    const montreal = date('2026-05-15').at('09:30', 'America/Montreal').locale('fr-CA');
    expect(montreal.format('long')).toMatch(/^15 mai 2026 à 09\sh\s30$/);
  });

  it('writes the month and year of a range once inside a month and both months across two', () => {
    const start = date('2026-05-15');
    expect(start.to(start.plus(4, 'days')).text).toMatch(/^15\s*–\s*19 mai 2026$/);
    expect(start.to(start.plus(20, 'days')).text).toMatch(/^15 mai\s*–\s*4 juin 2026$/);
  });

  it('says the day before yesterday, yesterday and tomorrow in French', () => {
    const day = date('2026-05-15');
    expect(day.minus(2, 'days').from(day)).toBe('avant-hier');
    expect(day.minus(1, 'day').from(day)).toBe('hier');
    expect(day.plus(1, 'day').from(day)).toBe('demain');
  });
});

describe('German', () => {
  beforeEach(() => {
    configure({ locale: 'de' });
  });

  it('writes a full date with a capitalized weekday and month and a period after the day', () => {
    expect(date('2026-05-01').format('full')).toBe('Freitag, 1. Mai 2026');
  });

  it('writes text as the zero-padded numeric date', () => {
    expect(date('2026-05-01').text).toBe('01.05.2026');
  });

  it('joins the date and the 24-hour clock with um', () => {
    expect(datetime('2026-11-23T09:30', 'Europe/Berlin').format('long')).toBe('23. November 2026 um 09:30');
  });

  it('keeps the period after both days of a range', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^1\.\s*–\s*5\. Mai 2026$/);
    expect(start.to(start.plus(35, 'days')).format('long')).toMatch(/^1\. Mai\s*–\s*5\. Juni 2026$/);
  });

  it('prints the ISO calendar week, which keeps January 1, 2027 in week 53', () => {
    expect(`KW ${date('2027-01-01').format('W')}`).toBe('KW 53');
    expect(`KW ${date('2027-01-04').format('W')}`).toBe('KW 1');
  });

  it('says the day before yesterday, yesterday and the day after tomorrow in German', () => {
    const day = date('2026-05-01');
    expect(day.minus(2, 'days').from(day)).toBe('vorgestern');
    expect(day.minus(1, 'day').from(day)).toBe('gestern');
    expect(day.plus(2, 'days').from(day)).toBe('übermorgen');
  });
});

describe('Japanese', () => {
  beforeEach(() => {
    configure({ locale: 'ja' });
  });

  it('writes a full date with unpadded numbers, kanji counters and the weekday last', () => {
    expect(date('2026-05-01').format('full')).toBe('2026年5月1日金曜日');
  });

  it('writes a year-month without a day counter', () => {
    expect(date('2026-05-01').yearMonth.text).toBe('2026年5月');
  });

  it('writes the date before the clock with no connecting word', () => {
    expect(datetime('2026-11-16T09:30', 'Asia/Tokyo').format('long')).toBe('2026年11月16日 9:30');
  });

  it('counts the year by imperial era when the tag passed to the call asks for it, with 元年 for year one', () => {
    expect(date('2019-04-30').format('long', 'ja-u-ca-japanese')).toBe('平成31年4月30日');
    expect(date('2019-05-01').format('long', 'ja-u-ca-japanese')).toBe('令和元年5月1日');
    expect(date('2026-05-01').format('long', 'ja-u-ca-japanese')).toBe('令和8年5月1日');
  });

  it('joins the ends of a date range with the wave dash', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).text).toMatch(/^2026\/05\/01\s*～\s*2026\/05\/05$/);
  });

  it('joins the ends of an overnight time range with the wave dash and prints no date', () => {
    const shift = timeRange('22:00', '06:00').text;
    expect(shift).toMatch(/^22\D+00\D*～\s*6\D+00\D*$/);
    expect(shift).not.toMatch(/[年月日]/);
  });

  it('says yesterday and tomorrow in Japanese', () => {
    const day = date('2026-05-01');
    expect(day.minus(1, 'day').from(day)).toBe('昨日');
    expect(day.plus(1, 'day').from(day)).toBe('明日');
  });
});

describe('Korean', () => {
  beforeEach(() => {
    configure({ locale: 'ko' });
  });

  it('writes a full date with a space after each counter', () => {
    expect(date('2026-05-01').format('full')).toBe('2026년 5월 1일 금요일');
  });

  it('writes the year and month of a range once inside a month and the end month across two', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^2026년 5월 1일\s*~\s*5일$/);
    expect(start.to(start.plus(35, 'days')).format('long')).toMatch(/^2026년 5월 1일\s*~\s*6월 5일$/);
  });

  it('puts the day period before the hour on a 12-hour clock', () => {
    const bag = { hour: 'numeric', minute: '2-digit', hour12: true };
    expect(time('09:30').format(bag)).toBe('오전 9:30');
    expect(time('14:30').format(bag)).toBe('오후 2:30');
  });

  it('writes a year-month without a day counter', () => {
    expect(date('2026-05-01').yearMonth.text).toBe('2026년 5월');
  });

  it('says yesterday and tomorrow in Korean', () => {
    const day = date('2026-05-01');
    expect(day.minus(1, 'day').from(day)).toBe('어제');
    expect(day.plus(1, 'day').from(day)).toBe('내일');
  });
});

describe('Portuguese', () => {
  beforeEach(() => {
    configure({ locale: 'pt-BR' });
  });

  it('writes a full moment with a hyphenated weekday, de before the month and year, and às before the hour', () => {
    const friday = date('2026-05-15').at('09:30', 'America/Sao_Paulo');
    const sunday = date('2026-05-17').at('09:30', 'America/Sao_Paulo');
    expect(friday.format('full')).toBe('sexta-feira, 15 de maio de 2026 às 09:30');
    expect(sunday.format('full')).toBe('domingo, 17 de maio de 2026 às 09:30');
  });

  it('writes the month and year of a range once inside a month and both months across two', () => {
    const start = date('2026-05-15');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^15\s*–\s*19 de maio de 2026$/);
    expect(start.to(start.plus(20, 'days')).format('long')).toMatch(/^15 de maio\s*–\s*4 de junho de 2026$/);
  });

  it('keeps de between the month and the year of a year-month', () => {
    expect(date('2026-05-15').yearMonth.format('long')).toBe('maio de 2026');
  });

  it('says the day before yesterday, yesterday and tomorrow in Portuguese', () => {
    const day = date('2026-05-15');
    expect(day.minus(2, 'days').from(day)).toBe('anteontem');
    expect(day.minus(1, 'day').from(day)).toBe('ontem');
    expect(day.plus(1, 'day').from(day)).toBe('amanhã');
  });
});

describe('Russian', () => {
  beforeEach(() => {
    configure({ locale: 'ru' });
  });

  it('names the month in the nominative on a year-month and in the genitive on a full date', () => {
    expect(yearMonth('2026-05').text).toBe('май 2026 г.');
    expect(date('2026-05-01').text).toBe('1 мая 2026 г.');
    expect(yearMonth('2026-03').format('long')).toBe('март 2026 г.');
    expect(date('2026-03-01').format('long')).toBe('1 марта 2026 г.');
    expect(date('2026-08-01').format('long')).toBe('1 августа 2026 г.');
  });

  it('writes the genitive month and the year of a range once', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).text).toMatch(/^1\s*–\s*5 мая 2026 г\.$/);
  });

  it('declines a duration of days by the three plural forms, with the teens taking the genitive plural', () => {
    expect(days(1).text).toBe('1 день');
    expect(days(2).text).toBe('2 дня');
    expect(days(5).text).toBe('5 дней');
    expect(days(11).text).toBe('11 дней');
    expect(days(21).text).toBe('21 день');
  });

  it('says the day before yesterday, yesterday and tomorrow in Russian', () => {
    const day = date('2026-05-01');
    expect(day.minus(2, 'days').from(day)).toBe('позавчера');
    expect(day.minus(1, 'day').from(day)).toBe('вчера');
    expect(day.plus(1, 'day').from(day)).toBe('завтра');
  });
});

describe('Spanish', () => {
  beforeEach(() => {
    configure({ locale: 'es' });
  });

  it('writes a full date in lowercase with de before the month and the year', () => {
    expect(date('2026-05-01').format('full')).toBe('viernes, 1 de mayo de 2026');
    expect(date('2026-05-15').format('long')).toBe('15 de mayo de 2026');
  });

  it('writes the month and year of a range once inside a month and both months across two', () => {
    const start = date('2026-05-01');
    expect(start.to(start.plus(4, 'days')).format('long')).toMatch(/^1\s*–\s*5 de mayo de 2026$/);
    expect(start.to(start.plus(35, 'days')).format('long')).toMatch(/^1 de mayo\s*–\s*5 de junio de 2026$/);
  });

  it('keeps de between the month and the year of a year-month', () => {
    expect(date('2026-05-01').yearMonth.format('long')).toBe('mayo de 2026');
  });

  it('writes a duration with the plural of the unit', () => {
    expect(days(1).text).toBe('1 día');
    expect(days(2).text).toBe('2 días');
  });

  it('says how long ago, the day before yesterday, yesterday and tomorrow in Spanish', () => {
    const noon = datetime('2026-05-01T12:00', 'Europe/Madrid');
    const day = date('2026-05-01');
    expect(noon.minus(3, 'hours').from(noon)).toBe('hace 3 horas');
    expect(day.minus(2, 'days').from(day)).toBe('anteayer');
    expect(day.minus(1, 'day').from(day)).toBe('ayer');
    expect(day.plus(1, 'day').from(day)).toBe('mañana');
  });
});
