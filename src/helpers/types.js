// leads the file without optional chaining so bundlers fold process.env.NODE_ENV across modules
export const isDevelopment = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;

const toString = Object.prototype.toString;

export const isObject = (value) => value !== null && typeof value === 'object';

export const isPlainObject = (value) => {
  if (!isObject(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

export const isString = (value) => typeof value === 'string';
export const isNumber = (value) => typeof value === 'number';
export const isFunction = (value) => typeof value === 'function';
export const isArray = Array.isArray;
export const isDate = (value) => toString.call(value) === '[object Date]';
