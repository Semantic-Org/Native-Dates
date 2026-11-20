import { getCollection } from 'astro:content';

import { SECTIONS } from '../lib/nav.js';
import { shippedSkills } from '../lib/skills.js';

// links agent skills first, then docs pages to /<slug>.md and examples to /<slug>/
export async function GET({ site }) {
  const docs = new Map((await getCollection('docs')).map((e) => [e.id, e]));
  const examples = new Map((await getCollection('examples')).map((e) => [`examples/${e.id}`, e]));
  const url = (path) => new URL(path, site).href;

  const skillLines = shippedSkills().map((entry) =>
    `- [${entry.title}](${url(`/skills/${entry.skill}.md`)}): ${entry.description}`
  );
  const skillSection = skillLines.length ? [`## Agent Skills\n\n${skillLines.join('\n')}`] : [];

  const docSections = SECTIONS.map((section) => {
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

> A readable, immutable date and time library built on the browser's Temporal and Intl APIs with zero dependencies. Core includes zoned datetimes, calendar dates, times, durations, year-months, month-days, ranges, formatting, and relative time. Opt-in subpath plugins add city and abbreviation zones, loose parsing, and legacy Date methods.

Every page below is also served as markdown at its path plus \`.md\`. The full docs in one file: ${
    url('/llms-full.txt')
  }

${[...skillSection, ...docSections].join('\n\n')}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
