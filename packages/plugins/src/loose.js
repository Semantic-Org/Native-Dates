import { setLooseExtension } from 'native-dates/helpers/errors';
import { names } from 'native-dates/helpers/tokens';
import { dayFirst as readsDayFirst, locale as pickLocale, zoneId } from 'native-dates/helpers/zones';

/*
  reads informal dates the way the active locale writes them. Intl supplies the month names, AM/PM words,
  and day-month order, Temporal checks the calendar, and Date.parse reads the machine formats (RFC 2822, asctime)
*/

// digits in any script count up from their zero ('٥' sits five above '٠'), and NFKC narrows fullwidth forms
const digitValue = (digit) => {
  let value = 0;
  while (/\p{Nd}/u.test(String.fromCodePoint(digit.codePointAt(0) - value - 1))) {
    value++;
  }
  return value % 10;
};
const fold = (text) =>
  text.normalize('NFKC').replace(/[\u200e\u200f\u061c]/g, '').replace(/(?![0-9])\p{Nd}/gu, digitValue);

// a name counts only as a whole word, so 'mar' is not found inside 'martes'
const either = (spellings) => spellings.map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const word = (spellings) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${either(spellings)})(?![\\p{L}\\p{M}])`, 'u');

// AM and PM count only against the clock, marked here as \0, so German 'am 16. November' stays a preposition
const half = (letter, name) => {
  const names = `(?:${letter}\\.? ?m\\.?|${either([name])})`;
  return new RegExp(`(?<![\\p{L}\\p{M}])${names} ?\\0|\\0 ?${names}(?![\\p{L}\\p{M}])`, 'u');
};

// what Intl says about how one locale writes a date
const written = new Map();
const writtenIn = (tag) => {
  const key = String(tag);
  if (!written.has(key)) {
    const lowered = (list) => list.map((name) => fold(name).toLocaleLowerCase(tag).replace(/\.$/, ''));
    const [english, own] = [names('en'), names(tag)];
    const [am, pm] = lowered(own.dayPeriods);
    written.set(key, {
      // '11月' and 'tháng 11' are numbers rather than names, and the longest name wins ('تشرين الثاني' over 'تشرين')
      months: [english, own].map((table) =>
        [table.MMMM, table.besideDay.MMMM, table.MMM, table.besideDay.MMM]
          .flatMap((list) => lowered(list).map((name, index) => ({ name, month: index + 1, whole: word([name]) })))
          .filter(({ name }) => !/\p{N}/u.test(name))
          .sort((first, second) => second.name.length - first.name.length)
      ),
      weekday: word(lowered([...own.dddd, ...own.ddd, ...english.dddd, ...english.ddd])),
      halves: [half('a', am), half('p', pm)],
      order: new Intl.DateTimeFormat(tag, { dateStyle: 'short' }).formatToParts(0)
        .map((part) => part.type).filter((type) => /year|month|day/.test(type)),
    });
  }
  return written.get(key);
};

// a month is written out ('marraskuuta', 'تشرين الثاني') or cut short ('sept', 'нояб'). English is checked first
// so 'Mar 17' is March even in Finnish, and a weekday that spells a month is set aside ('mar, 16 jun', 'Dydd Mawrth')
const monthIn = (text, { months, weekday }) => {
  const cuts = text.match(/[\p{L}\p{M}]{3,}/gu) ?? [];
  for (const dated of [text.replace(weekday, ''), text]) {
    for (const [index, table] of months.entries()) {
      const found = table.find(({ whole }) => whole.test(dated))
        ?? table.find(({ name }) => cuts.some((cut) => name.startsWith(cut)));
      if (found) {
        return { month: found.month, own: index > 0 };
      }
    }
  }
  return {};
};

// year, month, and day from a date written with a month name or in the locale's numeric order
const fieldsIn = (text, tag, dayFirst) => {
  const facts = writtenIn(tag);
  const numbers = text.match(/\d+/g) ?? [];
  const long = (number) => number.length > 2;
  const { month } = monthIn(text, facts);
  if (month) {
    return numbers.length < 3 && { year: numbers.find(long), month, day: numbers.find((number) => !long(number)) };
  }
  const order = long(numbers[0] ?? '')
    ? ['year', 'month', 'day']
    : dayFirst === undefined
    ? facts.order
    : dayFirst
    ? ['day', 'month', 'year']
    : ['month', 'day', 'year'];
  // two numbers are a year and month when one is long, and a month and day otherwise
  const missing = numbers.length > 2 ? '' : numbers.some(long) ? 'day' : 'year';
  return numbers.length > 1 && numbers.length < 4
    && Object.fromEntries(order.filter((part) => part !== missing).map((part, index) => [part, numbers[index]]));
};

// engines parse numeric '7/9/26' month-first, so put the fields in that order before Date.parse sees them
const numeric = /^(\d{1,2})[./-] ?(\d{1,2})[./-] ?(\d{1,4})\b\.?(.*)$/s;
const engineOrder = (text, tag, dayFirst) => {
  const parts = numeric.exec(text);
  const { year, month, day } = parts ? fieldsIn(parts.slice(1, 4).join(' '), tag, dayFirst) : {};
  return year?.length > 1 ? `${month}/${day}/${year}${parts[4]}` : text;
};

// match zone abbreviations ('EDT', 'UTC', 'GMT+2'), trailing Z, or offsets after spaces or clock times
// without matching two-digit years like '6-Sep-26'. Leading non-digits and parenthesized comments are
// captured and restored in one linear pass to avoid catastrophic backtracking on untrusted inputs
const zoneMarker =
  /(^\D+|\([^)]*\)?)|\b(?:GMT|UTC?|[ECMP][SD]T)\b(?:[+-]\d\d?(?::?\d\d)?)?|(?<![a-z])Z\b|(\s|:[\d.]+)[+-]\d\d?(?::?\d\d)?(?!\d)/gi;

// ES5 parses ISO date-only strings ('2026', '2026-09', '2026-09-06') at UTC midnight instead of local time
const dateOnly = /^[+-]?\d{4,6}(?:-\d{2}(?:-\d{2})?)?$/;

// Date.parse silently rolls nonexistent days like 'Feb 30' into March 1-3. Swap the overflow day
// (e.g. 30) to 28 and re-parse to check whether the month moves back (leaving 2-digit years like 'Mar 1, 29' intact)
const rolledForward = (text, read, wallClock) => {
  if (read.day > 3) {
    return false;
  }
  const writtenDay = read.day + read.subtract({ days: read.day }).day;
  const epoch = Date.parse(text.replace(new RegExp(`(?<![\\d:])${writtenDay}(?![\\d:])`), '28'));
  return !Number.isNaN(epoch) && wallClock(epoch).month !== read.month;
};

// Date.parse interprets zoned strings as instants and unzoned strings in the host timezone (UTC for date-only ISO).
// Stripping zoneMarker parses the written wall clock in the host timezone so local inputs don't shift when placed into a zone
const engineRead = (text) => {
  const unzoned = text.replace(zoneMarker, '$1$2');
  const [epoch, local] = [Date.parse(text), Date.parse(unzoned)];
  if (Number.isNaN(epoch) || Number.isNaN(local)) {
    return undefined;
  }
  const host = dateOnly.test(text) ? 'UTC' : Temporal.Now.timeZoneId();
  const wallClock = (milliseconds) => Temporal.Instant.fromEpochMilliseconds(milliseconds).toZonedDateTimeISO(host);
  const read = wallClock(local);
  if (rolledForward(unzoned, read, wallClock)) {
    return undefined;
  }
  return unzoned === text ? read.toPlainDateTime() : Temporal.Instant.fromEpochMilliseconds(epoch);
};

// a date in the locale's words or order beside an optional clock ('16 de noviembre de 2026 a las 18:30',
// '2026년 11월 16일 오후 2:30'), ignoring the words between them
const clock = /(\d{1,2})(?::| ?h ?)(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?/;
const localeRead = (text, tag, dayFirst, clockOnly) => {
  const lower = text.toLocaleLowerCase(tag).replace(/\([^)]*\)/g, ' ');
  const hands = clock.exec(lower);
  const dated = hands ? lower.replace(hands[0], '\0') : lower;
  const fields = fieldsIn(dated, tag, dayFirst);
  try {
    const day = clockOnly && hands && !/\d/.test(dated)
      ? Temporal.Now.plainDateISO()
      : fields && fields.year?.length > 2 && fields.day
      ? Temporal.PlainDate.from({ year: +fields.year, month: +fields.month, day: +fields.day }, { overflow: 'reject' })
      : undefined;
    if (!hands) {
      return day?.toPlainDateTime();
    }
    const [, hour, minute, second = '00', fraction = '0'] = hands;
    const afternoon = writtenIn(tag).halves.findIndex((name) => name.test(dated));
    // '2:30' beside 'pm', '오후', or 'م' is 14:30, and an hour past 12 beside one does not exist
    const hours = afternoon < 0 ? hour : hour > 0 && hour < 13 ? (hour % 12) + 12 * afternoon : 24;
    return day?.toPlainDateTime(`${String(hours).padStart(2, '0')}:${minute}:${second}.${fraction}`);
  }
  catch {
    return undefined;
  }
};

// an abbreviation written after the clock means what it means as the zone argument ('14:30 CST', '14:30:00 UTC 2026',
// '14:30 мск'), unless an offset sits beside it ('14:30:00 +0800 CST'). Latin letters count only in capitals, so
// 'at', 'Uhr', and 'wake' stay words
const zoneWord =
  /(\d:\d{2}(?::\d{2}(?:\.\d+)?)?(?: ?[AaPp]\.?[Mm]\.?)?(?: [+-]\d{2}:?\d{2})?) (?![AP]M\b)(\p{Lu}{2}|(?:(?![a-z])[\p{L}\p{M}]){3,5})(?![\p{L}\p{M}+]|-\d)/u;

export const looseZoned = (input, { zone, dayFirst, locale } = {}, clockOnly) => {
  const tag = pickLocale(locale);
  const order = readsDayFirst(dayFirst);
  let text = fold(input.trim());
  let named;
  let unknown;
  const zoned = zoneWord.exec(text);
  if (zoned) {
    try {
      named = zoneId(zoned[2], tag);
      text = text.replace(zoned[0], zoned[1]);
    }
    catch {
      // capitals nobody can place ('14:30 XYZ') may be a zone, so only Date.parse gets to read them
      unknown = zoned[2] === zoned[2].toUpperCase();
    }
  }
  const read = (monthIn(text.toLocaleLowerCase(tag), writtenIn(tag)).own
    ? undefined
    : engineRead(engineOrder(text, tag, order))) ?? (unknown ? undefined : localeRead(text, tag, order, clockOnly));
  const target = zoneId(zone, tag);
  return read instanceof Temporal.Instant
    ? read.toZonedDateTimeISO(target)
    : read && (named ? read.toZonedDateTime(named).withTimeZone(target) : read.toZonedDateTime(target));
};

// month and day or year and month for the partial nouns, where Date.parse would add a year or day of its own
export const looseParts = (input, { dayFirst, locale } = {}) => {
  const tag = pickLocale(locale);
  return fieldsIn(fold(input).toLocaleLowerCase(tag), tag, dayFirst) || undefined;
};

setLooseExtension(looseZoned, looseParts);
