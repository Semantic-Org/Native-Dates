// plain member access (never optional chaining) lets bundlers inline `process.env.NODE_ENV` and strip dev prose.
// Repeating `process.env.NODE_ENV` outside the `typeof` guard lets webpack fold the flag across split chunks
export const isDevelopment = !!((typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false)
  && process.env.NODE_ENV !== 'production');
