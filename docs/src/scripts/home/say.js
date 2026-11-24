import { ui } from '../strings.js';
import { read, sentencesFor } from './sentences.js';

const still = matchMedia('(prefers-reduced-motion: reduce)');
const active = new WeakMap();
const ease = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

const pulse = (el, keyframes, options) => {
  if (!el || still.matches) { return; }
  active.get(el)?.cancel();
  active.set(el, el.animate(keyframes, options));
};

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
          const delay = (step - from) * 90;
          const final = 'final' in cell.dataset;
          // cancel before reading computed rest styles so rapid clicks return cleanly to each cell's resting surface
          active.get(cell)?.cancel();
          const style = getComputedStyle(cell);
          const rest = { backgroundColor: style.backgroundColor, boxShadow: style.boxShadow };
          const peak = final
            ? {
              backgroundColor: 'color-mix(in oklab, var(--accent) 26%, transparent)',
              boxShadow: 'inset 0 0 0 2px var(--accent), 0 0 18px -2px var(--accent-line)',
              offset: 0.16,
            }
            : {
              backgroundColor: 'color-mix(in oklab, var(--accent) 18%, transparent)',
              boxShadow: 'inset 0 0 0 1.5px var(--accent), 0 0 0 3px var(--accent-wash)',
              offset: 0.16,
            };
          pulse(cell, [rest, peak, rest], { duration: final ? 850 : 650, delay, easing: ease });
          pulse(
            text,
            [{ opacity: 0.25, translate: '0 4px' }, { opacity: 1, translate: '0 0' }],
            { duration: 280, delay, easing: ease, fill: 'backwards' },
          );
        }
      });
    };

    const turn = (step, by) => {
      const count = sentence.steps[step].length;
      picks[step] = (picks[step] + by + count) % count;
      cells(step).forEach((cell) => cell.querySelectorAll('[data-option]').forEach((option) => {
        option.hidden = Number(option.dataset.option) !== picks[step];
      }));
      if (!still.matches) {
        const button = panel.querySelector(`[data-turn][data-step="${step}"]`);
        const shift = by > 0 ? 3 : -3;
        pulse(
          button?.querySelector('svg'),
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: `translateY(${shift}px) scale(1.18)`, offset: 0.35 },
            { transform: 'translateY(0) scale(1)' },
          ],
          { duration: 240, easing: ease },
        );
        pulse(
          button?.querySelector(`[data-option="${picks[step]}"]`),
          [{ opacity: 0.4, translate: `0 ${shift}px` }, { opacity: 1, translate: '0 0' }],
          { duration: 200, easing: ease },
        );
        const code = panel.querySelector(`.say-code[data-step="${step}"]`);
        if (code) {
          active.get(code)?.cancel();
          const restBg = getComputedStyle(code).backgroundColor;
          pulse(
            code,
            [{ backgroundColor: restBg }, { backgroundColor: 'var(--accent-wash)', offset: 0.2 }, { backgroundColor: restBg }],
            { duration: 420, easing: 'ease-out' },
          );
          pulse(
            code.querySelector(`[data-option="${picks[step]}"]`),
            [{ opacity: 0.35, translate: `0 ${shift}px` }, { opacity: 1, translate: '0 0' }],
            { duration: 220, easing: ease },
          );
        }
      }
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
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    show(tab);
  });

  const where = root.querySelector('[data-say-where]');
  where.textContent = ui('home.say.where', { zone: library.now().zone });
  where.hidden = false;
  root.dataset.live = '';
}
