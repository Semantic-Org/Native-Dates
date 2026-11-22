import { createInterface, emitKeypressEvents } from 'node:readline';

/*
  the organisation's terminal voice for a command a person watches. the look is formatServerLog's in @semantic-ui/utils:
  a bold [namespace] badge, grey prose with brighter tokens, later sentences that recede, colour only where it shows.
  it adds what a log line has no use for: a mark per row, a block of lines redrawn in place, and key input
*/

export class Terminal {
  // the design-token colours formatServerLog prints, per level
  static palette = {
    info: {
      badge: [117, 158, 185],
      prose: [152, 152, 152],
      token: [202, 202, 202],
      faded: [116, 116, 116],
      fadedToken: [164, 164, 164],
    },
    warn: {
      badge: [255, 232, 130],
      prose: [255, 232, 130],
      token: [255, 236, 164],
      faded: [190, 164, 119],
      fadedToken: [211, 186, 142],
    },
    error: {
      badge: [255, 108, 93],
      prose: [255, 108, 93],
      token: [255, 156, 141],
      faded: [187, 109, 99],
      fadedToken: [215, 137, 127],
    },
  };

  // the same roles for a terminal with 16 colours, where a 24-bit code would print as the wrong colour
  static basicPalette = {
    info: { badge: 36, prose: 39, token: 97, faded: 90, fadedToken: 37 },
    warn: { badge: 33, prose: 33, token: 93, faded: 90, fadedToken: 37 },
    error: { badge: 31, prose: 31, token: 91, faded: 90, fadedToken: 37 },
  };

  // what reads as a token: quoted and backticked text, paths, and numbers with their unit
  static tokens =
    /("[^"]+"|'[^']+'|`[^`]+`|(?:\.{1,2}\/|\/)[\w./-]+|(?<![\w.-])\d+(?:\.\d+)?(?:ms|s|m|h|B|KB|MB|GB)?(?![\w.-]))/g;

  static marks = {
    unicode: {
      ask: '?',
      done: '✓',
      fail: '✗',
      warn: '▲',
      // a rule beside lines that only inform, so they never read as choices
      rail: '│',
      picked: '●',
      unpicked: '○',
      checked: '◼',
      unchecked: '◻',
      cursor: '❯',
      between: ' · ',
      arrows: '↑/↓',
      busy: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    },
    ascii: {
      ask: '?',
      done: '+',
      fail: 'x',
      warn: '!',
      rail: '|',
      picked: '(*)',
      unpicked: '( )',
      checked: '[x]',
      unchecked: '[ ]',
      cursor: '>',
      between: ', ',
      arrows: 'up/down',
      busy: ['|', '/', '-', '\\'],
    },
  };

  // the level and role each mark is inked in
  static markInks = {
    ask: ['info', 'badge'],
    busy: ['info', 'badge'],
    done: ['info', 'badge'],
    picked: ['info', 'badge'],
    checked: ['info', 'badge'],
    cursor: ['info', 'badge'],
    rail: ['info', 'faded'],
    unpicked: ['info', 'faded'],
    unchecked: ['info', 'faded'],
    warn: ['warn', 'badge'],
    fail: ['error', 'badge'],
  };

  static tunings = {
    // how often a busy mark turns
    frameMs: 80,
    // the width assumed when the terminal does not report one
    columns: 80,
    // the label column of a row
    labelWidth: 8,
  };

  constructor({ namespace = '', input = process.stdin, output = process.stdout, env = process.env } = {}) {
    this.namespace = namespace;
    this.input = input;
    this.output = output;
    // a person is there to answer
    this.interactive = Boolean(input.isTTY && output.isTTY);
    // lines can be redrawn in place, which the live list and the checklist need
    this.redraws = this.interactive && env.TERM !== 'dumb';
    // off for NO_COLOR and FORCE_COLOR=0, on when forced, otherwise only for a terminal, as formatServerLog decides
    this.colors = !env.NO_COLOR && env.FORCE_COLOR !== '0' && Boolean(env.FORCE_COLOR || output.isTTY);
    // 24-bit where the terminal says it can, stepping down to 256 and then 16 colours where it cannot
    this.depth = output.isTTY ? output.getColorDepth() : ({ 2: 8, 3: 24 })[env.FORCE_COLOR] ?? 4;
    const unicode = process.platform === 'win32' ? Boolean(env.WT_SESSION || env.TERM_PROGRAM) : env.TERM !== 'linux';
    this.marks = Terminal.marks[this.redraws && unicode ? 'unicode' : 'ascii'];
    this.frame = 0;
    this.height = 0;
  }

  /*******************************
               Voice
  *******************************/

