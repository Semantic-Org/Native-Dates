import {
  configure,
  date,
  dateRange,
  datetime,
  datetimeRange,
  hours,
  monthDay,
  time,
  timeRange,
  yearMonth,
} from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

const friday = date('2026-11-06');

afterEach(() => {
  configure({ formats: null });
});

describe('configure({ formats })', () => {
  it('prints a token pattern or an options bag by the name the app gave it', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', receipt: { dateStyle: 'long' } } });
    expect(friday.format('invoice')).toBe('2026-11-06');
    expect(friday.format('receipt', 'en-US')).toBe('November 6, 2026');
  });

  it('prints a named token pattern on every kind of value that has its fields', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', stamp: 'HH:mm', heading: 'MMMM' } });
    expect(datetime('2026-11-06T09:05', 'Europe/Berlin').format('invoice')).toBe('2026-11-06');
    expect(datetime('2026-11-06T09:05', 'Europe/Berlin').format('stamp')).toBe('09:05');
    expect(time('17:30').format('stamp')).toBe('17:30');
    expect(yearMonth('2026-11').format('heading', 'en-US')).toBe('November');
    expect(monthDay('11-06').format('heading', 'en-US')).toBe('November');
  });

  it('prints a named options bag on every kind of value, each keeping only its own fields', () => {
    configure({ formats: { receipt: { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric' } } });
    expect(datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt', 'en-US')).toBe(
      'Friday, November 6 at 9 AM',
    );
    expect(friday.format('receipt', 'en-US')).toBe('Friday, November 6');
    expect(time('17:30').format('receipt', 'en-US')).toBe('5 PM');
    expect(yearMonth('2026-11').format('receipt', 'en-US')).toBe('November');
    expect(monthDay('11-06').format('receipt', 'en-US')).toBe('November 6');
  });

  it('prints both ends of a range with a named token pattern', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', stamp: 'HH:mm' } });
    expect(dateRange('2026-11-06', '2026-11-20').format('invoice')).toBe('2026-11-06 – 2026-11-20');
    expect(timeRange('09:00', '17:30').format('stamp')).toBe('09:00 – 17:30');
    expect(datetimeRange('2026-11-06T09:00', '2026-11-06T17:30', 'Europe/Berlin').format('stamp')).toBe(
      '09:00 – 17:30',
    );
  });

  it('prints a range through Intl with a named options bag, collapsing what both ends share', () => {
    configure({ formats: { receipt: { month: 'long', day: 'numeric' } } });
    expect(dateRange('2026-11-06', '2026-11-20').format('receipt', 'en-US')).toMatch(/^November 6\s*–\s*20$/);
  });

  it('prints a named format in the locale the value carries, then in the one passed to the call', () => {
    configure({ formats: { receipt: { weekday: 'long', month: 'long', day: 'numeric' } } });
    expect(friday.locale('fr').format('receipt')).toBe('vendredi 6 novembre');
    expect(friday.locale('fr').format('receipt', 'de')).toBe('Freitag, 6. November');
  });

  it('reads a name before the built-in presets, so naming a format short changes that preset', () => {
    configure({ formats: { short: 'YYYY-MM-DD' } });
    expect(friday.format('short')).toBe('2026-11-06');
    expect(friday.format('long', 'en-US')).toBe('November 6, 2026');
  });

  it('gives the built-in presets back and forgets every name when set to null', () => {
    configure({ formats: { short: 'YYYY-MM-DD', invoice: 'YYYY-MM-DD' } });
    configure({ formats: null });
    expect(friday.format('short', 'en-US')).toBe('11/6/26');
    expect(() => friday.format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'invoice' }),
    );
  });

  it('replaces the whole set when formats is given again', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    configure({ formats: { stamp: 'HH:mm' } });
    expect(time('17:30').format('stamp')).toBe('17:30');
    expect(() => friday.format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'invoice' }),
    );
  });

  // HH:mm on a date would throw unsupportedToken if text or a bare format() read the name
  it('keeps text and a bare format() built in, so a format named medium or text cannot stop a value being made', () => {
    configure({ formats: { medium: 'HH:mm', text: 'HH:mm' } });
    const day = date('2026-11-06', { locale: 'en-US' });
    expect(day.text).toBe('Nov 6, 2026');
    expect(day.format()).toBe('Nov 6, 2026');
  });

  // YYYY on a time or a month-day would throw unsupportedToken if its text read the name
  it('keeps the text of a datetime, a time, a year-month, a month-day and a range built in as well', () => {
    configure({ formats: { text: 'YYYY', medium: 'YYYY', short: 'YYYY' } });
    const inLosAngeles = { zone: 'America/Los_Angeles', locale: 'en-US' };
    expect(datetime('2026-11-16T09:30', inLosAngeles).text).toBe('Nov 16, 2026, 9:30 AM PST');
    expect(time('9:30am', { locale: 'en-US' }).text).toBe('9:30 AM');
    expect(yearMonth('2026-11', { locale: 'en-US' }).text).toBe('Nov 2026');
    expect(monthDay('10-17', { locale: 'en-US' }).text).toBe('Oct 17');
    expect(datetimeRange('2026-09-01T09:00', '2026-09-01T17:00', inLosAngeles).text).toMatch(
      /^Sep 1, 2026, 9:00 AM\s*–\s*5:00 PM PDT$/,
    );
  });

  it('prints a built-in preset under a name the app gave it', () => {
    configure({ formats: { table: 'medium', card: 'full' } });
    expect(friday.format('table', 'en-US')).toBe('Nov 6, 2026');
    expect(friday.format('card', 'en-US')).toBe('Friday, November 6, 2026');
    expect(time('17:30:15').format('table', 'en-US')).toBe('5:30:15 PM');
    expect(yearMonth('2026-11').format('table', 'en-US')).toBe('Nov 2026');
    expect(monthDay('11-06').format('card', 'en-US')).toBe('November 6');
  });

  it('is not changed by the app editing its own object afterwards', () => {
    const formats = { invoice: 'YYYY-MM-DD' };
    configure({ formats });
    formats.invoice = 'DD/MM/YYYY';
    expect(friday.format('invoice')).toBe('2026-11-06');
  });

  it('throws unknownFormat at the name for a name the app never gave', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    expect(() => friday.format('receipt')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'receipt' }),
    );
  });

  it('throws unknownFormat for a name that every object inherits, such as constructor', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    expect(() => friday.format('constructor')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'constructor' }),
    );
  });

  it('throws unsupportedToken when a named token pattern asks a value for a field it lacks', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD' } });
    expect(() => time('17:30').format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unsupportedToken', at: "YYYY in 'YYYY-MM-DD'" }),
    );
  });

  it('leaves a duration with its own four styles, which named formats neither add to nor rename', () => {
    configure({ formats: { invoice: 'YYYY-MM-DD', long: 'YYYY-MM-DD' } });
    expect(hours(2).format('long', 'en-US')).toBe('2 hours');
    expect(() => hours(2).format('invoice')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownFormat', at: 'invoice' }),
    );
  });
});
