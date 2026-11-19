// pin each locale to an explicit offset or IANA zone so the Date bug reproduces in any system timezone
const ZONES = {
  ja: { eastOffset: '+09:00', dstStamp: '2026-03-28T09:00+00:00', dstPlain: '2026-03-28T09:00', dstZone: 'Europe/London' },
  'zh-CN': { eastOffset: '+08:00', dstStamp: '2026-03-28T09:00+00:00', dstPlain: '2026-03-28T09:00', dstZone: 'Europe/London' },
  ko: { eastOffset: '+09:00', dstStamp: '2026-03-28T09:00+00:00', dstPlain: '2026-03-28T09:00', dstZone: 'Europe/London' },
  ru: { eastOffset: '+03:00', dstStamp: '2026-03-28T09:00+00:00', dstPlain: '2026-03-28T09:00', dstZone: 'Europe/London' },
  fr: { eastOffset: '+02:00', dstStamp: '2026-03-28T09:00+01:00', dstPlain: '2026-03-28T09:00', dstZone: 'Europe/Paris' },
  ar: { eastOffset: '+03:00', dstStamp: '2026-04-23T09:00+02:00', dstPlain: '2026-04-23T09:00', dstZone: 'Africa/Cairo' },
  es: { westZone: 'America/Mexico_City', dstStamp: '2026-03-28T09:00+01:00', dstPlain: '2026-03-28T09:00', dstZone: 'Europe/Madrid' },
  'pt-BR': { westZone: 'America/Sao_Paulo', dstStamp: '2026-03-28T09:00+00:00', dstPlain: '2026-03-28T09:00', dstZone: 'Europe/Lisbon' },
};

export function consolesFor(locale = 'en') {
  const local = ZONES[locale];
  const tag = locale === 'ar' ? 'ar-EG' : local ? locale : 'en-US';
  const localize = (value) => (local ? value.locale(tag) : value);
  const westZone = local?.westZone ?? 'America/New_York';
  const dstStamp = local?.dstStamp ?? '2026-03-07T09:00-05:00';
  const dstPlain = local?.dstPlain ?? '2026-03-07T09:00';
  const dstZone = local?.dstZone ?? 'America/New_York';

  const dayCase = local?.eastOffset
    ? {
      id: 'day',
      date: {
        lines: [`const day = new Date('2026-09-01T00:00${local.eastOffset}');`, 'day.toISOString().slice(0, 10);'],
        run: () => new Date(`2026-09-01T00:00${local.eastOffset}`).toISOString().slice(0, 10),
      },
      native: { lines: ["date('2026-09-01');"], run: ({ date }) => localize(date('2026-09-01')) },
    }
    : {
      id: 'day',
      date: {
        lines: ["const day = new Date('2026-09-01');", `day.toLocaleDateString('${tag}', { timeZone: '${westZone}' });`],
        run: () => new Date('2026-09-01').toLocaleDateString(tag, { timeZone: westZone }),
      },
      native: { lines: ["date('2026-09-01');"], run: ({ date }) => localize(date('2026-09-01')) },
    };

  return [
    dayCase,
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
      native: { lines: ["date('2026-01-31').plus(1, 'month');"], run: ({ date }) => localize(date('2026-01-31').plus(1, 'month')) },
    },
    {
      id: 'clocks',
      date: {
        lines: [
          `const nine = new Date('${dstStamp}');`,
          'const next = new Date(nine.getTime() + 24 * 60 * 60 * 1000);',
          `next.toLocaleTimeString('${tag}', { timeZone: '${dstZone}' });`,
        ],
        run: () => {
          const nine = new Date(dstStamp);
          const next = new Date(nine.getTime() + 24 * 60 * 60 * 1000);
          return next.toLocaleTimeString(tag, { timeZone: dstZone });
        },
      },
      native: {
        lines: [`datetime('${dstPlain}', '${dstZone}').plus(1, 'day');`],
        run: ({ datetime }) => localize(datetime(dstPlain, dstZone).plus(1, 'day')),
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
          const start = localize(date('2026-09-01'));
          start.plus(30, 'days');
          return start;
        },
      },
    },
  ];
}

export const CASES = consolesFor('en');

const NOUN = { datetime: 'DateTime', date: 'CalendarDate', time: 'Time', duration: 'Duration' };
const literal = (value) => (typeof value === 'string' ? `'${value}'` : String(value));

// mimic DevTools object preview so own-property order leads with text
export function preview(value, { kindOf }) {
  if (typeof value === 'string') { return literal(value); }
  const keys = Object.keys(value);
  const shown = keys.slice(0, 5).map((key) => `${key}: ${literal(value[key])}`).join(', ');
  return `${NOUN[kindOf(value)]} {${shown}${keys.length > 5 ? ', …' : ''}}`;
}
