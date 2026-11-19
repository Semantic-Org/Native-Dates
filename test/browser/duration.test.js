import { duration, hours, minutes } from 'native-dates';
import { describe, expect, it } from 'vitest';

// Node 26.1 leaves out what is below a second from a Temporal.Duration string when the whole seconds are zero
// ('PT1H' for an hour and 500 milliseconds). Chromium prints it, so these run in the browser alone
describe('Duration toString(), toJSON() and equals() below a second', () => {
  it('keeps milliseconds in the ISO string when the whole seconds are zero', () => {
    expect(duration({ minutes: 40, milliseconds: 250 }).toString()).toBe('PT40M0.25S');
    expect(hours(1).plus(500).toString()).toBe('PT1H0.5S');
  });

  it('keeps milliseconds in JSON and reads them back', () => {
    const wire = JSON.stringify({ ttl: duration({ hours: 1, milliseconds: 500 }) });
    expect(wire).toBe('{"ttl":"PT1H0.5S"}');
    expect(duration(JSON.parse(wire).ttl).toFields()).toEqual({ hours: 1, milliseconds: 500 });
  });

  it('tells 40 minutes and 250 milliseconds apart from 40 minutes', () => {
    const longer = duration({ minutes: 40, milliseconds: 250 });
    expect(longer.equals(minutes(40))).toBe(false);
    expect(longer.compare(minutes(40))).toBe(1);
  });
});
