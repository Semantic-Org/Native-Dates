#!/usr/bin/env node
// checks developer-facing error, warning, and log prose across src/, packages/*/src/, and integrations/
//   npm run errors                        # new or changed literals against base branch
//   npm run errors -- --all               # every prose literal across package source
//   npm run errors -- src/example.js      # specific files or directories

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';

const PROPER_OR_TECHNICAL = new Set([
  'HTTP',
  'HTTPS',
  'URL',
  'URI',
  'JSON',
  'SQL',
  'WebSocket',
  'IndexedDB',
  'BroadcastChannel',
  'AbortSignal',
  'Temporal',
  'BigInt',
  'NaN',
  'Date',
  'Duration',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Error',
  'TypeError',
  'RangeError',
  'HTML',
  'CSS',
  'DOM',
  'CORS',
  'CSRF',
  'TTL',
  'UUID',
  'UTF-8',
  'ASCII',
  'ID',
  'IDs',
  'IP',
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
  'Node',
  'Safari',
  'Firefox',
  'Chrome',
  'React',
]);

const color = (fmt, text) => (process.stdout.isTTY ? styleText(fmt, text) : text);
const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 << 20 });

export function extractLiterals(code) {
  const found = [];
  let i = 0;
  const n = code.length;
  let line = 1;
  let depth = 0;
  const tableStack = [];

  const advance = (count) => {
    for (let j = 0; j < count; j++) {
      if (code[i + j] === '\n') { line++; }
    }
    i += count;
  };

  const readQuoted = (quote) => {
    const start = i;
    const startLine = line;
    advance(1);
    let raw = '';
    while (i < n && code[i] !== quote) {
      if (code[i] === '\\') {
        raw += code[i + 1] ?? '';
        advance(2);
        continue;
      }
      raw += code[i];
      advance(1);
    }
    advance(1);
    return { raw, line: startLine, start, end: i };
  };

  const readRegex = () => {
    advance(1);
    let inClass = false;
    while (i < n) {
      const ch = code[i];
      if (ch === '\\') {
        advance(2);
        continue;
      }
      if (inClass) {
        if (ch === ']') { inClass = false; }
      }
      else if (ch === '[') { inClass = true; }
      else if (ch === '/') {
        advance(1);
        break;
      }
      advance(1);
    }
    while (i < n && /[a-z]/.test(code[i])) { advance(1); }
  };

  const isRegexStart = () => {
    let k = i - 1;
    while (k >= 0 && /\s/.test(code[k])) { k--; }
    if (k < 0) { return true; }
    if ('(,=:[!&|?{};+-*%<>~^'.includes(code[k])) { return true; }
    return /(return|typeof|case|throw|else|in|of|do)$/.test(code.slice(Math.max(0, k - 6), k + 1));
  };

  const readTemplate = () => {
    const start = i;
    const startLine = line;
    advance(1);
    let raw = '';
    while (i < n && code[i] !== '`') {
      if (code[i] === '\\') {
        raw += code[i + 1] ?? '';
        advance(2);
        continue;
      }
      if (code[i] === '$' && code[i + 1] === '{') {
        let braceDepth = 1;
        let expr = '${';
        advance(2);
        while (i < n && braceDepth > 0) {
          const ch = code[i];
          if (ch === '"' || ch === "'") {
            const quoted = readQuoted(ch);
            expr += ch + quoted.raw + ch;
            continue;
          }
          if (ch === '`') {
            const nested = readTemplate();
            expr += '`' + nested.raw + '`';
            continue;
          }
          if (ch === '{') { braceDepth++; }
          else if (ch === '}') { braceDepth--; }
          expr += ch;
          advance(1);
        }
        raw += expr;
        continue;
      }
      raw += code[i];
      advance(1);
    }
    advance(1);
    return { raw, line: startLine, start, end: i };
  };

  while (i < n) {
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      found.push({ ...readQuoted(ch), inTable: tableStack.length > 0 });
      continue;
    }
    if (ch === '`') {
      found.push({ ...readTemplate(), inTable: tableStack.length > 0 });
      continue;
    }
    if (ch === '/' && code[i + 1] === '/') {
      while (i < n && code[i] !== '\n') { advance(1); }
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      advance((end < 0 ? n : end + 2) - i);
      continue;
    }
    if (ch === '/' && isRegexStart()) {
      readRegex();
      continue;
    }
    if (ch === '{') {
      depth++;
      if (/(?:hints|copy)\s*:\s*(?:isDevelopment\s*\?\s*)?$/.test(code.slice(Math.max(0, i - 40), i))) {
        tableStack.push(depth);
      }
    }
    else if (ch === '}') {
      if (tableStack.length && tableStack[tableStack.length - 1] === depth) {
        tableStack.pop();
      }
      depth--;
    }
    advance(1);
  }
  return found;
}

