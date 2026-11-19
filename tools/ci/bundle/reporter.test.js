import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildReport, readResults, renderComment, renderSummary, writeReport } from './reporter.js';

// captured from main at c9bccab plus one CalendarDate getter, with budget thresholds 50/100/250/500
const fixture = resolve(import.meta.dirname, 'fixtures/core-grew');
const CORE = 'native-dates (full)';
const ZONES = 'plugins/zones';
const FENCE = '```';

const loadFixture = () => readResults(fixture);
const unchanged = (files = []) => {
  const { base, changed } = readResults(fixture);
  return { head: structuredClone(base), base, changed: { ...changed, files } };
};
const build = (measurements, { msg = 'Feat: A feature', ...rest } = {}) =>
  buildReport({
    measurements,
    head: { sha: measurements.changed.head?.sha ?? '2'.repeat(40), ref: 'branch', msg, pr: 28 },
    repo: 'Semantic-Org/Native-Dates',
    ...rest,
  });

const editRow = (measurements, side, label, edit) => ({
  ...measurements,
  [side]: {
    ...measurements[side],
    rows: measurements[side].rows.map((row) => (row.label === label ? edit(row) : row)),
  },
});
const moveRow = (measurements, label, { br = 0, min = br * 3, side = 'head' }) =>
  editRow(measurements, side, label, (row) => ({
    ...row,
    sizes: { min: row.sizes.min + min, gz: row.sizes.gz, br: row.sizes.br + br },
  }));
// keep ceiling.headline and ceiling.distance in sync when shifting core's brotli size
const growCoreBy = (br, measurements = unchanged(['src/time.js'])) => {
  const next = moveRow(measurements, CORE, { br });
  const { limit, headline } = next.head.ceiling;
  const weight = headline + br;
  return {
    ...next,
    head: { ...next.head, ceiling: { limit, headline: weight, distance: limit - weight, ok: weight <= limit } },
  };
};
const failRow = (measurements, side, label, error) =>
  editRow(measurements, side, label, ({ sizes, inputs, ...row }) => ({ ...row, error }));
const withHead = (measurements, fields) => ({ ...measurements, head: { ...measurements.head, ...fields } });
const withBase = (measurements, fields) => ({ ...measurements, base: { ...measurements.base, ...fields } });

const verdictHeading = (markdown) => markdown.split('\n')[2];
const verdictLine = (markdown) => markdown.split('\n')[4];
const verdictBody = (markdown) => markdown.split('\n\n### Packages Changed')[0].split('\n\n').slice(2).join('\n\n');
const changedTableRows = (markdown) =>
  markdown.split('### Packages Changed\n')[1].split('\n\n')[0].split('\n').slice(2).join('\n');
const verdictForDelta = (br, msg = 'A change with no prefix') => {
  const markdown = renderComment(build(growCoreBy(br), { msg }));
  return [verdictHeading(markdown), verdictLine(markdown)];
};

describe('readResults()', () => {
  it('reads head.json, base.json, and changed.json, defaulting changed to {} when absent', () => {
    const full = readResults(fixture);
    expect(full.changed.files).toEqual(['src/calendar-date.js', 'test/calendar-date.test.js']);

    const dir = mkdtempSync(join(tmpdir(), 'size-results-'));
    cpSync(join(fixture, 'head.json'), join(dir, 'head.json'));
    cpSync(join(fixture, 'base.json'), join(dir, 'base.json'));
    const local = readResults(dir);
    rmSync(dir, { recursive: true, force: true });
    expect(local.changed).toEqual({});
    expect(build(local).post).toBe(true);
  });
});

