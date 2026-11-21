import { LAND } from '../data/land.js';

const RADIANS = Math.PI / 180;
const TURN = Math.PI * 2;
const SHADE = 64;
const LEVELS = 4;
// how squarely a point faces the sun where night ends, and how far the twilight band runs into day
const TWILIGHT = { from: -0.3, span: 0.56 };

// 0 in full night and 1 in full day, easing through twilight so the terminator has no hard edge
function daylight(facing) {
  const through = Math.max(0, Math.min(1, (facing - TWILIGHT.from) / TWILIGHT.span));
  return through * through * (3 - 2 * through);
}
// where each language's home zone sits as [latitude, longitude]. Zones outside this list have no
// known coordinates, so the globe faces their meridian without marking a spot
const PLACES = {
  'Africa/Cairo': [30, 31.2],
  'America/Mexico_City': [19.4, -99.1],
  'America/Sao_Paulo': [-23.5, -46.6],
  'Asia/Seoul': [37.6, 127],
  'Asia/Shanghai': [31.2, 121.5],
  'Asia/Tokyo': [35.7, 139.7],
  'Europe/Moscow': [55.8, 37.6],
  'Europe/Paris': [48.9, 2.3],
};

// +y runs through the north pole and +z through latitude 0, longitude 0
function vector(latitude, longitude) {
  const ring = Math.cos(latitude * RADIANS);
  return [ring * Math.sin(longitude * RADIANS), Math.sin(latitude * RADIANS), ring * Math.cos(longitude * RADIANS)];
}

const wrap = (degrees) => ((((degrees + 180) % 360) + 360) % 360) - 180;

function landDots() {
  const { step, bits } = LAND;
  const columns = 360 / step;
  const mask = Uint8Array.from(atob(bits), (character) => character.charCodeAt(0));
  const dots = [];
  for (let row = 0; row < 180 / step; row++) {
    const latitude = 90 - (row + 0.5) * step;
    // thin each row toward the poles so dots stay evenly spaced over the sphere
    const count = Math.max(1, Math.round(columns * Math.cos(latitude * RADIANS)));
    for (let i = 0; i < count; i++) {
      const longitude = -180 + ((i + 0.5) * 360) / count;
      const bit = row * columns + Math.floor((longitude + 180) / step);
      if (mask[bit >> 3] & (1 << (bit & 7))) { dots.push(vector(latitude, longitude)); }
    }
  }
  return dots;
}

// the point directly under the sun, without the equation of time because shading hides a few degrees
function subsolar(at) {
  const day = (at - Date.UTC(at.getUTCFullYear(), 0, 0)) / 86_400_000;
  const hours = at.getUTCHours() + at.getUTCMinutes() / 60;
  return vector(-23.44 * Math.cos((TURN * (day + 10)) / 365.24), (12 - hours) * 15);
}

