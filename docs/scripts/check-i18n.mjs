// verify content/strings.json and content/translations/* have no unused, missing, or orphaned keys,
// mismatched {name} placeholders, raw HTML in plain-text keys, incomplete CLDR plural sets,
// orphaned or structurally misaligned markdown twins, or stale source hashes.
// Flags: --prune (strip orphans), --strict (fail on stale hashes), --complete (require all keys and twins),
// --locale=ja,zh-CN (limit locale checks to specific locale codes).
import { existsSync, readdirSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

import { NOTES, TASKS } from '../src/lib/bench.js';
import { ENABLED, localeOf, TRANSLATED } from '../src/lib/locales.js';
import { headingsOf, typeColumnsOf } from '../src/lib/markdown/i18n.js';
import { PLUGINS, PRESETS } from '../src/lib/plugins.js';
import { sourceHash } from '../src/lib/source-hash.js';
import { CASES } from '../src/scripts/home/consoles.js';
import { PRIMITIVES } from '../src/scripts/home/primitives.js';
import { SAMPLES } from '../src/scripts/home/samples.js';
import { sentencesFor } from '../src/scripts/home/sentences.js';

const here = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(here, '..');

const CLDR_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other'];
const HTML_TAG = /<[a-z!/][^>]*>/i;
const HTML_ENTITY = /&(?:nbsp|amp|lt|gt|quot);/i;
const REQUIRED_HTML = {
  'playground.paused': [/class="pg-run"/],
  'home.consoles.title': [/class="is-wrong"/, /class="is-right"/],
  'home.bench.lede': [/href="\{run\}"/, /href="\{add\}"/],
  'plugins.callout.body': [/href="\{href\}"/],
};
const LOCALE_PREFIX = new RegExp(`\\]\\((\\/(?:${TRANSLATED.map((l) => l.path).join('|')})\\/[^)\\s]*)\\)`, 'gi');

// keys rendered as raw HTML via set:html, innerHTML, or remark html()
export const HTML_KEYS = new Set([
  'api.default',
  'examples.readMore',
  'home.bench.lede',
  'home.bytes.title',
  'home.closer.title',
  'home.consoles.lede',
  'home.consoles.title',
  'home.hero.lede',
  'home.hero.title',
  'home.year.caption',
  'home.year.lede',
  'playground.paused',
  'plugins.callout.body',
  'plugins.empty.none',
  'plugins.stats.picked',
  'search.hint',
  ...CASES.flatMap((entry) => [`home.consoles.${entry.id}.ask`, `home.consoles.${entry.id}.why`]),
]);

// keys rendered through markdown/inline.js (`code`, **strong**, [label](href)) where raw HTML tags are escaped
export const INLINE_KEYS = new Set(PLUGINS.map((plugin) => `plugins.${plugin.name}.description`));

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
  if (!match) { return { data: {}, body: raw, error: null }; }
  try {
    return { data: parseYaml(match[1]) ?? {}, body: match[2], error: null };
  }
  catch (err) {
    return { data: {}, body: match[2], error: err.message };
  }
};

const resolveTranslated = (input) => {
  const normalized = String(input).trim().toLowerCase();
  return TRANSLATED.find((l) => l.path === normalized || l.code.toLowerCase() === normalized) ?? null;
};

const pluralBaseOf = (key) => {
  const form = CLDR_FORMS.find((suffix) => key.endsWith(`.${suffix}`));
  return form ? key.slice(0, -(form.length + 1)) : null;
};

const cldrFormsFor = (code) => new Intl.PluralRules(code).resolvedOptions().pluralCategories;

function fencesOf(body, langs) {
  const blocks = [];
  const lines = body.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    if (!current) {
      const open = line.match(/^(`{3,})(\w+)\s*$/);
      if (open) { current = { fence: open[1], lang: open[2], lines: [] }; }
      continue;
    }
    if (line.startsWith(current.fence) && line.trim() === current.fence) {
      if (langs.has(current.lang)) { blocks.push({ lang: current.lang, value: current.lines.join('\n') }); }
      current = null;
      continue;
    }
    current.lines.push(line);
  }
  return blocks;
}

const paramShape = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    name: String(item?.name ?? ''),
    type: String(item?.type ?? ''),
    required: typeof item?.required === 'boolean'
      ? item.required
      : item?.required === undefined
      ? false
      : String(item.required),
    default: item?.default === undefined ? null : String(item.default),
    hasDescription: Boolean(String(item?.description ?? '').trim()),
    options: item?.options ? paramShape(item.options) : null,
  }));

function stripCodeFences(body) {
  const out = [];
  let fence = null;
  for (const line of body.split(/\r?\n/)) {
    if (!fence) {
      const open = line.match(/^(`{3,})/);
      if (open) { fence = open[1]; continue; }
      out.push(line);
      continue;
    }
    if (line.startsWith(fence) && line.trim() === fence) { fence = null; }
  }
  return out.join('\n');
}