const isProse = (text) => {
  const plain = text.replace(/\$\{[^}]*\}/g, ' ');
  return plain.length >= 18
    && (plain.match(/ /g) ?? []).length >= 2
    && /[a-z]{2,} [a-z]{2,}/i.test(plain)
    && !/^[./@\w-]+$/.test(text);
};

function classifyLiteral(code, lit) {
  const before = code.slice(Math.max(0, lit.start - 2400), lit.start);
  const stmt = before.slice(before.lastIndexOf(';') + 1);
  const codeMatch = /(?:throwTypeError|throwError|throwRangeError|error)\s*\(\s*'([\w-]+)'\s*,\s*([^,]+),/.exec(stmt);
  let kind = 'text';
  if (lit.inTable) { kind = 'hint'; }
  else if (/explanation\s*:/.test(stmt)) { kind = 'explanation'; }
  else if (/warnOnce|logWarn|\bwarn\(/.test(stmt)) { kind = 'warn'; }
  else if (/logError/.test(stmt)) { kind = 'error'; }
  else if (/logInfo|\binfo\(/.test(stmt)) { kind = 'info'; }
  else if (/\bthrow\s+new (?:Type|Range)?Error\(/.test(stmt)) { kind = 'thrown'; }
  return { kind, code: codeMatch ? codeMatch[1] : null };
}

function maskSpans(text) {
  return text
    .replace(/\$\{[\s\S]*?\}/g, '${…}')
    .replace(/`[^`]*`/g, '`…`')
    .replace(/'[^']*'/g, "'…'")
    .replace(/"[^"]*"/g, '"…"')
    .replace(/\b(?:e\.g|i\.e|vs|etc|cf)\.\s+/gi, 'abbr ');
}

export function checkErrorRow(row) {
  const findings = [];
  const masked = maskSpans(row.text);
  const boundary = /\.\s+([a-z][a-z0-9_-]*)/.exec(masked);
  if (boundary) {
    findings.push({
      rule: 'sentence-boundary',
      reason: `lowercase after period (". ${
        boundary[1]
      }"). Use "explanation. Capital instruction" so fadeSecondary splits cleanly`,
    });
  }

  const trimmed = row.text.trim();
  if (/^[A-Z]/.test(trimmed)) {
    const firstToken = trimmed.split(/[\s:.,;()[\]{}]+/)[0];
    const isIdentifier = /[a-z][A-Z]/.test(firstToken) || /^[A-Z0-9_]{2,}$/.test(firstToken) || firstToken === 'Id';
    if (!PROPER_OR_TECHNICAL.has(firstToken) && !isIdentifier) {
      findings.push({
        rule: 'lowercase-open',
        advisory: true,
        word: firstToken,
        reason:
          `opens with "${firstToken}". Confirm lowercase or add "${firstToken}" to PROPER_OR_TECHNICAL in tools/gates/errors.js`,
      });
    }
  }

  if (/\.$/.test(trimmed) && !/\.\.\.$/.test(trimmed)) {
    findings.push({
      rule: 'no-terminal-period',
      reason: 'ends with a trailing period. Drop terminal periods on error and log lines',
    });
  }

  if (masked.includes('\u2014')) {
    findings.push({
      rule: 'no-banned-punct',
      reason: 'contains an em-dash. Split into "explanation. Capital instruction" or use a colon/comma',
    });
  }
  else if (masked.includes('\u2192')) {
    findings.push({
      rule: 'no-banned-punct',
      reason: 'contains a unicode arrow. Use ASCII "->" inside code or plain prose',
    });
  }
  else if (masked.includes(';')) {
    findings.push({
      rule: 'no-banned-punct',
      reason: 'contains a semicolon in prose. Split into ". Capital" sentences',
    });
  }

  if (row.code && /^bad[A-Z]/.test(row.code)) {
    findings.push({
      rule: 'code-vocabulary',
      reason:
        `error code "${row.code}" uses "bad*". Use missing, unknown, invalid, unsupported, duplicate, or conflicting`,
    });
  }

  if (row.kind === 'thrown' && !row.file?.endsWith('/errors.js')) {
    findings.push({
      rule: 'structured-errors',
      reason: 'raw "throw new Error(...)". Route through createErrors from @semantic-ui/utils',
    });
  }

  return findings;
}

const RULES = [
  { id: 'sentence-boundary', label: 'explanation. Capital' },
  { id: 'lowercase-open', label: 'lowercase-open', advisory: true },
  { id: 'no-terminal-period', label: 'no-terminal-period' },
  { id: 'no-banned-punct', label: 'no-banned-punct' },
  { id: 'code-vocabulary', label: 'code-vocabulary' },
  { id: 'structured-errors', label: 'structured-errors' },
];

const isShippedSource = (file) =>
  (/^(?:src|packages\/[^/]+\/src|integrations\/[^/]+)\/.*\.js$/.test(file))
  && !file.includes('/test/')
  && !file.endsWith('.test.js');

function walkSourceFiles() {
  const found = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) { return; }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist') { continue; }
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { walk(full); }
      else if (isShippedSource(full)) { found.push(full); }
    }
  };
  walk('src');
  walk('packages');
  walk('integrations');
  return found.sort();
}

