import { canonicalZone, setZoneExtension } from 'native-dates/helpers/zones';

// ambiguous abbreviations (IST can mean Kolkata, Jerusalem, or Dublin), left mutable so apps can
// override entries at startup (`timezones.IST = 'Asia/Jerusalem'`) or via `configure({ zoneAliases })`
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
  IRST: 'Europe/Dublin',
  AET: 'Australia/Sydney',
  ACT: 'Australia/Adelaide',
  AWT: 'Australia/Perth',
  NZT: 'Pacific/Auckland',
  BRT: 'America/Sao_Paulo',
  IST: 'Asia/Kolkata',
  INST: 'Asia/Kolkata',
  JST: 'Asia/Tokyo',
  SGT: 'Asia/Singapore',
};

// checked before Temporal itself because bare IANA 'EST', 'MST', and 'HST' are legacy fixed-offset
// zones without DST, whereas callers writing 'EST' expect America/New_York
const abbreviations = {
  est: 'America/New_York',
  edt: 'America/New_York',
  eastern: 'America/New_York',
  cst: 'America/Chicago',
  cdt: 'America/Chicago',
  central: 'America/Chicago',
  mst: 'America/Denver',
  mdt: 'America/Denver',
  mountain: 'America/Denver',
  pst: 'America/Los_Angeles',
  pdt: 'America/Los_Angeles',
  pacific: 'America/Los_Angeles',
  akst: 'America/Anchorage',
  akdt: 'America/Anchorage',
  alaska: 'America/Anchorage',
  hst: 'Pacific/Honolulu',
  hawaii: 'Pacific/Honolulu',
  bst: 'Europe/London',
  cest: 'Europe/Paris',
  jst: 'Asia/Tokyo',
  kst: 'Asia/Seoul',
  aest: 'Australia/Sydney',
  aedt: 'Australia/Sydney',
  nzst: 'Pacific/Auckland',
  nzdt: 'Pacific/Auckland',
  sgt: 'Asia/Singapore',
  hkt: 'Asia/Hong_Kong',
  gmt: 'UTC',
  z: 'UTC',
};

const capitalize = (word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '');

const normalize = (text) =>
  text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_-]+/g, ' ');

// index both full IANA ids and leaf city names (including 3-part ids like America/Argentina/Buenos_Aires)
let index;
const cities = () => {
  if (!index) {
    const ids = Intl.supportedValuesOf('timeZone');
    index = {
      full: new Map(ids.map((id) => [normalize(id), id])),
      city: new Map(ids.map((id) => [normalize(id.split('/').pop()), id])),
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

const resolveZone = (id, zoneAliases) => {
  const key = normalize(id);
  return (
    canonicalZone(alias(key, zoneAliases) ?? id.trim())
      ?? canonicalZone(cities().full.get(key) ?? cities().city.get(key) ?? '')
      ?? rebuilt(key)
  );
};

setZoneExtension(resolveZone);
