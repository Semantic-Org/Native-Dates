import { cached, plainDateTimeFormat } from 'native-dates/helpers/intl';
import { locale as pickLocale } from 'native-dates/helpers/zones';

// the calendars that keep the Gregorian months and days, and count only the year their own way
const gregorianMonths = ['gregory', 'buddhist', 'japanese', 'roc'];

// the formatter for a part of a date, a month and a day or a year and a month. in a calendar with
// other months the part falls on different days each year, so a locale that keeps one prints the
// Gregorian months instead, and such a calendar asked for by name has no formatter. the ISO
// calendar's months are the Gregorian ones, but Intl has no names for them, so it prints as Gregorian
const partFormatters = cached((locale, options) => {
  const format = plainDateTimeFormat(locale, options);
  const calendar = format.resolvedOptions().calendar;
  if (gregorianMonths.includes(calendar)) {
    return format;
  }
  return options.calendar === undefined || calendar === 'iso8601'
    ? plainDateTimeFormat(locale, { ...options, calendar: 'gregory' })
    : undefined;
});

export const partFormatter = (options, locale) => partFormatters(pickLocale(locale), options);
