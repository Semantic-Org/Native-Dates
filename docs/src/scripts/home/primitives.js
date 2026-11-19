const DATETIME_ZONES = {
  en: ['America/Los_Angeles', '2026-11-16T17:30Z'],
  ja: ['Asia/Tokyo', '2026-11-16T00:30Z'],
  'zh-CN': ['Asia/Shanghai', '2026-11-16T01:30Z'],
  ko: ['Asia/Seoul', '2026-11-16T00:30Z'],
  ar: ['Africa/Cairo', '2026-11-16T07:30Z'],
  ru: ['Europe/Moscow', '2026-11-16T06:30Z'],
  es: ['America/Mexico_City', '2026-11-16T15:30Z'],
  'pt-BR': ['America/Sao_Paulo', '2026-11-16T12:30Z'],
  fr: ['Europe/Paris', '2026-11-16T08:30Z'],
};

// components/home/Primitives.astro runs ours, temporal, and legacy at build time and fails if they disagree
export function primitivesFor(locale = 'en') {
  const [zone, utc] = DATETIME_ZONES[locale] ?? DATETIME_ZONES.en;
  return [
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
      ours: `datetime('2026-11-16T09:30', '${zone}')`,
      temporal: `Temporal.ZonedDateTime.from('2026-11-16T09:30[${zone}]')`,
      legacy: `{ at: new Date('${utc}'), zone: '${zone}' }`,
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
      ours: "yearMonth('2026-11')",
      temporal: "Temporal.PlainYearMonth.from('2026-11')",
      legacy: 'new Date(2026, 10, 1) // fake 1st, month 10',
      stored: 'Date',
    },
    {
      id: 'monthDay',
      built: 'Temporal.PlainMonthDay',
      ours: "monthDay('10/17')",
      temporal: 'Temporal.PlainMonthDay.from({ month: 10, day: 17 })',
      legacy: 'new Date(2000, 9, 17) // fake leap year',
      stored: 'Date',
    },
    {
      id: 'range',
      built: '2 × Temporal.PlainDate',
      ours: "date('2026-09-01').for(2, 'weeks')",
      temporal: "Temporal.PlainDate.from('2026-09-01')\nTemporal.PlainDate.from('2026-09-14')",
      legacy: '[new Date(2026, 8, 1), new Date(2026, 8, 14)] // 8 is September',
      stored: '2 × Date',
    },
  ];
}

export const PRIMITIVES = primitivesFor('en');

export function mountPrimitives(root) {
  const buttons = [...root.querySelectorAll('[data-prims]')];
  const set = (mode) => {
    buttons.forEach((button) => {
      const on = button.dataset.prims === mode;
      button.setAttribute('aria-checked', on);
      button.tabIndex = on ? 0 : -1;
    });
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
