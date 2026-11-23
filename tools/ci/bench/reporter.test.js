import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { filterWorkflowRuns, matchesSourcePrefixes, parseSourcePrefixes } from './fetch-pr-history.js';
import {
  buildReport,
  indexBenchFiles,
  loadHistoryMetrics,
  readResults,
  renderComment,
  writeReport,
} from './reporter.js';

function makeTachometerJson(entries) {
  const benchmarks = [];
  for (
    const { op, headMean = [40, 41], baseMean = [50, 51], pct = [-20, -18], abs = [-10, -9], samples = null } of entries
  ) {
    const headIdx = benchmarks.length;
    const baseIdx = headIdx + 1;
    const diffs = [];
    diffs[baseIdx] = {
      absolute: { low: abs[0], high: abs[1] },
      percentChange: { low: pct[0], high: pct[1] },
    };
    benchmarks.push({
      name: `this-change [${op}]`,
      measurement: { name: op },
      mean: { low: headMean[0], high: headMean[1] },
      samples: samples ?? Array.from({ length: 50 }, (_, index) => headMean[0] + (index % 2) * 0.5),
      differences: diffs,
    });
    benchmarks.push({
      name: `tip-of-tree [${op}]`,
      measurement: { name: op },
      mean: { low: baseMean[0], high: baseMean[1] },
      samples: Array.from({ length: 50 }, () => baseMean[0]),
      differences: [],
    });
  }
  return { benchmarks };
}

function writeResultsDir(suitesByFile, baselineSha = '1'.repeat(40)) {
  const dir = mkdtempSync(join(tmpdir(), 'bench-results-'));
  for (const [relPath, entries] of Object.entries(suitesByFile)) {
    const full = join(dir, relPath);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, JSON.stringify(makeTachometerJson(entries)));
  }
  if (baselineSha) {
    writeFileSync(join(dir, 'baseline-sha.txt'), `${baselineSha}\n`);
  }
  return dir;
}

