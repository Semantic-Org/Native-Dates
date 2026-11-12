import { setLooseExtension } from 'native-dates/helpers/errors';
import { dayFirst as readsDayFirst, zoneId } from 'native-dates/helpers/zones';

// a loose string that names an instant: Z, GMT, UTC or an offset at its end, with or without Date's own
// parenthesised zone name after it
const namesInstant = /(?:GMT|UTC|Z|[+-]\d{2}(?::?\d{2})?)(?:\s*\([^)]*\))?\s*$/i;

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

// the engine reads February 30th as March 2nd. a numeric date says where its day sits, so the two
// compare. any other shape rolled when the day it would have rolled from is written in the text
const rolledForward = (text, read) => {
  const parts = numeric.exec(text);
  if (parts) {
    return Number(parts[2]) !== read.day;
  }
  if (read.day > 3) {
    return false;
  }
  const writtenDay = read.day + read.subtract({ days: read.day }).day;
  return new RegExp(`(?<![\\d:])${writtenDay}(?![\\d:])`).test(text);
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
  const instant = Temporal.Instant.fromEpochMilliseconds(epoch);
  const partial = dateOnly.exec(trimmed);
  if (!partial && namesInstant.test(trimmed)) {
    return instant.toZonedDateTimeISO(zoneId(zone));
  }
  const read = instant.toZonedDateTimeISO(partial ? 'UTC' : Temporal.Now.timeZoneId());
  if (rolledForward(trimmed, read)) {
    return undefined;
  }
  return read.toPlainDateTime().toZonedDateTime(zoneId(zone));
};

setLooseExtension(looseZoned);
