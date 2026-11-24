import { createInterface, emitKeypressEvents } from 'node:readline';

/*
  the organisation's terminal voice for a command a person watches. the look is formatServerLog's in @semantic-ui/utils:
  a bold [namespace] badge, grey prose with brighter tokens, later sentences that recede, colour only where it shows.
  it adds what a log line has no use for: code in the docs site's code blue, a mark per row, a block of lines
  redrawn in place, and key input
*/

export class Terminal {
  // the design-token colours formatServerLog prints, per level
  // code is the docs site's --c-blue, so a command reads here as it does on the site. a warning or a failure
  // keeps its own tint, since a blue command inside a red sentence reads as two messages
  static palette = {
    info: {
      badge: [117, 158, 185],
      prose: [152, 152, 152],
      token: [202, 202, 202],
      code: [121, 192, 255],
      faded: [116, 116, 116],
      fadedToken: [164, 164, 164],
      fadedCode: [110, 150, 188],
    },
    warn: {
      badge: [255, 232, 130],
      prose: [255, 232, 130],
      token: [255, 236, 164],
      code: [255, 236, 164],
      faded: [190, 164, 119],
      fadedToken: [211, 186, 142],
      fadedCode: [211, 186, 142],
    },
    error: {
      badge: [255, 108, 93],
      prose: [255, 108, 93],
      token: [255, 156, 141],
      code: [255, 156, 141],
      faded: [187, 109, 99],
      fadedToken: [215, 137, 127],
      fadedCode: [215, 137, 127],
    },
  };

  // the same roles for a terminal with 16 colours, where a 24-bit code would print as the wrong colour
  static basicPalette = {
    info: { badge: 36, prose: 39, token: 97, code: 96, faded: 90, fadedToken: 37, fadedCode: 36 },
    warn: { badge: 33, prose: 33, token: 93, code: 93, faded: 90, fadedToken: 37, fadedCode: 37 },
    error: { badge: 31, prose: 31, token: 91, code: 91, faded: 90, fadedToken: 37, fadedCode: 37 },
  };

