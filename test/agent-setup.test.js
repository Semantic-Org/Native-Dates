import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Setup } from '../bin/agent-setup/setup.js';
import { packSkills } from '../tools/skills.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const scratch = mkdtempSync(join(tmpdir(), 'agent-setup-'));

// the package as npm unpacks it, with the skills folder prepack writes
const published = join(scratch, 'published');
// package managers that record their arguments and put the package in node_modules, since tests have no registry
const managers = join(scratch, 'managers');
const calls = join(scratch, 'calls.log');

beforeAll(() => {
  mkdirSync(published, { recursive: true });
  cpSync(join(root, 'bin'), join(published, 'bin'), { recursive: true });
  cpSync(join(root, 'package.json'), join(published, 'package.json'));
  packSkills(published);
  mkdirSync(managers);
  for (const manager of ['npm', 'pnpm', 'yarn', 'bun']) {
    const script = [
      '#!/usr/bin/env node',
      `const { appendFileSync, mkdirSync, rmSync, symlinkSync } = require('node:fs');`,
      `appendFileSync(${JSON.stringify(calls)}, '${manager} ' + process.argv.slice(2).join(' ') + '\\n');`,
      `mkdirSync('node_modules', { recursive: true });`,
      `rmSync('node_modules/native-dates', { recursive: true, force: true });`,
      `symlinkSync(${JSON.stringify(published)}, 'node_modules/native-dates');`,
    ];
    writeFileSync(join(managers, manager), `${script.join('\n')}\n`);
    chmodSync(join(managers, manager), 0o755);
  }
});

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function project(files = { 'package.json': '{ "name": "app" }' }) {
  const dir = mkdtempSync(join(scratch, 'project-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

// stdin is a pipe here, which is how the command sees a coding agent or a script
function setup(dir, ...args) {
  writeFileSync(calls, '');
  const { status, stdout, stderr } = spawnSync(process.execPath, [join(published, 'bin/native-dates.js'), ...args], {
    cwd: dir,
    encoding: 'utf8',
    // offline as well, so a manager missing from the fakes could never reach a registry
    env: { PATH: `${managers}${delimiter}${dirname(process.execPath)}`, npm_config_offline: 'true' },
  });
  return { status, output: stdout + stderr, calls: readFileSync(calls, 'utf8').trim() };
}

// what the command prints is read from its copy table, so rewording a line never breaks a test
const { copy } = Setup;

const skillPaths = [
  '.agents/skills/native-dates',
  '.agents/skills/native-dates-plugins',
  '.claude/skills/native-dates',
  '.claude/skills/native-dates-plugins',
];

describe('npx native-dates', () => {
  it('lists the changes, writes nothing, and exits 1 when nobody can be asked and --yes is absent', () => {
    const dir = project();
    const { status, output, calls: ran } = setup(dir);
    expect(status).toBe(1);
    expect(output).toContain(`npm install native-dates@${version}`);
    expect(output).toContain('--yes');
    expect(ran).toBe('');
    expect(existsSync(join(dir, 'AGENTS.md')) || existsSync(join(dir, '.agents'))).toBe(false);
  });

  it('with --yes installs the package, links every skill into both agent folders, and creates AGENTS.md', () => {
    const dir = project();
    const { status, calls: ran } = setup(dir, '--yes');
    expect(status).toBe(0);
    expect(ran).toBe(`npm install native-dates@${version}`);
    for (const path of skillPaths) {
      expect(readlinkSync(join(dir, path))).toBe(`../../node_modules/native-dates/skills/${path.split('/').pop()}`);
      expect(readFileSync(join(dir, path, 'SKILL.md'), 'utf8')).toMatch(/^---\nname: native-dates/);
    }
    expect(readFileSync(join(dir, 'AGENTS.md'), 'utf8')).toContain('.agents/skills/native-dates/SKILL.md');
  });

  it('changes nothing and exits 0 on a second run', () => {
    const dir = project();
    setup(dir, '--yes');
    const notes = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    const { status, calls: ran } = setup(dir);
    expect(status).toBe(0);
    expect(ran).toBe('');
    expect(readFileSync(join(dir, 'AGENTS.md'), 'utf8')).toBe(notes);
  });

  it.each([
    ['pnpm-lock.yaml', '{ "name": "app" }', 'pnpm add'],
    ['yarn.lock', '{ "name": "app" }', 'yarn add'],
    ['bun.lock', '{ "name": "app" }', 'bun add'],
    ['package-lock.json', '{ "name": "app", "packageManager": "pnpm@12.0.0" }', 'npm install'],
    ['README.md', '{ "name": "app", "packageManager": "yarn@4.0.0" }', 'yarn add'],
  ])('installs with the manager a project with %s and %s uses', (file, manifest, command) => {
    const dir = project({ 'package.json': manifest, [file]: '' });
    expect(setup(dir, '--yes').calls).toBe(`${command} native-dates@${version}`);
  });

  it('skips the install and links through @native-dates/core when only the scoped name is a dependency', () => {
    const dir = project({
      'package.json': '{ "name": "app", "dependencies": { "@native-dates/core": "*" } }',
      'node_modules/.pnpm/core/node_modules/@native-dates/core/package.json': '{ "name": "@native-dates/core" }',
    });
    symlinkSync(published, join(dir, 'node_modules/.pnpm/core/node_modules/native-dates'));
    mkdirSync(join(dir, 'node_modules/@native-dates'));
    symlinkSync('../.pnpm/core/node_modules/@native-dates/core', join(dir, 'node_modules/@native-dates/core'));

    const { status, calls: ran } = setup(dir, '--yes');
    expect(status).toBe(0);
    expect(ran).toBe('');
    expect(readlinkSync(join(dir, '.agents/skills/native-dates'))).toBe(
      '../../node_modules/@native-dates/core/../../native-dates/skills/native-dates',
    );
    expect(existsSync(join(dir, '.claude/skills/native-dates-plugins/SKILL.md'))).toBe(true);
  });

  it('copies the skills when the package is a dependency with no node_modules folder to link into', () => {
    const dir = project({
      'package.json': '{ "name": "app", "dependencies": { "native-dates": "*" } }',
      '.pnp.cjs': '',
    });
    const { status, calls: ran } = setup(dir, '--yes');
    expect(status).toBe(0);
    expect(ran).toBe('');
    for (const path of skillPaths) {
      expect(lstatSync(join(dir, path)).isDirectory()).toBe(true);
      expect(existsSync(join(dir, path, 'SKILL.md'))).toBe(true);
    }
  });

  it('keeps existing AGENTS.md text, adds the note to a separate CLAUDE.md, and replaces an older note in place', () => {
    const older = '<!-- native-dates:start -->\nolder note\n<!-- native-dates:end -->';
    const dir = project({
      'package.json': '{ "name": "app" }',
      'AGENTS.md': `# House Rules\n\n${older}\n\nKeep this line.\n`,
      'CLAUDE.md': '# Claude\n',
    });
    setup(dir, '--yes');
    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    expect(agents).toMatch(/^# House Rules\n\n<!-- native-dates:start -->\n## native-dates\n/);
    expect(agents).toMatch(/<!-- native-dates:end -->\n\nKeep this line\.\n$/);
    expect(agents).not.toContain('older note');
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toMatch(/^# Claude\n\n<!-- native-dates:start -->/);
  });

  it('writes the note once when CLAUDE.md is a link to AGENTS.md or imports it', () => {
    const linked = project({ 'package.json': '{ "name": "app" }', 'AGENTS.md': '# Rules\n' });
    symlinkSync('AGENTS.md', join(linked, 'CLAUDE.md'));
    setup(linked, '--yes');
    expect(readFileSync(join(linked, 'AGENTS.md'), 'utf8').match(/native-dates:start/g)).toHaveLength(1);

    const imported = project({ 'package.json': '{ "name": "app" }', 'CLAUDE.md': '@AGENTS.md\n' });
    setup(imported, '--yes');
    expect(readFileSync(join(imported, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n');
  });

  it('leaves a skill folder it did not write alone and says so', () => {
    const dir = project({
      'package.json': '{ "name": "app" }',
      '.claude/skills/native-dates/SKILL.md': 'my own notes\n',
    });
    const { status, output } = setup(dir, '--yes');
    expect(status).toBe(0);
    expect(output).toContain('.claude/skills/native-dates');
    expect(readFileSync(join(dir, '.claude/skills/native-dates/SKILL.md'), 'utf8')).toBe('my own notes\n');
  });

  // `script` gives the command a terminal on Linux, and its piped input is what the person types
  it.runIf(process.platform === 'linux').each([
    ['Enter', 0, '\n', true],
    ['n', 0, 'n\n', false],
  ])('in a terminal asks first, and %s leaves status %i', (key, expected, typed, written) => {
    const dir = project();
    const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
    const { status, stdout } = spawnSync('script', ['-qec', command, '/dev/null'], {
      cwd: dir,
      input: typed,
      encoding: 'utf8',
      timeout: 30_000,
      env: { PATH: `${managers}${delimiter}${dirname(process.execPath)}${delimiter}/usr/bin${delimiter}/bin` },
    });
    expect(stdout).toContain(copy.question);
    expect(stdout).not.toContain('unsettled');
    expect(status).toBe(expected);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(written);
  });

  // a lone esc is told from an arrow key by the pause after it, so the keys are typed with gaps
  it.runIf(process.platform === 'linux')(
    'esc in the second question steps back to the first, which still answers',
    async () => {
      const dir = project();
      const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
      const child = spawn('script', ['-qec', command, '/dev/null'], {
        cwd: dir,
        env: { PATH: `${managers}${delimiter}${dirname(process.execPath)}${delimiter}/usr/bin${delimiter}/bin` },
      });
      let output = '';
      child.stdout.on('data', (chunk) => (output += chunk));
      const type = (keys, pause) =>
        new Promise((done) => {
          child.stdin.write(keys);
          setTimeout(done, pause);
        });
      await expect.poll(() => output, { timeout: 10_000 }).toContain(copy.question);
      await type('\x1b[B\r', 500);
      await type('\x1b', 1000);
      await type('n', 0);
      const status = await new Promise((done) => child.on('close', done));
      const shown = output.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
      expect(shown).toContain(copy.chooseQuestion);
      expect(shown).toContain(`${copy.question} ${copy.no}`);
      expect(shown).not.toContain(copy.cancelled);
      expect(status).toBe(0);
      expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false);
    },
    30_000,
  );

  it('points the note at the installed copy of the skill when --no-skills leaves the agent folders empty', () => {
    const dir = project();
    const { status } = setup(dir, '--yes', '--no-skills');
    expect(status).toBe(0);
    expect(existsSync(join(dir, '.agents'))).toBe(false);
    const [, path] = readFileSync(join(dir, 'AGENTS.md'), 'utf8').match(/Read `([^`]+)`/);
    expect(path).toBe('node_modules/native-dates/skills/native-dates/SKILL.md');
    expect(existsSync(join(dir, path))).toBe(true);
  });

  it('leaves out the steps switched off with --no-install and --no-note', () => {
    const dir = project();
    const { status, calls: ran } = setup(dir, '--yes', '--no-install', '--no-note');
    expect(status).toBe(0);
    expect(ran).toBe('');
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(dir, '.agents/skills/native-dates/SKILL.md'))).toBe(true);
  });

  it('prints no escape codes when captured, and the organisation palette when colour is forced', () => {
    const plain = setup(project()).output;
    expect(plain).not.toContain('\x1b[');
    expect(plain).toContain('[native-dates]');
    const dir = project();
    const forced = spawnSync(process.execPath, [join(published, 'bin/native-dates.js')], {
      cwd: dir,
      encoding: 'utf8',
      env: { PATH: dirname(process.execPath), FORCE_COLOR: '3', npm_config_offline: 'true' },
    }).stdout;
    expect(forced).toContain('\x1b[1m\x1b[38;2;117;158;185m[native-dates]');
    const silenced = spawnSync(process.execPath, [join(published, 'bin/native-dates.js')], {
      cwd: dir,
      encoding: 'utf8',
      env: { PATH: dirname(process.execPath), FORCE_COLOR: '3', NO_COLOR: '1', npm_config_offline: 'true' },
    }).stdout;
    expect(silenced).not.toContain('\x1b[');
  });

  // down and enter pick 'Let me choose', then space deselects the first row, which is the install
  it.runIf(process.platform === 'linux')('in a terminal lets the person switch a change off before confirming', () => {
    const dir = project();
    const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
    const { status } = spawnSync('script', ['-qec', command, '/dev/null'], {
      cwd: dir,
      input: 'j\r \r',
      encoding: 'utf8',
      timeout: 30_000,
      env: { PATH: `${managers}${delimiter}${dirname(process.execPath)}${delimiter}/usr/bin${delimiter}/bin` },
    });
    expect(status).toBe(0);
    expect(readFileSync(calls, 'utf8')).toBe('');
    expect(lstatSync(join(dir, '.agents/skills/native-dates')).isDirectory()).toBe(true);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(true);
  });

  // a copy of the package on disk under another version, as an earlier install leaves it
  function installed(dir, installedVersion, { skills = true } = {}) {
    const copy = join(dir, 'node_modules/native-dates');
    cpSync(published, copy, { recursive: true });
    const manifest = JSON.parse(readFileSync(join(copy, 'package.json'), 'utf8'));
    writeFileSync(join(copy, 'package.json'), JSON.stringify({ ...manifest, version: installedVersion }));
    if (!skills) { rmSync(join(copy, 'skills'), { recursive: true }); }
  }
  const dependsOn = { 'package.json': '{ "name": "app", "dependencies": { "native-dates": "*" } }' };

  it('offers to update an older install, naming the version it has and the one it would install', () => {
    const dir = project(dependsOn);
    installed(dir, '0.0.1');
    const offered = setup(dir).output;
    expect(offered).toContain('0.0.1');
    expect(offered).toContain(`npm install native-dates@${version}`);
    const { status, calls: ran } = setup(dir, '--yes');
    expect(status).toBe(0);
    expect(ran).toBe(`npm install native-dates@${version}`);
    expect(readlinkSync(join(dir, '.agents/skills/native-dates'))).toBe(
      '../../node_modules/native-dates/skills/native-dates',
    );
  });

  it("links the older install's own skills when the update is switched off", () => {
    const dir = project(dependsOn);
    installed(dir, '0.0.1');
    const { status, calls: ran } = setup(dir, '--yes', '--no-install');
    expect(status).toBe(0);
    expect(ran).toBe('');
    expect(readlinkSync(join(dir, '.claude/skills/native-dates'))).toBe(
      '../../node_modules/native-dates/skills/native-dates',
    );
    expect(JSON.parse(readFileSync(join(dir, 'node_modules/native-dates/package.json'), 'utf8')).version).toBe('0.0.1');
  });

  it('places no skills and writes no note beside an older install that carries none and is not updated', () => {
    const dir = project(dependsOn);
    installed(dir, '0.0.1', { skills: false });
    const { status, calls: ran } = setup(dir, '--yes', '--no-install');
    expect(status).toBe(1);
    expect(ran).toBe('');
    expect(existsSync(join(dir, '.agents')) || existsSync(join(dir, '.claude')) || existsSync(join(dir, 'AGENTS.md')))
      .toBe(false);
  });

  it('leaves a newer install alone, links its skills, and says it was left', () => {
    const dir = project(dependsOn);
    installed(dir, '99.0.0');
    const { status, output, calls: ran } = setup(dir, '--yes');
    expect(status).toBe(0);
    expect(ran).toBe('');
    expect(output).toContain('99.0.0');
    expect(existsSync(join(dir, '.agents/skills/native-dates/SKILL.md'))).toBe(true);
  });

  it('refuses outside a project and on an unknown option without writing', () => {
    const empty = mkdtempSync(join(scratch, 'empty-'));
    expect(setup(empty, '--yes').status).toBe(1);
    expect(existsSync(join(empty, 'AGENTS.md'))).toBe(false);
    const dir = project();
    expect(setup(dir, '--force')).toMatchObject({ status: 1, calls: '' });
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false);
  });
});
