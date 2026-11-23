#!/usr/bin/env node
// parses tachometer JSON into comment.md, summary.md, and bench-report.json using only Node built-ins

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const DEFAULT_SAMPLING = { sampleSize: 50, timeout: 3, autoSampleConditions: ['2%'] };
const DEFAULT_JITTER_MS = 2;
const MIN_SAMPLES_FOR_STDDEV = 20;
const NOISE_RATIO_TOLERANCE = 2;
const PURPOSE_MAX_CHARS = 120;
const AUTO_EXPAND_MAX = 15;
const TEASER_ROWS = 5;
const BISECT_MARKDOWN_MAX = 3;

const SEVERITY_SIGNIFICANT = 15;
const SEVERITY_VERY_SIGNIFICANT = 35;
const SEVERITY_EXTREME = 75;

// validate suite and op identifiers before rendering markdown since artifacts come from untrusted PR runs
const SAFE_IDENTIFIER = /^[\w$-]+$/;
const IGNORED_JSON = new Set(['bench-report.json', 'pr-history.json']);

const PEAK_SECTIONS = {
  win: {
    status: 'WIN',
    heading: '🏆 New peaks',
    description: 'These operations hit a new best on this PR. The most recent commit is usually the cause.',
    header: '| Op | Improvement | Prior peak | Likely commits |',
    sortSign: 1,
  },
  regression: {
    status: 'REOPENED',
    heading: '📜 Regressions from peak',
    description:
      'These operations were faster on an earlier push to this PR. The most recent commit is usually where to look.',
    header: '| Op | Regression | Prior peak | Likely commits |',
    sortSign: -1,
  },
};

/*******************************
          Measurements
*******************************/

function* walkFiles(dir) {
  if (!existsSync(dir)) { return; }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { yield* walkFiles(full); }
    else { yield full; }
  }
}

export function readBaselineSha(dir) {
  for (const file of walkFiles(dir)) {
    if (basename(file) === 'baseline-sha.txt') {
      const value = readFileSync(file, 'utf8').trim();
      if (isSha(value)) { return value; }
    }
  }
  return '';
}

export function* iterMetricPairs(dir) {
  const files = [...walkFiles(dir)]
    .filter((file) => file.endsWith('.json') && !IGNORED_JSON.has(basename(file)))
    .sort();

  for (const file of files) {
    const suite = basename(file, '.json');
    if (!SAFE_IDENTIFIER.test(suite)) { continue; }
    const data = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(data?.benchmarks)) { continue; }

    const byOp = new Map();
    data.benchmarks.forEach((bm, index) => {
      const op = bm.measurement?.name ?? bm.name;
      if (!SAFE_IDENTIFIER.test(op)) { return; }
      const side = String(bm.name ?? '').split(' [')[0];
      if (!byOp.has(op)) { byOp.set(op, {}); }
      byOp.get(op)[side] = { index, bm };
    });

    for (const [op, pair] of byOp) {
      const current = pair['this-change'];
      const base = pair['tip-of-tree'];
      if (!current?.bm?.mean) { continue; }
      const diff = base ? current.bm.differences?.[base.index] : null;
      yield {
        id: `${suite}/${op}`,
        suite,
        op,
        label: `${suite} · ${op}`,
        current,
        base,
        diff,
      };
    }
  }
}

export function readResults(dir) {
  const baselineSha = readBaselineSha(dir);
  const metrics = [];
  for (const { id, suite, op, label, current, base, diff } of iterMetricPairs(dir)) {
    if (!base || !diff) { continue; }
    metrics.push({
      id,
      suite,
      op,
      label,
      thisChangeMs: [Number(current.bm.mean.low), Number(current.bm.mean.high)],
      tipOfTreeMs: [Number(base.bm.mean.low), Number(base.bm.mean.high)],
      absoluteMsDelta: [Number(diff.absolute.low), Number(diff.absolute.high)],
      percentDelta: [Number(diff.percentChange.low), Number(diff.percentChange.high)],
      baselineSha: baselineSha || null,
      sampleCount: current.bm.samples?.length ?? 0,
      sigmaMs: sampleSigma(current.bm.samples),
    });
  }
  metrics.sort((a, b) => a.id.localeCompare(b.id));
  return { baselineSha, metrics };
}

