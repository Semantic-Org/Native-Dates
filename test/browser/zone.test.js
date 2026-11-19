import { date, datetime, now, today } from 'native-dates';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';

const setBrowserZone = (timezoneId) => cdp().send('Emulation.setTimezoneOverride', { timezoneId });
const setBrowserClock = (instant) => vi.useFakeTimers({ toFake: ['Date', 'Temporal'], now: new Date(instant) });

afterEach(async () => {
  vi.useRealTimers();
  await setBrowserZone('');
});

describe('default browser timezone', () => {
  it('uses the browser timezone for now() when no zone is passed or configured', async () => {
    await setBrowserZone('Asia/Tokyo');
    expect(now().zone).toBe('Asia/Tokyo');
    expect(now().offset).toBe('+09:00');
  });

  it('picks up live browser timezone changes without reloading the page', async () => {
    await setBrowserZone('Asia/Tokyo');
    expect(now().zone).toBe('Asia/Tokyo');
    await setBrowserZone('America/Los_Angeles');
    expect(now().zone).toBe('America/Los_Angeles');
  });

  it('resolves today() to the next calendar day in the browser timezone when ahead of UTC', async () => {
    await setBrowserZone('Pacific/Kiritimati');
    setBrowserClock('2026-11-16T12:00:00Z');
    expect(today().toString()).toBe('2026-11-17');
    expect(now().format('YYYY-MM-DD HH:mm')).toBe('2026-11-17 02:00');
  });

  it('resolves today() to the previous calendar day in the browser timezone when behind UTC', async () => {
    await setBrowserZone('America/Los_Angeles');
    setBrowserClock('2026-11-17T03:00:00Z');
    expect(today().toString()).toBe('2026-11-16');
    expect(now().format('YYYY-MM-DD HH:mm')).toBe('2026-11-16 19:00');
  });

  it('interprets an offsetless ISO string as wall time in the browser timezone', async () => {
    await setBrowserZone('Asia/Tokyo');
    expect(datetime('2026-11-16T09:30').toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  // a local-midnight Date in Kiritimati (+14:00) has a UTC timestamp of 10:00 on the previous day
  it('extracts the local calendar date from a local-midnight Date in the browser timezone', async () => {
    await setBrowserZone('Pacific/Kiritimati');
    expect(date(new Date(2026, 10, 16)).toString()).toBe('2026-11-16');
  });
});
