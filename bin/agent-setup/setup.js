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
  // the flag that switches each step off: an update is the install step for a project that has an older copy
  static stepFlags = { install: 'install', update: 'install', skills: 'skills', note: 'note' };

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
    update: '`{command}` takes `{name}` from {from} to {to}',
    updateName: 'update {from} to {to}',
    skills: '`{folder}` for {readers}',
    note: '`{file}` gains a note telling agents to read the skill first',
    noteNew: '`{file}` is created, telling agents to read the skill first',

    installAdded: 'added `{name}@{version}` with {manager}',
    installRan: 'ran `{command}`',
    updateDone: 'updated `{name}` from {from} to {to} with {manager}',
    skillsDone: '{placed} into `{folder}`',
    skillsWithheld:
      'nothing placed in `{folder}`. The installed {from} carries no skills, and the ones in {to} describe a different version',
    noteWithheld: '`{file}` left alone, since there is no skill for it to point to',
    linked: 'linked {count} {noun}',
    copied: 'copied {count} {noun}',
    nouns: ['skill', 'skills'],
    noteCreated: 'created `{file}`',
    noteUpdated: 'added the note to `{file}`',

    question: 'Make these changes?',
    yes: 'Yes',
    choose: 'Let me choose',
    no: 'No',
    pickOneKeys: ['{arrows} to move', 'enter to confirm'],
    chooseQuestion: 'Which changes?',
    pickSeveralKeys: ['{arrows} to move', 'space to select', 'enter to confirm', 'esc to go back'],
    noneSelected: 'nothing is selected. Press space to select a change, or esc to go back',
    cancelled: 'cancelled',
    typedQuestion: 'Make these changes? (Y/n) ',
    declined: 'nothing was written',
    needsYes: 'nothing was written. Run `npx {name} --yes` to make these changes',

    ready: 'ready. Agents working in this project now find {skills}',
    notReady: 'not set up. Update `{name}` to {version}, then run `npx {name}` again',
    newer: '`{name}@{installed}` is newer than this command ({version}) and was left as it is',
    docs: 'docs at {homepage}',
    again: 'to skip the questions next time, run `npx {name} {flags}`',
    kept: '`{path}` was already there with different contents. Left as it was',
    failed:
      '`{command}` failed, so nothing after it was written. Fix what {manager} reports below, or install `{name}` yourself, then run `npx {name}` again',
    noProject: 'no `package.json` in {folder}. Run `npx {name}` from the root of your project',
    unknownOption: "unknown option '{option}'. Run `npx {name} --help` for the ones it takes",
    usage: `usage: npx {name} [options]

sets the project in this folder up for coding agents
  install  adds {name} with the project's package manager, or updates a copy older than this command
  skills   links its skills into .agents/skills and .claude/skills
  note     adds a short note to AGENTS.md (and CLAUDE.md when there is one) telling agents to read the skill

shows what it will change and asks before writing
  -y, --yes       make the changes without asking, for agents and scripts
  --no-install    leave the package as it is, neither added nor updated
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

  // answers with the exit code: 0 when the project is set up or the person declined, 1 when a step failed
  // or nobody could be asked
  async run(args = process.argv.slice(2)) {
    const { terminal, name, version, root } = this;
    const option = args.find((arg) => !(arg in Setup.flags));
    this.given = new Set(args.map((arg) => Setup.flags[arg]));
    if (option) { return this.refuse('unknownOption', { option }); }
    if (this.given.has('help')) { return this.print(this.words('usage')); }
    if (this.given.has('version')) { return this.print(version); }
    if (!existsSync(join(root, 'package.json'))) { return this.refuse('noProject', { folder: root }); }

    this.project = new Project({ ...this, root });
    const { installedVersion: installed, isNewer } = this.project;
    this.items = this.project.plan().filter(({ step }) => !this.given.has(`no-${Setup.stepFlags[step]}`)).map((
      item,
    ) => ({
      ...item,
      label: item.step,
      // what the change is called once chosen: its folder or file, or the step itself
      name: item.plan[1].folder ?? item.plan[1].file
        ?? (item.step === 'update' ? this.words('updateName', item.plan[1]) : item.step),
      text: this.words(...item.plan),
      on: true,
    }));
    this.kept = this.project.otherSkills.map((path) => terminal.row('warn', 'kept', this.words('kept', { path })));
    if (isNewer) { this.kept.push(terminal.row('warn', 'kept', this.words('newer', { installed }))); }

    const setUp = !this.items.length;
    terminal.line(`\n  ${terminal.badge()} ${terminal.say(version)}`);
    terminal.line(`  ${terminal.say(this.words(setUp ? 'alreadySetUp' : 'tagline'), { faded: true })}\n`);
    if (setUp) {
      for (const line of this.kept) { terminal.line(line); }
      return 0;
    }
    const asking = !this.given.has('yes');
    if (asking) {
      // what will change, beside a rule and without marks, so it reads as a preview and never as choices
      for (const { label, text } of this.items) { terminal.line(terminal.row('rail', label, text)); }
      terminal.line();
      if (!terminal.interactive) { return this.print(this.words('needsYes'), 1); }
    }
    if (terminal.redraws) { terminal.hideCursor(); }
    try {
      if (asking && !await this.ask()) {
        return this.print(`  ${terminal.say(this.words('declined'), { faded: true })}\n`);
      }
      if (asking) { terminal.line(); }
      return this.finish(await this.apply(), asking);
    }
    finally {
      if (terminal.redraws) { terminal.restoreCursor(); }
    }
  }

  print(text, status = 0) {
    this.terminal.line(text);
    return status;
  }

  refuse(key, values) {
    console.error(`${this.terminal.badge('error')} ${this.terminal.say(this.words(key, values), { level: 'error' })}`);
    return 1;
  }

  /*******************************
                Ask
  *******************************/

  // true when the person agrees to at least one change
  // one question is live at a time, enter takes its highlighted default, and each answer stays as a record
  // esc in the second question steps back to the first, with the highlight on the option that led there
  async ask() {
    const { terminal, copy, items } = this;
    if (!terminal.redraws) { return ['', 'y', 'yes'].includes(await terminal.readLine(`  ${copy.typedQuestion}`)); }
    const keys = (hints) => hints.map((hint) => fill(hint, { arrows: terminal.marks.arrows }));
    const { cancelled } = copy;
    const options = [copy.yes, copy.choose, copy.no];
    let agreed = null;
    for (let highlighted = 0; agreed === null; highlighted = 1) {
      const answer = await terminal.pickOne(copy.question, options, {
        keys: keys(copy.pickOneKeys),
        shortcuts: { y: 0, n: 2 },
        cancelled,
        highlighted,
      });
      if (answer === 1) {
        agreed = await terminal.pickSeveral(copy.chooseQuestion, items, {
          keys: keys(copy.pickSeveralKeys),
          empty: copy.noneSelected,
          cancelled,
          above: [terminal.record(copy.question, copy.choose)],
        });
      }
      else {
        agreed = answer === 0;
        // yes means every change, whatever was switched off before stepping back
        if (agreed) { for (const item of items) { item.on = true; } }
      }
    }
    terminal.release();
    terminal.stopKeys();
    return agreed;
  }

  // the flags that repeat this run without questions, or nothing when a choice has no flag to stand for it
  get repeatFlags() {
    const steps = ['install', 'skills', 'note'];
    const flags = ['--yes', ...steps.filter((step) => this.given.has(`no-${step}`)).map((step) => `--no-${step}`)];
    for (const step of steps) {
      const items = this.items.filter(({ label }) => Setup.stepFlags[label] === step);
      const off = items.filter(({ on }) => !on).length;
      if (off && off < items.length) { return null; }
      if (off) { flags.push(`--no-${step}`); }
    }
    return flags.join(' ');
  }

  /*******************************
               Apply
  *******************************/

  // makes each change that is still selected, in order, and answers with the failure that stopped it, if one did
  // each step is one line: a turning mark and a count of seconds while it runs, then what was done
  async apply() {
    const { terminal } = this;
    for (const item of this.items.filter(({ on }) => on)) {
      const show = () => terminal.draw([this.row(item)]);
      item.started = Date.now();
      item.state = 'busy';
      const stop = terminal.redraws ? terminal.animate(show) : () => {};
      if (terminal.redraws) { show(); }
      let failure;
      try {
        const [key, values, state = 'done'] = await item.apply();
        item.text = this.words(key, values);
        item.state = state;
        if (Setup.stepFlags[item.label] === 'install') {
          item.tail = `${((Date.now() - item.started) / 1000).toFixed(1)}s`;
        }
      }
      catch (error) {
        item.state = 'fail';
        failure = error;
      }
      stop();
      if (terminal.redraws) {
        show();
        terminal.release();
      }
      else { terminal.line(this.row(item)); }
      if (failure) { return failure; }
    }
  }

  // what was done, what was left alone, and where to go next, or why it stopped and the way out
  finish(failure, asked) {
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
    const flags = asked && this.repeatFlags;
    // ready only when an agent has a skill to read, which a withheld step can leave it without
    const isReady = existsSync(`${this.root}/${this.project.skillPath}`);
    const closing = isReady ? this.words('ready', { skills }) : this.words('notReady');
    terminal.line(
      `\n  ${terminal.mark(isReady ? 'done' : 'warn')} ${terminal.say(closing, { level: isReady ? 'info' : 'warn' })}`,
    );
    if (homepage) { terminal.line(`    ${terminal.say(this.words('docs'), { faded: true })}`); }
    if (flags && isReady) { terminal.line(`    ${terminal.say(this.words('again', { flags }), { faded: true })}`); }
    if (notices.length) { terminal.line(); }
    for (const { label, text } of notices) { terminal.line(terminal.row('warn', label, text)); }
    terminal.line();
    // a run that could place no skill has not done what was asked
    return isReady ? 0 : 1;
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

  // a busy row counts its seconds and is cut to the width, since it is redrawn in place. a finished one prints whole
  row({ state, label, text, started, tail }) {
    const seconds = state === 'busy' ? `${Math.floor((Date.now() - started) / 1000)}s` : tail;
    return this.terminal.row(state, label, text, { tail: seconds, fit: this.terminal.redraws && state === 'busy' });
  }
}

export const setup = (options, args) => new Setup(options).run(args);
