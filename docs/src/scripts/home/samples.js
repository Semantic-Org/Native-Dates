// the x-ray's four samples: one common operation each, written in native-dates (`ours`), on
// Temporal alone (`temporal`) and on Date as it was done before either (`legacy`). they are text,
// shown as written. a sample is named for the value every way of writing it makes, and a later
// sample can use what an earlier one made. the build runs them each way and refuses to ship a page
// where a sample's values differ (components/home/Xray.astro). no line runs past the first
// sample's in native-dates, which sets how narrow a sample's panel can be (styles/home.css)

export const SAMPLES = [
  {
    id: 'standup',
    ours: "const standup = today().next('monday').at('9:30am', 'America/Los_Angeles');",
    temporal: `const today = Temporal.Now.plainDateISO();
// the next monday strictly after today
const ahead = (8 - today.dayOfWeek) % 7 || 7;
const standup = today.add({ days: ahead }).toZonedDateTime({
  timeZone: 'America/Los_Angeles',
  plainTime: '09:30',
});`,
    legacy: `const today = new Date();
// the next monday strictly after today
const ahead = (8 - today.getDay()) % 7 || 7;
const day = today.getDate() + ahead;
// Date has no time zones: take 9:30 as UTC, format in Los Angeles,
// and shift by the offset difference
const utc = Date.UTC(today.getFullYear(), today.getMonth(), day, 9, 30);
const zone = { timeZone: 'America/Los_Angeles' };
// the swedish locale prints dates the way Date.parse reads them
const there = new Date(utc).toLocaleString('sv-SE', zone);
const offset = utc - Date.parse(there.replace(' ', 'T') + 'Z');
const standup = new Date(utc + offset);`,
  },
  {
    id: 'invite',
    ours: "const invite = standup.in('Europe/Berlin').format('full');",
    temporal: `const invite = standup
  .withTimeZone('Europe/Berlin')
  .toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });`,
    legacy: `const invite = standup.toLocaleString(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'Europe/Berlin',
});`,
  },
  {
    id: 'due',
    ours: "const due = today().plus(1, 'month').endOf('month');",
    temporal: `const nextMonth = Temporal.Now.plainDateISO().add({ months: 1 });
const due = nextMonth.with({ day: nextMonth.daysInMonth });`,
    legacy: `const today = new Date();
// day 0 of a month is the last day of the month before it
const due = new Date(today.getFullYear(), today.getMonth() + 2, 0);`,
  },
  {
    id: 'wait',
    ours: "const wait = now().until(standup).round('minute').format();",
    temporal: `// Temporal.until() throws across time zones when largestUnit >= 'day'
const here = Temporal.Now.zonedDateTimeISO();
const until = here.until(standup.withTimeZone(here.timeZoneId), {
  largestUnit: 'year',
  smallestUnit: 'minute',
  roundingMode: 'halfExpand',
});
const wait = until.toLocaleString(undefined, { style: 'long' });`,
    legacy: `// round to the minute, then step day-by-day across any DST transition
const minutes = Math.round((standup - Date.now()) / 60_000);
const from = new Date(standup - minutes * 60_000);
const after = (days) => new Date(from).setDate(from.getDate() + days);
let days = 0;
while (after(days + 1) <= standup) { days++; }
const rest = (standup - after(days)) / 60_000;
const hours = Math.floor(rest / 60);
const words = new Intl.DurationFormat(undefined, { style: 'long' });
const wait = words.format({ days, hours, minutes: rest % 60 });`,
  },
];
