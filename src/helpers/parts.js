import { each } from '@semantic-ui/utils';
import { names } from './tokens.js';
import { isString } from './types.js';
import { isCount } from './units.js';
import { locale as pickLocale } from './zones.js';

// reading for the nouns that are part of a date: a month and a day, a year and a month

// the parts a fields object is allowed, as whole numbers. Temporal would truncate 11.7, read true as
// 1 and drop a part it has no use for, so each of those is refused before it gets there
export const wholeParts = (fields, names) => {
  const parts = {};
  each(fields, (value, name) => {
    if (!names.includes(name)) {
      throw new RangeError(`${name} is not a part here, only ${names.join(' and ')}`);
    }
    if (!isCount(value) || !Number.isInteger(Number(value))) {
      throw new RangeError(`${name} is a whole number`);
    }
    parts[name] = Number(value);
  });
  return parts;
};

// text that opens on a year, a month and a day is a date, whatever follows: '1990-10-17'
export const opensOnDate = (value) => isString(value) && /^\s*[+-]?\d{4,6}-?\d{2}-?\d{2}/.test(value);

// the month a name stands for, whole, shortened or its first three letters and more: 'Oct', 'sept',
// 'octobre', 'октября'. English is tried first, so 'Mar' is March in a Finnish locale too, then the
// names Intl has for the configured locale, alone and beside a day. zero when it stands for none
export const monthNamed = (name) => {
  const tag = pickLocale();
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
