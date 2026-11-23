// minimal internal utilities inlined so native-dates has zero dependencies

export const isObject = (x) => x !== null && typeof x == 'object';

export const isPlainObject = (x) => {
  if (!isObject(x)) {
    return false;
  }
  const proto = Object.getPrototypeOf(x);
  return proto === null || proto === Object.prototype;
};

export const isString = (x) => typeof x == 'string';

export const isNumber = (x) => typeof x == 'number';

export const isArray = (x) => Array.isArray(x);

// Object.prototype.toString works across realms where `instanceof Date` fails
export const isDate = (x) => Object.prototype.toString.call(x) === '[object Date]';

export const each = (obj, func) => {
  if (isArray(obj)) {
    obj.forEach(func);
  }
  else if (obj != null) {
    Object.keys(obj).forEach((key) => func(obj[key], key, obj));
  }
  return obj;
};

// callers pass `explanation: isDevelopment ? '...' : 0` at the callsite because bundlers fold ternary
// branches there, whereas string arguments passed into a helper stay in the bundle
export const createErrors = ({ namespace, ErrorClass }) => {
  const throwError = (code, at, { explanation } = {}) => {
    const line = `${namespace} refused [${code}] ${at}`;
    const built = new ErrorClass(explanation ? `${line}\n${explanation}` : line);
    built.code = code;
    built.at = at;
    Error.captureStackTrace?.(built, throwError);
    throw built;
  };
  return { throwError };
};

// cap memoized maps and Intl formatter tries so untrusted Accept-Language headers cannot grow heap without limit
export const remember = (map, key, value, limit = 500) => {
  if (map.size >= limit && !map.has(key)) {
    map.delete(map.keys().next().value);
  }
  map.set(key, value);
  return value;
};

// memoize Intl formatters in a fixed-arity Map trie (~100x faster than constructing per call).
// Frozen preset bags key by reference, while caller objects serialize in case they are mutated
export const cached = (make) => {
  const root = new Map();
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
        next = remember(level, key, index === last ? make(...args) : new Map());
      }
      level = next;
    }
    return level;
  };
};