describe('renderComment() and renderSummary()', () => {
  it('renders the core-grew fixture comment and summary byte for byte', () => {
    const report = build(loadFixture(), { msg: 'Feat: Add isLeapDay to a date' });
    expect(report.state).toBe('bug sized');
    expect(report.post).toBe(true);
    expect(renderComment(report)).toBe(readFileSync(join(fixture, 'comment.md'), 'utf8'));
    expect(renderSummary(report)).toBe(renderComment(report));
  });

  it('lists core and changed plugins under Packages Changed and every value row under All bundles', () => {
    const markdown = renderComment(build(loadFixture()));
    expect(changedTableRows(markdown)).toBe(`| ${CORE} | 14,077 B | +53 B | +14 B 🔵 |`);
    expect(markdown).toContain('| `src/calendar-date.js` | +53 B |');
    expect(markdown).toContain('<summary>All bundles (6)</summary>');
    expect(markdown).toContain('| import { now } | 48,964 B | 13,732 B | 12,553 B | +24 B 🔵 |');
    expect(markdown).toContain('\nDev prose folded out: 3,003 B\n');
    expect(markdown).not.toContain('dev-mode overhead');
  });

  it('treats a plugin with a brotli delta on unchanged minified bytes as unchanged', () => {
    // plugin brotli is a difference of two compressions, so it shifts when core changes beside it
    const report = build(loadFixture());
    const zones = report.rows.find((row) => row.label === ZONES);
    expect(zones.delta).toEqual({ min: 0, gz: -3, br: 36 });
    expect(zones.status).toBe('unchanged');
    expect(changedTableRows(renderComment(report))).not.toContain(ZONES);
    expect(renderComment(report)).toContain(`| ${ZONES} | 1,893 B | 789 B | 734 B | +36 B 🔵 |`);
  });

  it('quotes the first Expected bytes: line from the PR body verbatim without parsing it', () => {
    const body =
      'A getter.\n\n  Expected bytes: about 15, the [getter](x)  \n\nExpected bytes: a second line is not read\n';
    const report = build(loadFixture(), { body });
    expect(report.expected).toBe('Expected bytes: about 15, the [getter](x)');
    expect(renderComment(report)).toContain('+14 B 🔵 |\n\nExpected bytes: about 15, the \\[getter\\](x)\n\n<details>');
    expect(report.sentence).toBe(
      '`native-dates (full)` grew **+14 B** brotli to 14,077 B, against "Expected bytes: about 15, the \\[getter\\](x)".',
    );
    expect(build(loadFixture()).expected).toBe(null);
  });
});

