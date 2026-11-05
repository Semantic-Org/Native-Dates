import { beforeEach, describe, it } from 'node:test';

import {
  CalendarDate,
  compare,
  configure,
  date,
  DateTime,
  datetime,
  days,
  Duration,
  duration,
  earliest,
  hours,
  IS_DATE_TIME,
  latest,
  minutes,
  now,
  Time,
  time,
  today,
} from '@native-dates/core';

import { expect } from './helpers/expect.js';

beforeEach(() => {
  configure({ zone: 'UTC', locale: 'en-US', weekStart: 'monday' });
});

describe('unextended core', () => {
  it('runs datetimes, dates, times, durations, presets and standard IANA zones with zero plugins', () => {
    const moment = datetime('2026-09-06T14:30:00Z');
    expect(moment.in('America/New_York').hour).toBe(10);
    expect(moment.in('+05:30').offset).toBe('+05:30');
    expect(moment.format('medium')).toBe('Sep 6, 2026, 2:30 PM');
    expect(date('2026-09-06').at('9am', 'Europe/Berlin').zone).toBe('Europe/Berlin');
    expect(earliest('2026-09-06', '2026-01-01').toString()).toBe('2026-01-01');
    expect(latest(time('9am'), time('5pm')).toString()).toBe('17:00:00');
    expect(compare(hours(1), minutes(90))).toBe(-1);
    expect(now().zone).toBe('UTC');
    expect(today().toString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(IS_DATE_TIME).toBe(Symbol.for('native-dates/DateTime'));
  });

  it('aliases add, subtract and remove directly to plus and minus on all four nouns', () => {
    for (const Kind of [DateTime, CalendarDate, Time, Duration]) {
      expect(Kind.prototype.add).toBe(Kind.prototype.plus);
      expect(Kind.prototype.subtract).toBe(Kind.prototype.minus);
      expect(Kind.prototype.remove).toBe(Kind.prototype.minus);
    }

    const moment = datetime('2026-09-06T14:30Z');
    expect(moment.add(2, 'hours').toString()).toBe('2026-09-06T16:30:00.000Z');
    expect(moment.subtract(30, 'minutes').toString()).toBe('2026-09-06T14:00:00.000Z');
    expect(moment.remove(1, 'day').toString()).toBe('2026-09-05T14:30:00.000Z');

    const day = date('2026-09-06');
    expect(day.add(days(3)).toString()).toBe('2026-09-09');
    expect(day.subtract(1, 'day').toString()).toBe('2026-09-05');
    expect(day.remove(2, 'days').toString()).toBe('2026-09-04');

    const clock = time('09:00');
    expect(clock.add(45, 'minutes').toString()).toBe('09:45:00');
    expect(clock.subtract(15, 'minutes').toString()).toBe('08:45:00');
    expect(clock.remove(1, 'hour').toString()).toBe('08:00:00');

    const span = duration('2h');
    expect(span.add('30m').toString()).toBe('PT2H30M');
    expect(span.subtract('30m').toString()).toBe('PT1H30M');
    expect(span.remove(minutes(15)).toString()).toBe('PT1H45M');
  });

  it('leaves plugin prototype methods absent until their plugins are installed', () => {
    const moment = datetime('2026-09-06T14:30Z');
    const day = date('2026-09-06');
    const clock = time('09:00');

    expect(moment.to).toBeUndefined();
    expect(moment.range).toBeUndefined();
    expect(moment.formatRelative).toBeUndefined();
    expect(moment.getFullYear).toBeUndefined();
    expect(moment.setHours).toBeUndefined();

    expect(day.to).toBeUndefined();
    expect(day.range).toBeUndefined();
    expect(day.points).toBeUndefined();
    expect(day.split).toBeUndefined();
    expect(day.formatRelative).toBeUndefined();

    expect(clock.to).toBeUndefined();
  });

  it('refuses plugin features cleanly with actionable error codes before plugins are loaded', () => {
    expect(() => datetime('2026-09-06T14:30Z', { loose: true })).toThrow(/missingPlugin/);
    expect(() => new DateTime('2026-09-06T14:30Z', { loose: true })).toThrow(/missingPlugin/);
    expect(() => date('2026-09-06', { loose: true })).toThrow(/missingPlugin/);
    expect(() => time('09:00', { loose: true })).toThrow(/missingPlugin/);
    expect(() => duration('2h', { loose: true })).toThrow(/missingPlugin/);
    expect(() => configure({ dayFirst: true })).toThrow(/missingPlugin/);
    expect(() => configure({ zoneAliases: { hq: 'Europe/Berlin' } })).toThrow(/missingPlugin/);
    expect(() => datetime('2026-09-06T14:30Z', 'Berlin')).toThrow(/unknownZone/);
    expect(() => datetime('2026-09-06T14:30Z', 'PT')).toThrow(/unknownZone/);
    expect(() => datetime('2026-09-06T14:30Z').format('YYYY-MM-DD')).toThrow(/unknownFormat/);
  });

  it('carries no framework value protocol on any class', () => {
    const VALUE = Symbol.for('semantic-ui/value');
    for (const Kind of [DateTime, CalendarDate, Time, Duration]) {
      expect(Kind[VALUE]).toBeUndefined();
    }
  });
});
