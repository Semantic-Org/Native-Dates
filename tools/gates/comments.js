#!/usr/bin/env node
// checks comment density, run length, restatement overlap, commented-out code, and banned process jargon
//   npm run comments                        # scan all package JS/TS source (--all)
//   node tools/gates/comments.js            # diff mode against merge-base
//   node tools/gates/comments.js --report   # print metrics and heaviest files without failing

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { styleText } from 'node:util';

const require = createRequire(import.meta.url);

const REFERENCE = {
  explain: { p50: 7.7, p75: 10.4, fileP90: 18.2 },
  run: { p90: 6 },
  doc: { p90: 11, ratioMedian: 7.8, ratioP75: 16.2 },
  deadCode: 0.1,
  shape: { short: 76.6 },
  why: { share: 33.5 },
};

const WHY = [
  /\bbecause\b/i,
  /\bsince\b/i,
  /\bso that\b/i,
  /\bso we\b/i,
  /\botherwise\b/i,
  /\bavoids?\b/i,
  /\bso (?!far\b|called\b|on\b|much\b|many\b|long\b|good\b)\w/i,
  /\bprevents?\b/i,
  /\bworkaround\b/i,
  /\bdue to\b/i,
  /\bin order to\b/i,
  /\bneeded (for|to|by)\b/i,
  /\brequired (for|to|by)\b/i,
  /\bmust\b/i,
  /\bcan(no|')t\b/i,
  /\bwon'?t\b/i,
  /\bwould (break|fail|be)\b/i,
  /\bbreaks?\b/i,
  /\bfails?\b/i,
  /\bbug\b/i,
  /\bissue #?\d/i,
  /https?:\/\//i,
  /#\d{3,}/,
  /\bspec\b/i,
  /\bper the\b/i,
  /\bsafari\b/i,
  /\bfirefox\b/i,
  /\bchrome\b/i,
  /\bnode\s?\d/i,
  /\bperf(ormance)?\b/i,
  /\bfast(er)?\b/i,
  /\bslow(er)?\b/i,
  /\bhot path\b/i,
  /\bdeopt/i,
  /\bv8\b/i,
  /\bedge case\b/i,
  /\blegacy\b/i,
  /\bhistorical\b/i,
  /\bdeprecated\b/i,
  /\bintentional/i,
  /\bon purpose\b/i,
  /\bnote:/i,
  /\bcaveat\b/i,
  /\bgotcha\b/i,
  /\bassumes?\b/i,
  /\bguarantee/i,
  /\binvariant\b/i,
  /\bkeep in sync\b/i,
  /\bcompat/i,
  /\btrade-?off\b/i,
];

const FUNC = new Set((
  'the a an to of and or is are was be been being we it this that these those there here for in on '
  + 'if else when then do does did with by from at its our their his her not no but so as you they he she '
  + 'all any some each every into out up down over under just only also very can could should would may might will '
  + 'have has had s t re ll d ve'
).split(' '));

const stem = (word) => word.replace(/ies$/, 'y').replace(/(ing|ed|es|s)$/, '').replace(/e$/, '');
const contentWords = (text) => [
  ...new Set(
    text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ')
      .filter((word) => word.length > 2 && !FUNC.has(word)).map(stem),
  ),
];
const codeWords = (text) =>
  new Set(
    text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ').split(' ').filter((word) => word.length > 2).map(stem),
  );

const DEFAULT_STOP_WORDS = [
  'corpus',
  'as-built',
  'priors audit',
  'charter',
  'chartered',
  'stamped',
  'docket',
  'sitting',
  'ruling',
  'ruled',
  'naming pass',
  'naming-pass',
  'blind-spot',
  'frictions ledger',
  'red-first',
  'red-before',
  'schedule row',
  '/\\brows?[-\\s]?\\d+\\b/',
  '/\\brounds?[-\\s]?\\d+\\b/',
  '/(?<![\\[\\w])#\\d+\\b/',
];

const DEFAULTS = {
  include: ['src', 'packages', 'integrations'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.astro/**',
    '**/public/sandbox/**',
    '**/public/libs/**',
    '**/*.d.ts',
    '**/*.test.*',
    '**/*.spec.*',
    '**/__tests__/**',
    '**/__mocks__/**',
    '**/fixtures/**',
    '**/test/**',
    '**/tests/**',
  ],
  maxExplainRatio: 12,
  maxDocRatio: false,
  maxFileRatio: 20,
  minLinesForRatio: 25,
  maxRun: 6,
  maxDoc: 20,
  maxWords: 100,
  minShortShare: 80,
  minUnitsForShape: 10,
  maxOverlap: 0.6,
  minWhyShare: 22,
  noDeadCode: true,
  stopWords: DEFAULT_STOP_WORDS,
  stopWordScope: ['comments'],
  failOnParseError: true,
  allowInlineIgnores: true,
  maxListed: 10,
};

const EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx']);
const PRAGMA =
  /^\s*(eslint\b|eslint-|@ts-|prettier-ignore|istanbul\b|c8\s|v8\s|globals?\s|jshint|@flow\b|@__PURE__|#__PURE__|webpack[A-Za-z]|@vite-ignore|deno-lint|biome-ignore|dprint-|oxlint|@jsx\b|@__NO_SIDE_EFFECTS__|@ts-check)/i;
const LICENSE = /copyright|@license|licen[cs]e|SPDX-|all rights reserved/i;
const TYPE_TAG =
  /^@(type|typedef|template|import|satisfies|extends|augments|overload|callback|property|prop|typeParam|module|namespace)\b/;
const SIGNATURE_TAG = /^@(param|arg|argument|returns?|yields?|throws?)\b/;
const ROW = /^[A-Za-z_$][\w$.]*(?:\([^)]*\))?[ \t]+(?=\S)/;

function body(raw) {
  if (raw.startsWith('//')) { return raw.slice(2).trim(); }
  return raw.replace(/^\/\*+/, '').replace(/\*+\/$/, '')
    .split('\n').map((line) => line.replace(/^\s*\*?\s?/, '').trimEnd()).join('\n').trim();
}

function isTable(raws) {
  if (raws.length < 2) { return false; }
  const gaps = raws.map((raw) => ROW.exec(body(raw))?.[0]);
  if (!gaps.every(Boolean)) { return false; }
  return gaps.every((gap) => gap.length === gaps[0].length) && gaps.some((gap) => /\s{2,}$/.test(gap));
}

function fail(message) {
  process.stderr.write(styleText('red', `comments: ${message}`, { stream: process.stderr }) + '\n');
  process.exit(2);
}

function loadTs() {
  for (const id of ['typescript', 'ts5', 'typescript-5']) {
    try {
      const mod = require(id);
      if (typeof mod.createSourceFile === 'function') { return mod; }
    }
    catch { /* try next */ }
  }
  fail('requires TypeScript AST API (`npm install -D typescript`)');
}

function git(args) {
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

function baseRef(explicit) {
  let shallow = false;
  try {
    shallow = git(['rev-parse', '--is-shallow-repository']) === 'true';
  }
  catch { /* ignore */ }
  const candidates = [
    explicit,
    process.env.GITHUB_BASE_REF && `origin/${process.env.GITHUB_BASE_REF}`,
    'origin/HEAD',
    'origin/main',
    'main',
    'HEAD',
  ].filter(Boolean);
  for (const ref of candidates) {
    try {
      return { ref, sha: git(['merge-base', 'HEAD', ref]), shallow };
    }
    catch { /* try next */ }
  }
  fail(`no base ref found among ${candidates.join(', ')}. Pass --base <ref>.`);
}

const skeleton = (line) =>
  line.replace(/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+|[a-z][a-z0-9]*[A-Z]\w*|[A-Za-z]*_\w+|\$\w+/g, '_')
    .replace(/\s+/g, ' ').trim();

const words = (line) => line.replace(/^\s*(\/\/|\/\*|\*+)/, '').toLowerCase().match(/[a-z0-9']+/g) ?? [];
const wordShare = (a, b) => {
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) { return 0; }
  const set = new Set(wa);
  let shared = 0;
  for (const word of wb) {
    if (set.has(word)) { shared++; }
  }
  return shared / Math.max(wa.length, wb.length);
};

const commentish = (text) => /^\s*(\/\/|\/\*|\*)/.test(text);

function addedHunks(base) {
  let out;
  try {
    out = git([
      'diff',
      '--unified=0',
      '--no-color',
      '--find-renames=40%',
      '--src-prefix=a/',
      '--dst-prefix=b/',
      '--diff-filter=ACMR',
      base,
    ]);
  }
  catch {
    fail(`git diff failed against ${base}`);
  }
  const files = new Map();
  let current = null;
  let hunk = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('+++ ')) {
      const match = /^\+\+\+ b\/(.*)$/.exec(line);
      current = match ? match[1] : null;
      if (current) { files.set(current, []); }
      hunk = null;
      continue;
    }
    const header = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (header && current) {
      hunk = { start: +header[1], removed: [], added: [], next: +header[1] };
      files.get(current).push(hunk);
      continue;
    }
    if (!hunk) { continue; }
    if (line.startsWith('-')) { hunk.removed.push(line.slice(1)); }
    else if (line.startsWith('+')) { hunk.added.push([hunk.next++, line.slice(1)]); }
  }
  return files;
}

function resolveAdded(hunks, kinds) {
  const lines = new Set();
  let removedCode = 0;
  let removedCmt = 0;
  for (const hunk of hunks) {
    const removed = hunk.removed.slice();
    const skels = removed.map(skeleton);
    const isCmtLine = (line, text) => Boolean(kinds[line - 1]?.cmt) || commentish(text);
    const inBlock = Boolean(kinds[hunk.start - 1]?.cmt && kinds[Math.max(0, hunk.start - 2)]?.cmt)
      || (hunk.added.length > 0 && hunk.added.every(([line, text]) => isCmtLine(line, text)));
    for (const [line, text] of hunk.added) {
      const i = skels.indexOf(skeleton(text));
      if (i >= 0) {
        skels.splice(i, 1);
        removed.splice(i, 1);
        continue;
      }
      const j = isCmtLine(line, text)
        ? removed.findIndex((old) => (inBlock || commentish(old)) && wordShare(old, text) >= 0.75)
        : -1;
      if (j >= 0) {
        skels.splice(j, 1);
        removed.splice(j, 1);
        continue;
      }
      lines.add(line);
    }
    for (const text of removed) {
      if (inBlock || commentish(text)) { removedCmt++; }
      else { removedCode++; }
    }
  }
  return { lines, removedCode, removedCmt };
}

function matchesGlob(rel, patterns) {
  return patterns.some((pattern) => {
    const rx = new RegExp(
      '^' + pattern.split('**').map((part) =>
        part.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '.')
      ).join('.*') + '$',
    );
    return rx.test(rel) || rx.test('./' + rel);
  });
}