function resolveBaseRef(explicit) {
  for (const ref of [explicit, 'origin/main', 'main', 'HEAD'].filter(Boolean)) {
    try {
      const mergeBase = git(['merge-base', 'HEAD', ref]).trim();
      const sha = git(['rev-parse', '--short', mergeBase]).trim();
      return { ref, mergeBase, sha };
    }
    catch { /* try next ref */ }
  }
  return { ref: 'HEAD', mergeBase: 'HEAD', sha: '' };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('usage: node tools/gates/errors.js [--all] [--base <ref>] [--json] [paths...]');
    process.exit(0);
  }
  const all = argv.includes('--all');
  const json = argv.includes('--json');
  const baseIdx = argv.indexOf('--base');
  const explicitBase = baseIdx > -1 ? argv[baseIdx + 1] : null;
  const positional = argv.filter((arg, idx) => !arg.startsWith('--') && (baseIdx === -1 || idx !== baseIdx + 1));

  const { ref: base, mergeBase, sha: baseSha } = resolveBaseRef(explicitBase);
  const allSource = walkSourceFiles();
  const files = positional.length
    ? allSource.filter((file) => positional.some((arg) => file === arg || file.startsWith(arg.replace(/\/?$/, '/'))))
    : all
    ? allSource
    : git(['diff', '--name-only', '--diff-filter=ACMR', mergeBase]).trim().split('\n').filter(isShippedSource);

  const rows = [];
  for (const file of files) {
    if (!fs.existsSync(file)) { continue; }
    const headSrc = fs.readFileSync(file, 'utf8');
    let baseLiterals = new Set();
    if (!all && positional.length === 0) {
      try {
        baseLiterals = new Set(extractLiterals(git(['show', `${mergeBase}:${file}`])).map((lit) => lit.raw));
      }
      catch {
        baseLiterals = new Set();
      }
    }
    for (const lit of extractLiterals(headSrc)) {
      if (!isProse(lit.raw)) { continue; }
      const classified = classifyLiteral(headSrc, lit);
      if (classified.kind === 'text') { continue; }
      if (!all && positional.length === 0 && baseLiterals.has(lit.raw)) { continue; }
      rows.push({
        file,
        line: lit.line,
        text: lit.raw.replace(/\\`/g, '`').replace(/\\'/g, "'"),
        ...classified,
      });
    }
  }

  const findingsByRule = new Map(RULES.map((rule) => [rule.id, []]));
  for (const row of rows) {
    for (const hit of checkErrorRow(row)) {
      findingsByRule.get(hit.rule)?.push({ ...row, ...hit });
    }
  }

  const totalFindings = [...findingsByRule.values()].reduce((sum, list) => sum + list.length, 0);
  const failedRules = RULES.filter((rule) => !rule.advisory && findingsByRule.get(rule.id).length > 0).length;
  const advisoryRules = RULES.filter((rule) => rule.advisory && findingsByRule.get(rule.id).length > 0).length;
  const passedRules = RULES.length - failedRules - advisoryRules;

  if (json) {
    console.log(JSON.stringify(
      {
        scope: all ? 'all' : positional.length ? positional : `${base}@${baseSha}`,
        filesScanned: files.length,
        literalsChecked: rows.length,
        passed: failedRules === 0,
        rules: Object.fromEntries(RULES.map((rule) => [rule.id, findingsByRule.get(rule.id)])),
      },
      null,
      2,
    ));
    process.exit(failedRules === 0 ? 0 : 1);
  }

  const scopeLabel = all
    ? `all package source (${files.length} files)`
    : positional.length
    ? `${positional.join(', ')} (${files.length} files)`
    : `base ${base} @ ${baseSha} (${files.length} changed file${files.length === 1 ? '' : 's'})`;

  console.log(`\n${scopeLabel} -> ${rows.length} error/log prose literal${rows.length === 1 ? '' : 's'} checked\n`);

  for (const rule of RULES) {
    const hits = findingsByRule.get(rule.id);
    const ok = hits.length === 0;
    const mark = ok ? color('green', '✓') : rule.advisory ? color('yellow', '?') : color('red', '✗');
    const padLabel = rule.label.padEnd(20);
    if (rule.advisory && !ok) {
      const words = [...new Set(hits.map((hit) => hit.word).filter(Boolean))].map((word) => `"${word}"`).join(', ');
      console.log(`  ${mark} ${padLabel} ${hits.length} to confirm (${words})`);
    }
    else {
      console.log(`  ${mark} ${padLabel} ${`${hits.length} violation${hits.length === 1 ? '' : 's'}`.padEnd(16)}`);
    }
  }

  if (totalFindings > 0) {
    console.log('');
    for (const rule of RULES) {
      const hits = findingsByRule.get(rule.id);
      if (!hits.length) { continue; }
      const heading = rule.advisory ? color('yellow', `? ${rule.label}`) : color('red', rule.label);
      console.log(`  ${heading} (${hits.length}):`);
      for (const hit of hits.slice(0, 15)) {
        const tag = hit.code ? `[${hit.code}]` : `(${hit.kind})`;
        console.log(`    ${hit.file}:${hit.line} ${tag}`);
        console.log(`      "${hit.text.replace(/\s+/g, ' ')}"`);
        console.log(`      -> ${hit.reason}`);
      }
      console.log('');
    }
  }

  const summary = advisoryRules > 0
    ? `  ${passedRules} passed, ${failedRules} failed (${advisoryRules} advisory to confirm)`
    : `  ${passedRules} passed, ${failedRules} failed`;
  console.log(`\n${summary}\n`);
  process.exit(failedRules === 0 ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
