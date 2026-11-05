import type { Plugin } from '../inputs.js';

/** Installs one or more plugins idempotently: `use(ranges, tokens)` or `use([ranges, tokens])` */
export function use(...plugins: (Plugin | { default: Plugin; })[] | [(Plugin | { default: Plugin; })[]]): void;
