#!/usr/bin/env node
/*
  pairs this-change with tip-of-tree in the tachometer JSON saved by tools/bench.js to generate comment.md and
  bench-report.json.
  Uses only Node built-ins so the privileged workflow_run reporting job does not run npm install
*/

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const HEAD = 'this-change';
const BASE = 'tip-of-tree';

// scheduling jitter per sample on shared GitHub runners, assumed until an op has enough samples to show its own
const JITTER_MS = 2;
const MIN_SAMPLES_FOR_SPREAD = 20;
// an unsure interval within this multiple of its expected noise is as narrow as the op's duration allows
const NOISE_TOLERANCE = 2;
// z for a 95% confidence interval
const Z = 1.96;

const STATES = {
  improvement: { icon: '✅', title: 'Improvement' },
  regression: { icon: '❌', title: 'Regression' },
  mixed: { icon: '🟡', title: 'Mixed' },
  unchanged: { icon: '⚪', title: 'No meaningful change' },
};

// file and op names arrive in artifacts from untrusted PR runs, so only identifiers reach the markdown
const SAFE_NAME = /^[\w$-]+$/;
const OP = /^export\s+(?:async\s+)?function\s+([\w$]+)/;
const PURPOSE = /^\s*\/\/\s*purpose:\s*(.*?)\s*$/;

/*******************************
          Measurements
*******************************/

export function readResults(dir) {
  const read = (name) => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
  const names = readdirSync(dir).filter((name) => name.endsWith('.json') && name !== 'changed.json').sort();
  return {
    files: Object.fromEntries(names.map((name) => [basename(name, '.json'), read(name)])),
    changed: existsSync(resolve(dir, 'changed.json')) ? read('changed.json') : {},
  };
}

export function readSampling(benchDir) {
  const { sampleSize, timeout, autoSampleConditions = [] } = JSON.parse(
    readFileSync(resolve(benchDir, 'tachometer.json'), 'utf8'),
  );
  const floor = parseFloat(autoSampleConditions.find((condition) => condition.endsWith('%')) ?? '0');
  return { sampleSize, timeout, floor };
}

// where each op is exported and the `// purpose:` line written above it, keyed `<file> <op>`
export function readOps(benchDir) {
  const ops = {};
  for (const name of readdirSync(benchDir).filter((entry) => entry.endsWith('.js')).sort()) {
    const lines = readFileSync(resolve(benchDir, name), 'utf8').split('\n');
    lines.forEach((line, index) => {
      const op = line.match(OP)?.[1];
      if (!op) { return; }
      const purpose = lines[index - 1]?.match(PURPOSE)?.[1] || null;
      ops[`${basename(name, '.js')} ${op}`] = { path: `bench/${name}`, line: index + 1, purpose };
    });
  }
  return ops;
}

const sideOf = (result) => String(result.name ?? '').split(' [')[0];
const interval = ({ low, high }) => [Number(low), Number(high)];
const middle = ([low, high]) => (low + high) / 2;

function spreadOf(samples) {
  if (!Array.isArray(samples) || samples.length < MIN_SAMPLES_FOR_SPREAD) { return JITTER_MS; }
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  return Math.sqrt(samples.reduce((sum, sample) => sum + (sample - mean) ** 2, 0) / (samples.length - 1));
}

function statusOf([low, high], { floor, expected }) {
  if (high < -floor) { return 'faster'; }
  if (low > floor) { return 'slower'; }
  if (low > -floor && high < floor) { return 'unchanged'; }
  return (high - low) / 2 <= NOISE_TOLERANCE * expected ? 'too fast' : 'inconclusive';
}

function rowsOf(files, { sampling, ops }) {
  const rows = [];
  for (const [file, { benchmarks = [] }] of Object.entries(files)) {
    benchmarks.forEach((result) => {
      const op = result.measurement?.name;
      if (sideOf(result) !== HEAD || !SAFE_NAME.test(file) || !SAFE_NAME.test(op)) { return; }
      const base = benchmarks.findIndex((other) => sideOf(other) === BASE && other.measurement?.name === op);
      const difference = result.differences?.[base];
      if (!difference) { return; }
      const change = interval(difference.percentChange);
      const meanMs = middle(interval(result.mean));
      const samples = result.samples?.length || sampling.sampleSize;
      const spreadMs = spreadOf(result.samples);
      // half-width of the 95% interval on a difference of two means, as a percent of the op's duration
      const expected = Z * Math.sqrt(2 / samples) * spreadMs / meanMs * 100;
      rows.push({
        file,
        op,
        status: statusOf(change, { floor: sampling.floor, expected }),
        change,
        changeMs: interval(difference.absolute),
        headMs: interval(result.mean),
        baseMs: interval(benchmarks[base].mean),
        meanMs,
        samples,
        spreadMs,
        expected,
        source: ops[`${file} ${op}`] ?? null,
      });
    });
  }
  return rows;
}