  // a sentence in the organisation's voice: tokens stand out, and everything after the first sentence recedes
  say(text, { level = 'info', faded = false } = {}) {
    if (!this.colors) { return text; }
    const boundary = faded ? -1 : text.indexOf('. ');
    const clause = (part, prose, token) =>
      this.ink(level, prose) + part.replace(Terminal.tokens, (match) =>
        `${this.ink(level, token)}${match}${this.ink(level, prose)}`)
      + '\x1b[0m';
    if (faded) { return clause(text, 'faded', 'fadedToken'); }
    if (boundary === -1) { return clause(text, 'prose', 'token'); }
    return `${clause(text.slice(0, boundary + 1), 'prose', 'token')} ${
      clause(text.slice(boundary + 2), 'faded', 'fadedToken')
    }`;
  }

  // the one line a person has to act on
  strong(text) {
    return this.colors ? `\x1b[1m${this.ink('info', 'token')}${text}\x1b[0m` : text;
  }

  badge(level = 'info') {
    const title = `[${this.namespace}]`;
    return this.colors ? `\x1b[1m${this.ink(level, 'badge')}${title}\x1b[0m` : title;
  }

  // a key hint, quieter than anything it sits beside
  hint(...keys) {
    return this.say(keys.join(this.marks.between), { faded: true });
  }

  line(text = '') {
    this.output.write(`${text}\n`);
  }

  // one line of the list: a mark for its state, a label, a sentence, and a quiet tail such as a time
  // fit cuts the sentence to the terminal's width, since a wrapped line cannot be redrawn in place
  row(state, label, text, { tail = '', fit = false } = {}) {
    const { columns, labelWidth } = Terminal.tunings;
    const marks = this.marks[state];
    const mark = Array.isArray(marks) ? marks[this.frame % marks.length] : marks;
    const room = fit ? (this.output.columns || columns) - mark.length - labelWidth - tail.length - 8 : Infinity;
    const shown = text.length > room ? `${text.slice(0, Math.max(0, room - 1))}…` : text;
    const level = { fail: 'error', warn: 'warn' }[state] ?? 'info';
    const sentence = this.say(shown, { level, faded: state === 'unchecked' });
    const name = this.say(label.padEnd(labelWidth), { faded: state === 'unchecked' });
    return `  ${this.mark(state, mark)} ${name} ${sentence}${tail && ` ${this.say(tail, { faded: true })}`}`;
  }

  mark(state, mark = this.marks[state]) {
    const [level, role] = Terminal.markInks[state];
    return this.colors ? `${this.ink(level, role)}${mark}\x1b[0m` : mark;
  }

  // the escape code for a palette colour at the depth this terminal shows
  ink(level, role) {
    if (this.depth < 8) { return `\x1b[${Terminal.basicPalette[level][role]}m`; }
    const [red, green, blue] = Terminal.palette[level][role];
    if (this.depth >= 24) { return `\x1b[38;2;${red};${green};${blue}m`; }
    const step = (value) => Math.round(value / 51);
    const isGrey = red === green && green === blue;
    const index = isGrey
      ? 232 + Math.min(23, Math.round((red - 8) / 10))
      : 16 + 36 * step(red) + 6 * step(green) + step(blue);
    return `\x1b[38;5;${index}m`;
  }

  /*******************************
               Block
  *******************************/

  // draws lines over the block drawn last, so one part of the screen shows the plan, the choices, then the progress
  draw(lines) {
    if (this.height) { this.output.write(`\x1b[${this.height}A`); }
    for (const line of lines) { this.output.write(`\x1b[2K${line}\n`); }
    const left = this.height - lines.length;
    if (left > 0) { this.output.write(`${'\x1b[2K\n'.repeat(left)}\x1b[${left}A`); }
    this.height = lines.length;
  }

  // leaves the block as it stands and writes below it from here on
  release() {
    this.height = 0;
  }

  // hides the cursor while the block is live, and brings it back however the command ends
  hideCursor() {
    this.output.write('\x1b[?25l');
    this.showCursor = () => this.output.write('\x1b[?25h');
    this.interrupt = () => process.exit(130);
    process.once('exit', this.showCursor);
    process.once('SIGINT', this.interrupt);
  }

  restoreCursor() {
    this.showCursor();
    process.off('exit', this.showCursor);
    process.off('SIGINT', this.interrupt);
  }

  // redraws on a timer while work runs, so a busy mark turns, and answers with the way to stop
  animate(redraw) {
    const timer = setInterval(() => {
      this.frame++;
      redraw();
    }, Terminal.tunings.frameMs);
    return () => clearInterval(timer);
  }

  /*******************************
               Input
  *******************************/

