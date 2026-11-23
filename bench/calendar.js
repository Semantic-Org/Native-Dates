import { date, datetime, timeRange, tomorrow, weekdayNames } from 'native-dates';

const loadedAt = Date.now();
const pad = (value) => String(value).padStart(2, '0');
const isoDay = (ms) => {
  const point = new Date(ms);
  return `${point.getUTCFullYear()}-${pad(point.getUTCMonth() + 1)}-${pad(point.getUTCDate())}`;
};

// anchor the 3-year picker window around the current year so live isToday() and selection stay inside it
const gridStartIso = `${new Date(loadedAt).getUTCFullYear() - 1}-01-01`;
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
const plannerInputs = Array.from({ length: 144 }, (_, step) => `${pad(Math.floor(step / 6))}:${pad((step % 6) * 10)}`);
const workday = timeRange('09:00', '18:00');

const weeklySeriesAnchors = Array.from({ length: 16 }, (_, idx) => {
  const day = pad(idx + 1);
  return [`2026-01-${day}`, idx % 2 === 0 ? 'America/Los_Angeles' : 'America/New_York'];
});
const monthlySeriesAnchors = [
  '2026-01-10',
  '2026-01-15',
  '2026-01-20',
  '2026-01-28',
  '2026-01-29',
  '2026-01-30',
  '2026-01-31',
  '2026-02-28',
];

export let sink = null;

// purpose: builds 28 consecutive 42-cell calendar month grids calling live day.isToday(), isWeekend(), and contains()
export function calendarMonthGrid() {
  let month = date(gridStartIso).locale('de-DE');
  const months = [];
  for (let flip = 0; flip < 28; flip++) {
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

// purpose: scrubs the docs meeting-planner across 144 input times x 10 global cities with inline weekday options
export function meetingPlanner() {
  sink = plannerInputs.map((inputValue) => {
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
}

// purpose: expands 24 weekly and month-end recurring series across a full year spanning DST shifts and Feb clamping
export function recurringSeries24() {
  const standups = weeklySeriesAnchors.map(([anchor, zone]) =>
    date(anchor).for(1, 'year').every('week').map((day) => day.at('09:30', zone).in('Europe/Berlin').toJSON())
  );
  const invoices = monthlySeriesAnchors.map((anchor) =>
    date(anchor).for(1, 'year').every('month').map((day) => day.toJSON())
  );
  sink = [standups, invoices];
}

// pre-warm calendar story paths once at module load so constructor changes do not skew V8 inline-cache tiering
calendarMonthGrid();
bookingFreeSlots();
meetingPlanner();
recurringSeries24();
