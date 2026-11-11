// the question ribbon in the browser. picking a question asks it: both consoles hold their answers
// for a beat, return them together, and the reason follows. the first question is asked as the
// ribbon comes into view. every answer is also asked again here, of the reader's own Date and of the
// library on their own Temporal, so what is printed is what this browser says

import { CASES, preview } from './consoles.js';

export function mountConsoles(root, library) {
  root.querySelectorAll('[data-case]').forEach((panel) => {
    const { date, native } = CASES.find((c) => c.id === panel.dataset.case);
    panel.querySelector('[data-date-out]').textContent = preview(date.run(), library);
    panel.querySelector('[data-native-out]').textContent = preview(native.run(library), library);
  });
}

// the questions work with or without the library: they only choose which answers are showing
export function mountQuestions(root) {
  const tabs = [...root.querySelectorAll('[role=tab]')];
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let waiting;

  // both answers are held back, then let go at once; the reason waits on them (styles/home.css)
  const ask = (panel) => {
    if (still.matches) { return; }
    clearTimeout(waiting);
    root.querySelectorAll('.is-asking').forEach((other) => other.classList.remove('is-asking'));
    panel.classList.add('is-asking');
    // read a layout value so the held-back state is painted before it is let go
    void panel.offsetWidth;
    waiting = setTimeout(() => panel.classList.remove('is-asking'), 520);
  };
  const pick = (tab) => {
    tabs.forEach((other) => {
      const on = other === tab;
      other.setAttribute('aria-selected', on);
      other.tabIndex = on ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !on;
    });
    ask(document.getElementById(tab.getAttribute('aria-controls')));
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => pick(tab)));
  root.querySelector('[role=tablist]').addEventListener('keydown', (event) => {
    const by = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!by) { return; }
    event.preventDefault();
    const tab = tabs[(tabs.indexOf(document.activeElement) + by + tabs.length) % tabs.length];
    tab.focus();
    pick(tab);
  });

  // the first question asks itself the first time the ribbon is well inside the screen
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { return; }
    io.disconnect();
    ask(root.querySelector('[role=tabpanel]:not([hidden])'));
  }, { threshold: 0.5 });
  io.observe(root);
}
