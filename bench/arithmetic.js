import { compare, date, datetime } from 'native-dates';

const locales = ['fr', 'fr-FR, fr;q=0.9, en;q=0.8', 'en-US', 'de-DE, de;q=0.9, en;q=0.7'];

// anchor around the 2026-03-08 America/New_York spring-forward transition so arithmetic crosses DST shifts
const zonedSeeds = Array.from(
  { length: 512 },
  (_, index) =>
    datetime(Date.parse('2026-03-07T04:00:00Z') + index * 5_400_000, {
      zone: index % 3 === 0 ? 'Europe/Berlin' : 'America/New_York',
      locale: locales[index % locales.length],
    }),
);

const shuffledDates = Array.from({ length: 1_000 }, (_, index) => {
  const scrambled = (index * 613 + 97) % 1_000;
  return date('2024-01-01').plus(scrambled, 'days');
});

const shuffledInstants = Array.from({ length: 1_000 }, (_, index) => {
  const scrambled = (index * 733 + 41) % 1_000;
  return datetime(1_740_000_000_000 + scrambled * 86_400_000, 'America/New_York');
});

for (let i = 0; i < 256; i++) {
  const seed = zonedSeeds[i];
  seed.plus(1, 'day').at('09:00');
  seed.plus(90, 'minutes').in('Europe/Berlin');
  shuffledDates[i].startOf('week').endOf('month');
  compare(shuffledDates[i], shuffledDates[i + 1]);
  compare(shuffledInstants[i], shuffledInstants[i + 1]);
}

export let sink = null;

// purpose: executes 5,000 chained plus(), at(), and in() steps across DST shifts with multi-tag header locales
export function chainZonedMath5k() {
  for (let i = 0; i < 2_500; i++) {
    const seed = zonedSeeds[i % zonedSeeds.length];
    sink = seed.plus(1, 'day').at('09:00');
    sink = seed.plus(90, 'minutes').in('Europe/Berlin');
  }
}

// purpose: computes week and month boundaries and sorts 1,000 CalendarDate and 1,000 DateTime values via compare()
export function boundariesAndSort() {
  for (let i = 0; i < shuffledDates.length; i++) {
    sink = shuffledDates[i].startOf('week').endOf('month');
  }
  sink = shuffledDates.toSorted(compare);
  sink = shuffledInstants.toSorted(compare);
}
