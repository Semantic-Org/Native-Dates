import { date, datetime, days, duration, monthNames, time, weekdayNames, yearMonth } from 'native-dates';
import { describe, expect, it } from 'vitest';

// each runtime carries its own locale data, and a page written on a server has to read the same when the
// browser writes it again. test/browser/locale-data-across-runtimes.test.js runs this file in Chromium
describe('text for people, written the same on every runtime', () => {
  const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles').locale('en-US');

  it('writes the text of a moment, a day, a clock time and a length', () => {
    expect(standup.text).toBe('Nov 16, 2026, 9:30 AM PST');
    expect(date('2026-05-10').locale('en-US').text).toBe('May 10, 2026');
    expect(time('9:30am').locale('en-US').text).toBe('9:30 AM');
    expect(duration('1h 30m').locale('en-US').text).toBe('1 hour, 30 minutes');
  });

  it('writes each preset of a moment', () => {
    expect(standup.format('short')).toBe('11/16/26, 9:30 AM');
    expect(standup.format('medium')).toBe('Nov 16, 2026, 9:30 AM');
    expect(standup.format('long')).toBe('November 16, 2026 at 9:30 AM');
    expect(standup.format('full')).toBe('Monday, November 16, 2026 at 9:30 AM');
  });

  it('names months, weekdays, day periods and zones in a token pattern', () => {
    expect(standup.format('dddd, MMM D [at] h:mm A')).toBe('Monday, Nov 16 at 9:30 AM');
    expect(standup.format('z')).toBe('PST');
    expect(standup.format('zzz')).toBe('Pacific Standard Time');
    expect(monthNames('short', 'en-US').slice(0, 3)).toEqual(['Jan', 'Feb', 'Mar']);
    expect(weekdayNames('narrow', 'monday', 'en-US')).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
  });

  it('writes other languages, scripts and calendars', () => {
    expect(standup.in('Europe/Berlin').format('long', 'de-DE')).toBe('16. November 2026 um 18:30');
    expect(standup.format('long', 'ja-JP')).toBe('2026年11月16日 9:30');
    expect(yearMonth('2026-05').format('long', 'ru')).toBe('май 2026 г.');
    expect(date('2019-05-01').format('long', 'ja-u-ca-japanese')).toBe('令和元年5月1日');
    expect(date('2026-03-20').format('long', 'ar-SA-u-ca-islamic-umalqura')).toBe('١ شوال ١٤٤٧ هـ');
  });

  it('writes a length in each style', () => {
    const span = duration({ hours: 2, minutes: 15 });
    expect(span.format('long', 'en-US')).toBe('2 hours, 15 minutes');
    expect(span.format('short', 'en-US')).toBe('2 hr, 15 min');
    expect(span.format('narrow', 'en-US')).toBe('2h 15m');
    expect(span.format('digital', 'en-US')).toBe('2:15:00');
    expect(days(2).format('long', 'ar')).toBe('يومان');
  });

  it('writes relative phrases', () => {
    const anchor = datetime('2026-11-16T12:00', 'UTC');
    expect(anchor.minus(3, 'hours').from(anchor, 'en-US')).toBe('3 hours ago');
    expect(date('2026-11-15').from('2026-11-16', 'en-US')).toBe('yesterday');
    expect(date('2026-11-30').from('2026-11-16', 'en-US')).toBe('in 2 weeks');
  });
});

describe('the first day of the week, read the same on every runtime', () => {
  it('starts a week on Sunday in en-US, Monday in de-DE and Saturday in ar-EG', () => {
    const wednesday = date('2026-11-18');
    expect(wednesday.locale('en-US').startOf('week').toString()).toBe('2026-11-15');
    expect(wednesday.locale('de-DE').startOf('week').toString()).toBe('2026-11-16');
    expect(wednesday.locale('ar-EG').startOf('week').toString()).toBe('2026-11-14');
  });
});