/*******************************
             Build
*******************************/

export function buildReport({ measurements, sampling, ops = {}, head = {}, run = {}, repo = '', sourceSha = '' }) {
  const { files, changed } = measurements;
  const rows = rowsOf(files, { sampling, ops });
  if (!rows.length) { throw new Error('no op was measured on both this-change and tip-of-tree'); }
  const count = (status) => rows.filter((row) => row.status === status).length;
  const summary = {
    faster: count('faster'),
    slower: count('slower'),
    unchanged: count('unchanged'),
    inconclusive: count('inconclusive'),
    'too fast': count('too fast'),
  };
  const state = summary.faster && summary.slower
    ? 'mixed'
    : summary.slower
    ? 'regression'
    : summary.faster
    ? 'improvement'
    : 'unchanged';
  return {
    state,
    title: `${STATES[state].icon} ${STATES[state].title} on Bench`,
    summary,
    sampling,
    head: { sha: head.sha ?? changed.head?.sha ?? '', ref: head.ref ?? '', msg: head.msg ?? '', pr: head.pr ?? null },
    base: { sha: changed.base?.sha ?? '', ref: changed.base?.ref ?? 'main' },
    run: { url: run.url ?? '', id: run.id ?? '', reportUrl: run.reportUrl ?? '' },
    repo,
    sourceSha,
    rows,
  };
}

/*******************************
             Render
*******************************/

const byMagnitude = (a, b) => Math.abs(middle(b.change)) - Math.abs(middle(a.change));
const rowsWith = (report, status) => report.rows.filter((row) => row.status === status).sort(byMagnitude);

function nameOf(row, { repo, sourceSha }) {
  const label = `\`${row.file} · ${row.op}\``;
  if (!row.source || !repo || !isSha(sourceSha)) { return label; }
  return `[${label}](https://github.com/${repo}/blob/${sourceSha}/${encodeURI(row.source.path)}#L${row.source.line})`;
}

const changeCell = (row) => `${percent(middle(row.change), 0)} (${Math.abs(middle(row.changeMs)).toFixed(1)} ms)`;
const intervalCell = (row) => `${percent(row.change[0])} to ${percent(row.change[1])}`;
const table = (header, lines) => [header, header.replace(/[^|]+/g, '---'), ...lines, ''];

function renderConfident(lines, title, rows, report) {
  if (!rows.length) { return; }
  lines.push(
    `#### ${title} (${rows.length})`,
    '',
    ...table(
      '| Op | Change | Interval |',
      rows.map((row) => `| ${nameOf(row, report)} | ${changeCell(row)} | ${intervalCell(row)} |`),
    ),
  );
}

function renderUnchanged(lines, rows, report) {
  if (!rows.length) { return; }
  lines.push(
    '<details>',
    `<summary>⚪ No change (${rows.length})</summary>`,
    '',
    ...table('| Op | Interval |', rows.map((row) => `| ${nameOf(row, report)} | ${intervalCell(row)} |`)),
    '</details>',
    '',
  );
}

function renderUnsure(lines, inconclusive, tooFast, report) {
  if (inconclusive.length + tooFast.length === 0) { return; }
  const { floor } = report.sampling;
  const unsureRow = (row) =>
    `| ${nameOf(row, report)} | ${intervalCell(row)} | ${row.meanMs.toFixed(0)} ms | ±${row.expected.toFixed(1)}% |`;
  const group = (title, line, rows) =>
    rows.length
      ? [
        `#### ${title} (${rows.length})`,
        '',
        line,
        '',
        ...table('| Op | Interval | Time | Expected noise |', rows.map(unsureRow)),
      ]
      : [];
  lines.push(
    '<details>',
    `<summary>🔍 Unsure (${inconclusive.length + tooFast.length})</summary>`,
    '',
    ...group(
      'Inconclusive',
      `The interval crossed ±${floor}% and is wider than an op this long usually produces. More samples may settle these.`,
      inconclusive,
    ),
    ...group(
      'Too fast to measure precisely',
      `The interval crossed ±${floor}% and is as narrow as an op this short allows. Larger changes still show up.`,
      tooFast,
    ),
    '</details>',
    '',
  );
}

