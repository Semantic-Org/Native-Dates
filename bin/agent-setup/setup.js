import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fill, joinWords } from './helpers.js';
import { Project } from './project.js';
import { Terminal } from './terminal.js';

/*
  the setup command a package ships as its bin. it lists what a project lacks for coding agents to use the package,
  asks, then makes the changes: an install, links to the package's skills, and a note in AGENTS.md.
  nothing in this folder names a package. a sibling library copies the folder whole and calls setup() from its own
  bin with its package.json and the note its agents should read
*/

export class Setup {
  static flags = {
    '--yes': 'yes',
    '-y': 'yes',
    '--no-install': 'no-install',
    '--no-skills': 'no-skills',
    '--no-note': 'no-note',
    '--help': 'help',
    '-h': 'help',
    '--version': 'version',
    '-v': 'version',
  };

  // every word the command prints, each open to a library through the copy option
  static copy = {
    tagline: 'sets this project up for coding agents',
    alreadySetUp: 'already set up for coding agents in this project',

    install: '`{command}`',
    skills: '`{folder}` for {readers}',
    note: '`{file}` gains a note telling agents to read the skill first',
    noteNew: '`{file}` is created, telling agents to read the skill first',

    installAdded: 'added `{name}@{version}` with {manager}',
    installRan: 'ran `{command}`',
    skillsDone: '{placed} into `{folder}`',
    linked: 'linked {count} {noun}',
    copied: 'copied {count} {noun}',
    nouns: ['skill', 'skills'],
    noteCreated: 'created `{file}`',
    noteUpdated: 'added the note to `{file}`',

    question: 'Make these changes?',
    answerKeys: ['enter yes', 'c choose', 'n no'],
    chooseKeys: ['arrows move', 'space switch on or off', 'enter confirm', 'esc cancel'],
    typedQuestion: 'Make these changes? (Y/n) ',
    declined: 'nothing was written',
    needsYes: 'nothing was written. Run `npx {name} --yes` to make these changes',

    ready: 'ready. Agents working in this project now find {skills}',
    docs: 'docs {homepage}',
    kept: '`{path}` was already there with different contents. Left as it was',
    failed:
      '`{command}` failed, so nothing after it was written. Fix what {manager} reports below, or install `{name}` yourself, then run `npx {name}` again',
    noProject: 'no `package.json` in {folder}. Run `npx {name}` from the root of your project',
    unknownOption: "unknown option '{option}'. Run `npx {name} --help` for the ones it takes",
    usage: `usage: npx {name} [options]

sets the project in this folder up for coding agents
  install  adds {name} with the project's package manager, unless it is already a dependency
  skills   links its skills into .agents/skills and .claude/skills
  note     adds a short note to AGENTS.md (and CLAUDE.md when there is one) telling agents to read the skill

shows what it will change and asks before writing
  -y, --yes       make the changes without asking, for agents and scripts
  --no-install    leave the package to you
  --no-skills     leave the skill folders alone
  --no-note       leave AGENTS.md and CLAUDE.md alone
  -v, --version   show the version
  -h, --help      show this help`,
  };

  // packageUrl is the package.json beside the bin, and note is what agents are told, {skill} standing for the
  // entry skill's path. aliases are other names the package installs under, notices are { label, text } rows to
  // end on, such as a runtime the package needs, and copy replaces any of Setup.copy
  constructor({ packageUrl, note, aliases = [], notices = [], copy = {}, root = process.cwd(), terminal } = {}) {
    const packageDir = dirname(fileURLToPath(packageUrl));
    const { name, version, homepage } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
    Object.assign(this, { name, version, homepage, packageDir, note, aliases, notices, root });
    this.copy = { ...Setup.copy, ...copy };
    this.terminal = terminal ?? new Terminal({ namespace: name });
  }

  /*******************************
                Run
  *******************************/

  // answers with the exit code: 0 when the project is set up, 1 when nothing or not everything was written
  async run(args = process.argv.slice(2)) {
    const { terminal, name, version, root } = this;
    const option = args.find((arg) => !(arg in Setup.flags));
    this.given = new Set(args.map((arg) => Setup.flags[arg]));
    if (option) { return this.refuse('unknownOption', { option }); }
    if (this.given.has('help')) { return this.print(this.words('usage')); }
    if (this.given.has('version')) { return this.print(version); }
    if (!existsSync(join(root, 'package.json'))) { return this.refuse('noProject', { folder: root }); }

    this.project = new Project({ ...this, root });
    this.items = this.project.plan().filter(({ step }) => !this.given.has(`no-${step}`)).map((item) => ({
      ...item,
      state: 'todo',
      on: true,
      text: this.words(...item.plan),
    }));
    this.kept = this.project.otherSkills.map((path) => terminal.row('warn', 'kept', this.words('kept', { path })));

    const setUp = !this.items.length;
    terminal.line(`\n  ${terminal.badge()} ${terminal.say(version)}`);
    terminal.line(`  ${terminal.say(this.words(setUp ? 'alreadySetUp' : 'tagline'), { faded: true })}\n`);
    if (setUp) {
      for (const line of this.kept) { terminal.line(line); }
      return 0;
    }
    if (terminal.redraws) { terminal.hideCursor(); }
    if (!this.given.has('yes') && !await this.ask()) { return this.decline(); }
    return this.finish(await this.apply());
  }

  print(text) {
    this.terminal.line(text);
    return 0;
  }

  refuse(key, values) {
    console.error(`${this.terminal.badge('error')} ${this.terminal.say(this.words(key, values), { level: 'error' })}`);
    return 1;
  }

  /*******************************
                Ask
  *******************************/

