import { LAND } from '../data/land.js';

const RADIANS = Math.PI / 180;
const TURN = Math.PI * 2;
const SHADE = 64;
const LEVELS = 4;
// how squarely a point faces the sun where night ends, and how far the twilight band runs into day
const TWILIGHT = { from: -0.3, span: 0.56 };

const SPIN = {
  maxLatitude: 65,
  maxSpeed: 0.42,
  frictionMs: 280,
  captureSpeed: 0.065,
  lookaheadMs: 180,
  stiffness: 0.00014,
  damping: 2 * Math.sqrt(0.00014),
  sampleWindowMs: 100,
  idleCutoffMs: 80,
  tapPixels: 6,
  sensitivity: 1.15,
};

// 0 in full night and 1 in full day, easing through twilight so the terminator has no hard edge
function daylight(facing) {
  const through = Math.max(0, Math.min(1, (facing - TWILIGHT.from) / TWILIGHT.span));
  return through * through * (3 - 2 * through);
}

// where each language's home zone (and common reader zones) sits as [latitude, longitude]. Zones outside
// this list have no known coordinates, so the globe faces their meridian without marking a spot
const PLACES = {
  'Africa/Cairo': [30, 31.2],
  'America/Chicago': [41.9, -87.6],
  'America/Denver': [39.7, -105],
  'America/Los_Angeles': [34.1, -118.2],
  'America/Mexico_City': [19.4, -99.1],
  'America/New_York': [40.7, -74],
  'America/Sao_Paulo': [-23.5, -46.6],
  'America/Toronto': [43.7, -79.4],
  'Asia/Seoul': [37.6, 127],
  'Asia/Shanghai': [31.2, 121.5],
  'Asia/Tokyo': [35.7, 139.7],
  'Australia/Sydney': [-33.9, 151.2],
  'Europe/Athens': [38, 23.7],
  'Europe/Berlin': [52.5, 13.4],
  'Europe/Istanbul': [41, 29],
  'Europe/London': [51.5, -0.1],
  'Europe/Moscow': [55.8, 37.6],
  'Europe/Paris': [48.9, 2.3],
};

// +y runs through the north pole and +z through latitude 0, longitude 0
function vector(latitude, longitude) {
  const ring = Math.cos(latitude * RADIANS);
  return [ring * Math.sin(longitude * RADIANS), Math.sin(latitude * RADIANS), ring * Math.cos(longitude * RADIANS)];
}

