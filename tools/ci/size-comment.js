// formats the PR Size comment from numeric bundle measurements saved by tools/gates/budget.js
//   node tools/ci/size-comment.js --sizes <file> --title <title> --body <body>

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { budget, evaluateBudget, formatCount, formatSigned } from '../gates/budget.js';

const { values: args } = parseArgs({
  options: {
    sizes: { type: 'string' },
    weighed: { type: 'string' },
    title: { type: 'string', default: '' },
    body: { type: 'string', default: '' },
  },
});

const saved = JSON.parse(readFileSync(args.sizes ?? args.weighed, 'utf8'));
// coerce every field to a finite number since the artifact comes from an untrusted PR build
const parseBundleSizes = (side) =>
  Object.fromEntries(budget.bundles.map(({ name }) => {
    const size = { min: Number(side?.[name]?.min), br: Number(side?.[name]?.br), prose: Number(side?.[name]?.prose) };
    if (!Object.values(size).every(Number.isFinite)) {
      throw new Error(`size artifact is missing numeric measurements for bundle "${name}"`);
    }
    return [name, size];
  }));

const { rows, notes, violations, leakedProse } = evaluateBudget({
  head: parseBundleSizes(saved.head),
  base: parseBundleSizes(saved.base),
  title: args.title,
  body: args.body,
});
const grew = rows.some((row) => row.added > 0);
const shrank = rows.some((row) => row.added < 0);

const heading = violations.length
  ? '🔴 Size: over budget'
  : leakedProse.length
  ? '🔴 Size: development prose in production bundle'
  : grew
  ? '🟡 Size: grew, within budget'
  : shrank
  ? '🟢 Size: shrank'
  : '⚪ Size: unchanged';

console.log([
  `## ${heading}`,
  '',
  '| Bundle | Brotli | Ceiling | This change |',
  '|---|---:|---:|---:|',
  ...rows.map((row) =>
    `| ${row.name} | ${formatCount(row.br)} | ${formatCount(row.ceiling)} | ${formatSigned(row.added)} |`
  ),
  '',
  ...[...violations, ...leakedProse].map((item) => `- ${item}`),
  ...(violations.length || leakedProse.length ? [''] : []),
  ...notes,
  ...(notes.length ? [''] : []),
  `Sizes are Brotli-11 bytes across the entry bundles in \`ai/contributing/budget.md\`${
    violations.length ? ', which lists options when a change exceeds its ceiling' : ''
  }.${
    leakedProse.length
      ? ' See the workflow log for exact strings and `ai/contributing/standards/legibility/errors-and-logs.md` for `isDevelopment` folding.'
      : ''
  }`,
  '',
  '<!-- size -->',
].join('\n'));
