// the size bar: switching a plugin on or off, or pressing a preset, sets the bar and the total to
// the measured size of core with exactly those plugins (bit n is plugin n)

import { formatSizeBytes } from '../format.js';

export function mountBytes(root) {
  const sizes = JSON.parse(root.dataset.sizes);
  const picks = [...root.querySelectorAll('[data-bytes-pick]')];
  const presets = [...root.querySelectorAll('[data-preset]')];
  const total = root.querySelector('[data-bytes-total]');
  const added = root.querySelector('[data-bytes-added]');

  const render = () => {
    const names = picks.filter((p) => p.checked).map((p) => p.value);
    const bytes = sizes[picks.reduce((mask, p, i) => (p.checked ? mask | (1 << i) : mask), 0)];
    total.textContent = formatSizeBytes(bytes);
    added.style.setProperty('--bytes', bytes - sizes[0]);
    presets.forEach((button) => {
      const set = button.dataset.preset.split(',');
      button.setAttribute('aria-pressed', set.length === names.length && set.every((n) => names.includes(n)));
    });
  };
  picks.forEach((pick) => pick.addEventListener('change', render));
  // a preset is its plugins, switched on at once; pressing it again switches them off
  presets.forEach((button) => button.addEventListener('click', () => {
    const set = button.getAttribute('aria-pressed') === 'true' ? [] : button.dataset.preset.split(',');
    picks.forEach((pick) => {
      pick.checked = set.includes(pick.value);
    });
    render();
  }));
  render();
}
