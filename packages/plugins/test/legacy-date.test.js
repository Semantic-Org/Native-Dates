import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';
import { describe, expect, it } from 'vitest';

// crosses the year boundary between Asia/Tokyo (2027-01-01 05:05) and UTC (2026-12-31 20:05)
const newYearInTokyo = datetime('2026-12-31T20:05:06.007Z', 'Asia/Tokyo');

describe('@native-dates/plugins/legacy-date local getters', () => {
  it('reads calendar and time fields in the DateTime zone rather than the host timezone', () => {
    expect(newYearInTokyo.getFullYear()).toBe(2027);
    expect(newYearInTokyo.getMonth()).toBe(0);
    expect(newYearInTokyo.getDate()).toBe(1);
    expect(newYearInTokyo.getDay()).toBe(5);
    expect(newYearInTokyo.getHours()).toBe(5);
    expect(newYearInTokyo.getMinutes()).toBe(5);
    expect(newYearInTokyo.getSeconds()).toBe(6);
    expect(newYearInTokyo.getMilliseconds()).toBe(7);
  });

  it('uses 0-indexed months and Sunday = 0 to match Date', () => {
    const sunday = datetime('2026-09-06T14:30', 'America/New_York');
    expect(sunday).toMatchObject({ month: 9, dayOfWeek: 7 });
    expect(sunday.getMonth()).toBe(8);
    expect(sunday.getDay()).toBe(0);

    const saturday = datetime('2026-12-05T14:30', 'America/New_York');
    expect(saturday.getMonth()).toBe(11);
    expect(saturday.getDay()).toBe(6);
  });

  it('returns epoch milliseconds from getTime()', () => {
    const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');
    expect(flight.getTime()).toBe(Date.UTC(2026, 8, 6, 18, 30, 15, 250));
    expect(flight.getTime()).toBe(flight.epochMilliseconds);
  });

  it('returns minutes behind UTC at that instant from getTimezoneOffset()', () => {
    expect(datetime('2026-09-06T14:30', 'America/New_York').getTimezoneOffset()).toBe(240);
    expect(datetime('2026-01-06T14:30', 'America/New_York').getTimezoneOffset()).toBe(300);
    expect(datetime('2026-01-06T09:00', 'Asia/Kolkata').getTimezoneOffset()).toBe(-330);
    expect(datetime('2026-01-06T09:00', '+05:30').getTimezoneOffset()).toBe(-330);
  });

  // shifting getTime() by getTimezoneOffset() is the standard <input type="datetime-local"> idiom
  it('produces the DateTime wall clock when shifting getTime() by getTimezoneOffset()', () => {
    const afternoon = datetime('2026-09-06T14:30', 'Asia/Tokyo');
    const shifted = new Date(afternoon.getTime() - afternoon.getTimezoneOffset() * 60_000);
    expect(shifted.toISOString().slice(0, 16)).toBe('2026-09-06T14:30');
  });

  it.todo('returns +0 rather than -0 from getTimezoneOffset() for UTC');
});

describe('@native-dates/plugins/legacy-date UTC getters', () => {
  it('reads calendar and time fields in UTC regardless of the DateTime zone', () => {
    expect(newYearInTokyo.getUTCFullYear()).toBe(2026);
    expect(newYearInTokyo.getUTCMonth()).toBe(11);
    expect(newYearInTokyo.getUTCDate()).toBe(31);
    expect(newYearInTokyo.getUTCDay()).toBe(4);
    expect(newYearInTokyo.getUTCHours()).toBe(20);
    expect(newYearInTokyo.getUTCMinutes()).toBe(5);
    expect(newYearInTokyo.getUTCSeconds()).toBe(6);
    expect(newYearInTokyo.getUTCMilliseconds()).toBe(7);
  });

  it('converts half-hour offsets like Asia/Kolkata to UTC', () => {
    const morning = datetime('2026-01-06T09:00', 'Asia/Kolkata');
    expect(morning.getHours()).toBe(9);
    expect(morning.getMinutes()).toBe(0);
    expect(morning.getUTCHours()).toBe(3);
    expect(morning.getUTCMinutes()).toBe(30);
  });
});

describe('@native-dates/plugins/legacy-date parity with Date', () => {
  const getters = [
    'getTime',
    'getFullYear',
    'getMonth',
    'getDate',
    'getDay',
    'getHours',
    'getMinutes',
    'getSeconds',
    'getMilliseconds',
    'getUTCFullYear',
    'getUTCMonth',
    'getUTCDate',
    'getUTCDay',
    'getUTCHours',
    'getUTCMinutes',
    'getUTCSeconds',
    'getUTCMilliseconds',
    'toISOString',
  ];

  // default-zone DateTime instances use the host timezone, matching native Date
  it('matches native Date across all getters in the host timezone', () => {
    const instants = [
      '2026-01-01T04:59:59.999Z',
      '2026-03-08T07:00:00.000Z',
      '2026-11-01T05:30:00.000Z',
      '2028-02-29T23:30:15.250Z',
    ];
    for (const instant of instants) {
      const parsed = datetime(instant);
      const native = new Date(instant);
      for (const getter of getters) {
        expect(parsed[getter](), `${getter}() at ${instant}`).toBe(native[getter]());
      }
    }
  });
});

