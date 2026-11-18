// checks the rows tools/size.js measures against ai/contributing/budget.md: the ceiling, the per-PR limits, and development text
//   node tools/gates/budget.js                                          check the working tree
//   node tools/gates/budget.js --base <dir> --title <title>             and judge what it adds to another checkout
//   node tools/gates/budget.js --head <dir> --base <dir> --json <dir>   weigh a pull request, writing head.json and base.json

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse } from 'yaml';

import { buildReport } from '../ci/bundle/reporter.js';
import { measureRows, printRows } from '../size.js';
import { isProse, literals, sentences, sourceLocator } from './prose.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const budget = parse(
  readFileSync(resolve(root, 'ai/contributing/budget.md'), 'utf8').match(/^---\n([\s\S]*?)\n---/)[1],
);
if (!Number.isFinite(budget.ceiling)) {
  throw new Error("ai/contributing/budget.md is missing 'ceiling' in frontmatter");
}

// one tree as the bundle bot's reporter reads it: every row in minified, gzip and brotli bytes with the
// source files behind it, core's distance to the ceiling, and what the two checks on development text found
export async function checkTree(dir = root) {
  const { rows, builds } = await measureRows(resolve(dir));
  const headline = rows.find((row) => row.part === 'headline');
  const overhead = rows.find((row) => row.part === 'overhead');
  const allowed = new Set((budget.prose ?? []).map(({ text }) => text));

  // the strip check runs both ways, since a check that only looks for absence passes once nothing is left
  // to look for: development text is present in the development build, and gone from the production one
  const production = builds[headline.label];
  const development = builds[overhead.label];
  const strip = { present: false, folded: false };
  if (production && development) {
    const shipped = new Set(sentences(production.text));
    const devOnly = sentences(development.text).filter((text) => !allowed.has(text));
    strip.present = devOnly.length > 0;
    strip.folded = devOnly.some((text) => !shipped.has(text));
  }
  else {
    strip.error = `${(production ? overhead : headline).label} did not build`;
  }
  strip.ok = strip.present && strip.folded;

  // the prose check reads every literal core and the plugins ship, and keeps each sentence with its source line
  const scanned = rows.filter((row) => row.part === 'headline' || row.part === 'plugin');
  const survivors = new Map();
  const held = {};
  for (const { label, beside } of scanned.filter((row) => builds[row.label])) {
    const { text, map } = builds[label];
    const locate = sourceLocator(map, text);
    held[label] = new Set();
    for (const { text: literal, offset } of literals(text)) {
      if (!isProse(literal)) { continue; }
      const found = locate(offset);
      const at = found ? `${found.file}:${found.line}:${found.column}` : 'no source mapping';
      const key = `${literal}\n${at}`;
      held[label].add(key);
      // a plugin's bundle holds core too, and a line core carries is core's
      if (held[beside]?.has(key)) { continue; }
      if (survivors.has(key)) { survivors.get(key).bundles.push(label); }
      else { survivors.set(key, { text: literal, at, bundles: [label] }); }
    }
  }
  const skipped = scanned.filter((row) => !builds[row.label]).map((row) => row.label);
  const leaked = [...survivors.values()].filter((survivor) => !allowed.has(survivor.text));
  const carried = new Set([...survivors.values()].map((survivor) => survivor.text));
  const stale = skipped.length ? [] : [...allowed].filter((text) => !carried.has(text));

  const weight = headline.sizes?.br ?? null;
  return {
    ceiling: {
      limit: budget.ceiling,
      headline: weight,
      distance: weight === null ? null : budget.ceiling - weight,
      ok: weight !== null && weight <= budget.ceiling,
    },
    sizes: budget.sizes,
    strip,
    prose: {
      ok: leaked.length === 0 && skipped.length === 0,
      survivors: [...survivors.values()],
      leaked,
      stale,
      skipped,
    },
    // a build's text and map stay here. the reporter reads bytes and the source files behind them
    rows,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values: args } = parseArgs({
    options: {
      head: { type: 'string', default: root },
      base: { type: 'string' },
      title: { type: 'string', default: '' },
      json: { type: 'string' },
    },
  });
  const head = await checkTree(args.head);
  const base = args.base ? await checkTree(args.base) : null;
  if (args.json) {
    mkdirSync(args.json, { recursive: true });
    writeFileSync(resolve(args.json, 'head.json'), `${JSON.stringify(head)}\n`);
    if (base) { writeFileSync(resolve(args.json, 'base.json'), `${JSON.stringify(base)}\n`); }
  }

  // the reporter is the one judge, so the check is red exactly when the comment is. with no base the
  // tree is weighed against itself, and only the ceiling and the two text checks can be red
  const report = buildReport({ measurements: { head, base: base ?? head, changed: {} }, head: { msg: args.title } });
  const red = report.state === 'red';
  printRows(head.rows);
  console.log(report.summary.ceiling);
  console.log(report.summary.checks);
  for (const text of head.prose.stale) { console.warn(`stale prose entry in ai/contributing/budget.md: "${text}"`); }
  if (red) {
    console.error(`\n${report.title}\n\n${report.body}\n`);
    if (report.reason.startsWith('over')) {
      console.error('See ai/contributing/budget.md for options when a change exceeds the budget.\n');
    }
    // an annotation on the run's page, one line by construction
    if (process.env.GITHUB_ACTIONS) { console.log(`::error::${report.sentence}`); }
  }
  else {
    const moved = base && report.rows.some((row) => row.changed);
    console.log(`\n${moved ? `${report.sentence}\n` : ''}Within budget.\n`);
  }
  process.exitCode = red ? 1 : 0;
}
