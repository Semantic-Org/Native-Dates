import { date } from 'native-dates';

const inputs = Array.from({ length: 15_000 }, (_, index) => {
  const year = 2020 + (index % 10);
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

export let sink = null;

// purpose: parses 15,000 varied ISO calendar date strings into frozen CalendarDate instances
export function parseIsoDate15k() {
  for (let i = 0; i < inputs.length; i++) {
    sink = date(inputs[i]);
  }
}
