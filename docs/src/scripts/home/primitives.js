// the primitives ribbon: what Temporal ships, and the shortest call that hands you each one.
// `ours` and `temporal` are the same value written both ways, as text. the build runs both and
// stops if they differ (components/home/Primitives.astro). `built` is the Temporal type underneath,
// and `plugin` names the plugin a row needs, while it needs one. Temporal has no type for a span, so
// that row's Temporal side is the two values it is made of, a line each

export const PRIMITIVES = [
  { id: 'date', built: 'Temporal.PlainDate', ours: "date('2026-11-16')", temporal: "Temporal.PlainDate.from('2026-11-16')" },
  { id: 'time', built: 'Temporal.PlainTime', ours: "time('9:30am')", temporal: "Temporal.PlainTime.from('09:30')" },
  {
    id: 'datetime',
    built: 'Temporal.ZonedDateTime',
    ours: "datetime('2026-11-16T09:30', 'America/Los_Angeles')",
    temporal: "Temporal.ZonedDateTime.from('2026-11-16T09:30[America/Los_Angeles]')",
  },
  { id: 'duration', built: 'Temporal.Duration', ours: "duration('1h 30m')", temporal: 'Temporal.Duration.from({ hours: 1, minutes: 30 })' },
  { id: 'now', built: 'Temporal.Now', ours: 'now()', temporal: 'Temporal.Now.zonedDateTimeISO()' },
  {
    id: 'range',
    built: '2 × Temporal.PlainDate',
    plugin: 'ranges',
    ours: "date('2026-09-01').to(2, 'weeks')",
    temporal: "Temporal.PlainDate.from('2026-09-01')\nTemporal.PlainDate.from('2026-09-14')",
  },
];

// the switch: every row's call, in native-dates or on Temporal alone
export function mountPrimitives(root) {
  const buttons = [...root.querySelectorAll('[data-prims]')];
  const set = (mode) => {
    buttons.forEach((button) => button.setAttribute('aria-checked', button.dataset.prims === mode));
    root.querySelectorAll('[data-prim]').forEach((code) => {
      code.hidden = code.dataset.prim !== mode;
    });
    root.dataset.mode = mode;
  };
  buttons.forEach((button) => button.addEventListener('click', () => set(button.dataset.prims)));
  root.querySelector('[role=radiogroup]').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) { return; }
    event.preventDefault();
    const other = buttons.find((button) => button.getAttribute('aria-checked') !== 'true');
    other.focus();
    set(other.dataset.prims);
  });
}
