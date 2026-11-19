import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

// minified for production, as an app is shipped
const bundled = async (entry) => {
  const bundle = await build({
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'app',
    write: false,
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
    stdin: { contents: entry, resolveDir: fileURLToPath(new URL('.', import.meta.url)) },
  });
  return vm.runInThisContext(`(() => { ${bundle.outputFiles[0].text}\nreturn app; })()`);
};

const reader = `
  import { date } from 'native-dates';
  export const read = (text) => date(text, { loose: true })?.toString() ?? null;
`;

describe('@native-dates/plugins/loose in a production bundle', () => {
  let withPlugin;
  let withoutPlugin;

  beforeAll(async () => {
    withPlugin = await bundled(`import '@native-dates/plugins/loose';${reader}`);
    withoutPlugin = await bundled(reader);
  }, 30_000);

  // the import names nothing, so a bundler keeps it only because the package lists the file as having side effects
  it('is still installed by an import that names nothing', () => {
    expect(withPlugin.read('Sep 6, 2026')).toBe('2026-09-06');
    expect(withPlugin.read('TBD')).toBeNull();
  });

  it('still throws missingPlugin at loose when the app never imports it', () => {
    expect(() => withoutPlugin.read('Sep 6, 2026')).toThrowError(
      expect.objectContaining({ name: 'RangeError', code: 'missingPlugin', at: 'loose' }),
    );
  });
});
