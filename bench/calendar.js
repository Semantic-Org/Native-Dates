import { configure, date, datetime, tomorrow, weekdayNames } from 'native-dates';

import { checkAnswer } from './helpers/checks.js';
import { holdClock } from './helpers/fixtures.js';

/*
  a calendar app set to Berlin and German: flipping months in a date picker, asking for open slots,
  planning a meeting across zones and expanding recurring series
*/

/*******************************
            Fixture
*******************************/

// wire data only, so no library value exists before the first op

// noon in Berlin on the day US clocks change, so tomorrow is a day US and European clocks are out of step
const app = { zone: 'Europe/Berlin', locale: 'de-DE', now: '2026-03-08T11:00:00Z' };
holdClock(Date.parse(app.now));

// a year of month flips with a week selected, crossing both clock changes and 28 to 31 day months
const picker = { firstMonth: '2026-01-01', months: 12, selection: ['2026-03-10', '2026-03-17'] };

// two weeks of a booking page across the March clock change, with bookings that touch, nest and overlap slots
const booking = {
  firstDay: '2026-03-23',
  opens: '9:00',
  closes: '17:00',
  bookings: [
    ['2026-03-23T09:00', 30],
    ['2026-03-23T10:15', 45],
    ['2026-03-23T13:00', 90],
    ['2026-03-23T16:30', 30],
    ['2026-03-24T09:30', 60],
    ['2026-03-24T11:00', 30],
    ['2026-03-24T11:30', 30],
    ['2026-03-24T15:45', 30],
    ['2026-03-25T08:30', 60],
    ['2026-03-25T12:00', 60],
    ['2026-03-25T12:15', 30],
    ['2026-03-26T10:00', 120],
    ['2026-03-26T14:20', 25],
    ['2026-03-26T16:50', 40],
    ['2026-03-27T09:00', 480],
    ['2026-03-30T09:45', 30],
    ['2026-03-30T11:00', 45],
    ['2026-03-30T13:30', 60],
    ['2026-03-31T10:00', 30],
    ['2026-03-31T10:30', 30],
    ['2026-03-31T15:00', 90],
    ['2026-04-01T09:15', 15],
    ['2026-04-01T12:45', 30],
    ['2026-04-01T16:00', 60],
    ['2026-04-02T11:30', 60],
    ['2026-04-02T14:00', 30],
    ['2026-04-03T09:00', 30],
    ['2026-04-03T13:10', 50],
    ['2026-04-03T16:15', 75],
  ],
};

// the docs example app with its six cities, its time field scrubbed across tomorrow in 5-minute steps
const planner = {
  cities: ['America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo'],
  times: Array.from({ length: 288 }, (_, step) => {
    const minutes = step * 5;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }),
};

// a team calendar's series for 2026: weekly and fortnightly meetings and month-end and mid-month bills
const recurring = {
  series: [
    ['2026-01-05T09:30', 'week'],
    ['2026-01-06T09:30', 'week'],
    ['2026-01-07T09:30', 'week'],
    ['2026-01-08T09:30', 'week'],
    ['2026-01-09T09:30', 'week'],
    ['2026-01-05T14:00', 'week'],
    ['2026-01-07T16:30', 'week'],
    ['2026-01-09T17:00', 'week'],
    ['2026-01-12T11:00', '2 weeks'],
    ['2026-01-13T15:00', '2 weeks'],
    ['2026-01-20T10:00', '2 weeks'],
    ['2026-01-22T13:30', '2 weeks'],
    ['2026-01-31T08:00', 'month'],
    ['2026-01-30T18:00', 'month'],
    ['2026-01-29T12:00', 'month'],
    ['2026-01-15T09:00', 'month'],
    ['2026-01-01T07:00', 'month'],
    ['2026-01-28T19:00', 'month'],
    ['2026-01-02T23:30', 'week'],
    ['2026-01-04T00:15', 'week'],
  ],
};

/*******************************
              Ops
*******************************/

configure({ zone: app.zone, locale: app.locale });

// purpose: flips through a year of months in a date picker, each a 42-day grid marking weekends, today and a selected week
export function monthGrid12() {
  const selection = date(picker.selection[0]).to(picker.selection[1]);
  const months = [];
  let month = date(picker.firstMonth);
  for (let flip = 0; flip < picker.months; flip++) {
    months.push({
      title: month.format('month'),
      header: weekdayNames('short'),
      cells: month.startOf('week').for(6, 'weeks').every('day').map((day) => ({
        key: day.toString(),
        label: day.day,
        outside: day.month !== month.month,
        weekend: day.isWeekend(),
        today: day.isToday(),
        selected: selection.contains(day),
      })),
    });
    month = month.plus(1, 'month');
  }
  return months;
}

// purpose: lists two weeks of open 30-minute slots on a booking page, dropping any slot an existing booking overlaps
export function freeSlots() {
  const bookings = booking.bookings.map(([start, minutes]) => datetime(start).for(minutes, 'minutes'));
  const days = date(booking.firstDay).for(2, 'weeks').every('day').filter((day) => day.isWeekday());
  return days.flatMap((day) =>
    day.at(booking.opens).to(day.at(booking.closes)).split(30, 'minutes')
      .filter((slot) => !bookings.some((taken) => taken.overlaps(slot)))
      .map((slot) => slot.start.toJSON())
  );
}

