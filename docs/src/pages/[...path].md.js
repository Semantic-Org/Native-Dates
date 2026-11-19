import { getCollection } from 'astro:content';

import { ENABLED, inLanguage, localePath } from '../lib/i18n.js';
import { markdownFor } from '../lib/page-markdown.js';

// serves each docs page as raw markdown (/guides/types-of-time.md, /ja/guides/types-of-time.md),
// falling back to English when a locale has no translation
export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return Promise.all(ENABLED.flatMap(({ code }) => entries.map(async (entry) => ({
    params: { path: localePath(`/${entry.id}`, code).slice(1) },
    props: { page: (await inLanguage(entry, code)).page },
  }))));
}

export function GET({ props }) {
  return new Response(markdownFor(props.page), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
