import { isArray } from 'native-dates/helpers/utils';
import { canonicalZone, setZoneExtension } from 'native-dates/helpers/zones';

// checked before the tables below, left mutable so apps can override entries at startup
// (`timezones.IST = 'Asia/Jerusalem'`) or via `configure({ zoneAliases })`
export const timezones = {
  ET: 'America/New_York',
  CT: 'America/Chicago',
  MT: 'America/Denver',
  PT: 'America/Los_Angeles',
  AKT: 'America/Anchorage',
  HT: 'Pacific/Honolulu',
  AT: 'America/Halifax',
  UK: 'Europe/London',
  WET: 'Europe/London',
  CET: 'Europe/Paris',
  ECT: 'Europe/Paris',
  EET: 'Europe/Helsinki',
  IRST: 'Asia/Tehran',
  AET: 'Australia/Sydney',
  AWT: 'Australia/Perth',
  NZT: 'Pacific/Auckland',
  BRT: 'America/Sao_Paulo',
  INST: 'Asia/Kolkata',
  JST: 'Asia/Tokyo',
  SGT: 'Asia/Singapore',
};

// checked before Temporal itself because bare IANA 'EST', 'MST', and 'HST' are legacy fixed-offset
// zones without DST, whereas callers writing 'EST' expect America/New_York. An abbreviation that
// countries use differently lists each zone, with the most common reading first
const abbreviations = {
  est: 'America/New_York',
  edt: 'America/New_York',
  eastern: 'America/New_York',
  cst: ['America/Chicago', 'Asia/Shanghai', 'Asia/Taipei', 'America/Havana'],
  cdt: 'America/Chicago',
  central: 'America/Chicago',
  mst: 'America/Denver',
  mdt: 'America/Denver',
  mountain: 'America/Denver',
  pst: ['America/Los_Angeles', 'Asia/Manila'],
  pdt: 'America/Los_Angeles',
  pacific: 'America/Los_Angeles',
  akst: 'America/Anchorage',
  akdt: 'America/Anchorage',
  alaska: 'America/Anchorage',
  hst: 'Pacific/Honolulu',
  hawaii: 'Pacific/Honolulu',
  ast: ['America/Halifax', 'Asia/Riyadh'],
  hne: 'America/Toronto',
  hae: 'America/Toronto',
  art: 'America/Argentina/Buenos_Aires',
  cot: 'America/Bogota',
  clt: 'America/Santiago',
  amt: ['America/Manaus', 'Asia/Yerevan'],
  fnt: 'America/Noronha',
  bst: ['Europe/London', 'Asia/Dhaka'],
  cest: 'Europe/Paris',
  msk: 'Europe/Moscow',
  мск: 'Europe/Moscow',
  wat: 'Africa/Lagos',
  eat: 'Africa/Nairobi',
  sast: 'Africa/Johannesburg',
  gst: 'Asia/Dubai',
  pkt: 'Asia/Karachi',
  ist: ['Asia/Kolkata', 'Europe/Dublin', 'Asia/Jerusalem'],
  ict: 'Asia/Bangkok',
  wib: 'Asia/Jakarta',
  pht: 'Asia/Manila',
  jst: 'Asia/Tokyo',
  kst: 'Asia/Seoul',
  act: ['Australia/Adelaide', 'America/Rio_Branco'],
  aest: 'Australia/Sydney',
  aedt: 'Australia/Sydney',
  nzst: 'Pacific/Auckland',
  nzdt: 'Pacific/Auckland',
  sgt: 'Asia/Singapore',
  hkt: 'Asia/Hong_Kong',
  gmt: 'UTC',
  z: 'UTC',
};

