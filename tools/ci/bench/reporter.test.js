import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildReport, readOps, readResults, readSampling, renderComment, writeReport } from './reporter.js';

// tachometer output from one op run against identical code on both sides, 430 samples a side
const fixture = resolve(import.meta.dirname, 'fixtures/identical-code');
const sampling = { sampleSize: 50, timeout: 3, floor: 2 };
const REPO = 'Semantic-Org/Native-Dates';
const SHA = 'a'.repeat(40);

// one op as tachometer reports it: a this-change and a tip-of-tree entry pointing at each other
const pair = (op, [low, high], { meanMs = 50, samples } = {}) => {
  const side = (name, differences) => ({
    name,
    measurement: { name: op, mode: 'performance', entryName: op },
    mean: { low: meanMs - 1, high: meanMs + 1 },
    differences,
    ...(samples ? { samples } : {}),
  });
  const difference = {
    percentChange: { low, high },
    absolute: { low: meanMs * low / 100, high: meanMs * high / 100 },
  };
  return [side('this-change', [null, difference]), side('tip-of-tree', [difference, null])];
};
// tachometer indexes differences by position, so each file here holds one op
const measured = (ops, changed = {}, run = {}) => ({
  files: Object.fromEntries(
    Object.entries(ops).map(([name, benchmarks]) => [name.split(' ')[0], { benchmarks }]),
  ),
  changed,
  run,
});
const build = (ops, rest = {}) =>
  buildReport({ measurements: measured(ops), sampling, repo: REPO, sourceSha: SHA, ...rest });
const steady = (meanMs) => Array.from({ length: 50 }, (_, index) => meanMs + (index % 2 ? 1 : -1));

describe('readResults(), readSampling(), and readOps()', () => {
  it('pairs both sides of a real tachometer capture and reads the interval between them', () => {
    const report = buildReport({ measurements: readResults(fixture), sampling });
    expect(report.rows).toHaveLength(1);
    const [row] = report.rows;
    expect(row).toMatchObject({ file: 'probe', op: 'probe10k', samples: 430, status: 'inconclusive' });
    expect(row.change[0]).toBeCloseTo(-1.56, 1);
    expect(row.change[1]).toBeCloseTo(2.32, 1);
    expect(row.meanMs).toBeCloseTo(53.2, 0);
    expect(report.summary).toEqual({
      faster: 0,
      slower: 0,
      unchanged: 0,
      inconclusive: 1,
      'too fast': 0,
      changed: 0,
      missing: 0,
    });
  });

  it('reads changed.json apart from the measurements and defaults it to {} when absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bench-results-'));
    writeFileSync(join(dir, 'parse.json'), JSON.stringify({ benchmarks: pair('parse10k', [-1, 1]) }));
    expect(readResults(dir).changed).toEqual({});
    writeFileSync(join(dir, 'changed.json'), JSON.stringify({ base: { sha: SHA, ref: 'main' } }));
    const results = readResults(dir);
    rmSync(dir, { recursive: true, force: true });
    expect(Object.keys(results.files)).toEqual(['parse']);
    expect(results.changed.base.ref).toBe('main');
  });

  it('reads the runner record in run.json apart from the measurements and defaults it to {} when absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bench-results-'));
    writeFileSync(join(dir, 'parse.json'), JSON.stringify({ benchmarks: pair('parse10k', [-1, 1]) }));
    expect(readResults(dir).run).toEqual({});
    writeFileSync(join(dir, 'run.json'), JSON.stringify({ ops: { parse: ['parse10k'] }, answers: {}, bytes: null }));
    const results = readResults(dir);
    rmSync(dir, { recursive: true, force: true });
    expect(Object.keys(results.files)).toEqual(['parse']);
    expect(results.run.ops).toEqual({ parse: ['parse10k'] });
  });

  it('reads the resolution floor from the percent entry of autoSampleConditions', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bench-'));
    writeFileSync(
      join(dir, 'tachometer.json'),
      JSON.stringify({ sampleSize: 50, timeout: 3, autoSampleConditions: ['2%'] }),
    );
    expect(readSampling(dir)).toEqual(sampling);
    rmSync(dir, { recursive: true, force: true });
  });

  it('indexes each exported op by file with its line and the purpose comment above it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bench-'));
    writeFileSync(
      join(dir, 'parse.js'),
      [
        `import { date } from 'native-dates';`,
        '',
        '// purpose: reads 10,000 ISO date strings',
        'export function parse10k() {}',
        '',
        'export async function parseZoned5k() {}',
        'function notAnOp() {}',
        'export const checks = {};',
      ].join('\n'),
    );
    writeFileSync(join(dir, 'tachometer.json'), '{}');
    const ops = readOps(dir);
    rmSync(dir, { recursive: true, force: true });
    expect(ops).toEqual({
      'parse parse10k': { path: 'bench/parse.js', line: 4, purpose: 'reads 10,000 ISO date strings' },
      'parse parseZoned5k': { path: 'bench/parse.js', line: 6, purpose: null },
    });
  });
});

