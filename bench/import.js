import '@native-dates/plugins/loose';
import { datetime } from 'native-dates';

import { checkAnswer } from './helpers/checks.js';
import { between, pad, seeded } from './helpers/fixtures.js';

/*
  three people each import a sheet of typed date-times in their own locale and zone, one format per column.
  each column keeps a different reader on the path: the engine's, the day-first reorder and localized month names
*/

/*******************************
            Fixture
*******************************/

const rows = 1_000;
const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

const columns = {
  english: {
    locale: 'en-US',
    zone: 'America/New_York',
    write: ({ year, month, day, hour, minute }) =>
      `${englishMonths[month - 1]} ${day}, ${year} ${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`,
  },
  german: {
    locale: 'de',
    zone: 'Europe/Berlin',
    write: ({ year, month, day, hour, minute }) => `${pad(day)}.${pad(month)}.${year} ${pad(hour)}:${pad(minute)}`,
  },
  french: {
    locale: 'fr',
    zone: 'Europe/Paris',
    write: ({ year, month, day, hour, minute }) =>
      `${day} ${frenchMonths[month - 1]} ${year} ${pad(hour)}:${pad(minute)}`,
  },
};

// cells that hold no date, plus a day the month does not have
const unreadable = ['', 'TBD', 'n/a', '-'];
const impossible = { year: 2026, month: 2, day: 30, hour: 10, minute: 0 };

// each cell beside the wall-clock fields it means, or null for the 5% that hold no date
const uploadOf = ({ locale, zone, write }, seed) => {
  const random = seeded(seed);
  const cells = [];
  const meant = [];
  for (let row = 0; row < rows; row++) {
    const roll = random();
    if (roll < 0.05) {
      cells.push(roll < 0.04 ? unreadable[between(random, 0, unreadable.length)] : write(impossible));
      meant.push(null);
      continue;
    }
    const year = between(random, 2025, 2028);
    const month = between(random, 1, 13);
    const fields = {
      year,
      month,
      day: between(random, 1, new Date(Date.UTC(year, month, 0)).getUTCDate() + 1),
      // daytime only, since Date.parse reads unzoned text in the host zone and a host clock change would move answers
      hour: between(random, 7, 20),
      minute: between(random, 0, 60),
    };
    cells.push(write(fields));
    meant.push(fields);
  }
  return { locale, zone, cells, meant };
};

const uploads = {
  english: uploadOf(columns.english, 1),
  german: uploadOf(columns.german, 2),
  french: uploadOf(columns.french, 3),
};

/*******************************
              Ops
*******************************/

const importColumn = ({ locale, zone, cells }) =>
  cells.map((cell) => datetime(cell, { loose: true, locale, zone })?.toJSON() ?? null);

// purpose: stores a column of 1,000 typed date-times written like "Sep 6, 2026 2:30 PM" (en-US, 5% unreadable)
export function importEnglish1k() {
  return importColumn(uploads.english);
}

// purpose: stores a column of 1,000 typed date-times written like "06.09.2026 14:30" (de, 5% unreadable)
export function importGerman1k() {
  return importColumn(uploads.german);
}

// purpose: stores a column of 1,000 typed date-times written like "6 septembre 2026 14:30" (fr, 5% unreadable)
export function importFrench1k() {
  return importColumn(uploads.french);
}

/*******************************
             Checks
*******************************/

// the instant each cell means, in plain Temporal and worked out when a check runs
const answersOf = ({ zone, meant }) =>
  meant.map((fields) =>
    fields && new Date(Temporal.PlainDateTime.from(fields).toZonedDateTime(zone).epochMilliseconds).toISOString()
  );

// names the cell that was misread, as a bare index says little about a sheet
const checkColumn = (op, upload, stored) => {
  const { locale, zone, cells } = upload;
  const answers = answersOf(upload);
  const row = answers.findIndex((answer, index) => stored[index] !== answer);
  if (row !== -1) {
    throw new Error(
      `bench ${op} read '${cells[row]}' (${locale}, ${zone}) as ${stored[row]}, expected ${answers[row]}`,
    );
  }
  checkAnswer(op, stored.length, answers.length);
};

export const checks = {
  importEnglish1k: (stored) => checkColumn('import importEnglish1k', uploads.english, stored),
  importGerman1k: (stored) => checkColumn('import importGerman1k', uploads.german, stored),
  importFrench1k: (stored) => checkColumn('import importFrench1k', uploads.french, stored),
};