export function loadHistoryMetrics(dir, baselineSha = '') {
  const out = {};
  for (const { id, current, diff } of iterMetricPairs(dir)) {
    const mean = current.bm.mean;
    const entry = {
      ci: [round4(mean.low), round4(mean.high)],
      mean_ms: round4((mean.low + mean.high) / 2),
    };
    if (diff?.percentChange) {
      entry.percent_delta_ci = [round4(diff.percentChange.low), round4(diff.percentChange.high)];
      if (baselineSha) {
        entry.baseline_sha = baselineSha;
      }
    }
    out[id] = entry;
  }
  return out;
}

export function readSampling(repoRoot) {
  const configPath = resolve(repoRoot, 'bench/tachometer.json');
  if (!existsSync(configPath)) { return DEFAULT_SAMPLING; }
  const parsed = JSON.parse(readFileSync(configPath, 'utf8'));
  return { ...DEFAULT_SAMPLING, ...parsed };
}

export function indexBenchFiles(repoRoot) {
  const benchDir = resolve(repoRoot, 'bench');
  const index = new Map();
  if (!existsSync(benchDir)) { return index; }

  const exportPattern = /^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/;
  const purposePattern = /^\s*\/\/\s*purpose:\s*(.+?)\s*$/;

  for (const file of readdirSync(benchDir).filter((name) => name.endsWith('.js')).sort()) {
    const suite = basename(file, '.js');
    const relPath = `bench/${file}`;
    const lines = readFileSync(join(benchDir, file), 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = exportPattern.exec(lines[i]);
      if (!match) { continue; }
      const op = match[1];
      const id = `${suite}/${op}`;
      if (index.has(id)) { continue; }
      let purpose = null;
      if (i > 0) {
        const prev = purposePattern.exec(lines[i - 1]);
        if (prev?.[1]) {
          purpose = prev[1].length <= PURPOSE_MAX_CHARS ? prev[1] : `${prev[1].slice(0, PURPOSE_MAX_CHARS - 1)}…`;
        }
      }
      index.set(id, { source: { path: relPath, line: i + 1 }, purpose });
    }
  }
  return index;
}

export function loadPrHistory(filePath) {
  if (!filePath || !existsSync(filePath)) { return null; }
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    if (parsed?.schema_version !== 2 || !Array.isArray(parsed.commits)) { return null; }
    parsed.commits.sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
    return parsed;
  }
  catch {
    return null;
  }
}

/*******************************
         Classification
*******************************/

// 95% CI width of the difference of two means at sampleSize: 2 * 1.96 * sqrt(2 / sampleSize) * sigma / mean * 100
function expectedNoisePp(meanMs, sampleSize, sigma = DEFAULT_JITTER_MS) {
  if (!(meanMs > 0) || !(sampleSize > 0)) { return 0; }
  return (2 * 1.96 * Math.sqrt(2 / sampleSize) * sigma) / meanMs * 100;
}

function sampleSigma(samples) {
  if (!Array.isArray(samples) || samples.length < MIN_SAMPLES_FOR_STDDEV) { return null; }
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const variance = samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (samples.length - 1);
  return Math.sqrt(variance);
}

function classify([low, high], floor, ratio) {
  if (high < -floor) { return 'faster'; }
  if (low > floor) { return 'slower'; }
  if (low > -floor && high < floor) { return 'within-noise'; }
  return ratio <= NOISE_RATIO_TOLERANCE ? 'noise-floor-limited' : 'unsure';
}

