import { consolesFor, preview } from './consoles.js';

// re-run each snippet in the visitor's browser so console output reflects local Date and Temporal
export function mountConsoles(root, library) {
  const cases = consolesFor(root.dataset.consoles || 'en');
  root.querySelectorAll('[data-case]').forEach((panel) => {
    const { date, native } = cases.find((c) => c.id === panel.dataset.case);
    panel.querySelector('[data-date-out]').textContent = preview(date.run(), library);
    panel.querySelector('[data-native-out]').textContent = preview(native.run(library), library);
  });
}

// wire tab switching separately so question tabs work before the library bundle loads
export function mountQuestions(root) {
  const tabs = [...root.querySelectorAll('[role=tab]')];
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let waiting;

  const ask = (panel) => {
    if (still.matches) { return; }
    clearTimeout(waiting);
    root.querySelectorAll('.is-asking, .is-stamped').forEach((other) => other.classList.remove('is-asking', 'is-stamped'));
    panel.classList.add('is-asking');
    // force reflow so the reset state paints before the timer triggers the stamp animation
    void panel.offsetWidth;
    waiting = setTimeout(() => panel.classList.replace('is-asking', 'is-stamped'), 520);
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

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { return; }
    io.disconnect();
    ask(root.querySelector('[role=tabpanel]:not([hidden])'));
  }, { threshold: 0.5 });
  io.observe(root);
}
