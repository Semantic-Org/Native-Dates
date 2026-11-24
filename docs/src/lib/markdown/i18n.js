import Slugger from 'github-slugger';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_LOCALE, localeOf, LOCALES } from '../locales.js';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, '../../content');

// cache json reads by mtime so astro dev picks up edits to strings.json without restarting
const cache = new Map();
function readJson(file) {
  if (!existsSync(file)) { return {}; }
  const { mtimeMs } = statSync(file);
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === mtimeMs) { return hit.data; }
  const data = JSON.parse(readFileSync(file, 'utf8'));
  cache.set(file, { mtimeMs, data });
  return data;
}

const english = () => readJson(resolve(contentDir, 'strings.json'));
const stringsOf = (code) =>
  code === DEFAULT_LOCALE
    ? english()
    : readJson(resolve(contentDir, 'translations', localeOf(code).path, 'strings.json'));

export function localeFromPath(filePath) {
  const folder = filePath?.match(/content\/translations\/([^/]+)\//)?.[1];
  return LOCALES.find((l) => l.path === folder) ?? LOCALES[0];
}

export function englishTwin(filePath) {
  if (!filePath || !/\/content\/translations\/[^/]+\//.test(filePath)) { return null; }
  return filePath.replace(/\/content\/translations\/[^/]+\//, '/content/');
}

const text = (code, key) => stringsOf(code)[key] ?? english()[key] ?? key;

export function t(code, key, vars = {}) {
  return text(code, key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

export function plural(code, key, count, vars = {}) {
  // match plural rules to the locale supplying the strings so CJK fallbacks to English pick "1 option"
  const own = stringsOf(code);
  const source = Object.keys(own).some((k) => k.startsWith(`${key}.`)) ? code : DEFAULT_LOCALE;
  const form = `${key}.${new Intl.PluralRules(source).select(count)}`;
  const written = t(source, form, vars);
  return written === form ? t(source, `${key}.other`, vars) : written;
}

const stripFrontmatter = (markdown) => markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

// mirror rehypeHeadingIds slugging so translated pages inherit stable English anchor IDs
export function headingsOf(markdown) {
  const slugger = new Slugger();
  const headings = [];
  let inFence = false;
  for (const line of stripFrontmatter(markdown).split(/\r?\n/)) {
    if (/^`{3,}/.test(line)) { inFence = !inFence; continue; }
    if (inFence) { continue; }
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) { continue; }
    const label = match[2].replace(/\s*:kind\[[^\]]+\]\s*$/, '').replace(/`([^`]+)`/g, '$1').trim();
    headings.push({ depth: match[1].length, id: slugger.slug(label) });
  }
  return headings;
}

// record which column index holds "Type" in each English table so translated headers keep .t styling
export function typeColumnsOf(markdown) {
  const cols = [];
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  let inFence = false;
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^`{3,}/.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence) { continue; }
    if (lines[i].includes('|') && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
      const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      cols.push(cells.indexOf('Type'));
    }
  }
  return cols;
}
