#!/usr/bin/env node
/*
  compares head.json and base.json from tools/gates/budget.js to generate comment.md, summary.md, and size-report.json.
  Uses only Node built-ins so the privileged workflow_run reporting job does not run npm install
*/

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

// size bands classified by core's Brotli delta, using byte thresholds from `sizes` in ai/contributing/budget.md
const BANDS = [
  {
    name: 'shrank',
    icon: '🟢',
    title: 'Core Shrank {delta} Bytes Brotli',
    line: 'PRs that remove bytes are typical for trims and sweeps.',
  },
  {
    name: 'unchanged',
    icon: '🟢',
    title: 'Core Unchanged',
    line: 'PRs that leave core unchanged are typical for plugin, test and tooling work.',
  },
  {
    name: 'bug sized',
    icon: '🔵',
    title: 'Core Grew {delta} Bytes Brotli (Bug Sized)',
    line: 'PRs between {range} are typical for bug fixes.',
  },
  {
    name: 'small feature sized',
    icon: '🟡',
    title: 'Core Grew {delta} Bytes Brotli (Small Feature Sized)',
    line: 'PRs between {range} are typical for small features and new options.',
  },
  {
    name: 'feature sized',
    icon: '🟠',
    title: 'Core Grew {delta} Bytes Brotli (Feature Sized)',
    line: 'PRs between {range} are typical for new plugins with seams in core.',
  },
  {
    name: 'large feature sized',
    icon: '🔴',
    title: 'Core Grew {delta} Bytes Brotli (Large Feature Sized)',
    line: 'PRs between {range} are typical for large core features, or plugins with significant core seams.',
  },
];

// failure rules ordered by headline priority when multiple checks fail simultaneously
const RED = { name: 'red', icon: '⛔' };
const REDS = {
  'did not build': {
    title: '{bundle} Did Not Build',
    line: 'There is an error preventing this PR from building{where}:',
  },
  'base did not build': {
    title: 'Base Did Not Build',
    line: 'There is an error preventing {base} from building, preventing comparisons.',
  },
  'over the ceiling': {
    title: 'Core Is {over} Bytes Over the Ceiling',
    line: 'This PR pushes core above the maximum size ({ceiling}kb)',
  },
  'over the PR limit': {
    title: 'Core Grew {delta} Bytes Brotli (Over the PR Limit)',
    line: 'This PR is larger than {limit} bytes which is above the maximum size.',
  },
  'over the bug fix limit': {
    title: 'Core Grew {delta} Bytes Brotli (Over the Bug Fix Limit)',
    line:
      'Bug fixes aim for 0 bytes and fail this check at {limit} bytes. A fix is usually one or two lines, and a larger one is for a severe bug.',
  },
  'dev messages ship': {
    title: 'Core Ships Dev Messages',
    line: 'This PR does not properly remove all of its development messages from the production build.',
  },
  'strip check cannot run': {
    title: 'Strip Check Cannot Run',
    line:
      'This PR leaves no development messages in the development build, so nothing confirms that they are removed from production.',
  },
  'prose outside the allowlist': {
    title: 'Core Ships Prose Outside the Allowlist',
    line: 'This PR ships prose in the production bundle',
  },
};

// maximum expected band for each PR title prefix before overriding the band's subtitle
const TITLED = {
  Feat: { band: 'bug sized', line: 'Features are generally implemented as plugins.' },
  Bug: { band: 'bug sized', as: 'a bug fix' },
  Refactor: { band: 'bug sized', as: 'a refactor' },
  Perf: { band: 'bug sized', as: 'a performance change' },
  Build: { band: 'unchanged', as: 'a build change' },
  Harness: { band: 'unchanged', as: 'a harness change' },
  Docs: { band: 'unchanged', as: 'a docs change' },
  Test: { band: 'unchanged', as: 'a test change' },
  Chore: { band: 'unchanged', as: 'a chore' },
};
const ABOVE = 'This PR is above the size expected for {kind} ({range}).';
const KIND = /^([A-Za-z]+(?:\/[A-Za-z]+)*)(?:\([^)]*\))?:/;

