import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';
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
const moments = ['2026-11-16T14:30', '2026-03-01T09:05', '2026-07-04T00:00', '2026-08-23T21:10', '2026-01-09T12:00'];

const digitsIn = (part) => part?.value.match(/\p{Nd}/gu)?.length;

// a two-digit year drops its century, and a clock is read as hours and two-digit minutes joined by ':', '.', or 'h'
const isWritten = (parts) => {
  const types = parts.map((part) => part.type);
  const joiner = parts[types.indexOf('hour') + 1]?.value.trim();
  return digitsIn(parts.find((part) => part.type === 'year')) > 3
    && (!types.includes('hour')
      || (digitsIn(parts[types.indexOf('minute')]) === 2 && [':', '.', 'h'].includes(joiner)));
};

describe('{ loose: true } reading what Intl prints in each locale', () => {
  it.each(locales)('reads %s dates and clocks back to the value Intl formatted', (locale) => {
    const misread = [];
    for (const moment of moments) {
      const epoch = Temporal.PlainDateTime.from(moment).toZonedDateTime('UTC').epochMilliseconds;
      for (const dateStyle of ['short', 'medium', 'long', 'full']) {
        for (const timeStyle of [undefined, 'short']) {
          const format = new Intl.DateTimeFormat(locale, {
            dateStyle,
            timeStyle,
            timeZone: 'UTC',
            calendar: 'gregory',
          });
          if (!isWritten(format.formatToParts(epoch))) {
            continue;
          }
          const text = format.format(epoch);
          const options = { loose: true, locale, zone: 'UTC' };
          const read = timeStyle
            ? datetime(text, options)?.toString().slice(0, 16)
            : date(text, options)?.toString();
          if (read !== (timeStyle ? moment : moment.slice(0, 10))) {
            misread.push(`${text} -> ${read}`);
          }
        }
      }
    }
    expect(misread).toEqual([]);
  });
});
