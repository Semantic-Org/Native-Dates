import { compare, date, datetime, weekdayNames } from 'native-dates';

const todayAnchor = date('2026-03-08');
const nowAnchor = datetime('2026-03-08T11:00:00Z', 'Europe/Berlin');
const pickerSelection = date('2026-03-10').to(date('2026-03-17'));

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

const apiOrders = Array.from({ length: 500 }, (_, index) => {
  const placedMs = Date.UTC(2025, 8, 1) + ((index * 19_937) % 180) * 86_400_000 + (index % 1_440) * 60_000;
  const ageMs = ((index * 7_919) % 45) * 86_400_000 + (index % 3_600) * 1_000;
  const dueOffset = ((index * 613) % 90) - 30;
  return {
    id: 1000 + index,
    placedAt: new Date(placedMs).toISOString(),
    updatedAt: new Date(nowAnchor.epochMilliseconds - ageMs).toISOString(),
    dueOn: todayAnchor.plus(dueOffset, 'days').toString(),
  };
});

export let sink = null;

// purpose: builds three 12-month calendar picker grids (42 day cells per month with weekend and range selection states)
export function calendarMonthGrid() {
  for (let run = 0; run < 3; run++) {
    let month = date('2026-01-01').locale('de-DE');
    const months = [];
    for (let flip = 0; flip < 12; flip++) {
      months.push({
        title: month.format('month'),
        header: weekdayNames('short', 'monday', 'de-DE'),
        cells: month.startOf('week').for(6, 'weeks').every('day').map((day) => ({
          key: day.toString(),
          day: day.day,
          outside: day.month !== month.month,
          weekend: day.isWeekend(),
          today: day.equals(todayAnchor),
          selected: pickerSelection.contains(day),
        })),
      });
      month = month.plus(1, 'month');
    }
    sink = months;
  }
}

// purpose: finds open 30-minute booking slots across two weeks spanning the March Europe/Berlin DST transition
export function bookingFreeSlots() {
  for (let run = 0; run < 2; run++) {
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

// purpose: hydrates 500 JSON API records, sorts by due date, and renders localized timestamps and relative labels
export function dashboardDataTable() {
  const rows = apiOrders.map((order) => ({
    id: order.id,
    placedAt: datetime(order.placedAt, 'Europe/Berlin'),
    updatedAt: datetime(order.updatedAt, 'Europe/Berlin'),
    dueOn: date(order.dueOn),
  }));
  const sorted = rows.toSorted((a, b) => compare(a.dueOn, b.dueOn));
  sink = sorted.map((row) => [
    row.placedAt.format('medium'),
    row.updatedAt.from(nowAnchor),
    row.dueOn.from(todayAnchor),
  ]);
}

// pre-warm workload paths once at module load so constructor changes do not skew V8 inline-cache tiering
calendarMonthGrid();
bookingFreeSlots();
dashboardDataTable();