const EXPECTED = 'Expected bytes:';
const SIZES = ['min', 'gz', 'br'];
// decimal kilobytes (1,000 B), matching tools/size.js and ai/contributing/budget.md
const KILOBYTE = 1000;
const SOURCES = /^(src|packages)\//;
const MEASUREMENT =
  /^(\.github\/workflows\/bundle-size\.yml|\.node-version|package-lock\.json|ai\/contributing\/budget\.md|tools\/size\.js|tools\/gates\/(budget|prose)\.js|tools\/ci\/bundle\/reporter\.js)$/;
const MEASUREMENT_NOTE =
  'This PR changes how bundles are measured, so read its numbers against the run after it merges.';
const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

/*******************************
          Measurements
*******************************/

export function readResults(dir) {
  const read = (name) => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
  return {
    head: read('head.json'),
    base: read('base.json'),
    changed: existsSync(resolve(dir, 'changed.json')) ? read('changed.json') : {},
  };
}

function bandsFrom(sizes) {
  let from = 0;
  return BANDS.map((band) => {
    if (band.name === 'shrank') { return { ...band, upTo: -1 }; }
    if (band.name === 'unchanged') { return { ...band, upTo: 0, range: '0 bytes' }; }
    const upTo = Number(sizes?.[band.name]);
    if (!(upTo > from)) {
      throw new Error(
        `the measurement has no edge for '${band.name}' above ${from}. Check sizes in ai/contributing/budget.md`,
      );
    }
    const range = `${from}-${upTo} bytes`;
    from = upTo;
    return { ...band, upTo, range, line: fill(band.line, { range }) };
  });
}

// mark a target as changed only when its minified byte count changes, since Brotli re-tokenization
// of a combined core + plugin bundle can shift marginal plugin Brotli counts without plugin changes
function rowsOf(head, base) {
  const labels = unique([...head.rows, ...base.rows].map((row) => row.label));
  return labels.map((label) => {
    const after = head.rows.find((row) => row.label === label) ?? null;
    const before = base.rows.find((row) => row.label === label) ?? null;
    const { part, entry } = after ?? before;
    const error = after?.error || before?.error ? { head: after?.error ?? null, base: before?.error ?? null } : null;
    const delta = error
      ? null
      : Object.fromEntries(SIZES.map((key) => [key, (after?.sizes[key] ?? 0) - (before?.sizes[key] ?? 0)]));
    const status = after?.error
      ? 'failed'
      : before?.error
      ? 'base-failed'
      : !before
      ? 'added'
      : !after
      ? 'removed'
      : delta.min > 0
      ? 'larger'
      : delta.min < 0
      ? 'smaller'
      : 'unchanged';
    return {
      label,
      part,
      entry,
      head: after?.sizes ?? null,
      base: before?.sizes ?? null,
      delta,
      status,
      changed: ['added', 'removed', 'larger', 'smaller'].includes(status),
      ...(error ? { error } : {}),
    };
  });
}

const isDriving = (row) => row.part === 'headline' || row.part === 'plugin';
const isValue = (row) => isDriving(row) || row.part === 'diagnostic';

const reachOf = (head, base) =>
  unique([...head.rows, ...base.rows].flatMap((row) => Object.keys(row.inputs ?? {}))).sort();

function attributionOf(head, base) {
  const attribution = {};
  for (const label of unique([...head.rows, ...base.rows].map((row) => row.label))) {
    const headRow = head.rows.find((row) => row.label === label);
    const baseRow = base.rows.find((row) => row.label === label);
    if (headRow?.error || baseRow?.error) { continue; }
    const after = headRow?.inputs;
    const before = baseRow?.inputs;
    if (!after && !before) { continue; }
    attribution[label] = {};
    for (const file of unique([...Object.keys(after ?? {}), ...Object.keys(before ?? {})])) {
      const delta = (after?.[file] ?? 0) - (before?.[file] ?? 0);
      if (delta !== 0) { attribution[label][file] = delta; }
    }
  }
  return attribution;
}

const bandOf = (bands, delta) => bands.find((band) => delta <= band.upTo) ?? bands.at(-1);
const expectedOf = (body) =>
  String(body ?? '').split(/\r?\n/).map((line) => line.trim()).find((line) => line.startsWith(EXPECTED)) ?? null;
const kindOf = (msg) => String(msg ?? '').match(KIND)?.[1] ?? null;

/*******************************
             Build
*******************************/

