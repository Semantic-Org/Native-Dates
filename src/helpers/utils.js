// a verbatim fork of @semantic-ui/utils 0.18.0 (types.js, loops.js, debug.js), so this package
// installs nothing and still loops and refuses exactly as every semantic ui package does.
//
// DO NOT edit, trim, reformat or rewrite anything below this note, comments included. the text is
// byte for byte what utils ships on purpose: when an app bundles native-dates into the same chunk
// as another @semantic-ui library (component, sync and the rest), brotli sees the second copy as a
// repeat of the first and it compresses to almost nothing. a single renamed variable or dropped
// branch breaks the match and the app pays for both copies in full. branches this library never
// reaches stay for the same reason
//
// to update, paste the new text from utils. dprint skips this file (see excludes in dprint.json)

/*-------------------
        Types
--------------------*/

export const isObject = (x) => {
  return x !== null && typeof x == 'object';
};

export const isPlainObject = (x) => {
  if (!isObject(x)) { return false; }
  const proto = Object.getPrototypeOf(x);
  return proto === null || proto === Object.prototype;
};

export const isString = (x) => {
  return typeof x == 'string';
};

export const isNumber = (x) => {
  return typeof x == 'number';
};

export const isArray = (x) => {
  return Array.isArray(x);
};

export const isFunction = (x) => {
  return typeof x == 'function';
};

export const isDate = (x) => {
  return toString.call(x) === '[object Date]';
};

const toString = Object.prototype.toString;

export const isIterable = x => {
  return isFunction(x?.[Symbol.iterator]);
};

export const isMap = (x) => {
  return toString.call(x) === '[object Map]';
};

/*-------------------
      Looping
--------------------*/
/*
  Simplify iterating over objects and arrays
*/
export const each = (obj, func, context) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // allow custom context
  const iteratee = context ? func.bind(context) : func;

  // Arrays - indexed loop fastest in V8
  if (isArray(obj)) {
    for (let i = 0; i < obj.length; ++i) {
      if (iteratee(obj[i], i, obj) === false) {
        break;
      }
    }
    return obj;
  }

  // Plain objects (Object literals, {}) - avoid prototype chain walk
  if (isPlainObject(obj)) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (iteratee(obj[key], key, obj) === false) {
        break;
      }
    }
    return obj;
  }

  // Maps - native iteration preserves insertion order
  if (isMap(obj)) {
    for (const [key, value] of obj) {
      if (iteratee(value, key, obj) === false) { break; }
    }
    return obj;
  }

  // Iterables: Sets, Strings, TypedArrays, NodeLists
  if (isIterable(obj)) {
    let i = 0;
    for (const value of obj) {
      if (iteratee(value, i++, obj) === false) { break; }
    }
    return obj;
  }

  // Non-iterable array-likes: arguments (pre-ES6), jQuery objects - indexed access
  if (isNumber(obj.length)) {
    // Array-like objects (NodeList, arguments, etc.)
    for (let i = 0; i < obj.length; ++i) {
      if (iteratee(obj[i], i, obj) === false) {
        break;
      }
    }
  }
  else {
    // Non-plain objects: class instances, functions - Object.keys() for enumerable only
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (iteratee(obj[key], key, obj) === false) {
        break;
      }
    }
  }

  return obj;
};

/*-------------------
       Errors
--------------------*/

/*
  Coded errors with a development/production message split. Every message leads
  with one uniform, greppable line — `<namespace> <verb> [<code>] <at>` —
  parseable with /^(\S+) (\S+) \[([\w-]+)\] (.*)$/m. The verb is a stable
  token position carrying the caller's own classification of the line — any
  word, with a nullish verb falling back to `refused`. Production carries the
  line alone; development appends the teaching explanation on its own line, so
  the address prints in every posture and explanations never restate it. The
  explanation is meant to fold out of production builds at the CALLSITE
  (`explanation: isDevelopment ? '...' : 0`): a bundler define folds branches,
  never arguments, so the ternary must live where the string does. Measured on
  a real corpus: deferring explanations behind a helper or thunk reclaimed 37
  bytes of a ~2KB pool; the inline ternary reclaimed all of it.
*/

const errorLine = (namespace, verb, code, at) =>
  `${namespace ? `${namespace} ` : ''}${verb ?? 'refused'} [${code}] ${at}`;

const build = (code, at, { namespace = '', ErrorClass = Error, explanation, detail, verb } = {}) => {
  const line = errorLine(namespace, verb, code, at);
  const built = new ErrorClass(explanation ? `${line}\n${explanation}` : line);
  built.code = code;
  built.at = at;
  if (detail !== undefined) {
    built.detail = detail;
  }
  return built;
};

// report through the error channel and continue — log's sibling for errors.
// the raise is asynchronous so the current call stack completes: it routes to
// globalThis.onError when an app installs one, and falls back to
// console.error otherwise so a report is never silently lost. returns the
// Error it reported. report: false builds and returns without raising — for
// when the error is a value (a rejection, a result) and reporting is the
// consumer's job.
export const error = (code, at, options) => {
  const built = build(code, at, options);
  // open the stack at the caller — captureStackTrace (V8) drops every frame
  // above and including the named function, so each public door captures
  // against itself. engines without it keep the full stack
  Error.captureStackTrace?.(built, error);
  if (options?.report === false) {
    return built;
  }
  const raise = () => {
    if (isFunction(globalThis.onError)) {
      globalThis.onError(built);
      return;
    }
    console.error(built);
  };
  queueMicrotask(raise);
  return built;
};

// the production one-liner alone, for console seats
error.line = (code, at, { namespace = '', verb } = {}) => errorLine(namespace, verb, code, at);

// the throwing form: same arguments, never returns
export const throwError = (code, at, options) => {
  const built = build(code, at, options);
  Error.captureStackTrace?.(built, throwError);
  throw built;
};

// the binder over the pair, mirroring createLogger over log — pre-fills the
// options into every call, callsite options win. the bound forms capture the
// stack against themselves so the wrapper frame folds away too
export const createErrors = (defaults = {}) => {
  const merged = (options) => ({ ...defaults, ...options });
  const bound = (code, at, options) => {
    const built = error(code, at, merged(options));
    Error.captureStackTrace?.(built, bound);
    return built;
  };
  bound.line = (code, at, options) => error.line(code, at, merged(options));
  const boundThrow = (code, at, options) => {
    const built = build(code, at, merged(options));
    Error.captureStackTrace?.(built, boundThrow);
    throw built;
  };
  return {
    error: bound,
    throwError: boundThrow,
  };
};
