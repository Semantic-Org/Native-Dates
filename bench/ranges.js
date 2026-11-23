import { date, dateRange, datetime, datetimeRange, now, timeRange } from 'native-dates';

const pad = (value) => String(value).padStart(2, '0');

// 80% disjoint and 20% overlapping pairs over 4,000 distinct intervals across spring-forward DST
const baseInstant = Date.parse('2026-03-01T00:00:00.250Z');
const dtPairs = Array.from({ length: 4_000 }, (_, index) => {
  const startA = baseInstant + index * 900_137;
  const endA = startA + 3_600_000;
  const overlaps = index % 5 === 0;
  const startB = overlaps ? startA + 1_800_000 : endA + 3_600_000;
  return [
    datetimeRange(datetime(startA, 'America/New_York'), datetime(endA, 'America/New_York')),
    datetimeRange(datetime(startB, 'America/New_York'), datetime(startB + 3_600_000, 'America/New_York')),
    datetime(overlaps ? startA + 900_000 : endA + 900_000, 'America/New_York'),
  ];
});

const dPairs = Array.from({ length: 4_000 }, (_, index) => {
  const startA = date('2020-01-01').plus((index * 79) % 2_500, 'days');
  const endA = startA.plus(5, 'days');
  const overlaps = index % 5 === 0;
  const startB = overlaps ? startA.plus(3, 'days') : endA.plus(4, 'days');
  return [
    dateRange(startA, endA),
    dateRange(startB, startB.plus(5, 'days')),
    overlaps ? startA.plus(2, 'days') : endA.plus(2, 'days'),
  ];
});

// 440 distinct ISO leave intervals ('YYYY-MM-DD/YYYY-MM-DD') formatted and weekday-counted in en-US and ar-EG
const leavePeriods = Array.from({ length: 440 }, (_, index) => {
  const startMs = Date.UTC(2025, 0, 1) + index * 2 * 86_400_000;
  const endMs = startMs + ((index % 12) + 2) * 86_400_000;
  const s = new Date(startMs).toISOString().slice(0, 10);
  const e = new Date(endMs).toISOString().slice(0, 10);
  return [`${s}/${e}`, index % 3 === 0 ? 'ar-EG' : 'en-US'];
});

// 2,500 store schedules as wire strings, one-third crossing midnight ('22:00' to '02:00')
const storeHours = Array.from({ length: 2_500 }, (_, index) => {
  const minute = pad((index * 15) % 60);
  if (index % 3 === 0) {
    const openHour = 18 + (index % 6);
    const closeHour = 1 + (index % 5);
    return [`${pad(openHour)}:${minute}`, `${pad(closeHour)}:${minute}`];
  }
  const openHour = 6 + (index % 5);
  const closeHour = 16 + (index % 7);
  return [`${pad(openHour)}:${minute}`, `${pad(closeHour)}:${minute}`];
});

for (let i = 0; i < 128; i++) {
  const [dtA, dtB, dtPoint] = dtPairs[i];
  dtA.overlaps(dtB);
  dtA.contains(dtPoint);
  const [dA, dB, dPoint] = dPairs[i];
  dA.overlaps(dB);
  dA.contains(dPoint);
  const [period, locale] = leavePeriods[i];
  const leave = dateRange(period, { locale });
  leave.format('medium');
  leave.count('weekdays');
  const [opens, closes] = storeHours[i];
  timeRange(opens, closes).contains(now('America/New_York').time);
}

export let sink = 0;

// purpose: runs 16,000 overlaps() and contains() checks across distinct DateTimeRange and DateRange pairs
export function overlapsAndContains16k() {
  let hits = 0;
  for (let i = 0; i < dtPairs.length; i++) {
    const [dtA, dtB, dtPoint] = dtPairs[i];
    if (dtA.overlaps(dtB)) { hits++; }
    if (dtA.contains(dtPoint)) { hits++; }
    const [dA, dB, dPoint] = dPairs[i];
    if (dA.overlaps(dB)) { hits++; }
    if (dA.contains(dPoint)) { hits++; }
  }
  sink = hits;
}

// purpose: parses 440 ISO DateRange intervals, formats medium range labels, and counts en-US/ar-EG weekdays
export function formatAndCountLeave440() {
  let totalDays = 0;
  for (let i = 0; i < leavePeriods.length; i++) {
    const [period, locale] = leavePeriods[i];
    const leave = dateRange(period, { locale });
    totalDays += leave.format('medium').length + leave.count('weekdays');
  }
  sink = totalDays;
}

// purpose: filters 2,500 TimeRange store schedules (one-third overnight wrap-around) against live now().time
export function storeHoursOpenNow2500() {
  const current = now('America/New_York').time;
  let openCount = 0;
  for (let i = 0; i < storeHours.length; i++) {
    const [opens, closes] = storeHours[i];
    if (timeRange(opens, closes).contains(current)) { openCount++; }
  }
  sink = openCount;
}
