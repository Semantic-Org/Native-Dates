// checks production bundle sizes and dev-vs-prod prose stripping against ai/contributing/budget.md
//   node tools/gates/budget.js                             check current working tree
//   node tools/gates/budget.js --head <dir> --base <dir>   compare head against base for a PR

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse } from 'yaml';

import { measure } from '../size.js';
import { sentences } from './prose.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const budget = parse(
  readFileSync(resolve(root, 'ai/contributing/budget.md'), 'utf8').match(/^---\n([\s\S]*?)\n---/)[1],
);
for (const key of ['change', 'bug']) {
  if (!Number.isFinite(budget[key])) {
    throw new Error(`ai/contributing/budget.md is missing '${key}' in frontmatter`);
  }
}
if (!budget.bundles?.length) { throw new Error('ai/contributing/budget.md defines no bundles in frontmatter'); }

const allowedProse = new Set((budget.prose ?? []).map(({ text }) => text));

const sourceUsesDevGate = (dir) => {
  const srcDir = resolve(dir, 'src');
  if (!existsSync(srcDir)) { return false; }
  const walk = (current) =>
    readdirSync(current, { withFileTypes: true }).some((entry) => {
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) { return walk(full); }
      return entry.name.endsWith('.js') && /\bisDevelopment\b/.test(readFileSync(full, 'utf8'));
    });
  return walk(srcDir);
};

export const measureBundles = async (dir) => {
  const resolved = resolve(dir);
  const expectsDevProse = sourceUsesDevGate(resolved);
  return Object.fromEntries(
    await Promise.all(budget.bundles.map(async ({ name, code }) => {
      const [prod, dev] = await Promise.all([
        measure(code, resolved).catch((error) => {
          throw new Error(`bundle "${name}" failed to build in ${dir}\n${error.message}`);
        }),
        measure(code, resolved, { dev: true }).catch((error) => {
          throw new Error(`dev bundle "${name}" failed to build in ${dir}\n${error.message}`);
        }),
      ]);
      // an empty bundle means tree-shaking dropped unused imports and would report 0 B
      if (!prod.min) {
        throw new Error(`bundle "${name}" built to 0 bytes: reference its imports so esbuild retains them`);
      }
      return [name, {
        min: prod.min,
        br: prod.br,
        prose: sentences(prod.text).filter((text) => !allowedProse.has(text)),
        devProse: sentences(dev.text).filter((text) => !allowedProse.has(text)),
        expectsDevProse,
      }];
    })),
  );
};

export const formatCount = (number) => number.toLocaleString('en-US');
export const formatSigned = (number) => `${number > 0 ? '+' : ''}${formatCount(number)}`;
const formatBytes = (number) => `${formatCount(number)} bytes`;

export function evaluateBudget({ head, base, title = '', body = '' }) {
  // compound categories like Feat/Bug: skip single-category delta rules
  const kind = title.match(/^(\w+)(?:\([^)]*\))?:/)?.[1];
  const priced = body.match(/^Expected bytes:.*$/m)?.[0];

  // brotli can shift by 1-2 B on unrelated edits, so only treat a bundle as changed when minified size changed
  const rows = budget.bundles.map(({ name, ceiling }) => {
    const moved = Boolean(base) && head[name].min !== base[name].min;
    return { name, ceiling, br: head[name].br, moved, added: moved ? head[name].br - base[name].br : 0 };
  });

  const leakedProse = budget.bundles.filter(({ name }) => head[name].prose > 0).map(({ name }) =>
    `"${name}" includes ${head[name].prose} ${
      head[name].prose === 1 ? 'string' : 'strings'
    } of unstripped development prose.`
  );

  const expectsDevProse = budget.bundles.some(({ name }) => head[name].expectsDevProse);
  const hasDevProse = budget.bundles.some(({ name }) => (head[name].devProse ?? 1) > 0);
  if (expectsDevProse && !hasDevProse) {
    leakedProse.push(
      'No development prose appeared in __DEV__=true builds despite isDevelopment usage in src/. Check isDevelopment wiring or bundle coverage.',
    );
  }

  const violations = [];
  for (const { name, ceiling, br, added } of rows) {
    if (br > ceiling) { violations.push(`"${name}" exceeds its ceiling by ${formatBytes(br - ceiling)}.`); }
    if (kind === 'Bug' && added >= budget.bug) {
      violations.push(
        `"${name}" grew by ${formatBytes(added)}. Bug fixes aim for 0 bytes and fail at ${formatBytes(budget.bug)}.`,
      );
    }
    if (added > budget.change) {
      violations.push(
        `"${name}" grew by ${formatBytes(added)}, exceeding the per-PR limit of ${formatBytes(budget.change)}.`,
      );
    }
  }

  const notes = [];
  if (priced) { notes.push(`PR description declares: "${priced}"`); }
  if (kind === 'Feat' && !priced && rows.some((row) => row.added > 0)) {
    notes.push(
      'Features are expected to add ~0 bytes unless priced in the PR description with "Expected bytes: <N>".',
    );
  }
  if (['Build', 'Harness', 'Docs', 'Test', 'Chore'].includes(kind) && rows.some((row) => row.moved)) {
    notes.push(`A ${kind} PR should not change production bundle sizes.`);
  }
  return { rows, notes, violations, leakedProse };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values: args } = parseArgs({
    options: {
      head: { type: 'string', default: root },
      base: { type: 'string' },
      title: { type: 'string' },
      body: { type: 'string' },
      json: { type: 'string' },
    },
  });
  const measured = {
    head: await measureBundles(args.head),
    base: args.base ? await measureBundles(args.base) : undefined,
  };
  // store only numeric counts in the JSON artifact so report.yml never renders untrusted PR strings
  const toCounts = (side) =>
    side
    && Object.fromEntries(
      Object.entries(side).map(([name, size]) => [
        name,
        {
          min: size.min,
          br: size.br,
          prose: size.prose.length,
          devProse: size.devProse.length,
          expectsDevProse: size.expectsDevProse,
        },
      ]),
    );
  const head = toCounts(measured.head);
  const base = toCounts(measured.base);
  if (args.json) { writeFileSync(args.json, JSON.stringify({ head, base })); }

  const { rows, notes, violations, leakedProse } = evaluateBudget({
    head,
    base,
    title: args.title,
    body: args.body,
  });
  const cell = (text) => text.padStart(10);
  const width = Math.max('Bundle'.length, ...rows.map((row) => row.name.length)) + 2;
  const table = [
    'Bundle'.padEnd(width) + cell('Brotli') + cell('Ceiling') + (base ? cell('Change') : ''),
    ...rows.map((row) =>
      row.name.padEnd(width) + cell(formatCount(row.br)) + cell(formatCount(row.ceiling))
      + (base ? cell(formatSigned(row.added)) : '')
    ),
  ];
  const verdict = [
    ...(violations.length
      ? ['Over budget.', ...violations, 'See ai/contributing/budget.md for options when a change exceeds the budget.']
      : []),
    ...(leakedProse.length
      ? [
        'Development prose check failed.',
        ...leakedProse,
        ...Object.entries(measured.head).flatMap(([name, { prose }]) => prose.map((text) => `  ${name}: ${text}`)),
        'See ai/contributing/standards/legibility/errors-and-logs.md to fold explanations behind isDevelopment.',
      ]
      : []),
    ...(violations.length || leakedProse.length ? [] : ['Within budget.']),
  ];
  console.log(`\n${[...table, '', ...notes, ...(notes.length ? [''] : []), ...verdict].join('\n')}\n`);
  process.exitCode = violations.length || leakedProse.length ? 1 : 0;
}
