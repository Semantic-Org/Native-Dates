// reads root CHANGELOG.md at build time and turns it into HTML + TOC entries for /changelog/
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { date } from 'native-dates';

import { DEFAULT_LOCALE } from './i18n.js';
import { esc } from './markdown/inline.js';
import { PACKAGE_DIR } from './sizes.js';

const RELEASE_HEADING_RE = /^(.+?)\s+\((\d{4}-\d{2}-\d{2})\)$/;
const NOTE_PREFIX_RE = /^Note:\s+(.+)$/;
const NOTE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>';

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const renderInline = (text = '') =>
  esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const attrs = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${href}"${attrs}>${label}</a>`;
    });

export function changelogData(locale = DEFAULT_LOCALE, dir = PACKAGE_DIR) {
  const raw = readFileSync(resolve(dir, 'CHANGELOG.md'), 'utf8');
  const lines = raw.split(/\r?\n/);
  const toc = [];
  const blocks = [];
  let title = 'Changelog';
  let lede = '';
  let list = [];
  let para = [];
  let seenRelease = false;

  const flushPara = () => {
    if (!para.length) { return; }
    const text = para.join(' ').trim();
    para = [];
    const noteMatch = text.match(NOTE_PREFIX_RE);
    if (noteMatch) {
      blocks.push(`<div class="callout" data-kind="note">${NOTE_ICON}<div><p>${renderInline(noteMatch[1])}</p></div></div>`);
      return;
    }
    if (!seenRelease && !lede) {
      lede = text;
      return;
    }
    blocks.push(`<p>${renderInline(text)}</p>`);
  };

  const flushList = () => {
    if (!list.length) { return; }
    blocks.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith('# ') && !seenRelease && blocks.length === 0) {
      title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      flushPara();
      flushList();
      seenRelease = true;
      const rawHeading = line.slice(3).trim();
      const match = rawHeading.match(RELEASE_HEADING_RE);
      const text = match ? match[1].trim() : rawHeading;
      const isoDate = match ? match[2] : null;
      const slug = slugify(text);
      toc.push({ depth: 2, slug, text, symbol: false });
      blocks.push(`<h2 id="${slug}">${renderInline(text)}</h2>`);
      if (isoDate) {
        const formatted = date(isoDate).locale(locale).format('long');
        blocks.push(`<p class="release-date"><time datetime="${isoDate}">${esc(formatted)}</time></p>`);
      }
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      flushList();
      const text = line.slice(4).trim();
      blocks.push(`<h3>${renderInline(text)}</h3>`);
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushPara();
      list.push(line.slice(2).trim());
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();

  return { title, lede, html: blocks.join('\n'), toc, raw };
}