  // what stands out in a sentence. the first group reads as code: backticked text, addresses, paths, and file
  // names. the second reads as a token: quoted text, and numbers with their unit
  static tokens =
    /(`[^`]+`|https?:\/\/[^\s`]*[\w/]|(?<!\w)(?:\.{1,2}\/|\/|\.[\w-]+\/)[\w./-]*[\w/]|(?<![\w/.-])[\w.-]+\.(?:md|json|toml)(?![\w-]))|("[^"]+"|'[^']+'|(?<![\w.-])\d+(?:\.\d+)?(?:ms|s|m|h|B|KB|MB|GB)?(?![\w.-]))/g;

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
    // off for NO_COLOR and FORCE_COLOR=0, on when forced, otherwise only for a terminal, as formatServerLog decides,
    // and never for one that says it is dumb, which prints the codes as text
    const shows = output.isTTY && env.TERM !== 'dumb';
    this.colors = !env.NO_COLOR && env.FORCE_COLOR !== '0' && Boolean(env.FORCE_COLOR || shows);
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

  // a sentence in the organisation's voice: code and tokens stand out, and everything after the first sentence
  // recedes. colour marks code here, so its backticks are dropped. without colour they stay and do that job
  // faded is a whole sentence that recedes, lit keeps its code at full colour, and flat is one grey with
  // nothing standing out, for a line that is switched off
  say(text, { level = 'info', faded = false, lit = false, flat = false } = {}) {
    if (!this.colors) { return text; }
    const boundary = faded || flat ? -1 : text.indexOf('. ');
    const clause = (part, recedes) => {
      const role = (name) => {
        if (flat) { return 'faded'; }
        return recedes && !(lit && name === 'code') ? `faded${name[0].toUpperCase()}${name.slice(1)}` : name;
      };
      const prose = this.ink(level, recedes ? 'faded' : 'prose');
      return prose + part.replace(Terminal.tokens, (match, code) => {
        const shown = code?.startsWith('`') ? code.slice(1, -1) : match;
        return `${this.ink(level, role(code ? 'code' : 'token'))}${shown}${prose}`;
      }) + '\x1b[0m';
    };
    if (boundary === -1) { return clause(text, faded || flat); }
    return `${clause(text.slice(0, boundary + 1), false)} ${clause(text.slice(boundary + 2), true)}`;
  }

  // marks a name as code inside a sentence headed for say: backticks where colour will replace them,
  // and the bare name where it will not, so a plain line is not littered with them
  code(text) {
    return this.colors ? `\`${text}\`` : text;
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
    const cut = text.length > room ? `${text.slice(0, Math.max(0, room - 1))}…` : text;
    const level = { fail: 'error', warn: 'warn' }[state] ?? 'info';
    const sentence = this.say(this.closed(cut), { level, flat: state === 'unchecked' });
    const name = this.say(label.padEnd(labelWidth), { faded: state === 'unchecked' });
    return `  ${this.mark(state, mark)} ${name} ${sentence}${tail && ` ${this.say(tail, { faded: true })}`}`;
  }

  // the same row over as many lines as its sentence needs, later lines under the first one's text
  // a block redrawn in place cannot hold a line the terminal wraps by itself, so the row is wrapped here,
  // between words and never inside backticks unless a command alone is wider than the terminal
  rows(state, label, text) {
    if (!this.redraws) { return [this.row(state, label, text)]; }
    const { columns, labelWidth } = Terminal.tunings;
    const width = (this.output.columns || columns) - this.marks[state].length - labelWidth - 6;
    const units = text.match(/(?:`[^`]*`|\S)+/g) ?? [];
    const words = units.flatMap((unit) => (unit.length > width ? unit.split(' ') : [unit]));
    const lines = [''];
    for (const word of words) {
      const line = lines[lines.length - 1];
      if (line && line.length + word.length + 1 > width) { lines.push(word); }
      else { lines[lines.length - 1] = line ? `${line} ${word}` : word; }
    }
    // a command cut across lines opens again on the next one, so every piece is inked as code
    let open = false;
    const pieces = lines.map((line) => {
      const piece = this.closed(open ? `\`${line}` : line);
      open = piece !== (open ? `\`${line}` : line);
      return piece;
    });
    return pieces.map((line, index) => this.row(state, index ? '' : label, line));
  }

  // closes a backtick left open by a cut, where colour marks code and a lone backtick would print as itself
  closed(text) {
    return this.colors && text.split('`').length % 2 === 0 ? `${text}\`` : text;
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

  // the next key pressed, with Ctrl+C and the end of input read as interrupt, apart from esc
  // keys queue from the first call until stopKeys, since several can arrive in one read
  readKey() {
    if (!this.onKey) {
      this.keys = [];
      this.onKey = (text, key = {}) => {
        this.keys.push(key.ctrl && ['c', 'd'].includes(key.name) ? 'interrupt' : key.name ?? text);
        this.waiting?.();
      };
      this.onEnd = () => this.onKey('', { name: 'interrupt' });
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

  // one live question with one answer: enter takes the highlighted option, which starts on the first
  // answers with the option's index, or -1 when the person backs out. shortcuts maps a key to an option
  // the record stays the live block, so a question that follows can step back to this one
  // above stays drawn over the question, and back lets esc answer null so the caller can return to an earlier one
  async pickOne(question, options, { keys, cancelled, shortcuts = {}, highlighted = 0, above = [], back = false }) {
    let at = highlighted;
    let answer;
    while (answer === undefined) {
      this.draw([
        ...above,
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
      else if (key === 'escape' && back) { return null; }
      else if (['escape', 'interrupt'].includes(key)) { answer = -1; }
    }
    this.draw([
      ...above,
      this.record(question, answer === -1 ? cancelled : options[answer], { cancelled: answer === -1 }),
    ]);
    return answer;
  }

  // one live question with several answers: rows are { label, text, name, on }, switched with space,
  // and a row's choice is the sentence to show here when it says more than its text
  // answers true once something is selected and confirmed, false when the person stops with Ctrl+C,
  // and null when esc steps back, leaving the block for the question before it to redraw
  // above is the record of that question, kept at the top of the block
  async pickSeveral(question, rows, { keys, empty, cancelled, above = [] }) {
    let at = 0;
    let warning = '';
    for (;;) {
      this.draw([
        ...above,
        `  ${this.mark('ask')} ${this.strong(question)}`,
        ...rows.map(({ label, text, choice = text, on }, index) => {
          const pointer = index === at ? this.mark('cursor') : ' '.repeat(this.marks.cursor.length);
          return `  ${pointer} ${this.row(on ? 'checked' : 'unchecked', label, choice, { fit: true }).trimStart()}`;
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
      else if (key === 'escape') { return null; }
      else if (['return', 'enter', 'interrupt'].includes(key)) {
        const stopped = key === 'interrupt';
        this.draw([...above, this.record(question, stopped ? cancelled : chosen.join(', '), { cancelled: stopped })]);
        return !stopped;
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
