// the favicon is a watch that tells the reader's time: the mark's own tile, ring, quarter marks and
// hands (public/favicon.svg, a 24 unit box, drawn there at ten past ten) drawn to a canvas with the
// hands where they are now, and again as each minute turns. nothing moves in between, so a tab that
// is only glanced at is still right

import { handAngles } from './mark-clock.js';

const SIZE = 64;
const UNIT = SIZE / 24;

function face({ hour, minute }) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.scale(UNIT, UNIT);
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
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(12, 12, 7.5, 0, Math.PI * 2);
  ctx.stroke();
  [0, 90, 180, 270].forEach((quarter) => stroke(quarter, 5, 5.9, 1.1, 'rgba(255, 255, 255, 0.6)'));
  stroke(minute, 0, 4.4, 1.3, '#fff');
  stroke(hour, 0, 2.9, 2.1, '#b296ff');
  return canvas.toDataURL('image/png');
}

export function clockFavicon() {
  const link = document.querySelector('link[rel="icon"]');
  if (!link || !document.createElement('canvas').getContext('2d')?.roundRect) { return; }
  link.type = 'image/png';
  const draw = () => {
    link.href = face(handAngles());
    // again as the next minute begins
    setTimeout(draw, 60_000 - (Date.now() % 60_000));
  };
  draw();
}