export function buildReport({ measurements, head, body = '', run = {}, repo = '' }) {
  const { head: after, base: before, changed } = measurements;
  const rows = rowsOf(after, before);
  const driving = rows.filter(isDriving);
  const headline = rows.find((row) => row.part === 'headline');
  const reach = reachOf(after, before);
  const changedFiles = changed.files ?? [];
  const inReach = changedFiles.filter((file) => reach.includes(file));
  const bands = bandsFrom(after.sizes);
  const limits = { bug: bands.find((band) => band.name === TITLED.Bug.band).upTo, change: bands.at(-1).upTo };
  const checksOf = (side) => ({
    ceiling: {
      ok: side.ceiling.ok,
      limit: side.ceiling.limit,
      headline: side.ceiling.headline,
      distance: side.ceiling.distance,
    },
    strip: side.strip,
    prose: { ok: side.prose.ok, leaked: side.prose.leaked, skipped: side.prose.skipped ?? [] },
  });
  const checks = { ...checksOf(after), limits, base: checksOf(before) };
  const grew = driving.filter((row) => row.status === 'larger' || row.status === 'added');
  const shrank = driving.filter((row) => row.status === 'smaller' || row.status === 'removed');
  const band = headline.delta ? bandOf(bands, headline.delta.br) : null;
  const kind = kindOf(head.msg);
  const headSha = head.sha ?? changed.head?.sha ?? '';
  const reds = redsOf({ rows, checks, kind, base: escapeText(changed.base?.ref ?? 'main'), head: headSha, repo });
  const red = reds.length > 0;
  const differs = rows.some((row) =>
    row.delta === null || row.head === null || row.base === null || SIZES.some((key) => row.delta[key] !== 0)
  );
  const post = inReach.length > 0 || differs || red;

  const report = {
    state: red ? RED.name : band.name,
    reason: reds[0]?.name ?? null,
    band,
    bands,
    kind,
    ...verdictOf({ reds, bands, band, kind, headline }),
    post,
    head: { sha: headSha, ref: head.ref ?? '', msg: head.msg ?? '', pr: head.pr ?? null },
    base: { sha: changed.base?.sha ?? '', ref: changed.base?.ref ?? 'main' },
    run: { url: run.url ?? '', id: run.id ?? '', reportUrl: run.reportUrl ?? '' },
    repo,
    expected: expectedOf(body),
    rows,
    attribution: attributionOf(after, before),
    changedFiles,
    measurementChanged: changedFiles.filter((file) => MEASUREMENT.test(file)),
    reach,
    checks,
  };
  report.summary = summaryOf(report);
  report.sentence = sentenceOf(report, { grew, shrank, inReach });
  return report;
}

const shownSizes = (row) => row.head ?? row.base;
const stripFailuresOf = (strip) =>
  [
    !strip.present && 'the development build holds no development messages',
    !strip.folded && 'a development message survives the production build',
  ].filter(Boolean);
const STATUS_WORDS = {
  unchanged: 'unchanged',
  added: 'added',
  removed: 'removed',
  failed: 'did not build',
  'base-failed': 'base did not build',
};
const ceilingText = (limit) => `${limit / KILOBYTE} kB (${count(limit)} B)`;
const nameOf = (row) => `\`${escapeCode(row.label)}\``;
const leakedText = (leaked) =>
  leaked.map((entry) => `"${escapeText(entry.text)}" at \`${escapeCode(entry.at)}\``).join(', ');

