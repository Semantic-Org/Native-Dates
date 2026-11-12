import { setLooseExtension } from 'native-dates/helpers/errors';
import { dayFirst as readsDayFirst, zoneId } from 'native-dates/helpers/zones';

// a loose string that names an instant: Z, GMT, UTC or an offset at its end, with or without Date's own
// parenthesised zone name after it
const namesInstant = /(GMT|UTC|Z|[+-]\d{2}(?::?\d{2})?)(?:\s*\([^)]*\))?\s*$/i;

// the date-only ISO shapes, '2026', '2026-09' and '2026-02-30', which the engine reads at UTC midnight
// where every other wall clock reads in the machine's zone
const dateOnly = /^[+-]?\d{4,6}(?:-\d{2}(?:-\d{2})?)?$/;

// a numeric date, '07.09.2026' or '7/9/26', with whatever clock follows. the engine reads it month
// first, and most of the world writes it day first, so the two parts swap when the app says so
const numeric = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(\b.*)$/;
const engineOrder = (text, dayFirst) => {
  const parts = numeric.exec(text);
  if (!parts) {
    return text;
  }
  const [, first, second, year, rest] = parts;
  return dayFirst ? `${second}/${first}/${year}${rest}` : `${first}/${second}/${year}${rest}`;
};

// the zone the clock in the text was written in: UTC for a date-only shape, the offset the text ends
// on, or else the machine's
const writtenZone = (text) => {
  const [, offset] = dateOnly.test(text) ? [0, 'Z'] : namesInstant.exec(text) ?? [];
  if (!offset) {
    return Temporal.Now.timeZoneId();
  }
  const digits = offset.replace(':', '');
  return /\d/.test(digits) ? `${digits.slice(0, 3)}:${digits.slice(3) || '00'}` : 'UTC';
};

// the engine reads February 30th as March 2nd. the day it would have rolled from is put back as the
// 28th, and when the engine then reads the month before, that day was written and never existed. a
// 29 that is the year, 'Mar 1, 29', reads the same month either way
const rolledForward = (text, read, wallClock) => {
  if (read.day > 3) {
    return false;
  }
  const writtenDay = read.day + read.subtract({ days: read.day }).day;
  const epoch = Date.parse(text.replace(new RegExp(`(?<![\\d:])${writtenDay}(?![\\d:])`), '28'));
  return !Number.isNaN(epoch) && wallClock(epoch).month !== read.month;
};

// whatever this engine's Date reads that Temporal refuses, RFC 2822 and locale strings included. a
// string naming an instant reads in the zone asked for. any other string is a wall clock, read the way
// Date reads it and then stood in the zone asked for, so the day and the clock the person wrote stay.
// a day the engine rolled forward, February 30th, is not a day and reads as nothing
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
