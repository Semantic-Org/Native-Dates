import { setLooseExtension } from 'native-dates/helpers/errors';
import { names } from 'native-dates/helpers/tokens';
import { isInstant, pad } from 'native-dates/helpers/units';
import { cached, each } from 'native-dates/helpers/utils';
import {
  checkedDisambiguation,
  dayFirst as readsDayFirst,
  locale as pickLocale,
  settings as activeSettings,
  zoneId,
} from 'native-dates/helpers/zones';

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
  const partsOf = (options) => new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory' }).formatToParts(0);
  return {
    englishMonths: monthsFrom(english, locale),
    localizedMonths: monthsFrom(localized, locale),
    weekdays: [...localized.dddd, ...localized.ddd, ...english.dddd, ...english.ddd].map((name) =>
      wordsOf(name, locale)
    ),
    dayPeriods: localized.dayPeriods.map((name) => wordsOf(name, locale)),
    order: partsOf({ dateStyle: 'short' })
      .map((part) => part.type)
      .filter((type) => type === 'year' || type === 'month' || type === 'day'),
    monthDayOrder: partsOf({ month: 'short', day: 'numeric' })
      .map((part) => part.type)
      .filter((type) => type === 'month' || type === 'day'),
  };
});

const exactMonth = (words, months) => months.find(({ name }) => words.includes(name));
// or a month name cut short ('sept', 'нояб', 'marr')
const prefixMonth = (words, months) =>
  months.find(({ name }) => words.split(' ').some((word) => word.length > 2 && name.startsWith(` ${word}`)));

const findMonth = (text, locale) => {
  const { englishMonths, localizedMonths, weekdays } = localeData(locale);
  const words = wordsOf(text, locale);
  // look past a weekday that opens the text, since it can spell a month ('mar, 16 jun', 'Dydd Mawrth')
  const weekday = weekdays.find((name) => words.startsWith(name));
  const afterWeekday = weekday ? words.slice(weekday.length - 1) : words;
  for (const candidate of [afterWeekday, words]) {
    // check exact localized names before English so official locale spellings win while 'Mar 17' stays March in Finnish
    const exactLocal = exactMonth(candidate, localizedMonths);
    const exactEng = exactMonth(candidate, englishMonths);
    if (exactLocal) {
      return { month: exactLocal.month, isEnglish: exactEng?.month === exactLocal.month };
    }
    if (exactEng) {
      return { month: exactEng.month, isEnglish: true };
    }
    const prefixLocal = prefixMonth(candidate, localizedMonths);
    if (prefixLocal) {
      return { month: prefixLocal.month, isEnglish: false };
    }
    const prefixEng = prefixMonth(candidate, englishMonths);
    if (prefixEng) {
      return { month: prefixEng.month, isEnglish: true };
    }
  }
  return {};
};