describe('@native-dates/plugins/legacy-date toISOString()', () => {
  it('formats the instant in UTC with millisecond precision', () => {
    const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');
    expect(flight.toISOString()).toBe('2026-09-06T18:30:15.250Z');
  });

  it('truncates sub-millisecond digits without rounding up', () => {
    expect(datetime('2026-09-06T18:30:15.2509999Z').toISOString()).toBe('2026-09-06T18:30:15.250Z');
  });
});

describe('@native-dates/plugins/legacy-date toLocaleString(), toLocaleDateString(), and toLocaleTimeString()', () => {
  // Intl runtimes emit either an ASCII space or U+202F narrow no-break space before AM/PM
  it('formats in the DateTime zone rather than the host timezone', () => {
    expect(newYearInTokyo.toLocaleDateString('en-US')).toBe('1/1/2027');
    expect(newYearInTokyo.toLocaleTimeString('en-US')).toMatch(/^5:05:06\sAM$/);
    expect(newYearInTokyo.toLocaleString('en-US')).toMatch(/^1\/1\/2027, 5:05:06\sAM$/);
  });

  it('uses the locale attached to the DateTime instance', () => {
    expect(newYearInTokyo.locale('de-DE').toLocaleDateString()).toBe('1.1.2027');
    expect(newYearInTokyo.locale('de_DE').toLocaleDateString()).toBe('1.1.2027');
  });

  it('overrides the instance locale when a locales argument is passed', () => {
    expect(newYearInTokyo.locale('de-DE').toLocaleDateString('en-US')).toBe('1/1/2027');
  });

  it('overrides the DateTime zone when options.timeZone is passed', () => {
    expect(newYearInTokyo.toLocaleDateString('en-US', { timeZone: 'UTC' })).toBe('12/31/2026');
    expect(newYearInTokyo.toLocaleTimeString('en-US', { timeZone: 'UTC' })).toMatch(/^8:05:06\sPM$/);
  });

  it('keeps the DateTime zone when options omit timeZone', () => {
    const clock = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    expect(newYearInTokyo.toLocaleTimeString('en-US', clock)).toBe('05:05');
    expect(newYearInTokyo.toLocaleDateString('en-US', { dateStyle: 'short' })).toBe('1/1/27');
  });

  it('formats only the requested option fields in toLocaleString()', () => {
    const day = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    expect(newYearInTokyo.toLocaleString('en-US', day)).toBe('Friday, January 1, 2027');
  });

  it('overrides the DateTime zone in toLocaleString() when options.timeZone is passed', () => {
    expect(newYearInTokyo.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' })).toBe('Thursday');
  });

  it('uses the instance locale in toLocaleString() and toLocaleTimeString()', () => {
    const german = newYearInTokyo.locale('de-DE');
    expect(german.toLocaleString()).toBe('1.1.2027, 05:05:06');
    expect(german.toLocaleTimeString()).toBe('05:05:06');
  });

  it('falls back to the instance locale when the locales argument is undefined', () => {
    const german = newYearInTokyo.locale('de-DE');
    expect(german.toLocaleDateString(undefined, { month: 'long' })).toBe('Januar');
    expect(german.toLocaleString(undefined, { weekday: 'long' })).toBe('Freitag');
  });

  it.todo('uses configure({ locale }) when the DateTime instance has no locale');
});

describe('@native-dates/plugins/legacy-date setters', () => {
  const setters = [
    'setTime',
    'setFullYear',
    'setMonth',
    'setDate',
    'setHours',
    'setMinutes',
    'setSeconds',
    'setMilliseconds',
    'setUTCFullYear',
    'setUTCMonth',
    'setUTCDate',
    'setUTCHours',
    'setUTCMinutes',
    'setUTCSeconds',
    'setUTCMilliseconds',
  ];

  it('throws immutable at each setter name across all Date setters', () => {
    const reminder = datetime('2026-09-06T14:30Z');
    for (const setter of setters) {
      expect(() => reminder[setter](9), setter).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'immutable', at: setter }),
      );
    }
  });

  it('does not mutate the DateTime instance when a setter throws', () => {
    const reminder = datetime('2026-09-06T14:30', 'America/New_York');
    expect(() => reminder.setHours(9)).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'immutable', at: 'setHours' }),
    );
    expect(reminder.getHours()).toBe(14);
  });
});

describe('@native-dates/plugins/legacy-date Date identity', () => {
  it('is not instanceof Date and does not have the [object Date] tag', () => {
    const parsed = datetime('2026-09-06T14:30Z');
    expect(parsed instanceof Date).toBe(false);
    expect(Object.prototype.toString.call(parsed)).not.toBe('[object Date]');
  });
});
