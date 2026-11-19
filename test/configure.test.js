import { configure, date, datetime, days, monthNames, now, time, yearMonth } from 'native-dates';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

// settings belong to the whole process, so each test hands the defaults back
afterEach(() => {
  configure({ zone: null, locale: null, weekStart: null });
});

describe('configure()', () => {
  it('returns zone, locale and weekStart as undefined until they are set', () => {
    expect(configure()).toMatchObject({ zone: undefined, locale: undefined, weekStart: undefined });
  });

  it('returns the settings of the plugins at their defaults when no plugin is imported', () => {
    expect(configure()).toMatchObject({ dayFirst: false, zoneAliases: {} });
  });

  it('returns the settings as they stand once the call is applied', () => {
    expect(configure({ zone: 'Europe/Berlin', locale: 'de-DE', weekStart: 'sunday' })).toMatchObject({
      zone: 'Europe/Berlin',
      locale: 'de-DE',
      weekStart: 7,
    });
  });

  it('changes nothing when called with no arguments', () => {
    configure({ zone: 'Europe/Berlin', locale: 'de-DE', weekStart: 'sunday' });
    configure();
    expect(configure()).toMatchObject({ zone: 'Europe/Berlin', locale: 'de-DE', weekStart: 7 });
  });

  it('keeps each setting the call leaves out or passes as undefined', () => {
    configure({ zone: 'Europe/Berlin', locale: 'de-DE' });
    expect(configure({ weekStart: 'monday', zone: undefined })).toMatchObject({
      zone: 'Europe/Berlin',
      locale: 'de-DE',
      weekStart: 1,
    });
  });

  it('returns a copy, so writing to it changes no setting', () => {
    const snapshot = configure({ zone: 'Europe/Berlin' });
    snapshot.zone = 'Asia/Tokyo';
    expect(configure().zone).toBe('Europe/Berlin');
    expect(now().zone).toBe('Europe/Berlin');
  });

  // vitest loads the library afresh for each test file, and this file imports no plugin
  it('throws missingPlugin at the key when the setting belongs to a plugin that is not imported', () => {
    expect(() => configure({ dayFirst: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'dayFirst' }),
    );
    expect(() => configure({ zoneAliases: { hq: 'Europe/Berlin' } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'zoneAliases' }),
    );
  });

  it.todo('refuses a key that is not a setting, such as timeZone');
});

describe('configure({ zone })', () => {
  it('views a moment in the configured zone when the call names no zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T17:30:00Z')).toMatchObject({ zone: 'Asia/Tokyo', day: 17, hour: 2 });
    expect(now().zone).toBe('Asia/Tokyo');
  });

  it('reads a time written with no offset as the wall clock of the configured zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T09:30').toString()).toBe('2026-11-16T00:30:00.000Z');
    expect(date('2026-11-16').at('9:30am').toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  it('reads the day and the clock of an instant in the configured zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(date('2026-11-16T17:30:00Z').toString()).toBe('2026-11-17');
    expect(time('2026-11-16T17:30:00Z').toString()).toBe('02:30:00');
  });

  it('uses a zone passed to the call, or written in brackets in the input, over the configured zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T17:30:00Z', 'Europe/Berlin').zone).toBe('Europe/Berlin');
    expect(now('UTC').zone).toBe('UTC');
    expect(datetime('2026-11-16T09:30[America/New_York]').zone).toBe('America/New_York');
  });

  it('returns to the zone of the runtime when set to null', () => {
    const runtimeZone = now().zone;
    configure({ zone: 'Asia/Tokyo' });
    expect(configure({ zone: null }).zone).toBeUndefined();
    expect(now().zone).toBe(runtimeZone);
  });

  it('throws unknownZone at the name and keeps the zone it had', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(() => configure({ zone: 'Tokyo' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Tokyo' }),
    );
    expect(configure().zone).toBe('Asia/Tokyo');
  });
});

