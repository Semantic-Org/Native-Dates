// the helpers this library shares by name with @semantic-ui/utils, cut down to what it reaches so
// it installs nothing. a word for word copy was tried first, in the hope that an app shipping both
// would compress the second copy away. measured, that saved the app 61 bytes, where the branches
// nothing here calls cost every other reader 300. the names and the error line stay the same as
// utils, so a refusal reads here as it does in any semantic ui package

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

export const isDate = (x) => Object.prototype.toString.call(x) === '[object Date]';

// a list by index or an object by key, and nothing at all for null or undefined. no loop here
// stops early or walks a Map, so those branches of the original stayed behind
export const each = (obj, func) => {
  if (isArray(obj)) {
    obj.forEach(func);
  }
  else if (obj != null) {
    Object.keys(obj).forEach((key) => func(obj[key], key, obj));
  }
  return obj;
};

// a coded error whose first line is always `<namespace> refused [<code>] <at>`, with the code and the
// input on the error. the explanation is meant to fold out of production at the callsite,
// `explanation: isDevelopment ? '...' : 0`, since a bundler folds branches and never arguments
export const createErrors = ({ namespace, ErrorClass }) => {
  const throwError = (code, at, { explanation } = {}) => {
    const line = `${namespace} refused [${code}] ${at}`;
    const built = new ErrorClass(explanation ? `${line}\n${explanation}` : line);
    built.code = code;
    built.at = at;
    // open the stack at the caller, so the frame that builds the error folds away
    Error.captureStackTrace?.(built, throwError);
    throw built;
  };
  return { throwError };
};
