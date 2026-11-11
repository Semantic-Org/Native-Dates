// the wordmark's mark tells the time: its hands are drawn at four o'clock (lib/icons.js) and turn to
// the reader's own hour and minute as each page loads, then keep it. on hover the minute hand takes
// one turn around and lands back where it was. never on a loop, since the topbar sits beside reading

const EASE = 'cubic-bezier(0.37, 0, 0.63, 1)';

// where the hands stand now, in degrees clockwise from twelve
export function handAngles(at = new Date()) {
  const minutes = at.getMinutes() + at.getSeconds() / 60;
  return { hour: ((at.getHours() % 12) + minutes / 60) * 30, minute: minutes * 6 };
}

export function wireMarkClock() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.wordmark svg').forEach((svg) => {
    const hands = { hour: svg.querySelector('[data-hand=hour]'), minute: svg.querySelector('[data-hand=minute]') };
    if (!hands.hour || !hands.minute) { return; }
    const set = (sweep) => {
      const angles = handAngles();
      for (const [name, hand] of Object.entries(hands)) {
        hand.style.transition = sweep && !still ? `rotate 900ms ${EASE}` : 'none';
        hand.style.rotate = `${angles[name]}deg`;
      }
    };
    setTimeout(() => set(true), 350);
    setInterval(() => set(false), 30_000);
    svg.closest('.wordmark')?.addEventListener('pointerenter', () => {
      if (still) { return; }
      const at = handAngles().minute;
      hands.minute.animate([{ rotate: `${at}deg` }, { rotate: `${at + 360}deg` }], { duration: 900, easing: EASE });
    });
  });
}
