import { each, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { fail } from './errors.js';
import { names } from './tokens.js';
import { isCount, pad } from './units.js';
import { locale as pickLocale } from './zones.js';

// reading for the nouns that are part of a date: a month and a day, a year and a month

// Temporal would truncate 11.7, read true as 1 and drop a part it has no use for, so each is refused first
export const wholeParts = (fields, names) => {
  const parts = {};
  each(fields, (value, name) => {
    if (!names.includes(name)) {
      fail(isDevelopment ? `\`${name}\` is not accepted here. Expected only [${names.join(', ')}]` : '');
    }
    if (!isCount(value) || !Number.isInteger(Number(value))) {
      fail(isDevelopment ? `\`${name}\` must be a whole number` : '');
    }
    parts[name] = Number(value);
  });
  return parts;
};

// a date that opens on its year can only be read one way, so it is put into ISO form however it was
// typed: '2026/11/06', '2026.11.06' and '2026-1-5', and an hour after it gains its zero too, '2026-1-5 9:00'
export const yearFirst = (text) =>
  text.replace(
    /^(\s*[+-]?\d{4,6})([/.-])(\d{1,2})\2(\d{1,2})(?!\d)(?:([T ])(\d)(?=:))?/,
    (_, year, mark, month, day, gap, hour) => `${year}-${pad(month)}-${pad(day)}${gap ? `${gap}0${hour}` : ''}`,
  );

// text that opens on a year, a month and a day is a date, whatever follows: '1990-10-17'
export const opensOnDate = (value) => isString(value) && /^\s*[+-]?\d{4,6}-?\d{2}-?\d{2}/.test(yearFirst(value));

// the month a name stands for, whole, shortened or its first three letters and more: 'Oct', 'sept',
// 'octobre', 'октября'. English is tried first, so 'Mar' is March in a Finnish locale too. zero when it stands for none
export const monthNamed = (name, locale) => {
  const tag = pickLocale(locale);
  const written = name.toLocaleLowerCase(tag);
  for (const table of [names('en'), names(tag)]) {
    for (const months of [table.MMMM, table.besideDay.MMMM, table.MMM, table.besideDay.MMM]) {
      const found = months.findIndex((full) => full.toLocaleLowerCase(tag).startsWith(written));
      if (found !== -1) {
        return found + 1;
      }
    }
  }
  return 0;
};
