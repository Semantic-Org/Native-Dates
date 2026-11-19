// kept free of astro:* imports so astro.config.mjs and remark/rehype plugins can load it directly

export const DEFAULT_LOCALE = 'en';

export const LOCALES = [
  { code: 'en', name: 'English', dir: 'ltr', enabled: true },
  { code: 'zh-CN', name: '简体中文', dir: 'ltr', enabled: true },
  { code: 'ja', name: '日本語', dir: 'ltr', enabled: true },
  { code: 'pt-BR', name: 'Português (Brasil)', dir: 'ltr', enabled: true },
  { code: 'es', name: 'Español', dir: 'ltr', enabled: true },
  { code: 'ko', name: '한국어', dir: 'ltr', enabled: true },
  { code: 'ru', name: 'Русский', dir: 'ltr', enabled: true },
  { code: 'fr', name: 'Français', dir: 'ltr', enabled: true },
  { code: 'ar', name: 'العربية', dir: 'rtl', enabled: true },
].map((l) => ({ ...l, path: l.code.toLowerCase() }));

export const ENABLED = LOCALES.filter((l) => l.enabled);
export const TRANSLATED = ENABLED.filter((l) => l.code !== DEFAULT_LOCALE);
export const localeOf = (code) => LOCALES.find((l) => l.code === code) ?? LOCALES[0];

export const localePath = (path, code = DEFAULT_LOCALE) =>
  code === DEFAULT_LOCALE || !path.startsWith('/') ? path : `/${localeOf(code).path}${path}`;

export function unlocalized(pathname) {
  const first = pathname.split('/')[1];
  return TRANSLATED.some((l) => l.path === first) ? pathname.slice(first.length + 1) || '/' : pathname;
}

// use { path, codes } when casing differs because Astro matches URL prefixes case-sensitively
export const astroI18n = {
  defaultLocale: DEFAULT_LOCALE,
  locales: ENABLED.map((l) => (l.path === l.code ? l.code : { path: l.path, codes: [l.code] })),
};
