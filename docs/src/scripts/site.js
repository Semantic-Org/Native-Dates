import { ui } from './strings.js';
import { mountSearch } from './search.js';
import { clockFavicon } from './favicon.js';
import { wireMarkClock } from './mark-clock.js';
import { wireVersionMenus } from './version-menu.js';

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

// lightweight browser highlighter for UI snippets outside build-time Shiki markdown
export function highlight(src) {
  // alternation order matters so comments, strings, and => match before JSX tags, numbers, calls, and keywords
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
    // treat keyword names after a dot as method calls, e.g. Temporal.PlainDate.from(...)
    else if (f) { out += KEYWORDS.has(f) && src[m.index - 1] !== '.' ? `<span class="tk-k">${f}</span>` : `<span class="tk-f">${f}</span>`; }
    else if (p) { out += KEYWORDS.has(p) ? `<span class="tk-k">${p}</span>` : `<span class="tk-p">${p}</span>`; }
    else if (w) { out += KEYWORDS.has(w) ? `<span class="tk-k">${w}</span>` : w; }
    else { out += esc(t); }
  }
  return out + esc(src.slice(last));
}

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

// highlight inline code so calls (`date('2026-05-10')`) get token colors while bare identifiers (`today`) stay plain
const PUNCT_AFTER = /^[,.;:!?)\]}'"’”]+/;
const PUNCT_BEFORE = /[(\[{'"‘“]+$/;

export function highlightInline(root = document) {
  root.querySelectorAll(':where(p, li, dd, dt, td, th, figcaption, blockquote) code:not(pre code, [data-hl-done])')
    .forEach((code) => {
      if (!code.matches('.setting, .t, [data-no-hl]')) { code.innerHTML = highlight(code.textContent); }
      code.dataset.hlDone = '';
      joinPunctuation(code);
      // drop left margin when inline code starts its block
      const prev = code.parentElement.closest('.code-join') ? null : code.previousSibling;
      if (!prev || (prev.nodeType === 3 && !prev.data.trim() && !prev.previousSibling)) {
        code.classList.add('joined-start');
      }
    });
}

// wrap adjacent punctuation with inline code in .code-join so margin and line breaks do not split them
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

export function highlightShell(root = document) {
  root.querySelectorAll('code[data-shell]:not([data-hl-done])').forEach((code) => {
    const words = code.textContent.split(/(\s+)/);
    let seenCommand = false;
    // npx is followed by a package rather than a subcommand, so that word takes the argument color
    let seenSub = words[0] === 'npx';
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

// initial data-theme is set before first paint in the layout, so only handle toggles and later OS changes here
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

let variantUid = 0;

function matchLocale(pres, lang) {
  const want = (lang ?? '').toLowerCase();
  if (!want) { return null; }
  const base = want.split('-')[0];
  const tagsOf = (pre) => (pre.dataset.locale ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  return pres.find((p) => tagsOf(p).includes(want))
    ?? pres.find((p) => tagsOf(p).some((tag) => tag.split('-')[0] === base))
    ?? null;
}

export function wireVariants(root = document) {
  const blocks = [...root.querySelectorAll('[data-variants]')];
  if (!blocks.length) { return; }

  const localeUpdaters = [];
  blocks.forEach((block) => {
    const pres = [...block.querySelectorAll('.swap > pre')];
    const tablist = block.querySelector('[data-variant-tabs]');
    if (!pres.length || !tablist) { return; }

    const hasLocale = pres.some((p) => p.dataset.locale);
    if (hasLocale) { tablist.setAttribute('aria-label', ui('language.label')); }

    tablist.replaceChildren();
    const tabs = pres.map((pre) => {
      pre.id ||= `variant-${++variantUid}`;
      const btn = document.createElement('button');
      btn.className = 'code-tab';
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', pre.id);
      const tag = pre.dataset.locale?.trim().split(/\s+/)[0];
      if (tag) { btn.lang = tag; }
      btn.textContent = pre.dataset.label || tag || '';
      tablist.append(btn);
      return btn;
    });

    const reveal = (tab) => {
      if (tablist.scrollWidth <= tablist.clientWidth) { return; }
      const left = tab.offsetLeft;
      const right = left + tab.offsetWidth;
      if (left < tablist.scrollLeft) { tablist.scrollLeft = left; }
      else if (right > tablist.scrollLeft + tablist.clientWidth) {
        tablist.scrollLeft = right - tablist.clientWidth;
      }
    };

    const show = (target, { scroll = false } = {}) => {
      pres.forEach((pre, i) => {
        const on = pre === target;
        pre.hidden = !on;
        tabs[i].setAttribute('aria-selected', String(on));
        tabs[i].tabIndex = on ? 0 : -1;
        if (on && scroll) { reveal(tabs[i]); }
      });
    };

    if (hasLocale) {
      localeUpdaters.push((lang) => {
        const hit = matchLocale(pres, lang);
        if (hit) { show(hit, { scroll: true }); }
      });
    }

    tablist.addEventListener('click', (e) => {
      const i = tabs.indexOf(e.target.closest('[role=tab]'));
      if (i < 0) { return; }
      const picked = pres[i];
      show(picked, { scroll: true });
      if (hasLocale && picked.dataset.locale) {
        const tag = picked.dataset.locale.trim().split(/\s+/)[0];
        localeUpdaters.forEach((update) => update(tag));
      }
    });

    tablist.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) { return; }
      const moves = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(e.key in moves)) { return; }
      e.preventDefault();
      const next = tabs[moves[e.key]];
      next.focus();
      next.click();
    });

    const initial = (hasLocale && matchLocale(pres, document.documentElement.lang)) || pres[0];
    show(initial, { scroll: true });
    block.dataset.hydrated = '';
  });
}

export function init() {
  clockFavicon();
  wireMarkClock();
  mountSearch();
  wireVersionMenus();
  // fetch the globe only once a reader reaches for the language menu so no other page view pays for it
  document.querySelectorAll('[data-language-globe]').forEach((host) => {
    let loading;
    const load = () => (loading ??= import('./language-globe.js').then(({ mountLanguageGlobe }) => mountLanguageGlobe(host)));
    host.addEventListener('pointerenter', load);
    host.addEventListener('pointerdown', load);
    host.addEventListener('click', load);
    host.addEventListener('focusin', load);
  });
  document.querySelectorAll('[data-language-select]').forEach((select) =>
    select.addEventListener('change', () => {
      try { sessionStorage.setItem('nd:language-picked', select.selectedOptions[0].dataset.code); } catch {}
      location.assign(select.value);
    })
  );
  wireVariants();
  highlightAll();
  highlightInline();
  highlightShell();
  wireCopy();
  wireTheme();
}
