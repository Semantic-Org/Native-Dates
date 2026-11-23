// mulberry32, so every sample and both sides read the same fixture
export const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

export const pad = (value) => String(value).padStart(2, '0');

// whole number in [low, high)
export const between = (random, low, high) => low + Math.floor(random() * (high - low));

// distinct to the millisecond so no answer can be remembered by its input
export const distinctInstants = (random, count, from, to) => {
  const seen = new Set();
  while (seen.size < count) {
    seen.add(between(random, from, to));
  }
  return [...seen];
};

// the library reads the clock only through Date.now(), so holding it keeps today the same on every run
export const holdClock = (ms) => {
  Date.now = () => ms;
};

// files that configure nothing read the host's zone and language, which tools/bench.js sets.
// call it from a check, so a page first asks for its zone inside an op, as an app does
export const requireHost = (file, { zone, locale }) => {
  const found = { zone: Temporal.Now.timeZoneId(), locale: navigator.language };
  if (found.zone !== zone || (locale && found.locale !== locale)) {
    throw new Error(
      `bench/${file} needs a host in ${zone} reading ${
        locale ?? 'any language'
      } and found ${found.zone} reading ${found.locale}. Run it through tools/bench.js`,
    );
  }
};
