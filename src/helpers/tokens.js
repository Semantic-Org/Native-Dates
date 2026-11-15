import { refuse } from './errors.js';
import { plainDateTimeFormat, zonedDateTimeFormat } from './intl.js';
import { isDevelopment } from './types.js';
import { pad } from './units.js';
import { locale as pickLocale, weekStart } from './zones.js';

const nameCache = new Map();

// month and weekday names come from Intl for the locale, so tokens stay legible outside English. the
// tokens print the ISO calendar's numbers, so the names are the Gregorian ones even where the locale
// keeps another calendar: a Persian locale would otherwise name November's 6th as Aban's
export const names = (locale) => {
  const key = String(locale ?? '');
  if (!nameCache.has(key)) {
    const stamps = Array.from({ length: 12 }, (_, month) => Date.UTC(2000, month, 6));
    const parts = (options, stamp) =>
      plainDateTimeFormat(locale, { ...options, calendar: 'gregory' }).formatToParts(stamp);
    const monthIn = (options, stamp) => parts(options, stamp).find((part) => part.type === 'month').value;
    const alone = (style) =>
      stamps.map((stamp) => plainDateTimeFormat(locale, { month: style, calendar: 'gregory' }).format(stamp));
    // many languages write a month differently beside a day: 6 ноября where the month alone is
    // ноябрь. a locale that writes the month as a number there keeps its name
    const besideDay = (style, plain) =>
      stamps.map((stamp, index) => {
        const name = monthIn({ day: 'numeric', month: style }, stamp);
        return /\p{N}/u.test(name) ? plain[index] : name;
      });
    // 2024-01-01 fell on a monday, so index 0 is monday to match ISO weekday numbering
    const weekday = (style) =>
      Array.from(
        { length: 7 },
        (_, i) => plainDateTimeFormat(locale, { weekday: style }).format(Date.UTC(2024, 0, 1 + i)),
      );
    const clock = plainDateTimeFormat(locale, { hour: 'numeric', hour12: true });
    const periodAt = (hour) =>
      clock.formatToParts(hour * 36e5).find((part) => part.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM');
    const [MMM, MMMM] = [alone('short'), alone('long')];
    // two letters of the short name where they tell the seven days apart, as they do in most
    // alphabets. in arabic they are the article on every day, so the locale's narrow form stands in
    const cut = weekday('short').map((name) => name.slice(0, 2));
    // what the locale writes straight after a day in a date: the dot in 6. November, 日 in 6日
    const written = parts({ day: 'numeric', month: 'long' }, stamps[10]);
    const afterDay = written[written.findIndex((part) => part.type === 'day') + 1];
    nameCache.set(key, {
      MMM,
      MMMM,
      besideDay: { MMM: besideDay('short', MMM), MMMM: besideDay('long', MMMM) },
      dd: new Set(cut).size === 7 ? cut : weekday('narrow'),
      ddd: weekday('short'),
      dddd: weekday('long'),
      dayPeriods: [periodAt(9), periodAt(15)],
      dayMark: afterDay?.type === 'literal' ? afterDay.value.match(/^[^\s,،]*/)[0] : '',
      isEnglish: clock.resolvedOptions().locale.startsWith('en'),
    });
  }
  return nameCache.get(key);
};

const monthName = (subject, locale, token, besideDay) =>
  (besideDay ? names(locale).besideDay : names(locale))[token][subject.month - 1];

// am and pm in the case the token asks for in English, and as the locale writes them anywhere else
const dayPeriod = (subject, locale, cased) => {
  const { dayPeriods, isEnglish } = names(locale);
  const period = dayPeriods[subject.hour < 12 ? 0 : 1];
  return isEnglish ? period[cased]() : period;
};

// 6th in English. any other language gets the day as its dates write it: 6. in German, 6日 in Japanese
const ordinal = (number, locale) => {
  const { dayMark, isEnglish } = names(locale);
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
    .formatToParts(parts.epoch)
    .find((part) => part.type === 'timeZoneName')?.value;

// each token with the field it reads, so a date asked for hours refuses instead of printing zeros
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
  d: ['weekday', (subject) => String(subject.weekday % 7)],
  dd: ['weekday', (subject, locale) => names(locale).dd[subject.weekday - 1]],
  ddd: ['weekday', (subject, locale) => names(locale).ddd[subject.weekday - 1]],
  dddd: ['weekday', (subject, locale) => names(locale).dddd[subject.weekday - 1]],
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
  X: ['epoch', (subject) => String(Math.floor(subject.epoch / 1000))],
  x: ['epoch', (subject) => String(subject.epoch)],
  Q: ['month', (subject) => String(Math.ceil(subject.month / 3))],
  W: ['weekOfYear', (subject) => String(subject.weekOfYear)],
  WW: ['weekOfYear', (subject) => pad(subject.weekOfYear)],
};

// longest spelling first so MMMM never reads as four Ms. text in brackets passes through as written.
// a letter that is no token is caught last, so a misspelled preset refuses instead of printing
// 'meduim' as minutes and letters. T passes, the way 'YYYY-MM-DDTHH:mm' writes it
const tokenPattern = new RegExp(
  `\\[([^\\]]*)\\]|${Object.keys(tokenReaders).sort((a, b) => b.length - a.length).join('|')}|([A-SU-Za-z])`,
  'g',
);

// the tables the tokens read, for a picker's headers and a month dropdown. weekdays start where the
// week does, so the header row matches the grid
export const weekdayNames = (style = 'short', firstDay, locale) => {
  const table = names(pickLocale(locale))[style === 'long' ? 'dddd' : 'ddd'];
  const first = weekStart(firstDay, locale) - 1;
  return [...table.slice(first), ...table.slice(0, first)];
};

export const monthNames = (
  style = 'long',
  locale,
) => [...names(pickLocale(locale))[style === 'short' ? 'MMM' : 'MMMM']];

export const formatTokens = (subject, kind, pattern, locale) => {
  const resolved = pickLocale(locale);
  // a month straight after a day takes the form it has beside one, the rule moment keeps. a month
  // with text bracketed onto it, MMMM[ta], is being inflected by hand and stays plain
  const besideDay = /D[oD]?\.?(\[[^\]]*\]|\s)+MMMM?(?![M[])/.test(pattern);
  return pattern.replace(tokenPattern, (token, literal, stray) => {
    if (literal !== undefined) {
      return literal;
    }
    if (stray) {
      refuse('unknownFormat', pattern, {
        explanation: isDevelopment
          ? `a format is a preset like 'medium', an Intl options object, or a token pattern like 'YYYY-MM-DD'. '${stray}' is no token. text goes in brackets: [at]`
          : 0,
      });
    }
    const [field, read] = tokenReaders[token];
    if (subject[field] === undefined) {
      refuse('noField', `${token} in '${pattern}'`, {
        explanation: isDevelopment ? `a ${kind} has no ${field}` : 0,
      });
    }
    return read(subject, resolved, besideDay);
  });
};
