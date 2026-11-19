import { configure, date, datetime, monthDay, monthNames, weekdayNames } from 'native-dates';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ locale: null, weekStart: null, weekdayNames: null, ordinals: null });
});

describe('monthNames()', () => {
  it('returns the twelve full month names from January when given no style', () => {
    expect(monthNames(undefined, 'en-US').join(' ')).toBe(
      'January February March April May June July August September October November December',
    );
  });

  it('returns the abbreviated names for short', () => {
    expect(monthNames('short', 'en-US').join(' ')).toBe('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec');
  });

  it('names the months in the locale passed, then in the configured one', () => {
    expect(monthNames('long', 'fr-FR').slice(0, 3)).toEqual(['janvier', 'février', 'mars']);
    configure({ locale: 'es-ES' });
    expect(monthNames('short').slice(0, 3)).toEqual(['ene', 'feb', 'mar']);
  });

  it('names a month as it stands alone, not as it is written beside a day', () => {
    expect(monthNames('long', 'ru')[10]).toBe('ноябрь');
    expect(monthNames('long', 'el')[10]).toBe('Νοέμβριος');
  });

  it('names the Gregorian months where the locale counts its own calendar by default', () => {
    expect(monthNames('long', 'fa').slice(0, 3)).toEqual(['ژانویه', 'فوریه', 'مارس']);
    expect(monthNames('long', 'ar-SA').slice(0, 3)).toEqual(['يناير', 'فبراير', 'مارس']);
  });

  it('returns a new array on every call so a caller can reorder its own copy', () => {
    monthNames('long', 'en-US').reverse();
    expect(monthNames('long', 'en-US')[0]).toBe('January');
  });

  it.todo('throws for a style it does not have, such as a locale tag passed first, instead of returning English names');

  it('throws unknownLocale at the tag when it is not a locale', () => {
    expect(() => monthNames('long', 'not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('weekdayNames()', () => {
  it('returns the seven abbreviated names when given no style', () => {
    expect(weekdayNames(undefined, 'monday', 'en-US')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('returns the full names for long', () => {
    expect(weekdayNames('long', 'monday', 'en-US').join(' ')).toBe(
      'Monday Tuesday Wednesday Thursday Friday Saturday Sunday',
    );
  });

  it('returns two-letter names for narrow in English and single calendar letters where the language uses them', () => {
    expect(weekdayNames('narrow', 'monday', 'en-US')).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    expect(weekdayNames('narrow', 'sunday', 'pt-BR')).toEqual(['D', 'S', 'T', 'Q', 'Q', 'S', 'S']);
    expect(weekdayNames('narrow', 'sunday', 'ja')).toEqual(['日', '月', '火', '水', '木', '金', '土']);
  });

  it('starts on the first day of the week of the locale when given no first day', () => {
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Sun');
    expect(weekdayNames('short', undefined, 'de-DE')[0]).toBe('Mo');
    expect(weekdayNames('long', undefined, 'ar-EG')[0]).toBe('السبت');
  });

  it('starts on the first day passed as a name, a three-letter prefix or a number from 1 for Monday', () => {
    expect(weekdayNames('short', 'monday', 'en-US')[0]).toBe('Mon');
    expect(weekdayNames('short', 'Fri', 'en-US')[0]).toBe('Fri');
    expect(weekdayNames('short', 7, 'en-US')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('starts on the configured weekStart, which a first day passed to the call overrides', () => {
    configure({ weekStart: 'monday' });
    expect(weekdayNames('short', undefined, 'en-US')[0]).toBe('Mon');
    expect(weekdayNames('short', 'sunday', 'en-US')[0]).toBe('Sun');
  });

  it('names the days in the configured locale when none is passed', () => {
    configure({ locale: 'es' });
    expect(weekdayNames('long', 'monday')[0]).toBe('lunes');
    expect(weekdayNames('long', 'monday', 'de')[0]).toBe('Montag');
  });

  it('returns a new array on every call so a caller can reorder its own copy', () => {
    weekdayNames('long', 'monday', 'en-US').reverse();
    expect(weekdayNames('long', 'monday', 'en-US')[0]).toBe('Monday');
  });

  it('throws unknownDayOfWeek at the first day when it is not a day', () => {
    expect(() => weekdayNames('short', 'funday', 'en-US')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
  });

  it('throws unknownLocale at the tag when it is not a locale', () => {
    expect(() => weekdayNames('short', 'monday', 'not a locale')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
  });
});

describe('configure({ weekdayNames })', () => {
  it('replaces the days it names and leaves the rest of the week as the runtime prints it', () => {
    configure({ weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } } });
    expect(weekdayNames('narrow', 'monday', 'lv')).toEqual(['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']);
    expect(date('2026-11-01').format('dd', 'lv')).toBe('Sv');
  });

  it('changes only the token of the width it names: narrow for dd, short for ddd, long for dddd', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues', thu: 'Thurs' } } } });
    expect(date('2026-11-03').format('dd ddd dddd', 'en-US')).toBe('Tu Tues Tuesday');
    expect(weekdayNames('short', 'monday', 'en-US')).toEqual(['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']);
  });

  it('applies the entry of a language to its regional tags and lays a regional entry over it', () => {
    configure({
      weekdayNames: {
        en: { long: { sun: 'Sunday (closed)' } },
        'en-US': { long: { mon: 'Monday (late)' } },
      },
    });
    expect(weekdayNames('long', 'sunday', 'en-US').slice(0, 2)).toEqual(['Sunday (closed)', 'Monday (late)']);
    expect(weekdayNames('long', 'sunday', 'en-GB').slice(0, 2)).toEqual(['Sunday (closed)', 'Monday']);
  });

  it('matches a language tag written in any letter case', () => {
    configure({ weekdayNames: { 'PT-br': { short: { sat: 'sab' } } } });
    expect(date('2026-11-07').format('ddd', 'pt-BR')).toBe('sab');
  });

  it('leaves another language, presets and options bags as the runtime prints them', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    expect(date('2026-11-03').format('ddd', 'de')).toBe('Di');
    expect(date('2026-11-03').format('llll', 'en-US')).toBe('Tue, Nov 3, 2026');
    expect(date('2026-11-03').format({ weekday: 'short' }, 'en-US')).toBe('Tue');
  });

  it('takes effect on a locale that has already been formatted', () => {
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tue');
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tues');
  });

  it('goes back to the runtime names when set to null', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    configure({ weekdayNames: null });
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tue');
  });

  it('throws unknownWidth at the key when a width is not narrow, short or long, or is left out', () => {
    expect(() => configure({ weekdayNames: { lv: { min: { fri: 'Pk' } } } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownWidth', at: 'min' }),
    );
    expect(() => configure({ weekdayNames: { lv: { fri: 'Pk' } } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownWidth', at: 'fri' }),
    );
  });

  it('throws unknownDayOfWeek at the key when a day is not a day', () => {
    expect(() => configure({ weekdayNames: { lv: { narrow: { funday: 'Pk' } } } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: 'funday' }),
    );
  });

  it('keeps the names configured before when a later table is refused', () => {
    configure({ weekdayNames: { en: { short: { tue: 'Tues' } } } });
    expect(() => configure({ weekdayNames: { en: { short: { tue: 'Tu.' } }, lv: { min: {} } } })).toThrowError(
      expect.objectContaining({ code: 'unknownWidth' }),
    );
    expect(date('2026-11-03').format('ddd', 'en-US')).toBe('Tues');
  });
});

describe('configure({ ordinals })', () => {
  const firstAsPremier = { fr: (day) => (day === 1 ? '1er' : day) };

  it('prints Do through the function given for the language', () => {
    configure({ ordinals: firstAsPremier });
    expect(date('2026-11-01').format('Do MMMM', 'fr')).toBe('1er novembre');
    expect(date('2026-11-02').format('Do MMMM', 'fr')).toBe('2 novembre');
  });

  it('applies on every kind of value that prints a day', () => {
    configure({ ordinals: firstAsPremier });
    expect(monthDay('11-01').format('Do MMMM', 'fr')).toBe('1er novembre');
    expect(datetime('2026-11-01T09:00', 'Europe/Paris').format('dddd Do MMMM', 'fr')).toBe('dimanche 1er novembre');
  });

  it('applies to a regional tag of the language and to a value that carries the locale', () => {
    configure({ ordinals: firstAsPremier });
    expect(date('2026-11-01').format('Do MMMM', 'fr-CA')).toBe('1er novembre');
    expect(date('2026-11-01').locale('fr').format('Do MMMM')).toBe('1er novembre');
  });

  it('leaves the languages it does not name as they were', () => {
    configure({ ordinals: firstAsPremier });
    expect(date('2026-11-01').format('Do', 'en-US')).toBe('1st');
    expect(date('2026-11-01').format('Do', 'de')).toBe('1.');
  });

  it('replaces the English suffixes when given a function for English', () => {
    configure({ ordinals: { en: (day) => `${day}.` } });
    expect(date('2026-11-01').format('Do', 'en-US')).toBe('1.');
  });

  it('goes back to the built-in ordinals when set to null', () => {
    configure({ ordinals: { en: (day) => `${day}.` } });
    configure({ ordinals: null });
    expect(date('2026-11-01').format('Do', 'en-US')).toBe('1st');
  });
});
