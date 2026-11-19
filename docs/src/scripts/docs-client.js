import { ui } from './strings.js';
import { highlight } from './site.js';

// at the bottom of the page a linked heading cannot reach the 30% line, so let a visible hash target win
function currentHeading(heads) {
  const line = innerHeight * 0.3;
  let i = -1;
  heads.forEach((h, j) => {
    if (h.getBoundingClientRect().top <= line) { i = j; }
  });
  const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
  const linked = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const j = heads.indexOf(linked);
  if (atEnd && j > i && linked.getBoundingClientRect().top < innerHeight) { i = j; }
  return i;
}

const idOf = (a) => decodeURIComponent(a.hash.slice(1));

function scrollspy() {
  const heads = [...document.querySelectorAll('main h2[id], main h3[id]')];
  if (!heads.length) { return; }
  const tocs = [...document.querySelectorAll('.toc-list')].map((ul) => [...ul.querySelectorAll('a')]);
  const rail = document.querySelector('.docs-toc');
  const barCurrent = document.querySelector('[data-toc-current]');
  let lastLit = null;
  const update = () => {
    const i = currentHeading(heads);
    const passed = new Set(heads.slice(0, i + 1).map((h) => h.id));
    let active = null;
    tocs.forEach((toc) => {
      const lit = toc.findLast((a) => passed.has(idOf(a))) ?? toc[0];
      toc.forEach((a) => a.toggleAttribute('aria-current', a === lit));
      if (rail?.contains(lit)) { active = lit; }
    });
    if (active && active !== lastLit) {
      lastLit = active;
      if (rail.scrollHeight > rail.clientHeight) {
        const item = active.getBoundingClientRect();
        const box = rail.getBoundingClientRect();
        if (item.top < box.top + 32) { rail.scrollTop += item.top - (box.top + 32); }
        else if (item.bottom > box.bottom - 32) { rail.scrollTop += item.bottom - (box.bottom - 32); }
      }
    }
    if (barCurrent) { barCurrent.textContent = i >= 0 ? heads[i].textContent.trim() : ''; }
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('hashchange', update);
  update();
}

// track the URL rather than scroll position because sidebar section links (date(), today(), DateTime)
// are grouped by role rather than document order, so scroll-following would jump around
function sidebarCurrent() {
  const here = [...document.querySelectorAll('.docs-sidebar a.nav-link')].filter((a) => a.pathname === location.pathname);
  if (!here.length) { return; }
  const update = () => {
    const item = here.find((a) => a.hash && a.hash === location.hash) ?? here.find((a) => !a.hash);
    here.forEach((a) => {
      if (a === item) { a.setAttribute('aria-current', 'page'); }
      else { a.removeAttribute('aria-current'); }
    });
  };
  addEventListener('hashchange', update);
  update();
}

function drawer() {
  const btn = document.querySelector('.nav-toggle');
  const side = document.querySelector('.docs-sidebar');
  const scrim = document.querySelector('.drawer-scrim');
  if (!btn || !side) { return; }
  const set = (open) => {
    btn.setAttribute('aria-expanded', open);
    side.classList.toggle('is-open', open);
    document.body.classList.toggle('drawer-open', open);
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  scrim?.addEventListener('click', () => set(false));
  // close on any link click since same-page hash links only scroll and would leave the drawer open
  side.addEventListener('click', (e) => {
    if (e.target.closest('a') && side.classList.contains('is-open')) { set(false); }
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && side.classList.contains('is-open')) { set(false); }
  });
}

function tocBar() {
  const bar = document.querySelector('[data-toc-bar]');
  if (!bar) { return; }
  const button = bar.querySelector('.toc-bar-button');
  const sheet = bar.querySelector('.toc-sheet');
  const set = (open) => {
    button.setAttribute('aria-expanded', open);
    sheet.hidden = !open;
  };
  button.addEventListener('click', () => set(sheet.hidden));
  sheet.addEventListener('click', (e) => {
    if (e.target.closest('a')) { set(false); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!sheet.hidden && !bar.contains(e.target)) { set(false); }
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) {
      set(false);
      button.focus();
    }
  });
}

function copyPage() {
  const source = document.getElementById('page-source');
  const actions = document.querySelector('[data-page-actions]');
  const main = actions?.querySelector('.page-copy') ?? document.querySelector('[data-copy-page]');
  if (!main) { return; }
  // toggle stacked labels instead of replacing textContent so the button width stays fixed
  const idle = main.querySelector('[data-copy-label]');
  const done = main.querySelector('[data-copy-done]');
  let timer;
  const show = (copied) => {
    if (idle && done) { idle.hidden = copied; done.hidden = !copied; }
    else { main.textContent = ui(copied ? 'page.copied' : 'page.copy'); }
  };
  const confirm = () => {
    show(true);
    clearTimeout(timer);
    timer = setTimeout(() => show(false), 1400);
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); }
    catch {}
    confirm();
  };
  const pageText = () => (source ? JSON.parse(source.textContent) : document.querySelector('.doc').innerText);
  document.querySelectorAll('[data-copy-page]').forEach((btn) => btn.addEventListener('click', () => copy(pageText())));
  if (!actions) { return; }

  const more = actions.querySelector('.page-more');
  const menu = actions.querySelector('.page-menu');
  const items = [...menu.querySelectorAll('[role=menuitem]')];
  const set = (open, focus = 0) => {
    menu.hidden = !open;
    more.setAttribute('aria-expanded', open);
    if (open) { items.at(focus)?.focus(); }
  };
  more.addEventListener('click', () => set(menu.hidden));
  more.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); set(true); }
    if (e.key === 'ArrowUp') { e.preventDefault(); set(true, -1); }
  });
  menu.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      items[(to + items.length) % items.length].focus();
    }
    else if (e.key === 'Escape' || e.key === 'Tab') {
      set(false);
      if (e.key === 'Escape') { more.focus(); }
    }
  });
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[role=menuitem]');
    if (!item) { return; }
    // copy the prompt when opening assistants that cannot take a prompt via URL
    if (item.dataset.copyPrompt) { copy(item.dataset.copyPrompt); }
    set(false);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !actions.contains(e.target)) { set(false); }
  });
}

export function mountDocs() {
  document.querySelectorAll('.import-chip code').forEach((c) => {
    c.dataset.raw = c.textContent;
    c.innerHTML = highlight(c.textContent);
  });
  scrollspy();
  sidebarCurrent();
  drawer();
  tocBar();
  copyPage();
}
