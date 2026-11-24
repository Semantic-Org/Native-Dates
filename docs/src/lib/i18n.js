import { getCollection } from 'astro:content';

import english from '../content/strings.json';
import { HOME_LOCALES } from '../data/home-locales.js';
import { ICON } from './icons.js';
import { DEFAULT_LOCALE, ENABLED, localeOf, localePath, TRANSLATED, unlocalized } from './locales.js';
import { sourceHash } from './source-hash.js';

export * from './locales.js';

// keys are tied to a specific English wording. Changing English copy requires a new key
// so locales fall back to English instead of serving a stale translation
const STRINGS = Object.fromEntries(
  Object.entries(import.meta.glob('../content/translations/*/strings.json', { eager: true, import: 'default' }))
    .map(([file, strings]) => [file.split('/').at(-2), strings]),
);
const stringsOf = (code) => STRINGS[localeOf(code).path] ?? {};

// require language.* keys before enabling a locale so untranslated-page notices are localized
for (const { code, path } of TRANSLATED) {
  const missing = Object.keys(english).filter((key) => key.startsWith('language.') && !stringsOf(code)[key]);
  if (missing.length) { throw new Error(`translations/${path}/strings.json is missing ${missing.join(', ')}`); }
}

export const hasStrings = (code, prefix) => Object.keys(stringsOf(code)).some((key) => key.startsWith(prefix));

export const draftStrings = (code) => stringsOf(code).$reviewed === false;

export const languagesWith = (prefix, { reviewed = false } = {}) =>
  [DEFAULT_LOCALE, ...TRANSLATED
    .filter((l) => hasStrings(l.code, prefix) && !(reviewed && draftStrings(l.code))).map((l) => l.code)];

// reset dir to ltr so English fallback content reads left-to-right inside an RTL layout
export const englishIn = (code) => ({ lang: DEFAULT_LOCALE, dir: localeOf(code).dir === 'rtl' ? 'ltr' : undefined });