describe('buildReport() op status', () => {
  it('calls an op faster or slower only when its whole interval clears the floor', () => {
    const statusOf = (interval) => build({ 'parse parse10k': pair('parse10k', interval) }).rows[0].status;
    expect(statusOf([-9, -3])).toBe('faster');
    expect(statusOf([3, 9])).toBe('slower');
    expect(statusOf([-1.5, 1.5])).toBe('unchanged');
    expect(statusOf([-1, 9])).not.toBe('slower');
    expect(statusOf([-9, 1])).not.toBe('faster');
  });

  it('splits an interval that crosses the floor by whether runner jitter alone is as wide as the floor', () => {
    // 2 ms of jitter on a 4 ms op expects about ±20%, and on a 100 ms op about ±0.8%
    const short = build({ 'parse once': pair('once', [-12, 14], { meanMs: 4 }) }).rows[0];
    expect(short.status).toBe('too fast');
    expect(short.expected).toBeGreaterThan(10);
    const long = build({ 'parse parse20k': pair('parse20k', [-1, 5], { meanMs: 100 }) }).rows[0];
    expect(long.status).toBe('inconclusive');
    expect(long.expected).toBeLessThan(1);
  });

  it('calls a long op with a wide interval inconclusive however noisy its own samples are', () => {
    const noisy = Array.from({ length: 50 }, (_, index) => 200 + (index % 2 ? 20 : -20));
    const row = build({ 'parse parse40k': pair('parse40k', [-6, 9], { meanMs: 200, samples: noisy }) }).rows[0];
    expect(row.spreadMs).toBeGreaterThan(19);
    expect(row.status).toBe('inconclusive');
  });

  it('estimates expected noise from an op own samples once it has at least 20', () => {
    const few = build({ 'parse parse10k': pair('parse10k', [-1, 5], { samples: steady(50).slice(0, 10) }) }).rows[0];
    expect(few.spreadMs).toBe(2);
    const many = build({ 'parse parse10k': pair('parse10k', [-1, 5], { samples: steady(50) }) }).rows[0];
    expect(many.spreadMs).toBeCloseTo(1.01, 2);
    expect(many.samples).toBe(50);
  });

  it('drops an op measured on one side only and throws when no op was measured on both', () => {
    const [head] = pair('parse10k', [3, 9]);
    const report = build({ 'parse parse10k': pair('parse10k', [3, 9]), 'format format5k': [head] });
    expect(report.rows.map((row) => row.op)).toEqual(['parse10k']);
    expect(() => build({ 'format format5k': [head] })).toThrow(/this-change and tip-of-tree/);
  });
});

