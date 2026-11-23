import { compare, date, datetime, monthDay, time, yearMonth } from 'native-dates';

const loadedAt = Date.now();
const pad = (value) => String(value).padStart(2, '0');
const locales = ['fr', 'fr-FR, fr;q=0.9, en;q=0.8', 'en-US', 'de-DE, de;q=0.9, en;q=0.7'];

// anchor around the 2026-03-08 America/New_York and 2026-03-29 Europe/Berlin spring-forward transitions
const zonedSeeds = Array.from(
  { length: 2_250 },
  (_, index) =>
    datetime(Date.parse('2026-03-07T04:00:00.125Z') + index * 1_110_321, {
      zone: index % 3 === 0 ? 'Europe/Berlin' : 'America/New_York',
      locale: locales[index % locales.length],
    }),
);

const scheduleDays = Array.from({ length: 2_250 }, (_, index) => {
  const point = new Date(Date.UTC(2026, 2, 1) + ((index * 131) % 365) * 86_400_000);
  return `${point.getUTCFullYear()}-${pad(point.getUTCMonth() + 1)}-${pad(point.getUTCDate())}`;
});

const todayIso = new Date(loadedAt).toISOString().slice(0, 10);
const boundaryDates = Array.from({ length: 1_500 }, (_, index) => {
  const offset = ((index * 613 + 97) % 1_500) - 750;
  return date(todayIso).plus(offset, 'days');
});

const shuffledDates = boundaryDates.slice(0, 1_000);
const shuffledInstants = Array.from({ length: 1_000 }, (_, index) => {
  const scrambled = (index * 733 + 41) % 1_000;
  return datetime(loadedAt - 500 * 86_400_000 + scrambled * 86_400_123, 'America/New_York');
});
const shuffledTimes = Array.from({ length: 1_000 }, (_, index) => {
  const totalSeconds = (index * 19_937 + 503) % 86_400;
  return time(Math.floor(totalSeconds / 3_600), Math.floor((totalSeconds % 3_600) / 60), totalSeconds % 60);
});

// all 366 calendar month-days from leap year 2024, including 02-29
const birthdayCodes = Array.from({ length: 366 }, (_, index) => {
  const point = new Date(Date.UTC(2024, 0, 1) + index * 86_400_000);
  return `${pad(point.getUTCMonth() + 1)}-${pad(point.getUTCDate())}`;
});

const eventTimestamps = Array.from(
  { length: 4_500 },
  (_, index) => new Date(Date.UTC(2025, 0, 1, 0, 15, 0, 250) + index * 23_456_789).toISOString(),
);

for (let i = 0; i < 128; i++) {
  date(scheduleDays[i]).plus(2, 'days').at('9am', 'America/New_York').in('Europe/Berlin');
  zonedSeeds[i].plus(90, 'minutes').in('Europe/Berlin');
  boundaryDates[i].startOf('week').endOf('month');
  boundaryDates[i].isPast();
  compare(shuffledDates[i], shuffledDates[i + 1]);
  compare(shuffledInstants[i], shuffledInstants[i + 1]);
  compare(shuffledTimes[i], shuffledTimes[i + 1]);
  monthDay(birthdayCodes[i]).next();
  yearMonth('2026-03').format('short');
}

export let sink = null;

// purpose: runs 4,500 house-sentence (date.plus.at.in) and zoned DST steps carrying multi-tag header locales
export function chainZonedMath4500() {
  for (let i = 0; i < 2_250; i++) {
    sink = date(scheduleDays[i]).plus(2, 'days').at('9am', 'America/New_York').in('Europe/Berlin');
    sink = zonedSeeds[i].plus(90, 'minutes').in('Europe/Berlin');
  }
}

// purpose: computes startOf('week').endOf('month') boundaries and live isPast() checks across 1,500 CalendarDates
export function boundariesAndFilter1500() {
  let overdue = 0;
  for (let i = 0; i < boundaryDates.length; i++) {
    sink = boundaryDates[i].startOf('week').endOf('month');
    if (boundaryDates[i].isPast()) { overdue++; }
  }
  sink = overdue;
}

// purpose: sorts 1,000 shuffled CalendarDate, 1,000 DateTime, and 1,000 Time instances via compare()
export function sortByCompare3k() {
  sink = [
    shuffledDates.toSorted(compare),
    shuffledInstants.toSorted(compare),
    shuffledTimes.toSorted(compare),
  ];
}

// purpose: resolves and sorts 366 MonthDay birthdays (with Feb 29) and groups 4,500 events by day and YearMonth
export function birthdaysAndYearMonths() {
  const upcoming = birthdayCodes.map((code) => monthDay(code).next()).toSorted(compare);
  const todays = birthdayCodes.filter((code) => monthDay(code).isToday());
  const byMonth = new Map();
  for (let i = 0; i < eventTimestamps.length; i++) {
    const local = datetime(eventTimestamps[i], 'America/New_York');
    const monthKey = local.yearMonth.toString();
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + local.date.day);
  }
  const axis = [...byMonth.keys()].map((key) => yearMonth(key).format('short'));
  sink = [upcoming, todays, axis];
}
