import { configure, date, datetime, weekdayNames } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

// the configured locale and week start belong to the whole process, so each test hands the defaults back
afterEach(() => {
  configure({ locale: null, weekStart: null });
});

// 2026-11-18 is a Wednesday, and the Sunday before it is the 15th
const wednesday = date('2026-11-18');

describe('first day of the week by locale', () => {
  it.each([
    ['en-US', 'Sunday', '2026-11-15'],
    ['de-DE', 'Monday', '2026-11-16'],
    ['ar-EG', 'Saturday', '2026-11-14'],
  ])('starts the week of a date carrying %s on %s', (tag, day, start) => {
    expect(wednesday.locale(tag).startOf('week').toString()).toBe(start);
  });

  it('reports the day as weekStart on a date and a datetime, from 1 for Monday to 7 for Sunday', () => {
    expect(wednesday.locale('en-US').weekStart).toBe(7);
    expect(wednesday.locale('de-DE').weekStart).toBe(1);
    expect(wednesday.locale('ar-EG').weekStart).toBe(6);
    expect(datetime('2026-11-18T14:45', 'UTC').locale('en-US').weekStart).toBe(7);
  });

  it('reads the day from the region of the tag and from its -u-fw- extension', () => {
    expect(wednesday.locale('en-GB').weekStart).toBe(1);
    expect(wednesday.locale('en-GB-u-fw-sun').weekStart).toBe(7);
  });

  // the platform fills in the likeliest region, the United States for en, France for fr and Japan for ja
  it('reads the day for a language written with no region', () => {
    expect(wednesday.locale('en').weekStart).toBe(7);
    expect(wednesday.locale('fr').weekStart).toBe(1);
    expect(wednesday.locale('ja').weekStart).toBe(7);
  });

  it('takes the day from the first language in a list or an Accept-Language header', () => {
    expect(wednesday.locale(['en-US', 'de-DE']).weekStart).toBe(7);
    expect(wednesday.locale('de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7').weekStart).toBe(1);
  });

  it('starts the week of a datetime at midnight of that day in its own zone', () => {
    const afternoon = datetime('2026-11-18T14:45', 'America/New_York').locale('en-US');
    expect(afternoon.startOf('week').toString()).toBe('2026-11-15T05:00:00.000Z');
  });

  // de-DE and en-US start their weeks a day apart, so one of them is never the locale of the machine running the test
  it('starts, ends and reports the week of a datetime by the locale it carries', () => {
    const afternoon = datetime('2026-11-18T14:45', 'UTC');
    expect(afternoon.locale('de-DE').weekStart).toBe(1);
    expect(afternoon.locale('de-DE').startOf('week').toString()).toBe('2026-11-16T00:00:00.000Z');
    expect(afternoon.locale('de-DE').endOf('week').toString()).toBe('2026-11-22T23:59:59.999Z');
    expect(afternoon.locale('en-US').startOf('week').toString()).toBe('2026-11-15T00:00:00.000Z');
    expect(afternoon.locale('en-US').range('week').toString()).toBe(
      '2026-11-15T00:00:00.000Z/2026-11-22T00:00:00.000Z',
    );
  });

  it('ends the week six days after it starts', () => {
    expect(wednesday.locale('en-US').endOf('week').toString()).toBe('2026-11-21');
    expect(wednesday.locale('de-DE').endOf('week').toString()).toBe('2026-11-22');
    expect(wednesday.locale('en-US').range('week').toString()).toBe('2026-11-15/2026-11-21');
  });

  it('puts that day first in weekdayNames(), so a header row lines up with the week', () => {
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Sun');
    expect(weekdayNames('short', undefined, 'en-GB')[0]).toBe('Mon');
  });

  // a runtime may ship Temporal with no week data, which leaves Intl.Locale without getWeekInfo()
  it('starts every week on Monday when the runtime has no week data', () => {
    const { getWeekInfo } = Intl.Locale.prototype;
    delete Intl.Locale.prototype.getWeekInfo;
    try {
      expect(wednesday.locale('he-IL').weekStart).toBe(1);
    }
    finally {
      Intl.Locale.prototype.getWeekInfo = getWeekInfo;
    }
  });
});

describe('first day of the week precedence', () => {
  it('follows the configured locale when the value carries none', () => {
    configure({ locale: 'de-DE' });
    expect(wednesday.startOf('week').toString()).toBe('2026-11-16');
    expect(wednesday.weekStart).toBe(1);
    expect(weekdayNames()).toEqual(weekdayNames('short', 'monday'));
  });

  it('follows the locale a value carries over the configured locale', () => {
    configure({ locale: 'de-DE' });
    expect(wednesday.locale('en-US').startOf('week').toString()).toBe('2026-11-15');
  });

  it('follows configure({ weekStart }) over every locale', () => {
    configure({ locale: 'de-DE', weekStart: 'saturday' });
    expect(wednesday.startOf('week').toString()).toBe('2026-11-14');
    expect(wednesday.locale('en-US').startOf('week').toString()).toBe('2026-11-14');
    expect(wednesday.locale('en-US').weekStart).toBe(6);
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Sat');
  });

  it('follows a day passed to the call over configure({ weekStart }) and every locale', () => {
    configure({ locale: 'de-DE', weekStart: 'saturday' });
    const american = wednesday.locale('en-US');
    expect(american.startOf('week', 'monday').toString()).toBe('2026-11-16');
    expect(american.endOf('week', 'monday').toString()).toBe('2026-11-22');
    expect(american.range('week', 'monday').toString()).toBe('2026-11-16/2026-11-22');
    expect(weekdayNames('short', 'monday', 'en-US')[0]).toBe('Mon');
  });

  it('follows the locale when the day passed to the call is undefined', () => {
    expect(wednesday.locale('en-US').startOf('week', undefined).toString()).toBe('2026-11-15');
  });

  it.todo('follows the locale when the day passed to the call is null');
});

describe('isSame() by week', () => {
  // Sunday the 15th is in the week of the 18th for en-US and in the week before it for de-DE
  it('judges both days by the week of the value it is called on', () => {
    const sunday = date('2026-11-15');
    expect(wednesday.locale('en-US').isSame(sunday.locale('de-DE'), 'week')).toBe(true);
    expect(wednesday.locale('de-DE').isSame(sunday.locale('en-US'), 'week')).toBe(false);
  });

  it('judges two datetimes by the week of the one it is called on', () => {
    const wednesdayNoon = datetime('2026-11-18T12:00', 'UTC');
    const sundayNoon = datetime('2026-11-15T12:00', 'UTC');
    expect(wednesdayNoon.locale('en-US').isSame(sundayNoon.locale('de-DE'), 'week')).toBe(true);
    expect(wednesdayNoon.locale('de-DE').isSame(sundayNoon.locale('en-US'), 'week')).toBe(false);
  });

  it('judges by the day passed to the call when one is given', () => {
    expect(wednesday.locale('en-US').isSame('2026-11-15', 'week', 'monday')).toBe(false);
  });
});

describe('weekOfYear and the W token', () => {
  it('count ISO weeks from Monday whatever the first day of the week is', () => {
    configure({ weekStart: 'sunday' });
    expect(date('2026-11-15').weekOfYear).toBe(46);
    expect(date('2026-11-16').weekOfYear).toBe(47);
    expect(date('2026-11-15').format('W')).toBe('46');
    expect(datetime('2026-11-15T12:00', 'UTC').weekOfYear).toBe(46);
  });
});
