import { date, datetime } from 'native-dates';

const isoDates = Array.from({ length: 25_000 }, (_, index) => {
  const year = 2020 + (index % 10);
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

const zonedInputs = Array.from({ length: 8_000 }, (_, index) => {
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');
  const hour = String(index % 24).padStart(2, '0');
  const minute = String(index % 60).padStart(2, '0');
  if (index % 4 === 0) {
    return [`2026-${month}-${day}T${hour}:${minute}:00Z`, 'America/New_York'];
  }
  if (index % 4 === 1) {
    return [`2026-${month}-${day}T${hour}:${minute}:00-04:00`, 'America/New_York'];
  }
  return [`2026-${month}-${day}T${hour}:${minute}`, index % 2 === 0 ? 'America/New_York' : 'Europe/Berlin'];
});

// pre-warm V8 inline caches symmetrically so lazy-vs-eager constructor changes do not skew JIT tiering
for (let i = 0; i < 512; i++) {
  date(isoDates[i]);
  datetime(zonedInputs[i][0], zonedInputs[i][1]);
}

export let sink = null;

// purpose: parses 25,000 varied ISO calendar date strings into frozen CalendarDate instances
export function parseIsoDate25k() {
  for (let i = 0; i < isoDates.length; i++) {
    sink = date(isoDates[i]);
  }
}

// purpose: parses 8,000 UTC, fixed-offset, and wall-clock ISO timestamps across America/New_York and Europe/Berlin
export function parseZonedDateTime8k() {
  for (let i = 0; i < zonedInputs.length; i++) {
    const [input, zone] = zonedInputs[i];
    sink = datetime(input, zone);
  }
}
