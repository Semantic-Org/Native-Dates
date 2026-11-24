import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { afterEach, describe, expect, it } from 'vitest';

import { checkI18n } from '../docs/scripts/check-i18n.mjs';
import { headingsOf, typeColumnsOf } from '../docs/src/lib/markdown/i18n.js';
import { rehypeDocs } from '../docs/src/lib/markdown/rehype-docs.js';
import { remarkDocs } from '../docs/src/lib/markdown/remark-docs.js';
import { sourceHash } from '../docs/src/lib/source-hash.js';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '../docs');
const temps = [];

function makeTempDocs() {
  const root = mkdtempSync(join(tmpdir(), 'native-dates-i18n-'));
  temps.push(root);
  cpSync(resolve(docsRoot, 'src/content/strings.json'), resolve(root, 'src/content/strings.json'));
  cpSync(resolve(docsRoot, 'src/content/translations'), resolve(root, 'src/content/translations'), { recursive: true });
  return root;
}

afterEach(() => {
  while (temps.length) {
    rmSync(temps.pop(), { recursive: true, force: true });
  }
});

describe('docs markdown i18n plugins', () => {
  it('extracts stable English heading IDs and Type column indices', () => {
    const errorsMd = readFileSync(resolve(docsRoot, 'src/content/docs/api/errors.md'), 'utf8');
    const headings = headingsOf(errorsMd);
    expect(headings.some((h) => h.depth === 3 && h.id === 'units-zones-and-formats')).toBe(true);

    const dateTimeMd = readFileSync(resolve(docsRoot, 'src/content/docs/api/date-time.md'), 'utf8');
    expect(typeColumnsOf(dateTimeMd)).toEqual([1, 1]);
  });

  it('inherits English heading IDs and Type column styling on translated pages', async () => {
    const englishPath = resolve(docsRoot, 'src/content/docs/guides/formatting.md');
    const englishRaw = readFileSync(englishPath, 'utf8');
    const englishHeadings = headingsOf(englishRaw);

    const translatedMarkdown = [
      ...englishHeadings.map((h, i) => `${'#'.repeat(h.depth)} 見出し ${i + 1}`),
      '',
      '詳しくは [トークン](/guides/formatting/#token-patterns) を参照してください。',
      '',
      '```params',
      '- name: zone',
      '  type: Zone',
      '  required: true',
      '  default: "UTC"',
      '  description: タイムゾーン名。',
      '  options:',
      '    - name: strict',
      '      type: boolean',
      '      description: 厳密モード。',
      '```',
    ].join('\n');

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkDocs)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeHeadingIds)
      .use(rehypeDocs)
      .use(rehypeStringify, { allowDangerousHtml: true });

    const file = await processor.process({
      value: translatedMarkdown,
      path: resolve(docsRoot, 'src/content/translations/ja/docs/guides/formatting.md'),
    });
    const html = String(file);

    expect(html).toContain('id="token-patterns"');
    expect(html).toContain('id="relative-phrases"');
    expect(html).toContain('href="/ja/guides/formatting/#token-patterns"');
    expect(html).toContain('1 option</summary>');
    expect(html).toContain('default <code>UTC</code>');
  });

  it('applies .t type styling to translated table headers using the English twin column index', async () => {
    const translatedMarkdown = [
      '| プロパティ | 型 | 説明 |',
      '|---|---|---|',
      '| `year` | `number` | 西暦年。 |',
    ].join('\n');

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkDocs)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeHeadingIds)
      .use(rehypeDocs)
      .use(rehypeStringify, { allowDangerousHtml: true });

    const file = await processor.process({
      value: translatedMarkdown,
      path: resolve(docsRoot, 'src/content/translations/ja/docs/api/date-time.md'),
    });
    const html = String(file);

    expect(html).toContain('data-label="型"><code class="t">number</code>');
    expect(html).toContain('data-label="プロパティ"><code>year</code>');
  });
});

describe('check-i18n', () => {
  it('flags orphaned keys, orphaned twins, stale hashes, and heading mismatches, and prunes orphans with --prune', () => {
    const root = makeTempDocs();
    const jaStringsPath = resolve(root, 'src/content/translations/ja/strings.json');
    const jaStrings = JSON.parse(readFileSync(jaStringsPath, 'utf8'));
    jaStrings['obsolete.key'] = '古いキー';
    writeFileSync(jaStringsPath, JSON.stringify(jaStrings, null, 2));

    // add an English doc plus a stale, heading-mismatched twin and an orphaned twin
    const enDocDir = resolve(root, 'src/content/docs/guides');
    const jaDocDir = resolve(root, 'src/content/translations/ja/docs/guides');
    mkdirSync(enDocDir, { recursive: true });
    mkdirSync(jaDocDir, { recursive: true });

    const englishBody = '## First\n\nBody text.\n\n## Second\n\nMore text.\n';
    const englishMd = `---\ntitle: Sample\nlede: Summary.\nupdated: 2026-11-23\n---\n\n${englishBody}`;
    writeFileSync(resolve(enDocDir, 'sample.md'), englishMd);

    const staleHash = '000000000000';
    const goodHash = sourceHash({ data: { title: 'Sample', lede: 'Summary.' }, body: englishBody });
    writeFileSync(
      resolve(jaDocDir, 'sample.md'),
      `---\nsource: ${staleHash}\ntitle: サンプル\nlede: 概要。\n---\n\n## 最初だけ\n\n本文。\n`,
    );
    const orphanPath = resolve(jaDocDir, 'deleted.md');
    writeFileSync(orphanPath, '---\nsource: abcdef123456\ntitle: 削除済み\n---\n\n本文。\n');

    const check = checkI18n({ root, srcRoot: resolve(docsRoot, 'src') });
    expect(check.errors.some((e) => e.includes('obsolete.key'))).toBe(true);
    expect(check.errors.some((e) => e.includes('deleted.md') && e.includes('orphaned'))).toBe(true);
    expect(check.errors.some((e) => e.includes('sample.md') && e.includes('heading structure'))).toBe(true);
    expect(check.warnings.some((w) => w.includes('sample.md') && w.includes(goodHash))).toBe(true);

    const strictCheck = checkI18n({ root, srcRoot: resolve(docsRoot, 'src'), strict: true });
    expect(strictCheck.errors.some((e) => e.includes('sample.md') && e.includes('stale source hash'))).toBe(true);

    // fix sample.md headings and hash, then run prune
    writeFileSync(
      resolve(jaDocDir, 'sample.md'),
      `---\nsource: ${goodHash}\ntitle: サンプル\nlede: 概要。\n---\n\n## 最初\n\n本文。\n\n## 次\n\n続き。\n`,
    );
    const pruned = checkI18n({ root, srcRoot: resolve(docsRoot, 'src'), prune: true });
    expect(pruned.errors).toEqual([]);
    expect(pruned.warnings).toEqual([]);
    expect(pruned.pruned.some((p) => p.includes('obsolete.key'))).toBe(true);
    expect(pruned.pruned.some((p) => p.includes('deleted.md'))).toBe(true);
    expect(existsSync(orphanPath)).toBe(false);
    expect(JSON.parse(readFileSync(jaStringsPath, 'utf8'))['obsolete.key']).toBeUndefined();
  });
});
