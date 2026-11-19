const RAW = import.meta.glob('../content/examples/*/*', { query: '?raw', import: 'default', eager: true });

// imported first by app.js so the preview bar's ?zone= param configures the default zone
// and @native-dates/polyfill loads Temporal in browsers like Safari before example code runs
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
