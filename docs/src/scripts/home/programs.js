// the x-ray's two programs: one app's dates in native-dates, and the same dates on Temporal alone.
// they are text, shown as written, and the build runs both and refuses to ship a page where their
// results differ (components/home/Xray.astro). a line starting with !! is one the facts point at

export const RESULTS = ['invite', 'notice', 'wait'];

export const WITH_LIBRARY = `import { now, today } from 'native-dates';

!!const standup = today().next('monday').at('9:30am', 'America/Los_Angeles');
!!const invite = standup.in('Europe/Berlin').format('full');

!!const due = today().plus(1, 'month').endOf('month');
const notice = due.format('long');

!!const wait = now().until(standup).round('minute').format();`;

export const ON_TEMPORAL = `const today = Temporal.Now.plainDateISO();

// the next monday strictly after today
const ahead = (8 - today.dayOfWeek) % 7 || 7;
const standup = today.add({ days: ahead }).toZonedDateTime({
  timeZone: 'America/Los_Angeles',
  plainTime: Temporal.PlainTime.from('09:30'),
});
const invite = standup.withTimeZone('Europe/Berlin').toLocaleString(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
});

const nextMonth = today.add({ months: 1 });
const due = nextMonth.with({ day: nextMonth.daysInMonth });
const notice = due.toLocaleString(undefined, { dateStyle: 'long' });

// until() refuses two zones once days are involved, so both sides read in this one
const here = Temporal.Now.zonedDateTimeISO();
const until = here.until(standup.withTimeZone(here.timeZoneId), {
  largestUnit: 'year',
  smallestUnit: 'minute',
  roundingMode: 'halfExpand',
});
const wait = new Intl.DurationFormat(undefined, { style: 'long' }).format(until);`;

// a program's results: its text as a function body, with the library's exports in scope where it
// imports them
export function run(program, library = {}) {
  const body = program.replace(/^!!/gm, '').replace(/^import \{([^}]+)\} from 'native-dates';$/m, 'const {$1} = library;');
  return new Function('library', `${body}\nreturn { ${RESULTS.join(', ')} };`)(library);
}
