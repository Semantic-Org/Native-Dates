import '@native-dates/plugins/loose';
import { datetime } from 'native-dates';

/*
  three readers each import a sheet of typed date-times in their own locale and zone, so the engine reader,
  the day-first reorder, and the localized month reader all stay on the path. Fixture data and answers use
  plain code and Temporal alone, so another library can run the same task
*/

const rowsPerUpload = 400;

// mulberry32, so every run and every machine reads the same cells
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

const pad = (number) => String(number).padStart(2, '0');

const frenchMonths = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const columns = [
  {
    locale: 'en-US',
    zone: 'America/New_York',
    write: ({ year, month, day, hour, minute }) =>
      `${month}/${day}/${year} ${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`,
  },
  {
    locale: 'de',
    zone: 'Europe/Berlin',
    write: ({ year, month, day, hour, minute }) => `${pad(day)}.${pad(month)}.${year} ${pad(hour)}:${pad(minute)}`,
  },
  {
    locale: 'fr',
    zone: 'Europe/Paris',
    write: ({ year, month, day, hour, minute }) =>
      `${day} ${frenchMonths[month - 1]} ${year} ${pad(hour)}:${pad(minute)}`,
  },
];

// cells that hold no date, plus a day the month does not have
const unreadable = ['', 'TBD', 'n/a', '-'];
const impossible = { year: 2026, month: 2, day: 30, hour: 10, minute: 0 };

const uploadsFrom = (seed) => {
  const random = seeded(seed);
  const pick = (low, high) => low + Math.floor(random() * (high - low + 1));
  return columns.map(({ locale, zone, write }) => {
    const texts = [];
    const answers = [];
    for (let row = 0; row < rowsPerUpload; row++) {
      const roll = random();
      if (roll < 0.04) {
        texts.push(unreadable[pick(0, unreadable.length - 1)]);
        answers.push(null);
        continue;
      }
      if (roll < 0.05) {
        texts.push(write(impossible));
        answers.push(null);
        continue;
      }
      const year = pick(2025, 2027);
      const month = pick(1, 12);
      const fields = {
        year,
        month,
        day: pick(1, Temporal.PlainYearMonth.from({ year, month }).daysInMonth),
        // daytime only, since Date.parse reads unzoned text in the host zone and a host DST gap would move answers
        hour: pick(7, 19),
        minute: pick(0, 59),
      };
      texts.push(write(fields));
      answers.push(new Date(Temporal.PlainDateTime.from(fields).toZonedDateTime(zone).epochMilliseconds).toISOString());
    }
    return { locale, zone, texts, answers };
  });
};

const importUpload = ({ locale, zone, texts }) =>
  texts.map((text) => datetime(text, { loose: true, locale, zone })?.toJSON() ?? null);

const uploads = uploadsFrom(1);

// purpose: stores 1,200 typed date-times from three uploads (en-US, de, fr, 400 rows each, 5% unreadable) into their zones with loose parsing
export function importColumn() {
  return uploads.map(importUpload);
}

export const checks = {
  importColumn(imported) {
    uploads.forEach(({ locale, zone, texts, answers }, index) => {
      const saved = imported[index];
      const row = answers.findIndex((answer, at) => saved[at] !== answer);
      if (row !== -1) {
        throw new Error(`import read '${texts[row]}' (${locale}, ${zone}) as ${saved[row]}, expected ${answers[row]}`);
      }
    });
  },
};
