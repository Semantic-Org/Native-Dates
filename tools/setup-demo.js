// runs `npx native-dates` as a person would meet it, without publishing: packs this checkout, serves the tarballs
// from a registry on loopback, and starts npx in a throwaway project with an empty npm cache
//   npm run setup:demo              # a new empty project in the temp folder
//   npm run setup:demo -- --yes     # anything after -- goes to the command
//   DEMO_DIR=~/my-app npm run setup:demo   # an existing project instead

import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(join(tmpdir(), 'setup-demo-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// the git hooks `prepare` installs are not wanted from a demo
const pack = (...args) =>
  execFileSync(npm, ['pack', '--silent', '--pack-destination', scratch, ...args], {
    cwd: root,
    env: { ...process.env, SKIP_SIMPLE_GIT_HOOKS: '1' },
    shell: process.platform === 'win32',
  });
pack();
pack('--workspace', '@native-dates/core');

const tarballs = readdirSync(scratch).filter((file) => file.endsWith('.tgz')).map((file) => {
  const bytes = readFileSync(join(scratch, file));
  const manifest = JSON.parse(
    execFileSync('tar', ['-xzOf', join(scratch, file), 'package/package.json'], { encoding: 'utf8' }),
  );
  return { file, bytes, manifest };
});

const server = createServer((request, response) => {
  const path = decodeURIComponent(request.url.split('?')[0]).slice(1);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const named = tarballs.find(({ manifest }) => manifest.name === path);
  const file = tarballs.find((tarball) => path.endsWith(`/-/${tarball.file}`));
  if (named) {
    const { manifest, bytes } = named;
    const dist = {
      tarball: `${origin}/${manifest.name}/-/${named.file}`,
      shasum: createHash('sha1').update(bytes).digest('hex'),
      integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    };
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
      name: manifest.name,
      'dist-tags': { latest: manifest.version },
      versions: { [manifest.version]: { ...manifest, dist } },
    }));
  }
  else if (file) { response.writeHead(200, { 'content-type': 'application/octet-stream' }).end(file.bytes); }
  else { response.writeHead(404, { 'content-type': 'application/json' }).end('{"error":"not in the demo registry"}'); }
});

server.listen(0, '127.0.0.1', () => {
  const registry = `http://127.0.0.1:${server.address().port}`;
  const project = process.env.DEMO_DIR ? resolve(process.env.DEMO_DIR) : mkdtempSync(join(tmpdir(), 'demo-app-'));
  if (!process.env.DEMO_DIR) {
    writeFileSync(join(project, 'package.json'), '{\n  "name": "demo-app",\n  "private": true\n}\n');
  }
  console.log(`\n  demo project  ${project}\n  running       npx native-dates ${process.argv.slice(2).join(' ')}\n`);
  const child = spawn(['npx', 'native-dates', ...process.argv.slice(2)].join(' '), {
    cwd: project,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      npm_config_registry: registry,
      PNPM_CONFIG_REGISTRY: registry,
      npm_config_cache: join(scratch, 'npm-cache'),
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      npm_config_update_notifier: 'false',
    },
  });
  child.on('exit', (status) => {
    server.close();
    // the tarballs and the npm cache go, and the demo project stays to be looked at
    rmSync(scratch, { recursive: true, force: true });
    console.log(`  demo project  ${project}\n`);
    process.exitCode = status ?? 1;
  });
});