const wrap = (degrees) => ((((degrees + 180) % 360) + 360) % 360) - 180;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
  const go = pane.querySelector('.globe-go');
  const goName = go?.querySelector('.globe-go-name');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const here = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  const size = canvas.width;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.height = size * ratio;
  const context = canvas.getContext('2d');
  const shade = Object.assign(document.createElement('canvas'), { width: SHADE, height: SHADE });
  const shadeContext = shade.getContext('2d');
  const shadow = shadeContext.createImageData(SHADE, SHADE);

  const items = [...list.querySelectorAll('[data-language-pick]')];
  const claimedZones = new Set(items.map((item) => item.dataset.zone).filter(Boolean));
  const locales = items.map((item) => {
    const zone = item.dataset.zone || here;
    const spot = PLACES[zone] ?? null;
    // a clock's offset in minutes is a quarter of its meridian in degrees
    const [latitude, longitude] = spot ?? [20, -new Date().getTimezoneOffset() / 4];
    // look from nearer the equator than the place itself so its continent stays in frame
    const viewTarget = { latitude: latitude * 0.6 + 6, longitude };
    return {
      item,
      zone,
      point: spot ? vector(...spot) : null,
      anchor: vector(latitude, longitude),
      target: viewTarget,
      targetVector: vector(viewTarget.latitude, viewTarget.longitude),
      // let a language with an explicit home zone win if the reader happens to live in that same zone
      collides: !item.dataset.zone && claimedZones.has(here),
    };
  });
  const entryByItem = new Map(locales.map((entry) => [entry.item, entry]));

  const dots = landDots();
  const lit = new Uint8Array(dots.length);
  let sun;
  let shown = null;
  let frame = 0;
  let drawQueued = false;
  let last = 0;
  let mode = 'idle';
  let view = { latitude: 0, longitude: 0 };
  let target = view;
  let velocity = { latitude: 0, longitude: 0 };
  let activePointer = null;
  let wasLanded = false;
  let lastX = 0;
  let lastY = 0;
  let moved = 0;
  let samples = [];

  const light = () => {
    sun = subsolar(new Date());
    dots.forEach(([x, y, z], i) => {
      lit[i] = Math.round(daylight(x * sun[0] + y * sun[1] + z * sun[2]) * LEVELS);
    });
  };

  const isSwitchable = (entry) => Boolean(entry && entry.item.getAttribute('aria-checked') !== 'true');

  const syncGo = () => {
    if (!go || !shown) { return; }
    if (isSwitchable(shown)) {
      go.href = shown.item.href;
      go.lang = shown.item.lang;
      go.hreflang = shown.item.hreflang;
      go.dataset.languagePick = shown.item.dataset.languagePick;
      if (goName) { goName.textContent = shown.item.querySelector('span')?.textContent ?? ''; }
      go.dataset.ready = '';
    }
    else {
      delete go.dataset.ready;
      go.removeAttribute('href');
    }
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

    // show quiet beacons for every other translated spot so readers can aim while spinning
    context.fillStyle = color('--globe-spot');
    for (const entry of locales) {
      if (!entry.point || entry === shown) { continue; }
      const [x, y, z] = turned(entry.point);
      if (z < 0.08) { continue; }
      context.beginPath();
      context.arc(center + x * radius, center - y * radius, 2.2, 0, TURN);
      context.fill();
    }

    if (shown?.point) {
      const [x, y, z] = turned(shown.point);
      if (z > 0) {
        const markX = center + x * radius;
        const markY = center - y * radius;
        context.beginPath();
        context.arc(markX, markY, 9, 0, TURN);
        context.fillStyle = color('--globe-halo');
        context.fill();
        if (isSwitchable(shown) && mode === 'idle') {
          context.beginPath();
          context.arc(markX, markY, 12.5, 0, TURN);
          context.strokeStyle = color('--globe-ring');
          context.lineWidth = 1.25;
          context.stroke();
        }
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

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    drawQueued = false;
  };

  const syncFade = () => {
    const overflow = list.scrollHeight - list.clientHeight;
    if (overflow <= 1) {
      delete list.dataset.fadeTop;
      delete list.dataset.fadeBottom;
      return;
    }
    if (list.scrollTop > 2) { list.dataset.fadeTop = ''; }
    else { delete list.dataset.fadeTop; }
    if (list.scrollTop < overflow - 2) { list.dataset.fadeBottom = ''; }
    else { delete list.dataset.fadeBottom; }
  };

  const reveal = (item, { smooth = true } = {}) => {
    if (list.scrollHeight <= list.clientHeight) { return; }
    const top = item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
    const max = list.scrollHeight - list.clientHeight;
    list.scrollTo({ top: clamp(top, 0, max), behavior: smooth && !still ? 'smooth' : 'auto' });
  };

  const write = () => {
    if (!shown) { return; }
    written.textContent = new Intl.DateTimeFormat(shown.item.dataset.locale, {
      timeZone: shown.zone,
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());
    written.lang = shown.item.lang;
    zoned.textContent = shown.zone;
  };

  const mark = (entry, { scroll = false, smooth = true } = {}) => {
    if (shown && shown !== entry) { delete shown.item.dataset.shown; }
    shown = entry;
    shown.item.dataset.shown = '';
    write();
    syncGo();
    if (scroll) { reveal(shown.item, { smooth }); }
  };

  const nearest = (point, key = 'targetVector') => {
    let best = null;
    let bestScore = -Infinity;
    for (const entry of locales) {
      if (entry.collides) { continue; }
      const candidate = entry[key];
      const score = point[0] * candidate[0] + point[1] * candidate[1] + point[2] * candidate[2];
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best ?? locales[0];
  };

  const unproject = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const radius = rect.width / 2;
    if (!radius) { return null; }
    const sx = (clientX - (rect.left + radius)) / radius;
    const sy = ((rect.top + radius) - clientY) / radius;
    const radial = sx * sx + sy * sy;
    if (radial > 1) { return null; }
    const sz = Math.sqrt(1 - radial);
    const cosLongitude = Math.cos(view.longitude * RADIANS);
    const sinLongitude = Math.sin(view.longitude * RADIANS);
    const cosLatitude = Math.cos(view.latitude * RADIANS);
    const sinLatitude = Math.sin(view.latitude * RADIANS);
    const y = sy * cosLatitude + sz * sinLatitude;
    const depth = sz * cosLatitude - sy * sinLatitude;
    return [sx * cosLongitude + depth * sinLongitude, y, depth * cosLongitude - sx * sinLongitude];
  };

  const lockNearest = () => {
    // look slightly ahead along the remaining drift so a gentle flick never snaps backwards
    const projected = {
      latitude: clamp(view.latitude + velocity.latitude * SPIN.lookaheadMs, -SPIN.maxLatitude, SPIN.maxLatitude),
      longitude: wrap(view.longitude + velocity.longitude * SPIN.lookaheadMs),
    };
    const closest = nearest(vector(projected.latitude, projected.longitude));
    mark(closest, { scroll: true });
    target = closest.target;
    mode = 'settle';
  };

  const step = (time) => {
    const dt = Math.max(0, Math.min(time - last, 50));
    last = time;
    if (mode === 'coast') {
      view.longitude = wrap(view.longitude + velocity.longitude * dt);
      view.latitude = clamp(view.latitude + velocity.latitude * dt, -SPIN.maxLatitude, SPIN.maxLatitude);
      if (Math.abs(view.latitude) >= SPIN.maxLatitude) { velocity.latitude = 0; }
      const decay = Math.exp(-dt / SPIN.frictionMs);
      velocity.longitude *= decay;
      velocity.latitude *= decay;
      const closest = nearest(vector(view.latitude, view.longitude));
      if (closest !== shown) { mark(closest, { scroll: true }); }
      if (Math.hypot(velocity.longitude, velocity.latitude) <= SPIN.captureSpeed) { lockNearest(); }
      draw();
      frame = requestAnimationFrame(step);
      return;
    }
    if (mode === 'settle') {
      const around = wrap(target.longitude - view.longitude);
      const over = target.latitude - view.latitude;
      velocity.longitude += (around * SPIN.stiffness - velocity.longitude * SPIN.damping) * dt;
      velocity.latitude += (over * SPIN.stiffness - velocity.latitude * SPIN.damping) * dt;
      view.longitude = wrap(view.longitude + velocity.longitude * dt);
      view.latitude = clamp(view.latitude + velocity.latitude * dt, -SPIN.maxLatitude, SPIN.maxLatitude);
      const settled =
        Math.abs(wrap(target.longitude - view.longitude)) < 0.08
        && Math.abs(target.latitude - view.latitude) < 0.08
        && Math.hypot(velocity.longitude, velocity.latitude) < 0.002;
      if (settled) {
        view = { ...target };
        velocity = { latitude: 0, longitude: 0 };
        mode = 'idle';
        frame = 0;
        draw();
        return;
      }
      draw();
      frame = requestAnimationFrame(step);
      return;
    }
    if (mode === 'ease') {
      const ease = 1 - Math.exp(-dt / 150);
      const around = wrap(target.longitude - view.longitude);
      const over = target.latitude - view.latitude;
      view = { latitude: view.latitude + over * ease, longitude: wrap(view.longitude + around * ease) };
      if (Math.abs(around) > 0.05 || Math.abs(over) > 0.05) {
        draw();
        frame = requestAnimationFrame(step);
        return;
      }
      view = { ...target };
      mode = 'idle';
      frame = 0;
      draw();
      return;
    }
    frame = 0;
  };

  const animate = () => {
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  const queueDraw = () => {
    if (drawQueued) { return; }
    drawQueued = true;
    frame = requestAnimationFrame(() => {
      drawQueued = false;
      frame = 0;
      draw();
    });
  };

  const show = (item, { from, scroll = false, smooth = true } = {}) => {
    const entry = entryByItem.get(item);
    if (!entry) { return; }
    mark(entry, { scroll, smooth });
    target = entry.target;
    velocity = { latitude: 0, longitude: 0 };
    if (still) {
      stop();
      mode = 'idle';
      view = { ...target };
      draw();
      return;
    }
    if (from !== undefined) { view = { latitude: target.latitude, longitude: wrap(target.longitude + from) }; }
    if (drawQueued) { stop(); }
    mode = 'ease';
    animate();
  };

  const releaseSpin = (event) => {
    if (event.pointerId !== activePointer) { return; }
    activePointer = null;
    delete pane.dataset.dragging;
    try {
      if (pane.hasPointerCapture?.(event.pointerId)) { pane.releasePointerCapture(event.pointerId); }
    }
    catch {}
    if (drawQueued) { stop(); }

    if (moved < SPIN.tapPixels) {
      const tapped = unproject(event.clientX, event.clientY);
      if (tapped) {
        const closest = nearest(tapped, 'anchor');
        // tapping again on a landed switchable location confirms and navigates to that language
        if (wasLanded && closest === shown && isSwitchable(shown)) {
          mode = 'idle';
          shown.item.click();
          return;
        }
        show(closest.item, { scroll: true });
      }
      else if (shown) {
        mode = 'idle';
      }
      return;
    }

    const now = performance.now();
    const recent = samples.filter((sample) => now - sample.time <= SPIN.sampleWindowMs);
    let velocityLongitude = 0;
    let velocityLatitude = 0;
    if (recent.length && now - recent.at(-1).time <= SPIN.idleCutoffMs) {
      const span = Math.max(16, now - recent[0].time);
      for (const sample of recent) {
        velocityLongitude += sample.dLon;
        velocityLatitude += sample.dLat;
      }
      velocityLongitude /= span;
      velocityLatitude /= span;
      const speed = Math.hypot(velocityLongitude, velocityLatitude);
      if (speed > SPIN.maxSpeed) {
        const scale = SPIN.maxSpeed / speed;
        velocityLongitude *= scale;
        velocityLatitude *= scale;
      }
    }

    if (still) {
      const closest = nearest(vector(view.latitude, view.longitude));
      mark(closest, { scroll: true, smooth: false });
      view = { ...closest.target };
      mode = 'idle';
      draw();
      return;
    }

    velocity = { latitude: velocityLatitude, longitude: velocityLongitude };
    if (Math.hypot(velocityLongitude, velocityLatitude) > SPIN.captureSpeed) {
      mode = 'coast';
    }
    else {
      lockNearest();
    }
    animate();
  };

  pane.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.globe-go')) { return; }
    if (event.pointerType === 'mouse' && event.button !== 0) { return; }
    if (activePointer !== null) { return; }
    event.preventDefault();
    wasLanded = mode === 'idle';
    stop();
    activePointer = event.pointerId;
    try { pane.setPointerCapture?.(event.pointerId); }
    catch {}
    pane.dataset.dragging = '';
    delete pane.dataset.selectable;
    lastX = event.clientX;
    lastY = event.clientY;
    moved = 0;
    samples = [];
    velocity = { latitude: 0, longitude: 0 };
    mode = 'drag';
  });

  pane.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointer || mode !== 'drag') {
      if (event.pointerType === 'mouse' && mode === 'idle' && isSwitchable(shown)) {
        const pointed = unproject(event.clientX, event.clientY);
        if (pointed && nearest(pointed, 'anchor') === shown) { pane.dataset.selectable = ''; }
        else { delete pane.dataset.selectable; }
      }
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (!dx && !dy) { return; }
    lastX = event.clientX;
    lastY = event.clientY;
    moved += Math.hypot(dx, dy);

    const radius = canvas.getBoundingClientRect().width / 2 || size / 2;
    const degreesPerPixel = ((180 / Math.PI) / radius) * SPIN.sensitivity;
    const dLon = -dx * degreesPerPixel;
    const dLat = dy * degreesPerPixel;
    view = {
      latitude: clamp(view.latitude + dLat, -SPIN.maxLatitude, SPIN.maxLatitude),
      longitude: wrap(view.longitude + dLon),
    };
    const now = performance.now();
    samples.push({ time: now, dLon, dLat });
    while (samples.length && now - samples[0].time > SPIN.sampleWindowMs) { samples.shift(); }

    const closest = nearest(vector(view.latitude, view.longitude));
    if (closest !== shown) { mark(closest, { scroll: true }); }
    queueDraw();
  });

  pane.addEventListener('pointerup', releaseSpin);
  pane.addEventListener('pointercancel', releaseSpin);
  pane.addEventListener('pointerleave', () => { delete pane.dataset.selectable; });

  const follow = (item) => { if (item && item !== shown?.item && mode !== 'drag') { show(item); } };
  const pickAt = (element) => follow(element?.closest?.('[data-language-pick]'));
  list.addEventListener('pointerdown', (event) => pickAt(event.target));
  // listen to pointermove rather than pointerover so programmatic list scrolling under a stationary cursor cannot hijack the globe
  list.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') { return; }
    pickAt(event.buttons ? document.elementFromPoint(event.clientX, event.clientY) : event.target);
  });
  // opening the menu focuses its first item by script, so only follow focus a reader moved with the keyboard
  list.addEventListener('focusin', (event) => {
    if (event.target.matches(':focus-visible') && mode !== 'drag') { show(event.target, { scroll: true }); }
  });

  list.addEventListener('scroll', syncFade, { passive: true });

  // start each opening on the language being read, spinning in from the west
  const open = () => {
    light();
    show(list.querySelector('[aria-checked=true]') ?? list.firstElementChild, { from: -70, scroll: true, smooth: false });
    syncFade();
  };
  new MutationObserver(() => {
    if (!menu.hidden) { open(); }
    else {
      stop();
      activePointer = null;
      delete pane.dataset.dragging;
      delete pane.dataset.selectable;
      mode = 'idle';
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
