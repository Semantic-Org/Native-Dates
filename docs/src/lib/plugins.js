// keep in sync with packages/plugins/src (checked in views/Plugins.astro), with copy keyed under
// plugins.<name>.description and plugins.category.<category> in content/strings.json
export const PLUGINS = [
  { name: 'zones', category: 'zones', uses: ['now'], line: "now().in('Berlin');" },
  { name: 'loose', category: 'reading', uses: ['date'], line: "date('March 5, 2026', { loose: true });" },
  { name: 'parse', category: 'reading', uses: ['date'], line: "date('24112026', { format: 'DDMMYYYY' });" },
  { name: 'legacy-date', category: 'migration', uses: ['now'], line: 'now().getFullYear();' },
];

export const PRESETS = [];

export const presetFor = (names) =>
  PRESETS.find((preset) => preset.plugins.length === names.length && preset.plugins.every((n) => names.includes(n)));

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
