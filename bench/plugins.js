import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

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
const unreadable = ['', 'TBD', 'n/a', '2026-02-30 10:00'];

const looseCells = Array.from({ length: 1_000 }, (_, index) => {
  if (index % 20 === 19) {
    return [unreadable[index % unreadable.length], 'en-US', 'America/New_York'];
  }
  const month = (index % 12) + 1;
  const day = (index % 28) + 1;
  const hour = 8 + (index % 10);
  const minute = String((index * 5) % 60).padStart(2, '0');
  if (index % 2 === 0) {
    const code = index % 4 === 0 ? 'EST' : 'PT';
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return [
      `${englishMonths[month - 1]} ${day}, 2026 ${hour12}:${minute} ${ampm} ${code}`,
      'en-US',
      'America/New_York',
    ];
  }
  if (index % 4 === 1) {
    return [`${day} ${frenchMonths[month - 1]} 2026 ${String(hour).padStart(2, '0')}:${minute}`, 'fr', 'Europe/Paris'];
  }
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return [`${dd}.${mm}.2026 ${String(hour).padStart(2, '0')}:${minute}`, 'de', 'Europe/Berlin'];
});

const zoneCases = [
  ['Berlin', 'de-DE'],
  ['Mumbai', 'en-IN'],
  ['Beijing', 'zh-CN'],
  ['NYC', 'en-US'],
  ['London', 'en-GB'],
  ['Tokyo', 'ja-JP'],
  ['EST', 'en-US'],
  ['PT', 'en-US'],
  ['CET', 'de-DE'],
  ['JST', 'ja-JP'],
  ['CST', 'en-US'],
  ['CST', 'zh-CN'],
  ['IST', 'en-IN'],
  ['IST', 'en-IE'],
  ['BST', 'en-GB'],
  ['MSK', 'ru-RU'],
];

for (let i = 0; i < 128; i++) {
  const [text, locale, zone] = looseCells[i];
  datetime(text, { loose: true, locale, zone });
  const [zoneName, zoneLocale] = zoneCases[i % zoneCases.length];
  datetime(1_740_000_000_000 + i * 60_000, { zone: zoneName, locale: zoneLocale });
}

export let sink = null;

// purpose: parses 1,000 English, French, and German informal timestamps (5% unreadable nulls) with loose + zones plugins
export function parseLoose1k() {
  for (let i = 0; i < looseCells.length; i++) {
    const [text, locale, zone] = looseCells[i];
    sink = datetime(text, { loose: true, locale, zone });
  }
}

// purpose: resolves 15,000 city names, fixed/regional abbreviations, and locale-disambiguated codes (CST, IST)
export function resolvePluginZones15k() {
  for (let i = 0; i < 15_000; i++) {
    const [zone, locale] = zoneCases[i % zoneCases.length];
    sink = datetime(1_740_000_000_000 + (i % 1_000) * 3_600_000, { zone, locale });
  }
}
