import { beforeEach, describe, it } from 'node:test';

import { compare, configure, date, datetime, IS_MONTH_DAY, kindOf, today } from 'native-dates';
import '@native-dates/plugins/loose';
import { dayMonth, isMonthDay, MonthDay, monthDay } from '@native-dates/plugins/month-day';

import { expect } from './helpers/expect.js';

beforeEach(() => {
  configure({ zone: 'UTC', locale: 'en-US', weekStart: 'monday' });
});

describe('monthDay', () => {
  it('reads text with a dash, a slash or a dot, two numbers, a fields object and a Temporal value', () => {
    expect(monthDay('10-17').toString()).toBe('10-17');
    expect(monthDay('--10-17').toString()).toBe('10-17');
    expect(monthDay('10/17').toString()).toBe('10-17');
    expect(monthDay('10.17').toString()).toBe('10-17');
    expect(monthDay(10, 17).toString()).toBe('10-17');
    expect(monthDay('10', '17').toString()).toBe('10-17');
    expect(monthDay({ month: 2, day: 29 }).toString()).toBe('02-29');
    expect(monthDay(Temporal.PlainMonthDay.from('10-17')).toString()).toBe('10-17');
  });

  it('drops the year of anything a date reads, in a zone when the input is a moment', () => {
    expect(monthDay('1990-10-17').toString()).toBe('10-17');
    expect(monthDay(date('1990-10-17')).toString()).toBe('10-17');
    expect(monthDay({ year: 2028, month: 2, day: 29 }).toString()).toBe('02-29');
    expect(monthDay(datetime('2026-09-06T23:30Z').in('Asia/Tokyo')).toString()).toBe('09-07');
    expect(monthDay(new Date('2026-09-06T23:30:00Z'), 'Asia/Tokyo').toString()).toBe('09-07');
    expect(monthDay(new Date('2026-09-06T23:30:00Z'), { zone: 'Asia/Tokyo' }).toString()).toBe('09-07');
  });

  it('reads the same value day first through dayMonth, the word deciding the order', () => {
    expect(dayMonth('17/10').equals(monthDay('10/17'))).toBe(true);
    expect(dayMonth('17.10').toString()).toBe('10-17');
    expect(dayMonth(17, 10).toString()).toBe('10-17');
    expect(dayMonth('10/11').toString()).toBe('11-10');
    expect(monthDay('10/11').toString()).toBe('10-11');
    configure({ dayFirst: true });
    expect(monthDay('10/11').toString()).toBe('10-11');
    configure({ dayFirst: false });
  });

  it('reads ISO text and a whole date in their one order, whichever word reads them', () => {
    expect(dayMonth('--10-17').toString()).toBe('10-17');
    expect(dayMonth('--1017').toString()).toBe('10-17');
    expect(() => monthDay('--10/17')).toThrow(/unreadableMonthDay/);
    expect(dayMonth('10-17').toString()).toBe('10-17');
    expect(dayMonth('1990-10-17').toString()).toBe('10-17');
    expect(dayMonth(date('1990-10-17')).toString()).toBe('10-17');
    expect(() => dayMonth('17-10')).toThrow(/unreadableMonthDay/);
  });

  it('reads a dash as people write it by the word, where it is not two digits a side', () => {
    expect(dayMonth('5-6').toString()).toBe('06-05');
    expect(dayMonth('5/6').toString()).toBe('06-05');
    expect(monthDay('5-6').toString()).toBe('05-06');
    expect(dayMonth('17-5').toString()).toBe('05-17');
    expect(dayMonth('05-06').toString()).toBe('05-06');
  });

  it('reads back what it serializes under either word', () => {
    const written = JSON.parse(JSON.stringify(monthDay('05-06')));
    expect(written).toBe('05-06');
    expect(monthDay(written).toString()).toBe('05-06');
    expect(dayMonth(written).toString()).toBe('05-06');
    expect(dayMonth(monthDay('10-17').toJSON()).toString()).toBe('10-17');
  });

  it('refuses a month or a day that does not exist, and says how it read the text', () => {
    expect(() => monthDay('17/10')).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('17/10')).toThrow(/reads as month 17, day 10. monthDay reads the month first and dayMonth/);
    expect(() => dayMonth('10/17')).toThrow(/reads as month 17, day 10/);
    expect(() => monthDay(2, 30)).toThrow(/unreadableMonthDay/);
    expect(() => monthDay(10.5, 17)).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('garbage')).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('Oct 17')).toThrow(/unreadableMonthDay/);
  });

  it('refuses a part that is not a whole number or not a part of it, as a number or as text', () => {
    expect(monthDay({ month: '10', day: '17' }).toString()).toBe('10-17');
    expect(() => monthDay({ month: '10.9', day: '17.9' })).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('10.9', '17')).toThrow(/unreadableMonthDay/);
    expect(() => monthDay({ month: 10, day: true })).toThrow(/unreadableMonthDay/);
    expect(() => monthDay({ month: 10, day: 17, minute: 5 })).toThrow(/unreadableMonthDay/);
    expect(() => monthDay({ month: 10 })).toThrow(/unreadableMonthDay/);
  });

  it('refuses a missing value, half of one, and a bad zone', () => {
    expect(() => monthDay()).toThrow(/notAMonthDay/);
    expect(() => monthDay(null)).toThrow(/notAMonthDay/);
    expect(() => monthDay(10)).toThrow(/notAMonthDay/);
    expect(() => monthDay('10-17', 'Mars/Olympus')).toThrow(/unknownZone/);
  });

  it('refuses a date that never was as a date, written as text or as fields', () => {
    expect(() => monthDay('2027-02-29')).toThrow(/unreadableDate/);
    expect(() => monthDay({ year: 2027, month: 2, day: 29 })).toThrow(/unreadableDate/);
    expect(() => monthDay('2026-09-06T23:30:00Z')).toThrow(/notADate/);
  });

  it('reads only the ISO calendar, converting a date and refusing a month-day from another', () => {
    const hebrew = Temporal.PlainDate.from('2026-11-16[u-ca=hebrew]');
    expect(monthDay(hebrew).toString()).toBe('11-16');
    expect(() => monthDay(hebrew.toPlainMonthDay())).toThrow(/notAMonthDay/);
  });

  it('gives null when loose for what it cannot read, and still refuses a bad zone', () => {
    expect(monthDay('nope', { loose: true })).toBeNull();
    expect(monthDay('17/10', { loose: true })).toBeNull();
    expect(monthDay(undefined, { loose: true })).toBeNull();
    expect(() => monthDay('10-17', { loose: true, zone: 'Mars/Olympus' })).toThrow(/unknownZone/);
  });

  it('reads a month by name and a day when loose, in either order, the leap day included', () => {
    expect(monthDay('Oct 17', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('october 17', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('17 Oct.', { loose: true }).toString()).toBe('10-17');
    expect(dayMonth('17 October', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('Sept 5', { loose: true }).toString()).toBe('09-05');
    expect(monthDay('Oct 17th', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('October 17,', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('1st May', { loose: true }).toString()).toBe('05-01');
    expect(monthDay('Feb 29', { loose: true }).toString()).toBe('02-29');
    expect(dayMonth('29 February', { loose: true }).toString()).toBe('02-29');
  });

  it('never puts loose text to Date, which makes up what text leaves out, so anything else is null', () => {
    for (const text of ['Feb 30', 'Apr 31', 'Octopus 17', '5', '1', '1017', '2026', '2026-11', 'Oct 2026']) {
      expect(monthDay(text, { loose: true })).toBeNull();
    }
    for (const text of ['Feb 29 10:00 +0000', 'Feb 29 0900', 'Feb 29, 10:00:00.0000', 'Dec 31 23:30 -1200']) {
      expect(monthDay(text, { loose: true })).toBeNull();
    }
  });

  it('leaves a date written loosely to date(), which hands over its month-day', () => {
    for (const text of ['October 17, 1990', '10/17/90', 'Oct 17, 90', 'Feb 29th 2028', '07.09.2026']) {
      expect(monthDay(text, { loose: true })).toBeNull();
    }
    expect(date('October 17, 1990', { loose: true }).monthDay.toString()).toBe('10-17');
    expect(date('07.09.2026', { loose: true, dayFirst: true }).monthDay.toString()).toBe('09-07');
  });

  it('reads an ISO date as strictly when loose, so a day that never was is null and never the day after', () => {
    expect(monthDay('1990-10-17', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('1990-10-17T09:30', { loose: true }).toString()).toBe('10-17');
    for (const text of ['2027-02-29', '2027-02-29T10:00', '2026-04-31 12:00', '2026-10-17T24:00']) {
      expect(monthDay(text, { loose: true })).toBeNull();
    }
    expect(monthDay(Temporal.PlainDate.from('1990-10-17'), { loose: true }).toString()).toBe('10-17');
    expect(monthDay(Temporal.PlainDate.from('1990-10-17'), 'UTC').toString()).toBe('10-17');
  });

  it('leaves an instant to datetime(), which says which day it falls on in a zone', () => {
    expect(() => monthDay('2026-10-17T23:30:00Z')).toThrow(/notADate/);
    expect(monthDay('2026-10-17T23:30:00Z', { loose: true, zone: 'Asia/Tokyo' })).toBeNull();
    expect(datetime('2026-10-17T23:30:00Z', 'Asia/Tokyo').monthDay.toString()).toBe('10-18');
  });

  it('leads with its text and prints its parts', () => {
    const birthday = monthDay('10-17');
    expect(Object.keys(birthday)).toEqual(['text', 'month', 'day']);
    expect(birthday.text).toBe('Oct 17');
    expect(birthday.month).toBe(10);
    expect(birthday.day).toBe(17);
    expect(Object.isFrozen(birthday)).toBe(true);
    expect(monthDay(birthday)).toBe(birthday);
  });

  it('falls on a date in a year, and on Feb 28 when the year has no Feb 29', () => {
    expect(monthDay('10-17').in(2027).toString()).toBe('2027-10-17');
    expect(monthDay('10-17').in('2027').toString()).toBe('2027-10-17');
    expect(monthDay('02-29').in(2028).toString()).toBe('2028-02-29');
    expect(monthDay('02-29').in(2027).toString()).toBe('2027-02-28');
    expect(() => monthDay('10-17').in(2027.5)).toThrow(/unreadableDate/);
    expect(() => monthDay('10-17').in()).toThrow(/unreadableDate/);
  });

  it('falls on a date that is its occurrence that year, so a leap day falls on Feb 28', () => {
    const leapDay = monthDay('02-29');
    expect(leapDay.fallsOn(date('2027-02-28'))).toBe(true);
    expect(leapDay.fallsOn('2027-02-28')).toBe(true);
    expect(leapDay.fallsOn('2028-02-28')).toBe(false);
    expect(leapDay.fallsOn('2028-02-29')).toBe(true);
    expect(monthDay('02-28').fallsOn('2028-02-29')).toBe(false);
    expect(monthDay('09-07').fallsOn(datetime('2026-09-06T23:30Z').in('Asia/Tokyo'))).toBe(true);
    expect(monthDay('09-06').fallsOn(new Date('2026-09-06T12:00:00Z'))).toBe(true);
    expect(monthDay('01-01').fallsOn('-271821-04-20')).toBe(false);
    expect(() => leapDay.fallsOn('02-28')).toThrow(/unreadableDate/);
  });

  it('equals the same month and day, however it was made, and a date as the month and day it is', () => {
    expect(monthDay('10-17').equals(dayMonth('17/10'))).toBe(true);
    expect(monthDay('10-17').equals('10-17')).toBe(true);
    expect(monthDay('10-17').equals('--10-17')).toBe(true);
    expect(monthDay('10-17').equals({ month: 10, day: 17 })).toBe(true);
    expect(monthDay('10-17').equals(new Temporal.PlainMonthDay(10, 17, 'iso8601', 2000))).toBe(true);
    expect(monthDay('10-17').equals(date('1990-10-17'))).toBe(true);
    expect(monthDay('02-29').equals('02-28')).toBe(false);
    expect(() => monthDay('10-17').equals('garbage')).toThrow(/unreadableMonthDay/);
  });

  it('equals the same either way round, where falling on a date is a question about that year', () => {
    const [leap, common] = ['2000-02-29', '1999-02-28'];
    expect(monthDay(leap).equals(common)).toBe(false);
    expect(monthDay(common).equals(leap)).toBe(false);
    expect(monthDay(leap).equals(monthDay(common))).toBe(false);
    expect(monthDay(leap).fallsOn(common)).toBe(true);
    expect(monthDay(common).fallsOn(leap)).toBe(false);
  });

  it('refuses to equal text as people write it, which has an order only under the word that read it', () => {
    expect(() => dayMonth('05/10').equals('05/10')).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('10/17').equals('10.17')).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('5-6').equals('5-6')).toThrow(/unreadableMonthDay/);
    expect(dayMonth('05/10').equals(dayMonth('05/10'))).toBe(true);
    expect(dayMonth('05/10').equals(monthDay('05/10'))).toBe(false);
  });

  it('knows when it is today, tomorrow or yesterday', () => {
    expect(today().monthDay.isToday()).toBe(true);
    expect(today().monthDay.isTomorrow()).toBe(false);
    expect(today().plus(1, 'day').monthDay.isTomorrow()).toBe(true);
    expect(today().minus(1, 'day').monthDay.isYesterday()).toBe(true);
    expect(today('Pacific/Kiritimati').monthDay.isToday('Pacific/Kiritimati')).toBe(true);
  });

  it('is handed over by a date and by a datetime in its zone', () => {
    expect(date('1990-10-17').monthDay.toString()).toBe('10-17');
    expect(datetime('2026-09-06T23:30Z').in('Asia/Tokyo').monthDay.toString()).toBe('09-07');
    expect(date('1990-10-17').monthDay).toBeInstanceOf(MonthDay);
  });

  it('is the next and previous occurrence around a date, the date itself never counting', () => {
    const birthday = monthDay('10-17');
    expect(date('2026-10-16').next(birthday).toString()).toBe('2026-10-17');
    expect(date('2026-10-17').next(birthday).toString()).toBe('2027-10-17');
    expect(date('2026-11-11').next(birthday).toString()).toBe('2027-10-17');
    expect(date('2026-11-11').previous(birthday).toString()).toBe('2026-10-17');
    expect(date('2026-10-17').previous(birthday).toString()).toBe('2025-10-17');
    expect(date('2026-11-11').until(date('2026-11-11').next(monthDay('12-25')), 'days')).toBe(44);
  });

  it('finds its own occurrence after a day or before it, which is what next and previous ask', () => {
    const birthday = monthDay('10-17');
    expect(birthday.after('2026-10-16').toString()).toBe('2026-10-17');
    expect(birthday.after(date('2026-10-17')).toString()).toBe('2027-10-17');
    expect(birthday.before('2026-10-17').toString()).toBe('2025-10-17');
    expect(birthday.after(datetime('2026-11-11T23:30Z').in('Asia/Tokyo')).toString()).toBe('2027-10-17');
    expect(() => birthday.after('10-17')).toThrow(/unreadableDate/);
  });

  it('steps a leap day through the years that have none', () => {
    const leapDay = monthDay('02-29');
    expect(date('2027-02-27').next(leapDay).toString()).toBe('2027-02-28');
    expect(date('2027-02-28').next(leapDay).toString()).toBe('2028-02-29');
    expect(date('2028-03-01').previous(leapDay).toString()).toBe('2028-02-29');
    expect(date('2027-03-01').previous(leapDay).toString()).toBe('2027-02-28');
  });

  it('steps a datetime to the occurrence with its clock kept across a daylight saving change', () => {
    const morning = datetime('2026-11-11T09:30', 'America/New_York');
    expect(morning.next(monthDay('03-08')).toTemporal().toString()).toBe('2027-03-08T09:30:00-05:00[America/New_York]');
    expect(morning.previous(monthDay('07-04')).toTemporal().toString()).toBe(
      '2026-07-04T09:30:00-04:00[America/New_York]',
    );
  });

  it('steps into the year beside the first and the last one Temporal counts, where its dates run out', () => {
    expect(date('+275760-01-01').previous(monthDay('12-25')).toString()).toBe('+275759-12-25');
    expect(date('-271821-12-31').next(monthDay('01-15')).toString()).toBe('-271820-01-15');
    expect(() => date('+275760-01-01').next(monthDay('12-25'))).toThrow(/unreadableDate/);
  });

  it('steps from a date in another calendar by its ISO year', () => {
    const hebrew = date(Temporal.PlainDate.from('2026-11-16[u-ca=hebrew]'));
    expect(hebrew.next(monthDay('12-25')).toString()).toBe('2026-12-25');
    expect(hebrew.previous(monthDay('12-25')).toString()).toBe('2025-12-25');
  });

  it('leaves next and previous stepping to a weekday as they did', () => {
    expect(date('2026-09-06').next('monday').toString()).toBe('2026-09-07');
    expect(date('2026-09-06').previous(5).toString()).toBe('2026-09-04');
    expect(datetime('2026-09-06T10:00Z').next('monday').toString()).toBe('2026-09-07T10:00:00.000Z');
    expect(() => date('2026-09-06').next('someday')).toThrow(/unknownWeekday/);
  });

  it('formats by preset or Intl options in the order the locale writes', () => {
    const leapDay = monthDay('02-29');
    expect(leapDay.format()).toBe('Feb 29');
    expect(leapDay.format('short')).toBe('2/29');
    expect(leapDay.format('long')).toBe('February 29');
    expect(leapDay.format('long', 'de')).toBe('29. Februar');
    expect(leapDay.format('short', 'en-GB')).toBe('29/02');
    expect(leapDay.format({ month: 'long', day: '2-digit' })).toBe('February 29');
  });

  it('refuses a format that needs the year it does not have', () => {
    expect(() => monthDay('10-17').format({ dateStyle: 'long' })).toThrow(/noField/);
    expect(() => monthDay('10-17').format({ weekday: 'long', month: 'long', day: 'numeric' })).toThrow(/noField/);
    expect(() => monthDay('10-17').format('full')).toThrow(/unknownFormat/);
    expect(monthDay('10-17').in(2027).format('full')).toBe('Sunday, October 17, 2027');
  });

  it('refuses a clock or a zone, which it has no more than a year', () => {
    expect(() => monthDay('10-17').format({ timeStyle: 'short' })).toThrow(/noField/);
    expect(() => monthDay('10-17').format({ month: 'long', day: 'numeric', hour: 'numeric' })).toThrow(/noField/);
    expect(() => monthDay('10-17').format({ month: 'long', timeZoneName: 'short' })).toThrow(/noField/);
  });

  it('prints the Gregorian months where the locale keeps a calendar with others, since its day there moves each year', () => {
    const birthday = monthDay('10-17');
    expect(birthday.format('long', 'en-u-ca-hebrew')).toBe('October 17');
    expect(birthday.format('long', 'fa-IR')).toBe(
      date('2027-10-17').format({ month: 'long', day: 'numeric', calendar: 'gregory' }, 'fa-IR'),
    );
    expect(() => birthday.format({ month: 'long', day: 'numeric', calendar: 'hebrew' })).toThrow(/unknownFormat/);
    expect(birthday.in(2027).format({ month: 'long', day: 'numeric', calendar: 'hebrew' })).toBe('16 Tishri');
  });

  it('prints in a calendar that keeps the Gregorian months, as a date in that locale does', () => {
    const birthday = monthDay('10-17');
    const options = { month: 'long', day: 'numeric' };
    expect(birthday.format('long', 'th-TH')).toBe(date('2027-10-17').format(options, 'th-TH'));
    expect(birthday.format({ ...options, calendar: 'buddhist' })).toBe('October 17');
    expect(birthday.format({ ...options, calendar: 'japanese' })).toBe('October 17');
    // Intl has no month names for the ISO calendar, whose months are the Gregorian ones
    expect(birthday.format({ ...options, calendar: 'iso8601' })).toBe('October 17');
  });

  it('takes a preset an app adds', () => {
    MonthDay.presets.card = { month: '2-digit', day: '2-digit' };
    expect(monthDay('3/7').format('card')).toBe('03/07');
    delete MonthDay.presets.card;
  });

  it('serializes to ISO and reads back', () => {
    const birthday = monthDay('02-29');
    expect(String(birthday)).toBe('02-29');
    expect(JSON.stringify({ birthday })).toBe('{"birthday":"02-29"}');
    expect(monthDay(JSON.parse(JSON.stringify(birthday))).equals(birthday)).toBe(true);
    expect(birthday.toTemporal()).toBeInstanceOf(Temporal.PlainMonthDay);
  });

  it('names its kind and answers to its brand', () => {
    const birthday = monthDay('10-17');
    expect(kindOf(birthday)).toBe('monthDay');
    expect(isMonthDay(birthday)).toBe(true);
    expect(isMonthDay(date('2026-10-17'))).toBe(false);
    expect(birthday).toBeInstanceOf(MonthDay);
    expect(birthday[IS_MONTH_DAY]).toBe(true);
    expect({ [IS_MONTH_DAY]: true }).toBeInstanceOf(MonthDay);
  });

  it('is not a number and has no order, since Dec 25 is neither before nor after Jan 1', () => {
    expect(() => monthDay('10-17') < monthDay('10-18')).toThrow(/notANumber/);
    expect(() => compare(monthDay('10-17'), monthDay('10-18'))).toThrow(/notAPoint/);
  });
});
