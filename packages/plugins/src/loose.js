import { setLooseExtension } from 'native-dates/helpers/errors';
import { cached } from 'native-dates/helpers/intl';
import { names } from 'native-dates/helpers/tokens';
import { isInstant, pad } from 'native-dates/helpers/units';
import { each } from 'native-dates/helpers/utils';
import { dayFirst as readsDayFirst, locale as pickLocale, zoneId } from 'native-dates/helpers/zones';

/*
  parses informal dates and times. Text in the active locale's own words is read with the month names,
  AM/PM words, and day-month order that Intl has for it, and everything else goes to Date.parse
*/

// Unicode lists each script's digits in order from zero, so a digit's value is its distance from that zero
const digitValue = (digit) => {
  let value = 0;
  while (/\p{Nd}/u.test(String.fromCodePoint(digit.codePointAt(0) - value - 1))) {
    value++;
  }
  return value;
};

// NFKC narrows fullwidth forms, and Arabic dates carry direction marks between their parts
const normalize = (text) =>
  text.normalize('NFKC').replace(/[\u200e\u200f\u061c]/g, '').replace(/(?![0-9])\p{Nd}/gu, digitValue);

// lowercase words between single spaces, so ' mar ' is found in ' mar 17 ' and not in ' martes '
const wordsOf = (text, locale) => ` ${(text.toLocaleLowerCase(locale).match(/[\p{L}\p{M}]+/gu) ?? []).join(' ')} `;

// every spelling Intl has for the twelve months, longest first so 'تشرين الثاني' is found before 'تشرين'
const monthsFrom = (table, locale) =>
  [table.MMMM, table.besideDay.MMMM, table.MMM, table.besideDay.MMM]
    .flatMap((list) => list.map((name, index) => ({ name, month: index + 1 })))
    // '11月' and 'tháng 11' are numbers rather than names
    .filter(({ name }) => /\p{L}/u.test(name) && !/\p{N}/u.test(name))
    .map(({ name, month }) => ({ name: wordsOf(name, locale), month }))
    .sort((first, second) => second.name.length - first.name.length);

const localeData = cached((locale) => {
  const [english, localized] = [names('en'), names(locale)];
  return {
    englishMonths: monthsFrom(english, locale),
    localizedMonths: monthsFrom(localized, locale),
    weekdays: [...localized.dddd, ...localized.ddd, ...english.dddd, ...english.ddd].map((name) =>
      wordsOf(name, locale)
    ),
    dayPeriods: localized.dayPeriods.map((name) => wordsOf(name, locale)),
    order: new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).formatToParts(0)
      .map((part) => part.type)
      .filter((type) => type === 'year' || type === 'month' || type === 'day'),
  };
});

const monthAmong = (words, months) =>
  months.find(({ name }) => words.includes(name))
    // or a name cut short ('sept', 'нояб')
    ?? months.find(({ name }) => words.split(' ').some((word) => word.length > 2 && name.startsWith(` ${word}`)));

const findMonth = (text, locale) => {
  const { englishMonths, localizedMonths, weekdays } = localeData(locale);
  const words = wordsOf(text, locale);
  // look past a weekday that opens the text, since it can spell a month ('mar, 16 jun', 'Dydd Mawrth')
  const weekday = weekdays.find((name) => words.startsWith(name));
  const afterWeekday = weekday ? words.slice(weekday.length - 1) : words;
  for (const candidate of [afterWeekday, words]) {
    // English is checked first so 'Mar 17' is March even in Finnish, where 'marraskuu' is November
    const english = monthAmong(candidate, englishMonths);
    const localized = english ?? monthAmong(candidate, localizedMonths);
    if (localized) {
      return { month: localized.month, isEnglish: !!english };
    }
  }
  return {};
};

// a number of three or more digits is a year, so only an all-numeric date depends on day-month order
const dateParts = (text, { locale, dayFirst }) => {
  const numbers = text.match(/\d+/g) ?? [];
  const isYear = (number) => number.length > 2;
  const { month } = findMonth(text, locale);
  if (month) {
    return numbers.length < 3
      ? { year: numbers.find(isYear), month, day: numbers.find((number) => !isYear(number)) }
      : undefined;
  }
  if (numbers.length < 2 || numbers.length > 3) {
    return undefined;
  }
  let order = localeData(locale).order;
  if (isYear(numbers[0])) {
    order = ['year', 'month', 'day'];
  }
  else if (dayFirst !== undefined) {
    order = dayFirst ? ['day', 'month', 'year'] : ['month', 'day', 'year'];
  }
  // two numbers are a year and month when one is a year, and a month and day otherwise
  const absent = numbers.length === 3 ? undefined : numbers.some(isYear) ? 'day' : 'year';
  const parts = {};
  each(order.filter((part) => part !== absent), (part, index) => {
    parts[part] = numbers[index];
  });
  return parts;
};

