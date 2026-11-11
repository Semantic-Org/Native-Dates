// the wordmark's mark tells the time. it is drawn at ten past ten (lib/icons.js), holds that for a
// beat so it is read as a watch, then its hands run forward to the reader's own hour and minute and
// keep it. on hover the minute hand takes one turn around. never on a loop, since the topbar sits
// beside reading

const EASE = 'cubic-bezier(0.37, 0, 0.63, 1)';
const DRAWN = { hour: 305, minute: 60 };

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
    // a hand only ever runs forward: its turn so far, plus what is left to where it should point
    const turned = { ...DRAWN };
    const set = (sweep) => {
      const angles = handAngles();
      for (const [name, hand] of Object.entries(hands)) {
        turned[name] += (((angles[name] - turned[name]) % 360) + 360) % 360;
        hand.style.transition = sweep && !still ? `rotate 1200ms ${EASE}` : 'none';
        hand.style.rotate = `${turned[name]}deg`;
      }
    };
    setTimeout(() => set(true), still ? 0 : 900);
    setInterval(() => set(false), 30_000);
    svg.closest('.wordmark')?.addEventListener('pointerenter', () => {
      if (still) { return; }
      hands.minute.animate([{ rotate: `${turned.minute}deg` }, { rotate: `${turned.minute + 360}deg` }], { duration: 900, easing: EASE });
    });
  });
}