// purpose: re-renders the docs meeting planner as its time field is scrubbed across tomorrow, showing six cities' local times
export function meetingPlanner() {
  return planner.times.map((value) => {
    const meeting = tomorrow().at(value);
    return {
      summary: meeting.format('full'),
      rows: planner.cities.map((zone) => {
        const there = meeting.in(zone);
        const sameDay = there.date.equals(meeting.date);
        return [zone, there.format('time'), sameDay ? '' : there.format({ weekday: 'long' })];
      }),
    };
  });
}

// purpose: expands a team's 20 weekly, fortnightly and monthly series across 2026 and both clock changes
export function recurringYear() {
  return recurring.series.flatMap(([start, step]) =>
    datetime(start).for(1, 'year').every(step).map((point) => point.toJSON())
  );
}

/*******************************
        Expected Answers
*******************************/

// the same tasks in plain Temporal and Intl, built when a check runs so they add nothing before an op

const week = () => new Intl.Locale(app.locale).getWeekInfo();
// kept by options and zone, as the planner asks for the same few formatters on every render
const formatters = new Map();
const intl = (options, timeZone = 'UTC') => {
  const key = JSON.stringify([options, timeZone]);
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.DateTimeFormat(app.locale, { ...options, timeZone }));
  }
  return formatters.get(key);
};
const utcOf = (day) => Date.UTC(day.year, day.month - 1, day.day);
const json = (zoned) => zoned.toInstant().toString({ fractionalSecondDigits: 3 });
const wall = (text) => Temporal.PlainDateTime.from(text).toZonedDateTime(app.zone);
const at = (day, clock) =>
  day.toZonedDateTime({ timeZone: app.zone, plainTime: Temporal.PlainTime.from(clock.padStart(5, '0')) });
const before = (a, b) => Temporal.ZonedDateTime.compare(a, b) < 0;
const todayIn = () => Temporal.Instant.from(app.now).toZonedDateTimeISO(app.zone).toPlainDate();
const steps = { week: { weeks: 1 }, '2 weeks': { weeks: 2 }, month: { months: 1 } };

const expected = {
  monthGrid12() {
    const { firstDay, weekend } = week();
    const today = todayIn();
    const [from, to] = picker.selection.map((text) => Temporal.PlainDate.from(text));
    // 2024-01-01 was a Monday, so day n of that week is dayOfWeek n
    const header = Array.from(
      { length: 7 },
      (_, index) => intl({ weekday: 'short' }).format(Date.UTC(2024, 0, ((firstDay - 1 + index) % 7) + 1)),
    );
    return Array.from({ length: picker.months }, (_, flip) => {
      const month = Temporal.PlainDate.from(picker.firstMonth).add({ months: flip });
      const first = month.subtract({ days: (month.dayOfWeek - firstDay + 7) % 7 });
      return {
        title: intl({ month: 'long', year: 'numeric' }).format(utcOf(month)),
        header,
        cells: Array.from({ length: 42 }, (_, index) => {
          const day = first.add({ days: index });
          return {
            key: day.toString(),
            label: day.day,
            outside: day.month !== month.month,
            weekend: weekend.includes(day.dayOfWeek),
            today: day.equals(today),
            selected: Temporal.PlainDate.compare(day, from) >= 0 && Temporal.PlainDate.compare(day, to) <= 0,
          };
        }),
      };
    });
  },

  freeSlots() {
    const { weekend } = week();
    const taken = booking.bookings.map(([start, minutes]) => [wall(start), wall(start).add({ minutes })]);
    const slots = [];
    for (let offset = 0; offset < 14; offset++) {
      const day = Temporal.PlainDate.from(booking.firstDay).add({ days: offset });
      if (weekend.includes(day.dayOfWeek)) {
        continue;
      }
      const close = at(day, booking.closes);
      for (let start = at(day, booking.opens); before(start, close); start = start.add({ minutes: 30 })) {
        const next = start.add({ minutes: 30 });
        const end = before(next, close) ? next : close;
        if (!taken.some(([from, to]) => before(from, end) && before(start, to))) {
          slots.push(json(start));
        }
      }
    }
    return slots;
  },

  meetingPlanner() {
    const day = todayIn().add({ days: 1 });
    return planner.times.map((value) => {
      const meeting = at(day, value);
      return {
        summary: intl({ dateStyle: 'full', timeStyle: 'short' }, app.zone).format(meeting.epochMilliseconds),
        rows: planner.cities.map((city) => {
          const there = meeting.withTimeZone(city);
          const sameDay = there.toPlainDate().equals(meeting.toPlainDate());
          return [
            city,
            intl({ timeStyle: 'short' }, city).format(there.epochMilliseconds),
            sameDay ? '' : intl({ weekday: 'long' }, city).format(there.epochMilliseconds),
          ];
        }),
      };
    });
  },

  // each point steps from the start, so a series on the 31st lands on every month's last day
  recurringYear: () =>
    recurring.series.flatMap(([text, step]) => {
      const start = wall(text);
      const end = start.add({ years: 1 });
      const points = [];
      for (let index = 0;; index++) {
        const [[unit, size]] = Object.entries(steps[step]);
        const point = start.add({ [unit]: size * index });
        if (!before(point, end)) {
          return points;
        }
        points.push(json(point));
      }
    }),
};

/*******************************
             Checks
*******************************/

export const checks = {
  monthGrid12: (months) => checkAnswer('calendar monthGrid12', months, expected.monthGrid12()),
  freeSlots: (slots) => checkAnswer('calendar freeSlots', slots, expected.freeSlots()),
  meetingPlanner: (renders) => checkAnswer('calendar meetingPlanner', renders, expected.meetingPlanner()),
  recurringYear: (points) => checkAnswer('calendar recurringYear', points, expected.recurringYear()),
};
