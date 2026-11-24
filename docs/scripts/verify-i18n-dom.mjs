// run headless Chromium DOM assertions against a built docs/dist directory across desktop and mobile viewports.
// flags: --locale=ja,ar (target specific locales), --strict (fail if untranslated/draft/stale notices appear).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { DEFAULT_LOCALE, localeOf, localePath, TRANSLATED } from '../src/lib/locales.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const distDir = resolve(here, '../dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const ROUTES = [
  '/',
  '/guides/types-of-time/',
  '/api/date-time/',
  '/plugins/',
  '/plugins/loose/',
  '/examples/',
  '/examples/meeting-planner/',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const LEAKED_PLACEHOLDER = /\{(?:count|hours|rounds|ratio|size|city|zone|minutes|date|year|near|far|time|changes|days|query|name|category|shown|total|percent|ms|message|heading|value|title|links|language|version|assistant|url|call)\}/;
const LITERAL_TAG = /<\/?(?:bdi|code|em|strong|abbr|span|small|a|button)\b/i;

function serveDist() {
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      const urlPath = (req.url ?? '/').split('?')[0];
      let file = resolve(distDir, `.${urlPath}`);
      if (existsSync(file) && statSync(file).isDirectory()) { file = resolve(file, 'index.html'); }
      if (!existsSync(file) || !file.startsWith(distDir)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveServer({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

async function main() {
  if (!existsSync(distDir)) {
    console.error('docs/dist not found. Run `npm -w docs run build` first.');
    process.exit(1);
  }
  const argv = process.argv.slice(2);
  const strict = argv.includes('--strict');
  const requested = argv
    .filter((arg) => arg.startsWith('--locale='))
    .flatMap((arg) => arg.slice('--locale='.length).split(','))
    .filter(Boolean);
  const targets = requested.length
    ? requested.map((code) => localeOf(code))
    : [localeOf(DEFAULT_LOCALE), ...TRANSLATED];

  const { server, origin } = await serveDist();
  const browser = await chromium.launch();
  const failures = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const locale of targets) {
      for (const route of ROUTES) {
        const path = localePath(route, locale.code);
        for (const viewport of VIEWPORTS) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          const errors = [];
          const onError = (err) => errors.push(err.message);
          page.on('pageerror', onError);
          const response = await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
          page.off('pageerror', onError);

          const label = `${path} (${viewport.name})`;
          if (!response || response.status() !== 200) {
            failures.push(`${label}: HTTP ${response?.status() ?? 'none'}`);
            continue;
          }
          if (errors.length) {
            failures.push(`${label}: pageerror ${errors.join('; ')}`);
          }

          const check = await page.evaluate(() => {
            const doc = document.documentElement;
            const overflow = doc.scrollWidth - doc.clientWidth;
            const lang = doc.lang;
            const dir = doc.dir;
            const notices = [...document.querySelectorAll('.locale-notice, .archive-banner')].map((el) =>
              el.textContent.trim()
            );
            // collect visible prose outside code/pre/script/style blocks
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const prose = [];
            let node;
            while ((node = walker.nextNode())) {
              const parent = node.parentElement;
              if (!parent || parent.closest('code, pre, script, style, noscript, .param-type, [hidden]')) { continue; }
              const text = node.textContent.trim();
              if (text) { prose.push(text); }
            }
            return { overflow, lang, dir, notices, prose: prose.join('\n') };
          });

          if (check.lang !== locale.code) {
            failures.push(`${label}: lang="${check.lang}" != "${locale.code}"`);
          }
          if (check.dir !== locale.dir) {
            failures.push(`${label}: dir="${check.dir}" != "${locale.dir}"`);
          }
          if (check.overflow > 1) {
            failures.push(`${label}: horizontal overflow of ${check.overflow}px`);
          }
          if (LEAKED_PLACEHOLDER.test(check.prose)) {
            failures.push(`${label}: leaked placeholder ${check.prose.match(LEAKED_PLACEHOLDER)[0]}`);
          }
          if (LITERAL_TAG.test(check.prose)) {
            failures.push(`${label}: literal escaped HTML tag ${check.prose.match(LITERAL_TAG)[0]}`);
          }
          if (/\bundefined\b/.test(check.prose)) {
            failures.push(`${label}: literal "undefined" in visible prose`);
          }
          if (strict && check.notices.length) {
            failures.push(`${label}: unexpected notice banner (${check.notices[0]})`);
          }
        }
      }
    }
  }
  finally {
    await browser.close();
    server.close();
  }

  if (failures.length) {
    failures.forEach((line) => console.error(`  x ${line}`));
    process.exit(1);
  }
  console.log(`i18n dom  ok (${targets.length} locale(s), ${ROUTES.length} routes, ${VIEWPORTS.length} viewports)`);
}

main();
