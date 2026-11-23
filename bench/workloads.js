import { compare, date, datetime, timeRange, tomorrow, weekdayNames } from 'native-dates';

const loadedAt = Date.now();
const pad = (value) => String(value).padStart(2, '0');
const isoDay = (ms) => {
  const point = new Date(ms);
  return `${point.getUTCFullYear()}-${pad(point.getUTCMonth() + 1)}-${pad(point.getUTCDate())}`;
};

const pickerSelection = date(isoDay(loadedAt + 2 * 86_400_000)).to(date(isoDay(loadedAt + 9 * 86_400_000)));

const bookingsSpec = [
  ['2026-03-23T09:00', 30],
  ['2026-03-23T10:15', 45],
  ['2026-03-23T13:00', 90],
  ['2026-03-23T16:30', 30],
  ['2026-03-24T09:30', 60],
  ['2026-03-24T11:00', 30],
  ['2026-03-24T15:45', 30],
  ['2026-03-25T08:30', 60],
  ['2026-03-25T12:00', 60],
  ['2026-03-25T12:15', 30],
  ['2026-03-26T10:00', 120],
  ['2026-03-26T14:20', 25],
  ['2026-03-27T09:00', 480],
  ['2026-03-30T09:45', 30],
  ['2026-03-30T11:00', 45],
  ['2026-03-30T13:30', 60],
  ['2026-03-31T10:00', 30],
  ['2026-03-31T15:00', 90],
  ['2026-04-01T09:15', 15],
  ['2026-04-01T12:45', 30],
  ['2026-04-02T11:30', 60],
  ['2026-04-03T09:00', 30],
  ['2026-04-03T13:10', 50],
  ['2026-04-03T16:15', 75],
];

const plannerZones = [
  'America/Los_Angeles',
  'America/Denver',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];
const plannerInputs = Array.from({ length: 96 }, (_, step) => `${pad(Math.floor(step / 4))}:${pad((step % 4) * 15)}`);
const workday = timeRange('09:00', '18:00');

// 800 distinct JSON API records with millisecond instants and due dates clustered around today
const apiOrders = Array.from({ length: 800 }, (_, index) => {
  const placedMs = loadedAt - ((index * 19_937 + 701) % 180) * 86_400_000 - index * 61_317;
  const ageMs = ((index * 7_919 + 113) % 45) * 86_400_000 + index * 3_739;
  const dueOffset = ((index * 613) % 90) - 30;
  return {
    id: 1000 + index,
    placedAt: new Date(placedMs).toISOString(),
    updatedAt: new Date(loadedAt - ageMs).toISOString(),
    dueOn: isoDay(loadedAt + dueOffset * 86_400_000),
  };
});

// skewed deck of 400 server users across realistic regional zones, BCP 47 tags, and Accept-Language headers
const serverZones = [
  'America/New_York',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Africa/Cairo',
];
const serverLocales = [
  'en-US',
  'en-US, en;q=0.9',
  'en-GB',
  'de-DE, de;q=0.9, en;q=0.8',
  'fr-FR, fr;q=0.9, en;q=0.7',
  'es-MX',
  'es-ES',
  'pt-BR',
  'ja-JP',
  'zh-CN',
  'hi-IN',
  'ar-EG',
];
const serverRequests = Array.from({ length: 400 }, (_, reqIdx) => ({
  user: {
    zone: serverZones[(reqIdx * 7) % serverZones.length],
    locale: serverLocales[(reqIdx * 5 + (reqIdx % 3)) % serverLocales.length],
  },
  orders: Array.from({ length: 8 }, (__, ordIdx) => ({
    placedAt: new Date(loadedAt - (reqIdx * 8 + ordIdx) * 4_321_987),
  })),
}));

// exact formatOrder() callsite from docs/src/content/docs/guides/localization.md
function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

export let sink = null;

// purpose: builds 36 consecutive 42-cell calendar month grids calling live day.isToday(), isWeekend(), and contains()
export function calendarMonthGrid() {
  let month = date('2025-01-01').locale('de-DE');
  const months = [];
  for (let flip = 0; flip < 36; flip++) {
    months.push({
      title: month.format('month'),
      header: weekdayNames('short', undefined, 'de-DE'),
      cells: month.startOf('week').for(6, 'weeks').every('day').map((day) => ({
        key: day.toString(),
        day: day.day,
        outside: day.month !== month.month,
        weekend: day.isWeekend(),
        today: day.isToday('Europe/Berlin'),
        selected: pickerSelection.contains(day),
      })),
    });
    month = month.plus(1, 'month');
  }
  sink = months;
}

// purpose: finds open 30-minute booking slots across eight workweeks spanning the March Europe/Berlin DST transition
export function bookingFreeSlots() {
  for (let run = 0; run < 4; run++) {
    const taken = bookingsSpec.map(([start, mins]) => datetime(start, 'Europe/Berlin').for(mins, 'minutes'));
    const workdays = date('2026-03-23').for(2, 'weeks').every('day').filter((day) => day.isWeekday());
    sink = workdays.flatMap((day) =>
      day.at('09:00', 'Europe/Berlin')
        .to(day.at('17:00', 'Europe/Berlin'))
        .split(30, 'minutes')
        .filter((slot) => !taken.some((busy) => busy.overlaps(slot)))
        .map((slot) => slot.start.toJSON())
    );
  }
}

// purpose: scrubs the docs meeting-planner across 96 times x 10 zones and expands weekly/monthly recurring year series
export function meetingPlannerAndSeries() {
  const grid = plannerInputs.map((inputValue) => {
    const meeting = tomorrow('America/New_York').at(inputValue);
    return plannerZones.map((zone) => {
      const there = meeting.in(zone);
      return [
        there.format('time'),
        workday.contains(there.time),
        there.date.equals(meeting.date) ? '' : there.format({ weekday: 'long' }),
      ];
    });
  });
  const standups = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'].map((anchor) =>
    date(anchor).for(1, 'year').every('week').map((day) =>
      day.at('09:30', 'America/Los_Angeles').in('Europe/Berlin').format('time')
    )
  );
  const invoices = ['2026-01-28', '2026-01-29', '2026-01-30', '2026-01-31'].map((anchor) =>
    date(anchor).to('2026-12-31').every('month').map((day) => day.toString())
  );
  sink = [grid, standups, invoices];
}

// purpose: hydrates 800 JSON API orders, sorts by due date, filters isPast(), and renders .text and live fromNow()
export function dashboardDataTable() {
  const rows = apiOrders.map((order) => ({
    id: order.id,
    placedAt: datetime(order.placedAt, 'Europe/Berlin'),
    updatedAt: datetime(order.updatedAt, 'Europe/Berlin'),
    dueOn: date(order.dueOn),
  }));
  const sorted = rows.toSorted((a, b) => compare(a.dueOn, b.dueOn));
  const overdue = sorted.filter((row) => row.dueOn.isPast('Europe/Berlin'));
  sink = [
    overdue.length,
    sorted.map((row) => [
      row.placedAt.format('medium'),
      row.dueOn.text,
      row.updatedAt.fromNow(),
      row.dueOn.fromNow(),
    ]),
  ];
}

// purpose: runs the docs multi-user server formatOrder() across 400 skewed zone/Accept-Language requests (3,200 orders)
export function serverMultiUserOrders() {
  sink = serverRequests.map(({ user, orders }) => orders.map((order) => formatOrder(order, user)));
}

// pre-warm workload paths once at module load so constructor changes do not skew V8 inline-cache tiering
calendarMonthGrid();
bookingFreeSlots();
meetingPlannerAndSeries();
dashboardDataTable();
serverMultiUserOrders();