// a number of four or more digits is a year, so 3-digit room or status numbers never masquerade as years
const dateParts = (text, { locale, dayFirst }) => {
  const numbers = text.match(/\d+/g) ?? [];
  const isYear = (number) => number?.length > 3;
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
  // locales whose short format is YYYY-MM-DD (en-CA, fa-IR, sv-SE) still have a month-day preference when the year comes last
  else if (isYear(numbers[2]) && order[0] === 'year') {
    order = [...localeData(locale).monthDayOrder, 'year'];
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
// (e.g. 30) to 28 and re-parse in UTC to check whether the month moves back (leaving 2-digit years like 'Mar 1, 29' intact)
const parseUtcWall = (text) => Date.parse(dateOnly.test(text.trim()) ? text : `${text} UTC`);

const rolledForward = (text, read, wallClock) => {
  if (read.day > 3) {
    return false;
  }
  const writtenDay = read.day + read.subtract({ days: read.day }).day;
  const epoch = parseUtcWall(text.replace(new RegExp(`(?<![\\d:])${writtenDay}(?![\\d:])`), '28'));
  return !Number.isNaN(epoch) && wallClock(epoch).month !== read.month;
};

const clockTime = /(\d{1,2})(?::| ?h ?)(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?/;
const meridiem = /^ ?([ap])\.? ?m\.?(?![\p{L}\p{M}])/u;

const validYearToken = (token, resolvedYear) =>
  token !== undefined
  && (token.length === 2
    ? resolvedYear % 100 === +token
    : token.length >= 4 && +token >= 100 && resolvedYear === +token);

// Date.parse invents missing years (2001), days (01), and months from stray words ('junk' -> June), and uses the host OS
// timezone on unzoned strings. Parse unzoned text in UTC and verify the written year, month, and day all match
const parseWithEngine = (text, settings) => {
  const unzoned = text.replace(zoneMarker, '$1$2');
  const withoutComments = unzoned.replace(/\([^)]*\)?/g, ' ').trim();
  const clock = clockTime.exec(withoutComments);
  const withoutClock = clock
    ? `${withoutComments.slice(0, clock.index)} ${withoutComments.slice(clock.index + clock[0].length)}`
    : withoutComments;
  const nums = withoutClock.match(/\d+/g) ?? [];
  const { month } = findMonth(withoutClock, settings.locale);
  if (month ? nums.length !== 2 : nums.length !== 3) {
    return undefined;
  }
  const [epoch, written] = [Date.parse(text), parseUtcWall(withoutComments)];
  if (Number.isNaN(epoch) || Number.isNaN(written)) {
    return undefined;
  }
  const wallClock = (milliseconds) => Temporal.Instant.fromEpochMilliseconds(milliseconds).toZonedDateTimeISO('UTC');
  const read = wallClock(written);
  if (month) {
    const matches = read.month === month && (
      (+nums[0] === read.day && validYearToken(nums[1], read.year))
      || (+nums[1] === read.day && validYearToken(nums[0], read.year))
    );
    if (!matches) {
      return undefined;
    }
  }
  else {
    const parts = dateParts(withoutClock, settings);
    if (
      !parts || +parts.month !== read.month || +parts.day !== read.day || !validYearToken(parts.year, read.year)
    ) {
      return undefined;
    }
  }
  if (rolledForward(withoutComments, read, wallClock)) {
    return undefined;
  }
  return unzoned === text ? read.toPlainDateTime() : Temporal.Instant.fromEpochMilliseconds(epoch);
};

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
  const dateText = `${before} ${after}`;
  const parts = dateParts(dateText, settings);
  try {
    let date;
    if (parts?.year?.length > 3 && +parts.year >= 100 && parts.day) {
      date = Temporal.PlainDate.from({ year: +parts.year, month: +parts.month, day: +parts.day }, {
        overflow: 'reject',
      });
    }
    // 2000-01-01 has no DST transitions in any IANA zone, so dateless clock times never shift on spring-forward days
    else if (timeOnly && clock && !/\d/.test(before + after)) {
      date = new Temporal.PlainDate(2000, 1, 1);
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

// explicit standard and daylight abbreviations inside timestamp strings keep their fixed UTC offsets rather than
// shifting across DST when @native-dates/plugins/zones maps bare 'EST', 'CET', or 'AEST' to regional IANA zones
const fixedOffsets = {
  EST: '-05:00',
  EDT: '-04:00',
  CDT: '-05:00',
  MST: '-07:00',
  MDT: '-06:00',
  PDT: '-07:00',
  AKST: '-09:00',
  AKDT: '-08:00',
  HST: '-10:00',
  WET: '+00:00',
  WEST: '+01:00',
  CET: '+01:00',
  CEST: '+02:00',
  EET: '+02:00',
  EEST: '+03:00',
  AWST: '+08:00',
  ACST: '+09:30',
  ACDT: '+10:30',
  AEST: '+10:00',
  AEDT: '+11:00',
  NZST: '+12:00',
  NZDT: '+13:00',
};

const zoneNamed = (name, locale) => {
  const upper = name.toUpperCase();
  const hasCustomAlias = Object.keys(activeSettings.zoneAliases).some((key) => key.toUpperCase() === upper);
  if (!hasCustomAlias && fixedOffsets[upper]) {
    return fixedOffsets[upper];
  }
  try {
    const resolved = zoneId(name, locale);
    if (!hasCustomAlias) {
      if (upper === 'CST' && resolved === 'America/Chicago') {
        return '-06:00';
      }
      if (upper === 'PST' && resolved === 'America/Los_Angeles') {
        return '-08:00';
      }
      if (upper === 'BST' && resolved === 'Europe/London') {
        return '+01:00';
      }
    }
    return resolved;
  }
  catch {
    return undefined;
  }
};

export const looseZoned = (input, { zone, dayFirst, locale, timeOnly, disambiguation } = {}) => {
  const settings = { locale: pickLocale(locale), dayFirst: readsDayFirst(dayFirst, locale), timeOnly };
  const mode = checkedDisambiguation(disambiguation);
  let text = normalize(input.trim());

  // resolve the abbreviation after the clock while keeping explicit standard/daylight codes at their fixed offsets
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
  const reordered = engineOrder(text, settings);
  let read = month && !isEnglish ? undefined : parseWithEngine(reordered, {
    ...settings,
    ...(reordered !== text && { dayFirst: false }),
  });
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
  try {
    return writtenZone
      ? read.toZonedDateTime(writtenZone, { disambiguation: mode }).withTimeZone(timeZone)
      : read.toZonedDateTime(timeZone, { disambiguation: mode });
  }
  catch {
    return undefined;
  }
};

// monthDay() and dayMonth() carry the numeric order in their names, so the locale's order is not used here
export const looseParts = (input, { dayFirst, locale } = {}) =>
  dateParts(normalize(input), { locale: pickLocale(locale), dayFirst: !!dayFirst });

setLooseExtension(looseZoned, looseParts);
