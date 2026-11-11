// an x-ray: one operation in native-dates, and switched over, the same value made on Temporal
// alone, or on Date as it was done before either. the panel grows to that code's height under one
// scan, so the difference in code is something the reader sees as well as counts.

import { plural } from './strings.js';

const lines = (pre) => (pre.dataset.raw ?? pre.textContent).trim().split('\n').length;

export function mountXray(root) {
  const body = root.querySelector('.xr-body');
  const panes = Object.fromEntries([...root.querySelectorAll('[data-xr-pane]')].map((p) => [p.dataset.xrPane, p]));
  const buttons = [...root.querySelectorAll('[data-xr]')];
  const count = root.querySelector('[data-xr-count]');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'ours';

  const label = (m) => plural('home.xray.lines', lines(panes[m]), { count: lines(panes[m]) });
  count.textContent = label(mode);

  const set = (next) => {
    if (next === mode) { return; }
    const from = body.offsetHeight;
    mode = next;
    Object.entries(panes).forEach(([m, pane]) => { pane.hidden = m !== mode; });
    buttons.forEach((b) => {
      const on = b.dataset.xr === mode;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
    // anything but ours is code written against the platform
    root.classList.toggle('is-native', mode !== 'ours');
    count.textContent = label(mode);
    if (still.matches) { return; }
    // the panel grows or shrinks to the code it now shows, under one pass of the scan
    const to = body.offsetHeight;
    body.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 520, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    root.style.setProperty('--scan-to', `${Math.max(from, to)}px`);
    root.classList.remove('is-scanning');
    void root.offsetWidth;
    root.classList.add('is-scanning');
  };

  root.addEventListener('animationend', (e) => {
    if (e.animationName === 'xr-scan') { root.classList.remove('is-scanning'); }
  });
  buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.xr)));

  root.querySelector('.xr-switch').addEventListener('keydown', (e) => {
    const by = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!by) { return; }
    e.preventDefault();
    const next = buttons[(buttons.findIndex((b) => b.dataset.xr === mode) + by + buttons.length) % buttons.length];
    next.focus();
    set(next.dataset.xr);
  });
}
