import { ui } from '../strings.js';
import { read, sentencesFor } from './sentences.js';

const still = matchMedia('(prefers-reduced-motion: reduce)');

// re-run hero chains in the browser so values reflect the visitor's local day and zone
export function mountSay(root, library) {
  const locale = root.dataset.say || 'en';
  const sentences = sentencesFor(locale);
  const panels = [...root.querySelectorAll('[data-sentence]')];
  const tabs = [...root.querySelectorAll('[role=tab]')];

  panels.forEach((panel) => {
    const sentence = sentences.find((s) => s.id === panel.dataset.sentence);
    const picks = sentence.steps.map(() => 0);
    const cells = (step) => [...panel.querySelectorAll(`[data-step="${step}"]`)];

    const fill = (from = 0, flash = false) => {
      read(sentence, picks, library, locale).forEach((value, step) => {
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

  const where = root.querySelector('[data-say-where]');
  where.textContent = ui('home.say.where', { zone: library.now().zone });
  where.hidden = false;
  root.dataset.live = '';
}
