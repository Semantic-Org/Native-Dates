// a share card for every page: /og/index.png for the homepage, /og/<page id>.png for the rest
import { getCollection } from 'astro:content';

import { SECTIONS } from '../../lib/nav.js';
import { renderCard } from '../../lib/og.js';

const SECTION_LABEL = { guides: 'Guide', api: 'API reference', plugins: 'Plugin' };

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return [
    {
      params: { slug: 'index' },
      props: {
        title: 'Temporal, spoken plainly',
        lede: 'Dates, times, zones and durations on the calendar your browser already ships.',
      },
    },
    {
      params: { slug: 'plugins' },
      props: {
        title: 'Plugins',
        section: 'Plugins',
        lede: 'Each plugin adds one more thing when you import it, so you ship only the ones you use.',
      },
    },
    ...entries.map((e) => ({
      params: { slug: e.id },
      props: {
        title: e.data.title,
        lede: e.data.lede,
        section: SECTION_LABEL[e.id.split('/')[0]] ?? SECTIONS[0].label,
        symbol: !!e.data.kind,
      },
    })),
  ];
}

export async function GET({ props }) {
  return new Response(await renderCard(props), { headers: { 'content-type': 'image/png' } });
}