function redsOf({ rows, checks, kind, base, head, repo }) {
  const headline = rows.find((row) => row.part === 'headline');
  const reds = [];
  const lineOf = (name, fields) => fill(REDS[name].line, fields);
  const add = (name, fields, blocks) =>
    reds.push({ name, title: fill(REDS[name].title, fields), body: blocks.filter(Boolean).join('\n\n') });
  const main = capitalize(base);

  // dependent rows fail whenever core fails, and core + all plugins fails whenever any plugin fails,
  // so report only the root failing bundle(s)
  const failed = rows.filter((row) => row.status === 'failed');
  const plugins = failed.filter(isDriving);
  const causes = headline.status === 'failed' ? [headline] : plugins.length ? plugins : failed;
  if (causes.length) {
    const bundle = causes.length > 1
      ? `${COUNT[causes.length] ?? causes.length} Bundles`
      : causes[0] === headline
      ? 'Core'
      : escapeText(causes[0].label);
    add(
      'did not build',
      { bundle },
      causes.map((row) => {
        const [, where, text] = oneLine(row.error.head).match(/^(\S+:\d+): (.+)$/) ?? [null, null, row.error.head];
        return `${lineOf('did not build', { where: where ? ` in ${escapeText(where)}` : '' })}\n${fenced(text)}`;
      }),
    );
  }
  const baseFailed = rows.filter((row) => row.status === 'base-failed');
  if (baseFailed.length) {
    add('base did not build', {}, [
      lineOf('base did not build', { base }),
      ...baseFailed.map((row) => `${nameOf(row)} stopped at:\n${fenced(row.error.base)}`),
    ]);
  }
  if (failed.length || baseFailed.length) { return reds; }

  const delta = headline.delta.br;
  if (!checks.ceiling.ok) {
    const adds = delta > 0 ? `adds ${count(delta)} more` : delta < 0 ? `removes ${count(delta)}` : 'adds none';
    add('over the ceiling', { over: count(-checks.ceiling.distance) }, [
      lineOf('over the ceiling', { ceiling: checks.ceiling.limit / KILOBYTE }),
      !checks.base.ceiling.ok
      && `${main} is already ${count(-checks.base.ceiling.distance)} bytes over, and this PR ${adds}.`,
    ]);
  }
  if (delta > checks.limits.change) {
    add('over the PR limit', { delta: signed(delta) }, [
      lineOf('over the PR limit', { limit: count(checks.limits.change) }),
    ]);
  }
  if (kind === 'Bug' && delta >= checks.limits.bug) {
    add('over the bug fix limit', { delta: signed(delta) }, [
      lineOf('over the bug fix limit', { limit: count(checks.limits.bug) }),
    ]);
  }
  if (!checks.strip.folded) {
    add('dev messages ship', {}, [
      lineOf('dev messages ship'),
      !checks.base.strip.folded && `${main} does not remove them either.`,
    ]);
  }
  if (!checks.strip.present) {
    add('strip check cannot run', {}, [
      lineOf('strip check cannot run'),
      !checks.base.strip.present && `It cannot run on ${base} either.`,
    ]);
  }
  const { leaked } = checks.prose;
  if (leaked.length) {
    const held = new Set(checks.base.prose.leaked.map((entry) => entry.text));
    add('prose outside the allowlist', {}, [
      lineOf('prose outside the allowlist'),
      leaked.map((entry) =>
        `- "${escapeText(entry.text)}" ${sourceLink(entry.at, { head, repo })}${
          held.has(entry.text) ? ` (on ${base} too)` : ''
        }`
      ).join('\n'),
    ]);
  }
  return reds;
}

function sourceLink(at, { head, repo }) {
  const [, file, line] = String(at).match(/^(.+):(\d+):\d+$/) ?? [];
  if (!file || file.includes('..') || !repo || !isSha(head)) { return `\`${escapeCode(at)}\``; }
  return `[\`${escapeCode(at)}\`](https://github.com/${repo}/blob/${head}/${
    encodeURI(file).replace(/[()]/g, escape)
  }#L${line})`;
}

function verdictOf({ reds, bands, band, kind, headline }) {
  if (reds.length) {
    return { title: `${RED.icon} ${reds[0].title}`, body: reds.map((red) => red.body).join('\n\n') };
  }
  const sizeOf = (name) => bands.findIndex((entry) => entry.name === name);
  const titled = TITLED[kind];
  const above = titled && sizeOf(band.name) > sizeOf(titled.band);
  const kindLine = () => titled.line ?? fill(ABOVE, { kind: titled.as, range: bands[sizeOf(titled.band)].range });
  const body = above ? kindLine() : band.line;
  return { title: `${band.icon} ${fill(band.title, { delta: signed(headline.delta.br) })}`, body };
}

