import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildReport, readResults, renderComment, renderSummary, writeReport } from '../tools/ci/bundle/reporter.js';

// a real pair: main at c9bccab, and the same tree with one getter added to CalendarDate. its sizes are
// 50, 100, 250 and 500, whatever ai/contributing/budget.md holds today
const fixture = resolve(import.meta.dirname, 'fixtures/bundle-bot/core-grew');
const CORE = 'native-dates (full)';
const ZONES = 'plugins/zones';
const FENCE = '```';

const grown = () => readResults(fixture);
// both sides the base, so nothing has moved until a test moves it
const same = (files = []) => {
  const { base, changed } = readResults(fixture);
  return { head: structuredClone(base), base, changed: { ...changed, files } };
};
const build = (measurements, { msg = 'Feat: A feature', ...rest } = {}) =>
  buildReport({
    measurements,
    head: { sha: measurements.changed.head.sha, ref: 'branch', msg, pr: 28 },
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
// a row's sizes moved by so much on one side
const moved = (measurements, label, { br = 0, min = br * 3, side = 'head' }) =>
  editRow(measurements, side, label, (row) => ({
    ...row,
    sizes: { min: row.sizes.min + min, gz: row.sizes.gz, br: row.sizes.br + br },
  }));
// core's brotli moved by so much, its minified bytes and its distance to the ceiling with it
const coreBy = (br, measurements = same(['src/time.js'])) => {
  const next = moved(measurements, CORE, { br });
  const { limit, headline } = next.head.ceiling;
  const weight = headline + br;
  return {
    ...next,
    head: { ...next.head, ceiling: { limit, headline: weight, distance: limit - weight, ok: weight <= limit } },
  };
};
const broken = (measurements, side, label, error) =>
  editRow(measurements, side, label, ({ sizes, inputs, ...row }) => ({ ...row, error }));
const withHead = (measurements, fields) => ({ ...measurements, head: { ...measurements.head, ...fields } });
const withBase = (measurements, fields) => ({ ...measurements, base: { ...measurements.base, ...fields } });

// the opening, one accessor per line it holds
const title = (markdown) => markdown.split('\n')[2];
const line = (markdown) => markdown.split('\n')[4];
// everything under the title, where a red's error, sentences or note follow its line
const under = (markdown) => markdown.split('\n\n### Packages Changed')[0].split('\n\n').slice(2).join('\n\n');
// the rows under Packages Changed
const changedRows = (markdown) =>
  markdown.split('### Packages Changed\n')[1].split('\n\n')[0].split('\n').slice(2).join('\n');
const opening = (br, msg = 'A change with no prefix') => {
  const markdown = renderComment(build(coreBy(br), { msg }));
  return [title(markdown), line(markdown)];
};

describe('the comment', () => {
  it('renders a real change byte for byte', () => {
    const report = build(grown(), { msg: 'Feat: Add isLeapDay to a date' });
    expect(report.state).toBe('bug sized');
    expect(report.post).toBe(true);
    expect(renderComment(report)).toBe(readFileSync(join(fixture, 'comment.md'), 'utf8'));
    expect(renderSummary(report)).toBe(renderComment(report));
  });

  it('lists core and the plugins whose minified bytes moved, and every row under all bundles', () => {
    const markdown = renderComment(build(grown()));
    expect(changedRows(markdown)).toBe(`| ${CORE} | 14,077 B | +53 B | +14 B 🔵 |`);
    expect(markdown).toContain('| `src/calendar-date.js` | +53 B |');
    expect(markdown).toContain('<summary>All bundles (6)</summary>');
    expect(markdown).toContain('| import { now } | 48,964 B | 13,732 B | 12,553 B | +24 B 🔵 |');
    expect(markdown).toContain('\nDev prose folded out: 3,003 B\n');
    expect(markdown).not.toContain('dev-mode overhead');
  });

  it('reads a row whose brotli moved on unmoved minified bytes as unchanged', () => {
    // a plugin is a difference of two compressions, so its brotli moves when core changes beside it
    const report = build(grown());
    const zones = report.rows.find((row) => row.label === ZONES);
    expect(zones.delta).toEqual({ min: 0, gz: -3, br: 36 });
    expect(zones.status).toBe('unchanged');
    expect(changedRows(renderComment(report))).not.toContain(ZONES);
    expect(renderComment(report)).toContain(`| ${ZONES} | 1,893 B | 789 B | 734 B | +36 B 🔵 |`);
  });

  it('quotes an Expected bytes: line from the PR body under the table, found and never parsed', () => {
    const body =
      'A getter.\n\n  Expected bytes: about 15, the [getter](x)  \n\nExpected bytes: a second line is not read\n';
    const report = build(grown(), { body });
    expect(report.expected).toBe('Expected bytes: about 15, the [getter](x)');
    expect(renderComment(report)).toContain('+14 B 🔵 |\n\nExpected bytes: about 15, the \\[getter\\](x)\n\n<details>');
    expect(report.sentence).toBe(
      '`native-dates (full)` grew **+14 B** brotli to 14,077 B, against "Expected bytes: about 15, the \\[getter\\](x)".',
    );
    expect(build(grown()).expected).toBe(null);
  });
});

describe('the size of a PR', () => {
  it("comes from core's brotli delta, each size with its title and its line", () => {
    expect(opening(-12)).toEqual([
      '### 🟢 Core Shrank −12 Bytes Brotli',
      'PRs that remove bytes are typical for trims and sweeps.',
    ]);
    expect(opening(0)).toEqual([
      '### 🟢 Core Unchanged',
      'PRs that leave core unchanged are typical for plugin, test and tooling work.',
    ]);
    expect(opening(1)).toEqual([
      '### 🔵 Core Grew +1 Bytes Brotli (Bug Sized)',
      'PRs between 0-50 bytes are typical for bug fixes.',
    ]);
    expect(opening(50)[0]).toBe('### 🔵 Core Grew +50 Bytes Brotli (Bug Sized)');
    expect(opening(51)).toEqual([
      '### 🟡 Core Grew +51 Bytes Brotli (Small Feature Sized)',
      'PRs between 50-100 bytes are typical for small features and new options.',
    ]);
    expect(opening(100)[0]).toBe('### 🟡 Core Grew +100 Bytes Brotli (Small Feature Sized)');
    expect(opening(101)).toEqual([
      '### 🟠 Core Grew +101 Bytes Brotli (Feature Sized)',
      'PRs between 100-250 bytes are typical for new plugins with seams in core.',
    ]);
    expect(opening(251)).toEqual([
      '### 🔴 Core Grew +251 Bytes Brotli (Large Feature Sized)',
      'PRs between 250-500 bytes are typical for large core features, or plugins with significant core seams.',
    ]);
    expect(opening(500)[0]).toBe('### 🔴 Core Grew +500 Bytes Brotli (Large Feature Sized)');
  });

  it('follows the edges the measurement carries', () => {
    const sizes = { 'bug sized': 10, 'small feature sized': 20, 'feature sized': 40, 'large feature sized': 80 };
    const markdown = renderComment(build(withHead(coreBy(15), { sizes }), { msg: 'A change with no prefix' }));
    expect(title(markdown)).toBe('### 🟡 Core Grew +15 Bytes Brotli (Small Feature Sized)');
    expect(line(markdown)).toBe('PRs between 10-20 bytes are typical for small features and new options.');
    expect(() => build(withHead(coreBy(15), { sizes: { 'bug sized': 10 } }))).toThrow(
      /no edge for 'small feature sized'/,
    );
  });

  it("gives way to the kind's line when the title's prefix expects less", () => {
    expect(opening(60, 'Refactor: A move')).toEqual([
      '### 🟡 Core Grew +60 Bytes Brotli (Small Feature Sized)',
      'This PR is above the size expected for a refactor (0-50 bytes).',
    ]);
    expect(opening(60, 'Perf: A win')[1]).toBe(
      'This PR is above the size expected for a performance change (0-50 bytes).',
    );
    expect(opening(12, 'Build: A workflow')[1]).toBe(
      'This PR is above the size expected for a build change (0 bytes).',
    );
    expect(opening(12, 'Bug(zones): A fix')[1]).toBe('PRs between 0-50 bytes are typical for bug fixes.');
    expect(opening(300, 'A title with no prefix')[1]).toMatch(/^PRs between 250-500 bytes/);
    expect(opening(60, 'Feat/Bug: Both')[1]).toMatch(/^PRs between 50-100 bytes/);
    expect(opening(0, 'Docs: A page')[1]).toMatch(/^PRs that leave core unchanged/);
    expect(build(coreBy(0), { msg: 'Feat/Bug: Both' }).kind).toBe('Feat/Bug');
    expect(build(coreBy(0), { msg: 'no prefix' }).kind).toBe(null);
  });

  it('tells a feature that grew core past bug size where features belong', () => {
    expect(opening(70, 'Feat: Name formats in configure')).toEqual([
      '### 🟡 Core Grew +70 Bytes Brotli (Small Feature Sized)',
      'Features are generally implemented as plugins.',
    ]);
    expect(opening(320, 'Feat(core): A locale on every value')[1]).toBe(
      'Features are generally implemented as plugins.',
    );
    // at bug size or under it reads as any PR of that size does
    expect(opening(50, 'Feat: A second spelling')[1]).toBe('PRs between 0-50 bytes are typical for bug fixes.');
    expect(opening(0, 'Feat: A plugin')[1]).toMatch(/^PRs that leave core unchanged/);
    // a feature that prices its bytes in core is still told, with its line quoted under the table
    const priced = renderComment(build(coreBy(70), { msg: 'Feat: Name formats', body: 'Expected bytes: about 70' }));
    expect(line(priced)).toBe('Features are generally implemented as plugins.');
    expect(priced).toContain('+70 B 🟡 |\n\nExpected bytes: about 70\n\n<details>');
  });

  it('leaves the title to core when a plugin alone moved', () => {
    const report = build(moved(same(['packages/plugins/src/zones.js']), ZONES, { br: 38, min: 65 }));
    const markdown = renderComment(report);
    expect(title(markdown)).toBe('### 🟢 Core Unchanged');
    expect(changedRows(markdown)).toBe(`| ${ZONES} | 736 B | +65 B | +38 B 🔵 |`);
    expect(report.sentence).toBe(
      '`plugins/zones` grew **+38 B** brotli to 736 B, against an expected cost of about 0.',
    );
  });

  it('reads a plugin on one side alone as added or removed', () => {
    const { head, base, changed } = same(['packages/plugins/src/zones.js']);
    const without = (side) => ({ ...side, rows: side.rows.filter((row) => row.label !== ZONES) });
    const added = renderComment(build({ head, base: without(base), changed }));
    expect(changedRows(added)).toBe(`| ${ZONES}, added | 698 B | +1,893 B | +698 B 🔴 |`);
    const removed = renderComment(build({ head: without(head), base, changed }));
    expect(title(removed)).toBe('### 🟢 Core Unchanged');
    expect(changedRows(removed)).toBe(`| ${ZONES}, removed | 698 B | −1,893 B | −698 B 🟢 |`);
  });
});

describe('a red', () => {
  const BUG_LINE =
    'Bug fixes aim for 0 bytes and fail this check at 50 bytes. A fix is usually one or two lines, and a larger one is for a severe bug.';

  it('is a Bug PR that adds as much as the bug size holds', () => {
    for (const msg of ['Bug: A fix', 'Bug(zones): A fix']) {
      const report = build(coreBy(50), { msg });
      expect(report.state).toBe('red');
      expect(report.reason).toBe('over the bug fix limit');
      expect(report.band.name).toBe('bug sized');
      const markdown = renderComment(report);
      expect(title(markdown)).toBe('### ⛔ Core Grew +50 Bytes Brotli (Over the Bug Fix Limit)');
      expect(under(markdown)).toBe(BUG_LINE);
      expect(report.sentence).toBe(`Core Grew +50 Bytes Brotli (Over the Bug Fix Limit). ${BUG_LINE}`);
    }
    expect(build(coreBy(49), { msg: 'Bug: A fix' }).state).toBe('bug sized');
    for (const msg of ['Feat: A feature', 'Feat/Bug: Both', 'bug: a fix', 'Refactor: A move']) {
      expect(build(coreBy(50), { msg }).reason).toBe(null);
    }
  });

  it('is any PR past the last size, its delta carrying the mark its title does', () => {
    const report = build(coreBy(501));
    expect(report.reason).toBe('over the PR limit');
    const markdown = renderComment(report);
    expect(title(markdown)).toBe('### ⛔ Core Grew +501 Bytes Brotli (Over the PR Limit)');
    expect(under(markdown)).toBe('This PR is larger than 500 bytes which is above the maximum size.');
    expect(changedRows(markdown)).toBe(`| ${CORE} | 14,564 B | +1,503 B | +501 B ⛔ |`);
    expect(build(coreBy(500)).reason).toBe(null);
    // only core has that line, so a plugin past it keeps the last size's icon under a title that is not red
    const plugin = renderComment(build(moved(same(), ZONES, { br: 600 })));
    expect(title(plugin)).toBe('### 🟢 Core Unchanged');
    expect(changedRows(plugin)).toBe(`| ${ZONES} | 1,298 B | +1,800 B | +600 B 🔴 |`);
  });

  it('is core past the ceiling, and says so when main is over it too', () => {
    const report = build(coreBy(1047), { msg: 'Bug: A fix' });
    expect(report.reason).toBe('over the ceiling');
    const markdown = renderComment(report);
    expect(title(markdown)).toBe('### ⛔ Core Is 110 Bytes Over the Ceiling');
    // every red that holds speaks under the first one's title
    expect(under(markdown)).toBe(
      `This PR pushes core above the maximum size (15kb)\n\nThis PR is larger than 500 bytes which is above the maximum size.\n\n${BUG_LINE}`,
    );
    expect(report.summary.ceiling).toBe('110 B over the 15 kB (15,000 B) ceiling');

    const overAlready = coreBy(20);
    const lowered = (side) => ({
      ...side,
      ceiling: { ...side.ceiling, limit: 14000, distance: 14000 - side.ceiling.headline, ok: false },
    });
    const both = build({ ...overAlready, head: lowered(overAlready.head), base: lowered(overAlready.base) });
    expect(both.body).toBe(
      'This PR pushes core above the maximum size (14kb)\n\nMain is already 63 bytes over, and this PR adds 20 more.',
    );
  });

  it('is development text in the production build', () => {
    const strip = { present: true, folded: false, ok: false };
    const shipped = build(withHead(same(['src/helpers/environment.js']), { strip }));
    expect(shipped.reason).toBe('dev messages ship');
    expect(title(renderComment(shipped))).toBe('### ⛔ Core Ships Dev Messages');
    expect(shipped.body).toBe(
      'This PR does not properly remove all of its development messages from the production build.',
    );
    const inherited = build(withBase(withHead(same(), { strip }), { strip }));
    expect(inherited.body).toMatch(/production build\.\n\nMain does not remove them either\.$/);

    const blind = build(withHead(same(), { strip: { present: false, folded: true, ok: false } }));
    expect(blind.reason).toBe('strip check cannot run');
    expect(title(renderComment(blind))).toBe('### ⛔ Strip Check Cannot Run');
  });

  it('is a sentence that survives outside the allowlist, linked to its line at the head commit', () => {
    const leak = (text) => ({ text, at: 'src/time.js:87:22', bundles: [CORE] });
    const prose = (leaked) => ({ prose: { ok: false, survivors: leaked, leaked, stale: [], skipped: [] } });
    const link = `[\`src/time.js:87:22\`](https://github.com/Semantic-Org/Native-Dates/blob/${
      '2'.repeat(40)
    }/src/time.js#L87)`;
    const report = build(withHead(same(), prose([leak('a time value is required')])));
    expect(report.reason).toBe('prose outside the allowlist');
    expect(report.post).toBe(true);
    const markdown = renderComment(report);
    expect(title(markdown)).toBe('### ⛔ Core Ships Prose Outside the Allowlist');
    expect(under(markdown)).toBe(
      `This PR ships prose in the production bundle\n\n- "a time value is required" ${link}`,
    );
    const partly = build(
      withBase(
        withHead(same(), prose([leak('an old sentence'), leak('a new sentence')])),
        prose([leak('an old sentence')]),
      ),
    );
    expect(partly.body).toBe(
      `This PR ships prose in the production bundle\n\n- "an old sentence" ${link} (on main too)\n- "a new sentence" ${link}`,
    );
    const unlinked = build(withHead(same(), prose([leak('a time value is required')])), { repo: '' });
    expect(unlinked.body).toMatch(/- "a time value is required" `src\/time\.js:87:22`$/);
  });

  it('is a bundle that does not build, on either side', () => {
    const error = 'packages/plugins/src/zones.js:3: Could not resolve "./table.js"';
    const plugin = build(broken(grown(), 'head', ZONES, error));
    expect(plugin.reason).toBe('did not build');
    let markdown = renderComment(plugin);
    expect(title(markdown)).toBe('### ⛔ plugins/zones Did Not Build');
    expect(under(markdown)).toBe(
      `There is an error preventing this PR from building in packages/plugins/src/zones.js:3:\n${FENCE}\nCould not resolve "./table.js"\n${FENCE}`,
    );
    expect(changedRows(markdown)).toBe(
      `| ${CORE} | 14,077 B | +53 B | +14 B 🔵 |\n| ${ZONES}, did not build | — | — | — |`,
    );
    expect(markdown).toContain(`| ${ZONES}, did not build | — | — | — | — |`);
    // the row of every plugin fails with any one of them, and the plugin alone is named
    const total = build(broken(broken(grown(), 'head', ZONES, error), 'head', 'core + all plugins', error));
    expect(total.title).toBe('⛔ plugins/zones Did Not Build');
    expect(total.body).toBe(plugin.body);
    expect(build(broken(grown(), 'head', 'import { now }', 'No matching export')).title).toBe(
      '⛔ import { now } Did Not Build',
    );

    // the rows weighed against core fail with it, so it alone is named
    const dependents = grown().head.rows.filter((row) => row.beside || row.part === 'overhead').map((row) => row.label);
    const core = dependents.reduce(
      (measurements, label) => broken(measurements, 'head', label, `${CORE} did not build`),
      broken(grown(), 'head', CORE, 'SyntaxError: Unexpected token'),
    );
    const headline = build(
      withHead(core, {
        ceiling: { limit: 15000, headline: null, distance: null, ok: false },
        strip: { present: false, folded: false, ok: false, error: `${CORE} did not build` },
      }),
    );
    expect(headline.band).toBe(null);
    markdown = renderComment(headline);
    expect(title(markdown)).toBe('### ⛔ Core Did Not Build');
    expect(under(markdown)).toBe(
      `There is an error preventing this PR from building:\n${FENCE}\nSyntaxError: Unexpected token\n${FENCE}`,
    );
    expect(markdown).toContain('\nDev prose folded out: did not build\n');
    expect(headline.summary.ceiling).toBe('`native-dates (full)` did not build');

    const base = build(broken(same(), 'base', ZONES, 'Could not resolve "native-dates/helpers/zones"'));
    expect(base.reason).toBe('base did not build');
    markdown = renderComment(base);
    expect(title(markdown)).toBe('### ⛔ Base Did Not Build');
    expect(under(markdown)).toBe(
      `There is an error preventing main from building, preventing comparisons.\n\n\`plugins/zones\` stopped at:\n${FENCE}\nCould not resolve "native-dates/helpers/zones"\n${FENCE}`,
    );
    expect(changedRows(markdown)).toBe(`| ${ZONES}, base did not build | 698 B | — | — |`);
  });
});

describe('whether the comment posts', () => {
  it('posts nothing when no file of a bundle changed and no cell differs, and the summary page says why', () => {
    const tooling = build(same(['tools/ci/bundle/README.md', 'docs/astro.config.mjs']));
    expect(tooling.post).toBe(false);
    expect(renderSummary(tooling)).toMatch(
      /^## Bundle Size\n\n### 🟢 Core Unchanged\n\nPRs that leave core unchanged are typical for plugin, test and tooling work\.\n\n\*\*No comment posted\.\*\* This PR touches no file under `src\/` or `packages\/`, and every bundle measures the same bytes as main in minified, gzip and brotli\.\n\n<details>\n<summary>All bundles \(6\)<\/summary>/,
    );
    expect(renderSummary(tooling)).not.toContain('Packages Changed');
    const tests = build(same(['packages/plugins/test/zones.test.js', 'test/time.test.js']));
    expect(tests.sentence).toMatch(
      /^None of the 2 files this PR touches is in a bundle, and every bundle measures the same bytes/,
    );
  });

  it('posts when a changed file is in a bundle, when any cell differs, or when a check is red', () => {
    const touched = build(same(['src/duration.js', 'test/duration.test.js']));
    expect(touched.post).toBe(true);
    expect(touched.sentence).toBe(
      'No bundle changed in minified bytes, and one of the 2 files this PR touches is in a bundle.',
    );
    expect(renderComment(touched)).toContain(
      '### Packages Changed\nNo bundle changed size. 🎉\n\n<details>\n<summary>All bundles (6)</summary>',
    );
    expect(build(moved(same(), 'import { now }', { br: 2, min: 0 })).post).toBe(true);
    expect(build(withHead(same(), { strip: { present: true, folded: false, ok: false } })).post).toBe(true);
  });

  it('writes comment.md only when the comment posts, and summary.md and size-report.json always', () => {
    const dir = mkdtempSync(join(tmpdir(), 'size-report-'));
    writeReport(build(grown()), join(dir, 'posts'));
    expect(readFileSync(join(dir, 'posts/summary.md'), 'utf8')).toBe(
      readFileSync(join(dir, 'posts/comment.md'), 'utf8'),
    );
    expect(JSON.parse(readFileSync(join(dir, 'posts/size-report.json'), 'utf8')).post).toBe(true);
    writeReport(build(same()), join(dir, 'quiet'));
    expect(existsSync(join(dir, 'quiet/comment.md'))).toBe(false);
    expect(readFileSync(join(dir, 'quiet/summary.md'), 'utf8')).toContain('**No comment posted.**');
    rmSync(dir, { recursive: true, force: true });
  });

  it('tells a PR that changes how bundles are measured to read its numbers after it merges', () => {
    const note = 'This PR changes how bundles are measured, so read its numbers against the run after it merges.';
    const budget = build(same(['ai/contributing/budget.md', 'src/time.js']));
    expect(budget.measurementChanged).toEqual(['ai/contributing/budget.md']);
    expect(renderComment(budget)).toContain(`tooling work.\n\n${note}\n\n### Packages Changed\n`);
    expect(renderSummary(build(same(['.github/workflows/bundle-size.yml'])))).toContain(`${note}\n\n<details>`);
    expect(renderComment(build(grown()))).not.toContain(note);
  });
});

describe('untrusted text', () => {
  it('cannot close its fence, and a sentence that ships and its place render as text', () => {
    const error = 'packages/plugins/src/zones.js:3: ```\n<img src=x onerror=alert(1)> [evil](https://x)';
    const markdown = renderComment(build(broken(grown(), 'head', ZONES, error)));
    expect(under(markdown)).toBe(
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
    const leaked = under(renderComment(build(withHead(same(), prose('src/ti)me.js:1:1')))));
    expect(leaked).not.toContain('<script>');
    expect(leaked).not.toContain('[evil](https://x)');
    expect(leaked).toMatch(
      /\[`src\/ti\)me\.js:1:1`\]\(https:\/\/github\.com\/Semantic-Org\/Native-Dates\/blob\/2{40}\/src\/ti%29me\.js#L1\)$/,
    );
    // a place that climbs out of the repository is never a link
    expect(under(renderComment(build(withHead(same(), prose('../../other/repo.js:1:1')))))).toMatch(
      /`\.\.\/\.\.\/other\/repo\.js:1:1`$/,
    );
  });

  it('cannot break out of a table, a title or the footer', () => {
    const renamed = editRow(
      broken(same(), 'head', ZONES, 'x'),
      'head',
      ZONES,
      (row) => ({ ...row, label: 'a|b<i>`c`' }),
    );
    const markdown = renderComment(build(renamed));
    expect(markdown).toContain('| a\\|b&lt;i&gt;\\`c\\`, did not build | — | — | — |');
    const hostile = {
      ...same(),
      changed: { head: { sha: 'x' }, base: { sha: '<img>`', ref: '<b>main</b>' }, files: [] },
    };
    expect(renderSummary(build(hostile))).toMatch(
      /<sub>base &lt;b&gt;main&lt;\/b&gt; at `<img>` · `size-report\.json`<\/sub>$/,
    );
  });
});
