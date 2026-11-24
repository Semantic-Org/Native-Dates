// run headless Chromium DOM assertions against a built docs/dist directory across desktop and mobile viewports.
// flags: --locale=ja,ar (target specific locales), --strict (fail on notices, canonical/hreflang, or sitemap gaps).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { DEFAULT_LOCALE, ENABLED, localePath } from '../src/lib/locales.js';

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

const LEAKED_PLACEHOLDER = /\{[a-z][a-zA-Z0-9]*\}/;
const LITERAL_TAG = /<\/?(?:bdi|code|em|strong|abbr|span|small|a|button)\b/i;
const LITERAL_ENTITY = /&(?:nbsp|amp|lt|gt|quot);/i;

function resolveLocale(input) {
  const normalized = String(input).trim().toLowerCase();
  return ENABLED.find((l) => l.path === normalized || l.code.toLowerCase() === normalized) ?? null;
}

function serveDist() {
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      const urlPath = (req.url ?? '/').split('?')[0];
      let file = resolve(distDir, `.${urlPath}`);
      if (existsSync(file) && statSync(file).isDirectory()) { file = resolve(file, 'index.html'); }
      if (!existsSync(file) || (file !== distDir && !file.startsWith(`${distDir}/`))) {
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

function checkProse(prose, label, failures) {
  if (LEAKED_PLACEHOLDER.test(prose)) {
    failures.push(`${label}: leaked placeholder ${prose.match(LEAKED_PLACEHOLDER)[0]}`);
  }
  if (LITERAL_TAG.test(prose)) {
    failures.push(`${label}: literal escaped HTML tag ${prose.match(LITERAL_TAG)[0]}`);
  }
  if (LITERAL_ENTITY.test(prose)) {
    failures.push(`${label}: literal HTML entity ${prose.match(LITERAL_ENTITY)[0]}`);
  }
  if (/\bundefined\b/.test(prose)) {
    failures.push(`${label}: literal "undefined" in visible prose`);
  }
}

async function readProse(page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const prose = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest('code, pre, script, style, noscript, .param-type, .pg-editor, .cm-editor, [hidden]')) { continue; }
      const text = node.textContent.trim();
      if (text) { prose.push(text); }
    }
    return prose.join('\n');
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

  const targets = [];
  if (requested.length) {
    for (const input of requested) {
      const matched = resolveLocale(input);
      if (!matched) {
        console.error(`  x unknown --locale="${input}"`);
        process.exit(1);
      }
      if (!targets.includes(matched)) { targets.push(matched); }
    }
  }
  else {
    targets.push(...ENABLED);
  }

  let server;
  let browser;
  const failures = [];

  try {
    const started = await serveDist();
    server = started.server;
    const { origin } = started;
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    if (strict) {
      const sitemapPath = resolve(distDir, 'sitemap.xml');
      const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';
      for (const locale of targets) {
        if (locale.code === DEFAULT_LOCALE) { continue; }
        for (const landing of ['/', '/plugins/', '/examples/']) {
          const expected = localePath(landing, locale.code);
          if (!sitemap.includes(`${expected}</loc>`)) {
            failures.push(`sitemap.xml: missing reviewed landing "${expected}"`);
          }
        }
      }
    }

    for (const locale of targets) {
      for (const route of ROUTES) {
        const path = localePath(route, locale.code);
        for (const viewport of VIEWPORTS) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          const errors = [];
          const onError = (err) => errors.push(err.message);
          page.on('pageerror', onError);
          const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
          if (route === '/') {
            await page.waitForSelector('[data-say]', { timeout: 5000 }).catch(() => {});
          }

          const label = `${path} (${viewport.name})`;
          if (!response || response.status() !== 200) {
            page.off('pageerror', onError);
            failures.push(`${label}: HTTP ${response?.status() ?? 'none'}`);
            continue;
          }

          const check = await page.evaluate(() => {
            const doc = document.documentElement;
            const overflow = doc.scrollWidth - doc.clientWidth;
            const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
            const hreflangs = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((el) =>
              el.getAttribute('hreflang')
            );
            const notices = [...document.querySelectorAll('.locale-notice, .archive-banner')].map((el) =>
              el.textContent.trim()
            );
            return { overflow, lang: doc.lang, dir: doc.dir, canonical, hreflangs, notices };
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
          if (strict) {
            if (check.notices.length) {
              failures.push(`${label}: unexpected notice banner (${check.notices[0]})`);
            }
            if (!check.canonical.endsWith(path)) {
              failures.push(`${label}: canonical "${check.canonical}" does not end with "${path}"`);
            }
            if (locale.code !== DEFAULT_LOCALE && !check.hreflangs.includes(locale.code)) {
              failures.push(`${label}: missing hreflang="${locale.code}"`);
            }
          }

          checkProse(await readProse(page), label, failures);

          // interact with hidden Say tabs, Consoles tabs, and search dialog on desktop homepage
          if (route === '/' && viewport.name === 'desktop') {
            const sayTabs = page.locator('.say-tab');
            const sayCount = await sayTabs.count();
            for (let i = 0; i < sayCount; i++) {
              await sayTabs.nth(i).click();
              const tabName = (await sayTabs.nth(i).textContent())?.trim() ?? `#${i + 1}`;
              const gridOverflow = await page.evaluate(() => {
                const grid = document.querySelector('.say-grid:not([hidden])');
                return grid ? grid.scrollWidth - grid.clientWidth : 0;
              });
              if (gridOverflow > 2) {
                failures.push(`${label} [say:${tabName}]: .say-grid overflows by ${gridOverflow}px`);
              }
              checkProse(await readProse(page), `${label} [say:${tabName}]`, failures);
            }

            const askTabs = page.locator('.ask-tab');
            const askCount = await askTabs.count();
            for (let i = 1; i < askCount; i++) {
              await askTabs.nth(i).click();
              checkProse(await readProse(page), `${label} [consoles:#${i + 1}]`, failures);
            }

            const trigger = page.locator('.search-trigger').first();
            if (await trigger.count()) {
              await trigger.click();
              const searchCheck = await page.evaluate(() => {
                const dialog = document.querySelector('dialog.search');
                const hrefs = [...(dialog?.querySelectorAll('.search-opt') ?? [])].map((a) => a.getAttribute('href'));
                return { open: Boolean(dialog?.open), hrefs };
              });
              if (searchCheck.open && locale.code !== DEFAULT_LOCALE) {
                const bad = searchCheck.hrefs.filter((href) => href && !href.startsWith(`/${locale.path}/`));
                if (bad.length) {
                  failures.push(`${label} [search]: unlocalized suggested URL(s): ${bad.join(', ')}`);
                }
              }
              checkProse(await readProse(page), `${label} [search:suggested]`, failures);
              const searchInput = page.locator('dialog.search input[type="search"]');
              if (await searchInput.count()) {
                await searchInput.fill('zzzznomatch12345');
                await page.waitForTimeout(200);
                checkProse(await readProse(page), `${label} [search:empty]`, failures);
              }
              await page.keyboard.press('Escape');
            }
          }

          page.off('pageerror', onError);
          if (errors.length) {
            failures.push(`${label}: pageerror ${errors.join('; ')}`);
          }
        }
      }
    }
  }
  finally {
    if (browser) { await browser.close(); }
    if (server) { server.close(); }
  }

  if (failures.length) {
    failures.forEach((line) => console.error(`  x ${line}`));
    process.exit(1);
  }
  console.log(`i18n dom  ok (${targets.length} locale(s), ${ROUTES.length} routes, ${VIEWPORTS.length} viewports)`);
}

main();
