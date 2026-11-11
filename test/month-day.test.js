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
    expect(dayMonth('1990-10-17').toString()).toBe('10-17');
    expect(dayMonth(date('1990-10-17')).toString()).toBe('10-17');
  });

  it('refuses a month or a day that does not exist, and says how it read the text', () => {
    expect(() => monthDay('17/10')).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('17/10')).toThrow(/reads as month 17, day 10. monthDay reads the month first, dayMonth/);
    expect(() => dayMonth('10/17')).toThrow(/reads as month 17, day 10/);
    expect(() => monthDay(2, 30)).toThrow(/unreadableMonthDay/);
    expect(() => monthDay(10.5, 17)).toThrow(/unreadableMonthDay/);
    expect(() => monthDay('garbage')).toThrow(/unreadableMonthDay/);
  });

  it('refuses a missing value, half of one, a date that never was, and a bad zone', () => {
    expect(() => monthDay()).toThrow(/notAMonthDay/);
    expect(() => monthDay(null)).toThrow(/notAMonthDay/);
    expect(() => monthDay(10)).toThrow(/notAMonthDay/);
    expect(() => monthDay({ year: 2027, month: 2, day: 29 })).toThrow(/unreadableDate/);
    expect(() => monthDay('10-17', 'Mars/Olympus')).toThrow(/unknownZone/);
  });

  it('reads only the ISO calendar, converting a date and refusing a month-day from another', () => {
    const hebrew = Temporal.PlainDate.from('2026-11-16[u-ca=hebrew]');
    expect(monthDay(hebrew).toString()).toBe('11-16');
    expect(() => monthDay(hebrew.toPlainMonthDay())).toThrow(/notAMonthDay/);
  });

  it('reads what Date reads when loose, and gives null for what it cannot', () => {
    expect(monthDay('Oct 17', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('October 17, 1990', { loose: true }).toString()).toBe('10-17');
    expect(monthDay('07.09.2026', { loose: true }).toString()).toBe('07-09');
    expect(dayMonth('07.09.2026', { loose: true }).toString()).toBe('09-07');
    expect(monthDay('nope', { loose: true })).toBeNull();
    expect(monthDay('17/10', { loose: true })).toBeNull();
    expect(monthDay(undefined, { loose: true })).toBeNull();
    expect(() => monthDay('10-17', { loose: true, zone: 'Mars/Olympus' })).toThrow(/unknownZone/);
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

  it('equals a date that is its occurrence that year, so a leap day answers to Feb 28', () => {
    const leapDay = monthDay('02-29');
    expect(leapDay.equals(date('2027-02-28'))).toBe(true);
    expect(leapDay.equals('2027-02-28')).toBe(true);
    expect(leapDay.equals('2028-02-28')).toBe(false);
    expect(leapDay.equals('2028-02-29')).toBe(true);
    expect(monthDay('02-28').equals('2028-02-29')).toBe(false);
    expect(monthDay('09-07').equals(datetime('2026-09-06T23:30Z').in('Asia/Tokyo'))).toBe(true);
    expect(monthDay('09-06').equals(new Date('2026-09-06T12:00:00Z'))).toBe(true);
  });

  it('equals another month-day with the same month and day, however it was written', () => {
    expect(monthDay('10-17').equals(dayMonth('17/10'))).toBe(true);
    expect(monthDay('10-17').equals('10/17')).toBe(true);
    expect(monthDay('10-17').equals({ month: 10, day: 17 })).toBe(true);
    expect(monthDay('02-29').equals('02-28')).toBe(false);
    expect(() => monthDay('10-17').equals('garbage')).toThrow(/unreadableMonthDay/);
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