  // true when the person agrees to at least one change
  // where lines redraw it is one key, elsewhere a typed answer, and with nobody to ask it is the way to say yes
  async ask() {
    const { terminal, copy } = this;
    if (!terminal.redraws) {
      for (const line of this.rows()) { terminal.line(line); }
      terminal.line();
      if (!terminal.interactive) { return false; }
      const agreed = ['', 'y', 'yes'].includes(await terminal.readLine(`  ${copy.typedQuestion}`));
      if (agreed) { terminal.line(); }
      return agreed;
    }
    terminal.draw([...this.rows(), '', `  ${terminal.strong(copy.question)}  ${terminal.hint(...copy.answerKeys)}`]);
    const answers = { return: 'yes', enter: 'yes', y: 'yes', c: 'choose', n: 'no', escape: 'no', q: 'no' };
    let answer;
    while (!answer) { answer = answers[await terminal.readKey()]; }
    const agreed = answer === 'yes' || (answer === 'choose' && await this.choose());
    terminal.stopKeys();
    return agreed;
  }

  // the same list with a switch on each line, true when the person confirms with something still on
  async choose() {
    const { terminal, items, copy } = this;
    for (let at = 0;;) {
      terminal.draw([
        ...items.map(({ on, step, text }, index) => {
          const pointer = index === at ? terminal.mark('cursor') : ' '.repeat(terminal.marks.cursor.length);
          return `  ${pointer} ${terminal.row(on ? 'on' : 'off', step, text, { fit: true }).trimStart()}`;
        }),
        '',
        `  ${terminal.hint(...copy.chooseKeys)}`,
      ]);
      const key = await terminal.readKey();
      if (['up', 'k'].includes(key)) { at = (at + items.length - 1) % items.length; }
      else if (['down', 'j', 'tab'].includes(key)) { at = (at + 1) % items.length; }
      else if (key === 'space') { items[at].on = !items[at].on; }
      else if (['return', 'enter'].includes(key)) { return items.some(({ on }) => on); }
      else if (['escape', 'q'].includes(key)) { return false; }
    }
  }

  // with nobody to ask, the refusal carries the command that says yes
  decline() {
    const { terminal } = this;
    for (const item of this.items) { item.on = true; }
    if (terminal.redraws) {
      terminal.draw([...this.rows(), '', `  ${terminal.say(this.words('declined'), { faded: true })}`]);
      terminal.restoreCursor();
    }
    else { terminal.line(terminal.interactive ? `  ${this.words('declined')}` : this.words('needsYes')); }
    if (terminal.interactive) { terminal.line(); }
    return 1;
  }

  /*******************************
               Apply
  *******************************/

  // makes each change that is still on, in order, and answers with the failure that stopped it, if one did
  // where lines redraw the list itself turns from plan into progress, elsewhere each result is one new line
  async apply() {
    const { terminal } = this;
    const stop = terminal.redraws ? terminal.animate(() => terminal.draw(this.rows())) : () => {};
    let failure;
    for (const item of this.items.filter(({ on }) => on)) {
      item.started = Date.now();
      item.state = 'busy';
      if (terminal.redraws) { terminal.draw(this.rows()); }
      try {
        item.text = this.words(...await item.apply());
        item.state = 'done';
        if (item.step === 'install') { item.tail = `${((Date.now() - item.started) / 1000).toFixed(1)}s`; }
      }
      catch (error) {
        item.state = 'fail';
        failure = error;
      }
      if (terminal.redraws) { terminal.draw(this.rows()); }
      else { terminal.line(this.row(item)); }
      if (failure) { break; }
    }
    stop();
    if (terminal.redraws) {
      terminal.release();
      terminal.restoreCursor();
    }
    return failure;
  }

  // what was done, what was left alone, and where to go next, or why it stopped and the way out
  finish(failure) {
    const { terminal, homepage, notices } = this;
    if (failure) {
      terminal.line(`\n  ${terminal.say(this.words('failed', failure), { level: 'error' })}`);
      if (failure.output?.trim()) {
        terminal.line(`\n${terminal.say(failure.output.trim().replace(/^/gm, '    '), { faded: true })}`);
      }
      terminal.line();
      return 1;
    }
    for (const line of this.kept) { terminal.line(line); }
    const skills = joinWords(this.project.skills.map((skill) => `\`${skill}\``));
    terminal.line(`\n  ${terminal.mark('done')} ${terminal.say(this.words('ready', { skills }))}`);
    if (homepage) { terminal.line(`    ${terminal.say(this.words('docs', { homepage }), { faded: true })}`); }
    if (notices.length) { terminal.line(); }
    for (const { label, text } of notices) { terminal.line(terminal.row('warn', label, text)); }
    terminal.line();
    return 0;
  }

  /*******************************
               Words
  *******************************/

  // a sentence from the copy, filled with the package's own facts and what the caller adds
  words(key, values = {}) {
    const { copy, name, version, homepage } = this;
    const [one, many] = copy.nouns;
    const placed = ['linked', 'copied'].filter((how) => values[how]).map((how) =>
      fill(copy[how], { count: values[how], noun: values[how] === 1 ? one : many })
    );
    return fill(copy[key], { name, version, homepage, placed: placed.join(' and '), ...values });
  }

  // a busy row counts its seconds, and a finished install keeps the time it took
  row({ state, step, text, started, tail }) {
    const seconds = state === 'busy' ? `${Math.floor((Date.now() - started) / 1000)}s` : tail;
    return this.terminal.row(state, step, text, { tail: seconds, fit: this.terminal.redraws });
  }

  rows() {
    return this.items.filter(({ on }) => on).map((item) => this.row(item));
  }
}

export const setup = (options, args) => new Setup(options).run(args);
