import { ui } from './strings.js';
import { mountSearch } from './search.js';
import { clockFavicon } from './favicon.js';
import { wireMarkClock } from './mark-clock.js';
import { wireVersionMenus } from './version-menu.js';

// what every page does in the browser: a tiny js highlighter for code written in the page's own
// markup (markdown goes through shiki at build), copy buttons, the theme, and the dropdown.

const KEYWORDS = new Set([
  'import',
  'from',
  'export',
  'const',
  'let',
  'return',
  'async',
  'await',
  'function',
  'new',
  'if',
  'else',
  'default',
  'true',
  'false',
  'null',
  'undefined',
  'class',
  'extends',
]);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlight(src) {
  // order matters: comments, strings, arrows, then jsx tags (a `>` only closes a tag it follows), numbers, calls, keys, words
  const re =
    /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(=>)|(<\/?[A-Z][\w.]*\s*\/?>?|\/>)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)(?=\s*:)|([A-Za-z_$][\w$]*)|(\n)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    last = re.lastIndex;
    const [t, c, s, arrow, tag, n, f, p, w] = m;
    if (c) { out += `<span class="tk-c">${esc(c)}</span>`; }
    else if (s) { out += `<span class="tk-s">${esc(s)}</span>`; }
    else if (arrow) { out += `<span class="tk-k">=&gt;</span>`; }
    else if (tag) { out += `<span class="tk-t">${esc(tag)}</span>`; }
    else if (n) { out += `<span class="tk-n">${n}</span>`; }
    else if (f) { out += KEYWORDS.has(f) ? `<span class="tk-k">${f}</span>` : `<span class="tk-f">${f}</span>`; }
    else if (p) { out += KEYWORDS.has(p) ? `<span class="tk-k">${p}</span>` : `<span class="tk-p">${p}</span>`; }
    else if (w) { out += KEYWORDS.has(w) ? `<span class="tk-k">${w}</span>` : w; }
    else { out += esc(t); }
  }
  return out + esc(src.slice(last));
}

// <pre data-hl> blocks; lines starting with "!!" are highlighted
export function highlightAll(root = document) {
  root.querySelectorAll('pre[data-hl]').forEach((pre) => {
    const raw = pre.textContent.replace(/^\n/, '').replace(/\s+$/, '');
    const marked = new Set();
    const src = raw.split('\n').map((line, i) => {
      if (line.startsWith('!!')) {
        marked.add(i);
        return line.slice(2);
      }
      return line;
    }).join('\n');
    pre.dataset.raw = src;
    pre.innerHTML = highlight(src).split('\n')
      .map((l, i) => (marked.has(i) ? `<span class="line-hl">${l || ' '}</span>` : l)).join('\n');
  });
}

