import { date, datetime } from 'native-dates';

// 30 locale and zone pairs reserved exclusively for coldLocales so its first run hits empty Intl and token caches
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

const coldStamps = Array.from({ length: 20 }, (_, index) => 1_740_000_000_000 + index * 1_234_567_000);

const presetZones = ['UTC', 'America/New_York', 'Europe/Paris'];
const presetLocales = ['en-US', 'de-DE', 'fr-FR', 'es-419'];
const customBag = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

const presetInstants = Array.from({ length: 1_200 }, (_, index) =>
  datetime(1_740_000_000_000 + index * 5_432_000, {
    zone: presetZones[index % presetZones.length],
    locale: presetLocales[index % presetLocales.length],
  }));

const tokenInstants = Array.from({ length: 2_000 }, (_, index) =>
  datetime(1_740_000_000_000 + index * 3_723_000, {
    zone: index % 2 === 0 ? 'UTC' : 'America/New_York',
    locale: index % 4 === 3 ? 'de-DE' : 'en-US',
  }));

const anchorTime = datetime('2026-11-23T12:00:00Z');
const anchorDate = date('2026-11-23');
const relativeInstants = Array.from({ length: 1_000 }, (_, index) => {
  const offsetMs = Math.floor(15_000 * 1.018 ** (index % 600)) * (index % 2 === 0 ? -1 : 1);
  return datetime(anchorTime.epochMilliseconds + offsetMs);
});
const relativeDates = Array.from({ length: 1_000 }, (_, index) => anchorDate.plus((index % 400) - 200, 'days'));

// pre-warm steady-state format paths without touching any locale or zone in coldPairs
for (let i = 0; i < 512; i++) {
  const sample = presetInstants[i % presetInstants.length];
  sample.format('medium');
  void sample.text;
  sample.format(customBag);
  tokenInstants[i % tokenInstants.length].format('YYYY-MM-DD HH:mm:ss');
  tokenInstants[i % tokenInstants.length].format('dddd, MMMM Do YYYY h:mm A');
  relativeInstants[i % relativeInstants.length].from(anchorTime);
  relativeDates[i % relativeDates.length].from(anchorDate);
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

// purpose: formats 60,000 DateTime presets, .text getters, and custom Intl option bags across 4 locales and 3 zones
export function formatIntlPreset60k() {
  for (let i = 0; i < 20_000; i++) {
    const point = presetInstants[i % presetInstants.length];
    sink = point.format('medium');
    sink = point.text;
    sink = point.format(customBag);
  }
}

// purpose: formats 36,000 ASCII and localized word/ordinal token patterns (YYYY-MM-DD HH:mm:ss and dddd, MMMM Do)
export function formatToken36k() {
  for (let i = 0; i < 18_000; i++) {
    const point = tokenInstants[i % tokenInstants.length];
    sink = point.format('YYYY-MM-DD HH:mm:ss');
    sink = point.format('dddd, MMMM Do YYYY h:mm A');
  }
}

// purpose: formats 4,000 relative time and calendar phrases across seconds, hours, days, months, and years
export function formatRelative4k() {
  for (let i = 0; i < 2_000; i++) {
    sink = relativeInstants[i % relativeInstants.length].from(anchorTime);
    sink = relativeDates[i % relativeDates.length].from(anchorDate);
  }
}
