import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
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

import { fill, joinWords } from '../bin/agent-setup/helpers.js';
import { Project } from '../bin/agent-setup/project.js';
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
// coding agents that record their arguments and change nothing, one folder each so a test picks which exist
const agentBins = join(scratch, 'agents');
// node by a link of its own, so a run finds the stand-ins and never a real package manager or coding agent
const nodeOnly = join(scratch, 'node');
// a home for anything that looks for one, so nothing can reach a real agent's configuration
const home = join(scratch, 'home');
// util-linux script, whose -c runs a command in a terminal. the BSD one on a Mac takes other arguments
const scriptBin = process.platform === 'linux' && ['/usr/bin/script', '/bin/script'].find((path) => existsSync(path));
const sttyBin = ['/usr/bin/stty', '/bin/stty'].find((path) => existsSync(path));

const environment = (agents = [], extra = {}) => ({
  PATH: [managers, ...agents.map((agent) => join(agentBins, agent)), nodeOnly].join(delimiter),
  HOME: home,
  CLAUDE_CONFIG_DIR: join(home, '.claude'),
  CODEX_HOME: join(home, '.codex'),
  // offline as well, so a manager missing from the fakes could never reach a registry
  npm_config_offline: 'true',
  ...extra,
});

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
  for (const agent of ['claude', 'codex', 'agy']) {
    const script = [
      '#!/usr/bin/env node',
      `require('node:fs').appendFileSync(${
        JSON.stringify(calls)
      }, '${agent} ' + process.argv.slice(2).join(' ') + '\\n');`,
      `if (process.env.FAILS === '${agent}') { console.error('${agent} stand-in refused'); process.exit(1); }`,
    ];
    mkdirSync(join(agentBins, agent), { recursive: true });
    writeFileSync(join(agentBins, agent, agent), `${script.join('\n')}\n`);
    chmodSync(join(agentBins, agent, agent), 0o755);
  }
  mkdirSync(nodeOnly);
  symlinkSync(process.execPath, join(nodeOnly, 'node'));
  mkdirSync(home);
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
// agents are the stand-in binaries the run can find, and env adds to what it sees
function setupWith({ agents = [], env = {} }, dir, ...args) {
  writeFileSync(calls, '');
  const { status, stdout, stderr } = spawnSync(process.execPath, [join(published, 'bin/native-dates.js'), ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: environment(agents, env),
  });
  return { status, output: stdout + stderr, calls: readFileSync(calls, 'utf8').trim() };
}