function computeHistoryStatus(metric, prHistory, floor, sampleSize, head) {
  if (!prHistory || prHistory.commits.length === 0) { return null; }

  const entries = prHistory.commits.filter((commit) => {
    const prior = commit.metrics?.[metric.id];
    if (!prior?.percent_delta_ci) { return false; }
    if (commit.touches_source === false) { return false; }
    const widthPp = prior.percent_delta_ci[1] - prior.percent_delta_ci[0];
    const expectedPp = prior.mean_ms > 0 ? expectedNoisePp(prior.mean_ms, sampleSize) : 0;
    return expectedPp <= 0 || widthPp / expectedPp <= NOISE_RATIO_TOLERANCE;
  });
  if (entries.length === 0) { return null; }

  let peakIdx = 0;
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].metrics[metric.id].percent_delta_ci[1] <= entries[peakIdx].metrics[metric.id].percent_delta_ci[1]) {
      peakIdx = i;
    }
  }
  const peakEntry = entries[peakIdx];
  const peakMetric = peakEntry.metrics[metric.id];
  const currentPctCi = metric.percentDelta;
  const peakPctCi = peakMetric.percent_delta_ci;

  const deltaFromPeakPct = mid(currentPctCi) - mid(peakPctCi);
  let status = 'TIED-PEAK';
  if (Math.abs(deltaFromPeakPct) >= floor) {
    if (currentPctCi[1] < peakPctCi[0]) { status = 'WIN'; }
    else if (peakPctCi[1] < currentPctCi[0]) { status = 'REOPENED'; }
  }

  const peakHistIdx = prHistory.commits.findIndex((commit) => commit.sha === peakEntry.sha);
  const bisectCandidates = prHistory.commits
    .slice(peakHistIdx + 1)
    .filter((commit) => commit.metrics?.[metric.id]?.percent_delta_ci && commit.touches_source !== false)
    .map((commit) => ({ sha: commit.sha, msg: commit.msg }));
  if (head?.sha && head.sha !== peakEntry.sha && bisectCandidates.at(-1)?.sha !== head.sha) {
    bisectCandidates.push({ sha: head.sha, msg: head.msg ?? '' });
  }

  const rebased = Boolean(
    metric.baselineSha && peakMetric.baseline_sha && metric.baselineSha !== peakMetric.baseline_sha,
  );

  return {
    status,
    peak: {
      sha: peakEntry.sha,
      msg: peakEntry.msg,
      ci: peakMetric.ci,
      mean_ms: peakMetric.mean_ms,
      percent_delta_ci: peakPctCi,
      baseline_sha: peakMetric.baseline_sha ?? null,
    },
    delta_from_peak_pct: Number(deltaFromPeakPct.toFixed(2)),
    bisect_candidates: bisectCandidates,
    rebased,
  };
}

export function buildReport({
  results,
  sampling = DEFAULT_SAMPLING,
  benchIndex = new Map(),
  prHistory = null,
  head = {},
  base = {},
  run = {},
  repo = '',
  wallClockSec = null,
}) {
  const sampleSize = Number(sampling.sampleSize ?? 50);
  const timeout = Number(sampling.timeout ?? 3);
  const floor = parseFloat((sampling.autoSampleConditions ?? []).find((item) => item.endsWith('%')) ?? '2');
  const baseSha = base.sha || results.baselineSha || '';

  const classified = results.metrics.map((metric) => {
    const meanMs = mid(metric.thisChangeMs);
    const widthPp = metric.percentDelta[1] - metric.percentDelta[0];
    const sigma = metric.sigmaMs ?? DEFAULT_JITTER_MS;
    const expectedPp = expectedNoisePp(meanMs, sampleSize, sigma);
    const ratio = expectedPp > 0 ? widthPp / expectedPp : Infinity;
    const indexed = benchIndex.get(metric.id);
    const status = classify(metric.percentDelta, floor, ratio);
    const historyStatus = status === 'unsure' ? null : computeHistoryStatus(metric, prHistory, floor, sampleSize, head);

    return {
      id: metric.id,
      suite: metric.suite,
      op: metric.op,
      label: metric.label,
      status,
      percent_change_ci: round2Pair(metric.percentDelta),
      absolute_ms_ci: round4Pair(metric.absoluteMsDelta),
      this_change_ms_ci: round4Pair(metric.thisChangeMs),
      tip_of_tree_ms_ci: round4Pair(metric.tipOfTreeMs),
      mean_ms: Number(meanMs.toFixed(2)),
      expected_noise_pp: Number(expectedPp.toFixed(2)),
      observed_noise_ratio: Number(ratio.toFixed(2)),
      sigma_ms: metric.sigmaMs !== null ? Number(metric.sigmaMs.toFixed(2)) : null,
      sample_count: metric.sampleCount,
      source: indexed?.source ?? null,
      purpose: indexed?.purpose ?? null,
      baseline_sha: metric.baselineSha ?? (baseSha || null),
      ...(historyStatus
        ? {
          history_status: historyStatus.status,
          peak: historyStatus.peak,
          delta_from_peak_pct: historyStatus.delta_from_peak_pct,
          bisect_candidates: historyStatus.bisect_candidates,
          rebased: historyStatus.rebased,
        }
        : {}),
    };
  });

  const summary = { faster: 0, slower: 0, 'within-noise': 0, unsure: 0, 'noise-floor-limited': 0 };
  const historySummary = { WIN: 0, 'TIED-PEAK': 0, REOPENED: 0, 'no-history': 0 };
  for (const metric of classified) {
    summary[metric.status]++;
    historySummary[metric.history_status ?? 'no-history']++;
  }

  return {
    head: { sha: head.sha ?? '', ref: head.ref ?? '', msg: head.msg ?? '' },
    base: { sha: baseSha, ref: base.ref || 'main' },
    run: {
      url: run.url ?? '',
      id: run.id || extractRunId(run.url),
      reportUrl: run.reportUrl ?? '',
    },
    repo,
    wall_clock_seconds: wallClockSec,
    sample_size: sampleSize,
    timeout_minutes: timeout,
    noise_floor_percent: floor,
    summary,
    history_summary: historySummary,
    post: classified.length > 0,
    metrics: classified,
  };
}

