import { configure, date, datetime, days, monthNames, now, time, yearMonth } from 'native-dates';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  configure({ zone: null, locale: null, weekStart: null });
});

describe('configure()', () => {
  it('returns undefined for zone, locale, and weekStart before configuration', () => {
    expect(configure()).toMatchObject({ zone: undefined, locale: undefined, weekStart: undefined });
  });

  it('returns default plugin settings when no plugins are imported', () => {
    expect(configure()).toMatchObject({ dayFirst: false, zoneAliases: {} });
  });

  it('returns the updated settings snapshot after applying changes', () => {
    expect(configure({ zone: 'Europe/Berlin', locale: 'de-DE', weekStart: 'sunday' })).toMatchObject({
      zone: 'Europe/Berlin',
      locale: 'de-DE',
      weekStart: 7,
    });
  });

  it('leaves existing settings unchanged when called with no arguments', () => {
    configure({ zone: 'Europe/Berlin', locale: 'de-DE', weekStart: 'sunday' });
    configure();
    expect(configure()).toMatchObject({ zone: 'Europe/Berlin', locale: 'de-DE', weekStart: 7 });
  });

  it('preserves existing settings for omitted or undefined keys', () => {
    configure({ zone: 'Europe/Berlin', locale: 'de-DE' });
    expect(configure({ weekStart: 'monday', zone: undefined })).toMatchObject({
      zone: 'Europe/Berlin',
      locale: 'de-DE',
      weekStart: 1,
    });
  });

  it('returns a defensive copy so mutating the snapshot does not alter active settings', () => {
    const snapshot = configure({ zone: 'Europe/Berlin' });
    snapshot.zone = 'Asia/Tokyo';
    expect(configure().zone).toBe('Europe/Berlin');
    expect(now().zone).toBe('Europe/Berlin');
  });

  it('throws unknownSetting RangeError for a key that is not a setting, such as timeZone, before applying any', () => {
    expect(() => configure({ timeZone: 'Europe/Berlin' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownSetting', at: 'timeZone' }),
    );
    expect(() => configure({ locale: 'de-DE', lang: 'de' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownSetting', at: 'lang' }),
    );
    expect(configure().locale).toBeUndefined();
  });

  // the check is a development aid that production builds fold out along with the error explanations
  it('ignores a key that is not a setting when NODE_ENV=production', () => {
    const script = `
      import { configure } from 'native-dates';
      console.log(JSON.stringify(configure({ timeZone: 'Europe/Berlin', locale: 'de-DE' })));
    `;
    const printed = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      env: { ...process.env, NODE_ENV: 'production' },
      encoding: 'utf8',
    });
    expect(JSON.parse(printed)).toEqual({ locale: 'de-DE', dayFirst: false, zoneAliases: {} });
  });

  // vitest isolates modules per test file and this file imports no plugins
  it('throws missingPlugin RangeError when configuring an option from an unimported plugin', () => {
    expect(() => configure({ dayFirst: true })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'dayFirst' }),
    );
    expect(() => configure({ zoneAliases: { hq: 'Europe/Berlin' } })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'zoneAliases' }),
    );
  });
});

describe('configure({ zone })', () => {
  it('applies the configured zone to DateTimes created without an explicit zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T17:30:00Z')).toMatchObject({ zone: 'Asia/Tokyo', day: 17, hour: 2 });
    expect(now().zone).toBe('Asia/Tokyo');
  });

  it('interprets offset-less wall-clock strings in the configured zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T09:30').toString()).toBe('2026-11-16T00:30:00.000Z');
    expect(date('2026-11-16').at('9:30am').toString()).toBe('2026-11-16T00:30:00.000Z');
  });

  it('extracts the CalendarDate and Time of an instant in the configured zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(date('2026-11-16T17:30:00Z').toString()).toBe('2026-11-17');
    expect(time('2026-11-16T17:30:00Z').toString()).toBe('02:30:00');
  });

  it('prefers an explicit call-site zone or bracketed IANA zone over the configured zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(datetime('2026-11-16T17:30:00Z', 'Europe/Berlin').zone).toBe('Europe/Berlin');
    expect(now('UTC').zone).toBe('UTC');
    expect(datetime('2026-11-16T09:30[America/New_York]').zone).toBe('America/New_York');
  });

  // zone is bound at DateTime construction whereas locale is read lazily at format time
  it('keeps the original zone on DateTimes created before configure({ zone }) and values derived from them', () => {
    configure({ zone: 'Europe/Berlin' });
    const created = datetime('2026-11-16T17:30:00Z');
    configure({ zone: 'Asia/Tokyo' });
    expect(created).toMatchObject({ zone: 'Europe/Berlin', hour: 18 });
    expect(created.plus(1, 'day').at('9am')).toMatchObject({ zone: 'Europe/Berlin', day: 17, hour: 9 });
  });

  it('resets to the runtime default zone when set to null', () => {
    const runtimeZone = now().zone;
    configure({ zone: 'Asia/Tokyo' });
    expect(configure({ zone: null }).zone).toBeUndefined();
    expect(now().zone).toBe(runtimeZone);
  });

  it('throws unknownZone RangeError for an invalid zone and preserves the previous zone', () => {
    configure({ zone: 'Asia/Tokyo' });
    expect(() => configure({ zone: 'Tokyo' })).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'unknownZone', at: 'Tokyo' }),
    );
    expect(configure().zone).toBe('Asia/Tokyo');
  });
});

