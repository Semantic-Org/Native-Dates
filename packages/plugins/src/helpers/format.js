import { intlOptions, unknownFormat } from 'native-dates/helpers/format';
import { cached, plainDateTimeFormat } from 'native-dates/helpers/intl';
import { isPlainObject } from 'native-dates/helpers/types';
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

// a part of a date prints only the parts it has, so the presets and the options bag that format a
// datetime format it too. a format that names none of its parts prints its medium form
export const partOptions = (spec, names, presets) => {
  if (Object.hasOwn(presets, spec)) {
    return presets[spec];
  }
  const bag = isPlainObject(spec) ? spec : intlOptions('datetime', spec) ?? unknownFormat(spec);
  if (bag.dateStyle) {
    return presets[bag.dateStyle];
  }
  const own = {};
  for (const name of names) {
    if (bag[name] !== undefined) {
      own[name] = bag[name];
    }
  }
  return Object.keys(own).length ? own : presets.medium;
};
