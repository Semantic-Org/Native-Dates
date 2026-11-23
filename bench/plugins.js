import '@native-dates/plugins/legacy-date';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

const pad = (value) => String(value).padStart(2, '0');
const regions = new Set([
  'Africa',
  'America',
  'Antarctica',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific',
]);

// build ~450 un-warmed city names, aliases, and locale-disambiguated abbreviations so resolveColdZones misses cache
const coldZoneInputs = [
  ...Intl.supportedValuesOf('timeZone')
    .filter((id) => regions.has(id.split('/')[0]))
    .map((id) => [id.split('/').pop().replace(/_/g, ' '), 'en-US']),
  ['nyc', 'en-US'],
  ['san francisco', 'en-US'],
  ['seattle', 'en-US'],
  ['boston', 'en-US'],
  ['miami', 'en-US'],
  ['cdmx', 'es-MX'],
  ['rio', 'pt-BR'],
  ['munich', 'de-DE'],
  ['frankfurt', 'de-DE'],
  ['milan', 'it-IT'],
  ['mumbai', 'en-IN'],
  ['new delhi', 'en-IN'],
  ['bengaluru', 'en-IN'],
  ['beijing', 'zh-CN'],
  ['shenzhen', 'zh-CN'],
  ['osaka', 'ja-JP'],
  ['kyoto', 'ja-JP'],
  ['cape town', 'en-ZA'],
  ['wellington', 'en-NZ'],
  ['CST', 'en-US'],
  ['CST', 'zh-CN'],
  ['IST', 'en-IN'],
  ['IST', 'en-IE'],
  ['PST', 'en-US'],
  ['BST', 'en-GB'],
  ['AST', 'en-CA'],
  ['AST', 'ar-SA'],
];

const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const frenchMonths = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const spanishMonths = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const unreadable = ['', 'TBD', 'n/a', '2026-02-30 10:00'];

// 1,000 distinct US month-first ('3/17/2026 2:30 PM') and German day-first ('17.03.2026 14:30') numeric cells
const numericLooseCells = Array.from({ length: 1_000 }, (_, index) => {
  if (index % 20 === 19) {
    return [unreadable[index % unreadable.length], 'en-US', 'America/New_York'];
  }
  const point = new Date(Date.UTC(2024, 0, 1) + index * 86_400_000);
  const year = point.getUTCFullYear();
  const month = point.getUTCMonth() + 1;
  const day = point.getUTCDate();
  const hour = 8 + (index % 10);
  const minute = pad((index * 7) % 60);
  if (index % 2 === 0) {
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return [`${month}/${day}/${year} ${hour12}:${minute} ${ampm}`, 'en-US', 'America/New_York'];
  }
  return [`${pad(day)}.${pad(month)}.${year} ${pad(hour)}:${minute}`, 'de', 'Europe/Berlin'];
});

// 1,200 distinct English Date.parse/RFC 2822 and French/Spanish localized month-name cells
const namedLooseCells = Array.from({ length: 1_200 }, (_, index) => {
  if (index % 20 === 19) {
    return [unreadable[index % unreadable.length], 'fr', 'Europe/Paris'];
  }
  const point = new Date(Date.UTC(2024, 0, 1) + index * 86_400_000);
  const year = point.getUTCFullYear();
  const month = point.getUTCMonth();
  const day = point.getUTCDate();
  const hour = 8 + (index % 10);
  const minute = pad((index * 11) % 60);
  if (index % 4 === 0) {
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return [`${englishMonths[month]} ${day}, ${year} ${hour12}:${minute} ${ampm} ET`, 'en-US', 'America/New_York'];
  }
  if (index % 4 === 2) {
    const wk = weekdays[index % 7];
    return [
      `${wk}, ${pad(day)} ${englishMonths[month]} ${year} ${pad(hour)}:${minute}:00 GMT`,
      'en-US',
      'America/New_York',
    ];
  }
  if (index % 4 === 1) {
    return [`${day} ${frenchMonths[month]} ${year} ${pad(hour)}:${minute}`, 'fr', 'Europe/Paris'];
  }
  return [`${day} de ${spanishMonths[month]} de ${year} ${pad(hour)}:${minute}`, 'es', 'Europe/Madrid'];
});

const legacyRows = Array.from({ length: 400 }, (_, index) =>
  datetime(1_740_000_000_333 + index * 7_654_321, {
    zone: index % 2 === 0 ? 'America/New_York' : 'Europe/Berlin',
    locale: index % 3 === 0 ? 'de-DE' : 'en-US',
  }));

// warm loose and legacy paths using full IANA ids so coldZoneInputs stay uncached for the first export
for (let i = 0; i < 64; i++) {
  const [nText, nLocale, nZone] = numericLooseCells[i];
  datetime(nText, { loose: true, locale: nLocale, zone: nZone });
  const [mText, mLocale, mZone] = namedLooseCells[i];
  datetime(mText, { loose: true, locale: mLocale, zone: mZone });
  legacyRows[i].toLocaleDateString();
  legacyRows[i].toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export let sink = null;

// purpose: resolves ~450 uncached city names, aliases, and locale-disambiguated codes through @native-dates/plugins/zones
export function resolveColdZones() {
  for (let i = 0; i < coldZoneInputs.length; i++) {
    const [zone, locale] = coldZoneInputs[i];
    sink = datetime(1_740_000_000_000 + i * 60_000, { zone, locale });
  }
}

// purpose: imports 1,000 distinct US month-first and German day-first numeric timestamps (5% unreadable nulls)
export function importNumericLoose1k() {
  const out = new Array(numericLooseCells.length);
  for (let i = 0; i < numericLooseCells.length; i++) {
    const [text, locale, zone] = numericLooseCells[i];
    out[i] = datetime(text, { loose: true, locale, zone })?.toJSON() ?? null;
  }
  sink = out;
}

// purpose: imports 1,200 distinct English month-name/RFC 2822 and French/Spanish month-name timestamps (5% nulls)
export function importNamedLoose1200() {
  const out = new Array(namedLooseCells.length);
  for (let i = 0; i < namedLooseCells.length; i++) {
    const [text, locale, zone] = namedLooseCells[i];
    out[i] = datetime(text, { loose: true, locale, zone })?.toJSON() ?? null;
  }
  sink = out;
}

// purpose: formats 800 DateTime legacy-date shim calls via toLocaleDateString() and inline toLocaleTimeString()
export function legacyLocaleStrings800() {
  for (let i = 0; i < legacyRows.length; i++) {
    sink = legacyRows[i].toLocaleDateString();
    sink = legacyRows[i].toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
}
