// an example's files, read at build: every file in its folder but example.md, as text
const RAW = import.meta.glob('../content/examples/*/*', { query: '?raw', import: 'default', eager: true });

// the zone picked in the preview's bar reaches an example as ?zone=, a sandbox detail the example's
// code shouldn't carry: this module, imported first and folded away in app.js, makes it the default
// zone before the app's own code runs. it loads the polyfill first, which only downloads Temporal in
// a browser that lacks it, so an example runs in Safari without saying so in its own code
const SANDBOX = `import '@native-dates/polyfill';
import { configure } from 'native-dates';

const zone = new URLSearchParams(location.search).get('zone');
if (zone) { configure({ zone }); }
`;

export function filesFor(slug) {
  const files = { 'sandbox.js': SANDBOX };
  for (const [path, content] of Object.entries(RAW)) {
    const [, folder, name] = path.match(/examples\/([^/]+)\/([^/]+)$/) ?? [];
    if (folder === slug && name !== 'example.md') { files[name] = content; }
  }
  return files;
}
