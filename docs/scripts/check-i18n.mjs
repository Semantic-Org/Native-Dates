// verify content/strings.json and content/translations/* have no unused, missing, or orphaned keys,
// mismatched {name} placeholders, or orphaned translated markdown files
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ENABLED, TRANSLATED } from '../src/lib/locales.js';
import { PLUGINS, PRESETS } from '../src/lib/plugins.js';
import { CASES } from '../src/scripts/home/consoles.js';
import { PRIMITIVES } from '../src/scripts/home/primitives.js';
import { SAMPLES } from '../src/scripts/home/samples.js';
import { sentencesFor } from '../src/scripts/home/sentences.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const srcDir = resolve(root, 'src');
const contentDir = resolve(srcDir, 'content');
const translationsDir = resolve(contentDir, 'translations');

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

const english = JSON.parse(readFileSync(resolve(contentDir, 'strings.json'), 'utf8'));
const englishKeys = new Set(Object.keys(english));

const literalKeys = new Set();
const pluralFamilies = new Set();

// scan source files outside src/content/ that reference UI string keys
const codeFiles = walk(srcDir).filter((file) => !file.startsWith(`${contentDir}/`) && /\.(js|astro|html)$/.test(file));
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

const errors = [];

const pluralBaseOf = (key) => {
  const form = CLDR_FORMS.find((suffix) => key.endsWith(`.${suffix}`));
  return form ? key.slice(0, -(form.length + 1)) : null;
};

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
  ? readdirSync(translationsDir).filter((dir) => statSync(resolve(translationsDir, dir)).isDirectory())
  : [];

for (const dir of localeDirs) {
  const localeRoot = resolve(translationsDir, dir);
  const stringsFile = resolve(localeRoot, 'strings.json');
  if (existsSync(stringsFile)) {
    const rel = relative(root, stringsFile);
    const strings = JSON.parse(readFileSync(stringsFile, 'utf8'));
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
        errors.push(`${rel}: orphaned key "${key}" (not in src/content/strings.json)`);
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
  }

  for (const file of walk(localeRoot)) {
    if (file === stringsFile) { continue; }
    const englishTwin = file.replace(`/translations/${dir}/`, '/');
    if (!existsSync(englishTwin)) {
      errors.push(`${relative(root, file)}: orphaned translation (missing ${relative(root, englishTwin)})`);
    }
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`  x ${error}`));
  process.exit(1);
}
console.log(`i18n  ok (${englishKeys.size} keys, ${localeDirs.length} locales)`);
