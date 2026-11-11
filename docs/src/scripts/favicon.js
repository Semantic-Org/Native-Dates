// the favicon is a clock that tells the reader's time: the mark's own tile, ring and hands
// (public/favicon.svg, a 24 unit box) drawn to a canvas with the hands where they are now, and again
// as each minute turns. nothing moves in between, so a tab that is only glanced at is still right

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

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(12, 12, 6.5, 0, Math.PI * 2);
  ctx.stroke();

  // a hand of a length, turned clockwise from twelve
  const hand = (degrees, length) => {
    const turn = (degrees - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(12 + Math.cos(turn) * length, 12 + Math.sin(turn) * length);
    ctx.stroke();
  };
  ctx.strokeStyle = '#b296ff';
  ctx.lineWidth = 2;
  hand(hour, 3);
  hand(minute, 3.6);
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