const setup = (dir, ...args) => setupWith({}, dir, ...args);

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
    expect(output).toContain(fill(copy.kept, { path: '.claude/skills/native-dates' }));
    expect(readFileSync(join(dir, '.claude/skills/native-dates/SKILL.md'), 'utf8')).toBe('my own notes\n');
  });

  // `script` gives the command a terminal on Linux, and its piped input is what the person types
  it.runIf(scriptBin).each([
    ['Enter', 0, '\n', true],
    ['n', 0, 'n\n', false],
  ])('in a terminal asks first, and %s leaves status %i', (key, expected, typed, written) => {
    const dir = project();
    const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
    const { status, stdout } = spawnSync(scriptBin, ['-qec', command, '/dev/null'], {
      cwd: dir,
      input: typed,
      encoding: 'utf8',
      timeout: 30_000,
      env: environment(),
    });
    expect(stdout).toContain(copy.question);
    expect(stdout).not.toContain('unsettled');
    expect(status).toBe(expected);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(written);
  });

  // a lone esc is told from an arrow key by the pause after it, so the keys are typed with gaps
  it.runIf(scriptBin)(
    'esc in the second question steps back to the first, which still answers',
    async () => {
      const dir = project();
      const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
      const child = spawn(scriptBin, ['-qec', command, '/dev/null'], {
        cwd: dir,
        env: environment(),
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
      env: environment([], { FORCE_COLOR: '3' }),
    }).stdout;
    expect(forced).toContain('\x1b[1m\x1b[38;2;117;158;185m[native-dates]');
    // code is inked in the docs site's code blue, which takes the place of its backticks
    expect(forced).toContain(`\x1b[38;2;121;192;255mnpm install native-dates@${version}\x1b[`);
    expect(forced).not.toContain('`');
    expect(plain).toContain(`\`npm install native-dates@${version}\``);
    const silenced = spawnSync(process.execPath, [join(published, 'bin/native-dates.js')], {
      cwd: dir,
      encoding: 'utf8',
      env: environment([], { FORCE_COLOR: '3', NO_COLOR: '1' }),
    }).stdout;
    expect(silenced).not.toContain('\x1b[');
  });

  // down and enter pick 'Let me choose', then space deselects the first row, which is the install
  it.runIf(scriptBin)('in a terminal lets the person switch a change off before confirming', () => {
    const dir = project();
    writeFileSync(calls, '');
    const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
    const { status } = spawnSync(scriptBin, ['-qec', command, '/dev/null'], {
      cwd: dir,
      input: 'j\r \r',
      encoding: 'utf8',
      timeout: 30_000,
      env: environment(),
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
    const command = `npm install native-dates@${version}`;
    expect(setup(dir).output).toContain(fill(copy.update, { command, from: '0.0.1', to: version }));
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
    const { status, output, calls: ran } = setup(dir, '--yes', '--no-install');
    expect(status).toBe(1);
    expect(ran).toBe('');
    expect(output).toContain(fill(copy.skillsWithheld, { folder: '.agents/skills', from: '0.0.1', to: version }));
    expect(output).toContain(fill(copy.notReady, { name: 'native-dates', version }));
    expect(existsSync(join(dir, '.agents')) || existsSync(join(dir, '.claude')) || existsSync(join(dir, 'AGENTS.md')))
      .toBe(false);
  });

  it('leaves a newer install alone, links its skills, and says it was left', () => {
    const dir = project(dependsOn);
    installed(dir, '99.0.0');
    const { status, output, calls: ran } = setup(dir, '--yes');
    expect(status).toBe(0);
    expect(ran).toBe('');
    expect(output).toContain(fill(copy.newer, { name: 'native-dates', installed: '99.0.0', version }));
    expect(existsSync(join(dir, '.agents/skills/native-dates/SKILL.md'))).toBe(true);
  });

  const install = `npm install native-dates@${version}`;
  const pluginCalls = [
    'claude plugin install native-dates --marketplace Semantic-Org/Native-Dates',
    'codex plugin marketplace add Semantic-Org/Native-Dates',
    'codex plugin add native-dates@native-dates',
    'agy plugin install node_modules/native-dates',
  ];

  it('names the agents it finds, and starts with only the folders they read', () => {
    const dir = project();
    const { status, output, calls: ran } = setupWith({ agents: ['claude'] }, dir, '--yes');
    expect(status).toBe(0);
    expect(output).toContain(fill(copy.detected, { agents: 'Claude Code' }));
    expect(ran).toBe(install);
    expect(existsSync(join(dir, '.claude/skills/native-dates/SKILL.md'))).toBe(true);
    expect(existsSync(join(dir, '.agents'))).toBe(false);
  });

  // every agent the table says reads a folder, found ones first
  const readersOf = (folder, found = []) => {
    const reads = Object.keys(Project.agents).filter((agent) => Project.agents[agent].folders.includes(folder));
    return joinWords([...found, ...reads.filter((agent) => !found.includes(agent))]);
  };

  it('names in the preview only the found agents that need a folder, and every reader when none is found', () => {
    const one = setupWith({ agents: ['claude'] }, project()).output;
    expect(one).toContain(fill(copy.skills, { folder: '.claude/skills', readers: 'Claude Code' }));
    const none = setup(project()).output;
    expect(none).toContain(fill(copy.skills, { folder: '.claude/skills', readers: readersOf('.claude/skills') }));
    expect(none).toContain(fill(copy.skills, { folder: '.agents/skills', readers: readersOf('.agents/skills') }));
  });

  // enter takes this project, down and enter open the checklist, and enter confirms it as it stands
  // the terminal is widened first, since a row in the checklist is cut to the width it reports
  it.runIf(scriptBin && sttyBin)('names every agent that reads a folder in the checklist, found ones first', () => {
    const command = `${sttyBin} cols 200; "${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
    const { stdout } = spawnSync(scriptBin, ['-qec', command, '/dev/null'], {
      cwd: project(),
      input: '\rj\r\r',
      encoding: 'utf8',
      timeout: 30_000,
      env: environment(['claude'], { NO_COLOR: '1' }),
    });
    const every = readersOf('.claude/skills', ['Claude Code']);
    expect(every).not.toBe('Claude Code');
    expect(stdout).toContain(fill(copy.skills, { folder: '.claude/skills', readers: every }));
    expect(stdout).toContain(fill(copy.skills, { folder: '.agents/skills', readers: readersOf('.agents/skills') }));
  });

  it('runs no agent and writes only in the project unless --global is given', () => {
    const dir = project();
    const { calls: ran } = setupWith({ agents: ['claude', 'codex', 'agy'] }, dir, '--yes');
    expect(ran).toBe(install);
    expect(existsSync(home) && readdirSync(home)).toEqual([]);
  });

  it("with --global installs each found agent's plugin with its own command and links no project skills", () => {
    const dir = project();
    const { status, calls: ran } = setupWith({ agents: ['claude', 'codex', 'agy'] }, dir, '--yes', '--global');
    expect(status).toBe(0);
    expect(ran.split('\n')).toEqual([install, ...pluginCalls]);
    expect(existsSync(join(dir, '.agents')) || existsSync(join(dir, '.claude'))).toBe(false);
    expect(readFileSync(join(dir, 'AGENTS.md'), 'utf8')).toContain(
      'node_modules/native-dates/skills/native-dates/SKILL.md',
    );
  });

  it('with --global lists the plugin commands and runs none of them until --yes', () => {
    const dir = project();
    const { status, output, calls: ran } = setupWith({ agents: ['claude', 'codex'] }, dir, '--global');
    expect(status).toBe(1);
    expect(ran).toBe('');
    expect(output).toContain(pluginCalls[0]);
    expect(output).toContain(`${pluginCalls[1]} && ${pluginCalls[2]}`);
  });

  it('refuses --global and writes nothing when no found agent installs plugins from a command', () => {
    const dir = project({ 'package.json': '{ "name": "app" }', '.cursor/rules.md': '' });
    const { status, output, calls: ran } = setupWith({}, dir, '--yes', '--global');
    const agents = joinWords(['Claude Code', 'Codex', 'Antigravity']);
    expect(status).toBe(1);
    expect(ran).toBe('');
    expect(output).toContain(fill(copy.globalUnavailable, { agents, name: 'native-dates' }));
    expect(existsSync(join(dir, 'AGENTS.md')) || existsSync(join(dir, '.agents'))).toBe(false);
  });

  it('with --global still fills a folder for a found agent that has no plugin, one the plugin agent does not read', () => {
    const dir = project({ 'package.json': '{ "name": "app" }', '.cursor/rules.md': '' });
    const { status, calls: ran } = setupWith({ agents: ['claude'] }, dir, '--yes', '--global');
    expect(status).toBe(0);
    expect(ran.split('\n')).toEqual([install, pluginCalls[0]]);
    expect(existsSync(join(dir, '.agents/skills/native-dates/SKILL.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude'))).toBe(false);
  });

  it('with --global says a skill already linked in the project will load twice, and deletes nothing', () => {
    const dir = project();
    setupWith({ agents: ['codex'] }, dir, '--yes');
    const { status, output } = setupWith({ agents: ['codex'] }, dir, '--yes', '--global');
    expect(status).toBe(0);
    expect(output).toContain(fill(copy.doubled, { path: '.agents/skills/native-dates', agent: 'Codex' }));
    expect(existsSync(join(dir, '.agents/skills/native-dates/SKILL.md'))).toBe(true);
  });

  it("stops at an agent command that fails, with that agent's output", () => {
    const dir = project();
    const { status, output, calls: ran } = setupWith(
      { agents: ['claude', 'codex'], env: { FAILS: 'claude' } },
      dir,
      '--yes',
      '--global',
    );
    expect(status).toBe(1);
    expect(ran.split('\n')).toEqual([install, pluginCalls[0]]);
    expect(output).toContain('claude stand-in refused');
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false);
  });

  it('refreshes its own copy of a skill from another version, told by the version pack stamps into it', () => {
    const dir = project({
      'package.json': '{ "name": "app", "dependencies": { "native-dates": "*" } }',
      '.pnp.cjs': '',
    });
    setup(dir, '--yes');
    const copied = join(dir, '.agents/skills/native-dates/SKILL.md');
    const current = readFileSync(copied, 'utf8');
    expect(current).toContain(`version: "${version}"`);
    writeFileSync(copied, current.replace(`version: "${version}"`, 'version: "0.0.1"'));
    expect(setup(dir, '--yes').status).toBe(0);
    expect(readFileSync(copied, 'utf8')).toBe(current);
  });

  // a lone esc is told from an arrow key by the pause after it, so the keys are typed with gaps
  it.runIf(scriptBin)(
    'in a terminal asks where the skills go first, and esc at the approval steps back to it',
    async () => {
      const dir = project();
      const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
      writeFileSync(calls, '');
      const child = spawn(scriptBin, ['-qec', command, '/dev/null'], { cwd: dir, env: environment(['claude']) });
      let output = '';
      child.stdout.on('data', (chunk) => (output += chunk));
      const type = (keys, pause) =>
        new Promise((done) => {
          child.stdin.write(keys);
          setTimeout(done, pause);
        });
      await expect.poll(() => output, { timeout: 10_000 }).toContain(copy.scopeQuestion);
      expect(output).not.toContain(copy.question);
      // down and enter pick the global install, whose preview names the repository the plugin comes from
      await type('\x1b[B\r', 500);
      expect(output.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')).toContain('Semantic-Org/Native-Dates');
      // esc steps back, up and enter pick this project, enter approves
      await type('\x1b', 1000);
      await type('\x1b[A\r', 500);
      await type('\r', 0);
      const status = await new Promise((done) => child.on('close', done));
      const shown = output.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
      expect(shown).toContain(`${copy.scopeQuestion} ${copy.scopeProject}`);
      expect(status).toBe(0);
      expect(readFileSync(calls, 'utf8').trim()).toBe(install);
      expect(existsSync(join(dir, '.claude/skills/native-dates/SKILL.md'))).toBe(true);
    },
    30_000,
  );

  it('reports a project as set up on a second run when the one agent found reads a single folder', () => {
    const dir = project();
    expect(setupWith({ agents: ['claude'] }, dir, '--yes').status).toBe(0);
    const again = setupWith({ agents: ['claude'] }, dir);
    expect(again).toMatchObject({ status: 0, calls: '' });
    expect(again.output).toContain(copy.alreadySetUp);
    expect(existsSync(join(dir, '.agents'))).toBe(false);
  });

  it('takes the package manager from a lockfile at the root of the repository above', () => {
    const dir = project({ '.git/HEAD': '', 'pnpm-lock.yaml': '', 'apps/web/package.json': '{ "name": "web" }' });
    const { status, calls: ran } = setup(join(dir, 'apps/web'), '--yes');
    expect(status).toBe(0);
    expect(ran).toBe(`pnpm add native-dates@${version}`);
  });

  it('tells pnpm the root is meant when the project is a workspace root', () => {
    const dir = project({ 'package.json': '{ "name": "app" }', 'pnpm-lock.yaml': '', 'pnpm-workspace.yaml': '' });
    expect(setup(dir, '--yes').calls).toBe(`pnpm add -w native-dates@${version}`);
  });

  it('links to a copy a workspace hoisted to the root of the repository, and installs nothing', () => {
    const dir = project({
      '.git/HEAD': '',
      'package-lock.json': '',
      'apps/web/package.json': dependsOn['package.json'],
    });
    installed(dir, version);
    const web = join(dir, 'apps/web');
    const { status, calls: ran } = setup(web, '--yes');
    expect(status).toBe(0);
    expect(ran).toBe('');
    expect(readlinkSync(join(web, '.agents/skills/native-dates'))).toBe(
      '../../../../node_modules/native-dates/skills/native-dates',
    );
    expect(readFileSync(join(web, '.agents/skills/native-dates/SKILL.md'), 'utf8')).toContain('name: native-dates');
  });

  it('keeps a copied skill someone edited, and a file they added beside one it refreshes', () => {
    const dir = project({ ...dependsOn, '.pnp.cjs': '' });
    setup(dir, '--yes');
    const folder = join(dir, '.agents/skills/native-dates');
    const copied = join(folder, 'SKILL.md');
    const current = readFileSync(copied, 'utf8');
    // the same version with other words is theirs
    writeFileSync(copied, `${current}\nteam notes\n`);
    expect(setup(dir, '--yes').status).toBe(0);
    expect(readFileSync(copied, 'utf8')).toContain('team notes');
    // another version is refreshed in place, beside what they added
    writeFileSync(copied, current.replace(`version: "${version}"`, 'version: "0.0.1"'));
    writeFileSync(join(folder, 'team-notes.md'), 'ours\n');
    setup(dir, '--yes');
    expect(readFileSync(copied, 'utf8')).toBe(current);
    expect(existsSync(join(folder, 'team-notes.md'))).toBe(true);
  });

  it('leaves what follows a note whose end marker was removed', () => {
    const dir = project({
      'package.json': '{ "name": "app" }',
      'AGENTS.md': '# Rules\n\n<!-- native-dates:start -->\nold note\n\n## Deploy\n\nKeep this section.\n',
    });
    setup(dir, '--yes');
    setup(dir, '--yes');
    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('Keep this section.');
    expect(agents.split('<!-- native-dates:start -->')).toHaveLength(2);
  });

  // a folder the system will not write to, which root and Windows are never refused
  it.runIf(process.platform !== 'win32' && process.getuid() !== 0)(
    "names the step and the system's reason when a change cannot be written",
    () => {
      const dir = project({ 'package.json': '{ "name": "app" }', '.claude/skills/.keep': '' });
      chmodSync(join(dir, '.claude/skills'), 0o555);
      const { status, output } = setupWith({ agents: ['claude'] }, dir, '--yes');
      chmodSync(join(dir, '.claude/skills'), 0o755);
      expect(status).toBe(1);
      expect(output).toContain('EACCES');
      expect(output).not.toContain('{command}');
    },
  );

  it('counts a plugin that went in as set up, with no skill in the project to point at', () => {
    const dir = project();
    const { status } = setupWith({ agents: ['claude'] }, dir, '--yes', '--global', '--no-install');
    expect(status).toBe(0);
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false);
  });

  it.runIf(scriptBin)('prints no escape codes on a terminal that says it is dumb', () => {
    const command = `"${process.execPath}" "${join(published, 'bin/native-dates.js')}"`;
    const { stdout } = spawnSync(scriptBin, ['-qec', command, '/dev/null'], {
      cwd: project(),
      input: 'n\n',
      encoding: 'utf8',
      timeout: 30_000,
      env: environment([], { TERM: 'dumb' }),
    });
    expect(stdout).toContain(copy.tagline);
    expect(stdout).not.toContain('\x1b[');
  });

  it('links skills that resolve when the skills folder is itself a link to somewhere else', () => {
    const dir = project({ 'package.json': '{ "name": "app" }', 'shared/deep/skills/.keep': '', '.agents/.keep': '' });
    symlinkSync('../shared/deep/skills', join(dir, '.agents/skills'));
    expect(setup(dir, '--yes').status).toBe(0);
    expect(readFileSync(join(dir, '.agents/skills/native-dates/SKILL.md'), 'utf8')).toContain('name: native-dates');
    expect(setup(dir)).toMatchObject({ status: 0, calls: '' });
  });

  it('says how many skills a folder holds when it is another folder of the plan under a second name', () => {
    const dir = project({ 'package.json': '{ "name": "app" }', '.agents/skills/.keep': '', '.claude/.keep': '' });
    symlinkSync('../.agents/skills', join(dir, '.claude/skills'));
    const { status, output } = setup(dir, '--yes');
    expect(status).toBe(0);
    const [, many] = copy.nouns;
    const placed = fill(copy.linked, { count: 2, noun: many });
    for (const folder of ['.agents/skills', '.claude/skills']) {
      expect(output).toContain(fill(copy.skillsDone, { placed, folder }));
    }
  });

  it('is set up after one run when a second agent appears, with the note left as it was', () => {
    const dir = project();
    setupWith({ agents: ['claude'] }, dir, '--yes');
    const note = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    expect(setupWith({ agents: ['claude', 'codex'] }, dir, '--yes').status).toBe(0);
    expect(existsSync(join(dir, '.agents/skills/native-dates/SKILL.md'))).toBe(true);
    const again = setupWith({ agents: ['claude', 'codex'] }, dir);
    expect(again).toMatchObject({ status: 0, calls: '' });
    expect(readFileSync(join(dir, 'AGENTS.md'), 'utf8')).toBe(note);
  });

  it("places the skills the installed copy ships, which can differ from this command's own", () => {
    const dir = project(dependsOn);
    installed(dir, version);
    const shipped = join(dir, 'node_modules/native-dates/skills');
    cpSync(join(shipped, 'native-dates'), join(shipped, 'native-dates-extra'), { recursive: true });
    rmSync(join(shipped, 'native-dates-plugins'), { recursive: true });
    expect(setup(dir, '--yes').status).toBe(0);
    expect(existsSync(join(dir, '.agents/skills/native-dates-extra/SKILL.md'))).toBe(true);
    expect(existsSync(join(dir, '.agents/skills/native-dates-plugins'))).toBe(false);
  });

  // what pnpm leaves for a project that depends only on the scoped name: the alias is a link into its store,
  // and the package sits beside the alias there. Windows cannot reach it by walking `..` through the link
  it('finds the package beside a linked alias from where the alias really is', () => {
    const dir = project({ 'package.json': '{ "name": "app", "dependencies": { "@native-dates/core": "*" } }' });
    const store = join(dir, 'node_modules/.pnpm');
    const core = join(store, '@native-dates+core@1.0.0/node_modules/@native-dates/core');
    mkdirSync(core, { recursive: true });
    cpSync(published, join(store, '@native-dates+core@1.0.0/node_modules/native-dates'), { recursive: true });
    mkdirSync(join(dir, 'node_modules/@native-dates'), { recursive: true });
    symlinkSync(core, join(dir, 'node_modules/@native-dates/core'));
    const found = new Project({
      root: dir,
      packageDir: published,
      name: 'native-dates',
      version,
      aliases: ['@native-dates/core'],
      note: '',
    }).aliasSibling;
    expect(found).not.toContain('..');
    expect(existsSync(join(dir, found, 'skills/native-dates/SKILL.md'))).toBe(true);
  });

  it('replaces its own stale copy with a link once there is an installed copy to follow', () => {
    const dir = project();
    setup(dir, '--yes', '--no-install');
    const folder = join(dir, '.agents/skills/native-dates');
    expect(lstatSync(folder).isSymbolicLink()).toBe(false);
    const copied = join(folder, 'SKILL.md');
    writeFileSync(copied, readFileSync(copied, 'utf8').replace(`version: "${version}"`, 'version: "0.0.1"'));
    installed(dir, version);
    expect(setup(dir, '--yes').status).toBe(0);
    expect(lstatSync(folder).isSymbolicLink()).toBe(true);
  });

  it('is set up after one run when a folder is filled in a project whose note names the installed copy', () => {
    const dir = project();
    setupWith({ agents: ['claude'] }, dir, '--yes', '--global');
    const note = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    expect(note).toContain('node_modules/native-dates/skills/native-dates/SKILL.md');
    expect(setupWith({ agents: ['claude'] }, dir, '--yes').status).toBe(0);
    expect(existsSync(join(dir, '.claude/skills/native-dates/SKILL.md'))).toBe(true);
    expect(setupWith({ agents: ['claude'] }, dir)).toMatchObject({ status: 0, calls: '' });
    expect(readFileSync(join(dir, 'AGENTS.md'), 'utf8')).toBe(note);
  });

  it('says the skill matches the installed version only where the skill is the installed copy itself', () => {
    const matches = fill(copy.noteInstalled, { name: 'native-dates' });
    const linked = project();
    setup(linked, '--yes');
    expect(readFileSync(join(linked, 'AGENTS.md'), 'utf8')).toContain(matches);
    expect(setup(linked)).toMatchObject({ status: 0, calls: '' });
    // under Plug'n'Play the skill is a copy from this command's package, which nothing ties to what is installed
    const copied = project({ ...dependsOn, '.pnp.cjs': '' });
    setup(copied, '--yes');
    const note = readFileSync(join(copied, 'AGENTS.md'), 'utf8');
    expect(note).toContain('.agents/skills/native-dates/SKILL.md');
    expect(note).not.toContain(matches);
    expect(setup(copied)).toMatchObject({ status: 0, calls: '' });
  });

  it('refuses outside a project and on an unknown option without writing', () => {
    const empty = mkdtempSync(join(scratch, 'empty-'));
    expect(setup(empty, '--yes').status).toBe(1);
    expect(existsSync(join(empty, 'AGENTS.md'))).toBe(false);
    const dir = project();
    expect(setup(dir, '--force')).toMatchObject({ status: 1, calls: '' });
    // a word every object carries is not an option either
    expect(setup(dir, 'toString')).toMatchObject({ status: 1, calls: '' });
    expect(existsSync(join(dir, 'AGENTS.md'))).toBe(false);
  });
});
