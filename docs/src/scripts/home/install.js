const KEY = 'nd:install';

// the choice lives on <html> so the hero and the closer follow it together, and so views/Home.astro can restore it before first paint
export function mountInstall() {
  const page = document.documentElement;
  const buttons = [...document.querySelectorAll('[data-install-pick]')];
  // a saved choice that is no longer offered falls back to the first one
  const chosen = () => (buttons.find((button) => button.dataset.installPick === page.dataset.install) ?? buttons[0]).dataset.installPick;
  const reflect = () => {
    const id = chosen();
    buttons.forEach((button) => {
      const on = button.dataset.installPick === id;
      button.setAttribute('aria-checked', on);
      button.tabIndex = on ? 0 : -1;
    });
    // each copy button copies whichever command is showing
    document.querySelectorAll(`[data-install-cmd="${id}"]`).forEach((command) => {
      command.closest('.install-cmd').querySelector('.copy').dataset.copy = `#${command.id}`;
    });
  };
  const choose = (id) => {
    page.dataset.install = id;
    try {
      localStorage.setItem(KEY, id);
    }
    catch {}
    reflect();
  };
  buttons.forEach((button) => button.addEventListener('click', () => choose(button.dataset.installPick)));
  document.querySelector('.install-picker').addEventListener('keydown', (event) => {
    const by = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!by) { return; }
    event.preventDefault();
    const next = buttons[(buttons.findIndex((button) => button.dataset.installPick === chosen()) + by + buttons.length) % buttons.length];
    next.focus();
    choose(next.dataset.installPick);
  });
  reflect();
}