// cities whose zone IANA names after another city, so 'Beijing' is Asia/Shanghai and 'Mumbai' is Asia/Kolkata
const otherCities = {
  nyc: 'America/New_York',
  washington: 'America/New_York',
  'washington dc': 'America/New_York',
  boston: 'America/New_York',
  miami: 'America/New_York',
  atlanta: 'America/New_York',
  houston: 'America/Chicago',
  dallas: 'America/Chicago',
  la: 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  seattle: 'America/Los_Angeles',
  'las vegas': 'America/Los_Angeles',
  ottawa: 'America/Toronto',
  cdmx: 'America/Mexico_City',
  guadalajara: 'America/Mexico_City',
  habana: 'America/Havana',
  'la habana': 'America/Havana',
  'san juan': ['America/Argentina/San_Juan', 'America/Puerto_Rico'],
  quito: 'America/Guayaquil',
  brasilia: 'America/Sao_Paulo',
  'rio de janeiro': 'America/Sao_Paulo',
  rio: 'America/Sao_Paulo',
  'belo horizonte': 'America/Sao_Paulo',
  salvador: 'America/Bahia',
  manchester: 'Europe/London',
  edinburgh: 'Europe/London',
  lyon: 'Europe/Paris',
  marseille: 'Europe/Paris',
  bruxelles: 'Europe/Brussels',
  geneva: 'Europe/Zurich',
  geneve: 'Europe/Zurich',
  bern: 'Europe/Zurich',
  munich: 'Europe/Berlin',
  frankfurt: 'Europe/Berlin',
  hamburg: 'Europe/Berlin',
  barcelona: 'Europe/Madrid',
  milan: 'Europe/Rome',
  ankara: 'Europe/Istanbul',
  'saint petersburg': 'Europe/Moscow',
  'st. petersburg': 'Europe/Moscow',
  spb: 'Europe/Moscow',
  kazan: 'Europe/Moscow',
  москва: 'Europe/Moscow',
  ekaterinburg: 'Asia/Yekaterinburg',
  astana: 'Asia/Almaty',
  makkah: 'Asia/Riyadh',
  mecca: 'Asia/Riyadh',
  jeddah: 'Asia/Riyadh',
  doha: 'Asia/Qatar',
  'abu dhabi': 'Asia/Dubai',
  manama: 'Asia/Bahrain',
  islamabad: 'Asia/Karachi',
  lahore: 'Asia/Karachi',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  'new delhi': 'Asia/Kolkata',
  bangalore: 'Asia/Kolkata',
  bengaluru: 'Asia/Kolkata',
  chennai: 'Asia/Kolkata',
  hyderabad: 'Asia/Kolkata',
  hanoi: 'Asia/Ho_Chi_Minh',
  beijing: 'Asia/Shanghai',
  shenzhen: 'Asia/Shanghai',
  guangzhou: 'Asia/Shanghai',
  北京: 'Asia/Shanghai',
  busan: 'Asia/Seoul',
  서울: 'Asia/Seoul',
  osaka: 'Asia/Tokyo',
  kyoto: 'Asia/Tokyo',
  fukuoka: 'Asia/Tokyo',
  東京: 'Asia/Tokyo',
  rabat: 'Africa/Casablanca',
  abuja: 'Africa/Lagos',
  'cape town': 'Africa/Johannesburg',
  pretoria: 'Africa/Johannesburg',
  wellington: 'Pacific/Auckland',
};

const capitalize = (word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '');

const normalize = (text) => text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s_-]+/g, ' ');

// index both full IANA ids and leaf city names (including 3-part ids like America/Argentina/Buenos_Aires),
// then the other cities
let index;
const cities = () => {
  if (!index) {
    const ids = Intl.supportedValuesOf('timeZone');
    index = {
      full: new Map(ids.map((id) => [normalize(id), id])),
      city: new Map([
        ...ids.map((id) => [normalize(id.split('/').pop()), id]),
        ...Object.entries(otherCities).map(([name, zone]) => [normalize(name), zone]),
      ]),
    };
  }
  return index;
};

// Intl.supportedValuesOf('timeZone') omits IANA link aliases (e.g. Ho_Chi_Minh when ICU lists Saigon),
// so probe <Region>/<City> against Temporal to resolve tzdb links
const regions = ['Africa', 'America', 'Antarctica', 'Asia', 'Atlantic', 'Australia', 'Europe', 'Indian', 'Pacific'];
const rebuilt = (key) => {
  const city = key.split(' ').map(capitalize).join('_');
  for (const region of regions) {
    const found = canonicalZone(`${region}/${city}`);
    if (found) {
      return found;
    }
  }
  return undefined;
};

const alias = (key, zoneAliases) => {
  for (const table of [zoneAliases, timezones]) {
    for (const [name, target] of Object.entries(table)) {
      if (normalize(name) === key) {
        return target;
      }
    }
  }
  return abbreviations[key];
};

// Temporal treats a link and its zone as equal, so Asia/Calcutta from Intl matches Asia/Kolkata
const isSameZone = (first, second) => {
  const zoned = (id) => Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(id);
  return zoned(first).equals(zoned(second));
};

// where a name lists several zones, the one in the caller's country is meant ('CST' is Asia/Shanghai
// under 'zh-CN' and America/Havana under 'es-CU'), and the first one otherwise
const zoneFor = (target, locale) => {
  if (!isArray(target)) {
    return target;
  }
  const country = new Intl.Locale(new Intl.DateTimeFormat(locale).resolvedOptions().locale).maximize();
  const countryZones = country.getTimeZones?.() ?? [];
  return target.find((zone) => countryZones.some((id) => isSameZone(id, zone))) ?? target[0];
};

const resolveZone = (id, zoneAliases, locale) => {
  const key = normalize(id);
  return (
    canonicalZone(zoneFor(alias(key, zoneAliases), locale) ?? id.trim())
      ?? canonicalZone(cities().full.get(key) ?? zoneFor(cities().city.get(key), locale) ?? '')
      ?? rebuilt(key)
  );
};

setZoneExtension(resolveZone);
