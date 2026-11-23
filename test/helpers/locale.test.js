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

afterEach(() => {
  configure({ locale: null });
});

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

describe.each(kinds)('%s locale() and lang()', (name, Kind, make) => {
  it('returns a new instance with the locale tag without mutating the receiver', () => {
    const plain = make();
    const french = plain.locale('fr');
    expect(french).toBeInstanceOf(Kind);
    expect(french.locale()).toBe('fr');
    expect(plain.locale()).toBeUndefined();
  });

  it('treats lang() as an alias for locale() when reading and setting tags', () => {
    expect(make().lang('fr').locale()).toBe('fr');
    expect(make().locale('fr').lang()).toBe('fr');
  });

  // an empty database column must not break chains like value.locale(user.locale).format()
  it.each([['null', null], ['undefined', undefined], ['an empty string', '']])(
    'clears the locale tag and preserves instance type when passed %s',
    (label, empty) => {
      const cleared = make().locale('fr').locale(empty);
      expect(cleared).toBeInstanceOf(Kind);
      expect(cleared.locale()).toBeUndefined();
    },
  );
});

describe('instance locale in formatting, equality, and serialization', () => {
  it('formats the instance in its attached locale', () => {
    expect(date('2026-05-15').locale('fr-FR').format('long')).toContain('mai');
    expect(date('2026-05-15').locale('de-DE').format('long')).toContain('Mai');
  });

  it('excludes locale metadata from equals(), compare(), toString(), and toJSON()', () => {
    const french = date('2026-05-15').locale('fr');
    const japanese = date('2026-05-15').locale('ja');
    expect(french.equals(japanese)).toBe(true);
    expect(compare(french, japanese)).toBe(0);
    expect(french.toString()).toBe('2026-05-15');
    expect(JSON.stringify({ day: french })).toBe('{"day":"2026-05-15"}');
  });
});

// test two locales per type so at least one differs from the host runtime default locale
const written = [
  ['DateTime', () => datetime('2026-05-15T14:30:00Z', 'UTC'), ['fr', 'mai'], ['it', 'mag']],
  ['CalendarDate', () => date('2026-05-15'), ['fr', 'mai'], ['it', 'mag']],
  ['Time', () => time('17:30'), ['en-US', 'PM'], ['ko', '오후']],
  ['Duration', () => hours(2), ['fr', 'heures'], ['de', 'Stunden']],
  ['YearMonth', () => yearMonth('2026-05'), ['fr', 'mai'], ['it', 'mag']],
  ['MonthDay', () => monthDay(5, 15), ['fr', 'mai'], ['it', 'mag']],
  ['DateRange', () => dateRange('2026-05-15', '2026-05-19'), ['fr', 'mai'], ['it', 'mag']],
  ['DateTimeRange', () => datetimeRange('2026-05-15T09:00', '2026-05-15T10:00', 'UTC'), ['fr', 'mai'], ['it', 'mag']],
  ['TimeRange', () => timeRange('09:00', '17:00'), ['en-US', 'PM'], ['ko', '오후']],
];

describe.each(written)('%s format() and .text with an instance locale', (name, make, ...languages) => {
  it.each(languages)('formats in %s', (tag, word) => {
    const value = make().locale(tag);
    expect(value.format('long')).toContain(word);
    expect(value.text).toContain(word);
  });
});

