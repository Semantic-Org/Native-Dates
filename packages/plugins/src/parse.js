import { isDevelopment } from 'native-dates/helpers/environment';
import { refuse, refuseType, setFormatExtension } from 'native-dates/helpers/errors';
import { names, tokenPattern } from 'native-dates/helpers/tokens';
import { pad } from 'native-dates/helpers/units';
import { cached, isString } from 'native-dates/helpers/utils';
import { checkedDisambiguation, locale as pickLocale, namedFormat, zoneId } from 'native-dates/helpers/zones';

/*
  deterministic format-mask parser for core factories (`{ format: 'DDMMYYYY' }`).
  Reuses core's token grammar and localized Intl month/weekday/meridiem tables,
  compiles each (pattern, kind, locale) triple once, and rejects impossible dates
  or mismatched weekdays rather than rolling forward
*/

const codes = {
  datetime: ['missingDateTime', 'invalidDateTime'],
  date: ['missingDate', 'invalidDate'],
  time: ['missingTime', 'invalidTime'],
  yearMonth: ['missingYearMonth', 'invalidYearMonth'],
  monthDay: ['missingMonthDay', 'invalidMonthDay'],
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

const numberIn = (text, min, max) => {
  const value = Number(text);
  return value >= min && value <= max ? value : undefined;
};

const buildToken = (token, locale, table) => {
  switch (token) {
    case 'YYYY':
      return ['year', '(\\d{4})', (raw, out) => record(out, 'year', Number(raw))];
    case 'YY':
      return [
        'year',
        '(\\d{2})',
        (raw, out) => {
          const two = Number(raw);
          return record(out, 'year', two >= 70 ? 1900 + two : 2000 + two);
        },
      ];
    case 'MM':
      return ['month', '(\\d{2})', (raw, out) => record(out, 'month', numberIn(raw, 1, 12))];
    case 'M':
      return ['month', '(\\d{1,2})', (raw, out) => record(out, 'month', numberIn(raw, 1, 12))];
    case 'MMM':
    case 'MMMM': {
      const lists = [table[token], table.besideDay[token]];
      const map = lookupMap(lists, locale);
      return [
        'month',
        `(${choice(lists.flat())})`,
        (raw, out) => record(out, 'month', map.get(raw.toLocaleLowerCase(locale))),
      ];
    }
    case 'DD':
      return ['day', '(\\d{2})', (raw, out) => record(out, 'day', numberIn(raw, 1, 31))];
    case 'D':
      return ['day', '(\\d{1,2})', (raw, out) => record(out, 'day', numberIn(raw, 1, 31))];
    case 'Do': {
      const suffix = table.isEnglish ? '(?i:st|nd|rd|th)' : escapeRegex(table.dayMark);
      return [
        'day',
        `(\\d{1,2}${suffix})`,
        (raw, out) => {
          const digits = raw.match(/^\d{1,2}/)[0];
          const day = numberIn(digits, 1, 31);
          if (!day) {
            return false;
          }
          if (table.isEnglish && raw.slice(digits.length).toLowerCase() !== englishOrdinalSuffix(day)) {
            return false;
          }
          return record(out, 'day', day);
        },
      ];
    }
    case 'DDDD':
      return ['dayOfYear', '(\\d{3})', (raw, out) => record(out, 'dayOfYear', numberIn(raw, 1, 366))];
    case 'DDD':
      return ['dayOfYear', '(\\d{1,3})', (raw, out) => record(out, 'dayOfYear', numberIn(raw, 1, 366))];
    case 'WW':
      return ['weekOfYear', '(\\d{2})', (raw, out) => record(out, 'weekOfYear', numberIn(raw, 1, 53))];
    case 'W':
      return ['weekOfYear', '(\\d{1,2})', (raw, out) => record(out, 'weekOfYear', numberIn(raw, 1, 53))];
    case 'E':
      return ['dayOfWeek', '([1-7])', (raw, out) => record(out, 'dayOfWeek', Number(raw))];
    case 'd':
      return ['dayOfWeek', '([0-6])', (raw, out) => record(out, 'dayOfWeek', Number(raw) || 7)];
    case 'dd':
    case 'ddd':
    case 'dddd': {
      const map = lookupMap([table[token]], locale);
      return [
        'dayOfWeek',
        `(${choice(table[token])})`,
        (raw, out) => record(out, 'dayOfWeek', map.get(raw.toLocaleLowerCase(locale))),
      ];
    }
    case 'HH':
      return ['hour', '(\\d{2})', (raw, out) => record(out, 'hour24', numberIn(raw, 0, 23))];
    case 'H':
      return ['hour', '(\\d{1,2})', (raw, out) => record(out, 'hour24', numberIn(raw, 0, 23))];
    case 'hh':
      return ['hour', '(\\d{2})', (raw, out) => record(out, 'hour12', numberIn(raw, 1, 12))];
    case 'h':
      return ['hour', '(\\d{1,2})', (raw, out) => record(out, 'hour12', numberIn(raw, 1, 12))];
    case 'mm':
      return ['minute', '(\\d{2})', (raw, out) => record(out, 'minute', numberIn(raw, 0, 59))];
    case 'm':
      return ['minute', '(\\d{1,2})', (raw, out) => record(out, 'minute', numberIn(raw, 0, 59))];
    case 'ss':
      return ['second', '(\\d{2})', (raw, out) => record(out, 'second', numberIn(raw, 0, 59))];
    case 's':
      return ['second', '(\\d{1,2})', (raw, out) => record(out, 'second', numberIn(raw, 0, 59))];
    case 'S':
      return ['millisecond', '(\\d)', (raw, out) => record(out, 'millisecond', Number(raw) * 100)];
    case 'SS':
      return ['millisecond', '(\\d{2})', (raw, out) => record(out, 'millisecond', Number(raw) * 10)];
    case 'SSS':
      return ['millisecond', '(\\d{3})', (raw, out) => record(out, 'millisecond', Number(raw))];
    case 'A':
    case 'a': {
      const periods = table.isEnglish ? ['AM', 'PM'] : table.dayPeriods;
      const map = new Map([
        [periods[0].toLocaleLowerCase(locale), 0],
        [periods[1].toLocaleLowerCase(locale), 1],
      ]);
      return [
        'hour',
        `(${choice(periods)})`,
        (raw, out) => record(out, 'meridiem', map.get(raw.toLocaleLowerCase(locale))),
      ];
    }
    case 'Z':
      return ['offset', '([zZ]|[+-]\\d{2}:\\d{2})', (raw, out) => record(out, 'offset', raw.toUpperCase())];
    case 'ZZ':
      return [
        'offset',
        '([zZ]|[+-]\\d{4})',
        (raw, out) => record(out, 'offset', raw.length === 1 ? 'Z' : `${raw.slice(0, 3)}:${raw.slice(3)}`),
      ];
    case 'z':
    case 'zz':
      return ['zone', '([^\\s]+)', (raw, out) => record(out, 'zone', raw)];
    case 'X':
      return ['epoch', '(-?\\d+)', (raw, out) => record(out, 'epoch', Number(raw) * 1000)];
    case 'x':
      return ['epoch', '(-?\\d+)', (raw, out) => record(out, 'epoch', Number(raw))];
    default:
      return null;
  }
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

// keying on the table object auto-invalidates compiled regexes when configure() clears nameCache
const compile = cached((pattern, kind, locale, table) => {
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
    const spec = buildToken(token, locale, table);
    if (!spec) {
      refuse('unknownFormat', pattern, {
        explanation: isDevelopment
          ? `'${token}' is not a parseable format token. Wrap literal text in brackets like '[at]'`
          : 0,
      });
    }
    const [field, fragment, read] = spec;
    if (!allowed.has(field)) {
      refuse('unsupportedToken', `${token} in '${pattern}'`, {
        explanation: isDevelopment
          ? `a ${kind} does not include ${field} information. Remove that token from the format pattern`
          : 0,
      });
    }
    seen.add(field);
    source += fragment;
    readers.push(read);
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

  return {
    regex: new RegExp(source, 'u'),
    readers,
    trim: !/^\s|\s$/.test(pattern),
    hasClock: seen.has('hour') || seen.has('minute') || seen.has('second') || seen.has('millisecond'),
  };
});

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
  if (!isString(rawFormat) || !rawFormat.trim()) {
    refuse('unknownFormat', String(rawFormat), {
      explanation: isDevelopment ? "expected a non-empty format pattern string such as 'DDMMYYYY'" : 0,
    });
  }
  const pattern = namedFormat(rawFormat);
  const activeLocale = pickLocale(settings.locale);
  const compiled = compile(pattern, kind, activeLocale, names(activeLocale));

  if (input === undefined || input === null) {
    refuseType(codes[kind][0], String(input), {
      explanation: isDevelopment ? `a string matching '${pattern}' is required` : 0,
    });
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
    if (!compiled.readers[index](match[index + 1], fields)) {
      return refuseInvalid(kind, input, pattern);
    }
  }

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

    const timeZone = zoneId(settings.zone, settings.locale);
    const disambiguation = checkedDisambiguation(settings.disambiguation);
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
  catch {
    return refuseInvalid(kind, input, pattern);
  }
};

setFormatExtension(parseFormatted);
