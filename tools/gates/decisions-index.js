// builds and checks ai/contributing/decisions.md from ai/contributing/decisions/package.md

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const packagePath = resolve(root, 'ai/contributing/decisions/package.md');
const indexPath = resolve(root, 'ai/contributing/decisions.md');

const headingPattern = /^##\s+D(\d+):\s+(.+?)\s+\((\d{4}-\d{2}-\d{2})\)\s*$/;
const confidencePattern = /^\*(\d{1,3})%\s+confident\*$/i;
const reopenPattern = /^Reopen:\s*(.+)$/i;
const supersededPattern = /^Superseded by\s+(.+?)\.?\s*$/i;

// ordered from specific domain nouns to broader categories, first match wins
const topicGroups = [
  ['Zones, Offsets, and Serialization', /\.zone\b|\boffsets?\b|serializes?\b|\bUTC\b|time ?zone|IANA/i],
  ['Ranges', /DateRange|DateTimeRange|TimeRange|\bRanges?\b|\.for\(\)|\.through\(\)|\.points\(\)/i],
  ['Durations', /\bDuration\b|\bbalance\(\)|\btotal\(|\bnormalize\(\)/i],
  ['Arithmetic, Boundaries, and Weekdays', /startOf|endOf|unit boundaries|week boundaries|dayOfWeek|weekOfYear/i],
  [
    'Formatting, Tokens, and Locales',
    /\.locale\(\)|Format tokens|\btokens?\b|ordinal|weekdayNames|\bformats\b|Gregorian/i,
  ],
  ['Parsing, Inputs, and Comparisons', /non-ISO|two readings|\bcompare\(|earliest|latest/i],
  ['Nouns, Instances, and Epoch', /\bepoch|\bfreeze\b|own property|Unix timestamp|\bMonthDay\b|\bYearMonth\b/i],
  [
    'Plugins, Errors, and Dependencies',
    /\bPlugins?\b|subpath|dependencies|@semantic-ui\/utils|Error explanations|isDevelopment|ceiling|\bBrotli\b/i,
  ],
];

const slugBase = (heading) =>
  heading
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/ /g, '-');

const paragraphsOf = (body) =>
  body
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

export function parseDecisions(source) {
  const lines = source.split('\n');
  const slugCounts = new Map();
  const headings = [];
  const findings = [];
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) { return; }
    const headingMatch = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!headingMatch) { return; }
    const base = slugBase(headingMatch[1]);
    const seen = slugCounts.get(base) ?? 0;
    slugCounts.set(base, seen + 1);
    const anchor = seen === 0 ? base : `${base}-${seen}`;

    if (!line.startsWith('## ')) { return; }
    const parsed = headingPattern.exec(line);
    if (!parsed) {
      findings.push(`L${index + 1}: expected '## D<n>: <Plain claim> (<YYYY-MM-DD>)' heading`);
      return;
    }
    const id = Number(parsed[1]);
    const expectedId = headings.length + 1;
    if (id !== expectedId) {
      findings.push(`L${index + 1}: expected sequential ID D${expectedId}, got D${id}`);
    }
    headings.push({ id, line: index + 1, title: parsed[2].trim(), date: parsed[3], anchor });
  });

  const entries = headings.map((entry, index) => {
    const bound = index + 1 < headings.length ? headings[index + 1].line - 1 : lines.length;
    let endLine = bound;
    while (endLine > entry.line && lines[endLine - 1].trim() === '') {
      endLine--;
    }
    const paragraphs = paragraphsOf(lines.slice(entry.line, bound).join('\n'));
    let confidence = null;
    let reopen = '';
    let supersededBy = '';

    paragraphs.forEach((paragraph, position) => {
      const confMatch = confidencePattern.exec(paragraph);
      if (confMatch) {
        const value = Number(confMatch[1]);
        if (position !== 0 || value > 100) {
          findings.push(`L${entry.line}: confidence line must lead the entry as '*0-100% confident*'`);
        }
        confidence = value;
        return;
      }
      const reopenMatch = reopenPattern.exec(paragraph);
      if (reopenMatch) {
        reopen = reopenMatch[1].trim();
        return;
      }
      const supMatch = supersededPattern.exec(paragraph);
      if (supMatch) {
        supersededBy = supMatch[1].trim();
      }
    });

    const topic = topicGroups.find(([, pattern]) => pattern.test(entry.title))?.[0] ?? 'Unsorted';
    if (topic === 'Unsorted') {
      findings.push(`L${entry.line}: no topic group matched '${entry.title}'`);
    }
    if (!reopen && !supersededBy) {
      findings.push(`L${entry.line}: missing 'Reopen: <observable condition>' line`);
    }
    if (index > 0 && entry.date < headings[index - 1].date) {
      findings.push(`L${entry.line}: date ${entry.date} precedes earlier entry ${headings[index - 1].date}`);
    }

    return { ...entry, endLine, confidence, reopen, supersededBy, topic };
  });

  return { entries, findings };
}

const formatItem = (entry) => {
  const stamp = entry.confidence === null ? entry.date : `${entry.date}, ${entry.confidence}% confident`;
  const range = `L${entry.line}-L${entry.endLine}`;
  const lines = [`- **D${entry.id}:** ${entry.title} (${stamp}) [${range}](decisions/package.md#${entry.anchor})`];
  if (entry.supersededBy) {
    lines.push(`  - Superseded by ${entry.supersededBy}`);
  }
  else if (entry.reopen) {
    lines.push(`  - Reopen: ${entry.reopen}`);
  }
  return lines.join('\n');
};

export function renderDecisionsIndex(entries) {
  const out = [
    '# Decisions',
    '',
    '> Generated from [`decisions/package.md`](decisions/package.md) by `npm run ai:index` and checked by `npm run ai`. Do not edit by hand. Read [`decisions/README.md`](decisions/README.md) before adding or reopening an entry (features and bug fixes do not belong here, and repo process calls belong in [`decisions/project.md`](decisions/project.md)).',
    '',
    '## By Topic',
    '',
    'Active package decisions grouped by area, newest first.',
    '',
  ];

  for (const [name] of topicGroups) {
    const matching = entries
      .filter((entry) => entry.topic === name && !entry.supersededBy)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    if (!matching.length) { continue; }
    out.push(`### ${name}`, '');
    for (const entry of matching) {
      out.push(formatItem(entry));
    }
    out.push('');
  }

  out.push('## Chronological', '', 'Every package decision (`D1`..`Dn`) in file order.', '');
  for (const entry of entries) {
    out.push(formatItem(entry));
  }
  out.push('');
  return out.join('\n');
}

export function checkDecisions(
  source = readFileSync(packagePath, 'utf8'),
  indexSource = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '',
) {
  const { entries, findings } = parseDecisions(source);
  const issues = findings.map((finding) => `ai/contributing/decisions/package.md: ${finding}`);
  if (!findings.length && indexSource !== renderDecisionsIndex(entries)) {
    issues.push('ai/contributing/decisions.md: stale index (run `npm run ai:index`)');
  }
  return issues;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { entries, findings } = parseDecisions(readFileSync(packagePath, 'utf8'));
  if (findings.length) {
    for (const finding of findings) {
      console.error(`  x ai/contributing/decisions/package.md: ${finding}`);
    }
    process.exitCode = 1;
  }
  else {
    const output = renderDecisionsIndex(entries);
    if (process.argv.includes('--write')) {
      writeFileSync(indexPath, output);
      console.log(`wrote ${relative(root, indexPath)} (${entries.length} decisions)`);
    }
    else {
      process.stdout.write(output);
    }
  }
}
