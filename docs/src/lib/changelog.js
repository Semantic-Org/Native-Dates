// reads root CHANGELOG.md at build time and turns it into HTML + TOC entries for /changelog/
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { esc } from './markdown/inline.js';
import { PACKAGE_DIR } from './sizes.js';

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

export function changelogData(dir = PACKAGE_DIR) {
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
      const text = line.slice(3).trim();
      const slug = slugify(text);
      toc.push({ depth: 2, slug, text, symbol: false });
      blocks.push(`<h2 id="${slug}">${renderInline(text)}</h2>`);
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
