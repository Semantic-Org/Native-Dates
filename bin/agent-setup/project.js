import { spawn } from 'node:child_process';
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
import { dirname, join, relative } from 'node:path';

const realPath = (path) => {
  try {
    return realpathSync(path);
  }
  catch {
    return null;
  }
};

/*
  the project the command runs in: what it lacks for coding agents to use the package, and the writes that add it.
  it holds facts and does the writing, each change as { step, plan, apply } where plan and what apply answers with
  are a [copy key, values] pair, so every word a person reads stays in Setup.copy
*/

export class Project {
  // where agents look for skills, and who reads each folder
  static skillFolders = {
    '.agents/skills': 'Codex, Cursor, Copilot and others',
    '.claude/skills': 'Claude Code, Cursor, Copilot and others',
  };

  static lockfiles = {
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'bun.lock': 'bun',
    'bun.lockb': 'bun',
    'package-lock.json': 'npm',
    'npm-shrinkwrap.json': 'npm',
  };

  static addCommands = { npm: 'install', pnpm: 'add', yarn: 'add', bun: 'add' };

  // root is the person's project, and packageDir the package this command shipped in
  constructor({ root, packageDir, name, version, aliases = [], note }) {
    this.root = root;
    this.packageDir = packageDir;
    this.name = name;
    this.version = version;
    this.aliases = aliases;
    this.manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    this.skills = readdirSync(join(packageDir, 'skills'));
    this.noteMarkers = [`<!-- ${name}:start -->`, `<!-- ${name}:end -->`];
    const sentence = note.replaceAll('{skill}', `.agents/skills/${name}/SKILL.md`);
    this.note = [this.noteMarkers[0], `## ${name}`, '', sentence, this.noteMarkers[1]].join('\n');
    // on disk as a direct dependency, nested under an alias, or as an alias's pnpm sibling
    this.installPaths = [
      `node_modules/${name}`,
      ...aliases.map((alias) => `node_modules/${alias}/node_modules/${name}`),
      ...aliases.map((alias) => `node_modules/${alias}/${alias.replace(/[^/]+/g, '..')}/${name}`),
    ];
  }

  /*******************************
               Plan
  *******************************/

  // every change still to make, in the order they are made, each one the person can switch off
  plan() {
    const command = this.installCommand?.join(' ');
    const pending = this.pendingSkills;
    const folders = Object.keys(Project.skillFolders).filter((folder) =>
      pending.some((skill) => skill.folder === folder)
    );
    return [
      ...(command ? [{ step: 'install', plan: ['install', { command }], apply: () => this.install() }] : []),
      ...folders.map((folder) => ({
        step: 'skills',
        plan: ['skills', { folder, readers: Project.skillFolders[folder] }],
        apply: () => ['skillsDone', { folder, ...this.placeSkills(folder) }],
      })),
      ...this.pendingNotes.map((file) => ({
        step: 'note',
        plan: [existsSync(join(this.root, file)) ? 'note' : 'noteNew', { file }],
        apply: () => [this.writeNote(file) ? 'noteCreated' : 'noteUpdated', { file }],
      })),
    ];
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
    return [this.name, ...this.aliases].some((name) => name in declared);
  }

  // kept as written, never normalized, so the pnpm sibling path still walks through the alias's symlink
  get installPath() {
    return this.installPaths.find((path) => existsSync(`${this.root}/${path}/package.json`));
  }

  // nothing to run under Yarn Plug'n'Play, where a declared package has no node_modules folder to appear in
  get installCommand() {
    if (this.installPath) { return null; }
    if (!this.isDependency) {
      return [this.packageManager, Project.addCommands[this.packageManager], `${this.name}@${this.version}`];
    }
    return existsSync(join(this.root, '.pnp.cjs')) ? null : [this.packageManager, 'install'];
  }

  // one shell string, since Windows only finds npm and its peers through a shell
  // output is held back and travels with the failure, so a good install stays one line
  install() {
    const manager = this.packageManager;
    const command = this.installCommand.join(' ');
    const done = this.isDependency ? ['installRan', { command }] : ['installAdded', { manager }];
    return new Promise((resolve, reject) => {
      const child = spawn(command, { cwd: this.root, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', (chunk) => (output += chunk));
      child.stderr.on('data', (chunk) => (output += chunk));
      const fail = (error) => reject(Object.assign(error, { command, manager, output }));
      child.on('error', fail);
      child.on('close', (status) => (status === 0 ? resolve(done) : fail(new Error(`${command} failed`))));
    });
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
    const from = source ? `${this.root}/${source}` : join(this.packageDir, 'skills', skill);
    const read = (dir) => existsSync(join(dir, 'SKILL.md')) && readFileSync(join(dir, 'SKILL.md'), 'utf8');
    return real === realPath(from) || read(real) === read(from) ? 'ready' : 'other';
  }

  skillsIn(...states) {
    return Object.keys(Project.skillFolders).flatMap((folder) =>
      this.skills.filter((skill) => states.includes(this.skillState(folder, skill))).map((skill) => ({ folder, skill }))
    );
  }

  get pendingSkills() {
    return this.skillsIn('missing', 'broken');
  }

  get otherSkills() {
    return this.skillsIn('other').map(({ folder, skill }) => `${folder}/${skill}`);
  }

  // links to the installed copy, and copies where there is none to link to or the system refuses links
  placeSkill({ folder, skill }) {
    const path = join(this.root, folder, skill);
    const source = this.skillSource(skill);
    if (this.skillState(folder, skill) === 'broken') { unlinkSync(path); }
    mkdirSync(dirname(path), { recursive: true });
    if (source) {
      try {
        symlinkSync(`${relative(dirname(path), this.root) || '.'}/${source}`, path, 'junction');
        return 'linked';
      }
      catch {
        // falls through to a copy
      }
    }
    cpSync(source ? `${this.root}/${source}` : join(this.packageDir, 'skills', skill), path, { recursive: true });
    return 'copied';
  }

  // how many skills were linked and how many copied
  // pending is read again here, since the install may have only just put the package on disk
  placeSkills(folder) {
    const placed = this.pendingSkills.filter((skill) => skill.folder === folder).map((skill) => this.placeSkill(skill));
    const count = (how) => placed.filter((entry) => entry === how).length;
    return { linked: count('linked'), copied: count('copied') };
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
    const [start, end] = this.noteMarkers;
    const from = content.indexOf(start);
    const to = content.indexOf(end, from);
    if (from !== -1 && to !== -1) { return content.slice(0, from) + this.note + content.slice(to + end.length); }
    return content.trim() ? `${content.trimEnd()}\n\n${this.note}\n` : `${this.note}\n`;
  }

  get pendingNotes() {
    return this.noteFiles.filter((file) => {
      const path = join(this.root, file);
      const content = existsSync(path) ? readFileSync(path, 'utf8') : '';
      return this.withNote(content) !== content;
    });
  }

  // answers whether the file is new
  writeNote(file) {
    const path = join(this.root, file);
    const isNew = !existsSync(path);
    writeFileSync(path, this.withNote(isNew ? '' : readFileSync(path, 'utf8')));
    return isNew;
  }
}
