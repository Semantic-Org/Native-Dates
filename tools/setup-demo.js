// runs `npx native-dates` as a person would meet it, without publishing: packs this checkout, serves the tarballs
// from a registry on loopback, and starts npx in a throwaway project with an empty npm cache
//   npm run setup:demo              # a new empty project in the temp folder
//   npm run setup:demo -- --yes     # anything after -- goes to the command
//   DEMO_DIR=~/my-app npm run setup:demo   # an existing project instead
//   DEMO_INSTALLED=older npm run setup:demo                  # a project that has an older copy, skills included
//   DEMO_INSTALLED=older-without-skills npm run setup:demo   # an older copy from before skills were packaged
//   DEMO_INSTALLED=newer npm run setup:demo                  # a copy newer than this checkout
//   DEMO_AGENTS=claude npm run setup:demo                    # which coding agents the command finds (default claude,codex,agy)
//   DEMO_AGENTS=none npm run setup:demo                      # none found, so it never asks where the skills go
//
// the agents are stand-ins that record what they are asked to run and install nothing. the command also runs with
// a throwaway home and a path that holds only the stand-ins, node and the system folders, so choosing
// a global install here cannot reach a real agent or its configuration

import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(join(tmpdir(), 'setup-demo-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// the git hooks `prepare` installs are not wanted from a demo
const pack = (...args) =>
  execFileSync(npm, ['pack', '--silent', '--pack-destination', scratch, ...args], {
    cwd: root,
    env: { ...process.env, SKIP_INSTALL_SIMPLE_GIT_HOOKS: '1' },
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
  // an earlier install: this checkout's package under another version, without its skills or bin for one that predates them
  // the newest command is then asked for by name, since npx would otherwise run the copy already in the project
  const state = process.env.DEMO_DIR ? undefined : process.env.DEMO_INSTALLED;
  const command = state ? 'native-dates@latest' : 'native-dates';
  if (state) {
    const { file, manifest } = tarballs.find((tarball) => tarball.manifest.name === 'native-dates');
    const [major, minor, patch] = manifest.version.split('.').map(Number);
    const version = state === 'newer'
      ? `${major}.${minor}.${patch + 1}`
      : `${major}.${minor}.${Math.max(patch - 1, 0)}`;
    const copy = join(project, 'node_modules/native-dates');
    mkdirSync(copy, { recursive: true });
    execFileSync('tar', ['-xzf', join(scratch, file), '--strip-components=1', '-C', copy]);
    writeFileSync(join(copy, 'package.json'), JSON.stringify({ ...manifest, version }, null, 2));
    if (state === 'older-without-skills') {
      rmSync(join(copy, 'skills'), { recursive: true, force: true });
      rmSync(join(copy, 'bin'), { recursive: true, force: true });
    }
    const dependencies = { 'native-dates': `^${version}` };
    writeFileSync(
      join(project, 'package.json'),
      `${JSON.stringify({ name: 'demo-app', private: true, dependencies }, null, 2)}\n`,
    );
    console.log(
      `\n  installed     native-dates ${version}${state === 'older-without-skills' ? ', with no skills' : ''}`,
    );
  }
  // stand-in agents first on a path that leaves out wherever the real ones live
  const agents = (process.env.DEMO_AGENTS ?? 'claude,codex,agy').split(',').filter((agent) =>
    agent && agent !== 'none'
  );
  const standIns = join(scratch, 'agents');
  const agentCalls = join(scratch, 'agent-calls.log');
  mkdirSync(standIns);
  writeFileSync(agentCalls, '');
  for (const agent of agents) {
    const line = `require('node:fs').appendFileSync(${
      JSON.stringify(agentCalls)
    }, '${agent} ' + process.argv.slice(2).join(' ') + '\\n');`;
    writeFileSync(join(standIns, agent), `#!/usr/bin/env node\n${line}\n`);
    chmodSync(join(standIns, agent), 0o755);
  }
  // node and the package managers by links of their own, since the folders they live in can hold agents too
  const tools = join(scratch, 'tools');
  mkdirSync(tools);
  for (const tool of ['node', 'npm', 'npx', 'pnpm', 'yarn', 'bun', 'corepack']) {
    const found = (process.env.PATH ?? '').split(delimiter).map((folder) => join(folder, tool)).find((path) =>
      existsSync(path)
    );
    if (found) { symlinkSync(found, join(tools, tool)); }
  }
  const home = join(scratch, 'home');
  mkdirSync(home);
  console.log(
    `\n  agents        ${
      agents.length ? `stand-ins for ${agents.join(', ')}, which record their arguments and install nothing` : 'none'
    }`,
  );
  console.log('  home          a throwaway folder, so no real agent or its configuration can be reached');
  console.log(`  demo project  ${project}\n  running       npx ${command} ${process.argv.slice(2).join(' ')}\n`);
  const child = spawn(['npx', command, ...process.argv.slice(2)].join(' '), {
    cwd: project,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PATH: [standIns, tools, '/usr/bin', '/bin'].join(delimiter),
      HOME: home,
      USERPROFILE: home,
      CLAUDE_CONFIG_DIR: join(home, '.claude'),
      CODEX_HOME: join(home, '.codex'),
      XDG_CONFIG_HOME: join(home, '.config'),
      XDG_DATA_HOME: join(home, '.local/share'),
      XDG_STATE_HOME: join(home, '.local/state'),
      XDG_CACHE_HOME: join(home, '.cache'),
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
    const ran = readFileSync(agentCalls, 'utf8').trim();
    if (ran) {
      console.log(
        `  agents were asked to run (stand-ins, nothing was installed)\n    ${ran.replace(/\n/g, '\n    ')}\n`,
      );
    }
    // the tarballs, the npm cache and the throwaway home go, and the demo project stays to be looked at
    rmSync(scratch, { recursive: true, force: true });
    console.log(`  demo project  ${project}\n`);
    process.exitCode = status ?? 1;
  });
});
