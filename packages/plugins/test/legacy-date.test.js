import '@native-dates/plugins/legacy-date';
import { datetime } from 'native-dates';
import { describe, expect, it } from 'vitest';

// 5:05am on Friday January 1 2027 in Tokyo, while UTC and every zone west of it are still on Thursday December 31
const newYearInTokyo = datetime('2026-12-31T20:05:06.007Z', 'Asia/Tokyo');

describe('legacy-date getters in the zone of the datetime', () => {
  it('reads the calendar and the clock in the zone of the datetime, never the zone of the machine', () => {
    expect(newYearInTokyo.getFullYear()).toBe(2027);
    expect(newYearInTokyo.getMonth()).toBe(0);
    expect(newYearInTokyo.getDate()).toBe(1);
    expect(newYearInTokyo.getDay()).toBe(5);
    expect(newYearInTokyo.getHours()).toBe(5);
    expect(newYearInTokyo.getMinutes()).toBe(5);
    expect(newYearInTokyo.getSeconds()).toBe(6);
    expect(newYearInTokyo.getMilliseconds()).toBe(7);
  });

  it('numbers months from 0 and days of the week from Sunday as 0, as Date does', () => {
    const sunday = datetime('2026-09-06T14:30', 'America/New_York');
    expect(sunday).toMatchObject({ month: 9, dayOfWeek: 7 });
    expect(sunday.getMonth()).toBe(8);
    expect(sunday.getDay()).toBe(0);

    const saturday = datetime('2026-12-05T14:30', 'America/New_York');
    expect(saturday.getMonth()).toBe(11);
    expect(saturday.getDay()).toBe(6);
  });

  it('getTime() is the count of milliseconds since 1970', () => {
    const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');
    expect(flight.getTime()).toBe(Date.UTC(2026, 8, 6, 18, 30, 15, 250));
    expect(flight.getTime()).toBe(flight.epochMilliseconds);
  });

  it('getTimezoneOffset() counts the minutes the zone is behind UTC at that moment', () => {
    expect(datetime('2026-09-06T14:30', 'America/New_York').getTimezoneOffset()).toBe(240);
    expect(datetime('2026-01-06T14:30', 'America/New_York').getTimezoneOffset()).toBe(300);
    expect(datetime('2026-01-06T09:00', 'Asia/Kolkata').getTimezoneOffset()).toBe(-330);
    expect(datetime('2026-01-06T09:00', '+05:30').getTimezoneOffset()).toBe(-330);
  });

  // how a form fills <input type="datetime-local"> from a Date
  it('gives the wall clock of its zone to code that shifts getTime() by getTimezoneOffset()', () => {
    const afternoon = datetime('2026-09-06T14:30', 'Asia/Tokyo');
    const shifted = new Date(afternoon.getTime() - afternoon.getTimezoneOffset() * 60_000);
    expect(shifted.toISOString().slice(0, 16)).toBe('2026-09-06T14:30');
  });

  it.todo('getTimezoneOffset() answers 0, never -0, for a zone on UTC');
});

describe('legacy-date UTC getters', () => {
  it('reads the calendar and the clock in UTC, whatever the zone of the datetime', () => {
    expect(newYearInTokyo.getUTCFullYear()).toBe(2026);
    expect(newYearInTokyo.getUTCMonth()).toBe(11);
    expect(newYearInTokyo.getUTCDate()).toBe(31);
    expect(newYearInTokyo.getUTCDay()).toBe(4);
    expect(newYearInTokyo.getUTCHours()).toBe(20);
    expect(newYearInTokyo.getUTCMinutes()).toBe(5);
    expect(newYearInTokyo.getUTCSeconds()).toBe(6);
    expect(newYearInTokyo.getUTCMilliseconds()).toBe(7);
  });

  it('reads 9:00 in Kolkata as 3:30 in UTC', () => {
    const morning = datetime('2026-01-06T09:00', 'Asia/Kolkata');
    expect(morning.getHours()).toBe(9);
    expect(morning.getMinutes()).toBe(0);
    expect(morning.getUTCHours()).toBe(3);
    expect(morning.getUTCMinutes()).toBe(30);
  });
});

