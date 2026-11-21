#!/usr/bin/env node
// sets a project up for coding agents: installs native-dates, puts its skills where agents look, and points AGENTS.md at them

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

// runs on Node versions older than `engines` so they get setup and a Temporal note, not a syntax error
const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { name, version } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
const scopedName = '@native-dates/core';

const realPath = (path) => {
  try {
    return realpathSync(path);
  }
  catch {
    return null;
  }
};

class Project {
  // Codex and Antigravity read .agents/skills, Claude Code reads .claude/skills, Cursor, Copilot and OpenCode read both
  static skillFolders = ['.agents/skills', '.claude/skills'];

  static lockfiles = {
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'bun.lock': 'bun',
    'bun.lockb': 'bun',
    'package-lock.json': 'npm',
    'npm-shrinkwrap.json': 'npm',
  };

  static addCommands = { npm: 'install', pnpm: 'add', yarn: 'add', bun: 'add' };

  // where the package sits when it is a direct dependency, nested under the scoped alias, or the alias's pnpm sibling
  static installPaths = [
    `node_modules/${name}`,
    `node_modules/${scopedName}/node_modules/${name}`,
    `node_modules/${scopedName}/../../${name}`,
  ];

  static noteMarkers = [`<!-- ${name}:start -->`, `<!-- ${name}:end -->`];

  static note = [
    Project.noteMarkers[0],
    `## ${name}`,
    '',
    `Dates, times, time zones, durations, and ranges in this project use \`${name}\`. Its API differs from Moment, Day.js, date-fns, Luxon, and raw Temporal, and is likely newer than your training data. Read \`.agents/skills/${name}/SKILL.md\` before writing or reviewing date or time code.`,
    Project.noteMarkers[1],
  ].join('\n');

  constructor(root) {
    this.root = root;
    this.manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    this.skills = readdirSync(join(packageDir, 'skills'));
  }

  /*******************************
              Install
  *******************************/

  get packageManager() {
    const lockfile = Object.keys(Project.lockfiles).find((file) => existsSync(join(this.root, file)));
    if (lockfile) { return Project.lockfiles[lockfile]; }
    const declared = this.manifest.packageManager?.split('@')[0];
    const runner = process.env.npm_config_user_agent?.split('/')[0];
    return [declared, runner].find((manager) => manager in Project.addCommands) ?? 'npm';
  }

  get isDependency() {
    const { dependencies, devDependencies, optionalDependencies } = this.manifest;
    const declared = { ...dependencies, ...devDependencies, ...optionalDependencies };
    return name in declared || scopedName in declared;
  }

  // kept as written, never normalized, so the pnpm sibling path still walks through the alias's symlink
  get installPath() {
    return Project.installPaths.find((path) => existsSync(`${this.root}/${path}/package.json`));
  }

  // nothing to run under Yarn Plug'n'Play, where a declared package has no node_modules folder to appear in
  get installCommand() {
    if (this.installPath) { return null; }
    if (!this.isDependency) {
      return [this.packageManager, Project.addCommands[this.packageManager], `${name}@${version}`];
    }
    return existsSync(join(this.root, '.pnp.cjs')) ? null : [this.packageManager, 'install'];
  }

  // one shell string, since Windows only finds npm and its peers through a shell
  install() {
    const { status } = spawnSync(this.installCommand.join(' '), { cwd: this.root, stdio: 'inherit', shell: true });
    return status === 0;
  }

  /*******************************
              Skills
  *******************************/

  // the installed copy when it ships skills, so a link follows the installed version
  skillSource(skill) {
    const installed = `${this.installPath}/skills/${skill}`;
    return this.installPath && existsSync(`${this.root}/${installed}/SKILL.md`) ? installed : null;
  }

  // 'missing' | 'broken' (a link to nowhere) | 'ready' (this package's skill) | 'other' (something else, left alone)
  skillState(folder, skill) {
    const path = join(this.root, folder, skill);
    if (!lstatSync(path, { throwIfNoEntry: false })) { return 'missing'; }
    const real = realPath(path);
    if (!real) { return 'broken'; }
    const source = this.skillSource(skill);
    const from = source ? `${this.root}/${source}` : join(packageDir, 'skills', skill);
    const read = (dir) => existsSync(join(dir, 'SKILL.md')) && readFileSync(join(dir, 'SKILL.md'), 'utf8');
    return real === realPath(from) || read(real) === read(from) ? 'ready' : 'other';
  }

  get pendingSkills() {
    return Project.skillFolders.flatMap((folder) =>
      this.skills
        .filter((skill) => ['missing', 'broken'].includes(this.skillState(folder, skill)))
        .map((skill) => ({ folder, skill }))
    );
  }

  get otherSkills() {
    return Project.skillFolders.flatMap((folder) =>
      this.skills.filter((skill) => this.skillState(folder, skill) === 'other').map((skill) => `${folder}/${skill}`)
    );
  }

