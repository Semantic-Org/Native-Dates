// the four kinds of value, as two sums: a date and a time in a zone make a moment, and from one
// moment until another is a length of time. `wraps` is the Temporal type under each, which the
// build checks against the value itself (components/home/Nouns.astro). the terms are read from the
// library at build for the page as shipped, and again in the browser, where they keep time

export const NOUNS = {
  date: { name: 'CalendarDate', wraps: 'Temporal.PlainDate', code: 'today()' },
  time: { name: 'Time', wraps: 'Temporal.PlainTime', code: 'now().time' },
  datetime: { name: 'DateTime', wraps: 'Temporal.ZonedDateTime', code: 'now()' },
  duration: { name: 'Duration', wraps: 'Temporal.Duration', code: 'now().until(newYear)' },
};

// this moment, taken apart and measured: its date, its time, its zone, itself, the first moment of
// next year, and how long until then
export function read({ date, now }) {
  const moment = now();
  const newYear = date(moment.year + 1, 1, 1).at('00:00');
  return {
    date: moment.date,
    time: moment.time,
    zone: moment.zone,
    datetime: moment,
    newYear,
    duration: moment.until(newYear).round('second'),
  };
}

// what each term shows
export function texts(library) {
  const terms = read(library);
  return {
    date: terms.date.text,
    time: terms.time.text,
    zone: terms.zone,
    datetime: terms.datetime.text,
    newYear: terms.newYear.text,
    duration: terms.duration.text,
    newYearCode: `date(${terms.newYear.year}, 1, 1).at('00:00')`,
  };
}

// in the browser the terms keep time: read again each second, written only where they changed
export function mountNouns(root, library) {
  const tick = () => {
    for (const [term, text] of Object.entries(texts(library))) {
      const el = root.querySelector(`[data-term="${term}"]`);
      if (el && el.textContent !== text) { el.textContent = text; }
    }
  };
  tick();
  setInterval(tick, 1000);
}
