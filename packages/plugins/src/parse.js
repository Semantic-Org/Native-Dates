import { CalendarDate, DateTime, kindOf, MonthDay, Time, YearMonth } from 'native-dates';
import { isDevelopment } from 'native-dates/helpers/environment';
import { refuse, refuseType, setFormatExtension } from 'native-dates/helpers/errors';
import { names, tokenPattern } from 'native-dates/helpers/tokens';
import { pad } from 'native-dates/helpers/units';
import { isDate, isString, remember } from 'native-dates/helpers/utils';
import { checkedDisambiguation, locale as pickLocale, namedFormat, zoneId } from 'native-dates/helpers/zones';

/*
  deterministic format-pattern parser for core factories (`{ format: 'DDMMYYYY' }`).
  Reuses core's token grammar and localized Intl month/weekday/meridiem tables,
  compiles each pattern once per locale table, and rejects impossible dates
  or mismatched weekdays rather than rolling forward
*/

const codes = {
  datetime: ['missingDateTime', 'invalidDateTime'],
  date: ['missingDate', 'invalidDate'],
  time: ['missingTime', 'invalidTime'],
  yearMonth: ['missingYearMonth', 'invalidYearMonth'],
  monthDay: ['missingMonthDay', 'invalidMonthDay'],
};

const constructors = {
  datetime: DateTime,
  date: CalendarDate,
  time: Time,
  yearMonth: YearMonth,
  monthDay: MonthDay,
};

const dateFields = ['year', 'month', 'day', 'dayOfYear', 'weekOfYear', 'dayOfWeek'];
const timeFields = ['hour', 'minute', 'second', 'millisecond'];
const allowedFields = {
  datetime: new Set([...dateFields, ...timeFields, 'offset', 'zone', 'epoch']),
  date: new Set(dateFields),
  time: new Set(timeFields),
  yearMonth: new Set(['year', 'month']),
  monthDay: new Set(['month', 'day']),
};

const isTemporalValue = (value) =>
  value instanceof Temporal.ZonedDateTime
  || value instanceof Temporal.Instant
  || value instanceof Temporal.PlainDateTime
  || value instanceof Temporal.PlainDate
  || value instanceof Temporal.PlainTime
  || value instanceof Temporal.PlainYearMonth
  || value instanceof Temporal.PlainMonthDay;

const isParsedValue = (value) => isDate(value) || Object.hasOwn(constructors, kindOf(value)) || isTemporalValue(value);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const choice = (items) =>
  `(?i:${[...new Set(items)].filter(Boolean).sort((a, b) => b.length - a.length).map(escapeRegex).join('|')})`;

const lookupMap = (lists, locale) => {
  const map = new Map();
  for (const list of lists) {
    list.forEach((word, index) => {
      const key = word.toLocaleLowerCase(locale);
      if (!map.has(key)) {
        map.set(key, index + 1);
      }
    });
  }
  return map;
};

const englishOrdinalSuffix = (day) => {
  const tens = day % 100;
  return tens >= 11 && tens <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th';
};

// assigns a parsed field while rejecting contradictory values when a token appears twice
const record = (fields, key, value) => {
  if (value === undefined || Number.isNaN(value)) {
    return false;
  }
  if (key in fields && fields[key] !== value) {
    return false;
  }
  fields[key] = value;
  return true;
};

const numberIn = (min, max) => (text) => {
  const value = Number(text);
  return value >= min && value <= max ? value : undefined;
};

const readMonth = numberIn(1, 12);
const readDay = numberIn(1, 31);
const readDayOfYear = numberIn(1, 366);
const readWeek = numberIn(1, 53);
const readHour24 = numberIn(0, 23);
const readHour12 = numberIn(1, 12);
const readSixty = numberIn(0, 59);

const monthSpec = (token) => (locale, table) => {
  const lists = [table[token], table.besideDay[token]];
  const map = lookupMap(lists, locale);
  return ['month', `(${choice(lists.flat())})`, 'month', (raw) => map.get(raw.toLocaleLowerCase(locale))];
};

const weekdaySpec = (token) => (locale, table) => {
  const map = lookupMap([table[token]], locale);
  return ['dayOfWeek', `(${choice(table[token])})`, 'dayOfWeek', (raw) => map.get(raw.toLocaleLowerCase(locale))];
};

const meridiemSpec = (locale, table) => {
  const periods = table.isEnglish ? ['AM', 'PM'] : table.dayPeriods;
  const map = new Map([
    [periods[0].toLocaleLowerCase(locale), 0],
    [periods[1].toLocaleLowerCase(locale), 1],
  ]);
  return ['hour', `(${choice(periods)})`, 'meridiem', (raw) => map.get(raw.toLocaleLowerCase(locale))];
};

