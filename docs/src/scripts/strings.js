// read localized UI strings serialized into #ui-strings by lib/i18n.js so client scripts share build-time translations
let strings;
const all = () => strings ??= (() => {
  try { return JSON.parse(document.getElementById('ui-strings')?.textContent ?? '{}'); }
  catch { return {}; }
})();

export function ui(key, vars = {}) {
  return (all()[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

export function plural(key, count, vars = {}) {
  const locale = all().$pluralLocales?.[key] ?? document.documentElement.lang;
  const form = new Intl.PluralRules(locale).select(count);
  return ui(`${key}.${form}` in all() ? `${key}.${form}` : `${key}.other`, vars);
}

export function suggested() {
  return all().$suggested ?? [];
}
