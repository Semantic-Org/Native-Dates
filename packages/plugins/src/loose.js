import { setLooseExtension } from 'native-dates/helpers/errors';
import { dayFirst as readsDayFirst, zoneId } from 'native-dates/helpers/zones';

// trailing offset or zone marker, allowing Date.toString()'s parenthesized '(Pacific Daylight Time)' suffix
const namesInstant = /(GMT|UTC|Z|[+-]\d{2}(?::?\d{2})?)(?:\s*\([^)]*\))?\s*$/i;

// ES5 parses ISO date-only strings ('2026', '2026-09', '2026-09-06') at UTC midnight instead of local time
const dateOnly = /^[+-]?\d{4,6}(?:-\d{2}(?:-\d{2})?)?$/;

// engines parse numeric '7/9/26' month-first, so swap the first two fields when dayFirst is enabled
const numeric = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(\b.*)$/;
const engineOrder = (text, dayFirst) => {
  const parts = numeric.exec(text);
  if (!parts) {
    return text;
  }
  const [, first, second, year, rest] = parts;
  return dayFirst ? `${second}/${first}/${year}${rest}` : `${first}/${second}/${year}${rest}`;
};

const writtenZone = (text) => {
  const [, offset] = dateOnly.test(text) ? [0, 'Z'] : namesInstant.exec(text) ?? [];
  if (!offset) {
    return Temporal.Now.timeZoneId();
  }
  const digits = offset.replace(':', '');
  return /\d/.test(digits) ? `${digits.slice(0, 3)}:${digits.slice(3) || '00'}` : 'UTC';
};

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

// Date.parse returns epoch ms after interpreting text in UTC, a trailing offset, or the host's local zone.
// Read the wall clock back in that same zone first so local inputs don't shift when placed into `zone`
export const looseZoned = (text, zone, dayFirst) => {
  const trimmed = engineOrder(text.trim(), readsDayFirst(dayFirst));
  const epoch = Date.parse(trimmed);
  if (Number.isNaN(epoch)) {
    return undefined;
  }
  const written = writtenZone(trimmed);
  const wallClock = (milliseconds) => Temporal.Instant.fromEpochMilliseconds(milliseconds).toZonedDateTimeISO(written);
  const read = wallClock(epoch);
  if (rolledForward(trimmed, read, wallClock)) {
    return undefined;
  }
  return !dateOnly.test(trimmed) && namesInstant.test(trimmed)
    ? read.withTimeZone(zoneId(zone))
    : read.toPlainDateTime().toZonedDateTime(zoneId(zone));
};

setLooseExtension(looseZoned);
