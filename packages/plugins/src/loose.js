import { setLooseExtension } from 'native-dates/helpers/errors';
import { names } from 'native-dates/helpers/tokens';
import { isInstant, pad } from 'native-dates/helpers/units';
import { cached, each } from 'native-dates/helpers/utils';
import {
  checkedDisambiguation,
  dayFirst as readsDayFirst,
  locale as pickLocale,
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
  /[^\x20-\x7e]/.test(text)
    ? text.normalize('NFKC').replace(/[\u200e\u200f\u061c]/g, '').replace(/(?![0-9])\p{Nd}/gu, digitValue)
    : text;

// lowercase words between single spaces, so ' mar ' is found in ' mar 17 ' and not in ' martes '
const wordsOf = (text, locale) => ` ${(text.toLocaleLowerCase(locale).match(/[\p{L}\p{M}]+/gu) ?? []).join(' ')} `;

// every spelling Intl has for the twelve months, longest first so 'تشرين الثاني' is found before 'تشرين'
const monthsFrom = (table, locale, written = []) =>
  [table.MMMM, table.besideDay.MMMM, table.MMM, table.besideDay.MMM, ...written]
    .flatMap((list) => list.map((name, index) => ({ name, month: index + 1 })))
    // '11月' and 'tháng 11' are numbers rather than names
    .filter(({ name }) => /\p{L}/u.test(name) && !/\p{N}/u.test(name))
    .map(({ name, month }) => ({ name: wordsOf(name, locale), month }))
    // the tables and a full date mostly spell a month the same way
    .filter(({ name, month }, index, months) =>
      index === months.findIndex((other) => other.name === name && other.month === month)
    )
    .sort((first, second) => second.name.length - first.name.length);

const localeData = cached((locale) => {
  const [english, localized] = [names('en'), names(locale)];
  const formatOf = (options) => new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory', timeZone: 'UTC' });
  const partsOf = (options) => formatOf(options).formatToParts(0);
  // months as a full date writes them, with the letters a locale joins on ('בנובמבר', 'azaroaren', 'ژوئیهٔ')
  const written = ['long', 'medium'].map((dateStyle) => {
    const format = formatOf({ dateStyle });
    return localized.MMMM.map((_, index) => {
      const parts = format.formatToParts(Date.UTC(2024, index, 15));
      const at = parts.findIndex((part) => part.type === 'month');
      const [before, after] = [parts[at - 1]?.value ?? '', parts[at + 1]?.value ?? ''];
      return before.match(/[\p{L}\p{M}]*$/u)[0] + parts[at].value + after.match(/^[\p{L}\p{M}]*/u)[0];
    });
  });
  // every day-period word printed across a day with the hours it covers: on the locale's own clock, on a
  // 12-hour clock, and as its words for a part of the day ('오후', '凌晨', 'in the evening')
  const periods = [];
  const twelveHour = { hour: 'numeric', minute: '2-digit', hour12: true };
  each([{ timeStyle: 'short' }, twelveHour, { ...twelveHour, dayPeriod: 'short' }], (options) => {
    const format = formatOf(options);
    for (let hour = 0; hour < 24; hour++) {
      // half past, since the stroke of noon and of midnight can carry a word of their own
      const word = format.formatToParts(hour * 36e5 + 18e5).find((part) => part.type === 'dayPeriod');
      const name = word && wordsOf(normalize(word.value), locale);
      const period = periods.find((known) => known.name === name);
      if (period) {
        period.hours.push(hour);
      }
      else if (name) {
        periods.push({ name, hours: [hour], isPart: !!options.dayPeriod });
      }
    }
  });
  // the literals a locale writes around its clock: Finnish joins hours and minutes with a dot ('14.30'), and
  // Welsh puts 'am' (at) between a date and its clock
  const clock = partsOf({ dateStyle: 'long', timeStyle: 'short' });
  const hourAt = clock.findIndex((part) => part.type === 'hour');
  return {
    englishMonths: monthsFrom(english, locale),
    localizedMonths: monthsFrom(localized, locale, written),
    weekdays: [...localized.dddd, ...localized.ddd, ...english.dddd, ...english.ddd].map((name) =>
      wordsOf(name, locale)
    ),
    periods: periods.sort((first, second) => second.name.length - first.name.length),
    hasDottedClock: clock[hourAt + 1].value === '.',
    connector: wordsOf(clock.findLast((part, at) => at < hourAt && part.type !== 'dayPeriod')?.value ?? '', locale),
    order: partsOf({ dateStyle: 'short' })
      .map((part) => part.type)
      .filter((type) => type === 'year' || type === 'month' || type === 'day'),
    monthDayOrder: partsOf({ month: 'short', day: 'numeric' })
      .map((part) => part.type)
      .filter((type) => type === 'month' || type === 'day'),
  };
});

const exactMonth = (words, months) => months.find(({ name }) => words.includes(name));
// or a month name cut short ('sept', 'нояб', 'marr'), unless it opens more than one month ('jui', 'арван')
const prefixMonth = (words, months) => {
  const cut = [...new Set(words.split(' '))].filter((word) => word.length > 2);
  const found = months.filter(({ name }) => cut.some((word) => name.startsWith(` ${word}`)));
  return found.every(({ month }) => month === found[0].month) ? found[0] : undefined;
};

const findMonth = (text, locale) => {
  if (!/\p{L}/u.test(text)) {
    return {};
  }
  const { englishMonths, localizedMonths, weekdays } = localeData(locale);
  const words = wordsOf(text, locale);
  // look past a weekday that opens the text, since it can spell a month ('mar, 16 jun', 'Dydd Mawrth')
  const weekday = weekdays.find((name) => words.startsWith(name));
  const afterWeekday = weekday ? words.slice(weekday.length - 1) : words;
  for (const candidate of new Set([afterWeekday, words])) {
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
const dateParts = (text, { locale, dayFirst, month = findMonth(text, locale).month }) => {
  const numbers = text.match(/\d+/g) ?? [];
  const isYear = (number) => number?.length > 3;
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
// expand hour-only 12-hour clocks ('3pm', '3 p.m.') so Date.parse and zone matching read them
const hourMeridiem = /(?<![\d:./\p{Script=Latin}-])(\d{1,2}) ?([ap])(?:\. ?)?m\.?(?!\p{Script=Latin})/iu;
// Telugu joins a word onto it ('2:30 PMకి'), so only a Latin letter after it makes it part of another word
const meridiem = /^ ?([ap])\.? ?m\.?(?!\p{Script=Latin})/u;

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
  const written = parseUtcWall(withoutComments);
  const epoch = unzoned === text ? written : Date.parse(text);
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
    const parts = dateParts(withoutClock, { ...settings, month: 0 });
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

const morning = Array.from({ length: 12 }, (_, hour) => hour);
const afternoon = morning.map((hour) => hour + 12);

// the hours a day-period word beside the clock covers. Only a whole word next to the clock counts, with no number
// between them: German 'am 16.11.2026 14:30' keeps its preposition, and Arabic 'اليوم' (today) is not read as its
// last letter 'م' (PM). The word a locale writes between a date and its clock is not a period (Welsh 'am 14:30'),
// and a part of the day only sets a 12-hour clock ('14:30 nachmittags' stays 14:30)
const periodHours = (before, after, locale, hour) => {
  const english = meridiem.exec(after)?.[1];
  if (english) {
    return english === 'p' ? afternoon : morning;
  }
  const { periods, connector } = localeData(locale);
  const wordsBefore = wordsOf(before.split(/\d/).pop(), locale);
  const wordsAfter = wordsOf(after.split(/\d/)[0], locale);
  const known = periods.filter(({ isPart }) => !isPart || (hour > 0 && hour < 13));
  const period = known.find(({ name }) => wordsAfter.startsWith(name))
    ?? known.find(({ name }) => wordsBefore.endsWith(name) && !connector.endsWith(name));
  return period?.hours;
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
    const hours = periodHours(before, after, locale, hour);
    if (hours) {
      if (hour < 1 || hour > 12) {
        return undefined;
      }
      // pick the AM or PM reading nearer the hours the word covers without crossing noon: Korean '밤' spans
      // midnight, '2:30 at night' is 02:30, and Spanish '2:30 de la mañana' stays 02:30 rather than 14:30
      const gap = (reading) =>
        Math.min(...hours.map((covered) => Math.abs(reading - (covered < 12 ? covered : covered - 24))));
      hour %= 12;
      hour += gap(hour) > gap(hour - 12) ? 12 : 0;
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

export const looseZoned = (input, { zone, dayFirst, locale, timeOnly, disambiguation } = {}) => {
  const settings = { locale: pickLocale(locale), dayFirst: readsDayFirst(dayFirst, locale), timeOnly };
  const mode = checkedDisambiguation(disambiguation);
  let text = normalize(input.trim());
  const { periods, hasDottedClock } = localeData(settings.locale);
  // Finnish and Danish write the clock with a dot ('klo 14.30'). A number never follows it, which a date's own
  // dots do ('16.11.2026', '16.11. 2026'), and its seconds count only after a date ('16.11.2026 klo 14.30.15')
  if (hasDottedClock) {
    text = text.replace(
      /(?<![\d.])\d{1,2}\.\d{2}(?:(?<=\d\D+\d{1,2}\.\d{2})\.\d{2})?(?!\.?\s*\d)/g,
      (clock) => clock.replaceAll('.', ':'),
    );
  }
  // strip zone offsets before checking for a clock so colon offsets ('+02:00') do not mask hour-only meridiems
  if (!clockTime.test(text.replace(zoneMarker, '$1$2'))) {
    const hourOnly = hourMeridiem.exec(text);
    if (hourOnly) {
      const [matched, hour, half] = hourOnly;
      if (+hour < 1 || +hour > 12) {
        return undefined;
      }
      text = `${text.slice(0, hourOnly.index)}${hour}:00 ${half.toLowerCase()}m${
        text.slice(hourOnly.index + matched.length)
      }`;
    }
  }

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
      // only a cased script has capitals, so Hindi 'बजे' or Japanese '会議室' after the clock is a word,
      // and so is a day period written in capitals (Malay '2:30 PTG')
      const word = wordsOf(name, settings.locale);
      hasUnknownZone = name === name.toUpperCase() && name !== name.toLowerCase()
        && !periods.some((period) => period.name === word);
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
