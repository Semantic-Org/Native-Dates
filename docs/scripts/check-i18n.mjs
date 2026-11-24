// verify content/strings.json and content/translations/* have no unused, missing, or orphaned keys,
// mismatched {name} placeholders, orphaned or misaligned markdown twins, or stale source hashes.
// Pass --prune to strip orphaned locale keys and orphaned markdown twins, or --strict to fail on stale hashes.
import { existsSync, readdirSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { NOTES, TASKS } from '../src/lib/bench.js';
import { ENABLED, TRANSLATED } from '../src/lib/locales.js';
import { headingsOf } from '../src/lib/markdown/i18n.js';
import { PLUGINS, PRESETS } from '../src/lib/plugins.js';
import { sourceHash } from '../src/lib/source-hash.js';
import { CASES } from '../src/scripts/home/consoles.js';
import { PRIMITIVES } from '../src/scripts/home/primitives.js';
import { SAMPLES } from '../src/scripts/home/samples.js';
import { sentencesFor } from '../src/scripts/home/sentences.js';

const here = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(here, '..');

const CLDR_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const varsOf = (text) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(([, name]) => name))].sort();

const parseMarkdown = (raw) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return match ? { data: parseYaml(match[1]) ?? {}, body: match[2] } : { data: {}, body: raw };
};

const pluralBaseOf = (key) => {
  const form = CLDR_FORMS.find((suffix) => key.endsWith(`.${suffix}`));
  return form ? key.slice(0, -(form.length + 1)) : null;
};

function removeEmptyParents(dir, stopAt) {
  let current = dir;
  while (current !== stopAt && current.startsWith(`${stopAt}/`)) {
    if (readdirSync(current).length > 0) { break; }
    rmdirSync(current);
    current = dirname(current);
  }
}

