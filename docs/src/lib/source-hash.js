import { createHash } from 'node:crypto';

// hashes only prose frontmatter fields and markdown body so non-prose edits do not mark translations stale.
// CLI usage: node src/lib/source-hash.js src/content/docs/<page>.md
const WORDS = ['title', 'lede', 'description', 'try'];

export const sourceHash = ({ data, body }) =>
  createHash('sha256')
    .update(JSON.stringify(WORDS.map((field) => data[field] ?? null)))
    .update(body.trim())
    .digest('hex').slice(0, 12);

if (process.argv[1]?.endsWith('source-hash.js')) {
  const { readFileSync } = await import('node:fs');
  const { parse } = await import('yaml');
  for (const file of process.argv.slice(2)) {
    const [, front, body] = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    console.log(`${sourceHash({ data: parse(front), body })}  ${file}`);
  }
}
