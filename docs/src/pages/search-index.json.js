import { getCollection, render } from 'astro:content';

import { SECTIONS } from '../lib/nav.js';

// fallback search index for astro dev because Pagefind only runs against built HTML output
const plain = (md) =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^:::.*$/gm, ' ')
    .replace(/:kind\[[^\]]*\]/g, '')
    .replace(/[`*_>|#]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

export async function GET() {
  const entries = await getCollection('docs');
  const index = await Promise.all(entries.map(async (entry) => {
    const { headings } = await render(entry);
    const [sectionKey] = entry.id.split('/');
    const section = SECTIONS.find((s) => s.key === sectionKey);
    const group = section.groups.find((g) => g.items.some((it) => it.slug === entry.id));
    // skip fenced blocks when splitting on ##/### so code comments stay aligned with render(entry) headings
    const parts = [];
    let inFence = false;
    for (const line of entry.body.split('\n')) {
      if (line.startsWith('```')) { inFence = !inFence; }
      if (!inFence && /^#{2,3} /.test(line)) { parts.push([]); }
      else { parts.at(-1)?.push(line); }
    }
    const heads = headings.filter((h) => h.depth === 2 || h.depth === 3);
    return {
      section: section.label,
      title: entry.data.title,
      url: `/${entry.id}/`,
      crumb: group?.label ?? section.label,
      symbol: !!entry.data.kind,
      sections: heads.map((h, i) => ({ heading: h.text, anchor: h.slug, text: plain((parts[i] ?? []).join('\n')) })),
    };
  }));
  return new Response(JSON.stringify(index), { headers: { 'content-type': 'application/json' } });
}