/*******************************
           Rendering
*******************************/

function determineState(summary) {
  const { faster, slower } = summary;
  if (faster > 0 && slower === 0) {
    return {
      emoji: '✅',
      heading: 'Improvement',
      alertType: 'TIP',
      body: `This PR improves ✅ ${faster} operation${faster === 1 ? '' : 's'}.`,
    };
  }
  if (slower > 0 && faster === 0) {
    return {
      emoji: '❌',
      heading: 'Regression',
      alertType: 'CAUTION',
      body: `This PR regresses on ❌ ${slower} operation${slower === 1 ? '' : 's'}.`,
    };
  }
  if (faster > 0 && slower > 0) {
    const modifier = faster > slower ? 'mostly faster' : slower > faster ? 'mostly slower' : 'balanced';
    const joiner = modifier === 'balanced' ? 'and regresses on' : 'while regressing on';
    return {
      emoji: '🟡',
      heading: `Mixed (${modifier})`,
      alertType: 'WARNING',
      body: `This PR improves ✅ ${faster} operation${faster === 1 ? '' : 's'} ${joiner} ❌ ${slower} operation${
        slower === 1 ? '' : 's'
      }.`,
    };
  }
  return {
    emoji: '⚪',
    heading: 'No meaningful change',
    alertType: 'NOTE',
    body: 'This PR did not move any measured operations outside the resolution floor.',
  };
}

