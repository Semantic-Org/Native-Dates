import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// vitest.config.js points the package names here
export const bundleDir = resolve(root, 'dist/test');

// core, its scoped name and every plugin are entries of one build that share chunks, so a plugin
// installs into the same core a test imports. minified for production, as npm run size measures it.
// built once per run, so a watch keeps testing the build it started with
export default async function setup() {
  await rm(bundleDir, { recursive: true, force: true });
  await build({
    absWorkingDir: root,
    entryPoints: ['src/index.js', 'packages/core/index.js', 'packages/plugins/src/*.js'],
    outbase: root,
    outdir: bundleDir,
    bundle: true,
    splitting: true,
    minify: true,
    format: 'esm',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
}
