import { compare, date, datetime } from 'native-dates';

const loadedAt = Date.now();
const pad = (value) => String(value).padStart(2, '0');
const isoDay = (ms) => {
  const point = new Date(ms);
  return `${point.getUTCFullYear()}-${pad(point.getUTCMonth() + 1)}-${pad(point.getUTCDate())}`;
};

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
dashboardDataTable();
serverMultiUserOrders();