describe('buildReport() size bands and title prefixes', () => {
  it('classifies core brotli deltas across shrank, unchanged, and each growth band', () => {
    expect(verdictForDelta(-12)).toEqual([
      '### 🟢 Core Shrank −12 Bytes Brotli',
      'PRs that remove bytes are typical for trims and sweeps.',
    ]);
    expect(verdictForDelta(0)).toEqual([
      '### 🟢 Core Unchanged',
      'PRs that leave core unchanged are typical for plugin, test and tooling work.',
    ]);
    expect(verdictForDelta(1)).toEqual([
      '### 🔵 Core Grew +1 Bytes Brotli (Bug Sized)',
      'PRs between 0-50 bytes are typical for bug fixes.',
    ]);
    expect(verdictForDelta(50)[0]).toBe('### 🔵 Core Grew +50 Bytes Brotli (Bug Sized)');
    expect(verdictForDelta(51)).toEqual([
      '### 🟡 Core Grew +51 Bytes Brotli (Small Feature Sized)',
      'PRs between 50-100 bytes are typical for small features and new options.',
    ]);
    expect(verdictForDelta(100)[0]).toBe('### 🟡 Core Grew +100 Bytes Brotli (Small Feature Sized)');
    expect(verdictForDelta(101)).toEqual([
      '### 🟠 Core Grew +101 Bytes Brotli (Feature Sized)',
      'PRs between 100-250 bytes are typical for new plugins with seams in core.',
    ]);
    expect(verdictForDelta(251)).toEqual([
      '### 🔴 Core Grew +251 Bytes Brotli (Large Feature Sized)',
      'PRs between 250-500 bytes are typical for large core features, or plugins with significant core seams.',
    ]);
    expect(verdictForDelta(500)[0]).toBe('### 🔴 Core Grew +500 Bytes Brotli (Large Feature Sized)');
  });

  it('computes band ranges from measurement.sizes and throws when an edge is missing', () => {
    const sizes = { 'bug sized': 10, 'small feature sized': 20, 'feature sized': 40, 'large feature sized': 80 };
    const markdown = renderComment(build(withHead(growCoreBy(15), { sizes }), { msg: 'A change with no prefix' }));
    expect(verdictHeading(markdown)).toBe('### 🟡 Core Grew +15 Bytes Brotli (Small Feature Sized)');
    expect(verdictLine(markdown)).toBe('PRs between 10-20 bytes are typical for small features and new options.');
    expect(() => build(withHead(growCoreBy(15), { sizes: { 'bug sized': 10 } }))).toThrow(
      /no edge for 'small feature sized'/,
    );
  });

  it('replaces the band description when a PR title prefix expects a smaller change', () => {
    expect(verdictForDelta(60, 'Refactor: A move')).toEqual([
      '### 🟡 Core Grew +60 Bytes Brotli (Small Feature Sized)',
      'This PR is above the size expected for a refactor (0-50 bytes).',
    ]);
    expect(verdictForDelta(60, 'Perf: A win')[1]).toBe(
      'This PR is above the size expected for a performance change (0-50 bytes).',
    );
    expect(verdictForDelta(12, 'Build: A workflow')[1]).toBe(
      'This PR is above the size expected for a build change (0 bytes).',
    );
    expect(verdictForDelta(12, 'Bug(zones): A fix')[1]).toBe('PRs between 0-50 bytes are typical for bug fixes.');
    expect(verdictForDelta(300, 'A title with no prefix')[1]).toMatch(/^PRs between 250-500 bytes/);
    expect(verdictForDelta(60, 'Feat/Bug: Both')[1]).toMatch(/^PRs between 50-100 bytes/);
    expect(verdictForDelta(0, 'Docs: A page')[1]).toMatch(/^PRs that leave core unchanged/);
    expect(build(growCoreBy(0), { msg: 'Feat/Bug: Both' }).kind).toBe('Feat/Bug');
    expect(build(growCoreBy(0), { msg: 'no prefix' }).kind).toBe(null);
  });

  it('notes that features belong in plugins when a Feat PR grows core past bug size', () => {
    expect(verdictForDelta(70, 'Feat: Name formats in configure')).toEqual([
      '### 🟡 Core Grew +70 Bytes Brotli (Small Feature Sized)',
      'Features are generally implemented as plugins.',
    ]);
    expect(verdictForDelta(320, 'Feat(core): A locale on every value')[1]).toBe(
      'Features are generally implemented as plugins.',
    );
    expect(verdictForDelta(50, 'Feat: A second spelling')[1]).toBe('PRs between 0-50 bytes are typical for bug fixes.');
    expect(verdictForDelta(0, 'Feat: A plugin')[1]).toMatch(/^PRs that leave core unchanged/);
    const priced = renderComment(
      build(growCoreBy(70), { msg: 'Feat: Name formats', body: 'Expected bytes: about 70' }),
    );
    expect(verdictLine(priced)).toBe('Features are generally implemented as plugins.');
    expect(priced).toContain('+70 B 🟡 |\n\nExpected bytes: about 70\n\n<details>');
  });

  it('keeps the Core Unchanged title when only a plugin changes', () => {
    const report = build(moveRow(unchanged(['packages/plugins/src/zones.js']), ZONES, { br: 38, min: 65 }));
    const markdown = renderComment(report);
    expect(verdictHeading(markdown)).toBe('### 🟢 Core Unchanged');
    expect(changedTableRows(markdown)).toBe(`| ${ZONES} | 736 B | +65 B | +38 B 🔵 |`);
    expect(report.sentence).toBe(
      '`plugins/zones` grew **+38 B** brotli to 736 B, against an expected cost of about 0.',
    );
  });

  it('marks a plugin present on only one side as added or removed', () => {
    const { head, base, changed } = unchanged(['packages/plugins/src/zones.js']);
    const without = (side) => ({ ...side, rows: side.rows.filter((row) => row.label !== ZONES) });
    const added = renderComment(build({ head, base: without(base), changed }));
    expect(changedTableRows(added)).toBe(`| ${ZONES}, added | 698 B | +1,893 B | +698 B 🔴 |`);
    const removed = renderComment(build({ head: without(head), base, changed }));
    expect(verdictHeading(removed)).toBe('### 🟢 Core Unchanged');
    expect(changedTableRows(removed)).toBe(`| ${ZONES}, removed | 698 B | −1,893 B | −698 B 🟢 |`);
  });
});

