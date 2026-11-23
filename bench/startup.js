const loadedAt = Date.now();
const pad = (value) => String(value).padStart(2, '0');
const isoDay = (ms) => {
  const point = new Date(ms);
  return `${point.getUTCFullYear()}-${pad(point.getUTCMonth() + 1)}-${pad(point.getUTCDate())}`;
};

// plain wire primitives only at module scope so native-dates evaluates inside the timed export
const stayStart = isoDay(loadedAt + 7 * 86_400_000);
const stayEnd = isoDay(loadedAt + 14 * 86_400_000);
const pageOrders = Array.from({ length: 100 }, (_, index) => ({
  placedAt: new Date(loadedAt - (index * 5_432_123 + 45_000)).toISOString(),
  dueOn: isoDay(loadedAt + (((index * 17) % 60) - 20) * 86_400_000),
}));

export let sink = null;

// purpose: imports native-dates cold and renders a German page header, date range, duration badge, and 100 order rows
export async function firstPaint() {
  const { configure, date, dateRange, datetime, hours, weekdayNames } = await import('native-dates');
  configure({ locale: 'de-DE', zone: 'Europe/Berlin' });
  sink = [
    weekdayNames('short'),
    date(stayStart).format('MMMM YYYY'),
    dateRange(stayStart, stayEnd).format('long'),
    hours(2).text,
    pageOrders.map((order) => [
      datetime(order.placedAt).format('long'),
      datetime(order.placedAt).text,
      date(order.dueOn).fromNow(),
    ]),
  ];
}
