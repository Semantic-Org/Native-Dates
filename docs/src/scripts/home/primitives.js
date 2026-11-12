// the primitives ribbon: what Temporal ships, and the shortest call that hands you each one.
// `ours` and `temporal` are the same value written both ways, as text. the build runs both and
// stops if they differ (components/home/Primitives.astro). `built` is the Temporal type underneath,
// and `plugin` names the plugin a row needs, while it needs one. Temporal has no type for a span, so
// that row's Temporal side is the two values it is made of, a line each.
// `legacy` is how the same thing was kept before Temporal, in whatever would hold it, and `stored`
// is what that was. the build checks it holds the same thing too

export const PRIMITIVES = [
  {
    id: 'date',
    built: 'Temporal.PlainDate',
    ours: "date('2026-11-16')",
    temporal: "Temporal.PlainDate.from('2026-11-16')",
    legacy: 'new Date(2026, 10, 16) // month 10 is November',
    stored: 'Date',
  },
  {
    id: 'time',
    built: 'Temporal.PlainTime',
    ours: "time('9:30am')",
    temporal: "Temporal.PlainTime.from('09:30')",
    legacy: '570 // minutes since midnight',
    stored: 'number',
  },
  {
    id: 'datetime',
    built: 'Temporal.ZonedDateTime',
    ours: "datetime('2026-11-16T09:30', 'America/Los_Angeles')",
    temporal: "Temporal.ZonedDateTime.from('2026-11-16T09:30[America/Los_Angeles]')",
    legacy: "{ at: new Date('2026-11-16T17:30Z'), zone: 'America/Los_Angeles' }",
    stored: 'Date + string',
  },
  {
    id: 'duration',
    built: 'Temporal.Duration',
    ours: "duration('1h 30m')",
    temporal: 'Temporal.Duration.from({ hours: 1, minutes: 30 })',
    legacy: '90 * 60 * 1000 // milliseconds',
    stored: 'number',
  },
  { id: 'now', built: 'Temporal.Now', ours: 'now()', temporal: 'Temporal.Now.zonedDateTimeISO()', legacy: 'new Date()', stored: 'Date' },
  {
    id: 'yearMonth',
    built: 'Temporal.PlainYearMonth',
    plugin: 'year-month',
    ours: "yearMonth('2026-11')",
    temporal: "Temporal.PlainYearMonth.from('2026-11')",
    legacy: 'new Date(2026, 10, 1) // fake 1st, month 10',
    stored: 'Date',
  },
  {
    id: 'monthDay',
    built: 'Temporal.PlainMonthDay',
    plugin: 'month-day',
    ours: "monthDay('10/17')",
    temporal: 'Temporal.PlainMonthDay.from({ month: 10, day: 17 })',
    legacy: 'new Date(2000, 9, 17) // fake leap year',
    stored: 'Date',
  },
  {
    id: 'range',
    built: '2 × Temporal.PlainDate',
    plugin: 'ranges',
    ours: "date('2026-09-01').to(2, 'weeks')",
    temporal: "Temporal.PlainDate.from('2026-09-01')\nTemporal.PlainDate.from('2026-09-14')",
    legacy: '[new Date(2026, 8, 1), new Date(2026, 8, 14)] // 8 is September',
    stored: '2 × Date',
  },
];

// the switch: every row's call in native-dates, on Temporal alone, or as it was kept before either
export function mountPrimitives(root) {
  const buttons = [...root.querySelectorAll('[data-prims]')];
  const set = (mode) => {
    buttons.forEach((button) => {
      const on = button.dataset.prims === mode;
      button.setAttribute('aria-checked', on);
      button.tabIndex = on ? 0 : -1;
    });
    // a row's call, and the label that goes with that way of writing it
    root.querySelectorAll('[data-prim]').forEach((code) => {
      code.hidden = code.dataset.prim !== mode;
    });
    root.dataset.mode = mode;
  };
  buttons.forEach((button) => button.addEventListener('click', () => set(button.dataset.prims)));
  root.querySelector('[role=radiogroup]').addEventListener('keydown', (event) => {
    const by = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!by) { return; }
    event.preventDefault();
    const next = buttons[(buttons.findIndex((button) => button.getAttribute('aria-checked') === 'true') + by + buttons.length) % buttons.length];
    next.focus();
    set(next.dataset.prims);
  });
}
