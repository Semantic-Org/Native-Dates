// the two consoles: four questions, each asked of Date and of native-dates. `lines` is what is
// typed, and `run` is those same lines as code, so what a console prints is what the reader's own
// browser answers (the build prints its own answers first, for the page as shipped).
// a Date answer names New York where the day depends on the zone, so it is the same answer anywhere

export const CASES = [
  {
    id: 'day',
    date: {
      lines: ["const day = new Date('2026-09-01');", "day.toLocaleDateString('en-US', { timeZone: 'America/New_York' });"],
      run: () => new Date('2026-09-01').toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
    },
    native: { lines: ["date('2026-09-01');"], run: ({ date }) => date('2026-09-01') },
  },
  {
    id: 'month',
    date: {
      lines: ['const end = new Date(2026, 0, 31);', 'end.setMonth(1);', 'end.toDateString();'],
      run: () => {
        const end = new Date(2026, 0, 31);
        end.setMonth(1);
        return end.toDateString();
      },
    },
    native: { lines: ["date('2026-01-31').plus(1, 'month');"], run: ({ date }) => date('2026-01-31').plus(1, 'month') },
  },
  {
    id: 'clocks',
    date: {
      lines: [
        "const nine = new Date('2026-03-07T09:00-05:00');",
        'const next = new Date(nine.getTime() + 24 * 60 * 60 * 1000);',
        "next.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });",
      ],
      run: () => {
        const nine = new Date('2026-03-07T09:00-05:00');
        const next = new Date(nine.getTime() + 24 * 60 * 60 * 1000);
        return next.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
      },
    },
    native: {
      lines: ["datetime('2026-03-07T09:00', 'America/New_York').plus(1, 'day');"],
      run: ({ datetime }) => datetime('2026-03-07T09:00', 'America/New_York').plus(1, 'day'),
    },
  },
  {
    id: 'start',
    date: {
      lines: ['const start = new Date(2026, 8, 1);', 'const due = start;', 'due.setDate(31);', 'start.toDateString();'],
      run: () => {
        const start = new Date(2026, 8, 1);
        const due = start;
        due.setDate(31);
        return start.toDateString();
      },
    },
    native: {
      lines: ["const start = date('2026-09-01');", "const due = start.plus(30, 'days');", 'start;'],
      run: ({ date }) => {
        const start = date('2026-09-01');
        start.plus(30, 'days');
        return start;
      },
    },
  },
];

const NOUN = { datetime: 'DateTime', date: 'CalendarDate', time: 'Time', duration: 'Duration' };
const literal = (value) => (typeof value === 'string' ? `'${value}'` : String(value));

// a value as a browser's console previews it: a string in quotes, an object as its class and its
// first five own properties, in the order it holds them
export function preview(value, { kindOf }) {
  if (typeof value === 'string') { return literal(value); }
  const keys = Object.keys(value);
  const shown = keys.slice(0, 5).map((key) => `${key}: ${literal(value[key])}`).join(', ');
  return `${NOUN[kindOf(value)]} {${shown}${keys.length > 5 ? ', …' : ''}}`;
}