// engines parse numeric '7/9/26' month-first, so write the parts in that order before Date.parse sees them
const numeric = /^(\d{1,2})[./-] ?(\d{1,2})[./-] ?(\d{1,4})\b\.?(.*)$/s;
const engineOrder = (text, settings) => {
  const match = numeric.exec(text);
  if (!match) {
    return text;
  }
  const [, first, second, third, rest] = match;
  const { year, month, day } = dateParts(`${first} ${second} ${third}`, settings);
  // a one-digit year like '9/6/5' is left for the engine to judge
  return year.length > 1 ? `${month}/${day}/${year}${rest}` : text;
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
// Stripping zoneMarker parses the written wall clock in the host timezone so local inputs don't shift when placed into `zone`
const parseWithEngine = (text) => {
  const unzoned = text.replace(zoneMarker, '$1$2');
  const [epoch, written] = [Date.parse(text), Date.parse(unzoned)];
  if (Number.isNaN(epoch) || Number.isNaN(written)) {
    return undefined;
  }
  const host = dateOnly.test(text) ? 'UTC' : Temporal.Now.timeZoneId();
  const wallClock = (milliseconds) => Temporal.Instant.fromEpochMilliseconds(milliseconds).toZonedDateTimeISO(host);
  const read = wallClock(written);
  if (rolledForward(unzoned, read, wallClock)) {
    return undefined;
  }
  return unzoned === text ? read.toPlainDateTime() : Temporal.Instant.fromEpochMilliseconds(epoch);
};

const clockTime = /(\d{1,2})(?::| ?h ?)(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?/;
const meridiem = /^ ?([ap])\.? ?m\.?(?![\p{L}\p{M}])/u;

// only a whole word next to the clock counts, with no number between them. German 'am 16.11.2026 14:30' keeps
// its preposition, and Arabic 'اليوم' (today) is not read as its last letter 'م' (PM)
const isAfternoon = (before, after, locale) => {
  const english = meridiem.exec(after)?.[1];
  if (english) {
    return english === 'p';
  }
  const [am, pm] = localeData(locale).dayPeriods;
  const wordsBefore = wordsOf(before.split(/\d/).pop(), locale);
  const wordsAfter = wordsOf(after.split(/\d/)[0], locale);
  const beside = (period) => wordsAfter.startsWith(period) || wordsBefore.endsWith(period);
  return beside(pm) ? true : beside(am) ? false : undefined;
};

const parseWithLocale = (text, settings) => {
  const { locale, timeOnly } = settings;
  const lower = text.toLocaleLowerCase(locale);
  const clock = clockTime.exec(lower);
  const before = clock ? lower.slice(0, clock.index) : lower;
  const after = clock ? lower.slice(clock.index + clock[0].length) : '';
  const parts = dateParts(`${before} ${after}`, settings);
  try {
    let date;
    if (parts?.year?.length > 2 && parts.day) {
      date = Temporal.PlainDate.from({ year: +parts.year, month: +parts.month, day: +parts.day }, {
        overflow: 'reject',
      });
    }
    else if (timeOnly && clock && !/\d/.test(before + after)) {
      date = Temporal.Now.plainDateISO();
    }
    if (!date || !clock) {
      return date?.toPlainDateTime();
    }
    const [, hourText, minute, second = '00', fraction = '0'] = clock;
    let hour = +hourText;
    const afternoon = isAfternoon(before, after, locale);
    if (afternoon !== undefined) {
      if (hour < 1 || hour > 12) {
        return undefined;
      }
      hour = (hour % 12) + (afternoon ? 12 : 0);
    }
    return date.toPlainDateTime(`${pad(hour)}:${minute}:${second}.${fraction}`);
  }
  catch {
    return undefined;
  }
};

// Latin letters count only in capitals so 'at', 'Uhr', and 'wake' stay words ('14:30 CST', '14:30 мск'), and an
// offset before the abbreviation is captured with the clock so the offset decides ('14:30:00 +0800 CST')
const zoneAbbreviation =
  /(\d:\d{2}(?::\d{2}(?:\.\d+)?)?(?: ?[AaPp]\.?[Mm]\.?)?(?: [+-]\d{2}:?\d{2})?) (?![AP]M\b)(\p{Lu}{2}|(?:(?![a-z])[\p{L}\p{M}]){3,5})(?![\p{L}\p{M}+]|-\d)/u;

const zoneNamed = (name, locale) => {
  try {
    return zoneId(name, locale);
  }
  catch {
    return undefined;
  }
};

export const looseZoned = (input, { zone, dayFirst, locale, timeOnly } = {}) => {
  const settings = { locale: pickLocale(locale), dayFirst: readsDayFirst(dayFirst), timeOnly };
  let text = normalize(input.trim());

  // resolve the abbreviation as the zone argument would, since Date.parse reads 'CST' as -06:00 everywhere
  let writtenZone;
  let hasUnknownZone = false;
  const abbreviation = zoneAbbreviation.exec(text);
  if (abbreviation) {
    const [matched, clock, name] = abbreviation;
    writtenZone = zoneNamed(name, settings.locale);
    if (writtenZone) {
      text = text.replace(matched, clock);
    }
    else {
      // only a cased script has capitals, so Hindi 'बजे' or Japanese '会議室' after the clock is a word
      hasUnknownZone = name === name.toUpperCase() && name !== name.toLowerCase();
    }
  }

  // skip Date.parse on non-English month names because V8 misreads prefixes like Finnish 'marraskuuta' as March
  const { month, isEnglish } = findMonth(text, settings.locale);
  let read = month && !isEnglish ? undefined : parseWithEngine(engineOrder(text, settings));
  // reject unknown uppercase zone tokens like '14:30 XYZ' instead of ignoring them
  if (!read && !hasUnknownZone) {
    read = parseWithLocale(text, settings);
  }
  if (!read) {
    return undefined;
  }
  const timeZone = zoneId(zone, settings.locale);
  if (isInstant(read)) {
    return read.toZonedDateTimeISO(timeZone);
  }
  return writtenZone ? read.toZonedDateTime(writtenZone).withTimeZone(timeZone) : read.toZonedDateTime(timeZone);
};

// monthDay() and dayMonth() carry the numeric order in their names, so the locale's order is not used here
export const looseParts = (input, { dayFirst, locale } = {}) =>
  dateParts(normalize(input), { locale: pickLocale(locale), dayFirst: !!dayFirst });

setLooseExtension(looseZoned, looseParts);
