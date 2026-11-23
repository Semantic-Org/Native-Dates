import { date, datetime } from 'native-dates';

const loadedAt = Date.now();

// 30 locale and zone pairs reserved exclusively for coldLocales600 so its run hits empty Intl and token caches
const coldPairs = [
  ['America/Toronto', 'fr-CA'],
  ['America/Mexico_City', 'es-MX'],
  ['America/Sao_Paulo', 'pt-BR'],
  ['America/Argentina/Buenos_Aires', 'es-AR'],
  ['America/Bogota', 'es-CO'],
  ['Europe/London', 'en-GB'],
  ['Europe/Madrid', 'es-ES'],
  ['Europe/Rome', 'it-IT'],
  ['Europe/Amsterdam', 'nl-NL'],
  ['Europe/Stockholm', 'sv-SE'],
  ['Europe/Warsaw', 'pl-PL'],
  ['Europe/Zurich', 'de-CH'],
  ['Europe/Athens', 'el-GR'],
  ['Europe/Istanbul', 'tr-TR'],
  ['Europe/Moscow', 'ru-RU'],
  ['Africa/Cairo', 'ar-EG'],
  ['Africa/Johannesburg', 'en-ZA'],
  ['Asia/Tokyo', 'ja-JP'],
  ['Asia/Seoul', 'ko-KR'],
  ['Asia/Shanghai', 'zh-CN'],
  ['Asia/Taipei', 'zh-TW'],
  ['Asia/Kolkata', 'hi-IN'],
  ['Asia/Jakarta', 'id-ID'],
  ['Asia/Singapore', 'en-SG'],
  ['Asia/Bangkok', 'th-TH'],
  ['Asia/Tehran', 'fa-IR'],
  ['Australia/Sydney', 'en-AU'],
  ['Pacific/Auckland', 'en-NZ'],
  ['Europe/Lisbon', 'pt-PT'],
  ['Europe/Dublin', 'en-IE'],
];

const coldStamps = Array.from({ length: 20 }, (_, index) => 1_740_000_000_123 + index * 1_234_567_891);

const presetZones = ['UTC', 'America/New_York', 'Europe/Paris'];
const presetLocales = ['en-US', 'de-DE', 'fr-FR', 'es-419'];

const presetInstants = Array.from({ length: 8_000 }, (_, index) =>
  datetime(1_740_000_000_111 + index * 4_321_123, {
    zone: presetZones[index % presetZones.length],
    locale: presetLocales[index % presetLocales.length],
  }));

const presetDays = Array.from(
  { length: 8_000 },
  (_, index) =>
    date('1995-01-01', { locale: presetLocales[index % presetLocales.length] }).plus(
      (index * 3_571) % 12_000,
      'days',
    ),
);

const tokenInstants = Array.from({ length: 18_000 }, (_, index) =>
  datetime(1_735_000_000_222 + index * 2_718_281, {
    zone: index % 3 === 0 ? 'UTC' : index % 3 === 1 ? 'America/New_York' : 'Europe/Berlin',
    locale: index % 4 === 3 ? 'de-DE' : 'en-US',
  }));

// anchor relative fixtures around Date.now() so live fromNow() calls span seconds through years in any calendar year
const relativeInstants = Array.from({ length: 3_000 }, (_, index) => {
  const offsetMs = Math.floor(12_000 * 1.011 ** (index % 1_200)) * (index % 2 === 0 ? -1 : 1) + index * 17;
  return datetime(loadedAt + offsetMs, 'Europe/Berlin');
});
const baseDay = date(new Date(loadedAt).toISOString().slice(0, 10));
const relativeDates = Array.from({ length: 3_000 }, (_, index) => baseDay.plus(((index * 97) % 500) - 250, 'days'));

// pre-warm steady-state format paths without touching any locale or zone in coldPairs
for (let i = 0; i < 256; i++) {
  presetInstants[i].format('medium');
  presetInstants[i].format({ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  presetDays[i].format({ weekday: 'short', day: 'numeric' });
  tokenInstants[i].format('YYYY-MM-DD HH:mm:ss');
  tokenInstants[i].format('dddd, MMMM Do YYYY h:mm A');
  relativeInstants[i].fromNow();
  relativeDates[i].fromNow();
}

export let sink = '';

// purpose: initializes Intl formatters, token name tables, and canonical zones across 30 cold locale-zone pairs
export function coldLocales600() {
  for (let p = 0; p < coldPairs.length; p++) {
    const [zone, locale] = coldPairs[p];
    for (let s = 0; s < coldStamps.length; s++) {
      const point = datetime(coldStamps[s], { zone, locale });
      sink = point.format('long') + point.format('dddd, D MMMM');
    }
  }
}

// purpose: formats 24,000 DateTime presets and inline DateTime/CalendarDate option bags across 4 locales and 3 zones
export function formatPresetsAndBags24k() {
  for (let i = 0; i < presetInstants.length; i++) {
    sink = presetInstants[i].format('medium');
    // write option literals inline at the callsite so per-call cache-key serialization stays on the timed path
    sink = presetInstants[i].format({ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    sink = presetDays[i].format({ weekday: 'short', day: 'numeric' });
  }
}

// purpose: formats 36,000 distinct ASCII and localized word/ordinal token patterns across 3 zones and 2 locales
export function formatToken36k() {
  for (let i = 0; i < tokenInstants.length; i++) {
    const point = tokenInstants[i];
    sink = point.format('YYYY-MM-DD HH:mm:ss');
    sink = point.format('dddd, MMMM Do YYYY h:mm A');
  }
}

// purpose: formats 6,000 live DateTime.fromNow() and CalendarDate.fromNow() phrases across seconds through months
export function formatRelativeNow6k() {
  for (let i = 0; i < relativeInstants.length; i++) {
    sink = relativeInstants[i].fromNow();
    sink = relativeDates[i].fromNow();
  }
}
