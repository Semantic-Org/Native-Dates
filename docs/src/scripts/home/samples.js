// components/home/Xray.astro runs ours, temporal, and legacy in sequence and fails the build if results differ.
// Keep line lengths within the first sample's width so narrow panels do not overflow (styles/home.css)
const SAMPLE_ZONES = {
  en: ['America/Los_Angeles', 'Los Angeles', 'Europe/Berlin'],
  ja: ['Asia/Tokyo', 'Tokyo', 'Australia/Sydney'],
  'zh-CN': ['Asia/Shanghai', 'Shanghai', 'Australia/Sydney'],
  ko: ['Asia/Seoul', 'Seoul', 'Australia/Sydney'],
  ar: ['Africa/Cairo', 'Cairo', 'Asia/Dubai'],
  ru: ['Europe/Moscow', 'Moscow', 'Asia/Tokyo'],
  es: ['America/Mexico_City', 'Mexico City', 'Europe/Madrid'],
  'pt-BR': ['America/Sao_Paulo', 'São Paulo', 'Europe/Lisbon'],
  fr: ['Europe/Paris', 'Paris', 'Asia/Tokyo'],
};

export function samplesFor(locale = 'en') {
  const [homeZone, homeCity, inviteZone] = SAMPLE_ZONES[locale] ?? SAMPLE_ZONES.en;
  return [
    {
      id: 'meeting',
      ours: `const meeting = today().next('monday').at('9:30am', '${homeZone}');`,
      temporal: `const today = Temporal.Now.plainDateISO();
// the next Monday after today
const ahead = (8 - today.dayOfWeek) % 7 || 7;
const meeting = today.add({ days: ahead }).toZonedDateTime({
  timeZone: '${homeZone}',
  plainTime: '09:30',
});`,
      legacy: `const today = new Date();
// the next Monday after today
const ahead = (8 - today.getDay()) % 7 || 7;
const day = today.getDate() + ahead;
// Date has no time zones: take 9:30 as UTC, format in ${homeCity},
// and shift by the offset difference
const utc = Date.UTC(today.getFullYear(), today.getMonth(), day, 9, 30);
const zone = { timeZone: '${homeZone}' };
// the swedish locale prints dates the way Date.parse reads them
const there = new Date(utc).toLocaleString('sv-SE', zone);
const offset = utc - Date.parse(there.replace(' ', 'T') + 'Z');
const meeting = new Date(utc + offset);`,
    },
    {
      id: 'invite',
      ours: `const invite = meeting.in('${inviteZone}').format('full');`,
      temporal: `const invite = meeting
  .withTimeZone('${inviteZone}')
  .toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });`,
      legacy: `const invite = meeting.toLocaleString(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: '${inviteZone}',
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
      ours: "const wait = now().until(meeting).round('minute').format();",
      temporal: `// Temporal.until() throws across time zones when largestUnit >= 'day'
const here = Temporal.Now.zonedDateTimeISO();
const until = here.until(meeting.withTimeZone(here.timeZoneId), {
  largestUnit: 'year',
  smallestUnit: 'minute',
  roundingMode: 'halfExpand',
});
const wait = until.toLocaleString(undefined, { style: 'long' });`,
      legacy: `// round to the minute, then step day-by-day across any DST transition
const minutes = Math.round((meeting - Date.now()) / 60_000);
const from = new Date(meeting - minutes * 60_000);
const after = (days) => new Date(from).setDate(from.getDate() + days);
let days = 0;
while (after(days + 1) <= meeting) { days++; }
const rest = (meeting - after(days)) / 60_000;
const hours = Math.floor(rest / 60);
const words = new Intl.DurationFormat(undefined, { style: 'long' });
const wait = words.format({ days, hours, minutes: rest % 60 });`,
    },
  ];
}

export const SAMPLES = samplesFor('en');