function summaryOf(report) {
  const { checks } = report;
  const { distance, limit } = checks.ceiling;
  const ceiling = checks.ceiling.headline === null
    ? `${nameOf(report.rows.find((row) => row.part === 'headline'))} did not build`
    : distance >= 0
    ? `${count(distance)} B under the ${ceilingText(limit)} ceiling`
    : `${count(-distance)} B over the ${ceilingText(limit)} ceiling`;
  const strip = checks.strip.error
    ? `strip check not run, ${checks.strip.error}`
    : checks.strip.ok
    ? 'strip check passed'
    : `strip check failed, ${stripFailuresOf(checks.strip).join(' and ')}`;
  const { leaked, skipped } = checks.prose;
  const prose = [
    leaked.length
      ? `${leaked.length} prose literal${leaked.length === 1 ? '' : 's'} outside the allowlist: ${leakedText(leaked)}`
      : null,
    skipped.length ? `prose not read over ${skipped.map(escapeText).join(', ')}, which did not build` : null,
  ].filter(Boolean).join(', ') || 'no prose outside the allowlist';
  return { ceiling, checks: `${strip} · ${prose}` };
}

function sentenceOf(report, { grew, shrank, inReach }) {
  const { state, expected, changedFiles } = report;
  // lead with Brotli only when its sign matches the minified delta so a Brotli shrink is never called "grew"
  const named = (moved) =>
    moved.map((row) => {
      const agree = row.delta.br !== 0 && Math.sign(row.delta.br) === Math.sign(row.delta.min);
      return agree
        ? {
          name: nameOf(row),
          number: `**${signed(row.delta.br)} B**`,
          unit: row.status === 'removed' ? ' brotli, removed' : ` brotli to ${count(row.head.br)} B`,
        }
        : {
          name: nameOf(row),
          number: `**${signed(row.delta.min)} B** minified, brotli ${signed(row.delta.br)} B`,
          unit: '',
        };
    });
  const clause = (moved, verb) => {
    const [first, ...rest] = named(moved);
    if (!first) { return null; }
    return joinWords([
      `${first.name} ${verb} ${first.number}${first.unit}`,
      ...rest.map((entry) => `${entry.name} ${entry.number}`),
    ]);
  };
  if (state === RED.name) {
    return `${report.title.replace(`${RED.icon} `, '')}. ${
      report.body.replace(/^```$/gm, '').replace(/\s*\n\s*/g, ' ').trim()
    }`;
  }
  if (grew.length === 0 && shrank.length === 0) {
    const total = changedFiles.length;
    if (!report.post) {
      const same = `every bundle measures the same bytes as ${
        escapeText(report.base.ref)
      } in minified, gzip and brotli`;
      if (!changedFiles.some((file) => SOURCES.test(file))) {
        return `This PR touches no file under \`src/\` or \`packages/\`, and ${same}.`;
      }
      return `${
        total === 1
          ? 'The one file this PR touches is not in a bundle'
          : `None of the ${total} files this PR touches is in a bundle`
      }, and ${same}.`;
    }
    const hits = inReach.length;
    if (total === 1) {
      return `No bundle changed in minified bytes, and the one file this PR touches is ${
        hits ? '' : 'not '
      }in a bundle.`;
    }
    return `No bundle changed in minified bytes, and ${
      hits === 0 ? 'none' : hits === 1 ? 'one' : hits
    } of the ${total} files this PR touches ${hits > 1 ? 'are' : 'is'} in a bundle.`;
  }
  const against = expected ? `"${escapeText(expected)}"` : 'an expected cost of about 0';
  return capitalize(
    `${[clause(grew, 'grew'), clause(shrank, 'shrank')].filter(Boolean).join(', and ')}, against ${against}.`,
  );
}

/*******************************
             Render
*******************************/

const opening = (report) => ['## Bundle Size', '', `### ${report.title}`, '', report.body, ''];

export function renderComment(report) {
  const lines = opening(report);
  if (report.measurementChanged.length) { lines.push(MEASUREMENT_NOTE, ''); }
  lines.push('### Packages Changed');
  renderChanged(lines, report);
  if (report.expected) { lines.push(escapeText(report.expected), ''); }
  renderAttribution(lines, report);
  renderAllBundles(lines, report);
  lines.push(`<sub>${footerOf(report)}</sub>`);
  return lines.join('\n');
}