describe('locale() tag and Accept-Language normalization', () => {
  const day = date('2026-05-15');

  it.each([
    ['en_US', 'en-US'],
    ['pt_BR', 'pt-BR'],
    ['zh_Hans_CN', 'zh-Hans-CN'],
  ])('normalizes POSIX underscore tag %s to BCP 47 %s', (given, normalized) => {
    expect(day.locale(given).locale()).toBe(normalized);
  });

  it('parses Accept-Language headers sorted by descending q-weight and drops q=0 entries', () => {
    expect(day.locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale()).toEqual(['de', 'fr-CH']);
  });

  it('formats in the highest-priority language from an Accept-Language header', () => {
    const localized = day.locale('de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7');
    expect(localized.locale()).toEqual(['de-DE', 'de', 'en-US', 'en']);
    expect(localized.format('MMMM')).toBe('Mai');
  });

  it('preserves header order among languages with equal q-weights', () => {
    expect(day.locale('en;q=0.5, fr;q=0.5').locale()).toEqual(['en', 'fr']);
  });

  it('strips the * wildcard from Accept-Language headers that also list specific tags', () => {
    expect(day.locale('fr-CH, fr;q=0.9, *;q=0.5').locale()).toEqual(['fr-CH', 'fr']);
  });

  it('accepts a frozen array of locale tags such as navigator.languages', () => {
    const localized = day.locale(Object.freeze(['de-AT', 'de', 'en']));
    expect(localized.locale()).toEqual(['de-AT', 'de', 'en']);
    expect(localized.format('MMMM')).toBe('Mai');
  });

  it('falls back to the next supported tag when the runtime lacks data for the first tag', () => {
    expect(day.locale(['xx', 'fr']).format('MMMM')).toBe('mai');
    expect(day.locale('xx, fr;q=0.9').format('MMMM')).toBe('mai');
  });

  it('returns a normalized value accepted directly by Intl constructors', () => {
    const grouped = (given) => new Intl.NumberFormat(day.locale(given).locale()).format(1234.5);
    expect(grouped('de_DE')).toBe('1.234,5');
    expect(grouped('de-DE,de;q=0.9,en;q=0.8')).toBe('1.234,5');
  });

  it('throws unknownLocale for an invalid locale string', () => {
    expect(() => day.locale('not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });

  it('falls back to configure().locale when an Accept-Language header contains only wildcard *', () => {
    configure({ locale: 'ja' });
    const localized = day.locale('*');
    expect(localized.locale()).toBeUndefined();
    expect(localized.format('MMMM')).toBe('5月');
    expect(day.format('MMMM', '*')).toBe('5月');
  });

  it.each(['es;q=0', ',', '*;q=0.5'])('treats header %j with no accepted language as undefined', (header) => {
    configure({ locale: 'ja' });
    expect(day.locale(header).locale()).toBeUndefined();
    expect(date('2026-05-15', { locale: header }).format('MMMM')).toBe('5月');
    expect(configure({ locale: header }).locale).toBeUndefined();
  });
});

describe('factory { locale } option', () => {
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
  ])('attaches { locale } on instances created via %s', (name, make) => {
    expect(make().locale()).toBe('fr');
  });

  it('normalizes underscore tags and Accept-Language headers in { locale }', () => {
    expect(date('2026-05-15', { locale: 'en_US' }).locale()).toBe('en-US');
    expect(date('2026-05-15', { locale: 'fr-CH;q=0.8, de;q=0.9' }).locale()).toEqual(['de', 'fr-CH']);
  });

  it('overrides the existing locale when wrapping an instance with { locale }', () => {
    const french = datetime('2026-05-15T14:30:00Z', { zone: 'UTC', locale: 'fr' });
    expect(datetime(french, { locale: 'de' }).locale()).toBe('de');
    expect(date(french, { locale: 'de' }).locale()).toBe('de');
  });

  it('throws unknownLocale when { locale } is invalid', () => {
    expect(() => date('2026-05-15', { locale: 'not a locale' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('DateTime locale propagation', () => {
  const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr');
  const christmas = monthDay(12, 25);

  it('propagates locale through chained conversions into formatting', () => {
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
    ['next(weekday)', () => arrival.next('friday')],
    ['previous(weekday)', () => arrival.previous('friday')],
    ['next(MonthDay)', () => arrival.next(christmas)],
    ['previous(MonthDay)', () => arrival.previous(christmas)],
    ['startOfNext()', () => arrival.startOfNext('month')],
    ['startOfPrevious()', () => arrival.startOfPrevious('hour')],
    ['startOfNext(weekday)', () => arrival.startOfNext('friday')],
    ['startOfPrevious(weekday)', () => arrival.startOfPrevious('friday')],
    ['.date', () => arrival.date],
    ['.time', () => arrival.time],
    ['.yearMonth', () => arrival.yearMonth],
    ['.monthDay', () => arrival.monthDay],
    ["as('date')", () => arrival.as('date')],
    ["as('time')", () => arrival.as('time')],
    ["as('yearMonth')", () => arrival.as('yearMonth')],
    ["as('monthDay')", () => arrival.as('monthDay')],
    ['to()', () => arrival.to('2026-05-16T14:30:00Z')],
    ['for()', () => arrival.for(90, 'minutes')],
    ['range()', () => arrival.range('day')],
    ['until()', () => arrival.until('2026-05-16T14:30:00Z')],
    ['since()', () => arrival.since('2026-05-14T14:30:00Z')],
    ['datetime(value, zone)', () => datetime(arrival, 'UTC')],
    ['date(value)', () => date(arrival)],
    ['time(value)', () => time(arrival)],
    ['yearMonth(value)', () => yearMonth(arrival)],
    ['monthDay(value)', () => monthDay(arrival)],
  ])('preserves locale across %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('CalendarDate locale propagation', () => {
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
    ['next(weekday)', () => trip.next('friday')],
    ['previous(weekday)', () => trip.previous('friday')],
    ['next(MonthDay)', () => trip.next(christmas)],
    ['previous(MonthDay)', () => trip.previous(christmas)],
    ['startOfNext()', () => trip.startOfNext('month')],
    ['startOfPrevious()', () => trip.startOfPrevious('week')],
    ['startOfNext(weekday)', () => trip.startOfNext('friday')],
    ['startOfPrevious(weekday)', () => trip.startOfPrevious('friday')],
    ['at()', () => trip.at('9am', 'Europe/Paris')],
    ["as('datetime')", () => trip.as('datetime', 'UTC')],
    ['.yearMonth', () => trip.yearMonth],
    ['.monthDay', () => trip.monthDay],
    ["as('yearMonth')", () => trip.as('yearMonth')],
    ["as('monthDay')", () => trip.as('monthDay')],
    ['to()', () => trip.to('2026-05-19')],
    ['for()', () => trip.for(2, 'weeks')],
    ['through()', () => trip.through('2026-05-19')],
    ['range()', () => trip.range('month')],
    ['every()', () => trip.every(6, 'hours', 'UTC')],
    ['split()', () => trip.split(6, 'hours', 'UTC')],
    ['until()', () => trip.until('2026-06-15')],
    ['since()', () => trip.since('2026-04-15')],
    ['date(value, zone)', () => date(trip, 'UTC')],
    ['datetime(value, zone)', () => datetime(trip, 'UTC')],
    ['yearMonth(value)', () => yearMonth(trip)],
    ['monthDay(value)', () => monthDay(trip)],
  ])('preserves locale across %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('Time locale propagation', () => {
  const closing = time('17:30').locale('fr');

  it.each([
    ['plus()', () => closing.plus(2, 'hours')],
    ['minus()', () => closing.minus('30m')],
    ['add()', () => closing.add({ minutes: 5 })],
    ['subtract()', () => closing.subtract(1, 'hour')],
    ['set()', () => closing.set('minute', 0)],
    ['startOf()', () => closing.startOf('hour')],
    ['endOf()', () => closing.endOf('hour')],
    ['startOfNext()', () => closing.startOfNext('hour')],
    ['startOfPrevious()', () => closing.startOfPrevious('minute')],
    ['round()', () => closing.round('hour')],
    ['floor()', () => closing.floor(15, 'minutes')],
    ['ceil()', () => closing.ceil('hour')],
    ['to()', () => closing.to('18:00')],
    ['for()', () => closing.for(2, 'hours')],
    ['until()', () => closing.until('18:00')],
    ['since()', () => closing.since('09:00')],
    ['on()', () => closing.on('2026-05-01', 'Asia/Seoul')],
    ['time(value)', () => time(closing)],
  ])('preserves locale across %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('Duration locale propagation', () => {
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
    ['balance() on an anchored Duration', () => measured.balance('day')],
    ['round() on an anchored Duration', () => measured.round('month')],
    ['duration(value)', () => duration(wait)],
  ])('preserves locale across %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('YearMonth locale propagation', () => {
  const billing = yearMonth('2026-05').locale('fr');

  it.each([
    ['plus()', () => billing.plus(1, 'month')],
    ['minus()', () => billing.minus({ years: 1 })],
    ['add()', () => billing.add(2, 'months')],
    ['subtract()', () => billing.subtract(2, 'months')],
    ['set()', () => billing.set('month', 1)],
    ['on()', () => billing.on(15)],
    ['.start', () => billing.start],
    ['.end', () => billing.end],
    ['until()', () => billing.until('2027-01')],
    ['since()', () => billing.since('2025-01')],
    ['yearMonth(value)', () => yearMonth(billing)],
  ])('preserves locale across %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('MonthDay locale propagation', () => {
  const birthday = monthDay(10, 17).locale('fr');

  it.each([
    ['in()', () => birthday.in(2027)],
    ['next(anchor)', () => birthday.next('2026-05-15')],
    ['next() from today', () => birthday.next()],
    ['previous()', () => birthday.previous('2026-05-15')],
    ['last()', () => birthday.last('2026-12-01')],
    ['monthDay(value)', () => monthDay(birthday)],
  ])('preserves locale across %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('range locale propagation', () => {
  const stay = dateRange('2026-09-01', '2026-09-07').locale('fr');
  const meeting = datetimeRange('2026-09-01T09:00', '2026-09-01T11:00', 'Europe/Paris').locale('fr');
  const lunch = datetimeRange('2026-09-01T10:00', '2026-09-01T12:00', 'Europe/Paris');
  const shift = timeRange('22:00', '06:00').locale('fr');

  it('propagates locale(tag) and locale(null) to both range endpoints', () => {
    expect(localesOf([stay.start, stay.end])).toEqual(new Set(['fr']));
    expect(localesOf([stay.locale(null), stay.locale(null).start, stay.locale(null).end])).toEqual(
      new Set([undefined]),
    );
  });

  it.each([
    ['DateRange.duration', () => stay.duration],
    ['DateRange.every()', () => stay.every('day')],
    ['DateRange.split()', () => stay.split(2, 'days')],
    ['DateRange.intersection()', () => stay.intersection('2026-09-05/2026-09-10')],
    ['DateRange.in()', () => stay.in('Europe/Paris')],
    ['DateTimeRange endpoints', () => [meeting.start, meeting.end]],
    ['DateTimeRange.duration', () => meeting.duration],
    ['DateTimeRange.every()', () => meeting.every('30m')],
    ['DateTimeRange.split()', () => meeting.split('hour')],
    ['DateTimeRange.intersection()', () => meeting.intersection(lunch)],
    ['DateTimeRange.in()', () => meeting.in('Asia/Tokyo')],
    ['TimeRange endpoints', () => [shift.start, shift.end]],
    ['TimeRange.duration', () => shift.duration],
    ['TimeRange.every()', () => shift.every(2, 'hours')],
    ['TimeRange.split()', () => shift.split(4, 'hours')],
    ['TimeRange.intersection()', () => shift.intersection(timeRange('04:00', '08:00'))],
  ])('preserves locale across %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('receiver locale precedence in binary methods', () => {
  const french = date('2026-05-15').locale('fr');
  const japanese = date('2026-05-19').locale('ja');

  it.each([
    ['to()', () => french.to(japanese)],
    ['to().end', () => french.to(japanese).end],
    ['until()', () => french.until(japanese)],
    ['since()', () => french.since(japanese)],
    ['next(MonthDay)', () => french.next(monthDay(12, 25).locale('ja'))],
    ['at(Time)', () => french.at(time('09:00').locale('ja'), 'UTC')],
    ['on(CalendarDate)', () => time('09:00').locale('fr').on(japanese, 'UTC')],
    ['plus(Duration)', () => hours(1).locale('fr').plus(hours(2).locale('ja'))],
    ['intersection(DateRange)', () => french.to('2026-05-25').intersection(japanese.to('2026-05-30'))],
  ])('preserves the receiver locale over the argument locale in %s', (name, derive) => {
    expect(localesOf(derive())).toEqual(new Set(['fr']));
  });
});

describe('locale precedence in formatting', () => {
  it('uses the runtime default locale when no locale is configured or attached', () => {
    const inRuntimeLocale = new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' });
    expect(date('2026-05-15').format('MMMM')).toBe(inRuntimeLocale.format(Date.UTC(2026, 4, 15)));
  });

  it('uses configure().locale when the instance has no locale', () => {
    configure({ locale: 'es' });
    expect(date('2026-05-15').format('MMMM')).toBe('mayo');
  });

  it('prefers the instance locale over configure().locale', () => {
    configure({ locale: 'es' });
    expect(date('2026-05-15').locale('fr').format('MMMM')).toBe('mai');
  });

  it('prefers the call-site format() locale over the instance locale for that call only', () => {
    configure({ locale: 'es' });
    const french = date('2026-05-15').locale('fr');
    expect(french.format('MMMM', 'de')).toBe('Mai');
    expect(french.format('MMMM')).toBe('mai');
  });

  it('applies the same locale precedence to Duration format()', () => {
    configure({ locale: 'es' });
    expect(days(2).format()).toContain('días');
    expect(days(2).locale('fr').format()).toContain('jours');
    expect(days(2).locale('fr').format('long', 'de')).toContain('Tage');
  });

  it('applies the same locale precedence to from()', () => {
    configure({ locale: 'es' });
    const noon = datetime('2026-05-15T12:00:00Z', 'UTC');
    expect(noon.minus(3, 'hours').from(noon)).toContain('horas');
    expect(noon.locale('fr').minus(3, 'hours').from(noon)).toContain('heures');
    expect(noon.locale('fr').minus(3, 'hours').from(noon, 'de')).toContain('Stunden');
  });

  it('applies the same locale precedence to range format()', () => {
    configure({ locale: 'es' });
    expect(dateRange('2026-05-15', '2026-05-19').format('long')).toContain('mayo');
    expect(dateRange('2026-05-15', '2026-05-19').locale('fr').format('long')).toContain('mai');
    expect(dateRange('2026-05-15', '2026-05-19').locale('fr').format('long', 'de')).toContain('Mai');
  });

  it('normalizes underscore tags and Accept-Language headers passed directly to format()', () => {
    expect(date('2026-05-15').format('MMMM', 'fr_FR')).toBe('mai');
    expect(date('2026-05-15').format('MMMM', 'ja,en;q=0.5')).toBe('5月');
    expect(date('2026-05-15').locale('fr-FR;Q=0.9, en;Q=0.5').format('MMMM')).toBe('mai');
    expect(date('2026-05-15').locale('en-US, @@@;q=0.5').locale()).toBe('en-US');
    expect(date('2026-05-15').locale('   ').locale()).toBeUndefined();
  });

  it('treats { locale: false } as unset and preserves carried locale on duration(d, { locale: undefined })', () => {
    configure({ locale: 'fr' });
    const d = date('2026-05-15', { locale: false });
    expect(d.locale()).toBeUndefined();
    expect(d.format('MMMM')).toBe('mai');
    expect(duration(hours(2).locale('fr'), { locale: undefined }).locale()).toBe('fr');
  });
});
