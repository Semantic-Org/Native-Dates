import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';
import { describe, expect, it } from 'vitest';

// language tags asked of Intl, kept to the ones this runtime carries data for
const locales = Intl.DateTimeFormat.supportedLocalesOf(
  `af am ar as az be bg bn bs ca cs cy da de el en es et eu fa fi fil fr ga gl gu he hi hr hu hy id is it ja ka kk km kn ko
  ky lo lt lv mk ml mn mr ms my nb ne nl or pa pl ps pt ro ru si sk sl sq sr sv sw ta te th tk tr uk ur uz vi zh zu
  yue ha ig yo so sd ug tg tt bo dz gd br fo fy lb rm mt mi haw chr kok mai mni sa ks jv su ceb wo qu nn
  sr-Latn zh-TW zh-HK pt-PT es-MX es-AR en-GB en-CA en-AU en-IN en-ZA fr-CA fr-CH de-CH de-AT it-CH nl-BE
  ar-EG ar-SA ar-MA fa-AF sv-FI`.split(/\s+/),
);

// a day above 12, a day and month that can swap, midnight, an evening, and noon
const moments = [
  '2026-11-16T14:30:15',
  '2026-03-01T09:05:40',
  '2026-07-04T00:00:00',
  '2026-08-23T21:10:05',
  '2026-01-09T12:00:30',
];

// how much of a moment each time style writes: the date, the minutes, or the seconds
const written = { none: 10, short: 16, medium: 19 };

// a two-digit year drops its century, a clock is hours with two-digit minutes and seconds joined by ':', '.', or 'h',
// and a day period stands next to its clock with no word between them
const isRoundTrip = (parts) => {
  const types = parts.map((part) => part.type);
  const digitsIn = (type) => parts[types.indexOf(type)].value.match(/\p{Nd}/gu).length;
  const isJoined = (type, joiners) =>
    !types.includes(type) || (digitsIn(type) === 2 && joiners.includes(parts[types.indexOf(type) - 1].value.trim()));
  const period = types.indexOf('dayPeriod');
  const gap = parts[period + (period < types.indexOf('hour') ? 1 : -1)];
  return (!types.includes('year') || digitsIn('year') > 3)
    && isJoined('minute', [':', '.', 'h'])
    && isJoined('second', [':', '.'])
    && (period < 0 || !/\p{L}/u.test(gap.value));
};

describe('{ loose: true } reading what Intl prints in each locale', () => {
  it.each(locales)('reads %s dates and clocks back to the value Intl formatted', (locale) => {
    const misread = [];
    for (const moment of moments) {
      const epoch = Temporal.PlainDateTime.from(moment).toZonedDateTime('UTC').epochMilliseconds;
      for (const dateStyle of ['short', 'medium', 'long', 'full']) {
        for (const timeStyle of ['none', 'short', 'medium']) {
          const format = new Intl.DateTimeFormat(locale, {
            dateStyle,
            timeStyle: timeStyle === 'none' ? undefined : timeStyle,
            timeZone: 'UTC',
            calendar: 'gregory',
          });
          if (!isRoundTrip(format.formatToParts(epoch))) {
            continue;
          }
          const text = format.format(epoch);
          const options = { loose: true, locale, zone: 'UTC' };
          const read = timeStyle === 'none' ? date(text, options) : datetime(text, options);
          if (read?.toString().slice(0, written[timeStyle]) !== moment.slice(0, written[timeStyle])) {
            misread.push(`${text} -> ${read}`);
          }
        }
      }
    }
    expect(misread).toEqual([]);
  });

  it.each(locales)('reads %s clocks that name a part of the day for every hour', (locale) => {
    const format = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      dayPeriod: 'short',
      timeZone: 'UTC',
    });
    const misread = [];
    for (let hour = 0; hour < 24; hour++) {
      const epoch = Date.UTC(2026, 10, 16, hour, 30);
      if (!isRoundTrip(format.formatToParts(epoch))) {
        continue;
      }
      const text = format.format(epoch);
      const read = time(text, { loose: true, locale });
      if (read?.toString().slice(0, 5) !== `${String(hour).padStart(2, '0')}:30`) {
        misread.push(`${text} -> ${read}`);
      }
    }
    expect(misread).toEqual([]);
  });
});