describe('configure({ locale })', () => {
  it('formats instances without an explicit locale using the configured locale', () => {
    configure({ locale: 'es-ES' });
    expect(date('2026-05-15').format('long')).toContain('mayo');
    expect(yearMonth('2026-05').format('long')).toContain('mayo');
    expect(days(2).text).toContain('días');
    expect(monthNames()[4]).toBe('mayo');
  });

  it('uses the newly configured locale when formatting previously created instances', () => {
    const day = date('2026-05-15');
    configure({ locale: 'es-ES' });
    expect(day.format('MMMM')).toBe('mayo');
    configure({ locale: 'fr-FR' });
    expect(day.format('MMMM')).toBe('mai');
  });

  it('derives startOf("week") from the configured locale while leaving weekStart undefined', () => {
    configure({ locale: 'de-DE' });
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-16');
    expect(configure().weekStart).toBeUndefined();
  });

  it('normalizes POSIX underscore tags, tag arrays, and HTTP Accept-Language headers', () => {
    expect(configure({ locale: 'pt_BR' }).locale).toBe('pt-BR');
    expect(configure({ locale: ['fr-CA', 'fr'] }).locale).toEqual(['fr-CA', 'fr']);
    expect(configure({ locale: 'de-DE,de;q=0.9,en;q=0.8' }).locale).toEqual(['de-DE', 'de', 'en']);
    expect(date('2026-05-15').format('MMMM')).toBe('Mai');
  });

  it.each([['null', null], ['an empty string', '']])(
    'resets to the runtime default locale when set to %s',
    (name, empty) => {
      const inRuntimeLocale = date('2026-05-15').format('full');
      configure({ locale: 'ja-JP' });
      expect(configure({ locale: empty }).locale).toBeUndefined();
      expect(date('2026-05-15').format('full')).toBe(inRuntimeLocale);
    },
  );

  it('throws unknownLocale RangeError for an invalid tag and preserves the previous locale', () => {
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
  ])('normalizes %j to ISO weekday number %i (Monday = 1, Sunday = 7)', (day, number) => {
    expect(configure({ weekStart: day }).weekStart).toBe(number);
  });

  it('reverts to locale-derived weekStart when set to null', () => {
    configure({ locale: 'de-DE', weekStart: 'sunday' });
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-15');
    expect(configure({ weekStart: null }).weekStart).toBeUndefined();
    expect(date('2026-11-18').startOf('week').toString()).toBe('2026-11-16');
  });

  // Date.prototype.getDay(), Moment, and date-fns use 0 for Sunday
  it.each([[0], ['funday']])(
    'throws unknownDayOfWeek RangeError for %j and preserves the previous weekStart',
    (day) => {
      configure({ weekStart: 'saturday' });
      expect(() => configure({ weekStart: day })).toThrowError(
        expect.objectContaining({ name: 'RangeError', code: 'unknownDayOfWeek', at: String(day) }),
      );
      expect(configure().weekStart).toBe(6);
    },
  );
});

describe('default zone, locale, and weekStart from process environment', () => {
  // spawn a child process because TZ and LC_ALL are read at startup (skipped on Windows where LC_ALL is ignored)
  it.skipIf(process.platform === 'win32')('inherits the default zone, locale, and weekStart from TZ and LC_ALL', () => {
    const script = `
      import { date, now } from 'native-dates';
      const month = date('2026-05-15').format('MMMM');
      console.log(JSON.stringify({ zone: now().zone, month, weekStart: date('2026-11-18').weekStart }));
    `;
    const printed = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      env: { ...process.env, TZ: 'Asia/Tokyo', LC_ALL: 'de_DE.UTF-8' },
      encoding: 'utf8',
    });
    expect(JSON.parse(printed)).toEqual({ zone: 'Asia/Tokyo', month: 'Mai', weekStart: 1 });
  });

  it.skipIf(process.platform === 'win32')('starts weeks on Sunday (7) when started with LC_ALL=en_US.UTF-8', () => {
    const script = `
      import { date, weekdayNames } from 'native-dates';
      const wednesday = date('2026-11-18');
      const start = wednesday.startOf('week').toString();
      console.log(JSON.stringify({ weekStart: wednesday.weekStart, start, first: weekdayNames()[0] }));
    `;
    const printed = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      env: { ...process.env, LC_ALL: 'en_US.UTF-8' },
      encoding: 'utf8',
    });
    expect(JSON.parse(printed)).toEqual({ weekStart: 7, start: '2026-11-15', first: 'Sun' });
  });
});
