// the plugins, one list for the landing page, the sidebar and the homepage table. a plugin's words are
// in content/strings.json: its description (plugins.<name>.description) and its category's name
// (plugins.category.<category>). sizes are measured at build, and the build checks this list against
// the package's plugins folder (views/Plugins.astro), so a plugin that moves into core is deleted here.
//
// uses and line are the plugin's part of a setup: the factories its line calls, and one line that
// only works with the plugin imported

export const PLUGINS = [
  { name: 'ranges', category: 'spans', uses: ['today'], line: "const sprint = today().to(2, 'weeks');" },
  { name: 'tokens', category: 'formatting', uses: ['today'], line: "today().format('YYYY-MM-DD');" },
  { name: 'relative', category: 'formatting', uses: ['now'], line: "now().minus(3, 'hours').formatRelative();" },
  { name: 'zones', category: 'zones', uses: ['now'], line: "now().in('Berlin');" },
  { name: 'loose', category: 'reading', uses: ['date'], line: "date('March 5, 2026', { loose: true });" },
  { name: 'legacy-date', category: 'migration', uses: ['now'], line: 'now().getFullYear();' },
];

// a sketch: the package ships no presets yet. populate PRESETS once preset packages publish
export const PRESETS = [];

// the preset that is exactly these plugins
export const presetFor = (names) =>
  PRESETS.find((preset) => preset.plugins.length === names.length && preset.plugins.every((n) => names.includes(n)));

// the setup for a set of plugins: one import per plugin, for its effect, beside the factories its
// lines call. a set that is a preset imports from the preset instead.
// hint is the comment an empty setup carries, in the page's language (plugins.sample.empty)
export function sampleFor(names, hint) {
  const picked = PLUGINS.filter((p) => names.includes(p.name));
  const uses = [...new Set(picked.flatMap((p) => p.uses))].sort();
  const preset = presetFor(picked.map((p) => p.name));
  if (!picked.length) { return `// ${hint}\nimport { today } from 'native-dates';\n\ntoday();`; }
  const imports = preset
    ? [`import { ${uses.join(', ')} } from '@native-dates/${preset.name}';`]
    : [...picked.map((p) => `import '@native-dates/plugins/${p.name}';`), `import { ${uses.join(', ')} } from 'native-dates';`];
  return [...imports, '', ...picked.map((p) => p.line)].join('\n');
}
