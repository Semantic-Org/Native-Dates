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
  static stepFlags = { install: 'install', update: 'install', plugin: 'skills', skills: 'skills', note: 'note' };

  static flags = {
    '--yes': 'yes',
    '--global': 'global',
    '-g': 'global',
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
    tagline: 'set up coding agents for this project',
    alreadySetUp: 'already set up for coding agents',

    detected: 'found {agents}',
    detectedNone: 'no coding agents found',
    scopeQuestion: 'Install skills where?',
    scopeProject: 'This project',
    scopeMachine: 'Globally',
    globalUnavailable:
      'no agent found that `--global` can install for. It supports {agents}. Run `npx {name}` to set up this project',

    install: '`{command}`',
    plugin: '`{command}`',
    pluginDone: 'installed the {agent} plugin',
    doubled: '`{path}` is in this project too. {agent} will load the skill twice',
    doubledLabel: 'twice',
    claudeUpdates:
      'Claude Code updates the plugin with `claude plugin update {name}@{name}`. Turn on auto-update in `/plugin`',
    update: '`{command}`. {from} -> {to}',
    updateName: 'update {from} -> {to}',
    skills: '`{folder}`. {readers}',
    note: '`{file}`. Add skill note',
    noteNew: '`{file}`. Create with skill note',

    installAdded: 'added `{name}@{version}` ({manager})',
    installRan: 'ran `{command}`',
    updateDone: 'updated `{name}` {from} -> {to} ({manager})',
    skillsDone: '{placed} in `{folder}`',
    skillsWithheld: '`{folder}` skipped. Installed {from} has no skills (CLI is {to})',
    noteWithheld: '`{file}` skipped. No skills installed',
    linked: 'linked {count} {noun}',
    copied: 'copied {count} {noun}',
    nouns: ['skill', 'skills'],
    noteCreated: 'created `{file}`',
    noteUpdated: 'updated `{file}`',

    question: 'Apply changes?',
    yes: 'Yes',
    choose: 'Customize',
    no: 'No',
    pickOneKeys: ['{arrows} move', 'enter confirm'],
    chooseQuestion: 'Which changes?',
    pickSeveralKeys: ['{arrows} move', 'space toggle', 'enter confirm', 'esc back'],
    noneSelected: 'nothing selected. Space to toggle, esc to go back',
    cancelled: 'cancelled',
    typedQuestion: 'Apply changes? (Y/n) ',
    declined: 'no changes made',
    needsYes: 'no changes made. Run `npx {name} {flags}` to apply',

    ready: 'ready. Agents can now find {skills}',
    notReady: 'setup incomplete. Update `{name}` to {version} and re-run `npx {name}`',
    newer: '`{name}@{installed}`. Newer than CLI ({version})',
    docs: 'docs: {homepage}',
    again: 'skip prompts next time: `npx {name} {flags}`',
    kept: '`{path}`. Already exists with different contents',
    pluginFailed:
      '`{command}` failed. No further changes made. Fix the {manager} error below, then re-run `npx {name}`',
    failed:
      '`{command}` failed. No further changes made. Fix the {manager} error below or install `{name}` manually, then re-run `npx {name}`',
    noProject: 'no `package.json` in {folder}. Run `npx {name}` from your project root',
    unknownOption: 'unknown option `{option}`. Run `npx {name} --help` for usage',
    usage: `Usage: npx {name} [options]

Set up coding agents for this project:
  install  install {name} or update an older version
  skills   link skills into .agents/skills and .claude/skills, or with --global install each agent's plugin
  note     add a skill pointer to AGENTS.md (and CLAUDE.md if present)

Options (previews changes and prompts by default):
  -g, --global    install skills globally instead of in this project
  -y, --yes       apply without prompting (for agents and scripts)
  --no-install    skip installing or updating {name}
  --no-skills     skip linking skills
  --no-note       skip editing AGENTS.md and CLAUDE.md
  -v, --version   show version
  -h, --help      show help`,
  };

  // packageUrl is the package.json beside the bin, and note is what agents are told, {skill} standing for the
  // entry skill's path. aliases are other names the package installs under, notices are { label, text } rows to
  // end on, such as a runtime the package needs, and copy replaces any of Setup.copy
  constructor({ packageUrl, note, aliases = [], notices = [], copy = {}, root = process.cwd(), terminal } = {}) {
    const packageDir = dirname(fileURLToPath(packageUrl));
    const { name, version, homepage, repository } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
    // owner/repo, which is how each agent's plugin command names a GitHub repository
    const repo = (repository?.url ?? repository)?.replace(/^(git\+)?https?:\/\/github\.com\//, '').replace(
      /\.git$/,
      '',
    );
    Object.assign(this, { name, version, homepage, repo, packageDir, note, aliases, notices, root });
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
    const found = this.project.agents;
    const asking = !this.given.has('yes');
    const live = asking && terminal.redraws;
    // a global install needs an agent that installs plugins from a command, so without one the flag is refused
    // and the question is never asked, since writing project folders is not what the flag asks for
    this.offersMachine = this.project.pluginAgents.length > 0;
    if (this.given.has('global') && !this.offersMachine) {
      const agents = Object.keys(Project.agents).filter((agent) => Project.agents[agent].plugin);
      return this.refuse('globalUnavailable', { agents: joinWords(agents) });
    }
    const agents = this.words(found.length ? 'detected' : 'detectedNone', { agents: joinWords(found) });
    terminal.line(`\n  ${terminal.badge()} ${terminal.say(version)}`);
    terminal.line(`  ${terminal.say(this.words('tagline'), { faded: true })}`);
    terminal.line(`  ${terminal.say(agents, { faded: true })}\n`);

    // with nobody to pick, where the skills go comes from the flag, and what will change is printed once
    if (!live) {
      this.plan(this.given.has('global') ? 'machine' : 'project');
      if (!this.items.length) { return this.settled(); }
      if (asking) {
        for (const line of this.preview()) { terminal.line(line); }
        terminal.line();
        // the same run with yes added, so a flag already given is not lost when it is typed again
        const flags = ['--yes', ...args.filter((arg) => Setup.flags[arg] !== 'yes')].join(' ');
        if (!terminal.interactive) { return this.print(terminal.say(this.words('needsYes', { flags })), 1); }
      }
    }
    if (terminal.redraws) { terminal.hideCursor(); }
    try {
      if (asking && !await this.ask()) {
        return this.print(`  ${terminal.say(this.words('declined'), { faded: true })}\n`);
      }
      if (!this.items.length) { return this.settled(); }
      if (asking) { terminal.line(); }
      return this.finish(await this.apply(), asking);
    }
    finally {
      if (terminal.redraws) { terminal.restoreCursor(); }
    }
  }

  // the changes for one answer to where the skills go, and what is left alone
  plan(scope) {
    const { terminal, project } = this;
    const { installedVersion: installed, isNewer } = project;
    this.scope = scope;
    this.items = project.plan(scope).filter(({ step }) => !this.given.has(`no-${Setup.stepFlags[step]}`)).map((
      item,
    ) => ({
      ...item,
      label: item.step,
      // what the change is called once chosen: its agent, folder or file, or the step itself
      name: item.agent ?? item.plan[1].folder ?? item.plan[1].file
        ?? (item.step === 'update' ? this.words('updateName', item.plan[1]) : item.step),
      text: this.words(...item.plan),
      on: item.selected ?? true,
    }));
    this.kept = project.otherSkills.map((path) => terminal.row('warn', 'kept', this.words('kept', { path })));
    if (isNewer) { this.kept.push(terminal.row('warn', 'kept', this.words('newer', { installed }))); }
  }

  // a line for each place an agent that gets a plugin will also find the skill in this project
  // nothing is deleted for it, since the folder may serve another agent or another person's choice
  doubled() {
    const { terminal, project, copy } = this;
    const folders = this.items.filter(({ on, folder }) => on && folder).map(({ folder }) => folder);
    return this.items.filter(({ on, step }) => on && step === 'plugin').flatMap(({ agent }) =>
      project.doubled(agent, folders).flatMap((path) =>
        terminal.rows('warn', copy.doubledLabel, this.words('doubled', { agent, path }))
      )
    );
  }

  // what will change, beside a rule and without marks, so it reads as a preview and never as choices
  preview() {
    const rows = this.items.filter(({ on }) => on).flatMap(({ label, text }) =>
      this.terminal.rows('rail', label, text)
    );
    return [...rows, ...this.doubled()];
  }

  // nothing left to change for the answer given
  settled() {
    const { terminal } = this;
    terminal.line(`  ${terminal.say(this.words('alreadySetUp'), { faded: true })}\n`);
    for (const line of this.kept) { terminal.line(line); }
    return 0;
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
    const { terminal, copy } = this;
    if (!terminal.redraws) { return ['', 'y', 'yes'].includes(await terminal.readLine(`  ${copy.typedQuestion}`)); }
    const keys = (hints) => hints.map((hint) => fill(hint, { arrows: terminal.marks.arrows }));
    const { cancelled } = copy;
    const scopes = [copy.scopeProject, copy.scopeMachine];
    const options = [copy.yes, copy.choose, copy.no];
    // where the skills go is asked first, since it decides what there is to approve
    // it is not asked when a flag already answered it, or when this project is the only place they can go
    const asksScope = this.offersMachine && !this.given.has('global');
    let agreed = null;
    for (let scope = this.given.has('global') ? 1 : 0; agreed === null;) {
      if (asksScope) {
        scope = await terminal.pickOne(copy.scopeQuestion, scopes, {
          keys: keys(copy.pickOneKeys),
          cancelled,
          highlighted: scope,
        });
      }
      if (scope === -1) { return this.answered(false); }
      this.plan(scope === 1 ? 'machine' : 'project');
      if (!this.items.length) { return this.answered(true); }
      const record = asksScope ? [terminal.record(copy.scopeQuestion, scopes[scope]), ''] : [];
      const above = [...record, ...this.preview(), ''];
      for (let highlighted = 0; agreed === null; highlighted = 1) {
        const answer = await terminal.pickOne(copy.question, options, {
          keys: keys(copy.pickOneKeys),
          shortcuts: { y: 0, n: 2 },
          cancelled,
          highlighted,
          above,
          back: asksScope,
        });
        // esc steps back to where the skills go
        if (answer === null) { break; }
        if (answer === 1) {
          agreed = await terminal.pickSeveral(copy.chooseQuestion, this.items, {
            keys: keys(copy.pickSeveralKeys),
            empty: copy.noneSelected,
            cancelled,
            above: [...above, terminal.record(copy.question, copy.choose)],
          });
        }
        else {
          agreed = answer === 0;
          // yes means the changes as previewed, whatever was switched before stepping back
          if (agreed) { for (const item of this.items) { item.on = item.selected ?? true; } }
        }
      }
    }
    return this.answered(agreed);
  }

  // leaves the records where they are and hands the keyboard back
  answered(agreed) {
    this.terminal.release();
    this.terminal.stopKeys();
    return agreed;
  }

  // the flags that repeat this run without questions, or nothing when a choice has no flag to stand for it
  get repeatFlags() {
    const steps = ['install', 'skills', 'note'];
    const given = steps.filter((step) => this.given.has(`no-${step}`)).map((step) => `--no-${step}`);
    const flags = ['--yes', ...(this.scope === 'machine' ? ['--global'] : []), ...given];
    for (const step of steps) {
      const items = this.items.filter(({ label }) => Setup.stepFlags[label] === step);
      const isChanged = items.some(({ on, selected = true }) => on !== selected);
      const isAllOff = items.every(({ on }) => !on);
      if (isChanged && !isAllOff) { return null; }
      if (isChanged) { flags.push(`--no-${step}`); }
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
      const key = Project.agents[failure.manager] ? 'pluginFailed' : 'failed';
      terminal.line(`\n  ${terminal.say(this.words(key, failure), { level: 'error' })}`);
      if (failure.output?.trim()) {
        terminal.line(`\n${terminal.say(failure.output.trim().replace(/^/gm, '    '), { faded: true })}`);
      }
      terminal.line();
      return 1;
    }
    for (const line of [...this.kept, ...this.doubled()]) { terminal.line(line); }
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
    // how each agent that got a plugin keeps it current, where the agent leaves that to the person
    for (const { agent, state } of this.items) {
      const updates = state === 'done' && agent && Project.agents[agent].updates;
      if (updates) { terminal.line(`    ${terminal.say(this.words(updates), { faded: true })}`); }
    }
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
