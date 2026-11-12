import { refuse } from 'native-dates/helpers/errors';
import { setTokenExtension } from 'native-dates/helpers/format';
import { plainDateTimeFormat, zonedDateTimeFormat } from 'native-dates/helpers/intl';
import { isDevelopment } from 'native-dates/helpers/types';
import { pad } from 'native-dates/helpers/units';
import { locale as pickLocale, weekStart } from 'native-dates/helpers/zones';

// longest spelling first so MMMM never reads as four Ms
const tokenPattern =
  /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|Do|DD|D|dddd|ddd|dd|HH|H|hh|h|mm|m|ss|s|SSS|A|a|ZZ|Z|zzzz|z|X|x|Q|W/g;

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

const tokenReaders = {
  YYYY: (p) => (p.year < 0 ? '-' : '') + pad(p.year, 4),
  YY: (p) => pad(p.year % 100),
  M: (p) => String(p.month),
  MM: (p) => pad(p.month),
  MMM: (p, l) => names(l).MMM[p.month - 1],
  MMMM: (p, l) => names(l).MMMM[p.month - 1],
  D: (p) => String(p.day),
  DD: (p) => pad(p.day),
  Do: (p) => ordinal(p.day),
  dd: (p, l) => names(l).ddd[p.weekday - 1].slice(0, 2),
  ddd: (p, l) => names(l).ddd[p.weekday - 1],
  dddd: (p, l) => names(l).dddd[p.weekday - 1],
  H: (p) => String(p.hour),
  HH: (p) => pad(p.hour),
  h: (p) => String(p.hour % 12 || 12),
  hh: (p) => pad(p.hour % 12 || 12),
  m: (p) => String(p.minute),
  mm: (p) => pad(p.minute),
  s: (p) => String(p.second),
  ss: (p) => pad(p.second),
  SSS: (p) => pad(p.millisecond, 3),
  A: (p) => (p.hour < 12 ? 'AM' : 'PM'),
  a: (p) => (p.hour < 12 ? 'am' : 'pm'),
  Z: (p) => p.offset,
  ZZ: (p) => p.offset.replace(':', ''),
  z: (p, l) => zoneName(p, l, 'short'),
  zzzz: (p, l) => zoneName(p, l, 'long'),
  X: (p) => String(Math.floor(p.epoch / 1000)),
  x: (p) => String(p.epoch),
  Q: (p) => String(Math.ceil(p.month / 3)),
  W: (p) => String(p.weekOfYear),
};

// the field each token reads, so a date asked for hours refuses instead of printing zeros
const needs = {
  YYYY: 'year',
  YY: 'year',
  M: 'month',
  MM: 'month',
  MMM: 'month',
  MMMM: 'month',
  Q: 'month',
  D: 'day',
  DD: 'day',
  Do: 'day',
  dd: 'weekday',
  ddd: 'weekday',
  dddd: 'weekday',
  W: 'weekOfYear',
  H: 'hour',
  HH: 'hour',
  h: 'hour',
  hh: 'hour',
  A: 'hour',
  a: 'hour',
  m: 'minute',
  mm: 'minute',
  s: 'second',
  ss: 'second',
  SSS: 'millisecond',
  Z: 'offset',
  ZZ: 'offset',
  z: 'zone',
  zzzz: 'zone',
  X: 'epoch',
  x: 'epoch',
};

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
    if (subject[needs[token]] === undefined) {
      refuse('noField', `${token} in '${pattern}'`, {
        explanation: isDevelopment ? `a ${kind} has no ${needs[token]}` : 0,
      });
    }
    return tokenReaders[token](subject, resolved);
  });
};

setTokenExtension(formatTokens);
