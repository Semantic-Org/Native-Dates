// isolated with plain member access (never optional chaining) so bundlers inline `process.env.NODE_ENV`
// and dead-code-eliminate dev error explanations from production builds
export const isDevelopment = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