export function checkI18n({ root = defaultRoot, srcRoot = resolve(defaultRoot, 'src'), prune = false, strict = false } = {}) {
  const contentDir = resolve(root, 'src/content');
  const translationsDir = resolve(contentDir, 'translations');

  const english = JSON.parse(readFileSync(resolve(contentDir, 'strings.json'), 'utf8'));
  const englishKeys = new Set(Object.keys(english));

  const literalKeys = new Set();
  const pluralFamilies = new Set();

  // scan source files outside src/content/ that reference UI string keys
  const srcContent = resolve(srcRoot, 'content');
  const codeFiles = walk(srcRoot).filter((file) => !file.startsWith(`${srcContent}/`) && /\.(js|astro|html)$/.test(file));
  for (const file of codeFiles) {
    const code = stripComments(readFileSync(file, 'utf8'));
    // t(...), ui(...), named(...), titled(...) including ternaries
    for (const [, args] of code.matchAll(/\b(?:t|ui|named|titled)\(([^)]*)\)/g)) {
      for (const [, key] of args.matchAll(/['"]([a-z]+\.[\w.-]+)['"]/gi)) {
        literalKeys.add(key);
      }
    }
    // {{t:key}} in raw html templates
    for (const [, key] of code.matchAll(/\{\{t:([\w.-]+)/g)) {
      literalKeys.add(key);
    }
    // plural('family', ...) in client scripts and plural(locale, 'family', ...) on server
    for (const [, args] of code.matchAll(/\b(?:plural|counted)\(([^)]*)\)/g)) {
      for (const [, family] of args.matchAll(/['"]([a-z]+\.[\w.-]+)['"]/gi)) {
        pluralFamilies.add(family);
      }
    }
  }

  // keys derived from data tables (plugins, presets, and homepage instruments)
  for (const { name, category } of PLUGINS) {
    literalKeys.add(`home.plugin.${name}`);
    literalKeys.add(`plugins.${name}.description`);
    literalKeys.add(`plugins.category.${category}`);
  }
  for (const { name } of PRESETS) {
    literalKeys.add(`plugins.preset.${name}.description`);
  }
  for (const { code } of ENABLED) {
    for (const sentence of sentencesFor(code)) {
      literalKeys.add(`home.say.tab.${sentence.id}`);
      for (const options of sentence.steps) {
        for (const option of options) {
          literalKeys.add(`home.say.${option.say}`);
        }
      }
    }
  }
  for (const row of PRIMITIVES) {
    literalKeys.add(`home.prims.${row.id}`);
  }
  for (const entry of CASES) {
    for (const field of ['ask', 'why', 'miss']) {
      literalKeys.add(`home.consoles.${entry.id}.${field}`);
    }
  }
  for (const sample of SAMPLES) {
    literalKeys.add(`home.xray.${sample.id}`);
  }
  for (const task of TASKS) {
    for (const field of ['task', 'detail']) {
      literalKeys.add(`home.bench.${task.id}.${field}`);
    }
  }
  for (const note of NOTES) {
    literalKeys.add(note.key);
  }

  const errors = [];
  const warnings = [];
  const pruned = [];

  // 1. unused English keys
  for (const key of englishKeys) {
    const base = pluralBaseOf(key);
    if (!literalKeys.has(key) && !(base && pluralFamilies.has(base))) {
      errors.push(`src/content/strings.json: unused key "${key}"`);
    }
  }

  // 2. referenced keys missing from English strings.json
  for (const key of literalKeys) {
    if (!englishKeys.has(key)) {
      errors.push(`src/content/strings.json: missing key "${key}" referenced in src/`);
    }
  }
  for (const family of pluralFamilies) {
    if (!englishKeys.has(`${family}.other`)) {
      errors.push(`src/content/strings.json: missing plural key "${family}.other"`);
    }
  }

  // 3. locale strings.json and twin markdown files
  const enabledPaths = new Set(TRANSLATED.map((locale) => locale.path));
  const localeDirs = existsSync(translationsDir)
    ? readdirSync(translationsDir).filter((dir) => statSync(resolve(translationsDir, dir)).isDirectory()).sort()
    : [];

  for (const dir of localeDirs) {
    const localeRoot = resolve(translationsDir, dir);
    const stringsFile = resolve(localeRoot, 'strings.json');
    if (existsSync(stringsFile)) {
      const rel = relative(root, stringsFile);
      const strings = JSON.parse(readFileSync(stringsFile, 'utf8'));
      const orphanedKeys = [];
      if (enabledPaths.has(dir)) {
        for (const key of [...englishKeys].filter((name) => name.startsWith('language.'))) {
          if (!strings[key]) {
            errors.push(`${rel}: missing required key "${key}"`);
          }
        }
      }
      for (const [key, value] of Object.entries(strings)) {
        if (key === '$reviewed') { continue; }
        const base = pluralBaseOf(key);
        const refKey = englishKeys.has(key)
          ? key
          : base && pluralFamilies.has(base) && englishKeys.has(`${base}.other`)
          ? `${base}.other`
          : null;
        if (!refKey) {
          orphanedKeys.push(key);
          if (!prune) {
            errors.push(`${rel}: orphaned key "${key}" (not in src/content/strings.json)`);
          }
          continue;
        }
        const expectedVars = varsOf(english[refKey]);
        const actualVars = varsOf(String(value));
        // language.untranslated names its own language (docs-i18n.md), and singular/dual/zero plurals
        // in languages like Arabic spell the count in the noun itself without {count} / {kept}
        const optionalVars = new Set([
          ...(key === 'language.untranslated' ? ['language'] : []),
          ...(key === 'home.xray.invite' || key === 'home.try.title' ? ['city'] : []),
          ...(base && /\.(?:zero|one|two)$/.test(key) ? ['count', 'kept'] : []),
        ]);
        const missingVars = expectedVars.filter((variable) =>
          !actualVars.includes(variable) && !optionalVars.has(variable)
        );
        const unknownVars = actualVars.filter((variable) => !expectedVars.includes(variable));
        if (missingVars.length || unknownVars.length) {
          errors.push(
            `${rel}: "${key}" placeholders {${actualVars.join(', ')}} != english {${expectedVars.join(', ')}}`,
          );
        }
      }
      if (prune && orphanedKeys.length) {
        const cleaned = Object.fromEntries(
          Object.entries(strings).filter(([key]) => !orphanedKeys.includes(key)),
        );
        writeFileSync(stringsFile, `${JSON.stringify(cleaned, null, 2)}\n`);
        pruned.push(`${rel}: pruned ${orphanedKeys.length} orphaned key(s): ${orphanedKeys.join(', ')}`);
      }
    }

    for (const file of walk(localeRoot)) {
      if (file === stringsFile) { continue; }
      const rel = relative(root, file);
      const englishTwin = file.replace(`/translations/${dir}/`, '/');
      if (!existsSync(englishTwin)) {
        if (prune) {
          unlinkSync(file);
          removeEmptyParents(dirname(file), localeRoot);
          pruned.push(`${rel}: removed orphaned translation`);
        }
        else {
          errors.push(`${rel}: orphaned translation (missing ${relative(root, englishTwin)})`);
        }
        continue;
      }
      if (!file.endsWith('.md')) { continue; }
      const twinRaw = readFileSync(file, 'utf8');
      const englishRaw = readFileSync(englishTwin, 'utf8');
      const twinEntry = parseMarkdown(twinRaw);
      const englishEntry = parseMarkdown(englishRaw);
      const expectedSource = sourceHash(englishEntry);
      if (String(twinEntry.data.source ?? '') !== expectedSource) {
        const note = `${rel}: stale source hash (got "${twinEntry.data.source ?? ''}", expected "${expectedSource}")`;
        if (strict) { errors.push(note); }
        else { warnings.push(note); }
      }
      const twinHeadings = headingsOf(twinRaw);
      const englishHeadings = headingsOf(englishRaw);
      if (
        twinHeadings.length !== englishHeadings.length
        || twinHeadings.some((heading, i) => heading.depth !== englishHeadings[i].depth)
      ) {
        errors.push(
          `${rel}: heading structure (${twinHeadings.map((h) => `h${h.depth}`).join(',')}) != english (${
            englishHeadings.map((h) => `h${h.depth}`).join(',')
          })`,
        );
      }
    }
  }

  return { errors, warnings, pruned, keyCount: englishKeys.size, localeCount: localeDirs.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = new Set(process.argv.slice(2));
  const { errors, warnings, pruned, keyCount, localeCount } = checkI18n({
    prune: args.has('--prune'),
    strict: args.has('--strict'),
  });
  pruned.forEach((line) => console.log(`  - ${line}`));
  warnings.forEach((line) => console.warn(`  ! ${line}`));
  if (errors.length) {
    errors.forEach((error) => console.error(`  x ${error}`));
    process.exit(1);
  }
  console.log(`i18n  ok (${keyCount} keys, ${localeCount} locales)`);
}