function renderGlossary(lines, report) {
  const rows = report.rows.filter((row) => row.source?.purpose).sort((a, b) =>
    `${a.file} ${a.op}` < `${b.file} ${b.op}` ? -1 : 1
  );
  if (!rows.length) { return; }
  lines.push(
    '<details>',
    `<summary>📖 What each op measures (${rows.length})</summary>`,
    '',
    ...table(
      '| Op | Measures |',
      rows.map((row) => `| ${nameOf(row, report)} | ${escapeText(capitalize(row.source.purpose))} |`),
    ),
    '</details>',
    '',
  );
}

function footerOf(report) {
  const { sampling, base, repo, run } = report;
  return [
    base.sha ? `base ${escapeText(base.ref)} at ${commitLink(base.sha, repo)}` : `base ${escapeText(base.ref)}`,
    `Sample size: ${sampling.sampleSize}`,
    `Resolution floor: ±${sampling.floor}%`,
    `Timeout: ${sampling.timeout} min per file`,
    'Unsure means the confidence interval crossed the floor, not a regression',
    run.reportUrl ? `[\`bench-report.json\`](${run.reportUrl})` : '`bench-report.json`',
  ].join(' · ');
}

export function renderComment(report) {
  const { summary } = report;
  const lines = [
    `### ${report.title}`,
    '',
    `✅ ${summary.faster} faster · ❌ ${summary.slower} slower · 🔍 ${
      summary.inconclusive + summary['too fast']
    } unsure · ⚪ ${summary.unchanged} no change`,
    '',
  ];
  renderConfident(lines, '✅ Faster', rowsWith(report, 'faster'), report);
  renderConfident(lines, '❌ Slower', rowsWith(report, 'slower'), report);
  renderUnchanged(lines, rowsWith(report, 'unchanged'), report);
  renderUnsure(lines, rowsWith(report, 'inconclusive'), rowsWith(report, 'too fast'), report);
  renderGlossary(lines, report);
  lines.push(`<sub>${footerOf(report)}</sub>`);
  return lines.join('\n');
}

/*******************************
             Format
*******************************/

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const percent = (number, digits = 1) => `${number > 0 ? '+' : ''}${number.toFixed(digits)}%`;
const isSha = (value) => /^[0-9a-f]{7,64}$/i.test(String(value ?? ''));
const commitLink = (sha, at) =>
  at && isSha(sha)
    ? `[\`${sha.slice(0, 7)}\`](https://github.com/${at}/commit/${sha})`
    : `\`${escapeCode(sha).slice(0, 7)}\``;
const escapeText = (value) =>
  String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[\x00-\x1f\x7f]/g, '').replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char],
  ).replace(/[\\`[\]!|*_]/g, '\\$&');
const escapeCode = (value) => String(value ?? '').replace(/[`|\x00-\x1f\x7f]/g, '');

/*******************************
              CLI
*******************************/

export function writeReport(report, dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'bench-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(resolve(dir, 'comment.md'), renderComment(report));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      results: { type: 'string' },
      bench: { type: 'string', default: resolve(root, 'bench') },
      'source-sha': { type: 'string', default: '' },
      sha: { type: 'string' },
      ref: { type: 'string', default: '' },
      msg: { type: 'string', default: '' },
      pr: { type: 'string', default: '' },
      repo: { type: 'string', default: process.env.GITHUB_REPOSITORY ?? '' },
      'run-url': { type: 'string', default: '' },
      'run-id': { type: 'string', default: '' },
      'report-url': { type: 'string', default: '' },
      out: { type: 'string', default: './bench-report' },
    },
  });
  if (!values.results) {
    console.error(
      'reporter.js --results <dir> [--bench <dir>] [--source-sha <sha>] [--sha <sha>] [--ref <branch>] [--msg <title>] [--pr <number>] [--repo <owner/name>] [--run-url <url>] [--run-id <id>] [--report-url <url>] [--out <dir>]',
    );
    process.exit(2);
  }
  const report = buildReport({
    measurements: readResults(values.results),
    sampling: readSampling(values.bench),
    ops: readOps(values.bench),
    head: { sha: values.sha, ref: values.ref, msg: values.msg, pr: values.pr ? Number(values.pr) : null },
    run: { url: values['run-url'], id: values['run-id'], reportUrl: values['report-url'] },
    repo: values.repo,
    sourceSha: values['source-sha'],
  });
  writeReport(report, values.out);
  const { summary } = report;
  console.log(
    `${report.state}: ${summary.faster} faster, ${summary.slower} slower, ${
      summary.inconclusive + summary['too fast']
    } unsure, ${summary.unchanged} no change`,
  );
}