export function renderSummary(report) {
  if (report.post) { return renderComment(report); }
  const lines = [...opening(report), `**No comment posted.** ${report.sentence}`, ''];
  if (report.measurementChanged.length) { lines.push(MEASUREMENT_NOTE, ''); }
  renderAllBundles(lines, report);
  lines.push(`<sub>${footerOf(report)}</sub>`);
  return lines.join('\n');
}

const commitLink = (sha, at) =>
  at && isSha(sha)
    ? `[\`${sha.slice(0, 7)}\`](https://github.com/${at}/commit/${sha})`
    : `\`${escapeCode(sha).slice(0, 7)}\``;
const suffixed = (row) =>
  `${escapeText(row.label)}${
    row.status === 'unchanged' || row.status === 'larger' || row.status === 'smaller'
      ? ''
      : `, ${STATUS_WORDS[row.status]}`
  }`;
const iconOf = (row, { bands, checks }) =>
  row.part === 'headline' && row.delta.br > checks.limits.change ? RED.icon : bandOf(bands, row.delta.br).icon;
const brotliCell = (row, report) => (row.delta ? `${signed(row.delta.br)} B ${iconOf(row, report)}` : '—');

function renderChanged(lines, report) {
  const unbuilt = report.rows.filter((row) => row.part !== 'overhead' && !row.delta);
  const moved = report.rows.filter((row) => isDriving(row) && row.changed);
  if (moved.length + unbuilt.length === 0) {
    lines.push('No bundle changed size. 🎉', '');
    return;
  }
  const first = (rows) => [
    ...rows.filter((row) => row.part === 'headline'),
    ...rows.filter((row) => row.part !== 'headline'),
  ];
  const rest = moved.filter((row) => row.part !== 'headline');
  const increases = rest.filter((row) => row.delta.br > 0 || row.status === 'added').sort((a, b) =>
    b.delta.br - a.delta.br
  );
  const decreases = rest.filter((row) => !increases.includes(row)).sort((a, b) => a.delta.br - b.delta.br);
  const changedRow = (row) =>
    `| ${suffixed(row)} | ${count(shownSizes(row).br)} B | ${signed(row.delta.min)} B | ${brotliCell(row, report)} |`;
  lines.push('| bundle | brotli | Δ minified | Δ brotli |', '|---|---:|---:|---:|');
  for (const row of first([...moved.filter((entry) => entry.part === 'headline'), ...unbuilt])) {
    lines.push(
      row.delta ? changedRow(row) : `| ${suffixed(row)} | ${row.head ? `${count(row.head.br)} B` : '—'} | — | — |`,
    );
  }
  for (const row of [...increases, ...decreases]) { lines.push(changedRow(row)); }
  lines.push('');
}

function renderAttribution(lines, report) {
  const columns = report.rows.filter((row) =>
    isDriving(row) && Object.keys(report.attribution[row.label] ?? {}).length > 0
  );
  if (columns.length === 0) { return; }
  const files = unique(columns.flatMap((row) => Object.keys(report.attribution[row.label])));
  const cellsOf = (file) => columns.map((row) => report.attribution[row.label][file] ?? 0);
  const keyOf = (file) => {
    const cells = cellsOf(file);
    return [cells.filter(Boolean).length, cells.findIndex(Boolean), -Math.max(...cells.map(Math.abs))];
  };
  files.sort((a, b) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    for (let index = 0; index < ka.length; index++) {
      if (ka[index] !== kb[index]) { return ka[index] - kb[index]; }
    }
    return a < b ? -1 : 1;
  });
  lines.push('<details>', '<summary>Where the bytes went (minified)</summary>', '');
  lines.push(
    `| file |${columns.map((row) => ` ${escapeText(row.label)} |`).join('')}`,
    `|---|${columns.map(() => '---:|').join('')}`,
  );
  for (const file of files) {
    lines.push(
      `| \`${escapeCode(file)}\` |${cellsOf(file).map((delta) => (delta ? ` ${signed(delta)} B |` : ' |')).join('')}`,
    );
  }
  lines.push('', '</details>', '');
}

