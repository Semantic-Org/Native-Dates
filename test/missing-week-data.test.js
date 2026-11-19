import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const getWeekInfo = Object.getOwnPropertyDescriptor(Intl.Locale.prototype, 'getWeekInfo');

// en-US starts its week on Sunday wherever the runtime can say so
describe('a runtime that cannot say where a locale starts its week', () => {
  let dates;

  beforeAll(async () => {
    delete Intl.Locale.prototype.getWeekInfo;
    vi.resetModules();
    dates = await import('native-dates');
  });
  afterAll(() => {
    dates.configure({ weekStart: null });
    Object.defineProperty(Intl.Locale.prototype, 'getWeekInfo', getWeekInfo);
  });

  it('starts the week on Monday', () => {
    const wednesday = dates.date('2026-11-18').locale('en-US');
    expect(wednesday.weekStart).toBe(1);
    expect(wednesday.startOf('week').toString()).toBe('2026-11-16');
  });

  it('lists weekday names from Monday', () => {
    expect(dates.weekdayNames('short', undefined, 'en-US')[0]).toBe('Mon');
  });

  it('starts the week on the day a call or configure() names', () => {
    const wednesday = dates.date('2026-11-18').locale('en-US');
    expect(wednesday.startOf('week', 'sunday').toString()).toBe('2026-11-15');
    dates.configure({ weekStart: 'sunday' });
    expect(wednesday.startOf('week').toString()).toBe('2026-11-15');
  });
});
