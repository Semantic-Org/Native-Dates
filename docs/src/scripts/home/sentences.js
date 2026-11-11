// the hero's sentences. each is a chain, and each link is one thought: `say` names its words
// (home.say.<say> in content/strings.json), `code` is the call, and `run` takes the value so far to
// the next, given the library. a link with several options is one a reader can turn through.
// the build runs these for the page it ships, and the browser runs them again for the reader's own
// day and zone, so both read from this one list

const at = (clock, zone) => ({ code: `.at('${clock}', '${zone}')`, run: (value) => value.at(clock, zone) });
const into = (zone) => ({ code: `.in('${zone}')`, run: (value) => value.in(zone) });
const next = (weekday) => ({ say: `next.${weekday}`, code: `.next('${weekday}')`, run: (value) => value.next(weekday) });
const plus = (count, unit) => ({ say: `plus.${count}.${unit}`, code: `.plus(${count}, '${unit}')`, run: (value) => value.plus(count, unit) });
const endOf = (unit) => ({ say: `endOf.${unit}`, code: `.endOf('${unit}')`, run: (value) => value.endOf(unit) });
const format = (preset) => ({ say: `format.${preset}`, code: `.format('${preset}')`, run: (value) => value.format(preset) });

export const SENTENCES = [
  {
    id: 'meeting',
    steps: [
      [{ say: 'today', code: 'today()', run: (_, { today }) => today() }],
      [next('monday'), next('wednesday'), next('friday'), next('sunday')],
      [
        { say: 'at.losAngeles', ...at('9:30am', 'America/Los_Angeles') },
        { say: 'at.newYork', ...at('2pm', 'America/New_York') },
        { say: 'at.london', ...at('8am', 'Europe/London') },
        { say: 'at.tokyo', ...at('6:45pm', 'Asia/Tokyo') },
      ],
      [
        { say: 'in.berlin', ...into('Europe/Berlin') },
        { say: 'in.kolkata', ...into('Asia/Kolkata') },
        { say: 'in.sydney', ...into('Australia/Sydney') },
        { say: 'in.saoPaulo', ...into('America/Sao_Paulo') },
      ],
    ],
  },
  {
    id: 'due',
    steps: [
      [{ say: 'today', code: 'today()', run: (_, { today }) => today() }],
      [plus(1, 'month'), plus(2, 'weeks'), plus(90, 'days'), plus(1, 'year')],
      [endOf('month'), endOf('week'), endOf('quarter'), endOf('year')],
      [format('full'), format('long'), format('short')],
    ],
  },
  {
    id: 'length',
    steps: [
      [
        { say: 'duration.90m', code: "duration('1h 30m')", run: (_, { duration }) => duration('1h 30m') },
        { say: 'duration.45m', code: "duration('45 minutes')", run: (_, { duration }) => duration('45 minutes') },
        { say: 'duration.2d6h', code: "duration('2 days and 6 hours')", run: (_, { duration }) => duration('2 days and 6 hours') },
      ],
      [plus(45, 'minutes'), plus(3, 'hours'), plus(1, 'day')],
      [
        { say: 'times.2', code: '.times(2)', run: (value) => value.times(2) },
        { say: 'times.3', code: '.times(3)', run: (value) => value.times(3) },
      ],
      [format('narrow'), format('short'), format('digital')],
    ],
  },
];

// what a value is, as the class a developer would name, and how it reads. a string is itself
const NOUN = { datetime: 'DateTime', date: 'CalendarDate', time: 'Time', duration: 'Duration' };
export const describe = (value, { kindOf }) =>
  typeof value === 'string' ? { noun: 'string', text: `'${value}'` } : { noun: NOUN[kindOf(value)], text: value.text };

// a sentence with one option picked per link: what each link is, in order
export function read(sentence, picks, library) {
  let value;
  return sentence.steps.map((options, i) => {
    value = options[picks[i] ?? 0].run(value, library);
    return describe(value, library);
  });
}