  // links to the installed copy, and copies where there is none to link to or the system refuses links
  placeSkill({ folder, skill }) {
    const path = join(this.root, folder, skill);
    const source = this.skillSource(skill);
    if (this.skillState(folder, skill) === 'broken') { unlinkSync(path); }
    mkdirSync(dirname(path), { recursive: true });
    if (source) {
      const target = `${relative(dirname(path), this.root) || '.'}/${source}`;
      try {
        symlinkSync(target, path, 'junction');
        return `linked  ${folder}/${skill} -> ${source}`;
      }
      catch {
        // falls through to a copy
      }
    }
    cpSync(source ? `${this.root}/${source}` : join(packageDir, 'skills', skill), path, { recursive: true });
    return `copied  ${folder}/${skill}`;
  }

  /*******************************
               Notes
  *******************************/

  // Claude Code reads AGENTS.md only when no CLAUDE.md exists, so a separate CLAUDE.md gets the note as well
  get noteFiles() {
    const claude = join(this.root, 'CLAUDE.md');
    const separate = existsSync(claude)
      && realPath(claude) !== realPath(join(this.root, 'AGENTS.md'))
      && !/@(\.\/)?AGENTS\.md/.test(readFileSync(claude, 'utf8'));
    return separate ? ['AGENTS.md', 'CLAUDE.md'] : ['AGENTS.md'];
  }

  withNote(content) {
    const [start, end] = Project.noteMarkers;
    const from = content.indexOf(start);
    const to = content.indexOf(end, from);
    if (from !== -1 && to !== -1) { return content.slice(0, from) + Project.note + content.slice(to + end.length); }
    return content.trim() ? `${content.trimEnd()}\n\n${Project.note}\n` : `${Project.note}\n`;
  }

  get pendingNotes() {
    return this.noteFiles.filter((file) => {
      const path = join(this.root, file);
      const content = existsSync(path) ? readFileSync(path, 'utf8') : '';
      return this.withNote(content) !== content;
    });
  }

  writeNote(file) {
    const path = join(this.root, file);
    const isNew = !existsSync(path);
    writeFileSync(path, this.withNote(isNew ? '' : readFileSync(path, 'utf8')));
    return `${isNew ? 'created' : 'updated'} ${file}`;
  }
}

const usage = `usage: npx ${name} [--yes]

sets the project in this folder up for coding agents
  1. installs ${name} with the project's package manager, unless it is already a dependency
  2. links its skills into .agents/skills and .claude/skills
  3. adds a short note to AGENTS.md (and CLAUDE.md when there is one) telling agents to read the skill

shows what it will change and asks before writing
  -y, --yes   make the changes without asking, for agents and scripts
  -h, --help  show this help`;

// closing without an answer, at the end of input or on Ctrl+C, counts as no
const confirm = (question) =>
  new Promise((done) => {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    let answered = false;
    prompt.on('SIGINT', () => prompt.close());
    prompt.on('close', () => {
      if (!answered) { console.log(); }
      done(false);
    });
    prompt.question(question, (answer) => {
      answered = true;
      done(['', 'y', 'yes'].includes(answer.trim().toLowerCase()));
      prompt.close();
    });
  });

async function main(args) {
  const unknown = args.find((arg) => !['-y', '--yes', '-h', '--help'].includes(arg));
  if (unknown) {
    console.error(`unknown option '${unknown}'\n\n${usage}`);
    return 1;
  }
  if (args.includes('-h') || args.includes('--help')) {
    console.log(usage);
    return 0;
  }
  if (!existsSync(join(process.cwd(), 'package.json'))) {
    console.error(`no package.json in ${process.cwd()}. Run \`npx ${name}\` from the root of your project`);
    return 1;
  }

  const project = new Project(process.cwd());
  const { installCommand, pendingSkills, pendingNotes, otherSkills } = project;
  const plan = [
    ...(installCommand ? [`install  ${installCommand.join(' ')}`] : []),
    ...pendingSkills.map(({ folder, skill }) => `skill    ${folder}/${skill}`),
    ...pendingNotes.map((file) => `note     ${file}${existsSync(join(project.root, file)) ? '' : ' (new file)'}`),
  ];
  const kept = otherSkills.map((path) => `kept    ${path} (already there with different contents)`);

  if (!plan.length) {
    console.log([`${name} is already set up for coding agents in this project`, ...kept].join('\n  '));
    return 0;
  }
  console.log(`${name} ${version} will set this project up for coding agents:\n\n  ${plan.join('\n  ')}\n`);

  if (!args.includes('-y') && !args.includes('--yes')) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.log(`nothing was written. Run \`npx ${name} --yes\` to make these changes`);
      return 1;
    }
    if (!await confirm('Make these changes? (Y/n) ')) {
      console.log('nothing was written');
      return 1;
    }
  }

  if (installCommand && !project.install()) {
    console.error(`\n\`${installCommand.join(' ')}\` failed, so no skills or notes were written`);
    return 1;
  }
  const done = [
    ...project.pendingSkills.map((pending) => project.placeSkill(pending)),
    ...project.pendingNotes.map((file) => project.writeNote(file)),
    ...kept,
  ];
  console.log(`\n  ${done.join('\n  ')}\n\ndone. Agents working in this project now find the ${name} skills`);
  if (typeof Temporal === 'undefined') {
    console.log(
      `\nthis Node (${process.version}) has no built-in Temporal. Code that runs in it needs \`@native-dates/polyfill\`, covered in the ${name}-plugins skill`,
    );
  }
  return 0;
}

process.exitCode = await main(process.argv.slice(2));