export function mountLanguageGlobe(host) {
  const menu = host.querySelector('.pop-menu');
  const list = host.querySelector('.language-list');
  const pane = host.querySelector('.language-globe');
  const canvas = pane.querySelector('canvas');
  const written = pane.querySelector('.globe-now');
  const zoned = pane.querySelector('.globe-zone');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const here = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  const size = canvas.width;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.style.width = canvas.style.height = `${size}px`;
  canvas.width = canvas.height = size * ratio;
  const context = canvas.getContext('2d');
  const shade = Object.assign(document.createElement('canvas'), { width: SHADE, height: SHADE });
  const shadeContext = shade.getContext('2d');
  const shadow = shadeContext.createImageData(SHADE, SHADE);

  const dots = landDots();
  const lit = new Uint8Array(dots.length);
  let sun;
  let shown;
  let place = null;
  let frame = 0;
  let last = 0;
  let view = { latitude: 0, longitude: 0 };
  let target = view;

  const light = () => {
    sun = subsolar(new Date());
    dots.forEach(([x, y, z], i) => {
      lit[i] = Math.round(daylight(x * sun[0] + y * sun[1] + z * sun[2]) * LEVELS);
    });
  };

  const draw = () => {
    const style = getComputedStyle(pane);
    const color = (name) => style.getPropertyValue(name);
    const cosLongitude = Math.cos(view.longitude * RADIANS);
    const sinLongitude = Math.sin(view.longitude * RADIANS);
    const cosLatitude = Math.cos(view.latitude * RADIANS);
    const sinLatitude = Math.sin(view.latitude * RADIANS);
    // spin the planet until the viewed longitude faces the reader, then tip the viewed latitude forward
    const turned = ([x, y, z]) => {
      const depth = x * sinLongitude + z * cosLongitude;
      return [x * cosLongitude - z * sinLongitude, y * cosLatitude - depth * sinLatitude, y * sinLatitude + depth * cosLatitude];
    };
    const center = size / 2;
    const radius = center - 1;
    const disc = new Path2D();
    disc.arc(center, center, radius, 0, TURN);

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size, size);
    context.fillStyle = color('--globe-day');
    context.fill(disc);

    // paint the night side at low resolution as alpha only, tint it, and let scaling soften the terminator
    const [sunX, sunY, sunZ] = turned(sun);
    for (let row = 0; row < SHADE; row++) {
      for (let column = 0; column < SHADE; column++) {
        const x = ((column + 0.5) / SHADE) * 2 - 1;
        const y = 1 - ((row + 0.5) / SHADE) * 2;
        const facing = x * sunX + y * sunY + Math.sqrt(Math.max(0, 1 - x * x - y * y)) * sunZ;
        shadow.data[(row * SHADE + column) * 4 + 3] = (1 - daylight(facing)) * 255;
      }
    }
    shadeContext.globalCompositeOperation = 'source-over';
    shadeContext.putImageData(shadow, 0, 0);
    shadeContext.globalCompositeOperation = 'source-in';
    shadeContext.fillStyle = color('--globe-night');
    shadeContext.fillRect(0, 0, SHADE, SHADE);
    context.save();
    context.clip(disc);
    context.drawImage(shade, center - radius, center - radius, radius * 2, radius * 2);
    context.restore();

    // every dot starts in its night color, then daylight paints over it in steps of opacity so
    // land fades through twilight with the sea
    const land = Array.from({ length: LEVELS + 1 }, () => new Path2D());
    dots.forEach((dot, i) => {
      const [x, y, z] = turned(dot);
      if (z < 0.04) { return; }
      // shrink dots toward the limb the way a sphere foreshortens its surface
      const dotRadius = 0.45 + 0.75 * z;
      const dotX = center + x * radius;
      const dotY = center - y * radius;
      for (const path of lit[i] ? [land[0], land[lit[i]]] : [land[0]]) {
        path.moveTo(dotX + dotRadius, dotY);
        path.arc(dotX, dotY, dotRadius, 0, TURN);
      }
    });
    context.fillStyle = color('--globe-land-night');
    context.fill(land[0]);
    context.fillStyle = color('--globe-land-day');
    for (let level = 1; level <= LEVELS; level++) {
      context.globalAlpha = level / LEVELS;
      context.fill(land[level]);
    }
    context.globalAlpha = 1;

    const limb = context.createRadialGradient(center, center, radius * 0.55, center, center, radius);
    limb.addColorStop(0, 'transparent');
    limb.addColorStop(1, color('--globe-limb'));
    context.fillStyle = limb;
    context.fill(disc);
    context.strokeStyle = color('--globe-rim');
    context.lineWidth = 1;
    context.stroke(disc);

    if (place) {
      const [x, y, z] = turned(place);
      if (z > 0) {
        const markX = center + x * radius;
        const markY = center - y * radius;
        context.beginPath();
        context.arc(markX, markY, 9, 0, TURN);
        context.fillStyle = color('--globe-halo');
        context.fill();
        context.beginPath();
        context.arc(markX, markY, 3.5, 0, TURN);
        context.fillStyle = color('--globe-mark');
        context.fill();
        context.strokeStyle = color('--globe-mark-edge');
        context.lineWidth = 1.5;
        context.stroke();
      }
    }
  };

  const step = (time) => {
    const ease = 1 - Math.exp(-Math.max(0, Math.min(time - last, 50)) / 150);
    last = time;
    const around = wrap(target.longitude - view.longitude);
    const over = target.latitude - view.latitude;
    view = { latitude: view.latitude + over * ease, longitude: view.longitude + around * ease };
    draw();
    frame = Math.abs(around) > 0.05 || Math.abs(over) > 0.05 ? requestAnimationFrame(step) : 0;
  };

  const write = () => {
    const timeZone = shown.dataset.zone || here;
    written.textContent = new Intl.DateTimeFormat(shown.dataset.locale, { timeZone, weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date());
    written.lang = shown.lang;
    zoned.textContent = timeZone;
  };

  const show = (item, { from } = {}) => {
    shown = item;
    const spot = PLACES[item.dataset.zone || here];
    place = spot ? vector(...spot) : null;
    // a clock's offset in minutes is a quarter of its meridian in degrees
    const [latitude, longitude] = spot ?? [20, -new Date().getTimezoneOffset() / 4];
    // look from nearer the equator than the place itself so its continent stays in frame
    target = { latitude: latitude * 0.6 + 6, longitude };
    write();
    if (still) {
      view = target;
      draw();
      return;
    }
    if (from !== undefined) { view = { latitude: target.latitude, longitude: target.longitude + from }; }
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  const follow = (item) => { if (item && item !== shown) { show(item); } };
  list.addEventListener('pointerover', (event) => follow(event.target.closest('[data-language-pick]')));
  // opening the menu focuses its first item by script, so only follow focus a reader moved with the keyboard
  list.addEventListener('focusin', (event) => { if (event.target.matches(':focus-visible')) { follow(event.target); } });

  // start each opening on the language being read, spinning in from the west
  const open = () => {
    light();
    show(list.querySelector('[aria-checked=true]') ?? list.firstElementChild, { from: -70 });
  };
  new MutationObserver(() => {
    if (!menu.hidden) { open(); }
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }).observe(menu, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(() => !menu.hidden && draw()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  setInterval(() => {
    if (menu.hidden) { return; }
    light();
    write();
    draw();
  }, 30_000);
  if (!menu.hidden) { open(); }
}
