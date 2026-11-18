// fails when a size target passes its Brotli ceiling or a development explanation survives a production build
//   node tools/gates/budget.js                             check this checkout
//   node tools/gates/budget.js --head <dir> --base <dir>   compare two checkouts for a pull request

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

// the most Brotli bytes a target may weigh, keyed by its label in tools/size.js
export const ceilings = {
  'native-dates (full)': 15_000,
};

export const formatCount = (number) => number.toLocaleString('en-US');
export const formatSigned = (number) => `${number > 0 ? '+' : ''}${formatCount(number)}`;

// head and base are measureTargets() of two checkouts, and prose counts the prose literals in the head's
// production and development bundles
export function evaluateBudget({ head, base, prose }) {
  for (const label of Object.keys(ceilings)) {
    if (!head.some((target) => target.label === label)) {
      throw new Error(
        `evaluateBudget: ceiling '${label}' names no measured target. Use a label from measureTargets in tools/size.js`,
      );
    }
  }
  const rows = head.map((target) => {
    const before = base?.find(({ label }) => label === target.label);
    return {
      ...target,
      ceiling: ceilings[target.label],
      minChange: before ? target.min - before.min : undefined,
      brChange: before ? target.br - before.br : undefined,
    };
  });
  const failure = failureFrom(rows, prose);
  return { rows, verdict: failure ?? changeFrom(rows, base), failed: failure !== undefined };
}

function failureFrom(rows, prose) {
  if (rows.some(({ br, ceiling }) => br > ceiling)) { return 'over ceiling'; }
  if (prose.production > 0) { return 'development prose in production bundle'; }
  // the scan saw nothing where explanations are known to be, so its silence on production proves nothing
  if (prose.development === 0) { return 'no development prose in development bundle'; }
}

function changeFrom(rows, base) {
  if (!base) { return 'under ceiling'; }
  // a plugin row is the difference of two compressions, which shifts a byte or two when core alone changes,
  // so a row counts as changed only when its minified bytes moved
  const changed = rows.filter(({ minChange }) => minChange);
  if (changed.some(({ brChange }) => brChange > 0)) { return 'grew, under ceiling'; }
  if (changed.some(({ brChange }) => brChange < 0)) { return 'shrank'; }
  return 'unchanged';
}

if (import.meta.main) {
  // loaded here and not above, so tools/ci/size-comment.js reads the ceilings in a job that installs nothing
  const { entryWith, measure, measureTargets, pluginNames } = await import('../size.js');
  const { sentences } = await import('./prose.js');

  const { values: args } = parseArgs({
    options: {
      head: { type: 'string', default: resolve(import.meta.dirname, '../..') },
      base: { type: 'string' },
      json: { type: 'string' },
    },
  });
  const headDir = resolve(args.head);
  const head = await measureTargets(headDir);
  const base = args.base ? await measureTargets(resolve(args.base)) : undefined;

  // core with every plugin holds every explanation the library has, so one bundle is the whole scan
  const everything = entryWith(pluginNames(headDir));
  const survivors = sentences((await measure(everything, headDir)).text);
  const explanations = sentences((await measure(everything, headDir, { development: true })).text);
  const prose = { production: survivors.length, development: explanations.length };

  // labels and numbers only, so the report workflow never prints a sentence a pull request wrote
  if (args.json) { writeFileSync(args.json, JSON.stringify({ head, base, prose })); }

  const { rows, verdict, failed } = evaluateBudget({ head, base, prose });
  const cell = (text) => text.padStart(12);
  const size = (row, bytes) => cell(row.isDelta ? formatSigned(bytes) : formatCount(bytes));
  // the Change columns print only against a base
  const changeHeading = base ? cell('Change') : '';
  const change = (bytes) => (base ? cell(bytes === undefined ? 'new' : formatSigned(bytes)) : '');
  const width = Math.max(...rows.map((row) => row.label.length)) + 2;
  const table = [
    'Target'.padEnd(width) + cell('Minified') + changeHeading + cell('Brotli') + changeHeading + cell('Ceiling'),
    ...rows.map((row) =>
      row.label.padEnd(width) + size(row, row.min) + change(row.minChange) + size(row, row.br)
      + change(row.brChange) + (row.ceiling ? cell(formatCount(row.ceiling)) : '')
    ),
  ];
  const details = [
    ...rows.filter(({ br, ceiling }) => br > ceiling).map(({ label, br, ceiling }) =>
      `${label} is ${formatCount(br - ceiling)} bytes over its ceiling of ${formatCount(ceiling)} bytes Brotli`
    ),
    ...survivors.map((text) => `in production: ${text}`),
  ];
  if (!prose.development) {
    details.push('the scan found no explanations in a development build, so it cannot vouch for production');
  }
  console.log(`\n${
    [
      ...table,
      '',
      `Development prose: ${prose.production} in production, ${prose.development} in development`,
      `Size: ${verdict}`,
      ...details,
    ].join('\n')
  }\n`);
  process.exitCode = failed ? 1 : 0;
}