function scriptKind(ts, file) {
  if (file.endsWith('.tsx')) { return ts.ScriptKind.TSX; }
  if (/\.[cm]?ts$/.test(file)) { return ts.ScriptKind.TS; }
  return ts.ScriptKind.JSX;
}

function collectComments(ts, sf, text) {
  const seen = new Map();
  const add = (ranges) => {
    if (!ranges) { return; }
    for (const range of ranges) {
      if (!seen.has(range.pos)) { seen.set(range.pos, range); }
    }
  };
  const walk = (node) => {
    const children = node.getChildren(sf);
    if (!children.length) {
      add(ts.getLeadingCommentRanges(text, node.getFullStart()));
      add(ts.getTrailingCommentRanges(text, node.getEnd()));
    }
    for (const child of children) { walk(child); }
  };
  walk(sf);
  return [...seen.values()].sort((a, b) => a.pos - b.pos);
}

function looksLikeCode(ts, text) {
  if (text.length < 6 || !/[;={(]|=>/.test(text) || /[.!?]$/.test(text)) { return false; }
  if (/^(TODO|FIXME|NOTE|HACK|XXX|e\.?g\.|eg[:.]|ex[:.]|example|usage|note|returns?|=>|->)\b/i.test(text)) {
    return false;
  }
  const sf = ts.createSourceFile('x.ts', text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  if ((sf.parseDiagnostics || []).length) { return false; }
  const K = ts.SyntaxKind;
  const REAL = new Set([
    K.VariableStatement,
    K.FunctionDeclaration,
    K.ClassDeclaration,
    K.IfStatement,
    K.ForStatement,
    K.ForOfStatement,
    K.ForInStatement,
    K.WhileStatement,
    K.DoStatement,
    K.ReturnStatement,
    K.ThrowStatement,
    K.SwitchStatement,
    K.TryStatement,
    K.ImportDeclaration,
    K.ExportDeclaration,
    K.ExportAssignment,
  ]);
  return sf.statements.some((stmt) => {
    if (REAL.has(stmt.kind)) { return true; }
    if (stmt.kind !== K.ExpressionStatement) { return false; }
    if (!/;\s*$/.test(stmt.getText(sf))) { return false; }
    const expr = stmt.expression;
    return ts.isBinaryExpression(expr) || ts.isCallExpression(expr) || ts.isAwaitExpression(expr)
      || ts.isPostfixUnaryExpression(expr) || ts.isDeleteExpression(expr);
  });
}

function classify(ts, raw, beforeCode) {
  const isLine = raw.startsWith('//');
  const content = isLine ? raw.split('\n').map(body).join('\n').trim() : body(raw);
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  if (beforeCode && LICENSE.test(content)) { return 'license'; }
  if (lines.length && lines.every((line) => PRAGMA.test(line))) { return 'pragma'; }
  if (raw.startsWith('/**')) {
    let prose = false;
    for (const line of lines) {
      if (!line.startsWith('@')) {
        prose = true;
        continue;
      }
      if (TYPE_TAG.test(line)) { continue; }
      if (SIGNATURE_TAG.test(line)) {
        const rest = line.replace(SIGNATURE_TAG, '').replace(/^\s*\{[^]*?\}\s*/, '')
          .replace(/^\s*\[?[\w$.]+\]?\s*/, '').replace(/^-\s*/, '').trim();
        if (rest.split(/\s+/).filter(Boolean).length >= 3) { prose = true; }
        continue;
      }
      prose = true;
    }
    return prose ? 'doc' : 'types';
  }
  if (looksLikeCode(ts, content)) { return 'dead'; }
  return isLine ? 'inline' : 'block';
}

const COUNTED = new Set(['doc', 'inline', 'block', 'dead', 'preamble', 'table']);
const SANCTIONED = new Set(['preamble', 'table']);

export function analyzeComments(ts, text, file) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind(ts, file));
  const raws = collectComments(ts, sf, text);
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) { starts.push(i + 1); }
  }
  const lineOf = (pos) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= pos) { lo = mid; }
      else { hi = mid - 1; }
    }
    return lo;
  };

  const any = new Uint8Array(text.length);
  const counted = new Uint8Array(text.length);
  const docMask = new Uint8Array(text.length);
  const expMask = new Uint8Array(text.length);
  for (const range of raws) {
    for (let i = range.pos; i < range.end && i < text.length; i++) { any[i] = 1; }
  }
  let firstCode = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    if (any[i] || ch === 32 || ch === 9 || ch === 10 || ch === 13) { continue; }
    firstCode = i;
    break;
  }

  const units = [];
  for (const range of raws) {
    const raw = text.slice(range.pos, range.end);
    const l0 = lineOf(range.pos);
    const l1 = lineOf(range.end - 1);
    const prev = units[units.length - 1];
    const isLine = raw.startsWith('//');
    if (
      prev && prev.kind === 'line' && isLine && l0 === prev.l1 + 1 && text.slice(starts[l0], range.pos).trim() === ''
    ) {
      prev.l1 = l1;
      prev.raws.push(raw);
      prev.ranges.push(range);
      continue;
    }
    units.push({
      kind: isLine ? 'line' : 'block',
      l0,
      l1,
      col: range.pos - starts[l0] + 1,
      raws: [raw],
      ranges: [range],
      pos: range.pos,
    });
  }

  let importsEnd = 0;
  let bodyStart = text.length;
  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt) || ts.isImportEqualsDeclaration(stmt)) { importsEnd = stmt.getEnd(); }
  }
  const opener = sf.statements.find((stmt) => stmt.getStart(sf) >= importsEnd);
  if (opener) { bodyStart = opener.getStart(sf); }

  let lead = null;
  for (const unit of units) {
    unit.raw = unit.raws.join('\n');
    unit.text = unit.raws.map(body).join('\n').trim();
    unit.lines = unit.l1 - unit.l0 + 1;
    unit.cat = classify(ts, unit.raw, firstCode === -1 || unit.pos < firstCode);
    if (unit.cat === 'inline' && isTable(unit.raws)) { unit.cat = 'table'; }
    const inLead = unit.pos >= importsEnd && unit.pos < bodyStart
      && text.slice(starts[unit.l0], unit.pos).trim() === '';
    if (!lead && inLead && !['license', 'pragma', 'types'].includes(unit.cat)) {
      lead = unit;
      if (unit.cat === 'inline' || unit.cat === 'block') { unit.cat = 'preamble'; }
    }
    if (COUNTED.has(unit.cat)) {
      const mask = unit.cat === 'doc' ? docMask : expMask;
      for (const range of unit.ranges) {
        for (let i = range.pos; i < range.end && i < text.length; i++) {
          counted[i] = 1;
          mask[i] = 1;
        }
      }
    }
  }

  const kinds = [];
  const codeText = [];
  for (let li = 0; li < starts.length; li++) {
    const start = starts[li];
    const end = li + 1 < starts.length ? starts[li + 1] - 1 : text.length;
    let code = false;
    let cmt = false;
    let doc = false;
    let exp = false;
    let bare = '';
    for (let i = start; i < end; i++) {
      const ch = text.charCodeAt(i);
      if (!any[i]) { bare += text[i]; }
      if (ch === 32 || ch === 9 || ch === 13) { continue; }
      if (any[i]) {
        if (counted[i]) { cmt = true; }
        if (docMask[i]) { doc = true; }
        if (expMask[i]) { exp = true; }
      }
      else { code = true; }
    }
    kinds.push({ code, cmt, doc, exp });
    codeText.push(bare.trim());
  }

  for (const unit of units) {
    unit.why = WHY.some((rx) => rx.test(unit.text));
    unit.words = contentWords(
      unit.cat === 'table'
        ? unit.raws.map((raw) => body(raw).replace(ROW, '')).join('\n')
        : unit.text,
    );
    let code = codeText[unit.l0];
    if (!code) {
      for (let i = unit.l1 + 1, seen = 0; i < codeText.length && seen < 2; i++) {
        if (codeText[i]) {
          code += ' ' + codeText[i];
          seen++;
        }
      }
    }
    if (code && unit.words.length) {
      const tokens = codeWords(code);
      unit.overlap = unit.words.filter((word) => tokens.has(word)).length / unit.words.length;
    }
    else {
      unit.overlap = 0;
    }
  }
  return { units, kinds };
}

