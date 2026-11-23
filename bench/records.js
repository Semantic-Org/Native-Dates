import { compare, date, datetime } from 'native-dates';

import { checkAnswer } from './helpers/checks.js';
import { between, distinctInstants, holdClock, pad, requireHost, seeded } from './helpers/fixtures.js';

/*
  an orders table and a dashboard in a browser that sits in Berlin and reads English.
  the app configures nothing, so every value takes the browser's own zone and locale.
  ops run in session order and later ops use what earlier ops built
*/

/*******************************
            Fixture
*******************************/

// wire data only, so no library code runs before the first op
const viewer = { zone: 'Europe/Berlin', locale: 'en-US', now: Date.UTC(2026, 10, 22, 9, 30) };
holdClock(viewer.now);

const random = seeded(20261122);
const titles = ['Invoice', 'Quote', 'Delivery', 'Service', 'Callback', 'Contract', 'Reminder', 'Credit'];

// 18 months of orders, so both offsets and both clock changes appear
const placed = distinctInstants(random, 1_000, Date.UTC(2025, 5, 1), viewer.now);
// edited between 20 seconds and 46 days ago, most of them recently
const ages = new Set();
while (ages.size < placed.length) {
  ages.add(Math.floor(20_000 * 10 ** (random() * 5.3)));
}
const edited = [...ages];
// real due dates repeat, 90 distinct days from a month overdue to two months out
const dueFrom = Temporal.PlainDate.from('2026-10-23');

const orders = placed.map((ms, index) => ({
  id: 1000 + index,
  title: `${titles[index % titles.length]} ${1000 + index}`,
  placedAt: new Date(ms).toISOString(),
  updatedAt: new Date(viewer.now - edited[index]).toISOString(),
  dueOn: dueFrom.add({ days: between(random, 0, 90) }).toString(),
}));

// a 90 day dashboard window that crosses the October clock change
const feed = distinctInstants(random, 10_000, Date.UTC(2026, 7, 25), viewer.now).map((ms, index) => ({
  id: index,
  at: new Date(ms).toISOString(),
}));

/*******************************
              Ops
*******************************/

let table = [];
let events = [];

// purpose: opens a page of 1,000 orders from JSON with placed time and due date, first on its page so it carries the cold start
export function openTable1k() {
  table = orders.map((order) => ({
    ...order,
    placedAt: datetime(order.placedAt),
    updatedAt: datetime(order.updatedAt),
    dueOn: date(order.dueOn),
  }));
  return table.map((row) => [row.placedAt.format('medium'), row.dueOn.text]);
}

// purpose: refreshes the "edited 5 minutes ago" and "due in 3 days" labels on the 1,000 rows held
export function refreshLabels1k() {
  return table.map((row) => [row.updatedAt.fromNow(), row.dueOn.fromNow()]);
}

// purpose: a click on the due date header sorts the 1,000 rows held
export function sortByDue1k() {
  return table.toSorted((a, b) => compare(a.dueOn, b.dueOn));
}

// purpose: a dashboard reads 10,000 events from JSON and buckets them by the viewer's local day
export function groupByDay10k() {
  events = feed.map((event) => ({ ...event, at: datetime(event.at) }));
  return Object.groupBy(events, (event) => event.at.date.toString());
}

// purpose: writes the 10,000 events held to CSV with a fixed stamp and a weekday and month label
export function exportRows10k() {
  const lines = events.map((event) =>
    `${event.id},${event.at.format('YYYY-MM-DD HH:mm')},"${event.at.format('dddd, D MMMM')}"`
  );
  return ['id,at,day', ...lines].join('\n');
}

/*******************************
        Expected Answers
*******************************/

// the same tasks in plain Temporal and Intl, built when a check runs so they add nothing before an op

const zonedOf = (ms) => Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(viewer.zone);
const utcOf = (plain) => Date.UTC(plain.year, plain.month - 1, plain.day);
const intl = (options, timeZone = viewer.zone) => new Intl.DateTimeFormat(viewer.locale, { ...options, timeZone });
const roundAway = (value) => Math.sign(value) * Math.round(Math.abs(value));
const byDay = ([a], [b]) => (a < b ? -1 : 1);
const minute = 60;
const hour = 3_600;
const day = 86_400;
const month = 30.436875 * day;
const year = 365.2425 * day;

