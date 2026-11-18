import { each, isPlainObject, isString } from './utils.js';

import { isDevelopment } from './environment.js';
import { guard, refuse, requireLoose } from './errors.js';
import { nameCache, weekdayWidths } from './tokens.js';
import { dayOfWeek } from './units.js';

// process-wide defaults, zoneAliases being the names a zone answers to when plugins/zones is loaded
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

// an IANA name, a fixed offset, or UTC in core, plus cities, abbreviations and zoneAliases when
// plugins/zones is loaded. resolves once per spelling and hands back the canonical id
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
          ? "expected an IANA time zone like 'America/New_York', a city like 'Berlin', an abbreviation like 'PT', a fixed offset like '+05:30', or 'UTC'. to add custom names, call `configure({ zoneAliases: { hq: 'Europe/Berlin' } })`"
          : "expected an IANA time zone like 'America/New_York', a fixed offset like '+05:30', or 'UTC'. import '@native-dates/plugins/zones' to use city names like 'Berlin', abbreviations like 'PT', or `zoneAliases`"
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
          ? "`zoneAliases` requires the zones plugin. import '@native-dates/plugins/zones' once at startup"
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
    // null clears every alias, and a null target clears that one name
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
  // a width left out or misspelled would otherwise fail far from here, at the first format
  each(weekdayNames, (widths) =>
    each(widths, (days, width) => {
      if (!weekdayWidths[width]) {
        refuse('unknownWidth', width, {
          explanation: isDevelopment
            ? "`weekdayNames` are written by language, then width, then day, like `{ lv: { narrow: { fri: 'Pk' } } }`. expected a width in [narrow, short, long]"
            : 0,
        });
      }
      each(days, (name, day) => dayOfWeek(day));
    }));
  // names and ordinals an app writes its own way, by language. a tag is kept in lower case, so
  // 'pt-br' and 'pt-BR' are one, and null goes back to what Intl has
  each({ weekdayNames, ordinals }, (table, noun) => {
    if (table !== undefined) {
      settings[noun] = table === null ? undefined : {};
      each(table, (entry, tag) => {
        settings[noun][tag.toLowerCase()] = entry;
      });
      nameCache.clear();
    }
  });
  // a format an app names once and asks for everywhere, a preset of its own: an options bag or a
  // token pattern. a bag is kept as it was written and finds its formatter by its fields, so naming
  // the same formats again builds nothing new. null takes them all away
  if (formats !== undefined) {
    settings.formats = formats && { __proto__: null, ...formats };
  }
  if (dayFirst !== undefined) {
    requireLoose('dayFirst');
    settings.dayFirst = !!dayFirst;
  }
  return { ...settings, zoneAliases: { ...settings.zoneAliases } };
};

// a locale is read however it arrives. 'en_US' is how a server, a database or java spells en-US, and
// an Accept-Language header, 'fr-CH, fr;q=0.9, en;q=0.8', is the tags a reader wants in the order
// they want them, which is what Intl takes as a list
const knownLocales = new Map();
export const checkedLocale = (tag) => {
  // a list and a header can spell the same text, 'es,en', and are not the same thing to hand back
  const key = isString(tag) ? tag : `[${tag}]`;
  if (!knownLocales.has(key)) {
    // a header's tags are taken by weight, q, and never one weighed at nothing. * is any language
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
    // one tag is a tag, and a list is frozen since every caller is handed the same one
    knownLocales.set(key, tags && (tags.length === 1 ? tags[0] : Object.freeze(tags)));
  }
  return (isString(tag) && knownLocales.get(key)) || tag;
};

// the format an app configured under a name, or the spec as it came. it is asked first, so an app can
// give a built-in name like 'short' its own meaning
export const namedFormat = (spec) => (isString(spec) && settings.formats?.[spec]) || spec;

export const locale = (override) => (override === undefined ? settings.locale : checkedLocale(override));
export const dayFirst = (override) => (override === undefined ? settings.dayFirst : !!override);
// the day a week starts on: the one a call names, then the one configured, then the locale's own,
// sunday in the United States and saturday in Egypt, read from the value's locale, the configured
// one or the runtime's. monday where the platform cannot say
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
    // a tag is asked as written, so its region and its own -u-fw- choice count. the runtime's
    // locale, or a list of them, is first resolved to one tag
    const read = tag === undefined ? tag : checkedLocale(tag);
    const asked = isString(read) ? read : new Intl.DateTimeFormat(read).resolvedOptions().locale;
    firstDays.set(key, new Intl.Locale(asked).getWeekInfo?.().firstDay ?? 1);
  }
  return firstDays.get(key);
};
