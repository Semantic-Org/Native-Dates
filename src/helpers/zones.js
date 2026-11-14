import { guard, refuse, requireLoose } from './errors.js';
import { isDevelopment, isPlainObject, isString } from './types.js';
import { weekdayNumber } from './units.js';

// process-wide defaults, zoneAliases being the names a zone answers to when plugins/zones is loaded
const settings = { zone: undefined, locale: undefined, weekStart: undefined, dayFirst: false, zoneAliases: {} };
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
        ? 'a zone is an IANA name like America/New_York, a fixed offset like +05:30, or UTC'
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
          ? "a zone is an IANA name like America/New_York, a city like Berlin or los angeles, an abbreviation like PT or CET, a fixed offset like +05:30, or UTC. name your own once: configure({ zoneAliases: { hq: 'Europe/Berlin' } })"
          : "a zone is an IANA name like America/New_York, a fixed offset like +05:30, or UTC. import '@native-dates/plugins/zones' for cities like Berlin, abbreviations like PT, and zoneAliases"
        : 0,
    });
  }
  resolved.set(id, found);
  return found;
};

export const configure = ({ zone, locale, weekStart, dayFirst, zoneAliases } = {}) => {
  if (zoneAliases !== undefined) {
    if (!zoneExtension) {
      refuse('missingPlugin', 'zoneAliases', {
        explanation: isDevelopment
          ? "import '@native-dates/plugins/zones' for zoneAliases"
          : 0,
      });
    }
    if (zoneAliases !== null && !isPlainObject(zoneAliases)) {
      refuse('unknownZone', String(zoneAliases), {
        explanation: isDevelopment ? "zoneAliases is an object of names to zones: { hq: 'Europe/Berlin' }" : 0,
      });
    }
    // null clears every alias, and a null target clears that one name
    if (zoneAliases === null) {
      settings.zoneAliases = {};
    }
    for (const [name, target] of Object.entries(zoneAliases ?? {})) {
      if (target == null) {
        delete settings.zoneAliases[name];
      }
      else {
        settings.zoneAliases[name] = zoneId(target);
      }
    }
    resolved.clear();
    resolved.set('UTC', 'UTC');
  }
  if (zone !== undefined) {
    settings.zone = zone === null ? undefined : zoneId(zone);
  }
  if (locale !== undefined) {
    settings.locale = locale === null ? undefined : checkedLocale(locale);
  }
  if (weekStart !== undefined) {
    settings.weekStart = weekStart === null ? undefined : weekdayNumber(weekStart);
  }
  if (dayFirst !== undefined) {
    requireLoose('dayFirst');
    settings.dayFirst = !!dayFirst;
  }
  return { ...settings, zoneAliases: { ...settings.zoneAliases } };
};

// an Accept-Language header is the classic first attempt, and Intl would refuse it far from the cause
const knownLocales = new Set();
const checkedLocale = (tag) => {
  const key = String(tag);
  if (!knownLocales.has(key)) {
    guard(
      () => Intl.getCanonicalLocales(tag),
      'unknownLocale',
      key,
      isDevelopment
        ? "a locale is a BCP 47 tag like 'en-US' or 'de', or a list of them. pick one out of an Accept-Language header"
        : 0,
    );
    knownLocales.add(key);
  }
  return tag;
};

export const locale = (override) => (override === undefined ? settings.locale : checkedLocale(override));
export const dayFirst = (override) => (override === undefined ? settings.dayFirst : !!override);
// the day a week starts on: the one a call names, then the one configured, then the locale's own,
// sunday in the United States and saturday in Egypt, read from the value's locale, the configured
// one or the runtime's. monday where the platform cannot say
const firstDays = new Map();
export const weekStart = (override, tag = settings.locale) => {
  if (override !== undefined) {
    return weekdayNumber(override);
  }
  if (settings.weekStart !== undefined) {
    return settings.weekStart;
  }
  const key = String(tag);
  if (!firstDays.has(key)) {
    // a tag is asked as written, so its region and its own -u-fw- choice count. the runtime's
    // locale, or a list of them, is first resolved to one tag
    const asked = isString(tag) ? tag : new Intl.DateTimeFormat(tag).resolvedOptions().locale;
    firstDays.set(key, new Intl.Locale(asked).getWeekInfo?.().firstDay ?? 1);
  }
  return firstDays.get(key);
};
