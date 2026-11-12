// the wordmark's mark tells the time. it is drawn at ten past ten (lib/icons.js), holds that for a
// beat so it is read as a watch, then its hands run forward to the reader's own hour and minute and
// keep it. on hover the minute hand takes one turn around. never on a loop, since the topbar sits
// beside reading. every move starts from where a hand stands and a move under way is left to
// finish, so a hand never jumps back to begin again

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
    // points both hands at the time, over a duration when one is given and at once when not
    const point = (ms = 0) => {
      const angles = handAngles();
      for (const [name, hand] of Object.entries(hands)) {
        turned[name] += (((angles[name] - turned[name]) % 360) + 360) % 360;
        hand.style.transition = ms ? `rotate ${ms}ms ${EASE}` : 'none';
        hand.style.rotate = `${turned[name]}deg`;
      }
    };
    // while a move runs the clock does not tick and a hover does not start another. true from the
    // drawn pose until the hands first reach the time
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
      // a transition and not a keyframe animation, since a transition leaves from the angle the hand is at
      move(900, () => {
        turned.minute += 360;
        hands.minute.style.transition = `rotate 900ms ${EASE}`;
        hands.minute.style.rotate = `${turned.minute}deg`;
      });
    });
  });
}
