import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import { transformerMetaHighlight } from '@shikijs/transformers';
import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';
import { createCssVariablesTheme } from 'shiki';

import { astroI18n } from './src/lib/locales.js';
import { rehypeDocs } from './src/lib/markdown/rehype-docs.js';
import { remarkDocs } from './src/lib/markdown/remark-docs.js';
import { transformerFenceMeta } from './src/lib/markdown/shiki-meta.js';

// shiki writes css variables; tokens.css maps them onto the site's syntax colors, so code follows
// the theme toggle with no second highlighting pass
const theme = createCssVariablesTheme({ name: 'native-dates', variablePrefix: '--shiki-', fontStyle: true });
// read as the site reads code: object keys as keys, the colon after them as punctuation, comments set back
theme.tokenColors.push(
  {
    scope: ['meta.object-literal.key', 'support.type.property-name'],
    settings: { foreground: 'var(--shiki-token-parameter)' },
  },
  {
    scope: ['punctuation.separator.key-value', 'meta.object-literal.key punctuation'],
    settings: { foreground: 'var(--shiki-token-punctuation)' },
  },
  {
    scope: ['comment', 'punctuation.definition.comment'],
    settings: { foreground: 'var(--shiki-token-comment)', fontStyle: 'italic' },
  },
);

export default defineConfig({
  // where the site is served: share cards and canonical links are absolute, so a staging build sets
  // SITE_URL. the default is a stand-in until the domain is chosen (lib/versions.js has the same one)
  site: process.env.SITE_URL ?? 'https://native-dates.example',
  trailingSlash: 'always',
  // the languages (lib/locales.js); english at the root, the rest under their path
  i18n: astroI18n,
  devToolbar: { enabled: false },
  // the sizes are measured from the package above these docs (lib/sizes.js)
  vite: { server: { fs: { allow: ['..'] } } },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkDocs],
      // ids first, so the docs plugin can anchor headings; astro then skips its own pass
      rehypePlugins: [rehypeHeadingIds, rehypeDocs],
    }),
    shikiConfig: {
      theme,
      transformers: [transformerMetaHighlight(), transformerFenceMeta()],
    },
  },
});
