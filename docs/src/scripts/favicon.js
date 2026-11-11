// the favicon is a watch that tells the reader's time: the mark's own tile, ring, quarter marks and
// hands (public/favicon.svg, a 24 unit box, drawn there at ten past ten) drawn to a canvas with the
// hands where they are now. its one motion is a watch's own: a thin second hand that ticks. the face
// is drawn again as each second begins, which a background tab may slow, and a tick it misses is
// fine since the next one lands on the right second anyway. without motion there is no second hand
// and the face is drawn once a minute

import { handAngles } from './mark-clock.js';

const SIZE = 64;
const UNIT = SIZE / 24;

// the face at a time. the second hand is left off when no angle is given for it
function face(canvas, { hour, minute }, second = null) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(UNIT, 0, 0, UNIT, 0, 0);
  ctx.clearRect(0, 0, 24, 24);
  ctx.lineCap = 'round';

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect(0, 0, 24, 24, 6);
  ctx.fill();

  // a stroke from the center outward, turned clockwise from twelve
  const stroke = (degrees, from, to, width, color) => {
    const turn = (degrees - 90) * Math.PI / 180;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(12 + Math.cos(turn) * from, 12 + Math.sin(turn) * from);
    ctx.lineTo(12 + Math.cos(turn) * to, 12 + Math.sin(turn) * to);
    ctx.stroke();
  };
  ctx.strokeStyle = '#b296ff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(12, 12, 7.5, 0, Math.PI * 2);
  ctx.stroke();
  [0, 90, 180, 270].forEach((quarter) => stroke(quarter, 5, 5.9, 1.1, 'rgba(178, 150, 255, 0.7)'));
  stroke(minute, 0, 4.4, 1.3, '#fff');
  stroke(hour, 0, 2.9, 2.1, '#fff');
  // the second hand lies over the other two, as on a watch: longer, thinner and in the ring's color
  if (second !== null) { stroke(second, 0, 5.6, 0.9, '#b296ff'); }
  return canvas.toDataURL('image/png');
}

export function clockFavicon() {
  const link = document.querySelector('link[rel="icon"]');
  const canvas = document.createElement('canvas');
  if (!link || !canvas.getContext('2d')?.roundRect) { return; }
  canvas.width = canvas.height = SIZE;
  link.type = 'image/png';

  const ticking = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const every = ticking ? 1000 : 60_000;
  const draw = () => {
    const now = new Date();
    link.href = face(canvas, handAngles(now), ticking ? now.getSeconds() * 6 : null);
    // again as the next second, or minute, begins
    setTimeout(draw, every - (Date.now() % every));
  };
  draw();
}