// inline code in prose gets the same tokens. bare identifiers pass through untouched, so `navigate`
// stays plain while href('team', { org }) is colored. opt out with data-no-hl; settings keep their tint
const PUNCT_AFTER = /^[,.;:!?)\]}'"’”]+/;
const PUNCT_BEFORE = /[(\[{'"‘“]+$/;

export function highlightInline(root = document) {
  root.querySelectorAll(':where(p, li, dd, dt, td, th, figcaption, blockquote) code:not(pre code, [data-hl-done])')
    .forEach((code) => {
      if (!code.matches('.setting, .t, [data-no-hl]')) { code.innerHTML = highlight(code.textContent); }
      code.dataset.hlDone = '';
      joinPunctuation(code);
      // a chip that opens its block has nothing to keep apart from on the left
      const prev = code.parentElement.closest('.code-join') ? null : code.previousSibling;
      if (!prev || (prev.nodeType === 3 && !prev.data.trim() && !prev.previousSibling)) {
        code.classList.add('joined-start');
      }
    });
}

// a chip's side margin would push touching punctuation away, and a line could break between them.
// whatever punctuation touches the chip moves into a no-wrap join with it, and that side drops its margin
function joinPunctuation(code) {
  const take = (node, re, fromEnd) => {
    if (node?.nodeType !== 3) { return null; }
    const m = node.data.match(re);
    if (!m) { return null; }
    const run = m[0];
    node.data = fromEnd ? node.data.slice(0, -run.length) : node.data.slice(run.length);
    return document.createTextNode(run);
  };
  const after = take(code.nextSibling, PUNCT_AFTER, false);
  const before = take(code.previousSibling, PUNCT_BEFORE, true);
  if (!after && !before) { return; }
  const join = document.createElement('span');
  join.className = 'code-join';
  code.replaceWith(join);
  if (before) {
    join.append(before);
    code.classList.add('joined-start');
  }
  join.append(code);
  if (after) {
    join.append(after);
    code.classList.add('joined-end');
  }
}

// shell commands: the command, its flags and its package arguments
export function highlightShell(root = document) {
  root.querySelectorAll('code[data-shell]:not([data-hl-done])').forEach((code) => {
    const words = code.textContent.split(/(\s+)/);
    let seenCommand = false;
    let seenSub = false;
    code.innerHTML = words.map((w) => {
      if (!w.trim()) { return w; }
      const e = esc(w);
      if (!seenCommand) {
        seenCommand = true;
        return `<span class="tk-f">${e}</span>`;
      }
      if (w.startsWith('-')) { return `<span class="tk-k">${e}</span>`; }
      if (!seenSub) {
        seenSub = true;
        return e;
      }
      return `<span class="tk-s">${e}</span>`;
    }).join('');
    code.dataset.hlDone = '';
  });
}

const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

export function wireCopy(root = document) {
  root.querySelectorAll('[data-copy]').forEach((btn) => {
    if (!btn.innerHTML.trim()) { btn.innerHTML = COPY_ICON; }
    btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Copy');
    btn.addEventListener('click', async () => {
      const target = btn.dataset.copy
        ? document.querySelector(btn.dataset.copy)
        : btn.closest('.code')?.querySelector('pre:not([hidden])');
      const text = target?.dataset.raw ?? target?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text.trim());
      }
      catch {}
      btn.dataset.copied = '';
      btn.innerHTML = CHECK_ICON;
      setTimeout(() => {
        delete btn.dataset.copied;
        btn.innerHTML = COPY_ICON;
      }, 1400);
    });
  });
}

// the theme follows the system until the reader picks one; a pick is remembered. the base layout
// sets it before first paint, so here it only answers the toggle and later system changes
export function wireTheme() {
  const root = document.documentElement;
  const saved = () => {
    try {
      return localStorage.getItem('nd:theme');
    }
    catch {
      return null;
    }
  };
  const label = () =>
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', ui(root.dataset.theme === 'light' ? 'nav.themeToDark' : 'nav.themeToLight'));
    });
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) =>
    btn.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('nd:theme', root.dataset.theme);
      }
      catch {}
      label();
    })
  );
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!saved()) {
      root.dataset.theme = e.matches ? 'light' : 'dark';
      label();
    }
  });
  label();
}

/* ---------- dropdown ----------
   a button and a listbox. the button reserves the width of its widest label (every label shares one
   grid cell, as .swap does). keyboard: arrows/home/end move, typing jumps, enter/space pick,
   escape and tab close; a click outside closes. options: [{ value, label, hint? }] */

const CHEVRON =
  '<svg class="dd-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
const CHEVRONS =
  '<svg class="dd-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>';
const CHECK =
  '<svg class="dd-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

