import { each, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { fail } from './errors.js';
import { names } from './tokens.js';
import { isCount, pad } from './units.js';
import { locale as pickLocale } from './zones.js';

// Temporal.PlainMonthDay/PlainYearMonth.from() truncates floats (11.7 -> 11), coerces booleans, and ignores extra keys
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

// normalize unambiguous YYYY/M/D or YYYY.M.D strings (and single-digit hours like '9:00') to ISO 8601
export const yearFirst = (text) =>
  text.replace(
    /^(\s*[+-]?\d{4,6})([/.-])(\d{1,2})\2(\d{1,2})(?!\d)(?:([T ])(\d)(?=:))?/,
    (_, year, mark, month, day, gap, hour) => `${year}-${pad(month)}-${pad(day)}${gap ? `${gap}0${hour}` : ''}`,
  );

export const opensOnDate = (value) => isString(value) && /^\s*[+-]?\d{4,6}-?\d{2}-?\d{2}/.test(yearFirst(value));

// check English before the active locale so 'Mar 17' parses as March even in Finnish ('marraskuu')
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