// Moment and Day.js cutoffs: 45 seconds, 45 minutes, 22 hours, 26 days, 320 days
const sinceEdit = (ms, relative) => {
  const seconds = (ms - viewer.now) / 1000;
  const size = Math.abs(seconds);
  const [unit, length] = size < 45
    ? ['second', 1]
    : size < 45 * minute
    ? ['minute', minute]
    : size < 22 * hour
    ? ['hour', hour]
    : size < 26 * day
    ? ['day', day]
    : size < 320 * day
    ? ['month', month]
    : ['year', year];
  const value = roundAway(seconds / length);
  return relative[value === 0 ? 'auto' : 'always'].format(value, unit);
};

// whole days under a week, weeks under 26 days, months under 320 days
const untilDue = (days, relative) => {
  const size = Math.abs(days);
  if (size < 7) {
    return relative.auto.format(days, 'day');
  }
  return size < 26
    ? relative.always.format(roundAway(days / 7), 'week')
    : size < 320
    ? relative.always.format(roundAway(days * day / month), 'month')
    : relative.always.format(roundAway(days * day / year), 'year');
};

const expected = {
  openTable1k() {
    const medium = intl({ dateStyle: 'medium', timeStyle: 'short' });
    const dueText = intl({ dateStyle: 'medium' }, 'UTC');
    return orders.map((order) => [
      medium.format(Date.parse(order.placedAt)),
      dueText.format(utcOf(Temporal.PlainDate.from(order.dueOn))),
    ]);
  },
  refreshLabels1k() {
    const today = zonedOf(viewer.now).toPlainDate();
    const relative = {
      auto: new Intl.RelativeTimeFormat(viewer.locale, { numeric: 'auto' }),
      always: new Intl.RelativeTimeFormat(viewer.locale, { numeric: 'always' }),
    };
    return orders.map((order) => [
      sinceEdit(Date.parse(order.updatedAt), relative),
      untilDue(today.until(Temporal.PlainDate.from(order.dueOn)).days, relative),
    ]);
  },
  sortByDue1k: () =>
    orders.toSorted((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0)).map((order) => order.id),
  groupByDay10k() {
    const days = new Map();
    for (const event of feed) {
      const key = zonedOf(Date.parse(event.at)).toPlainDate().toString();
      days.set(key, [...(days.get(key) ?? []), event.id]);
    }
    return [...days].sort(byDay);
  },
  exportRows10k() {
    const weekday = intl({ weekday: 'long' });
    const monthName = intl({ month: 'long' });
    const lines = feed.map((event) => {
      const ms = Date.parse(event.at);
      const at = zonedOf(ms);
      const stamp = `${at.year}-${pad(at.month)}-${pad(at.day)} ${pad(at.hour)}:${pad(at.minute)}`;
      return `${event.id},${stamp},"${weekday.format(ms)}, ${at.day} ${monthName.format(ms)}"`;
    });
    return ['id,at,day', ...lines].join('\n');
  },
};

/*******************************
             Checks
*******************************/

// each day beside the ids filed under it
const idsOf = (groups) => Object.entries(groups).map(([day, list]) => [day, list.map((event) => event.id)]).sort(byDay);

const check = (op, answered, wanted) => {
  requireHost('records.js', viewer);
  checkAnswer(`records ${op}`, answered, wanted);
};

export const checks = {
  openTable1k: (cells) => check('openTable1k', cells, expected.openTable1k()),
  refreshLabels1k: (labels) => check('refreshLabels1k', labels, expected.refreshLabels1k()),
  sortByDue1k: (rows) => check('sortByDue1k', rows.map((row) => row.id), expected.sortByDue1k()),
  groupByDay10k: (groups) => check('groupByDay10k', idsOf(groups), expected.groupByDay10k()),
  exportRows10k: (csv) => check('exportRows10k', csv, expected.exportRows10k()),
};
