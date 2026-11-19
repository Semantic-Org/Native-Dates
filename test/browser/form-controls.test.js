import { date, datetime, time, yearMonth } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

const setBrowserZone = (timezoneId) => cdp().send('Emulation.setTimezoneOverride', { timezoneId });

// HTML date/time inputs sanitize invalid value strings to ''
const control = (type, value) => {
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  return input;
};

afterEach(() => setBrowserZone(''));

describe('HTML form controls', () => {
  it('fills a date control from a CalendarDate and reads the same day back', () => {
    const due = date('2026-11-16');
    const input = control('date', due.toString());
    expect(input.value).toBe('2026-11-16');
    expect(date(input.value).equals(due)).toBe(true);
  });

  it('fills a month control from a YearMonth and reads the same month back', () => {
    const billing = yearMonth('2026-11');
    const input = control('month', billing.toString());
    expect(input.value).toBe('2026-11');
    expect(yearMonth(input.value).equals(billing)).toBe(true);
  });

  it('fills a time control from a Time, with seconds or cut to hours and minutes', () => {
    const opens = time('9:30am');
    expect(control('time', opens.toString()).value).toBe('09:30:00');
    expect(control('time', opens.toString().slice(0, 5)).value).toBe('09:30');
    expect(time(control('time', opens.toString()).value).equals(opens)).toBe(true);
  });

  it('reads a time control that steps in milliseconds', () => {
    const lap = time('09:30:15.5');
    const input = control('time', lap.toString());
    expect(input.value).toBe('09:30:15.500');
    expect(time(input.value).equals(lap)).toBe(true);
  });

  it('fills a datetime-local control with the wall clock of a DateTime and reads it back in the same zone', () => {
    const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
    const input = control('datetime-local', standup.format('YYYY-MM-DDTHH:mm'));
    expect(input.value).toBe('2026-11-16T09:30');
    expect(datetime(input.value, 'America/Los_Angeles').equals(standup)).toBe(true);
  });

  // new Date('2026-11-16') parses as UTC midnight, which falls on the 15th in timezones west of UTC
  it('reads a date control as the day picked in a browser west of UTC', async () => {
    await setBrowserZone('America/Los_Angeles');
    const input = control('date', '2026-11-16');
    expect(new Date(input.value).getDate()).toBe(15);
    expect(date(input.value).day).toBe(16);
  });
});
