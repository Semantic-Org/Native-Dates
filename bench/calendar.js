import { configure, date, datetime, tomorrow, weekdayNames } from 'native-dates';

/*
  one calendar app used by a person in Berlin with a German locale: flipping months in a date picker,
  asking for open slots, planning a meeting across zones and expanding recurring series.
  the harness checks each timed run's own answer, so a faster but wrong change fails here
*/

/*******************************
          Fixture Data
*******************************/

// plain data and expected answers only, so the same app can be written against another library

// noon in Berlin on the day US clocks change, so tomorrow is a day US and European clocks are out of step
const app = { zone: 'Europe/Berlin', locale: 'de-DE', now: '2026-03-08T11:00:00Z' };

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

// derived from the same tasks written in plain Temporal and Intl, not from this library
// only ISO strings and plain fields are stored, as locale text can differ between runtimes and is checked against Intl
const expected = {
  monthGrid: { count: 12, digest: 4153331 },
  freeSlots: { count: 97, digest: 124434375 },
  recurringYear: { count: 710, digest: 1331169603 },
};

/*******************************
              Ops
*******************************/

// the library reads the clock only through Date.now(), so holding it keeps today and tomorrow the same every run
const heldNow = Date.parse(app.now);
Date.now = () => heldNow;
configure({ zone: app.zone, locale: app.locale });

const selection = date(picker.selection[0]).to(picker.selection[1]);
const bookings = booking.bookings.map(([start, minutes]) => datetime(start).for(minutes, 'minutes'));
const series = recurring.series.map(([start, step]) => [datetime(start), step]);

// purpose: flip through a year of months in a date picker, each a 42-day grid marking weekends, today and a selected week
export function monthGrid() {
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

// purpose: list two weeks of open 30-minute slots on a booking page, dropping any slot an existing booking overlaps
export function freeSlots() {
  const days = date(booking.firstDay).for(2, 'weeks').every('day').filter((day) => day.isWeekday());
  return days.flatMap((day) =>
    day.at(booking.opens).to(day.at(booking.closes)).split(30, 'minutes')
      .filter((slot) => !bookings.some((taken) => taken.overlaps(slot)))
      .map((slot) => slot.start.toJSON())
  );
}

// purpose: re-render the docs meeting planner as its time field is scrubbed across tomorrow, showing six cities' local times
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

// purpose: expand a team's 20 weekly, fortnightly and monthly series across 2026 and both clock changes
export function recurringYear() {
  return series.flatMap(([start, step]) => start.for(1, 'year').every(step).map((point) => point.toJSON()));
}

/*******************************
             Checks
*******************************/

// count of top-level answers plus a djb2 hash of their JSON, cheap to compare and library neutral
const summarize = (answers) => {
  const text = JSON.stringify(answers);
  let hash = 5381;
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 33 + text.charCodeAt(index)) >>> 0;
  }
  return { count: answers.length, digest: hash };
};

const refuse = (name, got, want) => {
  throw new Error(`calendar bench ${name} answered ${got}, expected ${want}`);
};

const matches = (name, answers, want = expected[name]) => {
  const got = summarize(answers);
  if (got.count !== want.count || got.digest !== want.digest) {
    refuse(name, `${got.count} items (digest ${got.digest})`, `${want.count} items (digest ${want.digest})`);
  }
};

// item by item against answers built at check time, naming the first that differs
const same = (name, answers, wanted) => {
  if (answers.length !== wanted.length) {
    refuse(name, `${answers.length} items`, `${wanted.length}`);
  }
  const [got, want] = [answers, wanted].map((list) => list.map((item) => JSON.stringify(item)));
  const index = got.findIndex((text, position) => text !== want[position]);
  if (index !== -1) {
    refuse(name, `${got[index]} at ${index}`, want[index]);
  }
};

const zoned = (options, timeZone) => new Intl.DateTimeFormat(app.locale, { ...options, timeZone });

// each month's title and weekday header from Intl, starting the week where the locale does
const monthText = (flip) => {
  const month = Temporal.PlainDate.from(picker.firstMonth).add({ months: flip });
  const { firstDay } = new Intl.Locale(app.locale).getWeekInfo();
  // 2024-01-01 was a Monday, so day n of that week is dayOfWeek n
  const weekday = (index) =>
    zoned({ weekday: 'short' }, 'UTC').format(Date.UTC(2024, 0, ((firstDay - 1 + index) % 7) + 1));
  return {
    title: zoned({ month: 'long', year: 'numeric' }, 'UTC').format(Date.UTC(month.year, month.month - 1, 1)),
    header: Array.from({ length: 7 }, (_, index) => weekday(index)),
  };
};

// one planner render in plain Temporal and Intl, matching the docs example's output
const plannerRender = (value) => {
  const day = Temporal.Instant.from(app.now).toZonedDateTimeISO(app.zone).toPlainDate().add({ days: 1 });
  const meeting = day.toZonedDateTime({ timeZone: app.zone, plainTime: Temporal.PlainTime.from(value) });
  return {
    summary: zoned({ dateStyle: 'full', timeStyle: 'short' }, app.zone).format(meeting.epochMilliseconds),
    rows: planner.cities.map((city) => {
      const there = meeting.withTimeZone(city);
      const sameDay = there.toPlainDate().equals(meeting.toPlainDate());
      return [
        city,
        zoned({ timeStyle: 'short' }, city).format(there.epochMilliseconds),
        sameDay ? '' : zoned({ weekday: 'long' }, city).format(there.epochMilliseconds),
      ];
    }),
  };
};

export const checks = {
  monthGrid(months) {
    matches('monthGrid', months.map((month) => month.cells));
    same('monthGrid', months.map(({ title, header }) => ({ title, header })), months.map((_, flip) => monthText(flip)));
  },

  freeSlots(slots) {
    matches('freeSlots', slots);
  },

  meetingPlanner(renders) {
    same('meetingPlanner', renders, planner.times.map(plannerRender));
  },

  recurringYear(points) {
    matches('recurringYear', points);
  },
};
