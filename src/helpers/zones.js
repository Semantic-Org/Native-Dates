import { each, isPlainObject, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { guard, refuse, requireLoose } from './errors.js';
import { nameCache, weekdayWidths } from './tokens.js';
import { dayOfWeek } from './units.js';

// process-wide defaults mutated by configure()
export const settings = {
  zone: undefined,
  locale: undefined,
  weekStart: undefined,
  dayFirst: false,
  zoneAliases: {},
  weekdayNames: undefined,
  ordinals: undefined,
  formats: undefined,
};
const resolved = new Map([['UTC', 'UTC']]);

export const canonicalZone = (id) => {
  try {
    return Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(id).timeZoneId;
  }
  catch {
    return undefined;
  }
};

let zoneExtension = null;

export const setZoneExtension = (resolver) => {
  zoneExtension = resolver;
  resolved.clear();
  resolved.set('UTC', 'UTC');
};

export const zoneId = (id) => {
  if (id === undefined || id === null) {
    return settings.zone ?? Temporal.Now.timeZoneId();
  }
  if (!isString(id)) {
    refuse('unknownZone', String(id), {
      explanation: isDevelopment
        ? "expected a time zone string such as 'America/New_York', a fixed offset like '+05:30', or 'UTC'"
        : 0,
    });
  }
  const known = resolved.get(id);
  if (known) {
    return known;
  }
  const found = zoneExtension ? zoneExtension(id, settings.zoneAliases) : canonicalZone(id.trim());
  if (!found) {
    refuse('unknownZone', id, {
      explanation: isDevelopment
        ? zoneExtension
          ? "expected an IANA time zone like 'America/New_York', a city like 'Berlin', an abbreviation like 'PT', a fixed offset like '+05:30', or 'UTC'. To add custom names, call `configure({ zoneAliases: { hq: 'Europe/Berlin' } })`"
          : "expected an IANA time zone like 'America/New_York', a fixed offset like '+05:30', or 'UTC'. Import '@native-dates/plugins/zones' to use city names like 'Berlin', abbreviations like 'PT', or `zoneAliases`"
        : 0,
    });
  }
  resolved.set(id, found);
  return found;
};

export const configure = ({ zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats } = {}) => {
  if (zoneAliases !== undefined) {
    if (!zoneExtension) {
      refuse('missingPlugin', 'zoneAliases', {
        explanation: isDevelopment
          ? "`zoneAliases` requires the zones plugin. Import '@native-dates/plugins/zones' once at startup"
          : 0,
      });
    }
    if (zoneAliases !== null && !isPlainObject(zoneAliases)) {
      refuse('invalidZoneAliases', String(zoneAliases), {
        explanation: isDevelopment
          ? "`zoneAliases` must be a plain object mapping alias names to time zones like `{ hq: 'Europe/Berlin' }`, or `null` to clear all aliases"
          : 0,
      });
    }
    if (zoneAliases === null) {
      settings.zoneAliases = {};
    }
    each(zoneAliases, (target, name) => {
      if (target == null) {
        delete settings.zoneAliases[name];
      }
      else {
        settings.zoneAliases[name] = zoneId(target);
      }
    });
    resolved.clear();
    resolved.set('UTC', 'UTC');
  }
  if (zone !== undefined) {
    settings.zone = zone === null ? undefined : zoneId(zone);
  }
  if (locale !== undefined) {
    settings.locale = locale ? checkedLocale(locale) : undefined;
  }
  if (weekStart !== undefined) {
    settings.weekStart = weekStart === null ? undefined : dayOfWeek(weekStart);
  }
  // validate widths and day keys eagerly in configure() rather than failing later on first format()
  each(weekdayNames, (widths) =>
    each(widths, (days, width) => {
      if (!weekdayWidths[width]) {
        refuse('unknownWidth', width, {
          explanation: isDevelopment
            ? "`weekdayNames` are written by language, then width, then day, like `{ lv: { narrow: { fri: 'Pk' } } }`. Expected a width in [narrow, short, long]"
            : 0,
        });
      }
      each(days, (name, day) => dayOfWeek(day));
    }));
  // normalize locale keys to lowercase so 'pt-BR' and 'pt-br' merge into one entry
  each({ weekdayNames, ordinals }, (table, noun) => {
    if (table !== undefined) {
      settings[noun] = table === null ? undefined : {};
      each(table, (entry, tag) => {
        settings[noun][tag.toLowerCase()] = entry;
      });
      nameCache.clear();
    }
  });
  // null-prototype copy prevents Object.prototype keys like 'toString' from matching in namedFormat()
  if (formats !== undefined) {
    settings.formats = formats && { __proto__: null, ...formats };
  }
  if (dayFirst !== undefined) {
    requireLoose('dayFirst');
    settings.dayFirst = !!dayFirst;
  }
  return { ...settings, zoneAliases: { ...settings.zoneAliases } };
};

// accept BCP 47 tags, POSIX 'en_US' tags, tag arrays, and raw HTTP Accept-Language headers
const knownLocales = new Map();
export const checkedLocale = (tag) => {
  // bracket array keys so ['es', 'en'] doesn't collide with header string 'es,en'
  const key = isString(tag) ? tag : `[${tag}]`;
  if (!knownLocales.has(key)) {
    // parse Accept-Language q-weights in descending order, dropping '*' wildcards and q=0 rejections
    const tags = isString(tag) && /[_,;*]/.test(tag)
      ? tag.replace(/_/g, '-').split(',')
        .map((part) => part.trim().split(/\s*;\s*q=/))
        .filter(([name, weight]) => name && name !== '*' && weight != 0)
        .sort((a, b) => (b[1] ?? 1) - (a[1] ?? 1))
        .map(([name]) => name)
      : undefined;
    guard(
      () => Intl.getCanonicalLocales(tags ?? tag),
      'unknownLocale',
      String(tag),
      isDevelopment
        ? "expected a locale tag like 'en-US' or 'de', an array of tags, or an HTTP `Accept-Language` header"
        : 0,
    );
    knownLocales.set(key, tags && (tags.length === 1 ? tags[0] : Object.freeze(tags)));
  }
  return (isString(tag) && knownLocales.get(key)) || tag;
};

// checked before built-in presets so apps can redefine names like 'short'
export const namedFormat = (spec) => (isString(spec) && settings.formats?.[spec]) || spec;

export const locale = (override) => (override === undefined ? settings.locale : checkedLocale(override));
export const dayFirst = (override) => (override === undefined ? settings.dayFirst : !!override);

const firstDays = new Map();
export const weekStart = (override, tag = settings.locale) => {
  if (override !== undefined) {
    return dayOfWeek(override);
  }
  if (settings.weekStart !== undefined) {
    return settings.weekStart;
  }
  const key = String(tag);
  if (!firstDays.has(key)) {
    // pass single tag strings straight to Intl.Locale so region and -u-fw- extensions survive,
    // resolving through DateTimeFormat only for undefined (system locale) or tag arrays
    const read = tag === undefined ? tag : checkedLocale(tag);
    const asked = isString(read) ? read : new Intl.DateTimeFormat(read).resolvedOptions().locale;
    firstDays.set(key, new Intl.Locale(asked).getWeekInfo?.().firstDay ?? 1);
  }
  return firstDays.get(key);
};
