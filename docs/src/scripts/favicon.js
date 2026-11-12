// the favicon is a watch that tells the reader's time: the ring and hands of public/favicon.svg (a
// 24 unit box, drawn there at ten past ten) drawn to a canvas with the hands where they are now, and
// a second hand that ticks. a tab gives an icon 16 pixels, so the watch has no tile behind it and no
// margin around it: it is drawn on nothing, out to the edge of the box, and every pixel goes to the
// face. that is what makes a second hand wide enough to show at every angle. the quarter marks of
// the page's mark are left off, since at this size they are noise
//
// with no tile the icon sits on the browser's own tab, so its colors follow the browser's scheme
// and not the page's theme. the face is drawn again as each second begins, which a background tab
// may slow, and a tick it misses is fine since the next one lands on the right second anyway.
// without motion there is no second hand and the face is drawn once a minute

import { handAngles } from './mark-clock.js';

const SIZE = 64;
const UNIT = SIZE / 24;
// the accent and the text color of each theme (styles/tokens.css), as favicon.svg has them
const COLORS = {
  dark: { face: '#b296ff', hand: '#fff' },
  light: { face: '#7447c8', hand: '#0d111b' },
};

// the face at a time. the second hand is left off when no angle is given for it
function face(canvas, colors, { hour, minute }, second = null) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(UNIT, 0, 0, UNIT, 0, 0);
  ctx.clearRect(0, 0, 24, 24);
  ctx.lineCap = 'round';

  // a hand: a stroke from the center outward, turned clockwise from twelve
  const hand = (degrees, length, width, color) => {
    const turn = (degrees - 90) * Math.PI / 180;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(12 + Math.cos(turn) * length, 12 + Math.sin(turn) * length);
    ctx.stroke();
  };
  ctx.strokeStyle = colors.face;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(12, 12, 10.5, 0, Math.PI * 2);
  ctx.stroke();
  hand(minute, 6.8, 1.8, colors.hand);
  hand(hour, 4.4, 2.6, colors.hand);
  // the second hand lies over the other two and reaches the ring, in the ring's color
  if (second !== null) { hand(second, 8.7, 1.5, colors.face); }
  return canvas.toDataURL('image/png');
}

export function clockFavicon() {
  const link = document.querySelector('link[rel="icon"]');
  const canvas = document.createElement('canvas');
  if (!link || !canvas.getContext('2d')) { return; }
  canvas.width = canvas.height = SIZE;
  link.type = 'image/png';

  const dark = matchMedia('(prefers-color-scheme: dark)');
  const ticking = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const every = ticking ? 1000 : 60_000;
  const paint = () => {
    const now = new Date();
    link.href = face(canvas, dark.matches ? COLORS.dark : COLORS.light, handAngles(now), ticking ? now.getSeconds() * 6 : null);
  };
  const draw = () => {
    paint();
    // again as the next second, or minute, begins
    setTimeout(draw, every - (Date.now() % every));
  };
  draw();
  dark.addEventListener('change', paint);
}