function stopRules(cfg) {
  return [...new Set(cfg.stopWords)].map((word) => {
    if (word.length > 2 && word.startsWith('/') && word.endsWith('/')) {
      return { word, rx: new RegExp(word.slice(1, -1), 'i') };
    }
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const left = /^[\w-]/.test(word) ? '\\b' : '';
    const right = /[\w-]$/.test(word) ? '\\b' : '';
    return { word, rx: new RegExp(left + esc + right, 'i') };
  });
}

async function run() {
  const argv = process.argv.slice(2);
  const flag = (name) => argv.includes(name);
  const opt = (name, fallback) => {
    const idx = argv.indexOf(name);
    return idx >= 0 ? argv[idx + 1] : fallback;
  };
  const ts = loadTs();
  const root = process.cwd();

  const cfg = { ...DEFAULTS };
  const readJson = (filePath) => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch (error) {
      fail(`could not read ${path.relative(root, filePath)}: ${error.message}`);
    }
  };
  const named = opt('--config');
  if (named && !fs.existsSync(path.resolve(root, named))) { fail(`no config at ${named}`); }
  if (named) {
    const resolved = path.resolve(root, named);
    Object.assign(
      cfg,
      resolved.endsWith('.json') ? readJson(resolved) : (await import(pathToFileURL(resolved).href)).default,
    );
  }
  else if (fs.existsSync(path.join(root, 'package.json'))) {
    const pkg = readJson(path.join(root, 'package.json'));
    if (pkg.commentBudget) { Object.assign(cfg, pkg.commentBudget); }
  }

  const valuedFlags = new Set([
    '--base',
    '--config',
    '--maxExplainRatio',
    '--maxDocRatio',
    '--maxFileRatio',
    '--maxRun',
    '--maxDoc',
    '--maxWords',
    '--minLinesForRatio',
    '--minShortShare',
    '--minUnitsForShape',
    '--maxOverlap',
    '--minWhyShare',
  ]);
  for (
    const key of [
      'maxExplainRatio',
      'maxDocRatio',
      'maxFileRatio',
      'maxRun',
      'maxDoc',
      'maxWords',
      'minLinesForRatio',
      'minShortShare',
      'minUnitsForShape',
      'maxOverlap',
      'minWhyShare',
    ]
  ) {
    const val = opt('--' + key);
    if (val !== undefined) { cfg[key] = +val; }
  }

  const positional = argv.filter((arg, idx) =>
    !arg.startsWith('--') && !arg.startsWith('-') && (idx === 0 || !valuedFlags.has(argv[idx - 1]))
  );
  if (positional.length) {
    cfg.include = positional.map((item) => item.replace(/\/+$/, ''));
  }

  if (flag('--print-config')) {
    console.log(JSON.stringify(cfg, null, 2));
    return 0;
  }
  if (flag('--help') || flag('-h')) {
    console.log('usage: node tools/gates/comments.js [--all] [--base <ref>] [--report] [--json] [paths...]');
    return 0;
  }

  const all = flag('--all') || positional.length > 0;
  const report = flag('--report');
  const json = flag('--json');
  const rules = stopRules(cfg);
  let base = null;
  let repoRoot = root;

  let targets;
  if (all) {
    const acc = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git') { walk(full); }
        }
        else if (EXT.has(path.extname(entry.name))) {
          acc.push(path.relative(root, full));
        }
      }
    };
    for (const inc of cfg.include) {
      const target = path.join(root, inc);
      if (!fs.existsSync(target)) { continue; }
      if (fs.statSync(target).isDirectory()) { walk(target); }
      else if (EXT.has(path.extname(target))) { acc.push(path.relative(root, target)); }
    }
    targets = new Map(acc.map((file) => [file, null]));
  }
  else {
    base = baseRef(opt('--base'));
    targets = addedHunks(base.sha);
    try {
      repoRoot = git(['rev-parse', '--show-toplevel']);
    }
    catch { /* keep cwd */ }
  }

  const on = (val) => val !== false && val !== null && val !== undefined;
  const problems = [];
  let codeLines = 0;
  let cmtLines = 0;
  let docLines = 0;
  let expLines = 0;
  let files = 0;
  let docs = 0;
  let removedCode = 0;
  let removedCmt = 0;
  const perFile = [];
  const shape = { 1: 0, 2: 0, '3-6': 0, '7+': 0, n: 0, lines: 0, why: 0, whyOf: 0 };
  const sanctioned = { preamble: 0, table: 0 };
  const seen = { run: 0, doc: 0, words: 0, overlap: 0, fileRatio: 0, dead: 0, stop: 0, parse: 0 };

  for (const [gitPath, hunks] of targets) {
    const abs = hunks ? path.resolve(repoRoot, gitPath) : path.resolve(root, gitPath);
    const rel = path.relative(root, abs).split(path.sep).join('/');
    if (!EXT.has(path.extname(gitPath)) || rel.startsWith('../')) { continue; }
    if (
      cfg.include.length
      && !cfg.include.some((inc) => rel === inc || rel.startsWith(inc + '/') || matchesGlob(rel, [inc]))
    ) {
      continue;
    }
    if (matchesGlob(rel, cfg.exclude) || !fs.existsSync(abs)) { continue; }

    const text = fs.readFileSync(abs, 'utf8');
    let analyzed;
    try {
      analyzed = analyzeComments(ts, text, abs);
    }
    catch {
      seen.parse++;
      problems.push({ rel, line: 1, col: 1, rule: 'parse', msg: 'could not parse' });
      continue;
    }
    const added = hunks ? resolveAdded(hunks, analyzed.kinds) : null;

    const hit = (l0, l1) => {
      if (!added) { return true; }
      for (let line = l0; line <= l1; line++) {
        if (added.lines.has(line + 1)) { return true; }
      }
      return false;
    };
    const majorityAdded = (unit) => {
      if (!added) { return true; }
      let count = 0;
      for (let line = unit.l0; line <= unit.l1; line++) {
        if (added.lines.has(line + 1)) { count++; }
      }
      return 2 * count > unit.lines;
    };
    const addedText = (unit) => {
      if (!added) { return unit.text; }
      return unit.raw.split('\n').filter((_, i) => added.lines.has(unit.l0 + i + 1))
        .map(body).join('\n').trim();
    };

    let fCode = 0;
    let fCmt = 0;
    let fDoc = 0;
    let fExp = 0;
    for (let i = 0; i < analyzed.kinds.length; i++) {
      if (added && !added.lines.has(i + 1)) { continue; }
      if (analyzed.kinds[i].code) { fCode++; }
      if (analyzed.kinds[i].cmt) { fCmt++; }
      if (analyzed.kinds[i].doc) { fDoc++; }
      if (analyzed.kinds[i].exp) { fExp++; }
    }
    if (fCode || fCmt) { files++; }
    if (added) {
      removedCode += added.removedCode;
      removedCmt += added.removedCmt;
      fCode = Math.max(0, fCode - added.removedCode);
      const cut = Math.min(fCmt, added.removedCmt);
      fCmt -= cut;
      const expCut = Math.min(fExp, cut);
      fExp -= expCut;
      fDoc = Math.max(0, fDoc - (cut - expCut));
    }
    codeLines += fCode;
    cmtLines += fCmt;
    docLines += fDoc;
    expLines += fExp;

    const add = (unit, rule, msg) => problems.push({ rel, line: unit.l0 + 1, col: unit.col, rule, msg });

    for (const unit of analyzed.units) {
      if (!hit(unit.l0, unit.l1)) { continue; }
      if (cfg.allowInlineIgnores && /\bcb-allow\b/.test(unit.text)) { continue; }
      if (unit.cat === 'license' || unit.cat === 'pragma') { continue; }
      if (/^\s*TODO(?=[\s(:])/.test(unit.text)) { continue; }

      if (rules.length && cfg.stopWordScope.includes('comments')) {
        const scope = addedText(unit);
        const found = rules.filter((rule) => rule.rx.test(scope)).map((rule) => rule.word);
        if (found.length) {
          seen.stop++;
          add(unit, 'stop-word', found.map((word) => `"${word}"`).join(', '));
        }
      }
      if (unit.cat === 'types') { continue; }
      if (unit.cat === 'dead') {
        seen.dead++;
        if (cfg.noDeadCode) {
          add(unit, 'dead-code', `commented-out code (corpus has ${REFERENCE.deadCode} lines per 100)`);
        }
        continue;
      }
      if (unit.cat === 'doc') {
        if (!majorityAdded(unit)) { continue; }
        docs++;
        seen.doc = Math.max(seen.doc, unit.lines);
        if (on(cfg.maxDoc) && unit.lines > cfg.maxDoc) {
          add(unit, 'doc-length', `${unit.lines}-line doc block (corpus p90 ${REFERENCE.doc.p90})`);
        }
        continue;
      }
      if (!majorityAdded(unit)) { continue; }
      if (unit.words.length >= 4) {
        shape.whyOf++;
        if (unit.why) { shape.why++; }
        else { seen.overlap = Math.max(seen.overlap, unit.overlap); }
      }
      if (SANCTIONED.has(unit.cat)) { sanctioned[unit.cat]++; }
      else {
        shape.n++;
        shape.lines += unit.lines;
        shape[unit.lines === 1 ? 1 : unit.lines === 2 ? 2 : unit.lines <= 6 ? '3-6' : '7+']++;
        seen.run = Math.max(seen.run, unit.lines);
        const wordCount = unit.text.split(/\s+/).filter(Boolean).length;
        seen.words = Math.max(seen.words, wordCount);
        if (on(cfg.maxRun) && unit.lines > cfg.maxRun) {
          add(unit, 'comment-run', `${unit.lines} lines (corpus p90 ${REFERENCE.run.p90})`);
        }
        if (on(cfg.maxWords) && wordCount > cfg.maxWords) {
          add(unit, 'comment-length', `${wordCount} words in one comment`);
        }
      }
      if (on(cfg.maxOverlap) && !unit.why && unit.words.length >= 4 && unit.overlap >= cfg.maxOverlap) {
        add(unit, 'restatement', `${Math.round(100 * unit.overlap)}% of its words are in the code below it`);
      }
    }

    const fileRatio = fCode ? (100 * fExp / fCode) : 0;
    perFile.push({ rel, code: fCode, cmt: fCmt, ratio: fileRatio });
    if (fCode >= cfg.minLinesForRatio) {
      seen.fileRatio = Math.max(seen.fileRatio, fileRatio);
      if (on(cfg.maxFileRatio) && fileRatio > cfg.maxFileRatio) {
        problems.push({
          rel,
          line: 1,
          col: 1,
          rule: 'file-ratio',
          msg: `${fileRatio.toFixed(1)} explanation lines per 100 (${fExp}/${fCode})`,
        });
      }
    }
  }

  const ratio = codeLines ? (100 * cmtLines / codeLines) : 0;
  const expRatio = codeLines ? (100 * expLines / codeLines) : 0;
  const docRatio = codeLines ? (100 * docLines / codeLines) : 0;
  const shortShare = shape.n ? 100 * (shape[1] + shape[2]) / shape.n : 100;
  const whyShare = shape.whyOf ? 100 * shape.why / shape.whyOf : 100;
  const sized = codeLines >= cfg.minLinesForRatio;
  const enoughUnits = shape.n >= cfg.minUnitsForShape;

  const items = (rule) => problems.filter((item) => item.rule === rule);
  const gates = [];
  const gate = (name, key, state, value, limit) => gates.push({ name, key, state, value, limit, items: items(name) });

  gate(
    'explain-ratio',
    'maxExplainRatio',
    !on(cfg.maxExplainRatio) ? 'off' : !sized ? 'skip' : expRatio > cfg.maxExplainRatio ? 'fail' : 'pass',
    `${expRatio.toFixed(1)} per 100`,
    !sized
      ? `needs ${cfg.minLinesForRatio} code lines`
      : `max ${cfg.maxExplainRatio} (corpus p50 ${REFERENCE.explain.p50}, p75 ${REFERENCE.explain.p75})`,
  );
  gate(
    'doc-ratio',
    'maxDocRatio',
    !on(cfg.maxDocRatio) ? 'off' : !sized ? 'skip' : docRatio > cfg.maxDocRatio ? 'fail' : 'pass',
    `${docRatio.toFixed(1)} per 100`,
    on(cfg.maxDocRatio)
      ? `max ${cfg.maxDocRatio}`
      : `corpus median ${REFERENCE.doc.ratioMedian}, p75 ${REFERENCE.doc.ratioP75}`,
  );
  gate(
    'file-ratio',
    'maxFileRatio',
    !on(cfg.maxFileRatio) ? 'off' : items('file-ratio').length ? 'fail' : 'pass',
    `worst ${seen.fileRatio.toFixed(1)} per 100`,
    `max ${cfg.maxFileRatio} (corpus file p90 ${REFERENCE.explain.fileP90})`,
  );
  gate(
    'comment-run',
    'maxRun',
    !on(cfg.maxRun) ? 'off' : items('comment-run').length ? 'fail' : 'pass',
    `longest ${seen.run} lines`,
    `max ${cfg.maxRun}`,
  );
  gate(
    'doc-length',
    'maxDoc',
    !on(cfg.maxDoc) ? 'off' : items('doc-length').length ? 'fail' : 'pass',
    `longest ${seen.doc} lines`,
    `max ${cfg.maxDoc}`,
  );
  gate(
    'comment-length',
    'maxWords',
    !on(cfg.maxWords) ? 'off' : items('comment-length').length ? 'fail' : 'pass',
    `longest ${seen.words} words`,
    `max ${cfg.maxWords}`,
  );
  gate(
    'shape',
    'minShortShare',
    !on(cfg.minShortShare) ? 'off' : !enoughUnits ? 'skip' : shortShare < cfg.minShortShare ? 'fail' : 'pass',
    `${shortShare.toFixed(1)}% are 1-2 lines`,
    !enoughUnits
      ? `needs ${cfg.minUnitsForShape} comments`
      : `min ${cfg.minShortShare}% (corpus ${REFERENCE.shape.short}%)`,
  );
  gate(
    'restatement',
    'maxOverlap',
    !on(cfg.maxOverlap) ? 'off' : items('restatement').length ? 'fail' : 'pass',
    `worst ${Math.round(100 * seen.overlap)}% word overlap`,
    `max ${Math.round(100 * cfg.maxOverlap)}%`,
  );
  gate(
    'why-share',
    'minWhyShare',
    !on(cfg.minWhyShare) || cfg.minWhyShare <= 0
      ? 'off'
      : shape.whyOf < cfg.minUnitsForShape
      ? 'skip'
      : whyShare < cfg.minWhyShare
      ? 'fail'
      : 'pass',
    `${whyShare.toFixed(1)}% give a reason`,
    `min ${cfg.minWhyShare}% (corpus ${REFERENCE.why.share}%)`,
  );
  gate('dead-code', 'noDeadCode', !cfg.noDeadCode ? 'off' : seen.dead ? 'fail' : 'pass', `${seen.dead} found`, 'max 0');
  gate(
    'stop-word',
    'stopWords',
    !rules.length ? 'skip' : seen.stop ? 'fail' : 'pass',
    !rules.length ? 'no words configured' : `${seen.stop} found`,
    `max 0, ${rules.length} rules`,
  );
  gate(
    'parse',
    'failOnParseError',
    !cfg.failOnParseError ? 'off' : seen.parse ? 'fail' : 'pass',
    `${seen.parse} unreadable`,
    'max 0',
  );

  const failed = gates.filter((item) => item.state === 'fail');
  const exitCode = report || !failed.length ? 0 : 1;

  if (json) {
    console.log(JSON.stringify({ ratio, expRatio, docRatio, codeLines, cmtLines, files, gates, problems }, null, 2));
    return exitCode;
  }

  const MARK = { pass: '✓', fail: '✗', skip: '–', off: '·' };
  const HUE = { pass: 'green', fail: 'red', skip: 'gray', off: 'gray' };
  const paint = (item, str) => styleText(HUE[item.state], str);
  const net = removedCode || removedCmt ? ` (net of ${removedCode} code and ${removedCmt} comment lines removed)` : '';
  console.log(
    `\n${files} file${
      files === 1 ? '' : 's'
    }, ${codeLines} code lines, ${cmtLines} comment lines (${expLines} explanation, ${docLines} doc), ${shape.n} explanation comments, ${sanctioned.preamble} preamble${
      sanctioned.preamble === 1 ? '' : 's'
    }${net}\n`,
  );

  const formatGate = (item) =>
    `  ${paint(item, MARK[item.state])} ${paint(item, item.name.padEnd(15))}${
      String(item.value).padEnd(28)
    }${item.limit}`;
  const active = gates.filter((item) => item.state === 'pass' || item.state === 'fail');
  const idle = gates.filter((item) => item.state !== 'pass' && item.state !== 'fail');

  for (const item of active) {
    console.log(formatGate(item));
    if (item.state !== 'fail') { continue; }
    const list = item.items.slice(0, cfg.maxListed);
    const width = Math.max(0, ...list.map((problem) => (problem.rel + ':' + problem.line).length));
    for (const problem of list) {
      console.log(`      ${styleText('gray', (problem.rel + ':' + problem.line).padEnd(width))}  ${problem.msg}`);
    }
    if (item.items.length > cfg.maxListed) {
      console.log(`      ... ${item.items.length - cfg.maxListed} more`);
    }
  }
  if (idle.length) {
    console.log('\n' + styleText('gray', '  not run'));
    for (const item of idle) { console.log(formatGate(item)); }
  }

  const countState = (state) => gates.filter((item) => item.state === state).length;
  const failCount = countState('fail');
  console.log(
    `\n  ${styleText('green', `${countState('pass')} passed`)}, ${
      styleText(failCount ? 'red' : 'gray', `${failCount} failed`)
    }${idle.length ? styleText('gray', `   (${countState('skip')} skipped, ${countState('off')} off)`) : ''}\n`,
  );
  if (report) {
    const worst = perFile.filter((file) => file.code >= cfg.minLinesForRatio).sort((a, b) => b.ratio - a.ratio).slice(
      0,
      10,
    );
    if (worst.length) {
      console.log('  heaviest files');
      for (const file of worst) {
        console.log(`  ${file.ratio.toFixed(1).padStart(7)}  ${file.rel} (${file.cmt}/${file.code})`);
      }
    }
  }
  return exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().then((code) => process.exit(code));
}
