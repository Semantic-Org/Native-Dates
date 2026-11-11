// /llms.txt: the docs for an assistant, in the sidebar's order. each written page links to its
// markdown (/<page>.md) with its lede; examples link to their pages, which run live
import { getCollection } from 'astro:content';

import { SECTIONS } from '../lib/nav.js';

export async function GET({ site }) {
  const docs = new Map((await getCollection('docs')).map((e) => [e.id, e]));
  const examples = new Map((await getCollection('examples')).map((e) => [`examples/${e.id}`, e]));
  const url = (path) => new URL(path, site).href;

  const sections = SECTIONS.map((section) => {
    const seen = new Set();
    const lines = section.groups.flatMap((g) => g.items).flatMap(({ slug }) => {
      if (slug.includes('#') || seen.has(slug)) { return []; }
      seen.add(slug);
      const page = docs.get(slug);
      if (page) { return [`- [${page.data.title}](${url(`/${slug}.md`)}): ${page.data.lede}`]; }
      const example = examples.get(slug);
      if (example) { return [`- [${example.data.title}](${url(`/${slug}/`)}): ${example.data.description}`]; }
      return [];
    });
    return lines.length ? `## ${section.label}\n\n${lines.join('\n')}` : '';
  }).filter(Boolean);

  const body = `# native-dates

> A thin date library on the browser's Temporal and Intl APIs. Four nouns (DateTime, CalendarDate, Time, Duration) with plain-English verbs, frozen values and zero dependencies; plugins add the rest.

Every page below is also served as markdown at its path plus \`.md\`. The full docs in one file: ${url('/llms-full.txt')}

${sections.join('\n\n')}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
