// the hero's sentence in the browser: tabs pick a sentence, a phrase turns through its options, and
// the values under each call are read again from the library for the reader's own day and zone.
// the page arrives with the build's answers in place, so nothing here is needed to read it

import { ui } from '../strings.js';
import { read, SENTENCES } from './sentences.js';

const still = matchMedia('(prefers-reduced-motion: reduce)');

export function mountSay(root, library) {
  const panels = [...root.querySelectorAll('[data-sentence]')];
  const tabs = [...root.querySelectorAll('[role=tab]')];

  panels.forEach((panel) => {
    const sentence = SENTENCES.find((s) => s.id === panel.dataset.sentence);
    const picks = sentence.steps.map(() => 0);
    const cells = (step) => [...panel.querySelectorAll(`[data-step="${step}"]`)];

    // every value from a link on is read again; the ones that changed say so with a flash
    const fill = (from = 0, flash = false) => {
      read(sentence, picks, library).forEach((value, step) => {
        const cell = panel.querySelector(`[data-value][data-step="${step}"]`);
        const text = cell.querySelector('[data-text]');
        if (text.textContent === value.text && cell.querySelector('[data-noun]').textContent === value.noun) { return; }
        cell.querySelector('[data-noun]').textContent = value.noun;
        text.textContent = value.text;
        if (flash && step >= from && !still.matches) {
          cell.animate([{ backgroundColor: 'var(--accent-wash)' }, { backgroundColor: 'transparent' }], { duration: 700, easing: 'ease-out' });
        }
      });
    };

    const turn = (step, by) => {
      const count = sentence.steps[step].length;
      picks[step] = (picks[step] + by + count) % count;
      cells(step).forEach((cell) => cell.querySelectorAll('[data-option]').forEach((option) => {
        option.hidden = Number(option.dataset.option) !== picks[step];
      }));
      fill(step, true);
    };

    panel.querySelectorAll('[data-turn]').forEach((button) => {
      const step = Number(button.dataset.step);
      button.addEventListener('click', () => turn(step, 1));
      button.addEventListener('keydown', (event) => {
        const by = { ArrowDown: 1, ArrowUp: -1 }[event.key];
        if (!by) { return; }
        event.preventDefault();
        turn(step, by);
      });
    });
    // a call is its phrase's other face: clicking it turns the phrase too
    panel.querySelectorAll('.say-code').forEach((code) => {
      const step = Number(code.dataset.step);
      if (sentence.steps[step].length > 1) { code.addEventListener('click', () => turn(step, 1)); }
    });
    fill();
  });

  const show = (tab) => {
    tabs.forEach((other) => {
      const on = other === tab;
      other.setAttribute('aria-selected', on);
      other.tabIndex = on ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => show(tab)));
  root.querySelector('[role=tablist]').addEventListener('keydown', (event) => {
    const by = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!by) { return; }
    event.preventDefault();
    const tab = tabs[(tabs.indexOf(document.activeElement) + by + tabs.length) % tabs.length];
    tab.focus();
    show(tab);
  });

  // where the answers were worked out: the reader's own zone
  const where = root.querySelector('[data-say-where]');
  where.textContent = ui('home.say.where', { zone: library.now().zone });
  where.hidden = false;
  root.dataset.live = '';
}
