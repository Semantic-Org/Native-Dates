import { datetime, duration, hours, minutes } from 'native-dates';

const phrases = [
  '8h',
  '7h 30m',
  '45 min',
  '1.5 hours',
  '2h 15m',
  '90 minutes',
  '0.5h',
  '2 days 4 hours',
];

const shiftPairs = Array.from({ length: 512 }, (_, index) => {
  // span the 2026-10-25 Europe/Berlin fall-back transition so shifts exercise real zone offsets
  const startMs = Date.parse('2026-10-24T06:00:00Z') + index * 7_200_000;
  const endMs = startMs + (240 + (index % 360)) * 60_000;
  return [
    datetime(startMs, 'Europe/Berlin'),
    datetime(endMs, 'Europe/Berlin'),
    datetime(startMs + 45 * 86_400_000, 'Europe/Berlin'),
  ];
});

for (let i = 0; i < 256; i++) {
  hours(2).plus(minutes(30)).balance();
  duration(phrases[i % phrases.length]).plus(1.5, 'hours').balance();
  const [start, shiftEnd, monthEnd] = shiftPairs[i];
  start.until(shiftEnd, 'minutes');
  start.until(monthEnd).total('days');
}

export let sink = null;

// purpose: constructs, adds, spills fractional units, and balances 1,000 Duration chains via factories and phrases
export function constructAndBalance1k() {
  for (let i = 0; i < 1_000; i++) {
    const base = hours((i % 8) + 1).plus(minutes((i % 4) * 15));
    const parsed = duration(phrases[i % phrases.length]);
    sink = base.plus(parsed).plus(1.5, 'hours').balance();
  }
}

// purpose: measures 2,000 elapsed-minute and calendar-anchored spans across DST transitions via until() and since()
export function untilAndSince2k() {
  for (let i = 0; i < 2_000; i++) {
    const [start, shiftEnd, monthEnd] = shiftPairs[i % shiftPairs.length];
    sink = start.until(shiftEnd, 'minutes');
    sink = monthEnd.since(start).total('days');
  }
}
