// formats the pull request Size comment from the numbers tools/gates/budget.js saved
//   node tools/ci/size-comment.js --sizes <file>

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { evaluateBudget, formatCount, formatSigned } from '../gates/budget.js';

const { values: args } = parseArgs({ options: { sizes: { type: 'string' } } });
const saved = JSON.parse(readFileSync(args.sizes, 'utf8'));

// the file was written by a pull request's build and is printed under the bot's name, so a label may hold
// only what a target label holds and a size must be a whole number
const LABEL_PATTERN = /^[\w @{}()+/.-]+$/;
const readTargets = (targets) =>
  targets.map(({ label, min, br, isDelta }) => {
    if (typeof label !== 'string' || !LABEL_PATTERN.test(label) || !Number.isInteger(min) || !Number.isInteger(br)) {
      throw new Error(`size-comment: a target in ${args.sizes} is not a plain label with two byte counts`);
    }
    return { label, min, br, isDelta: isDelta === true };
  });
const prose = { production: saved.prose?.production, development: saved.prose?.development };
if (!Number.isInteger(prose.production) || !Number.isInteger(prose.development)) {
  throw new Error(`size-comment: ${args.sizes} is missing its two prose counts`);
}

const { rows, verdict, failed } = evaluateBudget({
  head: readTargets(saved.head),
  base: saved.base ? readTargets(saved.base) : undefined,
  prose,
});

const icons = { 'under ceiling': '🟢', 'grew, under ceiling': '🟡', shrank: '🟢', unchanged: '⚪' };
const kb = (bytes) => (bytes / 1000).toFixed(2);
// a plugin row is what the plugin adds to core, so its sizes carry a sign as they do in tools/size.js
const size = (row, bytes) =>
  row.isDelta ? [formatSigned(bytes), `${bytes > 0 ? '+' : ''}${kb(bytes)}`] : [formatCount(bytes), kb(bytes)];
const change = (bytes) => (bytes === undefined ? 'new' : formatSigned(bytes));

console.log([
  `## ${failed ? '🔴' : icons[verdict]} Size: ${verdict}`,
  '',
  '| Target | Minified (bytes) | kB | Change | Brotli (bytes) | kB | Change |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...rows.map((row) => {
    const cells = [...size(row, row.min), change(row.minChange), ...size(row, row.br), change(row.brChange)];
    return `| \`${row.label}\` | ${cells.join(' | ')} |`;
  }),
  '',
  ...rows.filter((row) => row.ceiling).map((row) =>
    `- Ceiling: \`${row.label}\` ${formatCount(row.br)} / ${formatCount(row.ceiling)} bytes Brotli`
  ),
  `- Development prose: ${prose.production} in production, ${prose.development} in development`,
].join('\n'));