describe('buildReport() state', () => {
  const states = {
    improvement: { 'parse parse10k': pair('parse10k', [-9, -3]) },
    regression: { 'parse parse10k': pair('parse10k', [3, 9]) },
    mixed: { 'parse parse10k': pair('parse10k', [-9, -3]), 'format format5k': pair('format5k', [3, 9]) },
    unchanged: { 'parse parse10k': pair('parse10k', [-1, 1]), 'format once': pair('once', [-12, 14], { meanMs: 4 }) },
  };

  it('names improvement, regression, mixed, and no meaningful change from the confident ops alone', () => {
    expect(Object.entries(states).map(([state, ops]) => build(ops).state === state)).toEqual([true, true, true, true]);
    expect(build(states.regression).title).toBe('❌ Regression on Bench');
    expect(build(states.unchanged).title).toBe('⚪ No meaningful change on Bench');
  });

  it('names a faster run a trade when the change ships more bytes and an improvement when it does not', () => {
    const stateWith = (bytes) =>
      buildReport({ measurements: measured(states.improvement, {}, { bytes }), sampling }).state;
    expect(stateWith({ head: 14_120, base: 14_063 })).toBe('trade');
    expect(stateWith({ head: 14_063, base: 14_063 })).toBe('improvement');
    expect(stateWith({ head: 14_000, base: 14_063 })).toBe('improvement');
    expect(stateWith(null)).toBe('improvement');
    const slower = buildReport({
      measurements: measured(states.regression, {}, { bytes: { head: 14_120, base: 14_063 } }),
      sampling,
    });
    expect(slower.state).toBe('regression');
  });

  it('reports an op the runner left untimed for a changed answer ahead of any timing', () => {
    const report = buildReport({
      measurements: measured(states.improvement, {}, {
        ops: { parse: ['parse10k'], format: ['format5k'] },
        answers: { format: ['format5k'] },
      }),
      sampling,
    });
    expect(report.state).toBe('changed');
    expect(report.title).toBe('✏️ Answer changed on Bench');
    expect(report.answers.map(({ file, op }) => `${file} ${op}`)).toEqual(['format format5k']);
    expect(report.missing).toEqual([]);
    expect(report.summary).toMatchObject({ faster: 1, changed: 1, missing: 0 });
  });

  it('reports a planned op with no result as missing and the run as incomplete', () => {
    const report = buildReport({
      measurements: measured(states.improvement, {}, {
        ops: { parse: ['parse10k'], records: ['openTable1k', 'sortByDue1k'] },
        answers: { records: ['sortByDue1k'] },
      }),
      sampling,
    });
    expect(report.state).toBe('incomplete');
    expect(report.title).toBe('⚠️ Incomplete run on Bench');
    expect(report.missing.map(({ file, op }) => `${file} ${op}`)).toEqual(['records openTable1k']);
  });

  it('reports every planned op as missing instead of throwing when no file produced a result', () => {
    const report = buildReport({
      measurements: measured({}, {}, { ops: { parse: ['parse10k'], format: ['format5k'] } }),
      sampling,
    });
    expect(report.rows).toEqual([]);
    expect(report.state).toBe('incomplete');
    expect(report.summary.missing).toBe(2);
  });

  it('takes the base commit from changed.json and the head commit from the caller', () => {
    const report = buildReport({
      measurements: measured(states.improvement, { base: { sha: SHA, ref: 'main' }, head: { sha: 'b'.repeat(40) } }),
      sampling,
      head: { sha: 'c'.repeat(40), msg: 'Perf: Faster Parsing', pr: 70 },
    });
    expect(report.base).toEqual({ sha: SHA, ref: 'main' });
    expect(report.head).toMatchObject({ sha: 'c'.repeat(40), pr: 70 });
  });
});