function kindsOf(body) {
  return [...stripCodeFences(body).matchAll(/:kind\[([^\]]*)\]/g)].map(([, kind]) => kind);
}

function localeTabsOf(body) {
  const locales = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^`{3,}[^\n]*\blocale="([^"]+)"/);
    if (match) { locales.push(match[1]); }
  }
  return locales;
}

function doublePrefixedLinksOf(body) {
  return [...stripCodeFences(body).matchAll(LOCALE_PREFIX)].map(([, href]) => href);
}

function directivesOf(body) {
  const found = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^`{3,}/.test(line)) { inFence = !inFence; continue; }
    if (inFence) { continue; }
    const open = line.match(/^:{3,}(entry|steps|truth|details|note|tip|warning|danger)\b/);
    if (open) { found.push(open[1]); }
  }
  return found;
}

function truthBooleansOf(body) {
  let count = 0;
  let inFence = false;
  let inTruth = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^`{3,}/.test(line)) { inFence = !inFence; continue; }
    if (inFence) { continue; }
    if (/^:{3,}truth\b/.test(line)) { inTruth = true; continue; }
    if (inTruth && /^:{3,}\s*$/.test(line)) { inTruth = false; continue; }
    if (inTruth && line.includes('|')) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      count += cells.filter((cell) => cell === 'true' || cell === 'false').length;
    }
  }
  return count;
}

function removeEmptyParents(dir, stopAt) {
  let current = dir;
  while (current !== stopAt && current.startsWith(`${stopAt}/`)) {
    if (readdirSync(current).length > 0) { break; }
    rmdirSync(current);
    current = dirname(current);
  }
}

export function checkI18n({
  root = defaultRoot,
  srcRoot = resolve(defaultRoot, 'src'),
  prune = false,
  strict = false,
  complete = false,
  locales = null,
} = {}) {
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

  // 1. unused English keys and HTML allowlist parity
  for (const [key, value] of Object.entries(english)) {
    const base = pluralBaseOf(key);
    if (!literalKeys.has(key) && !(base && pluralFamilies.has(base))) {
      errors.push(`src/content/strings.json: unused key "${key}"`);
    }
    if (HTML_TAG.test(String(value)) && !HTML_KEYS.has(key)) {
      errors.push(`src/content/strings.json: "${key}" contains HTML tags but is not in HTML_KEYS`);
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
  let localeDirs;
  if (locales?.length) {
    localeDirs = [];
    for (const input of locales) {
      const matched = resolveTranslated(input);
      if (!matched) {
        errors.push(`unknown or non-translated --locale="${input}"`);
        continue;
      }
      if (!localeDirs.includes(matched.path)) { localeDirs.push(matched.path); }
    }
    localeDirs.sort();
  }
  else {
    localeDirs = existsSync(translationsDir)
      ? readdirSync(translationsDir).filter((dir) => statSync(resolve(translationsDir, dir)).isDirectory()).sort()
      : [];
  }

  const englishMarkdown = [
    ...(existsSync(resolve(contentDir, 'docs')) ? walk(resolve(contentDir, 'docs')) : []),
    ...(existsSync(resolve(contentDir, 'examples')) ? walk(resolve(contentDir, 'examples')) : []),
  ].filter((file) => file.endsWith('.md'));

  for (const dir of localeDirs) {
    const locale = TRANSLATED.find((l) => l.path === dir) ?? { code: dir, path: dir };
    const localeRoot = resolve(translationsDir, dir);
    const stringsFile = resolve(localeRoot, 'strings.json');
    if (existsSync(stringsFile)) {
      const rel = relative(root, stringsFile);
      const strings = JSON.parse(readFileSync(stringsFile, 'utf8'));
      const orphanedKeys = [];
      const translatedFamilies = new Set();
      const cldrForms = cldrFormsFor(locale.code);

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
        if (base && pluralFamilies.has(base)) {
          translatedFamilies.add(base);
        }
        if ((HTML_TAG.test(String(value)) || HTML_ENTITY.test(String(value))) && !HTML_KEYS.has(key)) {
          errors.push(
            `${rel}: "${key}" contains raw HTML or entities but renders as ${INLINE_KEYS.has(key) ? 'inline markdown' : 'plain text'}`,
          );
        }
        for (const required of REQUIRED_HTML[key] ?? []) {
          if (!required.test(String(value))) {
            errors.push(`${rel}: "${key}" is missing required HTML markup (${required.source})`);
          }
        }
        const expectedVars = varsOf(english[refKey]);
        const actualVars = varsOf(String(value));
        // language.untranslated names its own language (docs-i18n.md), and singular/dual/zero plurals
        // in languages like Arabic spell the count in the noun itself without {count}, {kept}, or {hours}
        const optionalVars = new Set([
          ...(key === 'language.untranslated' ? ['language'] : []),
          ...(key === 'home.xray.invite' || key === 'home.try.title' ? ['city'] : []),
          ...(base && /\.(?:zero|one|two)$/.test(key) ? ['count', 'kept', 'hours'] : []),
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

      // require complete CLDR plural forms for every plural family translated in this locale
      const familiesToCheck = complete ? pluralFamilies : translatedFamilies;
      for (const family of familiesToCheck) {
        for (const form of cldrForms) {
          const pluralKey = `${family}.${form}`;
          if (!strings[pluralKey]) {
            errors.push(`${rel}: missing CLDR plural form "${pluralKey}" for ${locale.code}`);
          }
        }
      }

      if (complete) {
        for (const key of englishKeys) {
          const base = pluralBaseOf(key);
          if (base && pluralFamilies.has(base)) { continue; }
          if (!strings[key]) {
            errors.push(`${rel}: missing key "${key}"`);
          }
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
    else if (complete) {
      errors.push(`${relative(root, stringsFile)}: missing strings.json`);
    }

    if (complete) {
      for (const englishFile of englishMarkdown) {
        const expectedTwin = englishFile.replace('/content/', `/content/translations/${dir}/`);
        if (!existsSync(expectedTwin)) {
          errors.push(`${relative(root, expectedTwin)}: missing translated twin`);
        }
      }
    }

    if (!existsSync(localeRoot)) { continue; }
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
      if (twinEntry.error) {
        errors.push(`${rel}: invalid YAML frontmatter: ${twinEntry.error}`);
        continue;
      }
      const isExample = rel.includes('/examples/');

      // required frontmatter fields match what Doc.astro and Example.astro render without crashing
      if (!String(twinEntry.data.title ?? '').trim()) {
        errors.push(`${rel}: missing required frontmatter "title"`);
      }
      if (isExample) {
        if (!String(twinEntry.data.description ?? '').trim()) {
          errors.push(`${rel}: missing required frontmatter "description"`);
        }
        const expectedTry = Array.isArray(englishEntry.data.try) ? englishEntry.data.try.length : 0;
        if (
          !Array.isArray(twinEntry.data.try)
          || twinEntry.data.try.length !== expectedTry
          || twinEntry.data.try.some((step) => !String(step ?? '').trim())
        ) {
          errors.push(`${rel}: frontmatter "try" must be a list of ${expectedTry} non-empty step(s)`);
        }
      }
      else if (!String(twinEntry.data.lede ?? '').trim()) {
        errors.push(`${rel}: missing required frontmatter "lede"`);
      }

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

      // table count parity preserves rehype-docs.js Type column styling by table index
      const twinTables = typeColumnsOf(twinRaw).length;
      const englishTables = typeColumnsOf(englishRaw).length;
      if (twinTables !== englishTables) {
        errors.push(`${rel}: table count (${twinTables}) != english (${englishTables})`);
      }

      // container directive order and literal true/false cells in :::truth tables
      const twinDirectives = directivesOf(twinEntry.body);
      const englishDirectives = directivesOf(englishEntry.body);
      if (twinDirectives.join(',') !== englishDirectives.join(',')) {
        errors.push(`${rel}: directive sequence (${twinDirectives.join(',')}) != english (${englishDirectives.join(',')})`);
      }
      const twinTruth = truthBooleansOf(twinEntry.body);
      const englishTruth = truthBooleansOf(englishEntry.body);
      if (twinTruth !== englishTruth) {
        errors.push(`${rel}: :::truth literal true/false count (${twinTruth}) != english (${englishTruth})`);
      }

      // keep :kind[...] badges, locale="..." variant tabs, and root-relative links intact
      const twinKinds = kindsOf(twinEntry.body);
      const englishKinds = kindsOf(englishEntry.body);
      if (twinKinds.join(',') !== englishKinds.join(',')) {
        errors.push(`${rel}: :kind[...] sequence (${twinKinds.join(',')}) != english (${englishKinds.join(',')})`);
      }
      const twinTabs = localeTabsOf(twinEntry.body);
      const englishTabs = localeTabsOf(englishEntry.body);
      if (twinTabs.join(',') !== englishTabs.join(',')) {
        errors.push(`${rel}: locale="..." tabs (${twinTabs.join(',')}) != english (${englishTabs.join(',')})`);
      }
      for (const badHref of doublePrefixedLinksOf(twinEntry.body)) {
        errors.push(`${rel}: link "${badHref}" includes a locale prefix (use root-relative paths)`);
      }

      // params and returns fenced YAML blocks must parse and preserve API schema keys
      const yamlLangs = new Set(['params', 'returns']);
      const twinBlocks = fencesOf(twinEntry.body, yamlLangs);
      const englishBlocks = fencesOf(englishEntry.body, yamlLangs);
      if (
        twinBlocks.length !== englishBlocks.length
        || twinBlocks.some((block, i) => block.lang !== englishBlocks[i].lang)
      ) {
        errors.push(
          `${rel}: params/returns block sequence (${twinBlocks.map((b) => b.lang).join(',')}) != english (${
            englishBlocks.map((b) => b.lang).join(',')
          })`,
        );
      }
      else {
        const seen = { params: 0, returns: 0 };
        for (let i = 0; i < twinBlocks.length; i++) {
          const lang = twinBlocks[i].lang;
          const index = ++seen[lang];
          let twinParsed;
          let englishParsed;
          try {
            twinParsed = parseYaml(twinBlocks[i].value);
            englishParsed = parseYaml(englishBlocks[i].value);
          }
          catch (err) {
            errors.push(`${rel}: invalid YAML in \`\`\`${lang} block #${index}: ${err.message}`);
            continue;
          }
          if (lang === 'params') {
            if (JSON.stringify(paramShape(twinParsed)) !== JSON.stringify(paramShape(englishParsed))) {
              errors.push(`${rel}: \`\`\`params block #${index} schema differs from english`);
            }
          }
          else {
            if (String(twinParsed?.type ?? '') !== String(englishParsed?.type ?? '')) {
              errors.push(
                `${rel}: \`\`\`returns block #${index} type ("${twinParsed?.type ?? ''}") != english ("${englishParsed?.type ?? ''}")`,
              );
            }
            if (Boolean(String(twinParsed?.description ?? '').trim()) !== Boolean(String(englishParsed?.description ?? '').trim())) {
              errors.push(`${rel}: \`\`\`returns block #${index} missing description`);
            }
          }
        }
      }
    }
  }

  return { errors, warnings, pruned, keyCount: englishKeys.size, localeCount: localeDirs.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  const locales = argv
    .filter((arg) => arg.startsWith('--locale='))
    .flatMap((arg) => arg.slice('--locale='.length).split(','))
    .filter(Boolean);
  const { errors, warnings, pruned, keyCount, localeCount } = checkI18n({
    prune: args.has('--prune'),
    strict: args.has('--strict'),
    complete: args.has('--complete'),
    locales: locales.length ? locales : null,
  });
  pruned.forEach((line) => console.log(`  - ${line}`));
  warnings.forEach((line) => console.warn(`  ! ${line}`));
  if (errors.length) {
    errors.forEach((error) => console.error(`  x ${error}`));
    process.exit(1);
  }
  console.log(`i18n  ok (${keyCount} keys, ${localeCount} locales)`);
}
