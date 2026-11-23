// generate Open Graph share cards at /og/index.png and /og/<slug>.png
import { getCollection } from 'astro:content';

import { SECTIONS } from '../../lib/nav.js';
import { renderCard } from '../../lib/og.js';

const SECTION_LABEL = { guides: 'Guide', api: 'API reference', plugins: 'Plugin' };

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  const examples = await getCollection('examples');
  return [
    {
      params: { slug: 'index' },
      props: {
        title: 'Dates written in natural language',
        lede: "Immutable dates, times, time zones, durations, and ranges on the browser's Temporal and Intl APIs.",
      },
    },
    {
      params: { slug: 'plugins' },
      props: {
        title: 'Plugins',
        section: 'Plugins',
        lede: 'Opt-in subpath modules for city time zones, lenient parsing, and legacy Date methods.',
      },
    },
    {
      params: { slug: 'examples' },
      props: {
        title: 'Examples',
        section: 'Examples',
        lede: 'Interactive examples running live in the browser across time zones, durations, calendars, and locales.',
      },
    },
    {
      params: { slug: 'changelog' },
      props: {
        title: 'Changelog',
        section: 'Releases',
        lede: 'Release notes for native-dates, @native-dates/core, @native-dates/plugins, and @native-dates/polyfill.',
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
    ...examples.map((e) => ({
      params: { slug: `examples/${e.id}` },
      props: {
        title: e.data.title,
        lede: e.data.description,
        section: 'Example',
      },
    })),
  ];
}

export async function GET({ props }) {
  return new Response(await renderCard(props), { headers: { 'content-type': 'image/png' } });
}