describe('buildReport() failing checks', () => {
  const BUG_LINE =
    'Bug fixes aim for 0 bytes and fail this check at 50 bytes. A fix is usually one or two lines, and a larger one is for a severe bug.';

  it('fails a Bug PR when core grows at or above the bug-fix byte limit', () => {
    for (const msg of ['Bug: A fix', 'Bug(zones): A fix']) {
      const report = build(growCoreBy(50), { msg });
      expect(report.state).toBe('red');
      expect(report.reason).toBe('over the bug fix limit');
      expect(report.band.name).toBe('bug sized');
      const markdown = renderComment(report);
      expect(verdictHeading(markdown)).toBe('### ⛔ Core Grew +50 Bytes Brotli (Over the Bug Fix Limit)');
      expect(verdictBody(markdown)).toBe(BUG_LINE);
      expect(report.sentence).toBe(`Core Grew +50 Bytes Brotli (Over the Bug Fix Limit). ${BUG_LINE}`);
    }
    expect(build(growCoreBy(49), { msg: 'Bug: A fix' }).state).toBe('bug sized');
    for (const msg of ['Feat: A feature', 'Feat/Bug: Both', 'bug: a fix', 'Refactor: A move']) {
      expect(build(growCoreBy(50), { msg }).reason).toBe(null);
    }
  });

  it('fails any PR when core grows past the maximum per-PR byte limit', () => {
    const report = build(growCoreBy(501));
    expect(report.reason).toBe('over the PR limit');
    const markdown = renderComment(report);
    expect(verdictHeading(markdown)).toBe('### ⛔ Core Grew +501 Bytes Brotli (Over the PR Limit)');
    expect(verdictBody(markdown)).toBe('This PR is larger than 500 bytes which is above the maximum size.');
    expect(changedTableRows(markdown)).toBe(`| ${CORE} | 14,564 B | +1,503 B | +501 B ⛔ |`);
    expect(build(growCoreBy(500)).reason).toBe(null);
    // the per-PR byte limit applies only to core, so a plugin past 500 B stays green under Core Unchanged
    const plugin = renderComment(build(moveRow(unchanged(), ZONES, { br: 600 })));
    expect(verdictHeading(plugin)).toBe('### 🟢 Core Unchanged');
    expect(changedTableRows(plugin)).toBe(`| ${ZONES} | 1,298 B | +1,800 B | +600 B 🔴 |`);
  });

  it('fails when core exceeds the ceiling and notes when base already exceeds it', () => {
    const report = build(growCoreBy(1047), { msg: 'Bug: A fix' });
    expect(report.reason).toBe('over the ceiling');
    const markdown = renderComment(report);
    expect(verdictHeading(markdown)).toBe('### ⛔ Core Is 110 Bytes Over the Ceiling');
    expect(verdictBody(markdown)).toBe(
      `This PR pushes core above the maximum size (15kb)\n\nThis PR is larger than 500 bytes which is above the maximum size.\n\n${BUG_LINE}`,
    );
    expect(report.summary.ceiling).toBe('110 B over the 15 kB (15,000 B) ceiling');

    const overAlready = growCoreBy(20);
    const lowered = (side) => ({
      ...side,
      ceiling: { ...side.ceiling, limit: 14000, distance: 14000 - side.ceiling.headline, ok: false },
    });
    const both = build({ ...overAlready, head: lowered(overAlready.head), base: lowered(overAlready.base) });
    expect(both.body).toBe(
      'This PR pushes core above the maximum size (14kb)\n\nMain is already 63 bytes over, and this PR adds 20 more.',
    );
  });

  it('fails when development messages ship in production or when the strip check cannot run', () => {
    const strip = { present: true, folded: false, ok: false };
    const shipped = build(withHead(unchanged(['src/helpers/environment.js']), { strip }));
    expect(shipped.reason).toBe('dev messages ship');
    expect(verdictHeading(renderComment(shipped))).toBe('### ⛔ Core Ships Dev Messages');
    expect(shipped.body).toBe(
      'This PR does not properly remove all of its development messages from the production build.',
    );
    const inherited = build(withBase(withHead(unchanged(), { strip }), { strip }));
    expect(inherited.body).toMatch(/production build\.\n\nMain does not remove them either\.$/);

    const blind = build(withHead(unchanged(), { strip: { present: false, folded: true, ok: false } }));
    expect(blind.reason).toBe('strip check cannot run');
    expect(verdictHeading(renderComment(blind))).toBe('### ⛔ Strip Check Cannot Run');
  });

  it('fails when production prose leaks outside the allowlist and links each source line', () => {
    const leak = (text) => ({ text, at: 'src/time.js:87:22', bundles: [CORE] });
    const prose = (leaked) => ({ prose: { ok: false, survivors: leaked, leaked, stale: [], skipped: [] } });
    const link = `[\`src/time.js:87:22\`](https://github.com/Semantic-Org/Native-Dates/blob/${
      '2'.repeat(40)
    }/src/time.js#L87)`;
    const report = build(withHead(unchanged(), prose([leak('a time value is required')])));
    expect(report.reason).toBe('prose outside the allowlist');
    expect(report.post).toBe(true);
    const markdown = renderComment(report);
    expect(verdictHeading(markdown)).toBe('### ⛔ Core Ships Prose Outside the Allowlist');
    expect(verdictBody(markdown)).toBe(
      `This PR ships prose in the production bundle\n\n- "a time value is required" ${link}`,
    );
    const partly = build(
      withBase(
        withHead(unchanged(), prose([leak('an old sentence'), leak('a new sentence')])),
        prose([leak('an old sentence')]),
      ),
    );
    expect(partly.body).toBe(
      `This PR ships prose in the production bundle\n\n- "an old sentence" ${link} (on main too)\n- "a new sentence" ${link}`,
    );
    const unlinked = build(withHead(unchanged(), prose([leak('a time value is required')])), { repo: '' });
    expect(unlinked.body).toMatch(/- "a time value is required" `src\/time\.js:87:22`$/);
  });

  it('fails with the root failing bundle when head or base fails to build', () => {
    const error = 'packages/plugins/src/zones.js:3: Could not resolve "./table.js"';
    const plugin = build(failRow(loadFixture(), 'head', ZONES, error));
    expect(plugin.reason).toBe('did not build');
    let markdown = renderComment(plugin);
    expect(verdictHeading(markdown)).toBe('### ⛔ plugins/zones Did Not Build');
    expect(verdictBody(markdown)).toBe(
      `There is an error preventing this PR from building in packages/plugins/src/zones.js:3:\n${FENCE}\nCould not resolve "./table.js"\n${FENCE}`,
    );
    expect(changedTableRows(markdown)).toBe(
      `| ${CORE} | 14,077 B | +53 B | +14 B 🔵 |\n| ${ZONES}, did not build | — | — | — |`,
    );
    expect(markdown).toContain(`| ${ZONES}, did not build | — | — | — | — |`);
    // core + all plugins fails whenever any plugin fails, so report only the broken plugin
    const total = build(failRow(failRow(loadFixture(), 'head', ZONES, error), 'head', 'core + all plugins', error));
    expect(total.title).toBe('⛔ plugins/zones Did Not Build');
    expect(total.body).toBe(plugin.body);
    expect(build(failRow(loadFixture(), 'head', 'import { now }', 'No matching export')).title).toBe(
      '⛔ import { now } Did Not Build',
    );

    // rows weighed beside core fail whenever core fails, so report Core alone
    const dependents = loadFixture().head.rows
      .filter((row) => row.beside || row.part === 'overhead')
      .map((row) => row.label);
    const core = dependents.reduce(
      (measurements, label) => failRow(measurements, 'head', label, `${CORE} did not build`),
      failRow(loadFixture(), 'head', CORE, 'SyntaxError: Unexpected token'),
    );
    const headline = build(
      withHead(core, {
        ceiling: { limit: 15000, headline: null, distance: null, ok: false },
        strip: { present: false, folded: false, ok: false, error: `${CORE} did not build` },
      }),
    );
    expect(headline.band).toBe(null);
    markdown = renderComment(headline);
    expect(verdictHeading(markdown)).toBe('### ⛔ Core Did Not Build');
    expect(verdictBody(markdown)).toBe(
      `There is an error preventing this PR from building:\n${FENCE}\nSyntaxError: Unexpected token\n${FENCE}`,
    );
    expect(markdown).toContain('\nDev prose folded out: did not build\n');
    expect(headline.summary.ceiling).toBe('`native-dates (full)` did not build');

    const base = build(failRow(unchanged(), 'base', ZONES, 'Could not resolve "native-dates/helpers/zones"'));
    expect(base.reason).toBe('base did not build');
    markdown = renderComment(base);
    expect(verdictHeading(markdown)).toBe('### ⛔ Base Did Not Build');
    expect(verdictBody(markdown)).toBe(
      `There is an error preventing main from building, preventing comparisons.\n\n\`plugins/zones\` stopped at:\n${FENCE}\nCould not resolve "native-dates/helpers/zones"\n${FENCE}`,
    );
    expect(changedTableRows(markdown)).toBe(`| ${ZONES}, base did not build | 698 B | — | — |`);
  });
});

