import { isDevelopment } from './environment.js';
import { refuse } from './errors.js';
import { bounded, plainDateTimeFormat, zonedDateTimeFormat } from './intl.js';
import { dayOfWeek, pad } from './units.js';
import { each } from './utils.js';
import { locale as pickLocale, namedFormat, settings, weekStart } from './zones.js';

// cleared by configure() when custom weekdayNames or ordinals change
export const nameCache = bounded(100);

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
      dd: cuts ? cut : /^(MTWTFSS|\d+)$/.test(narrow.join('')) && !language.startsWith('en') ? [...short] : narrow,
      ddd: short,
      dddd: long,
      dayPeriods: [periodAt(9), periodAt(15)],
      dayMark: afterDay?.type === 'literal' ? afterDay.value.match(/^[^\s,،]*/)[0] : '',
      isEnglish: language.startsWith('en'),
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
    nameCache.set(key, table);
  }
  return nameCache.get(key);
};

const monthName = (subject, locale, token, besideDay) =>
  (besideDay ? names(locale).besideDay : names(locale))[token][subject.month - 1];

// honor a/A casing in English while preserving native script/casing elsewhere (e.g. 午後)
const dayPeriod = (subject, locale, cased) => {
  const { dayPeriods, isEnglish } = names(locale);
  const period = dayPeriods[subject.hour < 12 ? 0 : 1];
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
const zoneName = (parts, locale, style) =>
  zonedDateTimeFormat(locale, zoneNameOptions[style], parts.zone)
    .formatToParts(parts.epochMilliseconds)
    .find((part) => part.type === 'timeZoneName')?.value;

// pair each token with its required property so unsupported tokens (e.g. 'HH' on CalendarDate) fail fast
const tokenReaders = {
  YYYY: ['year', (subject) => (subject.year < 0 ? '-' : '') + pad(subject.year, 4)],
  YY: ['year', (subject) => pad(subject.year % 100)],
  M: ['month', (subject) => String(subject.month)],
  MM: ['month', (subject) => pad(subject.month)],
  MMM: ['month', (subject, locale, besideDay) => monthName(subject, locale, 'MMM', besideDay)],
  MMMM: ['month', (subject, locale, besideDay) => monthName(subject, locale, 'MMMM', besideDay)],
  D: ['day', (subject) => String(subject.day)],
  DD: ['day', (subject) => pad(subject.day)],
  Do: ['day', (subject, locale) => ordinal(subject.day, locale)],
  DDD: ['dayOfYear', (subject) => String(subject.dayOfYear)],
  DDDD: ['dayOfYear', (subject) => pad(subject.dayOfYear, 3)],
  d: ['dayOfWeek', (subject) => String(subject.dayOfWeek % 7)], // Sunday = 0 (Moment/Day.js convention)
  E: ['dayOfWeek', (subject) => String(subject.dayOfWeek)],
  dd: ['dayOfWeek', (subject, locale) => names(locale).dd[subject.dayOfWeek - 1]],
  ddd: ['dayOfWeek', (subject, locale) => names(locale).ddd[subject.dayOfWeek - 1]],
  dddd: ['dayOfWeek', (subject, locale) => names(locale).dddd[subject.dayOfWeek - 1]],
  H: ['hour', (subject) => String(subject.hour)],
  HH: ['hour', (subject) => pad(subject.hour)],
  h: ['hour', (subject) => String(subject.hour % 12 || 12)],
  hh: ['hour', (subject) => pad(subject.hour % 12 || 12)],
  m: ['minute', (subject) => String(subject.minute)],
  mm: ['minute', (subject) => pad(subject.minute)],
  s: ['second', (subject) => String(subject.second)],
  ss: ['second', (subject) => pad(subject.second)],
  S: ['millisecond', (subject) => String(Math.floor(subject.millisecond / 100))],
  SS: ['millisecond', (subject) => pad(Math.floor(subject.millisecond / 10))],
  SSS: ['millisecond', (subject) => pad(subject.millisecond, 3)],
  A: ['hour', (subject, locale) => dayPeriod(subject, locale, 'toUpperCase')],
  a: ['hour', (subject, locale) => dayPeriod(subject, locale, 'toLowerCase')],
  Z: ['offset', (subject) => subject.offset],
  ZZ: ['offset', (subject) => subject.offset.replace(':', '')],
  z: ['zone', (subject, locale) => zoneName(subject, locale, 'short')],
  zz: ['zone', (subject, locale) => zoneName(subject, locale, 'short')],
  zzz: ['zone', (subject, locale) => zoneName(subject, locale, 'long')],
  zzzz: ['zone', (subject, locale) => zoneName(subject, locale, 'long')],
  X: ['epochSeconds', (subject) => String(subject.epochSeconds)],
  x: ['epochMilliseconds', (subject) => String(subject.epochMilliseconds)],
  Q: ['month', (subject) => String(Math.ceil(subject.month / 3))],
  W: ['weekOfYear', (subject) => String(subject.weekOfYear)],
  WW: ['weekOfYear', (subject) => pad(subject.weekOfYear)],
};

// match full single-letter runs so overlong tokens like 'SSSSSS' and typos like 'meduim' throw unknownFormat,
// leaving 'T' unescaped for 'YYYY-MM-DDTHH:mm'
// a letter touching an accented one ('às') or an 'h' after 'H' ('HHhmm') is a word, so it throws too
const tokenPattern = /\[([^\]]*)\]|[A-Za-z]+[\u00c0-\u024f]|[\u00c0-\u024f]+[A-Za-z]|H+\s?h|Do|([A-SU-Za-z])\2*/g;

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
    if (subject[field] === undefined) {
      refuse('unsupportedToken', `${token} in '${pattern}'`, {
        explanation: isDevelopment
          ? `a ${kind} does not include ${field} information. Remove that token from the format pattern`
          : 0,
      });
    }
    return read(subject, resolved, besideDay);
  });
};