// the button is named by its own text, a hidden "label: " before the visible value, so what is heard
// is what is seen. size 'lg' is the chunky form (the docs sidebar): icon, label and hint in the button as in the menu
let uid = 0;
export function createDropdown(host, { options, value, label, onChange, size = 'md' }) {
  const id = `dd-${++uid}`;
  host.classList.add('dropdown');
  if (size === 'lg') { host.classList.add('dd-lg'); }
  const icon = (o) => (o.icon ? `<span class="dd-icon" aria-hidden="true">${o.icon}</span>` : '');
  const lgFace = (o) =>
    `${icon(o)}<span class="dd-text"><span class="dd-name">${o.label}</span>${
      o.hint ? `<span class="dd-sub">${o.hint}</span>` : ''
    }</span>`;
  host.innerHTML = `
    <button type="button" class="dd-button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}">
      <span class="visually-hidden">${label}: </span>
      <span class="swap dd-current">${
    options.map((o) =>
      `<span class="dd-face" data-v="${o.value}" hidden>${size === 'lg' ? lgFace(o) : `${icon(o)}${o.label}`}</span>`
    ).join('')
  }</span>
      ${size === 'lg' ? CHEVRONS : CHEVRON}
    </button>
    <ul class="dd-menu" id="${id}" role="listbox" aria-label="${label}" tabindex="-1" hidden>
      ${
    options.map((o, i) =>
      `<li role="option" id="${id}-${i}" data-v="${o.value}" aria-selected="false">
        ${
        size === 'lg'
          ? `${lgFace(o)}${CHECK}`
          : `${CHECK}${icon(o)}<span class="dd-label">${o.label}</span>${
            o.hint ? `<span class="dd-hint">${o.hint}</span>` : ''
          }`
      }</li>`
    ).join('')
  }
    </ul>`;
  const button = host.querySelector('.dd-button');
  const menu = host.querySelector('.dd-menu');
  const items = [...menu.children];
  let current = value ?? options[0].value;
  let active = 0;
  let typed = '';
  let typedAt = 0;

  const paint = () => {
    host.querySelectorAll('.dd-current [data-v]').forEach((s) => {
      s.hidden = s.dataset.v !== current;
    });
    items.forEach((li) => li.setAttribute('aria-selected', li.dataset.v === current));
  };
  const focusItem = (i) => {
    active = (i + items.length) % items.length;
    items.forEach((li, j) => li.classList.toggle('is-active', j === active));
    menu.setAttribute('aria-activedescendant', items[active].id);
    items[active].scrollIntoView({ block: 'nearest' });
  };
  const open = () => {
    if (!menu.hidden) { return; }
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    focusItem(Math.max(0, items.findIndex((li) => li.dataset.v === current)));
    menu.focus();
    document.addEventListener('pointerdown', outside, true);
  };
  const close = (refocus = true) => {
    if (menu.hidden) { return; }
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true);
    if (refocus) { button.focus(); }
  };
  const outside = (e) => {
    if (!host.contains(e.target)) { close(false); }
  };
  const pick = (i) => {
    const v = items[i].dataset.v;
    close();
    if (v !== current) {
      current = v;
      paint();
      onChange?.(v);
    }
  };

  button.addEventListener('click', () => (menu.hidden ? open() : close()));
  button.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      open();
    }
  });
  menu.addEventListener('keydown', (e) => {
    const keys = {
      ArrowDown: () => focusItem(active + 1),
      ArrowUp: () => focusItem(active - 1),
      Home: () => focusItem(0),
      End: () => focusItem(items.length - 1),
      Enter: () => pick(active),
      ' ': () => pick(active),
      Escape: () => close(),
      Tab: () => close(false),
    };
    if (keys[e.key]) {
      if (e.key !== 'Tab') { e.preventDefault(); }
      keys[e.key]();
      return;
    }
    // typeahead: letters typed in quick succession match a label's start
    if (e.key.length === 1) {
      const now = Date.now();
      typed = now - typedAt > 600 ? e.key.toLowerCase() : typed + e.key.toLowerCase();
      typedAt = now;
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(typed));
      if (hit >= 0) { focusItem(hit); }
    }
  });
  menu.addEventListener('pointermove', (e) => {
    const li = e.target.closest('[role=option]');
    if (li) { focusItem(items.indexOf(li)); }
  });
  menu.addEventListener('click', (e) => {
    const li = e.target.closest('[role=option]');
    if (li) { pick(items.indexOf(li)); }
  });

  paint();
  return {
    get value() {
      return current;
    },
    set value(v) {
      current = v;
      paint();
    },
  };
}

export function init() {
  clockFavicon();
  wireMarkClock();
  mountSearch();
  wireVersionMenus();
  // the language select in the menu drawer goes to the page in the language picked
  document.querySelectorAll('[data-language-select]').forEach((select) =>
    select.addEventListener('change', () => {
      try { sessionStorage.setItem('nd:language-picked', select.selectedOptions[0].dataset.code); } catch {}
      location.assign(select.value);
    })
  );
  highlightAll();
  highlightInline();
  highlightShell();
  wireCopy();
  wireTheme();
}