const ordinalSpec = (_locale, table) => {
  const suffix = table.isEnglish ? '(?i:st|nd|rd|th)' : escapeRegex(table.dayMark);
  return [
    'day',
    `(\\d{1,2}${suffix})`,
    'day',
    (raw) => {
      const digits = raw.match(/^\d{1,2}/)[0];
      const day = readDay(digits);
      if (!day || (table.isEnglish && raw.slice(digits.length).toLowerCase() !== englishOrdinalSuffix(day))) {
        return undefined;
      }
      return day;
    },
  ];
};

// each entry is [allowedField, regexFragment, outputKey, readValue] or a (locale, table) => tuple builder
const tokenSpecs = {
  __proto__: null,
  YYYY: ['year', '(\\d{4})', 'year', Number],
  YY: [
    'year',
    '(\\d{2})',
    'year',
    (raw) => {
      const two = Number(raw);
      return two >= 69 ? 1900 + two : 2000 + two;
    },
  ],
  MM: ['month', '(\\d{2})', 'month', readMonth],
  M: ['month', '(\\d{1,2})', 'month', readMonth],
  MMM: monthSpec('MMM'),
  MMMM: monthSpec('MMMM'),
  DD: ['day', '(\\d{2})', 'day', readDay],
  D: ['day', '(\\d{1,2})', 'day', readDay],
  Do: ordinalSpec,
  DDDD: ['dayOfYear', '(\\d{3})', 'dayOfYear', readDayOfYear],
  DDD: ['dayOfYear', '(\\d{1,3})', 'dayOfYear', readDayOfYear],
  WW: ['weekOfYear', '(\\d{2})', 'weekOfYear', readWeek],
  W: ['weekOfYear', '(\\d{1,2})', 'weekOfYear', readWeek],
  E: ['dayOfWeek', '([1-7])', 'dayOfWeek', Number],
  d: ['dayOfWeek', '([0-6])', 'dayOfWeek', (raw) => Number(raw) || 7],
  dd: weekdaySpec('dd'),
  ddd: weekdaySpec('ddd'),
  dddd: weekdaySpec('dddd'),
  HH: ['hour', '(\\d{2})', 'hour24', readHour24],
  H: ['hour', '(\\d{1,2})', 'hour24', readHour24],
  hh: ['hour', '(\\d{2})', 'hour12', readHour12],
  h: ['hour', '(\\d{1,2})', 'hour12', readHour12],
  mm: ['minute', '(\\d{2})', 'minute', readSixty],
  m: ['minute', '(\\d{1,2})', 'minute', readSixty],
  ss: ['second', '(\\d{2})', 'second', readSixty],
  s: ['second', '(\\d{1,2})', 'second', readSixty],
  S: ['millisecond', '(\\d)', 'millisecond', (raw) => Number(raw) * 100],
  SS: ['millisecond', '(\\d{2})', 'millisecond', (raw) => Number(raw) * 10],
  SSS: ['millisecond', '(\\d{3})', 'millisecond', Number],
  A: meridiemSpec,
  a: meridiemSpec,
  Z: ['offset', '([zZ]|[+-]\\d{2}:\\d{2})', 'offset', (raw) => raw.toUpperCase()],
  ZZ: [
    'offset',
    '([zZ]|[+-]\\d{4})',
    'offset',
    (raw) => (raw.length === 1 ? 'Z' : `${raw.slice(0, 3)}:${raw.slice(3)}`),
  ],
  z: ['zone', '([^\\s]+)', 'zone', (raw) => raw],
  zz: ['zone', '([^\\s]+)', 'zone', (raw) => raw],
  X: ['epoch', '(-?\\d+)', 'epoch', (raw) => Number(raw) * 1000],
  x: ['epoch', '(-?\\d+)', 'epoch', Number],
};

const hasCompletePattern = (kind, seen) => {
  const hasDate = seen.has('year')
    && ((seen.has('month') && seen.has('day')) || seen.has('dayOfYear') || seen.has('weekOfYear'));
  const hasSubHour = seen.has('minute') || seen.has('second') || seen.has('millisecond');
  if (hasSubHour && !seen.has('hour')) {
    return false;
  }
  if (kind === 'date') {
    return hasDate;
  }
  if (kind === 'datetime') {
    return seen.has('epoch') || hasDate;
  }
  if (kind === 'time') {
    return seen.has('hour');
  }
  if (kind === 'yearMonth') {
    return seen.has('year') && seen.has('month');
  }
  return seen.has('month') && seen.has('day');
};

// WeakMap keyed by table identity avoids serializing locale tables and clears automatically when configure() resets nameCache
const compiledByTable = new WeakMap();