export function renderComment(report) {
  const faster = report.metrics.filter((metric) => metric.status === 'faster');
  const slower = report.metrics.filter((metric) => metric.status === 'slower');
  const noChange = report.metrics.filter((metric) => metric.status === 'within-noise');
  const inconclusive = report.metrics.filter((metric) => metric.status === 'unsure');
  const tooFast = report.metrics.filter((metric) => metric.status === 'noise-floor-limited');
  const unsureTotal = inconclusive.length + tooFast.length;
  const floor = report.noise_floor_percent;

  const state = determineState(report.summary);
  const headText = report.head.sha
    ? ` for ${commitLink(report.head.sha, report.repo)}`
    : '';

  const lines = [
    `### ${state.emoji} ${state.heading}${headText} on Bench`,
    '',
  ];

  const meta = [`**Base:** ${baseLinkFor(report)}`];
  if (report.run.url) {
    const label = report.run.id ? `#${escapeText(report.run.id)}` : 'run';
    meta.push(`**Action:** [${label}](${report.run.url})`);
  }
  const jsonUrl = report.run.reportUrl || report.run.url;
  if (jsonUrl) {
    // link to the workflow run summary page rather than /artifacts, which 404s on GitHub
    meta.push(`**Raw:** [\`bench-report.json\`](${jsonUrl})`);
  }
  lines.push(meta.join(' · '), '');

  if (report.head.msg) {
    lines.push(`<sup>${escapeText(report.head.msg)}</sup>`, '');
  }

  lines.push(`> [!${state.alertType}]`, `> ${state.body}`, '');

  const counts = [
    `✅ ${faster.length} faster`,
    `❌ ${slower.length} slower`,
    `🔍 ${unsureTotal} unsure`,
    `⚪ ${noChange.length} no change`,
  ];
  if (report.history_summary.WIN > 0) {
    counts.push(`🏆 ${report.history_summary.WIN} new peak${report.history_summary.WIN === 1 ? '' : 's'}`);
  }
  if (report.history_summary.REOPENED > 0) {
    counts.push(`📜 ${report.history_summary.REOPENED} reopened`);
  }
  lines.push(counts.join(' · '), '', '---', '');

  if (faster.length > 0) { renderFasterSlower(lines, faster, 'faster', report); }
  if (slower.length > 0) { renderFasterSlower(lines, slower, 'slower', report); }

  renderPeakSection(lines, report, 'win');
  renderPeakSection(lines, report, 'regression');

  if (noChange.length > 0) {
    lines.push(
      '<details>',
      `<summary>⚪ No change (${noChange.length})</summary>`,
      '',
      `Operations where the 95% confidence interval stayed within ±${floor}% of \`${escapeCode(report.base.ref)}\`.`,
      '',
      '| Op | Interval |',
      '|---|---|',
      ...noChange.map((metric) => `| ${metricLink(metric, report)} | ${fmtPctRange(metric.percent_change_ci)} |`),
      '',
      '</details>',
      '',
    );
  }

  if (unsureTotal > 0) {
    lines.push('<details>', `<summary>🔍 Unsure (${unsureTotal})</summary>`, '');
    if (inconclusive.length > 0) {
      lines.push(
        `#### Inconclusive (${inconclusive.length})`,
        '',
        `Confidence intervals crossed ±${floor}% and were wider than expected for their duration.`,
        '',
        '| Op | Interval | Time | Expected noise |',
        '|---|---|---|---|',
        ...inconclusive.map((metric) =>
          `| ${metricLink(metric, report)} | ${fmtPctRange(metric.percent_change_ci)} | ${
            metric.mean_ms.toFixed(0)
          } ms | ±${metric.expected_noise_pp.toFixed(1)}% |`
        ),
        '',
      );
    }
    if (tooFast.length > 0) {
      lines.push(
        `#### Too Fast to Measure Precisely (${tooFast.length})`,
        '',
        `Runner scheduling and GC jitter exceed ±${floor}% on short operations, though larger shifts still register.`,
        '',
        '| Op | Interval | Time | Expected noise |',
        '|---|---|---|---|',
        ...tooFast.map((metric) =>
          `| ${metricLink(metric, report)} | ${fmtPctRange(metric.percent_change_ci)} | ${
            metric.mean_ms.toFixed(0)
          } ms | ±${metric.expected_noise_pp.toFixed(1)}% |`
        ),
        '',
      );
    }
    lines.push('</details>', '');
  }

  renderGlossary(lines, report);

  lines.push('---');
  const sampleCounts = report.metrics.map((metric) => metric.sample_count).filter((count) => count > 0);
  const minSamples = sampleCounts.length ? Math.min(...sampleCounts) : report.sample_size;
  const maxSamples = sampleCounts.length ? Math.max(...sampleCounts) : report.sample_size;
  const sampleText = minSamples === maxSamples
    ? `Sample size: ${minSamples}`
    : `Sample size: ${minSamples} floor / ${maxSamples} max`;
  const footer = [
    sampleText,
    `Resolution floor: ±${floor}%`,
    `Timeout: ${report.timeout_minutes} min per bench`,
  ];
  if (report.wall_clock_seconds !== null && Number.isFinite(report.wall_clock_seconds)) {
    footer.push(`Wall-clock: ${formatWallClock(report.wall_clock_seconds)}`);
  }
  lines.push(`<sub>${footer.join(' · ')}</sub>`);

  return lines.join('\n');
}

export const renderSummary = (report) => renderComment(report);

function renderFasterSlower(lines, rows, direction, report) {
  const sorted = [...rows].sort(
    (a, b) => Math.abs(mid(b.percent_change_ci)) - Math.abs(mid(a.percent_change_ci)),
  );
  const heading = direction === 'faster' ? `✅ Faster (${rows.length})` : `❌ Slower (${rows.length})`;
  const copy = direction === 'faster'
    ? `Operations where this PR confidently improved performance vs \`${escapeCode(report.base.ref)}\`.`
    : `Operations where this PR confidently regressed performance vs \`${escapeCode(report.base.ref)}\`.`;
  const header = direction === 'faster'
    ? '| Op | Improvement | Interval |'
    : '| Op | Regression | Interval |';

  const emitTable = (group) => {
    lines.push(
      header,
      '|---|---|---|',
      ...group.map((metric) =>
        `| ${metricLink(metric, report)} | ${fmtChangeCell(metric, direction)} | ${
          fmtPctRange(metric.percent_change_ci)
        } |`
      ),
      '',
    );
  };

  if (sorted.length <= AUTO_EXPAND_MAX) {
    lines.push(`#### ${heading}`, '', copy, '');
    emitTable(sorted);
  }
  else {
    lines.push(`#### ${heading} (top ${TEASER_ROWS})`, '', copy, '');
    emitTable(sorted.slice(0, TEASER_ROWS));
    lines.push('<details>', `<summary>Show all ${sorted.length} ${direction} operations</summary>`, '');
    emitTable(sorted);
    lines.push('</details>', '');
  }
}

