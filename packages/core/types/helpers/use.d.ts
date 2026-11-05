import type { Plugin } from '../inputs.js';

type PluginEntry<Options = any> = Plugin<Options> | { default: Plugin<Options>; };

/** Installs a plugin with options: `use(zones, { hq: 'Berlin' })` */
export function use<Options extends Record<string, unknown>>(plugin: PluginEntry<Options>, options: Options): void;
/** Installs one or more plugins idempotently: `use(ranges, tokens)` or `use([ranges, tokens])` */
export function use(...plugins: PluginEntry[] | [PluginEntry[]]): void;
