import { canonicalZone, setZoneExtension } from 'native-dates/helpers/zones';

// checked before every table below, left mutable so apps can override entries at startup
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
  MSK: 'Europe/Moscow',
};

// names that mean different zones in different countries. The caller's locale picks the one at home
// ('CST' is Shanghai in zh-CN and Havana in es-CU) and the first is the reading everywhere else
const shared = {
  cst: ['America/Chicago', 'Asia/Shanghai', 'Asia/Taipei', 'America/Havana'],
  ist: ['Asia/Kolkata', 'Europe/Dublin', 'Asia/Jerusalem'],
  pst: ['America/Los_Angeles', 'Asia/Manila'],
  bst: ['Europe/London', 'Asia/Dhaka'],
  ast: ['America/Halifax', 'Asia/Riyadh'],
  act: ['Australia/Adelaide', 'America/Rio_Branco'],
  amt: ['America/Manaus', 'Asia/Yerevan'],
  'san juan': ['America/Argentina/San_Juan', 'America/Puerto_Rico'],
};

const at = (zone) => Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(zone);

// compare through Temporal so a link like Asia/Calcutta matches Asia/Kolkata
const atHome = (zones, locale) => {
  const home = new Intl.Locale(new Intl.DateTimeFormat(locale).resolvedOptions().locale).maximize().getTimeZones?.();
  return zones.find((zone) => home?.some((mine) => at(mine).equals(at(zone)))) ?? zones[0];
};

// cities and abbreviations people say for a zone that IANA files under another name
const nicknames = {
  'America/New_York': 'nyc,washington,washington dc,boston,miami,atlanta',
  'America/Chicago': 'houston,dallas',
  'America/Los_Angeles': 'la,san francisco,seattle,las vegas',
  'America/Toronto': 'ottawa,hne,hae',
  'America/Mexico_City': 'cdmx,guadalajara',
  'America/Havana': 'habana,la habana',
  'America/Bogota': 'cot',
  'America/Guayaquil': 'quito',
  'America/Santiago': 'clt',
  'America/Argentina/Buenos_Aires': 'art',
  'America/Sao_Paulo': 'brasilia,rio de janeiro,rio,belo horizonte',
  'America/Bahia': 'salvador',
  'America/Noronha': 'fnt',
  'Europe/London': 'manchester,edinburgh',
  'Europe/Paris': 'lyon,marseille',
  'Europe/Brussels': 'bruxelles',
  'Europe/Zurich': 'geneva,geneve,bern',
  'Europe/Berlin': 'munich,frankfurt,hamburg',
  'Europe/Madrid': 'barcelona',
  'Europe/Rome': 'milan',
  'Europe/Istanbul': 'ankara',
  'Europe/Moscow': 'saint petersburg,st. petersburg,spb,kazan,москва,мск',
  'Asia/Yekaterinburg': 'ekaterinburg',
  'Asia/Almaty': 'astana',
  'Asia/Riyadh': 'makkah,mecca,jeddah',
  'Asia/Qatar': 'doha',
  'Asia/Dubai': 'abu dhabi,gst',
  'Asia/Bahrain': 'manama',
  'Asia/Karachi': 'islamabad,lahore,pkt',
  'Asia/Kolkata': 'mumbai,delhi,new delhi,bangalore,bengaluru,chennai,hyderabad',
  'Asia/Bangkok': 'ict',
  'Asia/Ho_Chi_Minh': 'hanoi',
  'Asia/Jakarta': 'wib',
  'Asia/Manila': 'pht',
  'Asia/Shanghai': 'beijing,shenzhen,guangzhou,北京',
  'Asia/Seoul': 'busan,서울',
  'Asia/Tokyo': 'osaka,kyoto,fukuoka,東京',
  'Africa/Casablanca': 'rabat',
  'Africa/Lagos': 'abuja,wat',
  'Africa/Nairobi': 'eat',
  'Africa/Johannesburg': 'cape town,pretoria,sast',
  'Pacific/Auckland': 'wellington',
};

// checked before Temporal itself because bare IANA 'EST', 'MST', and 'HST' are legacy fixed-offset
// zones without DST, whereas callers writing 'EST' expect America/New_York
const abbreviations = {
  est: 'America/New_York',
  edt: 'America/New_York',
  eastern: 'America/New_York',
  cdt: 'America/Chicago',
  central: 'America/Chicago',
  mst: 'America/Denver',
  mdt: 'America/Denver',
  mountain: 'America/Denver',
  pdt: 'America/Los_Angeles',
  pacific: 'America/Los_Angeles',
  akst: 'America/Anchorage',
  akdt: 'America/Anchorage',
  alaska: 'America/Anchorage',
  hst: 'Pacific/Honolulu',
  hawaii: 'Pacific/Honolulu',
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

// index both full IANA ids and leaf city names (including 3-part ids like America/Argentina/Buenos_Aires),
// listing nicknames first so an IANA city of the same name wins
let index;
const cities = () => {
  if (!index) {
    const ids = Intl.supportedValuesOf('timeZone');
    index = {
      full: new Map(ids.map((id) => [normalize(id), id])),
      city: new Map([
        ...Object.entries(nicknames).flatMap(([id, list]) => list.split(',').map((name) => [normalize(name), id])),
        ...ids.map((id) => [normalize(id.split('/').pop()), id]),
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

const alias = (key, zoneAliases, locale) => {
  for (const table of [zoneAliases, timezones]) {
    for (const [name, target] of Object.entries(table)) {
      if (normalize(name) === key) {
        return target;
      }
    }
  }
  return shared[key] ? atHome(shared[key], locale) : abbreviations[key];
};

const resolveZone = (id, zoneAliases, locale) => {
  const key = normalize(id);
  return (
    canonicalZone(alias(key, zoneAliases, locale) ?? id.trim())
      ?? canonicalZone(cities().full.get(key) ?? cities().city.get(key) ?? '')
      ?? rebuilt(key)
  );
};

setZoneExtension(resolveZone);
