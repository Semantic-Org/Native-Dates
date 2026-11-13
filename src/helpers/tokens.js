import { refuse } from './errors.js';
import { plainDateTimeFormat, zonedDateTimeFormat } from './intl.js';
import { isDevelopment } from './types.js';
import { pad } from './units.js';
import { locale as pickLocale, weekStart } from './zones.js';

const nameCache = new Map();

// month and weekday names come from Intl for the locale, so tokens stay legible outside English
const names = (locale) => {
  const key = locale ?? '';
  if (!nameCache.has(key)) {
    const month = (style) =>
      Array.from(
        { length: 12 },
        (_, i) => plainDateTimeFormat(locale, { month: style }).format(Date.UTC(2000, i, 1)),
      );
    // 2024-01-01 fell on a monday, so index 0 is monday to match ISO weekday numbering
    const weekday = (style) =>
      Array.from(
        { length: 7 },
        (_, i) => plainDateTimeFormat(locale, { weekday: style }).format(Date.UTC(2024, 0, 1 + i)),
      );
    nameCache.set(key, { MMM: month('short'), MMMM: month('long'), ddd: weekday('short'), dddd: weekday('long') });
  }
  return nameCache.get(key);
};

const ordinal = (number) => {
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
  MMM: ['month', (subject, locale) => names(locale).MMM[subject.month - 1]],
  MMMM: ['month', (subject, locale) => names(locale).MMMM[subject.month - 1]],
  D: ['day', (subject) => String(subject.day)],
  DD: ['day', (subject) => pad(subject.day)],
  Do: ['day', (subject) => ordinal(subject.day)],
  DDD: ['dayOfYear', (subject) => String(subject.dayOfYear)],
  DDDD: ['dayOfYear', (subject) => pad(subject.dayOfYear, 3)],
  d: ['weekday', (subject) => String(subject.weekday % 7)],
  dd: ['weekday', (subject, locale) => names(locale).ddd[subject.weekday - 1].slice(0, 2)],
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
  A: ['hour', (subject) => (subject.hour < 12 ? 'AM' : 'PM')],
  a: ['hour', (subject) => (subject.hour < 12 ? 'am' : 'pm')],
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
  const first = weekStart(firstDay) - 1;
  return [...table.slice(first), ...table.slice(0, first)];
};

export const monthNames = (
  style = 'long',
  locale,
) => [...names(pickLocale(locale))[style === 'short' ? 'MMM' : 'MMMM']];

export const formatTokens = (subject, kind, pattern, locale) => {
  const resolved = pickLocale(locale);
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
    return read(subject, resolved);
  });
};
