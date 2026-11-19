import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

// a bundler that splits import() hands a browser the entry chunk first and the others only when asked
const chunksOf = async (app) => {
  const { metafile } = await build({
    stdin: { contents: app, resolveDir: import.meta.dirname },
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: 'chunks',
    write: false,
    metafile: true,
    logLevel: 'silent',
  });
  return Object.values(metafile.outputs);
};

const holdsPolyfill = (chunk) => Object.keys(chunk.inputs).some((file) => file.includes('temporal-polyfill'));

describe('@native-dates/polyfill bundled into an app', () => {
  it('keeps temporal-polyfill out of the entry chunk and in one fetched on request', async () => {
    const chunks = await chunksOf(`
      import '@native-dates/polyfill';
      import { today } from 'native-dates';
      console.log(today());
    `);
    const entry = chunks.find((chunk) => chunk.entryPoint === '<stdin>');
    expect(holdsPolyfill(entry)).toBe(false);
    expect(chunks.filter(holdsPolyfill)).toHaveLength(1);
  });
});
