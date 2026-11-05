import { isPlainObject } from '../helpers/types.js';
import { canonicalZone, configure, setZoneExtension } from '../helpers/zones.js';

// timezone abbreviations are ambiguous by nature (IST is Kolkata, Jerusalem, or Dublin depending on
// who you ask), so the base picks are editable once at app boot (timezones.IST = 'Asia/Jerusalem').
// full IANA names always pass through untouched
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

// daylight-observing readings of common abbreviations, because the bare IANA 'EST' is a fixed offset
// that never springs forward, and nobody who types it means that
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

// every IANA id the engine knows, by its loose full spelling and by its city. the canonical cities
// are unique, so 'los angeles' and 'sao paulo' each name exactly one zone
let index;
const cities = () => {
  if (!index) {
    const ids = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    index = {
      full: new Map(ids.map((id) => [normalize(id), id])),
      city: new Map(ids.map((id) => [normalize(id.split('/').pop()), id])),
    };
  }
  return index;
};

// ICU's canonical list can lag the tz database (it still says Saigon where the database says
// Ho_Chi_Minh), so a city the index does not know is rebuilt in IANA spelling under each region and
// put to Temporal, which knows every link
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

export default function zones(options) {
  setZoneExtension(resolveZone);
  const aliases = options?.zoneAliases ?? options?.aliases ?? options;
  if (isPlainObject(aliases)) {
    configure({ zoneAliases: aliases });
  }
}
