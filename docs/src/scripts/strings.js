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
  const form = new Intl.PluralRules(document.documentElement.lang).select(count);
  return ui(`${key}.${form}` in all() ? `${key}.${form}` : `${key}.other`, vars);
}