// unknown keys return as-is so literal names can pass through alongside string keys
const text = (code, key) => stringsOf(code)[key] ?? english[key] ?? key;
export function t(code, key, vars = {}) {
  return text(code, key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

export function plural(code, key, count, vars = {}) {
  // match plural rules to the locale supplying the strings so CJK fallbacks to English pick singular forms
  const own = stringsOf(code);
  const source = Object.keys(own).some((k) => k.startsWith(`${key}.`)) ? code : DEFAULT_LOCALE;
  const form = `${key}.${new Intl.PluralRules(source).select(count)}`;
  const written = t(source, form, vars);
  return written === form ? t(source, `${key}.other`, vars) : written;
}

// scan client scripts for ui('...') and plural('...') calls at build time so pages only inline
// the strings used in the browser
const SCRIPTS = Object.values(import.meta.glob(
  ['../scripts/**/*.js', '../components/**/*.astro', '../views/*.astro', '../layouts/*.astro'],
  { eager: true, query: '?raw', import: 'default' },
));
const keysIn = (call) => [...new Set(
  SCRIPTS.flatMap((source) => [...source.matchAll(new RegExp(`\\b${call}\\(([^)]*)`, 'g'))])
    .flatMap(([, args]) => [...args.matchAll(/'([a-z]+\.[\w.-]+)'/gi)].map(([, key]) => key)),
)];
const SCRIPT_KEYS = keysIn('ui');
const SCRIPT_PLURALS = keysIn('plural');
export function scriptStrings(code, { home = false } = {}) {
  // take all plural forms from one locale and record that locale so CJK fallbacks pick English singulars
  const own = stringsOf(code);
  const pluralLocales = {};
  const forms = SCRIPT_PLURALS.filter((family) => home || !family.startsWith('home.')).flatMap((family) => {
    const of = (strings) => Object.keys(strings).filter((key) => key.startsWith(`${family}.`));
    const ownForms = of(own);
    pluralLocales[family] = ownForms.length ? code : DEFAULT_LOCALE;
    return ownForms.length ? ownForms : of(english);
  });
  const entries = [...SCRIPT_KEYS, ...forms]
    .filter((key) => home || !key.startsWith('home.'))
    .map((key) => [key, text(code, key)]);
  return { ...Object.fromEntries(entries), $pluralLocales: pluralLocales };
}

export const formatDate = (code, date) =>
  date.toLocaleDateString(code, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// translations mirror content/ paths under content/translations/<locale>/ so prose fields override
// English while metadata is inherited, using source hashes to flag stale pages
let twins;
export async function inLanguage(entry, code) {
  if (code === DEFAULT_LOCALE) { return { page: entry, translated: true, stale: false, draft: false }; }
  twins ??= new Map((await getCollection('translations')).map((e) => [e.filePath, e]));
  const twin = twins.get(entry.filePath.replace('/content/', `/content/translations/${localeOf(code).path}/`));
  if (!twin) { return { page: entry, translated: false, stale: false, draft: false }; }
  const { source, reviewed, ...words } = twin.data;
  const own = Object.fromEntries(Object.entries(words).filter(([, value]) => value !== undefined));
  return { page: { ...twin, id: entry.id, data: { ...entry.data, ...own } }, translated: true, stale: source !== sourceHash(entry), draft: reviewed === false };
}

const titleCache = new Map();
export async function titlesIn(code) {
  if (code === DEFAULT_LOCALE) { return new Map(); }
  if (titleCache.has(code)) { return titleCache.get(code); }
  const titled = async (collection, slug) =>
    (await Promise.all((await getCollection(collection)).map((entry) => inLanguage(entry, code))))
      .filter((p) => p.translated).map((p) => [slug(p.page.id), p.page.data.title]);
  const map = new Map([...await titled('docs', (id) => id), ...await titled('examples', (id) => `examples/${id}`)]);
  titleCache.set(code, map);
  return map;
}

const SEARCH_SUGGESTED = [
  { section: 'nav.guides', slug: 'guides/types-of-time', title: 'Types of time' },
  { section: 'nav.guides', slug: 'guides/time-zones', title: 'Time zones' },
  { section: 'nav.api', slug: 'api/date-time', title: 'DateTime', symbol: true },
  { section: 'nav.api', slug: 'api/ranges', title: 'Ranges' },
];

export async function searchSuggested(code) {
  const titles = await titlesIn(code);
  return SEARCH_SUGGESTED.map((item) => ({
    section: t(code, item.section),
    title: titles.get(item.slug) ?? item.title,
    url: localePath(`/${item.slug}/`, code),
    ...(item.symbol ? { symbol: true } : {}),
  }));
}

const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>';

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

// each language carries the first zone and the locale its homepage already demonstrates so the globe
// (scripts/language-globe.js) can turn to it. English has neither, so it follows the reader's own zone
export function languageMenu(pathname, code) {
  if (ENABLED.length < 2) { return ''; }
  const path = unlocalized(pathname);
  const items = ENABLED.map((l) => {
    const on = l.code === code;
    const home = HOME_LOCALES[l.code];
    return `<a class="pop-item" role="menuitemradio" data-language-pick="${l.code}" data-locale="${home?.configuredLocale ?? l.code}" data-zone="${home?.try.zones[0] ?? ''}" aria-checked="${on}" href="${localePath(path, l.code)}" hreflang="${l.code}" lang="${l.code}"><span>${l.name}</span>${on ? CHECK : ''}</a>`;
  }).join('');
  return `<div class="version-menu language-menu" data-menu data-language-globe>
  <button class="version-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="${t(code, 'language.label')}: ${localeOf(code).name}">${ICON.globe}<span class="language-code">${code}</span>${CHEVRON}</button>
  <div class="pop-menu" hidden>
    <div class="language-list" role="menu" aria-label="${t(code, 'language.label')}">${items}</div>
    <div class="language-globe" aria-hidden="true"><canvas width="168" height="168"></canvas><p class="globe-now" dir="auto"></p><code class="globe-zone"></code><a class="globe-go" tabindex="-1"><span class="globe-go-name" dir="auto"></span>${ARROW}</a></div>
  </div>
</div>`;
}

// native <select> for the mobile drawer because the topbar menu is hidden on narrow viewports (scripts/site.js)
export function languageSelect(pathname, code) {
  if (ENABLED.length < 2) { return ''; }
  const path = unlocalized(pathname);
  const options = ENABLED.map((l) =>
    `<option value="${localePath(path, l.code)}" data-code="${l.code}" lang="${l.code}"${l.code === code ? ' selected' : ''}>${l.name}</option>`
  ).join('');
  return `<label class="language-select"><span>${t(code, 'language.label')}</span><select data-language-select>${options}</select></label>`;
}

// split all translations from reviewed ones so drafts can be offered to readers without indexing in search engines
export async function languagesOf(entry) {
  const states = await Promise.all(ENABLED.map(async (l) => ({ code: l.code, ...await inLanguage(entry, l.code) })));
  const written = states.filter((s) => s.translated);
  return { writtenIn: written.map((s) => s.code), translatedIn: written.filter((s) => !s.draft).map((s) => s.code) };
}

// serialized for layouts/Base.astro so saved preferences can redirect to any enabled locale while banners list translated ones
export function languageOffer(pathname, code, writtenIn) {
  const path = unlocalized(pathname);
  return {
    page: code,
    english: DEFAULT_LOCALE,
    paths: Object.fromEntries(ENABLED.map((l) => [l.code, localePath(path, l.code)])),
    others: writtenIn.filter((other) => other !== code).map((other) => ({
      code: other,
      dir: localeOf(other).dir,
      href: localePath(path, other),
      offer: t(other, 'language.offer'),
      go: t(other, 'language.go'),
      dismiss: t(other, 'language.dismiss'),
    })),
    remember: { ask: t(code, 'language.remember'), yes: t(code, 'language.remember.yes'), no: t(code, 'language.remember.no') },
  };
}

export async function behind() {
  const english = new Map(
    (await Promise.all(['docs', 'examples'].map((collection) => getCollection(collection)))).flat()
      .map((entry) => [entry.filePath, entry]),
  );
  return (await getCollection('translations')).flatMap((twin) => {
    const entry = english.get(twin.filePath.replace(/\/translations\/[^/]+\//, '/'));
    if (!entry) { return [{ file: twin.filePath, orphan: true }]; }
    const source = sourceHash(entry);
    return twin.data.source === source ? [] : [{ file: twin.filePath, english: entry.filePath, source }];
  });
}