describe('legacy-date getters beside a native Date', () => {
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

  // a datetime made with no zone is in the zone of the machine, the one a Date reads its own fields in
  it('answers each getter as the Date for the same instant does in the zone of the machine', () => {
    const instants = [
      '2026-01-01T04:59:59.999Z',
      '2026-03-08T07:00:00.000Z',
      '2026-11-01T05:30:00.000Z',
      '2028-02-29T23:30:15.250Z',
    ];
    for (const instant of instants) {
      const moment = datetime(instant);
      const native = new Date(instant);
      for (const getter of getters) {
        expect(moment[getter](), `${getter}() at ${instant}`).toBe(native[getter]());
      }
    }
  });
});

describe('legacy-date toISOString()', () => {
  it('prints the moment in UTC to the millisecond', () => {
    const flight = datetime('2026-09-06T14:30:15.250', 'America/New_York');
    expect(flight.toISOString()).toBe('2026-09-06T18:30:15.250Z');
  });

  it('cuts the digits finer than a millisecond without rounding up', () => {
    expect(datetime('2026-09-06T18:30:15.2509999Z').toISOString()).toBe('2026-09-06T18:30:15.250Z');
  });
});

describe('legacy-date toLocaleString(), toLocaleDateString() and toLocaleTimeString()', () => {
  // ICU has put both a plain space and a narrow no-break space before AM, so the patterns take either
  it('formats in the zone of the datetime, never the zone of the machine', () => {
    expect(newYearInTokyo.toLocaleDateString('en-US')).toBe('1/1/2027');
    expect(newYearInTokyo.toLocaleTimeString('en-US')).toMatch(/^5:05:06\sAM$/);
    expect(newYearInTokyo.toLocaleString('en-US')).toMatch(/^1\/1\/2027, 5:05:06\sAM$/);
  });

  it('formats in the locale the datetime carries', () => {
    expect(newYearInTokyo.locale('de-DE').toLocaleDateString()).toBe('1.1.2027');
    expect(newYearInTokyo.locale('de_DE').toLocaleDateString()).toBe('1.1.2027');
  });

  it('takes a locale argument over the locale the datetime carries', () => {
    expect(newYearInTokyo.locale('de-DE').toLocaleDateString('en-US')).toBe('1/1/2027');
  });

  it('takes a timeZone option over the zone of the datetime', () => {
    expect(newYearInTokyo.toLocaleDateString('en-US', { timeZone: 'UTC' })).toBe('12/31/2026');
    expect(newYearInTokyo.toLocaleTimeString('en-US', { timeZone: 'UTC' })).toMatch(/^8:05:06\sPM$/);
  });

  it('keeps the zone of the datetime when the options name no timeZone', () => {
    const clock = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    expect(newYearInTokyo.toLocaleTimeString('en-US', clock)).toBe('05:05');
    expect(newYearInTokyo.toLocaleDateString('en-US', { dateStyle: 'short' })).toBe('1/1/27');
  });

  it.todo('keeps the zone of the datetime when the options carry timeZone: undefined');
  it.todo('formats in the configured locale when the datetime carries none');
});

describe('legacy-date setters', () => {
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

  it('throws immutable from every Date setter, at the name of the setter', () => {
    const reminder = datetime('2026-09-06T14:30Z');
    for (const setter of setters) {
      expect(() => reminder[setter](9), setter).toThrowError(
        expect.objectContaining({ code: 'immutable', at: setter }),
      );
    }
  });

  it('leaves the datetime as it was after a setter throws', () => {
    const reminder = datetime('2026-09-06T14:30', 'America/New_York');
    expect(() => reminder.setHours(9)).toThrowError(expect.objectContaining({ code: 'immutable' }));
    expect(reminder.getHours()).toBe(14);
  });

  it('names set() in the explanation a development build gives', () => {
    const reminder = datetime('2026-09-06T14:30Z');
    expect(() => reminder.setHours(9)).toThrowError(
      expect.objectContaining({ message: expect.stringMatching(/\n.*\.set\(/) }),
    );
  });
});

describe('legacy-date beside Date identity checks', () => {
  it('is neither an instance of Date nor tagged as one', () => {
    const moment = datetime('2026-09-06T14:30Z');
    expect(moment instanceof Date).toBe(false);
    expect(Object.prototype.toString.call(moment)).not.toBe('[object Date]');
  });
});
