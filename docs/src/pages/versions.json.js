import { versions } from '../lib/versions.js';

// fetched cross-origin by archived vN.nativedates.dev sites so their version menus include newer majors
export function GET() {
  return new Response(`${JSON.stringify(versions(), null, 2)}\n`, { headers: { 'content-type': 'application/json' } });
}
