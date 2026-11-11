// the year strip's playhead. as its section comes into view it crosses the year once, and the Berlin
// clock follows it through each change; after that it goes where the reader points, drags or arrows.
// with reduced motion it stays where the reader puts it and never moves by itself

import { ui } from '../strings.js';

export function mountYear(root) {
  const days = JSON.parse(root.querySelector('[data-year-days]').textContent);
  const strip = root.querySelector('[data-year-strip]');
  const head = root.querySelector('[data-year-head]');
  const dayLabel = root.querySelector('[data-year-day]');
  const berlin = root.querySelector('[data-year-berlin]');
  const gap = root.querySelector('[data-year-gap]');
  const usual = days[0][2];
  let at = 0;
  let sweep = null;

  const set = (index) => {
    at = Math.max(0, Math.min(days.length - 1, Math.round(index)));
    const [label, time, hours] = days[at];
    head.style.setProperty('--at', at);
    dayLabel.style.setProperty('--at', at);
    dayLabel.textContent = label;
    berlin.textContent = time;
    gap.textContent = ui('home.year.gap', { hours });
    root.classList.toggle('is-shifted', hours !== usual);
    strip.setAttribute('aria-valuenow', at + 1);
    strip.setAttribute('aria-valuetext', `${label}: ${time}`);
  };
  const stop = () => {
    cancelAnimationFrame(sweep);
    sweep = null;
  };
  const dayAt = (event) => {
    const box = strip.getBoundingClientRect();
    const along = (event.clientX - box.left) / box.width;
    return (getComputedStyle(strip).direction === 'rtl' ? 1 - along : along) * (days.length - 1);
  };

  strip.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || event.buttons) {
      stop();
      set(dayAt(event));
    }
  });
  strip.addEventListener('pointerdown', (event) => {
    stop();
    strip.setPointerCapture(event.pointerId);
    set(dayAt(event));
  });
  strip.addEventListener('keydown', (event) => {
    const by = { ArrowRight: 1, ArrowLeft: -1, PageUp: 30, PageDown: -30 }[event.key];
    const to = { Home: 0, End: days.length - 1 }[event.key];
    if (by === undefined && to === undefined) { return; }
    event.preventDefault();
    stop();
    set(to ?? at + by);
  });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
  // one crossing, eased at both ends, the first time the strip is well inside the screen
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { return; }
    io.disconnect();
    const started = performance.now();
    const length = 9000;
    const step = (now) => {
      const t = Math.min(1, (now - started) / length);
      set((1 - Math.cos(Math.PI * t)) / 2 * (days.length - 1));
      sweep = t < 1 ? requestAnimationFrame(step) : null;
    };
    sweep = requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(strip);
}
