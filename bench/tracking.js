import { configure, datetime, duration } from 'native-dates';

// a support desk with time tracking, used by a team in Berlin and read in German

/*******************************
            Fixtures
*******************************/

const team = { zone: 'Europe/Berlin', locale: 'de-DE' };

// clocks went back at 03:00 on 2026-10-25, so tickets opened before then span the change
const firstTick = Date.parse('2026-10-26T08:00:00Z');
const ticks = Array.from({ length: 5 }, (_, second) => new Date(firstTick + second * 1000).toISOString());

// a page of the queue, mostly recent with a long tail out to about three weeks
const tickets = Array.from({ length: 50 }, (_, index) => {
  const openFor = Math.round(30 * 1.25 ** index) + index * 7;
  return { id: index, openedAt: new Date(firstTick - openFor * 1000).toISOString() };
});

const spellings = [
  '8h',
  '7h 30m',
  '45 min',
  '1.5 hours',
  '2h 15m',
  '30m',
  '1h',
  '6 hours',
  '20 minutes',
  '3h 45m',
  '90 minutes',
  '4h',
  '0.5h',
  '2 hours 30 minutes',
  '15m',
];
const entries = Array.from({ length: 1000 }, (_, index) => ({ logged: spellings[(index * 7 + (index >> 3)) % 15] }));

/*******************************
        Expected Answers
*******************************/

// sampled cells as `[tick, ticket, span]`, where ticket 42 spans the clock change so its 98 hours read as 4 days 1 hour
const elapsedSpans = [
  [0, 0, 'PT30S'],
  [4, 0, 'PT34S'],
  [0, 18, 'PT29M51S'],
  [4, 27, 'PT3H30M1S'],
  [2, 29, 'PT5H26M32S'],
  [0, 36, 'P1DT1H44M57S'],
  [0, 42, 'P4DT1H2M22S'],
  [4, 49, 'P19DT10H11M45S'],
];

const timesheetTotal = 'PT2879H10M';

/*******************************
              App
*******************************/

configure(team);

const openTickets = tickets.map((ticket) => ({ ...ticket, openedAt: datetime(ticket.openedAt) }));
const clock = ticks.map((tick) => datetime(tick));

/*******************************
              Ops
*******************************/

// purpose: a live "open for" column over a page of 50 tickets, re-rendered on 5 one-second ticks
export function elapsedColumn50x5() {
  return clock.map((tick) => openTickets.map((ticket) => tick.since(ticket.openedAt).round('second').format('narrow')));
}

// purpose: a month of 1,000 typed time entries parsed, summed and shown as a total
export function timesheetTotal1k() {
  return entries.reduce((sum, entry) => sum.plus(duration(entry.logged)), duration(0)).balance().format('short');
}

/*******************************
             Checks
*******************************/

// the platform's own wording is the oracle, so a browser's newer locale data does not fail the check
const spelled = (span, style) => new Intl.DurationFormat(team.locale, { style }).format(Temporal.Duration.from(span));

const expect = (op, actual, wanted) => {
  if (actual !== wanted) {
    throw new Error(`bench/tracking.js ${op} answered ${JSON.stringify(actual)}, expected ${JSON.stringify(wanted)}`);
  }
};

export const checks = {
  elapsedColumn50x5(cells) {
    expect('elapsedColumn50x5', cells.flat().length, ticks.length * tickets.length);
    for (const [tick, ticket, span] of elapsedSpans) {
      expect('elapsedColumn50x5', cells[tick][ticket], spelled(span, 'narrow'));
    }
  },
  timesheetTotal1k(label) {
    expect('timesheetTotal1k', label, spelled(timesheetTotal, 'short'));
  },
};
