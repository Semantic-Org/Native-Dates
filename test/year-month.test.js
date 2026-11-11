import { beforeEach, describe, it } from 'node:test';

import { compare, configure, date, datetime, days, IS_YEAR_MONTH, kindOf, months, today } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/ranges';
import '@native-dates/plugins/tokens';
import { isYearMonth, YearMonth, yearMonth } from '@native-dates/plugins/year-month';

import { expect } from './helpers/expect.js';

beforeEach(() => {
  configure({ zone: 'UTC', locale: 'en-US', weekStart: 'monday' });
});

describe('yearMonth', () => {
  it('reads ISO text, two numbers, a fields object and a Temporal value', () => {
    expect(yearMonth('2026-11').toString()).toBe('2026-11');
    expect(yearMonth(2026, 11).toString()).toBe('2026-11');
    expect(yearMonth('2026', '11').toString()).toBe('2026-11');
    expect(yearMonth({ year: 2026, month: 2 }).toString()).toBe('2026-02');
    expect(yearMonth(Temporal.PlainYearMonth.from('2026-11')).toString()).toBe('2026-11');
    expect(yearMonth('-000043-03').year).toBe(-43);
  });

  it('drops the day of anything a date reads, in a zone when the input is a moment', () => {
    expect(yearMonth('2026-11-16').toString()).toBe('2026-11');
    expect(yearMonth(date('2026-11-16')).toString()).toBe('2026-11');
    expect(yearMonth({ year: 2026, month: 11, day: 16 }).toString()).toBe('2026-11');
    expect(yearMonth(datetime('2026-10-31T23:30Z').in('Asia/Tokyo')).toString()).toBe('2026-11');
    expect(yearMonth(new Date('2026-10-31T23:30:00Z'), 'Asia/Tokyo').toString()).toBe('2026-11');
    expect(yearMonth(new Date('2026-10-31T23:30:00Z'), { zone: 'Asia/Tokyo' }).toString()).toBe('2026-11');
  });

  it('is what date() gives for a year and a month with no day', () => {
    expect(date(2026, 11)).toBeInstanceOf(YearMonth);
    expect(date(2026, 11).toString()).toBe('2026-11');
    expect(date('2026', '11').toString()).toBe('2026-11');
    expect(date(...[2026, 11]).equals(yearMonth('2026-11'))).toBe(true);
    expect(date(2026, 11, 16).toString()).toBe('2026-11-16');
    expect(() => date(2026, 13)).toThrow(/unreadableYearMonth/);
  });

  it('leaves a missing day and a month written as text refused by date(), which names it', () => {
    expect(() => date(2026, 11, undefined)).toThrow(/unreadableDate/);
    expect(() => date('2026-11')).toThrow(/unreadableDate/);
    expect(() => date('2026-11')).toThrow(/yearMonth\('2026-11'\) reads it/);
    expect(date('2026-11', { loose: true }).toString()).toBe('2026-11-01');
  });

  it('refuses a month that does not exist, text that is neither, and a date that never was', () => {
    expect(() => yearMonth('2026-13')).toThrow(/unreadableYearMonth/);
    expect(() => yearMonth(2026, 13)).toThrow(/unreadableYearMonth/);
    expect(() => yearMonth(2026.5, 11)).toThrow(/unreadableYearMonth/);
    expect(() => yearMonth('garbage')).toThrow(/unreadableYearMonth/);
    expect(() => yearMonth('11/2026')).toThrow(/unreadableYearMonth/);
    expect(() => yearMonth({ year: 2026 })).toThrow(/unreadableYearMonth/);
    expect(() => yearMonth({ year: 2026, month: 2, day: 30 })).toThrow(/unreadableDate/);
  });

  it('refuses a missing value, half of one, and a bad zone', () => {
    expect(() => yearMonth()).toThrow(/notAYearMonth/);
    expect(() => yearMonth(null)).toThrow(/notAYearMonth/);
    expect(() => yearMonth(2026)).toThrow(/notAYearMonth/);
    expect(() => yearMonth('2026-11', 'Mars/Olympus')).toThrow(/unknownZone/);
  });

  it('reads only the ISO calendar, converting a date and refusing a year-month from another', () => {
    const hebrew = Temporal.PlainDate.from('2026-11-16[u-ca=hebrew]');
    expect(yearMonth(hebrew).toString()).toBe('2026-11');
    expect(() => yearMonth(hebrew.toPlainYearMonth())).toThrow(/notAYearMonth/);
  });

  it('reads what Date reads when loose, and gives null for what it cannot', () => {
    expect(yearMonth('Nov 2026', { loose: true }).toString()).toBe('2026-11');
    expect(yearMonth('November 16, 2026', { loose: true }).toString()).toBe('2026-11');
    expect(yearMonth('nope', { loose: true })).toBeNull();
    expect(yearMonth('2026-13', { loose: true })).toBeNull();
    expect(yearMonth(undefined, { loose: true })).toBeNull();
    expect(() => yearMonth('2026-11', { loose: true, zone: 'Mars/Olympus' })).toThrow(/unknownZone/);
  });

  it('leads with its text and prints its parts', () => {
    const period = yearMonth('2026-11');
    expect(Object.keys(period)).toEqual(['text', 'month', 'year']);
    expect(period.text).toBe('Nov 2026');
    expect(period.month).toBe(11);
    expect(period.year).toBe(2026);
    expect(Object.isFrozen(period)).toBe(true);
    expect(yearMonth(period)).toBe(period);
  });

  it('reads the calendar facts of its month, and hands over its first and last day', () => {
    const leapFebruary = yearMonth('2028-02');
    expect(leapFebruary.quarter).toBe(1);
    expect(leapFebruary.daysInMonth).toBe(29);
    expect(leapFebruary.daysInYear).toBe(366);
    expect(leapFebruary.isLeapYear()).toBe(true);
    expect(leapFebruary.start.toString()).toBe('2028-02-01');
    expect(leapFebruary.end.toString()).toBe('2028-02-29');
    expect(yearMonth('2026-11').end.toString()).toBe('2026-11-30');
  });

  it('counts in months, quarters and years, across a year end', () => {
    const period = yearMonth('2026-11');
    expect(period.plus(1, 'month').toString()).toBe('2026-12');
    expect(period.plus(months(2)).toString()).toBe('2027-01');
    expect(period.plus('1 year 2 months').toString()).toBe('2028-01');
    expect(period.plus(1, 'quarter').toString()).toBe('2027-02');
    expect(period.plus(1.5, 'years').toString()).toBe('2028-05');
    expect(period.minus(11, 'months').toString()).toBe('2025-12');
    expect(period.add(1, 'month').toString()).toBe('2026-12');
    expect(period.subtract(1, 'month').toString()).toBe('2026-10');
    expect(period.remove(1, 'year').toString()).toBe('2025-11');
  });

  it('refuses a unit smaller than a month, which Temporal would fold away or drop', () => {
    const period = yearMonth('2026-11');
    expect(() => period.plus(1, 'day')).toThrow(/notAYearMonthUnit/);
    expect(() => period.plus(days(45))).toThrow(/notAYearMonthUnit/);
    expect(() => period.plus(2, 'weeks')).toThrow(/notAYearMonthUnit/);
    expect(() => period.minus(3, 'hours')).toThrow(/notAYearMonthUnit/);
    expect(() => period.plus(0.5, 'month')).toThrow(/fractionalMonth/);
    expect(period.plus({ months: 1, days: 0 }).toString()).toBe('2026-12');
  });

  it('sets a year or a month as strictly as it reads one', () => {
    const period = yearMonth('2026-11');
    expect(period.set('month', 1).toString()).toBe('2026-01');
    expect(period.set({ year: 2027 }).toString()).toBe('2027-11');
    expect(() => period.set('month', 13)).toThrow(/cannotSet/);
    expect(() => period.set('day', 5)).toThrow(/notAYearMonthUnit/);
  });

  it('hands over any of its days, the 31st being the last day of a month without one', () => {
    const period = yearMonth('2026-11');
    expect(period.on(15).toString()).toBe('2026-11-15');
    expect(period.on('15').toString()).toBe('2026-11-15');
    expect(period.on(31).toString()).toBe('2026-11-30');
    expect(yearMonth('2026-02').on(30).toString()).toBe('2026-02-28');
    expect(() => period.on(32)).toThrow(/unreadableDate/);
    expect(() => period.on(0)).toThrow(/unreadableDate/);
    expect(() => period.on(15.5)).toThrow(/unreadableDate/);
    expect(() => period.on()).toThrow(/unreadableDate/);
  });

  it('compares with raw text and with a date, which reads as the month it falls in', () => {
    const period = yearMonth('2026-11');
    expect(period.equals('2026-11')).toBe(true);
    expect(period.equals(date('2026-11-30'))).toBe(true);
    expect(period.isBefore('2026-12')).toBe(true);
    expect(period.isAfter('2026-12')).toBe(false);
    expect(period.isBefore(date('2027-01-01'))).toBe(true);
    expect(period.isAfter(datetime('2026-10-31T23:30Z'))).toBe(true);
  });

  it('says whether a day falls in it, and refuses a month where a day belongs', () => {
    const period = yearMonth('2026-11');
    expect(period.contains('2026-11-16')).toBe(true);
    expect(period.contains(date('2026-12-01'))).toBe(false);
    expect(period.contains(datetime('2026-11-30T23:00Z'))).toBe(true);
    expect(() => period.contains('2026-11')).toThrow(/unreadableDate/);
  });

  it('sorts by its own compare and by the one every kind shares', () => {
    const periods = [yearMonth('2027-01'), yearMonth('2026-03'), yearMonth('2026-11')];
    expect(yearMonth('2026-11').compare('2026-12')).toBe(-1);
    expect(compare(yearMonth('2026-11'), '2026-11')).toBe(0);
    expect(periods.toSorted(compare).map(String)).toEqual(['2026-03', '2026-11', '2027-01']);
    expect(periods.toSorted((a, b) => b.compare(a)).map(String)).toEqual(['2027-01', '2026-11', '2026-03']);
  });

  it('is past once its last day is, and future until its first', () => {
    const thisMonth = today().yearMonth;
    expect(thisMonth.isPast()).toBe(false);
    expect(thisMonth.isFuture()).toBe(false);
    expect(thisMonth.contains(today())).toBe(true);
    expect(thisMonth.minus(1, 'month').isPast()).toBe(true);
    expect(thisMonth.plus(1, 'month').isFuture()).toBe(true);
    expect(yearMonth('2020-01').isPast('Pacific/Kiritimati')).toBe(true);
  });

  it('measures the months to another, as a duration or a number', () => {
    const period = yearMonth('2026-11');
    expect(period.until('2028-01').toString()).toBe('P1Y2M');
    expect(period.until('2028-01', 'months')).toBe(14);
    expect(period.until('2028-01').total('months')).toBe(14);
    expect(period.since('2026-01', 'months')).toBe(10);
    expect(period.until(date('2027-02-14'), 'months')).toBe(3);
  });

  it('is handed over by a date and by a datetime in its zone', () => {
    expect(date('2026-11-16').yearMonth.toString()).toBe('2026-11');
    expect(datetime('2026-10-31T23:30Z').in('Asia/Tokyo').yearMonth.toString()).toBe('2026-11');
    expect(date('2026-11-16').yearMonth).toBeInstanceOf(YearMonth);
  });

  it('runs a date range between its first and last day, and prints tokens through one of its days', () => {
    const february = yearMonth('2026-02');
    expect(february.start.to(february.end).toString()).toBe('2026-02-01/2026-02-28');
    expect(february.start.to(february.end).points('day')).toHaveLength(28);
    expect(yearMonth('2027-03').start.format('MM/YY')).toBe('03/27');
  });

  it('formats by preset or Intl options in the order the locale writes', () => {
    const period = yearMonth('2026-11');
    expect(period.format()).toBe('Nov 2026');
    expect(period.format('short')).toBe('11/26');
    expect(period.format('long')).toBe('November 2026');
    expect(period.format('long', 'ja')).toBe('2026年11月');
    expect(period.format({ year: 'numeric', month: '2-digit' })).toBe('11/2026');
  });

  it('refuses a format that needs the day it does not have', () => {
    expect(() => yearMonth('2026-11').format({ dateStyle: 'long' })).toThrow(/noField/);
    expect(() => yearMonth('2026-11').format({ weekday: 'long', month: 'long' })).toThrow(/noField/);
    expect(() => yearMonth('2026-11').format('full')).toThrow(/unknownFormat/);
    expect(yearMonth('2026-11').on(16).format('full')).toBe('Monday, November 16, 2026');
  });

  it('takes a preset an app adds', () => {
    YearMonth.presets.expiry = { year: '2-digit', month: '2-digit' };
    expect(yearMonth('2027-03').format('expiry')).toBe('03/27');
    delete YearMonth.presets.expiry;
  });

  it('serializes to ISO and reads back', () => {
    const period = yearMonth('2026-11');
    expect(String(period)).toBe('2026-11');
    expect(JSON.stringify({ period })).toBe('{"period":"2026-11"}');
    expect(yearMonth(JSON.parse(JSON.stringify(period))).equals(period)).toBe(true);
    expect(period.toTemporal()).toBeInstanceOf(Temporal.PlainYearMonth);
  });

  it('names its kind and answers to its brand', () => {
    const period = yearMonth('2026-11');
    expect(kindOf(period)).toBe('yearMonth');
    expect(isYearMonth(period)).toBe(true);
    expect(isYearMonth(date('2026-11-16'))).toBe(false);
    expect(period).toBeInstanceOf(YearMonth);
    expect(period[IS_YEAR_MONTH]).toBe(true);
    expect({ [IS_YEAR_MONTH]: true }).toBeInstanceOf(YearMonth);
  });

  it('is not a number, and says which method to use instead', () => {
    expect(() => yearMonth('2026-11') < yearMonth('2026-12')).toThrow(/notANumber/);
  });
});
