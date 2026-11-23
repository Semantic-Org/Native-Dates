import { date, datetime } from 'native-dates';

const pad = (value, width = 2) => String(value).padStart(width, '0');

// coprime stride (7919 is prime) permutes 25,000 sequential epoch days into 25,000 distinct YYYY-MM-DD strings
const epochStart = Date.UTC(1975, 0, 1);
const isoDates = Array.from({ length: 25_000 }, (_, index) => {
  const dayOffset = (index * 7_919 + 1_009) % 25_000;
  const point = new Date(epochStart + dayOffset * 86_400_000);
  return `${point.getUTCFullYear()}-${pad(point.getUTCMonth() + 1)}-${pad(point.getUTCDate())}`;
});

// 8,000 distinct timestamps mixing JS .sssZ, default-zone .sssZ, Postgres microsecond +00, and wall-clock strings
const baseInstant = Date.UTC(2025, 0, 1, 0, 0, 0, 137);
const zonedInputs = Array.from({ length: 8_000 }, (_, index) => {
  const slot = (index * 4_999 + 313) % 8_000;
  const ms = baseInstant + slot * 5_912_341 + (index % 997);
  const iso = new Date(ms).toISOString();
  const mode = index % 4;
  if (mode === 0) {
    return [iso, 'America/New_York'];
  }
  if (mode === 1) {
    return [iso, undefined];
  }
  if (mode === 2) {
    const pg = `${iso.slice(0, 10)} ${iso.slice(11, 23)}${pad((index * 137) % 1_000, 3)}+00`;
    return [pg, 'Europe/Berlin'];
  }
  return [iso.slice(0, 19), index % 8 === 3 ? 'America/New_York' : 'Europe/Berlin'];
});

// pre-warm V8 inline caches symmetrically so lazy-vs-eager constructor changes do not skew JIT tiering
for (let i = 0; i < 512; i++) {
  date(isoDates[i]);
  const [input, zone] = zonedInputs[i];
  if (zone) { datetime(input, zone); }
  else { datetime(input); }
}

export let sink = null;

// purpose: parses 25,000 distinct ISO calendar date strings across 68 years into frozen CalendarDate instances
export function parseIsoDate25k() {
  for (let i = 0; i < isoDates.length; i++) {
    sink = date(isoDates[i]);
  }
}

// purpose: parses 8,000 distinct .sssZ, default-zone, Postgres +00, and wall-clock timestamps across DST zones
export function parseZonedDateTime8k() {
  for (let i = 0; i < zonedInputs.length; i++) {
    const [input, zone] = zonedInputs[i];
    sink = zone ? datetime(input, zone) : datetime(input);
  }
}