describe('readResults() and indexBenchFiles()', () => {
  it('reads nested multi-cell artifact folders and pairs head/base metrics by suite and op', () => {
    const dir = writeResultsDir({
      'bench-results-parse/parse.json': [{ op: 'isoDate15k', pct: [-12, -8] }],
      'bench-results-format/format.json': [{ op: 'token10k', pct: [-0.8, 0.9], abs: [-0.2, 0.3] }],
    });
    try {
      const results = readResults(dir);
      expect(results.baselineSha).toBe('1'.repeat(40));
      expect(results.metrics.map((metric) => [metric.id, metric.label])).toEqual([
        ['format/token10k', 'format · token10k'],
        ['parse/isoDate15k', 'parse · isoDate15k'],
      ]);

      const history = loadHistoryMetrics(dir, results.baselineSha);
      expect(history['parse/isoDate15k'].percent_delta_ci).toEqual([-12, -8]);
      expect(history['parse/isoDate15k'].baseline_sha).toBe('1'.repeat(40));
    }
    finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('indexes exported function line numbers and optional purpose comments from bench/*.js', () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'bench-index-'));
    try {
      mkdirSync(join(repoRoot, 'bench'), { recursive: true });
      writeFileSync(
        join(repoRoot, 'bench/parse.js'),
        [
          "import { date } from 'native-dates';",
          '',
          '// purpose: parses 15k ISO dates into frozen CalendarDate values',
          'export function parseIsoDate15k() { date("2026-01-01"); }',
          '',
          'export async function asyncOp() {}',
        ].join('\n'),
      );
      const index = indexBenchFiles(repoRoot);
      expect(index.get('parse/parseIsoDate15k')).toEqual({
        source: { path: 'bench/parse.js', line: 4 },
        purpose: 'parses 15k ISO dates into frozen CalendarDate values',
      });
      expect(index.get('parse/asyncOp')).toEqual({
        source: { path: 'bench/parse.js', line: 6 },
        purpose: null,
      });
    }
    finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

describe('buildReport() and renderComment()', () => {
  it('classifies faster, slower, within-noise, noise-floor-limited, and inconclusive operations', () => {
    const dir = writeResultsDir({
      'parse.json': [
        { op: 'fasterOp', headMean: [35, 36], baseMean: [50, 51], pct: [-30, -26], abs: [-15, -14] },
        { op: 'slowerOp', headMean: [62, 63], baseMean: [50, 51], pct: [20, 25], abs: [10, 12] },
        { op: 'sameOp', headMean: [50, 50.4], baseMean: [50, 50.4], pct: [-0.9, 0.8], abs: [-0.4, 0.4] },
        // short 3 ms op with tight samples: straddles 2% within duration-derived noise floor
        {
          op: 'shortOp',
          headMean: [3, 3.2],
          baseMean: [3, 3.2],
          pct: [-4, 4],
          abs: [-0.1, 0.1],
          samples: Array.from({ length: 50 }, (_, i) => 3 + (i % 2) * 2),
        },
        // 60 ms op with tight samples but wide [-8%, +8%] interval: exceeds 2x expected noise
        {
          op: 'noisyOp',
          headMean: [60, 61],
          baseMean: [60, 61],
          pct: [-8, 8],
          abs: [-5, 5],
          samples: Array.from({ length: 50 }, () => 60),
        },
      ],
    });

    try {
      const results = readResults(dir);
      const report = buildReport({
        results,
        head: { sha: '2'.repeat(40), ref: 'perf/test', msg: 'Perf: Optimize parsing [draft]' },
        base: { sha: '1'.repeat(40), ref: 'main' },
        run: {
          url: 'https://github.com/Semantic-Org/Native-Dates/actions/runs/99',
          reportUrl: 'https://github.com/Semantic-Org/Native-Dates/actions/runs/100',
        },
        repo: 'Semantic-Org/Native-Dates',
        wallClockSec: 185,
      });

      expect(report.summary).toEqual({
        faster: 1,
        slower: 1,
        'within-noise': 1,
        'noise-floor-limited': 1,
        unsure: 1,
      });

      const markdown = renderComment(report);
      expect(markdown).toContain('### 🟡 Mixed (balanced) for [`2222222`]');
      expect(markdown).toContain('on Bench');
      expect(markdown).toContain(
        '**Raw:** [`bench-report.json`](https://github.com/Semantic-Org/Native-Dates/actions/runs/100)',
      );
      expect(markdown).toContain('\\[draft\\]');
      expect(markdown).toContain('#### ✅ Faster (1)');
      expect(markdown).toContain('#### ❌ Slower (1)');
      expect(markdown).toContain('<summary>⚪ No change (1)</summary>');
      expect(markdown).toContain('#### Inconclusive (1)');
      expect(markdown).toContain('#### Too Fast to Measure Precisely (1)');
      expect(markdown).toContain('Wall-clock: 3m05s');

      const outDir = mkdtempSync(join(tmpdir(), 'bench-out-'));
      try {
        writeReport(report, outDir);
        expect(JSON.parse(readFileSync(join(outDir, 'bench-report.json'), 'utf8')).summary.faster).toBe(1);
        expect(readFileSync(join(outDir, 'comment.md'), 'utf8')).toBe(markdown);
      }
      finally {
        rmSync(outDir, { recursive: true, force: true });
      }
    }
    finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('attributes new peaks and regressions from peak across PR iterations while skipping harness-only commits', () => {
    const dir = writeResultsDir(
      {
        'parse.json': [
          { op: 'regressedFromPeak', pct: [-1.2, 0.8], abs: [-0.5, 0.2] },
          { op: 'newBest', pct: [-28, -24], abs: [-14, -12] },
        ],
      },
      'bbbbbbb000000000000000000000000000000000',
    );

    const prHistory = {
      schema_version: 2,
      commits: [
        {
          sha: 'aaaaaaa111111111111111111111111111111111',
          msg: 'Perf: Iteration 1',
          timestamp: '2026-11-23T10:00:00Z',
          touches_source: true,
          metrics: {
            'parse/regressedFromPeak': {
              ci: [40, 41],
              mean_ms: 40.5,
              percent_delta_ci: [-22, -18],
              baseline_sha: 'aaaaaaa000000000000000000000000000000000',
            },
            'parse/newBest': {
              ci: [45, 46],
              mean_ms: 45.5,
              percent_delta_ci: [-12, -8],
              baseline_sha: 'bbbbbbb000000000000000000000000000000000',
            },
          },
        },
        {
          sha: 'ccccccc222222222222222222222222222222222',
          msg: 'Docs: Update notes',
          timestamp: '2026-11-23T10:30:00Z',
          touches_source: false,
          metrics: {
            'parse/regressedFromPeak': {
              ci: [49, 50],
              mean_ms: 49.5,
              percent_delta_ci: [-4, 0],
              baseline_sha: 'bbbbbbb000000000000000000000000000000000',
            },
          },
        },
        {
          sha: 'ddddddd333333333333333333333333333333333',
          msg: 'Perf: Iteration 2',
          timestamp: '2026-11-23T11:00:00Z',
          touches_source: true,
          metrics: {
            'parse/regressedFromPeak': {
              ci: [48, 49],
              mean_ms: 48.5,
              percent_delta_ci: [-5, -1],
              baseline_sha: 'bbbbbbb000000000000000000000000000000000',
            },
          },
        },
      ],
    };

    try {
      const report = buildReport({
        results: readResults(dir),
        prHistory,
        head: { sha: 'eeeeeee444444444444444444444444444444444', ref: 'perf/iter' },
        base: { sha: 'bbbbbbb000000000000000000000000000000000', ref: 'main' },
        repo: 'Semantic-Org/Native-Dates',
      });

      expect(report.history_summary).toEqual({ WIN: 1, 'TIED-PEAK': 0, REOPENED: 1, 'no-history': 0 });
      const reopened = report.metrics.find((metric) => metric.op === 'regressedFromPeak');
      expect(reopened.bisect_candidates.map((entry) => entry.sha.slice(0, 7))).toEqual(['ddddddd', 'eeeeeee']);
      expect(reopened.rebased).toBe(true);

      const markdown = renderComment(report);
      expect(markdown).toContain('🏆 1 new peak · 📜 1 reopened');
      expect(markdown).toContain('#### 🏆 New peaks (1)');
      expect(markdown).toContain('#### 📜 Regressions from peak (1)');
      expect(markdown).toContain('rebased from baseline `aaaaaaa` to `bbbbbbb`');
      expect(markdown).not.toContain('ccccccc');
    }
    finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('links the current push under likely commits on an adjacent two-push regression', () => {
    const dir = writeResultsDir({
      'parse.json': [{ op: 'regressedOnPush2', pct: [12, 16], abs: [5, 7] }],
    });
    const prHistory = {
      schema_version: 2,
      commits: [
        {
          sha: 'aaaaaaa111111111111111111111111111111111',
          msg: 'Feat: Push 1',
          timestamp: '2026-11-23T10:00:00Z',
          touches_source: true,
          metrics: {
            'parse/regressedOnPush2': {
              ci: [40, 41],
              mean_ms: 40.5,
              percent_delta_ci: [-1, 1],
              baseline_sha: '1'.repeat(40),
            },
          },
        },
      ],
    };

    try {
      const report = buildReport({
        results: readResults(dir),
        prHistory,
        head: { sha: 'bbbbbbb222222222222222222222222222222222', ref: 'feat/two-push', msg: 'Feat: Push 2' },
        base: { sha: '1'.repeat(40), ref: 'main' },
        repo: 'Semantic-Org/Native-Dates',
      });
      const metric = report.metrics[0];
      expect(metric.history_status).toBe('REOPENED');
      expect(metric.bisect_candidates.map((entry) => entry.sha.slice(0, 7))).toEqual(['bbbbbbb']);
      expect(renderComment(report)).toContain('[`bbbbbbb`](https://github.com/Semantic-Org/Native-Dates/commit/');
    }
    finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('fetch-pr-history helpers', () => {
  it('isolates PR runs by branch, fork repository, and PR creation timestamp', () => {
    const runs = [
      // current run should be excluded
      {
        id: 105,
        event: 'pull_request',
        conclusion: 'success',
        head_branch: 'patch-1',
        head_repository: { full_name: 'alice/Native-Dates' },
        created_at: '2026-11-23T12:10:00Z',
      },
      // valid earlier push on the same PR
      {
        id: 104,
        event: 'pull_request',
        conclusion: 'success',
        head_branch: 'patch-1',
        head_repository: { full_name: 'alice/Native-Dates' },
        created_at: '2026-11-23T12:01:00Z',
      },
      // cross-fork branch collision (bob/patch-1)
      {
        id: 103,
        event: 'pull_request',
        conclusion: 'success',
        head_branch: 'patch-1',
        head_repository: { full_name: 'bob/Native-Dates' },
        created_at: '2026-11-23T12:02:00Z',
      },
      // reused branch name from an older closed PR on alice's fork
      {
        id: 102,
        event: 'pull_request',
        conclusion: 'success',
        head_branch: 'patch-1',
        head_repository: { full_name: 'alice/Native-Dates' },
        created_at: '2026-10-01T09:00:00Z',
      },
      // failed run on the same PR
      {
        id: 101,
        event: 'pull_request',
        conclusion: 'failure',
        head_branch: 'patch-1',
        head_repository: { full_name: 'alice/Native-Dates' },
        created_at: '2026-11-23T12:05:00Z',
      },
    ];

    const matched = filterWorkflowRuns(runs, {
      branch: 'patch-1',
      headRepo: 'alice/Native-Dates',
      createdAt: '2026-11-23T12:00:00Z',
      currentRunId: '105',
    });
    expect(matched.map((run) => run.id)).toEqual([104]);
  });

  it('parses caller-supplied source prefixes without hardcoded directory assumptions', () => {
    const prefixes = parseSourcePrefixes('src/, packages/ , ');
    expect(prefixes).toEqual(['src/', 'packages/']);
    expect(matchesSourcePrefixes(['docs/README.md', 'packages/plugins/src/loose.js'], prefixes)).toBe(true);
    expect(matchesSourcePrefixes(['docs/README.md', '.github/workflows/bench.yml'], prefixes)).toBe(false);
    expect(matchesSourcePrefixes(['anything.txt'], [])).toBe(true);
  });
});
