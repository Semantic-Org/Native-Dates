import { guard, refuse, requireLoose } from './errors.js';
import { isDevelopment, isPlainObject, isString } from './types.js';
import { weekdayNumber } from './units.js';

// process-wide defaults, zoneAliases being the names a zone answers to when plugins/zones is loaded
const settings = { zone: undefined, locale: undefined, weekStart: 1, dayFirst: false, zoneAliases: {} };
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
          : "a zone is an IANA name like America/New_York, a fixed offset like +05:30, or UTC. import '@native-dates/core/plugins/zones' for cities like Berlin, abbreviations like PT, and zoneAliases"
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
          ? "import '@native-dates/core/plugins/zones' for zoneAliases"
          : 0,
      });
    }
    if (!isPlainObject(zoneAliases)) {
      refuse('unknownZone', String(zoneAliases), {
        explanation: isDevelopment ? "zoneAliases is an object of names to zones: { hq: 'Europe/Berlin' }" : 0,
      });
    }
    for (const [name, target] of Object.entries(zoneAliases)) {
      settings.zoneAliases[name] = zoneId(target);
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
    settings.weekStart = weekdayNumber(weekStart);
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
export const weekStart = (override) => (override === undefined ? settings.weekStart : weekdayNumber(override));
