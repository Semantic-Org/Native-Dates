import { datetime } from 'native-dates';

const instants = Array.from(
  { length: 10_000 },
  (_, index) => datetime(1_700_000_000_000 + index * 3_723_000, { zone: 'UTC' }),
);

export let sink = '';

// purpose: formats 30,000 UTC DateTime token patterns (YYYY-MM-DD HH:mm:ss)
export function formatToken30k() {
  for (let i = 0; i < 30_000; i++) {
    sink = instants[i % instants.length].format('YYYY-MM-DD HH:mm:ss');
  }
}
