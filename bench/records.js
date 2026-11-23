import { compare, configure, date, datetime, today } from 'native-dates';

/*
  one records app and the things a person does to it, each op one pass over the rows a real app holds.
  Fixtures and expected answers use only Temporal and Intl, so the same tasks can be written against another library
*/

/*******************************
            Fixture
*******************************/

// the viewer opens the app at 10:30 on a Sunday in Berlin, and the clock holds there for every op
const viewer = { zone: 'Europe/Berlin', locale: 'de-DE', now: Date.UTC(2026, 10, 22, 9, 30) };
Date.now = () => viewer.now;

// mulberry32, so every sample and both sides read identical rows
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};
const random = seeded(20261122);
const between = (low, high) => low + Math.floor(random() * (high - low));

// 18 months, so both offsets and both clock changes in the viewer's zone appear
const ordersFrom = Date.UTC(2025, 5, 1);
const ordersTo = Date.UTC(2026, 10, 22);
// a 90 day dashboard window that crosses the October clock change
const eventsFrom = Date.UTC(2026, 7, 25);
const eventsTo = Date.UTC(2026, 10, 22);

const titles = ['Rechnung', 'Angebot', 'Lieferung', 'Wartung', 'Rückruf', 'Vertrag', 'Mahnung', 'Gutschrift'];

// real due dates repeat, 90 distinct days from a month overdue to two months out
const dueFrom = Temporal.PlainDate.from('2026-10-23');

// distinct to the millisecond so no answer can be remembered by input string
const distinctInstants = (count, from, to) => {
  const seen = new Set();
  const instants = [];
  while (instants.length < count) {
    const ms = between(from, to);
    if (!seen.has(ms)) {
      seen.add(ms);
      instants.push(ms);
    }
  }
  return instants;
};

const orderCount = 10_000;
const orders = distinctInstants(orderCount, ordersFrom, ordersTo).map((ms, index) => ({
  id: 1000 + index,
  title: `${titles[index % titles.length]} ${1000 + index}`,
  placedAt: ms,
  dueOn: dueFrom.add({ days: between(0, 90) }).toString(),
}));

// the browser receives JSON strings, the server's database driver hands back Date objects
const pageSize = 1_000;
const wireOrders = orders.slice(0, pageSize).map((order) => ({
  ...order,
  placedAt: new Date(order.placedAt).toISOString(),
}));
const driverPages = Array.from(
  { length: 10 },
  (_, page) =>
    orders.slice(page * pageSize, (page + 1) * pageSize).map((order) => ({
      ...order,
      placedAt: new Date(order.placedAt),
    })),
);
const events = distinctInstants(10_000, eventsFrom, eventsTo).map((ms, index) => ({
  id: index,
  at: new Date(ms).toISOString(),
}));

/*******************************
        Expected Answers
*******************************/

const zonedOf = (ms) => Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(viewer.zone);
const viewerToday = zonedOf(viewer.now).toPlainDate();
const daysUntil = (dueOn) => viewerToday.until(Temporal.PlainDate.from(dueOn)).days;
const pad = (value) => String(value).padStart(2, '0');

const mediumFormat = new Intl.DateTimeFormat(viewer.locale, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: viewer.zone,
});
const relativeAuto = new Intl.RelativeTimeFormat(viewer.locale, { numeric: 'auto' });
const relativeAlways = new Intl.RelativeTimeFormat(viewer.locale, { numeric: 'always' });

// Moment and Day.js day cutoffs: days under a week, weeks under 26 days, months under 320 days
const roundAway = (value) => Math.sign(value) * Math.round(Math.abs(value));
const relativeDays = (days) => {
  const size = Math.abs(days);
  if (size < 7) {
    return relativeAuto.format(days, 'day');
  }
  return size < 26
    ? relativeAlways.format(roundAway(days / 7), 'week')
    : size < 320
    ? relativeAlways.format(roundAway(days / 30.436875), 'month')
    : relativeAlways.format(roundAway(days / 365.2425), 'year');
};

const exportLine = (order) => {
  const placed = zonedOf(order.placedAt);
  const stamp = `${placed.year}-${pad(placed.month)}-${pad(placed.day)} ${pad(placed.hour)}:${pad(placed.minute)}`;
  return `${order.id},${stamp},${order.dueOn},"${order.title}"`;
};

