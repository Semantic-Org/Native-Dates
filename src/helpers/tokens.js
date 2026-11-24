import { isDevelopment } from './environment.js';
import { refuse } from './errors.js';
import { plainDateTimeFormat, zonedDateTimeFormat } from './intl.js';
import { dayOfWeek, pad } from './units.js';
import { each, remember } from './utils.js';
import { locale as pickLocale, namedFormat, settings, weekStart } from './zones.js';

// cleared by configure() when custom weekdayNames or ordinals change
export const nameCache = new Map();

export const weekdayWidths = { narrow: 'dd', short: 'ddd', long: 'dddd' };

// force calendar: 'gregory' because token numbers are ISO/Gregorian (otherwise 'fa' pairs Gregorian day 6 with Persian month Aban)
export const names = (locale) => {
  const key = String(locale ?? '');
  if (!nameCache.has(key)) {
    const stamps = Array.from({ length: 12 }, (_, month) => Date.UTC(2000, month, 6));
    const parts = (options, stamp) =>
      plainDateTimeFormat(locale, { ...options, calendar: 'gregory' }).formatToParts(stamp);
    const monthIn = (options, stamp) => parts(options, stamp).find((part) => part.type === 'month').value;
    const clock = plainDateTimeFormat(locale, { hour: 'numeric', hour12: true });
    const language = clock.resolvedOptions().locale;
    const isEnglish = language.startsWith('en');
    // Greek ('el') is the one ICU locale where standalone { month: 'long' } returns the genitive (Νοεμβρίου).
    // Pairing with year yields the nominative (Νοέμβριος)
    const alone = (style) =>
      stamps.map((stamp) =>
        language.startsWith('el') && style === 'long'
          ? monthIn({ month: style, year: 'numeric' }, stamp)
          : plainDateTimeFormat(locale, { month: style, calendar: 'gregory' }).format(stamp)
      );
    // capture inflected month forms used beside a day (e.g. Russian '6 ноября' vs standalone 'ноябрь'),
    // falling back to standalone when day+month formats numerically
    const besideDay = (style, plain) =>
      stamps.map((stamp, index) => {
        const name = monthIn({ day: 'numeric', month: style }, stamp);
        return /\p{N}/u.test(name) ? plain[index] : name;
      });
    // 2024-01-01 was a Monday, aligning index 0..6 with ISO dayOfWeek 1..7
    const weekday = (style) =>
      Array.from(
        { length: 7 },
        (_, i) => plainDateTimeFormat(locale, { weekday: style }).format(Date.UTC(2024, 0, 1 + i)),
      );
    const periodAt = (hour) =>
      clock.formatToParts(hour * 36e5).find((part) => part.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM');
    const [MMM, MMMM] = [alone('short'), alone('long')];
    const [short, long, narrow] = [weekday('short'), weekday('long'), weekday('narrow')];
    // slice 2-letter `dd` abbreviations only in bicameral scripts where all 7 prefixes are unique and match
    // the full name (avoids Turkish Pz colliding on Pazar/Pazartesi and avoids splitting Thai or Hindi syllables).
    // Otherwise use Intl 'narrow', unless ICU falls back to English MTWTFSS or 1-7 digits (e.g. Urdu, Azerbaijani)
    const cut = short.map((name) => name.slice(0, 2));
    const cuts = /\p{Lu}|\p{Ll}/u.test(short[0]) && new Set(cut).size === 7
      && short.every((name, day) =>
        name.replace('.', '').length < 3 || long[day].toLowerCase().includes(cut[day].toLowerCase())
      );
    // extract trailing day punctuation for non-English `Do` (e.g. '.' in German '6. November', '日' in Japanese '6日')
    const written = parts({ day: 'numeric', month: 'long' }, stamps[10]);
    const afterDay = written[written.findIndex((part) => part.type === 'day') + 1];
    const table = {
      MMM,
      MMMM,
      besideDay: { MMM: besideDay('short', MMM), MMMM: besideDay('long', MMMM) },
      dd: cuts ? cut : /^(MTWTFSS|\d+)$/.test(narrow.join('')) && !isEnglish ? [...short] : narrow,
      ddd: short,
      dddd: long,
      dayPeriods: [periodAt(9), periodAt(15)],
      dayMark: afterDay?.type === 'literal' ? afterDay.value.match(/^[^\s,،]*/)[0] : '',
      isEnglish,
    };
    // layer app overrides from base language to specific region (e.g. 'pt' then 'pt-br')
    const subtags = language.toLowerCase().split('-');
    each(subtags, (_, index) => {
      const tag = subtags.slice(0, index + 1).join('-');
      table.ordinal = settings.ordinals?.[tag] ?? table.ordinal;
      each(settings.weekdayNames?.[tag], (days, width) =>
        each(days, (name, day) => {
          table[weekdayWidths[width]][dayOfWeek(day) - 1] = name;
        }));
    });
    remember(nameCache, key, table, 100);
  }
  return nameCache.get(key);
};

const monthName = (token) => (month, locale, besideDay) =>
  (besideDay ? names(locale).besideDay : names(locale))[token][month - 1];

const weekdayName = (token) => (dayOfWeek, locale) => names(locale)[token][dayOfWeek - 1];

// honor a/A casing in English while preserving native script/casing elsewhere (e.g. 午後)
const dayPeriod = (cased) => (hour, locale) => {
  const { dayPeriods, isEnglish } = names(locale);
  const period = dayPeriods[hour < 12 ? 0 : 1];
  return isEnglish ? period[cased]() : period;
};

const ordinal = (number, locale) => {
  const { dayMark, isEnglish, ordinal: own } = names(locale);
  if (own) {
    return `${own(number)}`;
  }
  if (!isEnglish) {
    return `${number}${dayMark}`;
  }
  const tens = number % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][number % 10] ?? 'th';
  return `${number}${suffix}`;
};

