// validates YAML frontmatter, markdown links, #anchors, GFM tables, unclosed fences, ai/ paths, skill frontmatter, and AGENTS.md symlinks

import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { checkSkills } from '../skills.js';
import { checkDecisions } from './decisions-index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const errors = [];

const markdownIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(dir, entry.name);
      if (entry.isSymbolicLink()) { return []; }
      if (entry.isDirectory()) { return markdownIn(path); }
      return entry.name.endsWith('.md') ? [path] : [];
    })
    : [];

// skip upstream-synced ai/contributing/standards/* files whose links reference their source repos
const standardsDir = resolve(root, 'ai/contributing/standards');
const workspaceDir = resolve(root, 'ai/workspace');
const files = [
  ...['AGENTS.md', 'CONTRIBUTING.md', 'README.md', 'docs/README.md', 'tools/ci/bundle/README.md'].map((file) =>
    resolve(root, file)
  ),
  ...markdownIn(resolve(root, 'ai')).filter((file) =>
    file === resolve(standardsDir, 'README.md')
    || ![standardsDir, workspaceDir].some((dir) => file.startsWith(`${dir}/`))
  ),
];

const stripCodeFences = (source) => {
  const out = [];
  let fence = null;
  for (const line of source.split('\n')) {
    const match = /^\s*(`{3,}|~{3,})/.exec(line);
    if (match) {
      if (!fence) { fence = match[1]; }
      else if (match[1][0] === fence[0] && match[1].length >= fence.length) { fence = null; }
      out.push('');
      continue;
    }
    out.push(fence ? '' : line);
  }
  return out.join('\n');
};

const anchorCache = new Map();
function anchorsOf(file) {
  if (anchorCache.has(file)) { return anchorCache.get(file); }
  const counts = new Map();
  const anchors = new Set();
  for (const line of stripCodeFences(readFileSync(file, 'utf8')).split('\n')) {
    const match = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) { continue; }
    const base = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*_~]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/ /g, '-');
    if (!base) { continue; }
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    anchors.add(seen === 0 ? base : `${base}-${seen}`);
  }
  anchorCache.set(file, anchors);
  return anchors;
}

const isTableDelimiter = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line) && line.includes('-');
const isTableRow = (line) => /^\s*\|/.test(line);

const stripInlineCode = (line) => line.replace(/(?<!`)(`+)(?!`)([\s\S]*?)(?<!`)\1(?!`)/g, '');

function countCells(line) {
  let cells = 0;
  let escaped = false;
  const trimmed = stripInlineCode(line.trim().replace(/^\|/, '').replace(/\|$/, ''));
  for (const ch of trimmed) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '|') { cells++; }
  }
  return cells + 1;
}

export function checkMarkdownStructure(source) {
  const lines = source.split('\n');
  const findings = [];
  let startIndex = 0;
  const frontMatch = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(source);
  if (frontMatch) {
    startIndex = frontMatch[0].split('\n').length - (frontMatch[0].endsWith('\n') ? 1 : 0);
    try {
      parseYaml(frontMatch[1]);
    }
    catch (err) {
      findings.push(`L1: invalid YAML frontmatter (${err.message.split('\n')[0]})`);
    }
  }
  let fence = null;
  let fenceLine = 0;
  let table = null;
  let previous = '';

  lines.forEach((line, index) => {
    if (index < startIndex) { return; }
    const lineNumber = index + 1;
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      if (!fence) {
        fence = fenceMatch[1];
        fenceLine = lineNumber;
      }
      else if (fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null;
      }
      table = null;
      previous = line;
      return;
    }
    if (fence) {
      previous = line;
      return;
    }
    if (isTableRow(line)) {
      const next = lines[index + 1] ?? '';
      if (table) {
        const cells = countCells(line);
        if (cells !== table.header && !isTableDelimiter(line)) {
          findings.push(`L${lineNumber}: ragged table row (${cells} cells vs ${table.header} in header)`);
        }
      }
      else if (isTableDelimiter(next)) {
        table = { header: countCells(line) };
        if (previous.trim() !== '' && !/^#/.test(previous.trim())) {
          findings.push(`L${lineNumber}: table needs a blank line above its header row`);
        }
      }
      else {
        findings.push(`L${lineNumber}: loose table row without an active table header above it`);
      }
    }
    else {
      table = null;
    }
    previous = line;
  });

  if (fence) {
    findings.push(`L${fenceLine}: unclosed code fence running to end of file`);
  }
  return findings;
}

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const name = relative(root, file);
  for (const problem of checkMarkdownStructure(raw)) {
    errors.push(`${name}: ${problem}`);
  }

  const text = stripCodeFences(raw);
  for (const [, target] of stripInlineCode(text).matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|\/)/.test(target)) { continue; }
    if (target.startsWith('#')) {
      if (!anchorsOf(file).has(target.slice(1))) {
        errors.push(`${name}: broken anchor ${target}`);
      }
      continue;
    }
    const [rawPath, hash] = target.split('#');
    const resolved = resolve(dirname(file), rawPath);
    if (!existsSync(resolved)) {
      errors.push(`${name}: link to ${target}`);
      continue;
    }
    if (hash) {
      const docFile = statSync(resolved).isDirectory() ? resolve(resolved, 'README.md') : resolved;
      if (docFile.endsWith('.md') && existsSync(docFile) && !anchorsOf(docFile).has(hash)) {
        errors.push(`${name}: broken anchor ${target}`);
      }
    }
  }

  for (const [, path] of text.matchAll(/`(ai\/[\w./-]+)`/g)) {
    if (path.startsWith('ai/workspace')) { continue; }
    if (!existsSync(resolve(root, path))) { errors.push(`${name}: path ${path}`); }
  }
}

for (const link of ['CLAUDE.md', 'GEMINI.md']) {
  const path = resolve(root, link);
  const linked = existsSync(path) && lstatSync(path).isSymbolicLink() && readlinkSync(path) === 'AGENTS.md';
  if (!linked) { errors.push(`${link}: not a symlink to AGENTS.md`); }
}

errors.push(...checkDecisions());
errors.push(...checkSkills());

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const error of errors) { console.error(`  x ${error}`); }
  console.log(errors.length ? `\nai  ${errors.length} to fix` : `ai  ok (${files.length} files)`);
  process.exitCode = errors.length ? 1 : 0;
}
