// isolated with plain member access (never optional chaining) so bundlers inline `process.env.NODE_ENV`
// and dead-code-eliminate dev error explanations from production builds. the check is repeated last so
// webpack can fold the flag into files it could not merge with this one, i.e. a lazy route
export const isDevelopment = !!((typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false)
  && process.env.NODE_ENV !== 'production');
