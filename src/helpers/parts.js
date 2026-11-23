import { each, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { fail } from './errors.js';
import { isCount, pad } from './units.js';

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

// normalize unambiguous year-first strings ('2026/1/5', '2026. 11. 16.', '2026年11月16日') and single-digit hours like
// '9:00' to ISO 8601. Latin letters never separate the parts, which keeps ISO weeks and quarters ('2026-W05-1') out
export const yearFirst = (text) =>
  text.replace(
    /^(\s*[+-]?\d{4,6})[^\dA-Za-z:]{1,2}(\d{1,2})[^\dA-Za-z:]{1,2}(\d{1,2})(?!\d)(?:[^\0-\u2fff]|\.)?(?:([T ])(\d)(?=:))?/,
    (_, year, month, day, gap, hour) => `${year}-${pad(month)}-${pad(day)}${gap ? `${gap}0${hour}` : ''}`,
  );

export const opensOnDate = (value) => isString(value) && /^\s*[+-]?\d{4,6}-?\d{2}-?\d{2}/.test(yearFirst(value));