  // the next key pressed, with Ctrl+C and the end of input read as escape
  // keys queue from the first call until stopKeys, since several can arrive in one read
  readKey() {
    if (!this.onKey) {
      this.keys = [];
      this.onKey = (text, key = {}) => {
        this.keys.push(key.ctrl && ['c', 'd'].includes(key.name) ? 'escape' : key.name ?? text);
        this.waiting?.();
      };
      this.onEnd = () => this.onKey('', { name: 'escape' });
      emitKeypressEvents(this.input);
      this.input.setRawMode(true);
      this.input.resume();
      this.input.on('keypress', this.onKey);
      this.input.on('end', this.onEnd);
    }
    return new Promise((done) => {
      this.waiting = () => {
        if (!this.keys.length) { return; }
        this.waiting = null;
        done(this.keys.shift());
      };
      this.waiting();
    });
  }

  // hands the keyboard back, so Ctrl+C interrupts again and nothing holds the command open
  stopKeys() {
    if (!this.onKey) { return; }
    this.input.off('keypress', this.onKey);
    this.input.off('end', this.onEnd);
    this.input.setRawMode(false);
    this.input.pause();
    this.onKey = null;
  }

  // the short line an answered question leaves behind, which stays on screen
  record(question, answer, { cancelled = false } = {}) {
    return `  ${this.mark(cancelled ? 'fail' : 'done')} ${this.say(question, { faded: true })} ${this.say(answer)}`;
  }

  // one live question with one answer: the first option is the default and enter takes it
  // answers with the option's index, or -1 when the person backs out. shortcuts maps a key to an option
  async pickOne(question, options, { keys, cancelled, shortcuts = {} }) {
    let at = 0;
    let answer;
    while (answer === undefined) {
      this.draw([
        `  ${this.mark('ask')} ${this.strong(question)}`,
        ...options.map((option, index) => {
          const isAt = index === at;
          return `  ${this.mark(isAt ? 'picked' : 'unpicked')} ${this.say(option, { faded: !isAt })}`;
        }),
        `  ${this.hint(...keys)}`,
      ]);
      const key = await this.readKey();
      if (['up', 'k'].includes(key)) { at = (at + options.length - 1) % options.length; }
      else if (['down', 'j'].includes(key)) { at = (at + 1) % options.length; }
      else if (['return', 'enter'].includes(key)) { answer = at; }
      else if (key in shortcuts) { answer = shortcuts[key]; }
      else if (key === 'escape') { answer = -1; }
    }
    this.draw([this.record(question, answer === -1 ? cancelled : options[answer], { cancelled: answer === -1 })]);
    this.release();
    return answer;
  }

  // one live question with several answers: rows are { label, text, name, on }, switched with space
  // answers false when the person backs out, and stays on the question while nothing is selected
  async pickSeveral(question, rows, { keys, empty, cancelled }) {
    let at = 0;
    let warning = '';
    for (;;) {
      this.draw([
        `  ${this.mark('ask')} ${this.strong(question)}`,
        ...rows.map(({ label, text, on }, index) => {
          const pointer = index === at ? this.mark('cursor') : ' '.repeat(this.marks.cursor.length);
          return `  ${pointer} ${this.row(on ? 'checked' : 'unchecked', label, text, { fit: true }).trimStart()}`;
        }),
        `  ${warning ? this.say(warning, { level: 'warn' }) : this.hint(...keys)}`,
      ]);
      const key = await this.readKey();
      const chosen = rows.filter(({ on }) => on).map(({ name }) => name);
      warning = '';
      if (['up', 'k'].includes(key)) { at = (at + rows.length - 1) % rows.length; }
      else if (['down', 'j'].includes(key)) { at = (at + 1) % rows.length; }
      else if (key === 'space') { rows[at].on = !rows[at].on; }
      else if (['return', 'enter'].includes(key) && !chosen.length) { warning = empty; }
      else if (['return', 'enter', 'escape'].includes(key)) {
        const backedOut = key === 'escape';
        this.draw([this.record(question, backedOut ? cancelled : chosen.join(', '), { cancelled: backedOut })]);
        this.release();
        return !backedOut;
      }
    }
  }

  // a typed answer for a terminal that cannot redraw, with the end of input or Ctrl+C read as 'n'
  readLine(question) {
    return new Promise((done) => {
      const prompt = createInterface({ input: this.input, output: this.output });
      let answered = false;
      prompt.on('SIGINT', () => prompt.close());
      prompt.on('close', () => {
        if (!answered) { this.line(); }
        done('n');
      });
      prompt.question(question, (answer) => {
        answered = true;
        done(answer.trim().toLowerCase());
        prompt.close();
      });
    });
  }
}