const compile = (pattern, kind, locale, table) => {
  let bucket = compiledByTable.get(table);
  if (!bucket) {
    bucket = new Map();
    compiledByTable.set(table, bucket);
  }
  const cacheKey = `${kind}\0${pattern}`;
  const hit = bucket.get(cacheKey);
  if (hit) {
    return hit;
  }

  const allowed = allowedFields[kind];
  const readers = [];
  const seen = new Set();
  let source = '^';
  let cursor = 0;

  for (const match of pattern.matchAll(tokenPattern)) {
    if (match.index > cursor) {
      source += escapeRegex(pattern.slice(cursor, match.index));
    }
    cursor = match.index + match[0].length;
    const [token, literal] = match;
    if (literal !== undefined) {
      source += escapeRegex(literal);
      continue;
    }
    const entry = tokenSpecs[token];
    if (!entry) {
      refuse('unknownFormat', pattern, {
        explanation: isDevelopment
          ? `'${token}' is not a parseable format token. Wrap literal text in brackets like '[at]'`
          : 0,
      });
    }
    const [field, fragment, key, read] = typeof entry === 'function' ? entry(locale, table) : entry;
    if (!allowed.has(field)) {
      refuse('unsupportedToken', `${token} in '${pattern}'`, {
        explanation: isDevelopment
          ? `a ${kind} does not include ${field} information. Remove that token from the format pattern`
          : 0,
      });
    }
    seen.add(field);
    source += fragment;
    readers.push([key, read]);
  }

  if (cursor < pattern.length) {
    source += escapeRegex(pattern.slice(cursor));
  }
  source += '$';

  if (!hasCompletePattern(kind, seen)) {
    refuse('unknownFormat', pattern, {
      explanation: isDevelopment
        ? `format pattern '${pattern}' does not include enough fields to build a ${kind}`
        : 0,
    });
  }

  return remember(bucket, cacheKey, {
    regex: new RegExp(source, 'u'),
    readers,
    trim: !/^\s|\s$/.test(pattern),
    hasClock: seen.has('hour') || seen.has('minute') || seen.has('second') || seen.has('millisecond'),
  });
};

const resolveDate = (fields) => {
  let plain;
  if ('month' in fields && 'day' in fields) {
    plain = Temporal.PlainDate.from({ year: fields.year, month: fields.month, day: fields.day }, {
      overflow: 'reject',
    });
  }
  else if ('dayOfYear' in fields) {
    const jan1 = Temporal.PlainDate.from({ year: fields.year, month: 1, day: 1 }, { overflow: 'reject' });
    if (fields.dayOfYear > jan1.daysInYear) {
      return undefined;
    }
    plain = jan1.add({ days: fields.dayOfYear - 1 });
  }
  else {
    const jan4 = Temporal.PlainDate.from({ year: fields.year, month: 1, day: 4 }, { overflow: 'reject' });
    const week1Monday = jan4.subtract({ days: jan4.dayOfWeek - 1 });
    plain = week1Monday.add({ days: (fields.weekOfYear - 1) * 7 + ((fields.dayOfWeek ?? 1) - 1) });
    if (plain.yearOfWeek !== fields.year || plain.weekOfYear !== fields.weekOfYear) {
      return undefined;
    }
  }
  if ('dayOfYear' in fields && plain.dayOfYear !== fields.dayOfYear) {
    return undefined;
  }
  if ('weekOfYear' in fields && plain.weekOfYear !== fields.weekOfYear) {
    return undefined;
  }
  if ('dayOfWeek' in fields && plain.dayOfWeek !== fields.dayOfWeek) {
    return undefined;
  }
  return plain;
};

const resolveTime = (fields) => {
  let hour;
  if ('hour24' in fields) {
    if ('hour12' in fields) {
      return undefined;
    }
    if ('meridiem' in fields && (fields.hour24 >= 12 ? 1 : 0) !== fields.meridiem) {
      return undefined;
    }
    hour = fields.hour24;
  }
  else if ('hour12' in fields) {
    hour = 'meridiem' in fields ? (fields.hour12 % 12) + (fields.meridiem ? 12 : 0) : fields.hour12;
  }
  else {
    return undefined;
  }
  return Temporal.PlainTime.from(
    { hour, minute: fields.minute ?? 0, second: fields.second ?? 0, millisecond: fields.millisecond ?? 0 },
    { overflow: 'reject' },
  );
};

const refuseInvalid = (kind, input, pattern) =>
  refuse(codes[kind][1], String(input), {
    explanation: isDevelopment ? `input does not match format pattern '${pattern}'` : 0,
  });

