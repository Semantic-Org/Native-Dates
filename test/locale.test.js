import {
  CalendarDate,
  compare,
  configure,
  date,
  DateRange,
  dateRange,
  DateTime,
  datetime,
  DateTimeRange,
  datetimeRange,
  days,
  Duration,
  duration,
  hours,
  MonthDay,
  monthDay,
  months,
  Time,
  time,
  TimeRange,
  timeRange,
  YearMonth,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

// the configured locale belongs to the whole process, so each test hands the default back
afterEach(() => {
  configure({ locale: null });
});

// points() and split() return lists, so every value in one is read
const localesOf = (made) => new Set([made].flat().map((value) => value.locale()));

const kinds = [
  ['DateTime', DateTime, () => datetime('2026-05-15T14:30:00Z', 'UTC')],
  ['CalendarDate', CalendarDate, () => date('2026-05-15')],
  ['Time', Time, () => time('17:30')],
  ['Duration', Duration, () => hours(2)],
  ['YearMonth', YearMonth, () => yearMonth('2026-05')],
  ['MonthDay', MonthDay, () => monthDay(5, 15)],
  ['DateRange', DateRange, () => dateRange('2026-05-15', '2026-05-19')],
  ['DateTimeRange', DateTimeRange, () => datetimeRange('2026-05-15T09:00', '2026-05-15T10:00', 'UTC')],
  ['TimeRange', TimeRange, () => timeRange('09:00', '17:00')],
];

describe.each(kinds)('locale() and lang() on a %s', (name, Kind, make) => {
  it('return a copy carrying the tag and leave the original without one', () => {
    const plain = make();
    const french = plain.locale('fr');
    expect(french).toBeInstanceOf(Kind);
    expect(french.locale()).toBe('fr');
    expect(plain.locale()).toBeUndefined();
  });

  it('read and write the same tag under either name', () => {
    expect(make().lang('fr').locale()).toBe('fr');
    expect(make().locale('fr').lang()).toBe('fr');
  });

  // an empty column in a database must not break a chain like value.locale(user.locale).format()
  it.each([['null', null], ['undefined', undefined], ['an empty string', '']])(
    'clear the tag and still return a value of the same kind when passed %s',
    (label, empty) => {
      const cleared = make().locale('fr').locale(empty);
      expect(cleared).toBeInstanceOf(Kind);
      expect(cleared.locale()).toBeUndefined();
    },
  );
});

describe('a locale carried on a value', () => {
  it('prints the value in that language', () => {
    expect(date('2026-05-15').locale('fr-FR').format('long')).toContain('mai');
    expect(date('2026-05-15').locale('de-DE').format('long')).toContain('Mai');
  });

  it('is left out of equals(), compare(), toString() and JSON', () => {
    const french = date('2026-05-15').locale('fr');
    const japanese = date('2026-05-15').locale('ja');
    expect(french.equals(japanese)).toBe(true);
    expect(compare(french, japanese)).toBe(0);
    expect(french.toString()).toBe('2026-05-15');
    expect(JSON.stringify({ day: french })).toBe('{"day":"2026-05-15"}');
  });
});

describe('locale() given a locale as a server or a browser hands it over', () => {
  const day = date('2026-05-15');

  it.each([
    ['en_US', 'en-US'],
    ['pt_BR', 'pt-BR'],
    ['zh_Hans_CN', 'zh-Hans-CN'],
  ])('reads the underscore tag %s as %s', (given, read) => {
    expect(day.locale(given).locale()).toBe(read);
  });

  it('reads an Accept-Language header as its languages from the heaviest weight down, without those at q=0', () => {
    expect(day.locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale()).toEqual(['de', 'fr-CH']);
  });

  it('prints in the first language of the header a browser sends', () => {
    const reader = day.locale('de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7');
    expect(reader.locale()).toEqual(['de-DE', 'de', 'en-US', 'en']);
    expect(reader.format('MMMM')).toBe('Mai');
  });

  it('keeps the order written for languages of equal weight', () => {
    expect(day.locale('en;q=0.5, fr;q=0.5').locale()).toEqual(['en', 'fr']);
  });

  it('leaves the * wildcard out of a header that also names languages', () => {
    expect(day.locale('fr-CH, fr;q=0.9, *;q=0.5').locale()).toEqual(['fr-CH', 'fr']);
  });

  it('takes a list of tags such as navigator.languages', () => {
    const reader = day.locale(Object.freeze(['de-AT', 'de', 'en']));
    expect(reader.locale()).toEqual(['de-AT', 'de', 'en']);
    expect(reader.format('MMMM')).toBe('Mai');
  });

  it('prints in the next language listed when the runtime has no data for the first', () => {
    expect(day.locale(['xx', 'fr']).format('MMMM')).toBe('mai');
    expect(day.locale('xx, fr;q=0.9').format('MMMM')).toBe('mai');
  });

  it('reads back a form Intl takes as it is', () => {
    const grouped = (given) => new Intl.NumberFormat(day.locale(given).locale()).format(1234.5);
    expect(grouped('de_DE')).toBe('1.234,5');
    expect(grouped('de-DE,de;q=0.9,en;q=0.8')).toBe('1.234,5');
  });

  it('throws unknownLocale at the text when it is neither a tag nor a header', () => {
    expect(() => day.locale('not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });

  it.todo('falls back to the configured locale when a header names no language, such as *');
});

describe('{ locale } passed to a factory', () => {
  it.each([
    ['date()', () => date('2026-05-15', { locale: 'fr' })],
    ['datetime()', () => datetime('2026-05-15T14:30:00Z', { zone: 'UTC', locale: 'fr' })],
    ['time()', () => time('17:30', { locale: 'fr' })],
    ['duration()', () => duration('2h', { locale: 'fr' })],
    ['yearMonth()', () => yearMonth('2026-05', { locale: 'fr' })],
    ['monthDay()', () => monthDay('05-15', { locale: 'fr' })],
    ['dateRange()', () => dateRange('2026-05-15', '2026-05-19', { locale: 'fr' })],
    ['datetimeRange()', () => datetimeRange('2026-05-15T09:00', '2026-05-15T10:00', { zone: 'UTC', locale: 'fr' })],
    ['timeRange()', () => timeRange('09:00', '17:00', { locale: 'fr' })],
  ])('is carried by the value %s returns', (name, make) => {
    expect(make().locale()).toBe('fr');
  });

  it('is read in the forms locale() reads', () => {
    expect(date('2026-05-15', { locale: 'en_US' }).locale()).toBe('en-US');
    expect(date('2026-05-15', { locale: 'fr-CH;q=0.8, de;q=0.9' }).locale()).toEqual(['de', 'fr-CH']);
  });

  it('replaces the locale of a value the factory is given', () => {
    const french = datetime('2026-05-15T14:30:00Z', { zone: 'UTC', locale: 'fr' });
    expect(datetime(french, { locale: 'de' }).locale()).toBe('de');
    expect(date(french, { locale: 'de' }).locale()).toBe('de');
  });

  it('throws unknownLocale at the text when it is not a locale', () => {
    expect(() => date('2026-05-15', { locale: 'not a locale' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('a locale carried on a DateTime', () => {
  const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr');
  const christmas = monthDay(12, 25);

  it('prints values made from it in that locale', () => {
    expect(arrival.plus(3, 'days').date.format('long')).toContain('mai');
  });

  it.each([
    ['plus()', () => arrival.plus(3, 'days')],
    ['minus()', () => arrival.minus('2h')],
    ['add()', () => arrival.add({ weeks: 1 })],
    ['subtract()', () => arrival.subtract(hours(2))],
    ['set()', () => arrival.set({ hour: 9 })],
    ['at()', () => arrival.at('5pm')],
    ['in()', () => arrival.in('Asia/Tokyo')],
    ['startOf()', () => arrival.startOf('month')],
    ["startOf('week')", () => arrival.startOf('week')],
    ['endOf()', () => arrival.endOf('month')],
    ['round()', () => arrival.round('hour')],
    ['floor()', () => arrival.floor(15, 'minutes')],
    ['ceil()', () => arrival.ceil('hour')],
    ['next() to a weekday', () => arrival.next('friday')],
    ['previous() to a weekday', () => arrival.previous('friday')],
    ['next() to a MonthDay', () => arrival.next(christmas)],
    ['previous() to a MonthDay', () => arrival.previous(christmas)],
    ['the date property', () => arrival.date],
    ['the time property', () => arrival.time],
    ['the yearMonth property', () => arrival.yearMonth],
    ['the monthDay property', () => arrival.monthDay],
    ["as('date')", () => arrival.as('date')],
    ["as('time')", () => arrival.as('time')],
    ["as('yearMonth')", () => arrival.as('yearMonth')],
    ["as('monthDay')", () => arrival.as('monthDay')],
    ['to()', () => arrival.to('2026-05-16T14:30:00Z')],
    ['for()', () => arrival.for(90, 'minutes')],
    ['range()', () => arrival.range('day')],
    ['until()', () => arrival.until('2026-05-16T14:30:00Z')],
    ['since()', () => arrival.since('2026-05-14T14:30:00Z')],
    ['datetime() given it and a zone', () => datetime(arrival, 'UTC')],
    ['date() given it', () => date(arrival)],
    ['time() given it', () => time(arrival)],
    ['yearMonth() given it', () => yearMonth(arrival)],
    ['monthDay() given it', () => monthDay(arrival)],
  ])('is kept by %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('a locale carried on a CalendarDate', () => {
  const trip = date('2026-05-15').locale('fr');
  const christmas = monthDay(12, 25);

  it.each([
    ['plus()', () => trip.plus(3, 'days')],
    ['minus()', () => trip.minus({ months: 1 })],
    ['add()', () => trip.add(days(2))],
    ['subtract()', () => trip.subtract(1, 'week')],
    ['set()', () => trip.set('month', 6)],
    ['startOf()', () => trip.startOf('month')],
    ["startOf('week')", () => trip.startOf('week')],
    ["startOf('day')", () => trip.startOf('day')],
    ['endOf()', () => trip.endOf('month')],
    ['next() to a weekday', () => trip.next('friday')],
    ['previous() to a weekday', () => trip.previous('friday')],
    ['next() to a MonthDay', () => trip.next(christmas)],
    ['previous() to a MonthDay', () => trip.previous(christmas)],
    ['at()', () => trip.at('9am', 'Europe/Paris')],
    ["as('datetime')", () => trip.as('datetime', 'UTC')],
    ['the yearMonth property', () => trip.yearMonth],
    ['the monthDay property', () => trip.monthDay],
    ["as('yearMonth')", () => trip.as('yearMonth')],
    ["as('monthDay')", () => trip.as('monthDay')],
    ['to()', () => trip.to('2026-05-19')],
    ['for()', () => trip.for(2, 'weeks')],
    ['through()', () => trip.through('2026-05-19')],
    ['range()', () => trip.range('month')],
    ['points()', () => trip.points(6, 'hours', 'UTC')],
    ['split()', () => trip.split(6, 'hours', 'UTC')],
    ['until()', () => trip.until('2026-06-15')],
    ['since()', () => trip.since('2026-04-15')],
    ['date() given it and a zone', () => date(trip, 'UTC')],
    ['datetime() given it', () => datetime(trip, 'UTC')],
    ['yearMonth() given it', () => yearMonth(trip)],
    ['monthDay() given it', () => monthDay(trip)],
  ])('is kept by %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('a locale carried on a Time', () => {
  const closing = time('17:30').locale('fr');

  it.each([
    ['plus()', () => closing.plus(2, 'hours')],
    ['minus()', () => closing.minus('30m')],
    ['add()', () => closing.add({ minutes: 5 })],
    ['subtract()', () => closing.subtract(1, 'hour')],
    ['set()', () => closing.set('minute', 0)],
    ['startOf()', () => closing.startOf('hour')],
    ['endOf()', () => closing.endOf('hour')],
    ['round()', () => closing.round('hour')],
    ['floor()', () => closing.floor(15, 'minutes')],
    ['ceil()', () => closing.ceil('hour')],
    ['to()', () => closing.to('18:00')],
    ['for()', () => closing.for(2, 'hours')],
    ['until()', () => closing.until('18:00')],
    ['since()', () => closing.since('09:00')],
    ['on()', () => closing.on('2026-05-01', 'Asia/Seoul')],
    ['time() given it', () => time(closing)],
  ])('is kept by %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('a locale carried on a Duration', () => {
  const wait = duration('1h 30m').locale('fr');
  const measured = date('2026-01-31').locale('fr').until('2026-03-15');

  it.each([
    ['plus()', () => wait.plus('30m')],
    ['minus()', () => wait.minus(10, 'minutes')],
    ['add()', () => wait.add(hours(1))],
    ['subtract()', () => wait.subtract(hours(1))],
    ['times()', () => wait.times(2)],
    ['negated()', () => wait.negated()],
    ['abs()', () => wait.negated().abs()],
    ['round()', () => wait.round('hour')],
    ['balance()', () => wait.balance()],
    ["balance('week')", () => days(10).locale('fr').balance('week')],
    ["balance('year')", () => months(18).locale('fr').balance('year')],
    ['balance() of a measured length', () => measured.balance('day')],
    ['round() of a measured length', () => measured.round('month')],
    ['duration() given it', () => duration(wait)],
  ])('is kept by %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('a locale carried on a YearMonth', () => {
  const billing = yearMonth('2026-05').locale('fr');

  it.each([
    ['plus()', () => billing.plus(1, 'month')],
    ['minus()', () => billing.minus({ years: 1 })],
    ['add()', () => billing.add(2, 'months')],
    ['subtract()', () => billing.subtract(2, 'months')],
    ['set()', () => billing.set('month', 1)],
    ['on()', () => billing.on(15)],
    ['the start property', () => billing.start],
    ['the end property', () => billing.end],
    ['until()', () => billing.until('2027-01')],
    ['since()', () => billing.since('2025-01')],
    ['yearMonth() given it', () => yearMonth(billing)],
  ])('is kept by %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('a locale carried on a MonthDay', () => {
  const birthday = monthDay(10, 17).locale('fr');

  it.each([
    ['in()', () => birthday.in(2027)],
    ['next()', () => birthday.next('2026-05-15')],
    ['next() counted from today', () => birthday.next()],
    ['previous()', () => birthday.previous('2026-05-15')],
    ['last()', () => birthday.last('2026-12-01')],
    ['monthDay() given it', () => monthDay(birthday)],
  ])('is kept by %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('a locale carried on a range', () => {
  const stay = dateRange('2026-09-01', '2026-09-07').locale('fr');
  const meeting = datetimeRange('2026-09-01T09:00', '2026-09-01T11:00', 'Europe/Paris').locale('fr');
  const lunch = datetimeRange('2026-09-01T10:00', '2026-09-01T12:00', 'Europe/Paris');
  const shift = timeRange('22:00', '06:00').locale('fr');

  it('is given to both ends by locale() and taken from both by locale(null)', () => {
    expect(localesOf([stay.start, stay.end])).toEqual(new Set(['fr']));
    expect(localesOf([stay.locale(null), stay.locale(null).start, stay.locale(null).end])).toEqual(
      new Set([undefined]),
    );
  });

  it.each([
    ['the duration of a DateRange', () => stay.duration],
    ['points() of a DateRange', () => stay.points('day')],
    ['split() of a DateRange', () => stay.split(2, 'days')],
    ['intersection() of a DateRange', () => stay.intersection('2026-09-05/2026-09-10')],
    ['in() of a DateRange', () => stay.in('Europe/Paris')],
    ['the ends of a DateTimeRange', () => [meeting.start, meeting.end]],
    ['the duration of a DateTimeRange', () => meeting.duration],
    ['points() of a DateTimeRange', () => meeting.points('30m')],
    ['split() of a DateTimeRange', () => meeting.split('hour')],
    ['intersection() of a DateTimeRange', () => meeting.intersection(lunch)],
    ['in() of a DateTimeRange', () => meeting.in('Asia/Tokyo')],
    ['the ends of a TimeRange', () => [shift.start, shift.end]],
    ['the duration of a TimeRange', () => shift.duration],
    ['points() of a TimeRange', () => shift.points(2, 'hours')],
    ['split() of a TimeRange', () => shift.split(4, 'hours')],
    ['intersection() of a TimeRange', () => shift.intersection(timeRange('04:00', '08:00'))],
  ])('is kept by %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('two values carrying different locales', () => {
  const french = date('2026-05-15').locale('fr');
  const japanese = date('2026-05-19').locale('ja');

  it.each([
    ['to()', () => french.to(japanese)],
    ['the end of the range to() returns', () => french.to(japanese).end],
    ['until()', () => french.until(japanese)],
    ['since()', () => french.since(japanese)],
    ['next() given a MonthDay', () => french.next(monthDay(12, 25).locale('ja'))],
    ['at() given a Time', () => french.at(time('09:00').locale('ja'), 'UTC')],
    ['on() given a date', () => time('09:00').locale('fr').on(japanese, 'UTC')],
    ['plus() given a Duration', () => hours(1).locale('fr').plus(hours(2).locale('ja'))],
    ['intersection() given a range', () => french.to('2026-05-25').intersection(japanese.to('2026-05-30'))],
  ])('keep the locale of the value the method was called on in %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('locale precedence when printing', () => {
  it('prints in the locale of the runtime when nothing is set', () => {
    const inRuntimeLocale = new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' });
    expect(date('2026-05-15').format('MMMM')).toBe(inRuntimeLocale.format(Date.UTC(2026, 4, 15)));
  });

  it('prints in the configured locale when the value carries none', () => {
    configure({ locale: 'es' });
    expect(date('2026-05-15').format('MMMM')).toBe('mayo');
  });

  it('prints in the locale a value carries over the configured locale', () => {
    configure({ locale: 'es' });
    expect(date('2026-05-15').locale('fr').format('MMMM')).toBe('mai');
  });

  it('prints in the locale passed to format() over the one the value carries, for that call only', () => {
    configure({ locale: 'es' });
    const french = date('2026-05-15').locale('fr');
    expect(french.format('MMMM', 'de')).toBe('Mai');
    expect(french.format('MMMM')).toBe('mai');
  });

  it('applies the same order to the text of a duration', () => {
    configure({ locale: 'es' });
    expect(days(2).format()).toContain('días');
    expect(days(2).locale('fr').format()).toContain('jours');
    expect(days(2).locale('fr').format('long', 'de')).toContain('Tage');
  });

  it('applies the same order to a relative phrase', () => {
    configure({ locale: 'es' });
    const noon = datetime('2026-05-15T12:00:00Z', 'UTC');
    expect(noon.minus(3, 'hours').from(noon)).toContain('horas');
    expect(noon.locale('fr').minus(3, 'hours').from(noon)).toContain('heures');
    expect(noon.locale('fr').minus(3, 'hours').from(noon, 'de')).toContain('Stunden');
  });

  it('applies the same order to a range', () => {
    configure({ locale: 'es' });
    expect(dateRange('2026-05-15', '2026-05-19').format('long')).toContain('mayo');
    expect(dateRange('2026-05-15', '2026-05-19').locale('fr').format('long')).toContain('mai');
    expect(dateRange('2026-05-15', '2026-05-19').locale('fr').format('long', 'de')).toContain('Mai');
  });

  it('reads an underscore tag or a header passed to format()', () => {
    expect(date('2026-05-15').format('MMMM', 'fr_FR')).toBe('mai');
    expect(date('2026-05-15').format('MMMM', 'ja,en;q=0.5')).toBe('5月');
  });

  it.todo('treats null or an empty string passed to format() as no locale for that call');
});