function renderAllBundles(lines, report) {
  const rows = report.rows.filter(isValue);
  const overhead = report.rows.find((row) => row.part === 'overhead');
  lines.push(
    '<details>',
    `<summary>All bundles (${rows.length})</summary>`,
    '',
    '| bundle | minified | gzip | brotli | Δ brotli |',
    '|---|---:|---:|---:|---:|',
  );
  for (const row of rows) {
    if (row.status === 'failed') {
      lines.push(`| ${suffixed(row)} | — | — | — | — |`);
      continue;
    }
    const sizes = shownSizes(row);
    lines.push(
      `| ${suffixed(row)} | ${count(sizes.min)} B | ${count(sizes.gz)} B | ${count(sizes.br)} B | ${
        brotliCell(row, report)
      } |`,
    );
  }
  lines.push('');
  if (overhead) {
    lines.push(
      `Dev prose folded out: ${overhead.status === 'failed' ? 'did not build' : `${count(shownSizes(overhead).br)} B`}`,
      '',
    );
  }
  lines.push('</details>', '');
}

// link to the workflow run page rather than /artifacts, which returns 404 on GitHub
function footerOf(report) {
  const { run, repo, base } = report;
  return [
    base.sha ? `base ${escapeText(base.ref)} at ${commitLink(base.sha, repo)}` : `base ${escapeText(base.ref)}`,
    run.reportUrl ? `[\`size-report.json\`](${run.reportUrl})` : '`size-report.json`',
  ].join(' · ');
}

/*******************************
             Format
*******************************/

// U+2212 minus sign for negative byte deltas
const count = (bytes) => String(Math.abs(Math.trunc(bytes))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const signed = (bytes) => (bytes > 0 ? `+${count(bytes)}` : bytes < 0 ? `−${count(bytes)}` : '0');
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const isSha = (value) => /^[0-9a-f]{7,64}$/i.test(String(value ?? ''));
const unique = (list) => [...new Set(list)];
const fill = (template, fields = {}) =>
  template.replace(/\{(\w+)\}/g, (placeholder, key) => fields[key] ?? placeholder);
const joinWords = (words) => [words.slice(0, -1).join(', '), words.at(-1)].filter(Boolean).join(' and ');

const escapeText = (value) =>
  String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[\x00-\x1f\x7f]/g, '').replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char],
  ).replace(/[\\`[\]!|*_]/g, '\\$&');
const escapeCode = (value) => String(value ?? '').replace(/[`|\x00-\x1f\x7f]/g, '');
const stripFence = (line) => String(line ?? '').replace(/^\s*```/, ' ``');
const oneLine = (text) => String(text ?? '').replace(/[\r\n]+/g, ' ').replace(/[\x00-\x1f\x7f]/g, '');
const fenced = (text) => `\`\`\`\n${stripFence(oneLine(text))}\n\`\`\``;

/*******************************
              CLI
*******************************/

export function writeReport(report, dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'size-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(resolve(dir, 'summary.md'), renderSummary(report));
  if (report.post) { writeFileSync(resolve(dir, 'comment.md'), renderComment(report)); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      results: { type: 'string' },
      sha: { type: 'string' },
      ref: { type: 'string', default: '' },
      msg: { type: 'string', default: '' },
      pr: { type: 'string', default: '' },
      body: { type: 'string' },
      repo: { type: 'string', default: process.env.GITHUB_REPOSITORY ?? '' },
      'run-url': { type: 'string', default: '' },
      'run-id': { type: 'string', default: '' },
      'report-url': { type: 'string', default: '' },
      out: { type: 'string', default: './size-report' },
    },
  });
  if (!values.results) {
    console.error(
      'reporter.js --results <dir> [--sha <sha>] [--ref <branch>] [--msg <title>] [--pr <number>] [--body <file>] [--repo <owner/name>] [--run-url <url>] [--run-id <id>] [--report-url <url>] [--out <dir>]',
    );
    process.exit(2);
  }
  const measurements = readResults(values.results);
  const body = values.body && existsSync(values.body) ? readFileSync(values.body, 'utf8') : '';
  const report = buildReport({
    measurements,
    head: { sha: values.sha, ref: values.ref, msg: values.msg, pr: values.pr ? Number(values.pr) : null },
    body,
    run: { url: values['run-url'], id: values['run-id'], reportUrl: values['report-url'] },
    repo: values.repo,
  });
  writeReport(report, values.out);
  console.log(
    `${report.state}: ${report.post ? 'posted comment' : 'skipped comment (see summary.md)'}. ${report.sentence}`,
  );
}