describe('buildReport() posting rules and writeReport()', () => {
  it('skips posting when no bundle input changed and all byte counts match base', () => {
    const tooling = build(unchanged(['tools/ci/bundle/README.md', 'docs/astro.config.mjs']));
    expect(tooling.post).toBe(false);
    expect(renderSummary(tooling)).toMatch(
      /^## Bundle Size\n\n### 🟢 Core Unchanged\n\nPRs that leave core unchanged are typical for plugin, test and tooling work\.\n\n\*\*No comment posted\.\*\* This PR touches no file under `src\/` or `packages\/`, and every bundle measures the same bytes as main in minified, gzip and brotli\.\n\n<details>\n<summary>All bundles \(6\)<\/summary>/,
    );
    expect(renderSummary(tooling)).not.toContain('Packages Changed');
    const tests = build(unchanged(['packages/plugins/test/zones.test.js', 'test/time.test.js']));
    expect(tests.sentence).toMatch(
      /^None of the 2 files this PR touches is in a bundle, and every bundle measures the same bytes/,
    );
  });

  it('posts when a bundle input changed, any byte cell differs, or any check fails', () => {
    const touched = build(unchanged(['src/duration.js', 'test/duration.test.js']));
    expect(touched.post).toBe(true);
    expect(touched.sentence).toBe(
      'No bundle changed in minified bytes, and one of the 2 files this PR touches is in a bundle.',
    );
    expect(renderComment(touched)).toContain(
      '### Packages Changed\nNo bundle changed size. 🎉\n\n<details>\n<summary>All bundles (6)</summary>',
    );
    expect(build(moveRow(unchanged(), 'import { now }', { br: 2, min: 0 })).post).toBe(true);
    expect(build(withHead(unchanged(), { strip: { present: true, folded: false, ok: false } })).post).toBe(true);
  });

  it('writes comment.md only when post is true while always writing summary.md and size-report.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'size-report-'));
    writeReport(build(loadFixture()), join(dir, 'posts'));
    expect(readFileSync(join(dir, 'posts/summary.md'), 'utf8')).toBe(
      readFileSync(join(dir, 'posts/comment.md'), 'utf8'),
    );
    expect(JSON.parse(readFileSync(join(dir, 'posts/size-report.json'), 'utf8')).post).toBe(true);
    writeReport(build(unchanged()), join(dir, 'quiet'));
    expect(existsSync(join(dir, 'quiet/comment.md'))).toBe(false);
    expect(readFileSync(join(dir, 'quiet/summary.md'), 'utf8')).toContain('**No comment posted.**');
    rmSync(dir, { recursive: true, force: true });
  });

  it('adds the measurement-change note when a PR modifies size or workflow configuration', () => {
    const note = 'This PR changes how bundles are measured, so read its numbers against the run after it merges.';
    const changed = build(unchanged(['ai/contributing/budget.md', 'src/time.js']));
    expect(changed.measurementChanged).toEqual(['ai/contributing/budget.md']);
    expect(renderComment(changed)).toContain(`tooling work.\n\n${note}\n\n### Packages Changed\n`);
    expect(renderSummary(build(unchanged(['.github/workflows/bundle-size.yml'])))).toContain(`${note}\n\n<details>`);
    expect(renderComment(build(loadFixture()))).not.toContain(note);
  });
});

