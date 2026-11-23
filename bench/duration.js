import { date, datetime, duration, hours, minutes, now, today } from 'native-dates';

const loadedAt = Date.now();
const phrases = [
  '8h',
  '7h 30m',
  '45 min',
  '1.5 hours',
  '2h 15m',
  '90 minutes',
  '0.5h',
  '3h 40m',
  '1h 20m',
  '4 hours 10 minutes',
  '25 min',
  '6.25 hours',
];

// distinct shift pairs spanning the 2026-10-25 Europe/Berlin fall-back transition
const shiftPairs = Array.from({ length: 3_000 }, (_, index) => {
  const startMs = Date.parse('2026-10-20T06:00:00Z') + index * 360_123;
  const endMs = startMs + (180 + ((index * 37) % 420)) * 60_000;
  return [datetime(startMs, 'Europe/Berlin'), datetime(endMs, 'Europe/Berlin')];
});

const baseToday = date(new Date(loadedAt).toISOString().slice(0, 10));
const taskDueDates = Array.from({ length: 3_000 }, (_, index) => baseToday.plus(((index * 53) % 90) - 15, 'days'));

const ticketOpenedAt = Array.from(
  { length: 100 },
  (_, index) => datetime(loadedAt - (index * 913_457 + 12_345), 'Europe/Berlin'),
);

for (let i = 0; i < 128; i++) {
  hours(2).plus(minutes(30)).balance().format('short');
  duration(phrases[i % phrases.length]).plus(1.5, 'hours').balance();
  const [start, end] = shiftPairs[i];
  start.until(end, 'hours');
  today('Europe/Berlin').until(taskDueDates[i], 'days');
  now('Europe/Berlin').since(ticketOpenedAt[i % ticketOpenedAt.length]).round('second').format('narrow');
}

export let sink = null;

// purpose: sums 1,500 typed duration phrases and inline hours()/minutes() helpers, then balances and formats the total
export function timesheetTotal1500() {
  let sum = duration(0);
  for (let i = 0; i < 1_500; i++) {
    const logged = duration(phrases[i % phrases.length]);
    const adjustment = hours((i % 4) + 1).minus(minutes((i % 3) * 15));
    sum = sum.plus(logged).plus(adjustment);
  }
  sink = sum.balance().format('short');
}

// purpose: computes 3,000 numeric until() spans in hours and days across fall-back DST and live today()
export function untilNumeric3k() {
  let total = 0;
  const currentDay = today('Europe/Berlin');
  for (let i = 0; i < shiftPairs.length; i++) {
    const [start, end] = shiftPairs[i];
    total += start.until(end, 'hours') + currentDay.until(taskDueDates[i], 'days');
  }
  sink = total;
}

// purpose: renders a 100-row live support-queue elapsed column across 5 ticks via now().since().round().format()
export function liveElapsedColumn500() {
  const cells = [];
  for (let tickIdx = 0; tickIdx < 5; tickIdx++) {
    const tick = now('Europe/Berlin');
    for (let i = 0; i < ticketOpenedAt.length; i++) {
      cells.push(tick.since(ticketOpenedAt[i]).round('second').format('narrow'));
    }
  }
  sink = cells;
}