describe('configure({ locale })', () => {
  it('prints values that carry no locale in the configured locale', () => {
    configure({ locale: 'es-ES' });
    expect(date('2026-05-15').format('long')).toContain('mayo');
    expect(yearMonth('2026-05').format('long')).toContain('mayo');
    expect(days(2).text).toContain('días');
    expect(monthNames()[4]).toBe('mayo');
  });

  it('prints a value made before the call in the locale configured after it', () => {
    const day = date('2026-05-15');
    configure({ locale: 'es-ES' });
    expect(day.format('MMMM')).toBe('mayo');
    configure({ locale: 'fr-FR' });
    expect(day.format('MMMM')).toBe('mai');
  });

  it('starts weeks on the first day of the configured locale and leaves weekStart unset', () => {
    configure({ locale: 'de-DE' });
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-16');
    expect(configure().weekStart).toBeUndefined();
  });

  it('reads an underscore tag, a list of tags and an Accept-Language header', () => {
    expect(configure({ locale: 'pt_BR' }).locale).toBe('pt-BR');
    expect(configure({ locale: ['fr-CA', 'fr'] }).locale).toEqual(['fr-CA', 'fr']);
    expect(configure({ locale: 'de-DE,de;q=0.9,en;q=0.8' }).locale).toEqual(['de-DE', 'de', 'en']);
    expect(date('2026-05-15').format('MMMM')).toBe('Mai');
  });

  it.each([['null', null], ['an empty string', '']])(
    'returns to the locale of the runtime when set to %s',
    (name, empty) => {
      const inRuntimeLocale = date('2026-05-15').format('full');
      configure({ locale: 'ja-JP' });
      expect(configure({ locale: empty }).locale).toBeUndefined();
      expect(date('2026-05-15').format('full')).toBe(inRuntimeLocale);
    },
  );

  it('throws unknownLocale at the text and keeps the locale it had', () => {
    configure({ locale: 'de-DE' });
    expect(() => configure({ locale: 'not a locale' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownLocale', at: 'not a locale' }),
    );
    expect(configure().locale).toBe('de-DE');
  });
});

describe('configure({ weekStart })', () => {
  it.each([
    ['sunday', 7],
    ['Mon', 1],
    [6, 6],
  ])('reads %j and reports it as %i, counting Monday as 1 and Sunday as 7', (day, number) => {
    expect(configure({ weekStart: day }).weekStart).toBe(number);
  });

  it('follows the locale again when set to null', () => {
    configure({ locale: 'de-DE', weekStart: 'sunday' });
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-15');
    expect(configure({ weekStart: null }).weekStart).toBeUndefined();
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-16');
  });

  // Date, Moment and date-fns count Sunday as 0, so 0 is the number most likely to arrive by mistake
  it.each([[0], ['funday']])('throws unknownDayOfWeek at %j and keeps the day it had', (day) => {
    configure({ weekStart: 'saturday' });
    expect(() => configure({ weekStart: day })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: String(day) }),
    );
    expect(configure().weekStart).toBe(6);
  });
});

describe('zone, locale and week start with nothing configured', () => {
  // the zone and locale a runtime starts with cannot be changed from inside it, so this starts a second process
  // skipped on Windows, which takes its locale from the system and not from LC_ALL
  it.skipIf(process.platform === 'win32')('follow the zone and locale the process was started in', () => {
    const script = `
      import { date, now } from 'native-dates';
      const month = date('2026-05-15').format('MMMM');
      console.log(JSON.stringify({ zone: now().zone, month, weekStart: date('2026-11-18').weekStart }));
    `;
    const printed = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: { ...process.env, TZ: 'Asia/Tokyo', LC_ALL: 'de_DE.UTF-8' },
      encoding: 'utf8',
    });
    expect(JSON.parse(printed)).toEqual({ zone: 'Asia/Tokyo', month: 'Mai', weekStart: 1 });
  });
});
