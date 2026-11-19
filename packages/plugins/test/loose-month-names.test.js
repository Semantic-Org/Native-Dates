import '@native-dates/plugins/loose';
import { configure, dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

describe('monthDay() with { loose: true }', () => {
  it.each([
    'Oct 17',
    'October 17',
    'Oct. 17',
    'oct 17',
    'OCT 17',
    'Oct 17th',
    '17 Oct',
    '17 October',
    '17th October',
  ])('reads %j as 17 October', (text) => {
    expect(monthDay(text, { loose: true })?.toString()).toBe('10-17');
  });

  it('reads a month cut short of its full name, like "Sept"', () => {
    expect(monthDay('Sept 17', { loose: true })?.toString()).toBe('09-17');
    expect(monthDay('17 Sept.', { loose: true })?.toString()).toBe('09-17');
  });

  // Dutch shortens maart to mrt, which is not how maart begins
  it('reads a short month name that is not the start of the long one', () => {
    expect(monthDay('5 mrt', { loose: true, locale: 'nl' })?.toString()).toBe('03-05');
  });

  it('reads every English ordinal ending', () => {
    expect(monthDay('Jan 1st', { loose: true })?.toString()).toBe('01-01');
    expect(monthDay('2nd Feb', { loose: true })?.toString()).toBe('02-02');
    expect(monthDay('3rd Mar', { loose: true })?.toString()).toBe('03-03');
    expect(monthDay('July 4th', { loose: true })?.toString()).toBe('07-04');
  });

  it.each([
    ['fr', '17 octobre'],
    ['de', '17. Oktober'],
    ['es', '17 de octubre'],
    ['pt', '17 de outubro'],
    ['it', '17 ottobre'],
    ['nl', '17 oktober'],
    ['pl', '17 października'],
    ['cs', '17. října'],
    ['fi', '17. lokakuuta'],
    ['tr', '17 Ekim'],
    ['el', '17 Οκτωβρίου'],
    ['ru', '17 октября'],
    ['uk', '17 жовтня'],
    ['ar', '17 أكتوبر'],
    ['hi', '17 अक्टूबर'],
    ['th', '17 ตุลาคม'],
  ])('reads 17 October as written in %s when that locale is passed', (locale, text) => {
    expect(monthDay(text, { loose: true, locale })?.toString()).toBe('10-17');
  });

  it('reads an English month name under any locale', () => {
    expect(monthDay('Oct 17', { loose: true, locale: 'fr' })?.toString()).toBe('10-17');
    expect(monthDay('17 October', { loose: true, locale: 'ja' })?.toString()).toBe('10-17');
  });

  // Finnish for November is marraskuu
  it('reads "Mar" as March under a Finnish locale, and still reads the Finnish month in full', () => {
    expect(monthDay('Mar 17', { loose: true, locale: 'fi' })?.toString()).toBe('03-17');
    expect(monthDay('17. marraskuuta', { loose: true, locale: 'fi' })?.toString()).toBe('11-17');
  });

  it('returns null for a month name the locale does not have', () => {
    expect(monthDay('17 octobre', { loose: true, locale: 'en' })).toBeNull();
    expect(monthDay('17 octobre', { loose: true, locale: 'de' })).toBeNull();
  });

  it('carries the locale it read the month in', () => {
    expect(monthDay('17 octobre', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  it('keeps 29 February and returns null for a day its month does not have', () => {
    expect(monthDay('Feb 29', { loose: true })?.toString()).toBe('02-29');
    expect(monthDay('Feb 30', { loose: true })).toBeNull();
    expect(monthDay('Jun 31', { loose: true })).toBeNull();
    expect(monthDay('Oct 0', { loose: true })).toBeNull();
  });

  it('returns null rather than fill in a day or a month that was not written', () => {
    expect(monthDay('Oct', { loose: true })).toBeNull();
    expect(monthDay('17', { loose: true })).toBeNull();
    expect(monthDay('Oct 2026', { loose: true })).toBeNull();
    expect(monthDay('Ma 17', { loose: true })).toBeNull();
  });

  it('reads a numeric or ISO month-day as it does without loose', () => {
    expect(monthDay('10-17', { loose: true })?.toString()).toBe('10-17');
    expect(monthDay('10/17', { loose: true })?.toString()).toBe('10-17');
    expect(monthDay('1990-10-17', { loose: true })?.toString()).toBe('10-17');
  });
});

describe('dayMonth() with { loose: true }', () => {
  it('reads a month name with the day on either side', () => {
    expect(dayMonth('17 Oct', { loose: true })?.toString()).toBe('10-17');
    expect(dayMonth('Oct 17', { loose: true })?.toString()).toBe('10-17');
  });

  it('still reads numbers day first', () => {
    expect(dayMonth('17/10', { loose: true })?.toString()).toBe('10-17');
    expect(dayMonth('7/9', { loose: true })?.toString()).toBe('09-07');
  });
});

describe('yearMonth() with { loose: true }', () => {
  it.each(['Nov 2026', 'November 2026', 'Nov. 2026', 'November, 2026', 'nov 2026', '2026 Nov', '2026 November'])(
    'reads %j as November 2026',
    (text) => {
      expect(yearMonth(text, { loose: true })?.toString()).toBe('2026-11');
    },
  );

  it.each([
    ['fr', 'novembre 2026'],
    ['es', 'noviembre de 2026'],
    ['pt', 'novembro de 2026'],
    ['it', 'novembre 2026'],
    ['pl', 'listopad 2026'],
    ['fi', 'marraskuu 2026'],
    ['tr', 'Kasım 2026'],
    ['el', 'Νοέμβριος 2026'],
    ['el', 'Νοεμβρίου 2026'],
    ['ru', 'ноябрь 2026'],
    ['ar', 'نوفمبر 2026'],
    ['hi', 'नवंबर 2026'],
  ])('reads November 2026 as written in %s when that locale is passed', (locale, text) => {
    expect(yearMonth(text, { loose: true, locale })?.toString()).toBe('2026-11');
  });

  it('reads "Mar 2026" as March under a Finnish locale', () => {
    expect(yearMonth('Mar 2026', { loose: true, locale: 'fi' })?.toString()).toBe('2026-03');
  });

  it('reads a month cut short of its full name, or shortened another way', () => {
    expect(yearMonth('Sept 2026', { loose: true })?.toString()).toBe('2026-09');
    expect(yearMonth('mrt 2026', { loose: true, locale: 'nl' })?.toString()).toBe('2026-03');
  });

  it('returns null for a month name the locale does not have', () => {
    expect(yearMonth('novembre 2026', { loose: true, locale: 'en' })).toBeNull();
    expect(yearMonth('Foo 2026', { loose: true })).toBeNull();
  });

  it('carries the locale it read the month in', () => {
    expect(yearMonth('novembre 2026', { loose: true, locale: 'fr' })?.locale()).toBe('fr');
  });

  it('returns null rather than fill in a year or a month that was not written', () => {
    expect(yearMonth('Nov', { loose: true })).toBeNull();
    expect(yearMonth('2026', { loose: true })).toBeNull();
    expect(yearMonth('Oct 17', { loose: true })).toBeNull();
    expect(yearMonth('Nov 26', { loose: true })).toBeNull();
    expect(yearMonth('11/26', { loose: true })).toBeNull();
  });

  it('reads an ISO year-month or date as it does without loose', () => {
    expect(yearMonth('2026-11', { loose: true })?.toString()).toBe('2026-11');
    expect(yearMonth('2026/11', { loose: true })?.toString()).toBe('2026-11');
    expect(yearMonth('2026-11-16', { loose: true })?.toString()).toBe('2026-11');
  });

  // format() prints a Thai year counted from the Buddhist era, and it is read back as written
  it.todo('reads back the year-month format() prints in Thai, "มกราคม 2569", as January 2026 and not the year 2569');
});

describe('monthYear() with { loose: true }', () => {
  it('reads a month name beside a four-digit year', () => {
    expect(monthYear('Nov 2026', { loose: true })?.toString()).toBe('2026-11');
  });

  it('still reads a card expiry month first', () => {
    expect(monthYear('11/26', { loose: true })?.toString()).toBe('2026-11');
  });
});

describe('month names with configure({ locale }) and { loose: true }', () => {
  afterEach(() => {
    configure({ locale: null });
  });

  it('reads month names in the configured locale when the call passes none', () => {
    configure({ locale: 'fr' });
    expect(monthDay('17 octobre', { loose: true })?.toString()).toBe('10-17');
    expect(yearMonth('novembre 2026', { loose: true })?.toString()).toBe('2026-11');
  });

  it('still reads English month names', () => {
    configure({ locale: 'fr' });
    expect(monthDay('Oct 17', { loose: true })?.toString()).toBe('10-17');
    expect(yearMonth('Nov 2026', { loose: true })?.toString()).toBe('2026-11');
  });

  it('reads in the locale passed on the call in place of the configured one', () => {
    configure({ locale: 'fr' });
    expect(monthDay('17. Oktober', { loose: true, locale: 'de' })?.toString()).toBe('10-17');
    expect(monthDay('17 octobre', { loose: true, locale: 'de' })).toBeNull();
  });
});