export const parseFormatted = (kind, input, settings = {}) => {
  const rawFormat = settings.format;
  const pattern = isString(rawFormat) ? namedFormat(rawFormat) : rawFormat;
  if (!isString(pattern) || !pattern.trim()) {
    refuse('unknownFormat', String(rawFormat), {
      explanation: isDevelopment
        ? isString(rawFormat) && !isString(pattern)
          ? `named format '${rawFormat}' resolves to an \`Intl\` options object rather than a token format pattern string. Use a token string such as 'DDMMYYYY' with \`{ format }\``
          : "expected a non-empty format pattern string such as 'DDMMYYYY'"
        : 0,
    });
  }
  const activeLocale = pickLocale(settings.locale);
  const compiled = compile(pattern, kind, activeLocale, names(activeLocale));

  if (input === undefined || input === null) {
    refuseType(codes[kind][0], String(input), {
      explanation: isDevelopment ? `a string matching format pattern '${pattern}' is required` : 0,
    });
  }
  if (isParsedValue(input)) {
    return new constructors[kind](input, { ...settings, format: undefined }).toTemporal();
  }
  if (!isString(input)) {
    refuseType(codes[kind][1], String(input), {
      explanation: isDevelopment ? `expected a string matching format pattern '${pattern}'` : 0,
    });
  }

  const text = compiled.trim ? input.trim() : input;
  const match = compiled.regex.exec(text);
  if (!match) {
    return refuseInvalid(kind, input, pattern);
  }

  const fields = {};
  for (let index = 0; index < compiled.readers.length; index++) {
    const [key, read] = compiled.readers[index];
    if (!record(fields, key, read(match[index + 1]))) {
      return refuseInvalid(kind, input, pattern);
    }
  }

  const timeZone = kind === 'datetime' ? zoneId(settings.zone, settings.locale) : undefined;
  const disambiguation = kind === 'datetime' ? checkedDisambiguation(settings.disambiguation) : undefined;

  try {
    if (kind === 'yearMonth') {
      return Temporal.PlainYearMonth.from({ year: fields.year, month: fields.month }, { overflow: 'reject' });
    }
    if (kind === 'monthDay') {
      return Temporal.PlainMonthDay.from({ monthCode: `M${pad(fields.month)}`, day: fields.day }, {
        overflow: 'reject',
      });
    }
    if (kind === 'time') {
      const plainTime = resolveTime(fields);
      return plainTime || refuseInvalid(kind, input, pattern);
    }
    if (kind === 'date') {
      const plainDate = resolveDate(fields);
      return plainDate || refuseInvalid(kind, input, pattern);
    }

    if ('epoch' in fields) {
      const zoned = Temporal.Instant.fromEpochMilliseconds(fields.epoch).toZonedDateTimeISO(timeZone);
      if ('year' in fields) {
        const expected = resolveDate(fields);
        if (!expected || !zoned.toPlainDate().equals(expected)) {
          return refuseInvalid(kind, input, pattern);
        }
      }
      return zoned;
    }

    const plainDate = resolveDate(fields);
    if (!plainDate) {
      return refuseInvalid(kind, input, pattern);
    }
    const plainTime = compiled.hasClock ? resolveTime(fields) : undefined;
    if (compiled.hasClock && !plainTime) {
      return refuseInvalid(kind, input, pattern);
    }
    const plainDateTime = plainTime ? plainDate.toPlainDateTime(plainTime) : plainDate.toPlainDateTime();

    if ('offset' in fields) {
      const zoned = Temporal.Instant.from(`${plainDateTime}${fields.offset}`).toZonedDateTimeISO(timeZone);
      if ('zone' in fields) {
        const namedZone = zoneId(fields.zone, settings.locale);
        if (zoned.withTimeZone(namedZone).offset !== (fields.offset === 'Z' ? '+00:00' : fields.offset)) {
          return refuseInvalid(kind, input, pattern);
        }
        return settings.zone === undefined ? zoned.withTimeZone(namedZone) : zoned;
      }
      return zoned;
    }
    if ('zone' in fields) {
      const parsedZone = zoneId(fields.zone, settings.locale);
      const zoned = compiled.hasClock
        ? plainDateTime.toZonedDateTime(parsedZone, { disambiguation })
        : plainDate.toZonedDateTime({ timeZone: parsedZone });
      return settings.zone === undefined ? zoned : zoned.withTimeZone(timeZone);
    }
    return compiled.hasClock
      ? plainDateTime.toZonedDateTime(timeZone, { disambiguation })
      : plainDate.toZonedDateTime({ timeZone });
  }
  catch (error) {
    if (error?.code && error.code !== 'unknownZone') {
      throw error;
    }
    const hint = isDevelopment && error?.code === 'unknownZone' && error.message.split('\n')[1];
    return refuse(codes[kind][1], String(input), {
      explanation: isDevelopment
        ? hint
          ? `inline time zone '${fields.zone}' is not recognized: ${hint}`
          : `input does not match format pattern '${pattern}'`
        : 0,
    });
  }
};

setFormatExtension(parseFormatted);
