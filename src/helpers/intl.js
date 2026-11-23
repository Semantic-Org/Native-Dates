import { isPlainObject } from './utils.js';

import { guard } from './errors.js';

// bound memoized maps and Intl formatter tries so untrusted Accept-Language headers cannot grow heap without limit
export const bounded = (limit = 500) => {
  const map = new Map();
  return {
    get(key) {
      if (!map.has(key)) {
        return undefined;
      }
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    },
    has: (key) => map.has(key),
    set(key, value) {
      if (map.size >= limit && !map.has(key)) {
        map.delete(map.keys().next().value);
      }
      map.set(key, value);
      return value;
    },
    clear: () => map.clear(),
  };
};

// memoize Intl formatters in a fixed-arity Map trie (~100x faster than constructing per call).
// Frozen preset bags key by reference, while caller objects serialize in case they are mutated
export const cached = (make) => {
  const root = bounded();
  return (...args) => {
    let level = root;
    const last = args.length - 1;
    for (let index = 0; index <= last; index++) {
      const arg = args[index];
      const key = isPlainObject(arg) && !Object.isFrozen(arg)
        ? JSON.stringify(arg)
        : Array.isArray(arg)
        ? String(arg)
        : arg;
      let next = level.get(key);
      if (next === undefined) {
        next = index === last ? make(...args) : bounded();
        level.set(key, next);
      }
      level = next;
    }
    return level;
  };
};

// DateTime lets a defined options.timeZone override its zone, while plain dates and times pin 'UTC' to match epochOf()
export const zonedDateTimeFormat = cached((locale, options, zone) =>
  guard(
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone: options.timeZone ?? zone }),
    'unknownFormat',
    JSON.stringify(options),
  )
);
export const plainDateTimeFormat = cached((locale, options) =>
  guard(
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }),
    'unknownFormat',
    JSON.stringify(options),
  )
);
export const durationFormat = cached((locale, style, hoursDisplay) =>
  Intl.DurationFormat
    ? new Intl.DurationFormat(locale, { style, hoursDisplay })
    : {
      format({ hours = 0, minutes = 0, seconds = 0, ...rest }) {
        if (style === 'digital') {
          const pad2 = (n) => String(Math.abs(n)).padStart(2, '0');
          const cal = Object.entries(rest)
            .filter(([, n]) => n)
            .map(([k, n]) => unitFormat(locale, k.slice(0, -1), 'narrow').format(n));
          return [...cal, `${hours ? `${hours}:` : ''}${pad2(minutes)}:${pad2(seconds)}`].join(' ');
        }
        return Object.entries({ ...rest, hours, minutes, seconds })
          .filter(([, count]) => count)
          .map(([name, count]) => unitFormat(locale, name.slice(0, -1), style).format(count))
          .join(style === 'narrow' ? ' ' : ', ');
      },
    }
);
export const unitFormat = cached((locale, unit, unitDisplay) =>
  new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay })
);
