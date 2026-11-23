import { cached, each, isPlainObject, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { refuse } from './errors.js';
import { plainDateTimeFormat, zonedDateTimeFormat } from './intl.js';
import { locale as pickLocale, namedFormat } from './zones.js';

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
    // Moment / Day.js localized format shorthands
    LT: { timeStyle: 'short' },
    LTS: { timeStyle: 'medium' },
    L: { year: 'numeric', month: '2-digit', day: '2-digit' },
    l: { year: 'numeric', month: 'numeric', day: 'numeric' },
    LL: { dateStyle: 'long' },
    ll: { dateStyle: 'medium' },
    LLL: { dateStyle: 'long', timeStyle: 'short' },
    lll: { dateStyle: 'medium', timeStyle: 'short' },
    LLLL: { dateStyle: 'full', timeStyle: 'short' },
    llll: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  },
  date: {},
  time: {
    default: { timeStyle: 'short' },
    short: { timeStyle: 'short' },
    medium: { timeStyle: 'medium' },
    // Intl timeStyle 'long' and 'full' append a timezone name, which PlainTime doesn't have
    long: { timeStyle: 'medium' },
    full: { timeStyle: 'medium' },
  },
};

const dateParts = ['dateStyle', 'weekday', 'era', 'year', 'month', 'day'];
const timeParts = ['timeStyle', 'hour', 'minute', 'second', 'fractionalSecondDigits', 'dayPeriod'];
const ownParts = { date: dateParts, time: timeParts };
const allParts = [...dateParts, ...timeParts, 'timeZone', 'timeZoneName'];

const keepParts = (bag, names) => {
  const options = { ...bag };
  each(allParts, (part) => {
    if (!names.includes(part)) {
      delete options[part];
    }
  });
  return options;
};

// strip parts the noun lacks so one options bag works across DateTime, CalendarDate, and Time
const ownOptions = (kind, bag) => {
  const options = keepParts(bag, ownParts[kind]);
  if (options.timeStyle === 'long' || options.timeStyle === 'full') {
    options.timeStyle = 'medium';
  }
  const namesOwnPart = ownParts[kind].some((part) => options[part] !== undefined);
  // spread defaults last so undefined option keys like { timeStyle: undefined } do not blank them out
  return namesOwnPart ? options : { ...options, ...intlOptions(kind) };
};

// passed as an object rather than 'text' so configure({ formats: { text } }) cannot alter value.text
export const textFormat = presets.datetime.text;

export const intlOptions = (kind, named) => {
  const spec = namedFormat(named);
  if (spec === undefined) {
    return presets[kind].default ?? presets[kind].medium;
  }
  if (isPlainObject(spec)) {
    return kind === 'datetime' ? spec : ownOptions(kind, spec);
  }
  if (!isString(spec)) {
    refuse('unknownFormat', String(spec), {
      explanation: isDevelopment
        ? "expected a format preset like 'medium', a token pattern like 'YYYY-MM-DD', or an `Intl.DateTimeFormat` options object"
        : 0,
    });
  }
  // unknown strings return undefined so callers fall through to formatTokens()
  return Object.hasOwn(presets[kind], spec) ? presets[kind][spec] : undefined;
};

each(['date', 'time'], (kind) => {
  each(presets.datetime, (options, name) => {
    presets[kind][name] ??= ownOptions(kind, options);
  });
});

// frozen so cached() in utils.js keys preset bags by reference instead of JSON.stringify
each(presets, (kind) => {
  each(kind, (options) => {
    Object.freeze(options);
  });
});

// temporal-polyfill doesn't patch Intl.DateTimeFormat, so format dates and times via UTC epoch ms
export const epochOf = (kind, subject) => {
  if (kind === 'date') {
    // Date.UTC maps years 0..99 to 1900..1999, whereas setUTCFullYear keeps them verbatim
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
    ? zonedDateTimeFormat(pickLocale(locale), options, options.timeZone ?? zone)
    : plainDateTimeFormat(pickLocale(locale), options);

export const formatIntl = (kind, subject, options, locale, zone) =>
  formatter(kind, options, locale, zone).format(epochOf(kind, subject));

// calendars that share the 12 Gregorian months while numbering years their own way (e.g. Thai 2569)
const gregorianMonths = ['gregory', 'buddhist', 'japanese', 'roc'];

// MonthDay and YearMonth are Gregorian, so override non-Gregorian calendars (e.g. Persian) to 'gregory'
// ('iso8601' prints numeric months in Intl rather than localized names)
const partFormatters = /* @__PURE__ */ cached((locale, options) => {
  const format = plainDateTimeFormat(locale, options);
  return gregorianMonths.includes(format.resolvedOptions().calendar)
    ? format
    : plainDateTimeFormat(locale, { ...options, calendar: 'gregory' });
});

export const partFormatter = (options, locale) => partFormatters(pickLocale(locale), options);

export const partOptions = (named, names, styles) => {
  const spec = namedFormat(named);
  if (isString(spec) && Object.hasOwn(styles, spec)) {
    return styles[spec];
  }
  const bag = isPlainObject(spec) ? spec : intlOptions('datetime', spec);
  if (!bag) {
    return undefined;
  }
  if (bag.dateStyle) {
    return styles[bag.dateStyle];
  }
  const options = keepParts(bag, names);
  // require at least one primary field (not just 'era') before skipping the medium fallback
  return names.slice(0, 2).some((name) => options[name] !== undefined) ? options : { ...options, ...styles.medium };
};
