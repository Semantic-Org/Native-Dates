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
  YYYY: ['year', (p) => (p.year < 0 ? '-' : '') + pad(p.year, 4)],
  YY: ['year', (p) => pad(p.year % 100)],
  M: ['month', (p) => String(p.month)],
  MM: ['month', (p) => pad(p.month)],
  MMM: ['month', (p, l) => names(l).MMM[p.month - 1]],
  MMMM: ['month', (p, l) => names(l).MMMM[p.month - 1]],
  D: ['day', (p) => String(p.day)],
  DD: ['day', (p) => pad(p.day)],
  Do: ['day', (p) => ordinal(p.day)],
  dd: ['weekday', (p, l) => names(l).ddd[p.weekday - 1].slice(0, 2)],
  ddd: ['weekday', (p, l) => names(l).ddd[p.weekday - 1]],
  dddd: ['weekday', (p, l) => names(l).dddd[p.weekday - 1]],
  H: ['hour', (p) => String(p.hour)],
  HH: ['hour', (p) => pad(p.hour)],
  h: ['hour', (p) => String(p.hour % 12 || 12)],
  hh: ['hour', (p) => pad(p.hour % 12 || 12)],
  m: ['minute', (p) => String(p.minute)],
  mm: ['minute', (p) => pad(p.minute)],
  s: ['second', (p) => String(p.second)],
  ss: ['second', (p) => pad(p.second)],
  SSS: ['millisecond', (p) => pad(p.millisecond, 3)],
  A: ['hour', (p) => (p.hour < 12 ? 'AM' : 'PM')],
  a: ['hour', (p) => (p.hour < 12 ? 'am' : 'pm')],
  Z: ['offset', (p) => p.offset],
  ZZ: ['offset', (p) => p.offset.replace(':', '')],
  z: ['zone', (p, l) => zoneName(p, l, 'short')],
  zzzz: ['zone', (p, l) => zoneName(p, l, 'long')],
  X: ['epoch', (p) => String(Math.floor(p.epoch / 1000))],
  x: ['epoch', (p) => String(p.epoch)],
  Q: ['month', (p) => String(Math.ceil(p.month / 3))],
  W: ['weekOfYear', (p) => String(p.weekOfYear)],
};

// longest spelling first so MMMM never reads as four Ms. text in brackets passes through as written
const tokenPattern = new RegExp(
  `\\[([^\\]]*)\\]|${Object.keys(tokenReaders).sort((a, b) => b.length - a.length).join('|')}`,
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
  return pattern.replace(tokenPattern, (token, literal) => {
    if (literal !== undefined) {
      return literal;
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
