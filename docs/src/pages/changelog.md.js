import { changelogData } from '../lib/changelog.js';

export function GET() {
  return new Response(changelogData().raw, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}
