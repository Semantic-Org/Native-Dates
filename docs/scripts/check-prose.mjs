// verify English guides and translated guide twins stay within corpus prose density,
// paragraph length, code-fence cadence, and inline-chip limits (workflows/docs-writing.md)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const contentDir = resolve(root, 'src/content');
const guidesDir = resolve(contentDir, 'docs/guides');
const translationsDir = resolve(contentDir, 'translations');

const LANGUAGE_GUIDE_SLUGS = new Set([
  'japanese',
  'chinese',
  'korean',
  'arabic',
  'russian',
  'spanish',
  'portuguese',
  'french',
]);

const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
const WIDE_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\uFF00-\uFFEF]/u;
const visualCols = (line) => [...line].reduce((n, ch) => n + (WIDE_RE.test(ch) ? 2 : 1), 0);

function analyzeGuide(file) {
  const raw = readFileSync(file, 'utf8');
  const body = raw.replace(/^---[\s\S]*?---\n+/, '');
  const lines = body.split('\n');

  let inFence = false;
  let inCallout = false;
  let fences = 0;
  let fenceLines = 0;
  let callouts = 0;
  const headingBackticks = [];
  const thBackticks = [];
  const calloutBackticks = [];
  const longSpans = [];
  const wideFenceLines = [];
  const paras = [];
  let cur = [];

  const flush = () => {
    if (cur.length && !inCallout) { paras.push(cur.join(' ')); }
    cur = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      flush();
      inFence = !inFence;
      if (inFence) { fences++; }
      continue;
    }
    if (inFence) {
      fenceLines++;
      const cols = visualCols(line);
      if (cols > 84) { wideFenceLines.push(`L${i + 1} (${cols} cols)`); }
      continue;
    }
    if (line.startsWith(':::')) {
      flush();
      if (line.trim() === ':::') {
        inCallout = false;
      }
      else {
        inCallout = true;
        callouts++;
        if (line.includes('`')) { calloutBackticks.push(`L${i + 1}`); }
      }
      continue;
    }
    if (/^#{2,6}\s/.test(line)) {
      flush();
      if (line.includes('`')) { headingBackticks.push(`L${i + 1}`); }
      continue;
    }
    if (line.startsWith('|')) {
      flush();
      if (lines[i + 1] && /^\|\s*:?-/.test(lines[i + 1]) && line.includes('`')) {
        thBackticks.push(`L${i + 1}`);
      }
      for (const m of line.matchAll(/`([^`]+)`/g)) {
        if (m[1].length > 32) { longSpans.push(`L${i + 1} (${m[1].length}c): ${m[1]}`); }
      }
      continue;
    }
    if (!line.trim() || /^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      flush();
      for (const m of line.matchAll(/`([^`]+)`/g)) {
        if (m[1].length > 32) { longSpans.push(`L${i + 1} (${m[1].length}c): ${m[1]}`); }
      }
      continue;
    }
    cur.push(line.trim());
  }
  flush();

  let parens = 0;
  const spanCounts = paras.map((p) => {
    const spans = [...p.matchAll(/`([^`]+)`/g)];
    for (const m of spans) {
      if (m[1].length > 32) { longSpans.push(`(${m[1].length}c): ${m[1]}`); }
    }
    const stripped = p.replace(/`[^`]+`/g, 'CODE').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    parens += (stripped.match(/\([^)]+\)|（[^）]+）/g) ?? []).length;
    return spans.length;
  });

  const sorted = [...spanCounts].sort((a, b) => a - b);
  const pCount = paras.length || 1;
  const meanCode = spanCounts.reduce((a, b) => a + b, 0) / pCount;
  const medCode = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const maxCode = sorted.at(-1) ?? 0;
  const pct0to2 = spanCounts.filter((c) => c <= 2).length / pCount;

  const proseClean = paras
    .map((p) => p.replace(/`[^`]+`/g, 'CODE').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'))
    .join(' ');
  const cjk = (proseClean.match(CJK_RE) ?? []).length;
  const proseWords = proseClean.replace(CJK_RE, ' ').trim().split(/\s+/).filter(Boolean).length;

  return {
    p: paras.length,
    fences,
    avgFenceLines: fences ? fenceLines / fences : 0,
    callouts,
    proseWords,
    cjk,
    wordsPerP: proseWords / pCount,
    cjkPerP: cjk / pCount,
    parensPerP: parens / pCount,
    meanCode,
    medCode,
    maxCode,
    pct0to2,
    headingBackticks,
    thBackticks,
    calloutBackticks,
    longSpans,
    wideFenceLines,
  };
}

const errors = [];
const checkCommon = (rel, stats, { strictSpans = false } = {}) => {
  if (stats.headingBackticks.length) {
    errors.push(`${rel}: backticks in heading at ${stats.headingBackticks.join(', ')}`);
  }
  if (stats.thBackticks.length) {
    errors.push(`${rel}: backticks in <th> at ${stats.thBackticks.join(', ')}`);
  }
  if (stats.calloutBackticks.length) {
    errors.push(`${rel}: backticks in callout title at ${stats.calloutBackticks.join(', ')}`);
  }
  if (strictSpans) {
    if (stats.longSpans.length) {
      errors.push(`${rel}: inline code > 32 chars: ${stats.longSpans.join('; ')}`);
    }
    if (stats.maxCode > 3) {
      errors.push(`${rel}: paragraph has ${stats.maxCode} inline code spans (max 3)`);
    }
    if (stats.meanCode > 1.45) {
      errors.push(`${rel}: mean inline code/p ${stats.meanCode.toFixed(2)} > 1.45`);
    }
    if (stats.pct0to2 < 0.85) {
      errors.push(`${rel}: ${(stats.pct0to2 * 100).toFixed(0)}% paragraphs with 0-2 code spans (< 85%)`);
    }
    if (stats.parensPerP > 0.18) {
      errors.push(`${rel}: parentheticals/p ${stats.parensPerP.toFixed(2)} > 0.18`);
    }
    if (stats.wideFenceLines.length) {
      errors.push(`${rel}: code fence line > 84 visual cols at ${stats.wideFenceLines.join(', ')}`);
    }
  }
};

const englishStats = new Map();
for (const name of readdirSync(guidesDir).filter((f) => f.endsWith('.md')).sort()) {
  const slug = name.slice(0, -3);
  const full = resolve(guidesDir, name);
  const rel = relative(root, full);
  const stats = analyzeGuide(full);
  englishStats.set(slug, stats);

  const isLangGuide = LANGUAGE_GUIDE_SLUGS.has(slug);
  checkCommon(rel, stats, { strictSpans: isLangGuide });
  if (stats.wordsPerP > 26.5) {
    errors.push(`${rel}: mean words/paragraph ${stats.wordsPerP.toFixed(1)} > 26.5`);
  }
  if (isLangGuide) {
    if (stats.p < 10 || stats.p > 16) {
      errors.push(`${rel}: language guide has ${stats.p} paragraphs (expected 10-16)`);
    }
    if (stats.proseWords > 410) {
      errors.push(`${rel}: language guide has ${stats.proseWords} prose words (max 410)`);
    }
    if (stats.avgFenceLines > 10.0) {
      errors.push(`${rel}: mean code fence length ${stats.avgFenceLines.toFixed(1)} lines > 10.0`);
    }
    if (stats.callouts > 1) {
      errors.push(`${rel}: language guide has ${stats.callouts} callouts (max 1)`);
    }
  }
}

let twinCount = 0;
if (existsSync(translationsDir)) {
  for (const dir of readdirSync(translationsDir).sort()) {
    const trGuidesDir = resolve(translationsDir, dir, 'docs/guides');
    if (!existsSync(trGuidesDir) || !statSync(trGuidesDir).isDirectory()) { continue; }
    for (const name of readdirSync(trGuidesDir).filter((f) => f.endsWith('.md')).sort()) {
      twinCount++;
      const slug = name.slice(0, -3);
      const full = resolve(trGuidesDir, name);
      const rel = relative(root, full);
      const stats = analyzeGuide(full);
      const en = englishStats.get(slug);
      checkCommon(rel, stats, { strictSpans: true });
      if (!en) { continue; }

      if (Math.abs(stats.p - en.p) > 2) {
        errors.push(`${rel}: paragraph count ${stats.p} drifts from English (${en.p}) by > 2`);
      }
      if (LANGUAGE_GUIDE_SLUGS.has(slug) && stats.p > 16) {
        errors.push(`${rel}: language guide has ${stats.p} paragraphs (max 16)`);
      }
      if (stats.fences !== en.fences) {
        errors.push(`${rel}: code fence count ${stats.fences} != English (${en.fences})`);
      }
      if (stats.avgFenceLines > 10.0) {
        errors.push(`${rel}: mean code fence length ${stats.avgFenceLines.toFixed(1)} lines > 10.0`);
      }

      if (dir === 'zh-cn') {
        const ratio = stats.cjk / (en.proseWords || 1);
        if (ratio > 2.75) {
          errors.push(`${rel}: CJK/en-word ratio ${ratio.toFixed(2)} > 2.75 (wordy translation)`);
        }
        if (stats.cjkPerP > 68) {
          errors.push(`${rel}: mean CJK chars/paragraph ${stats.cjkPerP.toFixed(0)} > 68`);
        }
      }
      else if (dir === 'ja') {
        const ratio = stats.cjk / (en.proseWords || 1);
        if (ratio > 3.55) {
          errors.push(`${rel}: CJK+kana/en-word ratio ${ratio.toFixed(2)} > 3.55 (wordy translation)`);
        }
        if (stats.cjkPerP > 92) {
          errors.push(`${rel}: mean CJK+kana chars/paragraph ${stats.cjkPerP.toFixed(0)} > 92`);
        }
      }
      else if (dir === 'ko') {
        const ratio = stats.proseWords / (en.proseWords || 1);
        if (ratio > 0.95) {
          errors.push(`${rel}: Korean word ratio ${ratio.toFixed(2)} > 0.95 (stiff translation)`);
        }
        if (stats.wordsPerP > 20.5) {
          errors.push(`${rel}: mean Korean 어절/paragraph ${stats.wordsPerP.toFixed(1)} > 20.5`);
        }
      }
      else if (dir === 'ru' || dir === 'ar') {
        const ratio = stats.proseWords / (en.proseWords || 1);
        if (ratio > 1.08) {
          errors.push(`${rel}: word ratio ${ratio.toFixed(2)} > 1.08 vs English`);
        }
        if (stats.wordsPerP > 25.0) {
          errors.push(`${rel}: mean words/paragraph ${stats.wordsPerP.toFixed(1)} > 25.0`);
        }
      }
      else {
        // Romance / Latin scripts (es, pt-br, fr, etc.)
        const ratio = stats.proseWords / (en.proseWords || 1);
        if (ratio > 1.15) {
          errors.push(`${rel}: word ratio ${ratio.toFixed(2)} > 1.15 vs English`);
        }
        if (stats.wordsPerP > 26.5) {
          errors.push(`${rel}: mean words/paragraph ${stats.wordsPerP.toFixed(1)} > 26.5`);
        }
      }
    }
  }
}

if (errors.length) {
  errors.forEach((e) => console.error(`  x ${e}`));
  process.exit(1);
}
console.log(`prose ok (${englishStats.size} guides, ${twinCount} translated twins)`);