// built when a check runs, after the op's measure, so expected answers add nothing to page load
const answers = {
  openTable: () =>
    wireOrders.map((order) => [
      mediumFormat.format(Date.parse(order.placedAt)),
      relativeDays(daysUntil(order.dueOn)),
    ]),
  passThrough: () => driverPages.map((page) => JSON.stringify(page)),
  sortByDate: () =>
    wireOrders.toSorted((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0)).map((order) => order.id),
  dueSoon: () => wireOrders.filter((order) => daysUntil(order.dueOn) <= 7).map((order) => order.id),
  groupByDay: () => {
    const counts = new Map();
    for (const event of events) {
      const day = zonedOf(Date.parse(event.at)).toPlainDate().toString();
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return [...counts].sort(([a], [b]) => (a < b ? -1 : 1));
  },
  exportRows: () => ['id,placedAt,dueOn,title', ...orders.map(exportLine)].join('\n'),
};

/*******************************
              App
*******************************/

configure({ zone: viewer.zone, locale: viewer.locale });

// rows the app already holds once a page or an export has loaded
const table = wireOrders.map((order) => ({ ...order, placedAt: datetime(order.placedAt), dueOn: date(order.dueOn) }));
const everyOrder = orders.map((order) => ({ ...order, placedAt: datetime(order.placedAt), dueOn: date(order.dueOn) }));

// purpose: opens a page of 1,000 orders from JSON, showing when each was placed and when it is due
export function openTable() {
  return wireOrders.map((order) => {
    const row = { placedAt: datetime(order.placedAt), dueOn: date(order.dueOn) };
    return [row.placedAt.format('medium'), row.dueOn.fromNow()];
  });
}

// purpose: an API handler answers 10 requests of 1,000 rows, reading each Date from the database and sending JSON
export function passThrough() {
  return driverPages.map((rows) =>
    JSON.stringify(rows.map((row) => ({
      id: row.id,
      title: row.title,
      placedAt: datetime(row.placedAt),
      dueOn: date(row.dueOn),
    })))
  );
}

// purpose: a click on the due date header sorts the 1,000 rows on screen
export function sortByDate() {
  return table.toSorted((a, b) => compare(a.dueOn, b.dueOn)).map((row) => row.id);
}

// purpose: a filter keeps the 1,000 rows on screen that are due within a week, overdue included
export function dueSoon() {
  const day = today();
  return table.filter((task) => day.until(task.dueOn, 'days') <= 7).map((task) => task.id);
}

// purpose: a dashboard buckets 10,000 events by the viewer's local day across a clock change
export function groupByDay() {
  return Object.groupBy(events, (event) => datetime(event.at).date.toString());
}

// purpose: writes 10,000 held orders to CSV with fixed token formats
export function exportRows() {
  const lines = everyOrder.map((order) =>
    `${order.id},${order.placedAt.format('YYYY-MM-DD HH:mm')},${order.dueOn.format('YYYY-MM-DD')},"${order.title}"`
  );
  return ['id,placedAt,dueOn,title', ...lines].join('\n');
}

/*******************************
             Checks
*******************************/

// long strings like a JSON body or a CSV report a short window from the first differing character
const firstDifference = (answered, expected, at = 'the answer') => {
  if (Array.isArray(expected)) {
    for (let index = 0; index < Math.max(answered?.length ?? 0, expected.length); index++) {
      const found = firstDifference(answered?.[index], expected[index], `${at}[${index}]`);
      if (found) {
        return found;
      }
    }
    return Array.isArray(answered) ? undefined : { at, answered, expected };
  }
  if (typeof answered === 'string' && typeof expected === 'string' && answered !== expected) {
    let index = 0;
    while (answered[index] === expected[index]) {
      index++;
    }
    return {
      at: `${at} at character ${index}`,
      answered: answered.slice(index, index + 40),
      expected: expected.slice(index, index + 40),
    };
  }
  return JSON.stringify(answered) === JSON.stringify(expected) ? undefined : { at, answered, expected };
};

const checkAnswer = (name, answered, expected) => {
  const found = firstDifference(answered, expected);
  if (found) {
    throw new Error(
      `bench/records.js ${name} answered ${JSON.stringify(found.answered)} where ${
        JSON.stringify(found.expected)
      } was expected, in ${found.at}`,
    );
  }
};

const countsOf = (groups) =>
  Object.entries(groups).map(([day, list]) => [day, list.length]).sort(([a], [b]) => (a < b ? -1 : 1));

export const checks = {
  openTable: (answer) => checkAnswer('openTable', answer, answers.openTable()),
  passThrough: (answer) => checkAnswer('passThrough', answer, answers.passThrough()),
  sortByDate: (answer) => checkAnswer('sortByDate', answer, answers.sortByDate()),
  dueSoon: (answer) => checkAnswer('dueSoon', answer, answers.dueSoon()),
  groupByDay: (answer) => checkAnswer('groupByDay', countsOf(answer), answers.groupByDay()),
  exportRows: (answer) => checkAnswer('exportRows', answer, answers.exportRows()),
};