const zoneNameOptions = {
  short: Object.freeze({ timeZoneName: 'short' }),
  long: Object.freeze({ timeZoneName: 'long' }),
};
const zoneName = (style) => (zone, locale, besideDay, subject) =>
  zonedDateTimeFormat(locale, zoneNameOptions[style], zone)
    .formatToParts(subject.epochMilliseconds)
    .find((part) => part.type === 'timeZoneName')?.value;

// readers are also passed the locale, which a bare pad would take as its width
const twoDigits = (value) => pad(value);

// pair each token with the property it prints so unsupported tokens (e.g. 'HH' on CalendarDate) fail fast
const tokenReaders = {
  YYYY: ['year', (year) => (year < 0 ? '-' : '') + pad(year, 4)],
  YY: ['year', (year) => pad(year % 100)],
  M: ['month', String],
  MM: ['month', twoDigits],
  MMM: ['month', monthName('MMM')],
  MMMM: ['month', monthName('MMMM')],
  D: ['day', String],
  DD: ['day', twoDigits],
  Do: ['day', ordinal],
  DDD: ['dayOfYear', String],
  DDDD: ['dayOfYear', (dayOfYear) => pad(dayOfYear, 3)],
  d: ['dayOfWeek', (dayOfWeek) => String(dayOfWeek % 7)], // Sunday = 0 (Moment/Day.js convention)
  E: ['dayOfWeek', String],
  dd: ['dayOfWeek', weekdayName('dd')],
  ddd: ['dayOfWeek', weekdayName('ddd')],
  dddd: ['dayOfWeek', weekdayName('dddd')],
  H: ['hour', String],
  HH: ['hour', twoDigits],
  h: ['hour', (hour) => String(hour % 12 || 12)],
  hh: ['hour', (hour) => pad(hour % 12 || 12)],
  m: ['minute', String],
  mm: ['minute', twoDigits],
  s: ['second', String],
  ss: ['second', twoDigits],
  S: ['millisecond', (millisecond) => String(Math.floor(millisecond / 100))],
  SS: ['millisecond', (millisecond) => pad(Math.floor(millisecond / 10))],
  SSS: ['millisecond', (millisecond) => pad(millisecond, 3)],
  A: ['hour', dayPeriod('toUpperCase')],
  a: ['hour', dayPeriod('toLowerCase')],
  Z: ['offset', String],
  ZZ: ['offset', (offset) => offset.replace(':', '')],
  z: ['zone', zoneName('short')],
  zz: ['zone', zoneName('short')],
  zzz: ['zone', zoneName('long')],
  zzzz: ['zone', zoneName('long')],
  X: ['epochSeconds', String],
  x: ['epochMilliseconds', String],
  Q: ['month', (month) => String(Math.ceil(month / 3))],
  W: ['weekOfYear', String],
  WW: ['weekOfYear', twoDigits],
};

// match full single-letter runs so overlong tokens like 'SSSSSS' and typos like 'meduim' throw unknownFormat,
// leaving 'T' unescaped for 'YYYY-MM-DDTHH:mm'
// a letter touching an accented one ('às') or an 'h' after 'H' ('HHhmm') is a word, so it throws too
export const tokenPattern =
  /\[([^\]]*)\]|[A-Za-z]+[\u00c0-\u024f]|[\u00c0-\u024f]+[A-Za-z]|H+\s?h|Do|([A-SU-Za-z])\2*/g;

// reject unrecognized style arguments such as a locale tag passed first in monthNames('de')
const tokenOf = (widths, style) =>
  (Object.hasOwn(widths, style) && widths[style]) || refuse('unknownFormat', String(style), {
    explanation: isDevelopment
      ? `expected a style in [${
        Object.keys(widths).join(', ')
      }] as the first argument. A locale is the last argument, as in \`monthNames('long', 'de')\` or \`weekdayNames('short', undefined, 'de')\``
      : 0,
  });

export const weekdayNames = (style = 'short', firstDay, locale) => {
  const table = names(pickLocale(locale))[tokenOf(weekdayWidths, style)];
  const first = weekStart(firstDay, locale) - 1;
  return [...table.slice(first), ...table.slice(0, first)];
};

export const monthNames = (
  style = 'long',
  locale,
) => [...names(pickLocale(locale))[tokenOf({ short: 'MMM', long: 'MMMM' }, style)]];

export const formatTokens = (subject, kind, named, locale) => {
  const pattern = namedFormat(named);
  const resolved = pickLocale(locale);
  // use genitive month when only literals sit between it and the day ('D-го MMMM'), skipping hand-bracketed MMMM[ta]
  const besideDay = /D[oD]?(\[[^\]]*\]|[^A-Za-z[])+MMMM?(?![M[])/.test(pattern);
  return pattern.replace(tokenPattern, (token, literal) => {
    if (literal !== undefined) {
      return literal;
    }
    if (!tokenReaders[token]) {
      refuse('unknownFormat', pattern, {
        explanation: isDevelopment
          ? `'${token}' is not a format token. Wrap literal text in brackets like '[at]', or pass a preset like 'medium' or an \`Intl.DateTimeFormat\` options object`
          : 0,
      });
    }
    const [field, read] = tokenReaders[token];
    const value = subject[field];
    if (value === undefined) {
      refuse('unsupportedToken', `${token} in '${pattern}'`, {
        explanation: isDevelopment
          ? `a ${kind} does not include ${field} information. Remove that token from the format pattern`
          : 0,
      });
    }
    return read(value, resolved, besideDay, subject);
  });
};
