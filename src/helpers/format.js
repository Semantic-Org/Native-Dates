import { refuse } from './errors.js';
import { cached, plainDateTimeFormat, zonedDateTimeFormat } from './intl.js';
import { isDevelopment, isPlainObject, isString } from './types.js';
import { locale as pickLocale } from './zones.js';

const presets = {
  datetime: {
    short: { dateStyle: 'short', timeStyle: 'short' },
    medium: { dateStyle: 'medium', timeStyle: 'short' },
    long: { dateStyle: 'long', timeStyle: 'short' },
    full: { dateStyle: 'full', timeStyle: 'short' },
    date: { dateStyle: 'medium' },
    time: { timeStyle: 'short' },
    month: { month: 'long', year: 'numeric' },
    text: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    },
  },
  date: {
    short: { dateStyle: 'short' },
    medium: { dateStyle: 'medium' },
    long: { dateStyle: 'long' },
    full: { dateStyle: 'full' },
    month: { month: 'long', year: 'numeric' },
  },
  time: {
    default: { timeStyle: 'short' },
    short: { timeStyle: 'short' },
    medium: { timeStyle: 'medium' },
    long: { timeStyle: 'long' },
    full: { timeStyle: 'full' },
  },
};

// frozen, so a preset keys its formatter by identity and a format call serializes nothing
for (const kind of Object.values(presets)) {
  for (const options of Object.values(kind)) {
    Object.freeze(options);
  }
}

// a preset name or an Intl options bag resolves to Intl options, anything else resolves to undefined
export const intlOptions = (kind, spec) => {
  if (spec === undefined) {
    return presets[kind].default ?? presets[kind].medium;
  }
  if (isPlainObject(spec)) {
    return spec;
  }
  if (!isString(spec)) {
    refuse('unknownFormat', String(spec), {
      explanation: isDevelopment
        ? "a format is a preset like 'medium', an Intl options object, or a token pattern with plugins/tokens"
        : 0,
    });
  }
  return Object.hasOwn(presets[kind], spec) ? presets[kind][spec] : undefined;
};

export const unknownFormat = (spec) =>
  refuse('unknownFormat', String(spec), {
    explanation: isDevelopment
      ? "a format is a preset like 'medium' or an Intl options object. import '@native-dates/plugins/tokens' for patterns like 'YYYY-MM-DD'"
      : 0,
  });

// Intl gets epoch milliseconds and a zone on every engine. a date is its UTC midnight read in UTC, a
// time is that clock on the epoch day, so the fields print unshifted whether Temporal is native or not
export const epochOf = (kind, subject) => {
  if (kind === 'date') {
    // Date.UTC reads a year under 100 as the 1900s, setUTCFullYear reads it as written
    const stamp = new Date(0);
    stamp.setUTCFullYear(subject.year, subject.month - 1, subject.day);
    return stamp.getTime();
  }
  if (kind === 'time') {
    return Date.UTC(1970, 0, 1, subject.hour, subject.minute, subject.second, subject.millisecond);
  }
  return subject;
};

export const formatter = (kind, options, locale, zone) =>
  kind === 'datetime'
    ? zonedDateTimeFormat(pickLocale(locale), options, zone)
    : plainDateTimeFormat(pickLocale(locale), options);

export const formatIntl = (kind, subject, options, locale, zone) =>
  formatter(kind, options, locale, zone).format(epochOf(kind, subject));

// the calendars that keep the Gregorian months and days, and count only the year their own way
const gregorianMonths = ['gregory', 'buddhist', 'japanese', 'roc'];

// the formatter for a part of a date, a month and a day or a year and a month. in a calendar with
// other months the part falls on different days each year, so a locale that keeps one prints the
// Gregorian months instead, and such a calendar asked for by name has no formatter. the ISO
// calendar's months are the Gregorian ones, but Intl has no names for them, so it prints as Gregorian
const partFormatterFor = (locale, options) => {
  const format = plainDateTimeFormat(locale, options);
  const calendar = format.resolvedOptions().calendar;
  if (gregorianMonths.includes(calendar)) {
    return format;
  }
  return options.calendar === undefined || calendar === 'iso8601'
    ? plainDateTimeFormat(locale, { ...options, calendar: 'gregory' })
    : undefined;
};

// the choice is made once per locale and options, on first use, so a bundle that formats no such
// part carries no cache for one
let partFormatters;
export const partFormatter = (options, locale) => {
  partFormatters ??= cached(partFormatterFor);
  return partFormatters(pickLocale(locale), options);
};
