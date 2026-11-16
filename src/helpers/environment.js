// alone in its file, with no imports and no optional chaining, so a bundler folds process.env.NODE_ENV
// into every module that reads it and the explanations drop out of a production build
export const isDevelopment = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
