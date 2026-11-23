import { configure, datetime, duration } from 'native-dates';

import { checkAnswer } from './helpers/checks.js';
import { between, distinctInstants, seeded } from './helpers/fixtures.js';

// a support desk with time tracking, used by a team in Berlin and read in German

/*******************************
            Fixture
*******************************/

// wire data only, so no library value exists before the first op
const team = { zone: 'Europe/Berlin', locale: 'de-DE' };
const random = seeded(20261026);
const minute = 60_000;

// clocks went back at 03:00 on 2026-10-25, so tickets opened before then span the change
const firstTick = Date.parse('2026-10-26T08:00:00Z');
const ticks = Array.from({ length: 5 }, (_, second) => new Date(firstTick + second * 1000).toISOString());

// a page of the queue, mostly recent with a long tail out to about three weeks
const tickets = Array.from({ length: 50 }, (_, index) => {
  const openFor = Math.round(30 * 1.25 ** index) + index * 7;
  return { id: index, openedAt: new Date(firstTick - openFor * 1000).toISOString() };
});

// a month of shifts of 4 to 10 hours around the clock change, some of them worked through it.
// none starts in the second 02:00 hour of that night, where a day-first Temporal span reads an hour long
const repeatedHour = [Date.UTC(2026, 9, 25, 1) / minute, Date.UTC(2026, 9, 25, 2) / minute];
const shifts = distinctInstants(random, 1_010, Date.UTC(2026, 9, 5) / minute, Date.UTC(2026, 10, 2) / minute)
  .filter((startMinute) => startMinute < repeatedHour[0] || startMinute >= repeatedHour[1])
  .slice(0, 1_000)
  .map((startMinute) => ({
    start: new Date(startMinute * minute).toISOString(),
    end: new Date((startMinute + between(random, 240, 600)) * minute).toISOString(),
  }));

// what people type beside the minutes it means
const spellings = [
  ['8h', 480],
  ['7h 30m', 450],
  ['45 min', 45],
  ['1.5 hours', 90],
  ['2h 15m', 135],
  ['30m', 30],
  ['1h', 60],
  ['6 hours', 360],
  ['20 minutes', 20],
  ['3h 45m', 225],
  ['90 minutes', 90],
  ['4h', 240],
  ['0.5h', 30],
  ['2 hours 30 minutes', 150],
  ['15m', 15],
];
// real timesheets repeat a handful of spellings
const entries = Array.from({ length: 1000 }, (_, index) => {
  const [logged, minutes] = spellings[(index * 7 + (index >> 3)) % spellings.length];
  return { logged, minutes };
});

/*******************************
              Ops
*******************************/

configure(team);

// purpose: a live "open for" column over 50 tickets, re-rendered on 5 one-second ticks, first on its page so it carries the cold start
export function elapsedColumn50x5() {
  const queue = tickets.map((ticket) => ({ ...ticket, openedAt: datetime(ticket.openedAt) }));
  return ticks.map((now) => {
    const tick = datetime(now);
    return queue.map((ticket) => tick.since(ticket.openedAt).round('second').format('narrow'));
  });
}

// purpose: a payroll page works out the hours of 1,000 shifts from their clock-in and clock-out times
export function hoursWorked1k() {
  return shifts.map((shift) => datetime(shift.start).until(shift.end, 'hours'));
}

// purpose: a month of 1,000 typed time entries parsed, summed and shown as a total
export function timesheetTotal1k() {
  return entries.reduce((sum, entry) => sum.plus(duration(entry.logged)), duration(0)).balance().format('short');
}

/*******************************
        Expected Answers
*******************************/

// the same tasks in plain Temporal and Intl, built when a check runs so they add nothing before an op

const zonedOf = (text) => Temporal.Instant.from(text).toZonedDateTimeISO(team.zone);
const spelled = (span, style) => new Intl.DurationFormat(team.locale, { style }).format(span);

const expected = {
  // day-first, so a ticket open across the clock change reads 4 days 1 hour for its 98 hours
  elapsedColumn50x5: () =>
    ticks.map((tick) =>
      tickets.map((ticket) =>
        spelled(
          zonedOf(ticket.openedAt).until(zonedOf(tick), { largestUnit: 'day', smallestUnit: 'second' }),
          'narrow',
        )
      )
    ),
  hoursWorked1k: () => shifts.map((shift) => (Date.parse(shift.end) - Date.parse(shift.start)) / 3_600_000),
  timesheetTotal1k() {
    const minutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
    return spelled({ hours: Math.floor(minutes / 60), minutes: minutes % 60 }, 'short');
  },
};

/*******************************
             Checks
*******************************/

// two routes to the same hours can differ in the last bit of a double
const millionths = (hours) => Math.round(hours * 1e6) / 1e6;

export const checks = {
  elapsedColumn50x5: (cells) => checkAnswer('tracking elapsedColumn50x5', cells, expected.elapsedColumn50x5()),
  hoursWorked1k: (hours) =>
    checkAnswer('tracking hoursWorked1k', hours.map(millionths), expected.hoursWorked1k().map(millionths)),
  timesheetTotal1k: (label) => checkAnswer('tracking timesheetTotal1k', label, expected.timesheetTotal1k()),
};
