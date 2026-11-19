import { handAngles } from './mark-clock.js';

const SIZE = 64;
const UNIT = SIZE / 24;
// follow browser color-scheme rather than page theme since the transparent icon sits on the browser tab
const COLORS = {
  dark: { face: '#b296ff', hand: '#fff' },
  light: { face: '#7447c8', hand: '#0d111b' },
};

// match public/favicon.svg's 24-unit grid full-bleed without quarter marks so hands stay legible at 16px
function face(canvas, colors, { hour, minute }, second = null) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(UNIT, 0, 0, UNIT, 0, 0);
  ctx.clearRect(0, 0, 24, 24);
  ctx.lineCap = 'round';

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
    setTimeout(draw, every - (Date.now() % every));
  };
  draw();
  dark.addEventListener('change', paint);
}
