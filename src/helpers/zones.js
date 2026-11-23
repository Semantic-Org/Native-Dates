import { each, isPlainObject, isString, remember } from './utils.js';

import { isDevelopment } from './environment.js';
import { guard, refuse, requireLoose } from './errors.js';
import { nameCache, weekdayWidths } from './tokens.js';
import { dayOfWeek } from './units.js';

let textCache = new WeakMap();
export const cachedText = (self, spec) => {
  let value = textCache.get(self);
  if (value === undefined) {
    textCache.set(self, value = self.format(spec));
  }
  return value;
};
export const settings = {
  zone: undefined,
  locale: undefined,
  weekStart: undefined,
  dayFirst: undefined,
  zoneAliases: {},
  weekdayNames: undefined,
  ordinals: undefined,
  formats: undefined,
};
const resolved = new Map();

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
};

// plugins may read a name by the caller's locale ('CST' is Shanghai in zh-CN), so results cache per locale
export const zoneId = (id, tag) => {
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
  const activeLocale = locale(tag);
  const key = `${id}|${activeLocale ?? ''}`;
  const known = resolved.get(key);
  if (known) {
    return known;
  }
  const found = zoneExtension ? zoneExtension(id, settings.zoneAliases, activeLocale) : canonicalZone(id.trim());
  if (!found) {
    refuse('unknownZone', id, {
      explanation: isDevelopment
        ? zoneExtension
          ? "expected an IANA time zone like 'America/New_York', a city like 'Berlin', an abbreviation like 'PT', a fixed offset like '+05:30', or 'UTC'. To add custom names, call `configure({ zoneAliases: { hq: 'Europe/Berlin' } })`"
          : "expected an IANA time zone like 'America/New_York', a fixed offset like '+05:30', or 'UTC'. Import '@native-dates/plugins/zones' to use city names like 'Berlin', abbreviations like 'PT', or `zoneAliases`"
        : 0,
    });
  }
  return remember(resolved, key, found);
};

export const configure = (options) => {
  const { zone, locale, weekStart, dayFirst, zoneAliases, weekdayNames, ordinals, formats } = options ??= {};
  each(options, (value, name) => {
    if (!Object.hasOwn(settings, name)) {
      refuse('unknownSetting', name, {
        explanation: isDevelopment ? `expected a setting in [${Object.keys(settings).join(', ')}]` : 0,
      });
    }
  });
  // set first because a plugin may read zone names by the locale ('CST' under 'zh-CN')
  if (locale !== undefined) {
    settings.locale = locale ? checkedLocale(locale) : undefined;
  }
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
  }
  if (zone !== undefined) {
    settings.zone = zone === null ? undefined : zoneId(zone);
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
    settings.dayFirst = dayFirst === null ? undefined : !!dayFirst;
  }
  textCache = new WeakMap();
  return { ...settings, zoneAliases: { ...settings.zoneAliases } };
};

const disambiguations = ['compatible', 'earlier', 'later', 'reject'];
export const checkedDisambiguation = (mode) =>
  mode === undefined || disambiguations.includes(mode)
    ? (mode ?? 'compatible')
    : refuse('unknownDisambiguation', String(mode), {
      explanation: isDevelopment
        ? `expected a disambiguation mode in [${disambiguations.join(', ')}]`
        : 0,
    });

const canonicalTag = (name) => {
  try {
    return Intl.getCanonicalLocales(name)[0];
  }
  catch {
    return undefined;
  }
};

// accept BCP 47 tags, POSIX 'en_US' tags, tag arrays, Intl.Locale instances, and raw HTTP Accept-Language headers
const validObjects = new WeakSet();
const knownLocales = new Map();
export const checkedLocale = (tag) => {
  if (!tag || (isString(tag) && !tag.trim())) {
    return undefined;
  }
  if (validObjects.has(tag)) {
    return tag;
  }
  const explanation = isDevelopment
    ? "expected a locale tag like 'en-US' or 'de', an array of tags, or an HTTP `Accept-Language` header"
    : 0;
  if (!isString(tag)) {
    guard(
      () => (Array.isArray(tag) || tag instanceof Intl.Locale ? Intl.getCanonicalLocales(tag) : fail()),
      'unknownLocale',
      tag,
      explanation,
    );
    validObjects.add(tag);
    return tag;
  }
  if (!knownLocales.has(tag)) {
    const kept = /[_,;*]/.test(tag)
      && tag.replace(/_/g, '-').split(',')
        .map((part) => part.trim().split(/\s*;\s*q=/i))
        .filter(([name, weight]) => name && name !== '*' && weight != 0)
        .sort((a, b) => (b[1] ?? 1) - (a[1] ?? 1));
    const tags = kept && kept.flatMap(([name]) => canonicalTag(name) ?? []);
    guard(
      () => (kept ? kept.length && !tags.length && fail() : Intl.getCanonicalLocales(tag.trim())),
      'unknownLocale',
      tag,
      explanation,
    );
    remember(
      knownLocales,
      tag,
      kept ? (tags.length > 1 ? (validObjects.add(tags), Object.freeze(tags)) : tags[0]) : tag.trim(),
    );
  }
  return knownLocales.get(tag);
};

// checked before built-in presets so apps can redefine names like 'short'
export const namedFormat = (spec) => (isString(spec) && settings.formats?.[spec]) || spec;

// fall back to configured locale when an override header like '*' resolves to undefined
export const locale = (override) =>
  override === undefined ? settings.locale : checkedLocale(override) ?? settings.locale;
export const dayFirst = (override, localeOverride) =>
  override !== undefined
    ? !!override
    : (localeOverride !== undefined && checkedLocale(localeOverride) !== undefined)
    ? undefined
    : settings.dayFirst;

// take the first tag Intl supports as it was written, so region and -u-fw- extensions survive where
// DateTimeFormat would resolve 'en-CN' to 'en', and use the system locale when none is supported
export const intlLocale = (activeLocale) =>
  new Intl.Locale(
    Intl.DateTimeFormat.supportedLocalesOf(activeLocale)[0] ?? new Intl.DateTimeFormat().resolvedOptions().locale,
  );

const weekInfos = new Map();
const weekInfo = (tag) => {
  const activeLocale = locale(tag);
  const key = String(activeLocale);
  return weekInfos.get(key)
    ?? remember(weekInfos, key, intlLocale(activeLocale).getWeekInfo?.() ?? { firstDay: 1, weekend: [6, 7] });
};

export const weekStart = (override, tag) =>
  override !== undefined ? dayOfWeek(override) : settings.weekStart ?? weekInfo(tag).firstDay;

export const weekendDays = (tag) => weekInfo(tag).weekend;

export const isWeekend = (day, tag) => weekendDays(tag).includes(day);
