import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import { transformerMetaHighlight } from '@shikijs/transformers';
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
import remarkDirective from 'remark-directive';
import { createCssVariablesTheme } from 'shiki';

import { astroI18n } from './src/lib/locales.js';
import { rehypeDocs } from './src/lib/markdown/rehype-docs.js';
import { remarkDocs } from './src/lib/markdown/remark-docs.js';
import { transformerFenceMeta } from './src/lib/markdown/shiki-meta.js';

// Shiki emits CSS variables mapped in tokens.css so syntax colors follow theme toggles without re-highlighting
const theme = createCssVariablesTheme({ name: 'native-dates', variablePrefix: '--shiki-', fontStyle: true });
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

const HOST = 'local.nativedates.dev';
const CERT = { key: `./cert/${HOST}-key.pem`, cert: `./cert/${HOST}.pem` };
const hasCert = existsSync(CERT.key) && existsSync(CERT.cert);
if (!hasCert) { console.warn('[site] no cert in cert/: dev runs over http on :4321. Run `npm run cert`.'); }

export default defineConfig({
  // staging builds set SITE_URL=https://staging.nativedates.dev so canonical links and share cards use the staging domain
  site: process.env.SITE_URL ?? 'https://nativedates.dev',
  trailingSlash: 'always',
  i18n: astroI18n,
  // serves https://local.nativedates.dev on :443 when cert/ exists, falling back to plain http on :4321
  server: { host: true, port: hasCert ? 443 : 4321 },
  devToolbar: { enabled: false },
  vite: {
    server: {
      allowedHosts: [HOST],
      // allow reading parent workspace packages for bundle size measurement in lib/sizes.js
      fs: { allow: ['..'] },
      ...(hasCert && {
        https: { key: readFileSync(CERT.key), cert: readFileSync(CERT.cert) },
        hmr: { host: HOST, protocol: 'wss' },
      }),
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkDocs],
      // run rehypeHeadingIds before rehypeDocs so custom heading anchors are already assigned
      rehypePlugins: [rehypeHeadingIds, rehypeDocs],
    }),
    shikiConfig: {
      theme,
      transformers: [transformerMetaHighlight(), transformerFenceMeta()],
    },
  },
});
