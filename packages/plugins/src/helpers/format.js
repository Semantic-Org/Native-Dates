import { intlOptions } from 'native-dates/helpers/format';
import { cached, plainDateTimeFormat } from 'native-dates/helpers/intl';
import { isPlainObject, isString } from 'native-dates/helpers/types';
import { locale as pickLocale } from 'native-dates/helpers/zones';

// the calendars that keep the Gregorian months and days, and count only the year their own way
const gregorianMonths = ['gregory', 'buddhist', 'japanese', 'roc'];

// the formatter for a part of a date, a month and a day or a year and a month. in a calendar with
// other months the part falls on different days each year, so it prints the Gregorian months
// whatever the locale's own calendar. the ISO calendar's months are the Gregorian ones too, but Intl
// has no names for them
const partFormatters = cached((locale, options) => {
  const format = plainDateTimeFormat(locale, options);
  return gregorianMonths.includes(format.resolvedOptions().calendar)
    ? format
    : plainDateTimeFormat(locale, { ...options, calendar: 'gregory' });
});

export const partFormatter = (options, locale) => partFormatters(pickLocale(locale), options);

// every part a format can name. a part of a date drops the ones it lacks
const parts = [
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'timeStyle',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'dayPeriod',
  'timeZone',
  'timeZoneName',
];

// a part of a date prints only the parts it has, so the presets and the options bag that format a
// datetime format it too. a format that names none of its parts prints its medium form. what is no
// part, a calendar or a numbering system, goes to Intl as written
export const partOptions = (spec, names, presets) => {
  if (isString(spec) && Object.hasOwn(presets, spec)) {
    return presets[spec];
  }
  const bag = isPlainObject(spec) ? spec : intlOptions('datetime', spec);
  // a string that is no preset is left for the caller to put to formatPattern
  if (!bag) {
    return undefined;
  }
  if (bag.dateStyle) {
    return presets[bag.dateStyle];
  }
  const options = { ...bag };
  for (const part of parts) {
    if (!names.includes(part)) {
      delete options[part];
    }
  }
  // the first two names are the parts it always has, and an era prints only beside them
  return names.slice(0, 2).some((name) => options[name] !== undefined) ? options : { ...presets.medium, ...options };
};
