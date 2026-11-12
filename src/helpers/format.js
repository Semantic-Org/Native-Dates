import { refuse } from './errors.js';
import { plainDateTimeFormat, zonedDateTimeFormat } from './intl.js';
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
  date: {},
  time: {
    default: { timeStyle: 'short' },
    short: { timeStyle: 'short' },
    medium: { timeStyle: 'medium' },
    // Intl's long and full time styles only add a zone name, and a time has no zone
    long: { timeStyle: 'medium' },
    full: { timeStyle: 'medium' },
  },
};

const dateParts = ['dateStyle', 'weekday', 'era', 'year', 'month', 'day'];
const timeParts = ['timeStyle', 'hour', 'minute', 'second', 'fractionalSecondDigits', 'dayPeriod'];
const zoneParts = ['timeZone', 'timeZoneName'];
const ownParts = { date: dateParts, time: timeParts };
const otherParts = { date: [...timeParts, ...zoneParts], time: [...dateParts, ...zoneParts] };

// a date prints only date parts and a time only clock parts, so one options bag can format a datetime, a
// date and a time alike. a bag that names none of the noun's own parts prints the noun's default
const ownOptions = (kind, bag) => {
  const options = { ...bag };
  for (const part of otherParts[kind]) {
    delete options[part];
  }
  if (options.timeStyle === 'long' || options.timeStyle === 'full') {
    options.timeStyle = 'medium';
  }
  const namesOwnPart = ownParts[kind].some((part) => options[part] !== undefined);
  return namesOwnPart ? options : { ...intlOptions(kind), ...options };
};

// a preset name or an Intl options bag resolves to Intl options, anything else resolves to undefined
export const intlOptions = (kind, spec) => {
  if (spec === undefined) {
    return presets[kind].default ?? presets[kind].medium;
  }
  if (isPlainObject(spec)) {
    return kind === 'datetime' ? spec : ownOptions(kind, spec);
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

// every preset name formats every noun. a date and a time take their own parts of the datetime preset
for (const kind of ['date', 'time']) {
  for (const [name, options] of Object.entries(presets.datetime)) {
    presets[kind][name] ??= ownOptions(kind, options);
  }
}

// frozen, so a preset keys its formatter by identity and a format call serializes nothing
for (const kind of Object.values(presets)) {
  for (const options of Object.values(kind)) {
    Object.freeze(options);
  }
}

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