function renderPeakSection(lines, report, kind) {
  const config = PEAK_SECTIONS[kind];
  const rows = report.metrics.filter(
    (metric) => metric.history_status === config.status && metric.status !== 'unsure',
  );
  if (rows.length === 0) { return; }

  const sorted = [...rows].sort(
    (a, b) => config.sortSign * ((a.delta_from_peak_pct ?? 0) - (b.delta_from_peak_pct ?? 0)),
  );

  lines.push(`#### ${config.heading} (${rows.length})`, '', config.description, '', config.header, '|---|---|---|---|');

  const rebasedNotes = [];
  for (const metric of sorted) {
    let flag = '';
    if (metric.rebased) {
      const idx = rebasedNotes.length + 1;
      flag = ` ⚠️${idx}`;
      rebasedNotes.push({
        idx,
        label: metric.label,
        fromSha: metric.peak.baseline_sha,
        toSha: metric.baseline_sha,
      });
    }
    const delta = `${Math.abs(metric.delta_from_peak_pct).toFixed(0)}%${flag}`;
    const peakLink = commitLink(metric.peak.sha, report.repo);
    const candidates = formatCandidates(metric.bisect_candidates, report.repo, metric.peak.sha, report.head.sha);
    lines.push(`| ${metricLink(metric, report)} | ${delta} | ${peakLink} | ${candidates} |`);
  }
  lines.push('');

  if (rebasedNotes.length > 0) {
    for (const note of rebasedNotes) {
      lines.push(
        `⚠️${note.idx} \`${escapeCode(note.label)}\` rebased from baseline \`${
          escapeCode(note.fromSha.slice(0, 7))
        }\` to \`${escapeCode(note.toSha.slice(0, 7))}\` between pushes.`,
      );
    }
    lines.push('');
  }
}

function renderGlossary(lines, report) {
  const annotated = report.metrics.filter((metric) => metric.purpose);
  if (annotated.length === 0) { return; }
  lines.push(
    '<details>',
    `<summary>📖 Bench glossary (${annotated.length} operation${annotated.length === 1 ? '' : 's'})</summary>`,
    '',
    '| Op | Purpose |',
    '|---|---|',
    ...annotated.map((metric) => `| ${metricLink(metric, report)} | ${escapeText(capitalize(metric.purpose))} |`),
    '',
    '</details>',
    '',
  );
}

/*******************************
             Format
*******************************/

function severitySuffix(midPct, direction) {
  const abs = Math.abs(midPct);
  if (abs < SEVERITY_SIGNIFICANT) { return ''; }
  if (direction === 'faster') {
    return abs >= SEVERITY_EXTREME ? ' 🏆' : abs >= SEVERITY_VERY_SIGNIFICANT ? ' 🌟' : ' ⭐';
  }
  return abs >= SEVERITY_EXTREME ? ' 🚨' : abs >= SEVERITY_VERY_SIGNIFICANT ? ' ‼️' : ' ❗';
}

function fmtChangeCell(metric, direction) {
  const midPct = mid(metric.percent_change_ci);
  const midMs = Math.abs(mid(metric.absolute_ms_ci));
  const sign = midPct > 0 ? '+' : '';
  return `${sign}${Math.round(midPct)}% (${midMs.toFixed(1)} ms)${severitySuffix(midPct, direction)}`;
}

function fmtPctRange([low, high]) {
  return `${signedPct(low)} to ${signedPct(high)}`;
}

