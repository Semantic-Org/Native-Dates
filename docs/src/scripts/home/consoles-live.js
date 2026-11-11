// the consoles in the browser: every answer is asked again here, of the reader's own Date and of the
// library on their own Temporal, so what is printed is what this browser says. rows arrive one at a
// time as the section comes into view, once

import { CASES, preview } from './consoles.js';

export function mountConsoles(root, library) {
  root.querySelectorAll('[data-case]').forEach((row) => {
    const { date, native } = CASES.find((c) => c.id === row.dataset.case);
    row.querySelector('[data-date-out]').textContent = preview(date.run(), library);
    row.querySelector('[data-native-out]').textContent = preview(native.run(library), library);
  });
}

// before the answers are live, and whether or not they ever are: the rows step in as they are reached
export function revealConsoles(root) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
  const rows = [...root.querySelectorAll('[data-case]')];
  rows.forEach((row) => row.classList.add('is-waiting'));
  const io = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      io.unobserve(entry.target);
      entry.target.classList.remove('is-waiting');
    });
  }, { rootMargin: '0px 0px -18% 0px' });
  rows.forEach((row) => io.observe(row));
}
