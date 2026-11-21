// rasterizes Natural Earth land into the one-bit mask stored in src/data/land.js. Download
// https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json and run
// node scripts/make-land.mjs land-110m.json 3
// which previews the map on stderr and prints the base64 bits on stdout
import { readFileSync } from 'node:fs';

const [file, degrees = '3'] = process.argv.slice(2);
const step = Number(degrees);
const topology = JSON.parse(readFileSync(file, 'utf8'));
const { scale, translate } = topology.transform;

// TopoJSON stores each arc as deltas from its previous point in quantized units
const arcs = topology.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});

// a negative index walks the arc backward, and joined arcs repeat the point they share
const outline = (indexes) => indexes.flatMap((index, n) => {
  const points = index < 0 ? [...arcs[~index]].reverse() : arcs[index];
  return n ? points.slice(1) : points;
});

// outlines that cross the antimeridian jump between +180 and -180, so walk them as one continuous
// shape. Antarctica closes along the south pole and really does span every longitude
function continuous(points) {
  if (Math.max(...points.map(([, latitude]) => latitude)) <= -60) { return points; }
  let previous = points[0][0];
  let longitude = previous;
  return points.map(([raw, latitude]) => {
    const delta = raw - previous;
    longitude += delta - 360 * Math.round(delta / 360);
    previous = raw;
    return [longitude, latitude];
  });
}

const rings = topology.objects.land.geometries.flatMap((geometry) =>
  (geometry.type === 'Polygon' ? [geometry.arcs] : geometry.arcs).flatMap((polygon) => polygon.map(outline))
).map(continuous);

// even-odd across every ring so lakes subtract without tracking which polygon owns them
function within(longitude, latitude) {
  let inside = false;
  for (const points of rings) {
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > latitude) !== (yj > latitude) && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) { inside = !inside; }
    }
  }
  return inside;
}
// continuous outlines can run past either edge of the map, so test the neighbouring copies too
const isLand = (longitude, latitude) =>
  within(longitude, latitude) || within(longitude + 360, latitude) || within(longitude - 360, latitude);

const columns = 360 / step;
const rows = 180 / step;
const bytes = new Uint8Array(Math.ceil((columns * rows) / 8));
const preview = [];
for (let row = 0; row < rows; row++) {
  let line = '';
  for (let column = 0; column < columns; column++) {
    const land = isLand(-180 + (column + 0.5) * step, 90 - (row + 0.5) * step);
    if (land) {
      const bit = row * columns + column;
      bytes[bit >> 3] |= 1 << (bit & 7);
    }
    line += land ? '#' : '.';
  }
  preview.push(line);
}

console.error(preview.join('\n'));
console.log(Buffer.from(bytes).toString('base64'));