function signedPct(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function metricLink(metric, report) {
  const code = `\`${escapeCode(metric.label)}\``;
  const sha = isSha(report.base.sha) ? report.base.sha : isSha(report.head.sha) ? report.head.sha : '';
  if (!report.repo || !metric.source || !sha) { return code; }
  return `[${code}](https://github.com/${report.repo}/blob/${sha}/${metric.source.path}#L${metric.source.line})`;
}

function commitLink(sha, repo) {
  if (!isSha(sha)) { return `\`${escapeCode(sha)}\``; }
  const short = sha.slice(0, 7);
  return repo ? `[\`${short}\`](https://github.com/${repo}/commit/${sha})` : `\`${short}\``;
}

function baseLinkFor(report) {
  const ref = escapeCode(report.base.ref);
  if (!report.repo) { return `\`${ref}\``; }
  const target = isSha(report.base.sha)
    ? `https://github.com/${report.repo}/commit/${report.base.sha}`
    : `https://github.com/${report.repo}/tree/${encodeURIComponent(report.base.ref)}`;
  return `[\`${ref}\`](${target})`;
}

function formatCandidates(candidates, repo, peakSha, headSha) {
  if (!Array.isArray(candidates) || candidates.length === 0) { return '—'; }
  const ordered = [...candidates].reverse();
  const shown = ordered.slice(0, BISECT_MARKDOWN_MAX).map((entry) => commitLink(entry.sha, repo)).join(', ');
  if (ordered.length <= BISECT_MARKDOWN_MAX) { return shown; }
  const remaining = ordered.length - BISECT_MARKDOWN_MAX;
  if (!repo || !isSha(peakSha) || !isSha(headSha)) { return `${shown} +${remaining} more`; }
  return `${shown} ([+${remaining} more](https://github.com/${repo}/compare/${peakSha}...${headSha}))`;
}

function formatWallClock(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m${String(secs).padStart(2, '0')}s` : `${secs}s`;
}

function extractRunId(url) {
  const match = /\/actions\/runs\/(\d+)/.exec(String(url ?? ''));
  return match ? match[1] : '';
}

const mid = ([low, high]) => (low + high) / 2;
const round2 = (value) => Number(Number(value).toFixed(2));
const round4 = (value) => Number(Number(value).toFixed(4));
const round2Pair = ([low, high]) => [round2(low), round2(high)];
const round4Pair = ([low, high]) => [round4(low), round4(high)];
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');
const isSha = (value) => typeof value === 'string' && /^[0-9a-f]{7,64}$/i.test(value);

const escapeText = (value) =>
  String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])
    .replace(/[\\`[\]!|*_]/g, '\\$&');
const escapeCode = (value) => String(value ?? '').replace(/[`|\x00-\x1f\x7f]/g, '');

/*******************************
              CLI
*******************************/

export function writeReport(report, dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'bench-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(resolve(dir, 'summary.md'), renderSummary(report));
  if (report.post) { writeFileSync(resolve(dir, 'comment.md'), renderComment(report)); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      results: { type: 'string' },
      'repo-root': { type: 'string', default: process.cwd() },
      'pr-history': { type: 'string', default: '' },
      sha: { type: 'string', default: '' },
      ref: { type: 'string', default: '' },
      msg: { type: 'string', default: '' },
      'base-sha': { type: 'string', default: '' },
      'base-ref': { type: 'string', default: 'main' },
      repo: { type: 'string', default: process.env.GITHUB_REPOSITORY ?? '' },
      'run-url': { type: 'string', default: '' },
      'run-id': { type: 'string', default: '' },
      'report-url': { type: 'string', default: '' },
      'wall-clock': { type: 'string' },
      out: { type: 'string', default: './bench-report' },
    },
  });
  if (!values.results) {
    console.error('reporter.js --results <dir> [--out <dir>]');
    process.exit(2);
  }
  const results = readResults(values.results);
  const report = buildReport({
    results,
    sampling: readSampling(values['repo-root']),
    benchIndex: indexBenchFiles(values['repo-root']),
    prHistory: loadPrHistory(values['pr-history']),
    head: { sha: values.sha, ref: values.ref, msg: values.msg },
    base: { sha: values['base-sha'], ref: values['base-ref'] },
    run: { url: values['run-url'], id: values['run-id'], reportUrl: values['report-url'] },
    repo: values.repo,
    wallClockSec: values['wall-clock'] !== undefined ? Number(values['wall-clock']) : null,
  });
  writeReport(report, values.out);
  console.log(
    `Wrote ${values.out}/bench-report.json (${report.summary.faster} faster, ${report.summary.slower} slower, `
      + `${report.summary['within-noise']} no change, ${
        report.summary.unsure + report.summary['noise-floor-limited']
      } unsure)`,
  );
}