describe('renderComment() and renderSummary() markdown escaping', () => {
  it('escapes code fences, HTML, markdown links, and parent-directory paths in error and prose output', () => {
    const error = 'packages/plugins/src/zones.js:3: ```\n<img src=x onerror=alert(1)> [evil](https://x)';
    const markdown = renderComment(build(failRow(loadFixture(), 'head', ZONES, error)));
    expect(verdictBody(markdown)).toBe(
      `There is an error preventing this PR from building in packages/plugins/src/zones.js:3:\n${FENCE}\n \`\` <img src=x onerror=alert(1)> [evil](https://x)\n${FENCE}`,
    );
    const prose = (at) => ({
      prose: {
        ok: false,
        survivors: [],
        leaked: [{ text: '<script>x</script> [evil](https://x) `tick`', at, bundles: [CORE] }],
        stale: [],
        skipped: [],
      },
    });
    const leaked = verdictBody(renderComment(build(withHead(unchanged(), prose('src/ti)me.js:1:1')))));
    expect(leaked).not.toContain('<script>');
    expect(leaked).not.toContain('[evil](https://x)');
    expect(leaked).toMatch(
      /\[`src\/ti\)me\.js:1:1`\]\(https:\/\/github\.com\/Semantic-Org\/Native-Dates\/blob\/2{40}\/src\/ti%29me\.js#L1\)$/,
    );
    // paths traversing outside the repo must stay plain code spans rather than GitHub blob links
    expect(verdictBody(renderComment(build(withHead(unchanged(), prose('../../other/repo.js:1:1')))))).toMatch(
      /`\.\.\/\.\.\/other\/repo\.js:1:1`$/,
    );
  });

  it('escapes pipes, HTML tags, and backticks in bundle labels and base refs', () => {
    const renamed = editRow(
      failRow(unchanged(), 'head', ZONES, 'x'),
      'head',
      ZONES,
      (row) => ({ ...row, label: 'a|b<i>`c`' }),
    );
    const markdown = renderComment(build(renamed));
    expect(markdown).toContain('| a\\|b&lt;i&gt;\\`c\\`, did not build | — | — | — |');
    const hostile = {
      ...unchanged(),
      changed: { head: { sha: 'x' }, base: { sha: '<img>`', ref: '<b>main</b>' }, files: [] },
    };
    expect(renderSummary(build(hostile))).toMatch(
      /<sub>base &lt;b&gt;main&lt;\/b&gt; at `<img>` · `size-report\.json`<\/sub>$/,
    );
  });
});
