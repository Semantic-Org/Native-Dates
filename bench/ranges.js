import { date, dateRange, datetime, datetimeRange } from 'native-dates';

// 80% non-overlapping and 20% overlapping pairs to exercise both fast endpoint rejection and true overlap paths
const baseInstant = Date.parse('2026-03-08T00:00:00Z');
const dtPairs = Array.from({ length: 1_000 }, (_, index) => {
  const startA = baseInstant + index * 3_600_000;
  const endA = startA + 3_600_000;
  const overlaps = index % 5 === 0;
  const startB = overlaps ? startA + 1_800_000 : endA + 3_600_000;
  return [
    datetimeRange(datetime(startA, 'America/New_York'), datetime(endA, 'America/New_York')),
    datetimeRange(datetime(startB, 'America/New_York'), datetime(startB + 3_600_000, 'America/New_York')),
    datetime(overlaps ? startA + 900_000 : endA + 900_000, 'America/New_York'),
  ];
});

const dPairs = Array.from({ length: 1_000 }, (_, index) => {
  const startA = date('2026-01-01').plus(index % 300, 'days');
  const endA = startA.plus(5, 'days');
  const overlaps = index % 5 === 0;
  const startB = overlaps ? startA.plus(3, 'days') : endA.plus(4, 'days');
  return [
    dateRange(startA, endA),
    dateRange(startB, startB.plus(5, 'days')),
    overlaps ? startA.plus(2, 'days') : endA.plus(2, 'days'),
  ];
});

const monthSpan = dateRange('2026-03-01', '2026-03-31');
const arabicQuarter = dateRange('2026-01-01', '2026-03-31').locale('ar-EG');
const dstDayWindow = datetime('2026-03-08T08:00', 'America/New_York').to(
  datetime('2026-03-08T18:00', 'America/New_York'),
);

for (let i = 0; i < 256; i++) {
  const [dtA, dtB, dtPoint] = dtPairs[i];
  dtA.overlaps(dtB);
  dtA.contains(dtPoint);
  const [dA, dB, dPoint] = dPairs[i];
  dA.overlaps(dB);
  dA.contains(dPoint);
  monthSpan.every(1, 'day');
  dstDayWindow.split(30, 'minutes');
  monthSpan.count('weekdays');
  arabicQuarter.count('weekdays');
}

export let sink = 0;

// purpose: runs 20,000 overlaps() and contains() checks across DateTimeRange and DateRange pairs (80% disjoint, 20% overlapping)
export function overlapsAndContains20k() {
  let hits = 0;
  for (let i = 0; i < 5_000; i++) {
    const [dtA, dtB, dtPoint] = dtPairs[i % dtPairs.length];
    if (dtA.overlaps(dtB)) { hits++; }
    if (dtA.contains(dtPoint)) { hits++; }
    const [dA, dB, dPoint] = dPairs[i % dPairs.length];
    if (dA.overlaps(dB)) { hits++; }
    if (dA.contains(dPoint)) { hits++; }
  }
  sink = hits;
}

// purpose: expands daily points via every(), splits 30-minute slots across DST, and counts locale-aware weekdays 30 times
export function everySplitAndCount30() {
  for (let i = 0; i < 30; i++) {
    sink = monthSpan.every(1, 'day').length + dstDayWindow.split(30, 'minutes').length;
    sink += monthSpan.count('weekdays') + arabicQuarter.count('weekdays');
  }
}
