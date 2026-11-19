import { date, datetime, now, today } from 'native-dates';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';

const setBrowserZone = (timezoneId) => cdp().send('Emulation.setTimezoneOverride', { timezoneId });
const setBrowserClock = (instant) => vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date(instant) });

afterEach(async () => {
  vi.useRealTimers();
  await setBrowserZone('');
});

describe('the time zone of the browser', () => {
  it('is the zone of now() when no zone is passed or configured', async () => {
    await setBrowserZone('Asia/Tokyo');
    expect(now().zone).toBe('Asia/Tokyo');
    expect(now().offset).toBe('+09:00');
  });

  it('is followed when the reader changes zone without reloading the page', async () => {
    await setBrowserZone('Asia/Tokyo');
    expect(now().zone).toBe('Asia/Tokyo');
    await setBrowserZone('America/Los_Angeles');
    expect(now().zone).toBe('America/Los_Angeles');
  });

  it('puts today() on the day of the reader while UTC is still on the day before', async () => {
    await setBrowserZone('Pacific/Kiritimati');
    setBrowserClock('2026-11-16T12:00:00Z');
    expect(today().toString()).toBe('2026-11-17');
    expect(now().format('YYYY-MM-DD HH:mm')).toBe('2026-11-17 02:00');
  });

  it('puts today() on the day of the reader while UTC is already on the day after', async () => {
    await setBrowserZone('America/Los_Angeles');
    setBrowserClock('2026-11-17T03:00:00Z');
    expect(today().toString()).toBe('2026-11-16');
    expect(now().format('YYYY-MM-DD HH:mm')).toBe('2026-11-16 19:00');
  });

  it('reads a string with no offset as the wall clock there', async () => {
    await setBrowserZone('Asia/Tokyo');
    expect(datetime('2026-11-16T09:30').toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  // a date picker hands over local midnight, which in Kiritimati is 10am the day before in UTC
  it('reads a Date at local midnight as that local day', async () => {
    await setBrowserZone('Pacific/Kiritimati');
    expect(date(new Date(2026, 10, 16)).toString()).toBe('2026-11-16');
  });
});
