// the favicon is a watch that tells the reader's time: the mark's own tile, ring, quarter marks and
// hands (public/favicon.svg, a 24 unit box, drawn there at ten past ten) drawn to a canvas with the
// hands where they are now. a pulse of light runs once around the ring from twelve, then the face
// rests, and that repeats. the frames of one turn are drawn once a minute and cached as png, so a
// tick only swaps the icon's href. a timer at 30fps, which a busy tab may not keep (a skipped frame
// is fine); the browser slows it in a background tab on its own. the pulse eases and trails a
// fading tail, so the step between frames reads as motion rather than a jump

import { handAngles } from './mark-clock.js';

const SIZE = 64;
const UNIT = SIZE / 24;
const FPS = 30;
const TRAVEL = 27; // frames the pulse takes around the ring
const REST = 45; // frames of stillness before the next pulse
const RING = 7.5; // the ring's radius, in units
const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2;

// one frame: the face at a time, and the pulse at its place around the ring (null for none)
function face({ hour, minute }, pulse = null) {
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
  ctx.strokeStyle = '#b296ff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(12, 12, RING, 0, Math.PI * 2);
  ctx.stroke();

  // the pulse: a short bright length of the ring, glowing, with a tail of fainter lengths behind it
  // that bridges the distance it moved since the last frame. the ring has no end to run off, so the
  // pulse rises out of twelve as it leaves and sinks back into it as it comes round
  if (pulse !== null) {
    const length = 3 / RING;
    const head = ease(pulse) * Math.PI * 2 - Math.PI / 2;
    const strength = Math.min(1, pulse / 0.2, (1 - pulse) / 0.25);
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#b296ff';
    ctx.shadowBlur = 3 * UNIT;
    [[0, 1], [1.6, 0.55], [3.2, 0.28], [4.8, 0.12]].forEach(([behind, alpha]) => {
      const end = head - behind / RING;
      ctx.strokeStyle = `rgba(243, 236, 255, ${alpha * strength})`;
      ctx.beginPath();
      ctx.arc(12, 12, RING, end - length, end);
      ctx.stroke();
    });
    ctx.restore();
  }

  [0, 90, 180, 270].forEach((quarter) => stroke(quarter, 5, 5.9, 1.1, 'rgba(178, 150, 255, 0.7)'));
  stroke(minute, 0, 4.4, 1.3, '#fff');
  stroke(hour, 0, 2.9, 2.1, '#fff');
  return canvas.toDataURL('image/png');
}

export function clockFavicon() {
  const link = document.querySelector('link[rel="icon"]');
  if (!link || !document.createElement('canvas').getContext('2d')?.roundRect) { return; }
  link.type = 'image/png';

  // without motion the face is still, and drawn again as each minute begins
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const draw = () => {
      link.href = face(handAngles());
      setTimeout(draw, 60_000 - (Date.now() % 60_000));
    };
    draw();
    return;
  }

  // one cycle: the pulse's turn, then rest. resting frames are the still face, drawn once. a cycle
  // is drawn for the minute it starts in, so the hands move between pulses and never during one
  let frames = [];
  let drawnFor = -1;
  let i = 0;
  let shown = null;
  const tick = () => {
    const minute = Math.floor(Date.now() / 60_000);
    if (i === 0 && minute !== drawnFor) {
      const angles = handAngles();
      const still = face(angles);
      frames = [
        ...Array.from({ length: TRAVEL }, (_, at) => face(angles, (at + 1) / (TRAVEL + 1))),
        ...Array.from({ length: REST }, () => still),
      ];
      drawnFor = minute;
    }
    const next = frames[i];
    if (next !== shown) {
      link.href = next;
      shown = next;
    }
    i = (i + 1) % frames.length;
    setTimeout(tick, 1000 / FPS);
  };
  tick();
}