describe('renderComment()', () => {
  const ops = { 'parse parse10k': { path: 'bench/parse.js', line: 9, purpose: 'reads 10,000 ISO date strings' } };
  const mixed = {
    'parse parse10k': pair('parse10k', [-9, -3]),
    'format format5k': pair('format5k', [36.9, 43.3], { meanMs: 12 }),
    'range every2k': pair('every2k', [-1, 1]),
    'time once': pair('once', [-12, 14], { meanMs: 4 }),
  };

  it('leads with the state and counts, then lists faster and slower ops with change and interval', () => {
    const markdown = renderComment(build(mixed, { ops }));
    expect(markdown.split('\n').slice(0, 3)).toEqual([
      '### 🟡 Mixed on Bench',
      '',
      '✅ 1 faster · ❌ 1 slower · 🔍 1 unsure · ⚪ 1 no change',
    ]);
    expect(markdown).toContain('#### ✅ Faster (1)');
    expect(markdown).toContain('| -6% (3.0 ms) | -9.0% to -3.0% |');
    expect(markdown).toContain('#### ❌ Slower (1)');
    expect(markdown).toContain('| `format · format5k` | +40% (4.8 ms) | +36.9% to +43.3% |');
  });

  it('collapses unchanged and unsure ops and shows time and expected noise beside an unsure interval', () => {
    const markdown = renderComment(build(mixed, { ops }));
    expect(markdown).toContain('<summary>⚪ No change (1)</summary>');
    expect(markdown).toContain('<summary>🔍 Unsure (1)</summary>');
    expect(markdown).toContain('#### Too fast to measure precisely (1)');
    expect(markdown).toContain('| `time · once` | -12.0% to +14.0% | 4 ms | ±19.6% |');
    expect(markdown).not.toContain('#### Inconclusive');
  });

  it('shows the time of an unchanged op beside its interval', () => {
    const markdown = renderComment(build(mixed, { ops }));
    expect(markdown).toContain('| Op | Interval | Time |');
    expect(markdown).toContain('| `range · every2k` | -1.0% to +1.0% | 50 ms |');
  });

  it('lists missing and changed-answer ops with their counts and omits both when there are none', () => {
    const report = buildReport({
      measurements: measured(mixed, {}, {
        ops: { parse: ['parse10k'], records: ['openTable1k'], format: ['format5k', 'tokens1k'] },
        answers: { format: ['tokens1k'] },
      }),
      sampling,
      ops,
      repo: REPO,
      sourceSha: SHA,
    });
    const markdown = renderComment(report);
    expect(markdown.split('\n')[2]).toBe(
      '✅ 1 faster · ❌ 1 slower · 🔍 1 unsure · ⚪ 1 no change · ✏️ 1 answer changed · ⚠️ 1 not measured',
    );
    expect(markdown).toContain('#### ⚠️ Not measured (1)');
    expect(markdown).toContain('- `records · openTable1k`');
    expect(markdown).toContain('#### ✏️ Answer changed (1)');
    expect(markdown).toContain('- `format · tokens1k`');
    expect(markdown.indexOf('Not measured')).toBeLessThan(markdown.indexOf('#### ✅ Faster'));
    const plain = renderComment(build(mixed, { ops }));
    expect(plain).not.toMatch(/Not measured|Answer changed/);
  });

  it('keeps record names that are not identifiers out of the comment', () => {
    const report = buildReport({
      measurements: measured(mixed, {}, {
        ops: { parse: ['parse10k', '<img src=x>'], '[x](y)': ['op'] },
        answers: { format: ['](javascript:x)'], parse: 'parse10k' },
      }),
      sampling,
    });
    expect(report.missing).toEqual([]);
    expect(report.answers).toEqual([]);
    expect(renderComment(report)).not.toMatch(/<img|\[x\]|javascript/);
  });

  it('states the bytes the change ships against the base when the runner measured them', () => {
    const withBytes = (bytes) => renderComment(buildReport({ measurements: measured(mixed, {}, { bytes }), sampling }));
    expect(withBytes({ head: 14_120, base: 14_063 })).toContain(
      '`native-dates (full)` ships 14,120 B, 57 B more than the base',
    );
    expect(withBytes({ head: 14_000, base: 14_063 })).toContain('ships 14,000 B, 63 B less than the base');
    expect(withBytes({ head: 14_063, base: 14_063 })).toContain('ships 14,063 B, the same as the base');
    expect(withBytes({ head: '<b>', base: 14_063 })).not.toContain('native-dates (full)');
    expect(renderComment(build(mixed))).not.toContain('native-dates (full)');
  });

  it('names the commit the report is about ahead of the base commit', () => {
    const markdown = renderComment(buildReport({
      measurements: measured(mixed, { base: { sha: SHA, ref: 'main' } }),
      sampling,
      head: { sha: 'c'.repeat(40) },
      repo: REPO,
    }));
    expect(markdown).toContain(
      `this change at [\`ccccccc\`](https://github.com/${REPO}/commit/${'c'.repeat(40)}) · base main at`,
    );
  });

  it('links an op to its export at the bench source commit and lists its purpose in the glossary', () => {
    const markdown = renderComment(build(mixed, { ops }));
    const link = `[\`parse · parse10k\`](https://github.com/${REPO}/blob/${SHA}/bench/parse.js#L9)`;
    expect(markdown).toContain(`| ${link} | -6% (3.0 ms) |`);
    expect(markdown).toContain('<summary>📖 What each op measures (1)</summary>');
    expect(markdown).toContain(`| ${link} | Reads 10,000 ISO date strings |`);
    expect(renderComment(build(mixed, { ops, sourceSha: '' }))).not.toContain('/blob/');
  });

  it('sorts confident ops by the size of the change', () => {
    const markdown = renderComment(build({
      'parse parse10k': pair('parse10k', [3, 5]),
      'format format5k': pair('format5k', [30, 40]),
      'range every2k': pair('every2k', [10, 12]),
    }));
    const order = ['format5k', 'every2k', 'parse10k'].map((op) => markdown.indexOf(op));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('keeps file and op names that are not identifiers out of the comment', () => {
    const report = build({
      'parse parse10k': pair('parse10k', [3, 9]),
      'format <img>': pair('<img src=x>', [3, 9]),
      '[x](y) op': pair('op', [3, 9]),
    });
    expect(report.rows.map((row) => row.op)).toEqual(['parse10k']);
    expect(renderComment(report)).not.toMatch(/<img|\[x\]/);
  });

  it('escapes the base ref and purpose text and links the base commit only when it is a sha', () => {
    const escaped = renderComment(buildReport({
      measurements: measured({ 'parse parse10k': pair('parse10k', [3, 9]) }, {
        base: { sha: '](javascript:x)', ref: '<b>main|x' },
      }),
      sampling,
      ops: { 'parse parse10k': { path: 'bench/parse.js', line: 9, purpose: 'reads <script> | dates' } },
      repo: REPO,
      sourceSha: SHA,
    }));
    expect(escaped).toContain('base &lt;b&gt;main\\|x at `](javas`');
    expect(escaped).toContain('Reads &lt;script&gt; \\| dates');
    const linked = renderComment(buildReport({
      measurements: measured({ 'parse parse10k': pair('parse10k', [3, 9]) }, { base: { sha: SHA, ref: 'main' } }),
      sampling,
      repo: REPO,
    }));
    expect(linked).toContain(`base main at [\`aaaaaaa\`](https://github.com/${REPO}/commit/${SHA})`);
  });
});

describe('writeReport()', () => {
  it('writes comment.md and bench-report.json with every row and its status', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bench-report-'));
    const report = build({ 'parse parse10k': pair('parse10k', [3, 9]) });
    writeReport(report, dir);
    const written = JSON.parse(readFileSync(join(dir, 'bench-report.json'), 'utf8'));
    const comment = readFileSync(join(dir, 'comment.md'), 'utf8');
    rmSync(dir, { recursive: true, force: true });
    expect(written.rows[0]).toMatchObject({ file: 'parse', op: 'parse10k', status: 'slower', change: [3, 9] });
    expect(comment).toBe(renderComment(report));
  });
});
