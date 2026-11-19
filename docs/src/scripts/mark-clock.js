const EASE = 'cubic-bezier(0.37, 0, 0.63, 1)';
const DRAWN = { hour: 305, minute: 60 }; // initial 10:10 pose in lib/icons.js

export function handAngles(at = new Date()) {
  const minutes = at.getMinutes() + at.getSeconds() / 60;
  return { hour: ((at.getHours() % 12) + minutes / 60) * 30, minute: minutes * 6 };
}

export function wireMarkClock() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.wordmark svg').forEach((svg) => {
    const hands = { hour: svg.querySelector('[data-hand=hour]'), minute: svg.querySelector('[data-hand=minute]') };
    if (!hands.hour || !hands.minute) { return; }
    // accumulate clockwise degrees so hands never spin backward when crossing 360->0
    const turned = { ...DRAWN };
    const point = (ms = 0) => {
      const angles = handAngles();
      for (const [name, hand] of Object.entries(hands)) {
        turned[name] += (((angles[name] - turned[name]) % 360) + 360) % 360;
        hand.style.transition = ms ? `rotate ${ms}ms ${EASE}` : 'none';
        hand.style.rotate = `${turned[name]}deg`;
      }
    };
    // block ticks and hover spins until the initial sweep from 10:10 finishes
    let moving = true;
    const settle = () => {
      moving = false;
      point();
    };
    const move = (ms, start) => {
      moving = true;
      start();
      setTimeout(settle, ms);
    };
    setTimeout(() => (still ? settle() : move(1200, () => point(1200))), still ? 0 : 900);
    setInterval(() => !moving && point(), 30_000);
    svg.closest('.wordmark')?.addEventListener('pointerenter', () => {
      if (still || moving) { return; }
      // use a CSS transition instead of keyframes so the spin starts from the hand's current angle
      move(900, () => {
        turned.minute += 360;
        hands.minute.style.transition = `rotate 900ms ${EASE}`;
        hands.minute.style.rotate = `${turned.minute}deg`;
      });
    });
  });
}
