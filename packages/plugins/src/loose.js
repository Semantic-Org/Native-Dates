import { setLooseExtension } from 'native-dates/helpers/errors';
import { dayFirst as readsDayFirst, zoneId } from 'native-dates/helpers/zones';

// match zone abbreviations ('EDT', 'UTC', 'GMT+2'), trailing Z, or offsets after spaces or clock times
// without matching two-digit years like '6-Sep-26'. Leading non-digits and parenthesized comments are
// captured and restored in one linear pass to avoid catastrophic backtracking on untrusted inputs
const zoneMarker =
  /(^\D+|\([^)]*\)?)|\b(?:GMT|UTC?|[ECMP][SD]T)\b(?:[+-]\d\d?(?::?\d\d)?)?|(?<![a-z])Z\b|(\s|:[\d.]+)[+-]\d\d?(?::?\d\d)?(?!\d)/gi;

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

// Date.parse interprets zoned strings as instants and unzoned strings in the host timezone (UTC for date-only ISO).
// Stripping zoneMarker parses the written wall clock in the host timezone so local inputs don't shift when placed into `zone`
export const looseZoned = (text, zone, dayFirst) => {
  const trimmed = engineOrder(text.trim(), readsDayFirst(dayFirst));
  const unzoned = trimmed.replace(zoneMarker, '$1$2');
  const [epoch, written] = [Date.parse(trimmed), Date.parse(unzoned)];
  if (Number.isNaN(epoch) || Number.isNaN(written)) {
    return undefined;
  }
  const host = dateOnly.test(trimmed) ? 'UTC' : Temporal.Now.timeZoneId();
  const wallClock = (milliseconds) => Temporal.Instant.fromEpochMilliseconds(milliseconds).toZonedDateTimeISO(host);
  const read = wallClock(written);
  if (rolledForward(unzoned, read, wallClock)) {
    return undefined;
  }
  return unzoned === trimmed
    ? read.toPlainDateTime().toZonedDateTime(zoneId(zone))
    : Temporal.Instant.fromEpochMilliseconds(epoch).toZonedDateTimeISO(zoneId(zone));
};

setLooseExtension(looseZoned);
