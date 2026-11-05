import { CalendarDate } from '../calendar-date.js';
import { DateTime } from '../date-time.js';
import { Duration } from '../duration.js';
import { Time } from '../time.js';
import { refuseType } from './errors.js';
import { isArray, isDevelopment, isFunction, isPlainObject } from './types.js';

const install = (entry, options, classes) => {
  const plugin = entry?.default ?? entry;
  if (!isFunction(plugin)) {
    refuseType('notAPlugin', String(plugin), {
      explanation: isDevelopment ? 'use() takes plugin imports from @native-dates/core/plugins/*' : 0,
    });
  }
  // the plugin carries its own mark, as day.js and nav-router mark one
  if (!plugin.installed) {
    plugin.installed = true;
    plugin(options, classes);
  }
};

// installs a plugin with options, use(zones, { hq: 'Berlin' }), or a list of plugins, use(ranges, tokens)
export const use = (...args) => {
  const classes = { DateTime, CalendarDate, Time, Duration };
  if (args.length === 2 && isPlainObject(args[1])) {
    install(args[0], args[1], classes);
    return;
  }
  const list = args.length === 1 && isArray(args[0]) ? args[0] : args;
  for (const entry of list) {
    install(entry, undefined, classes);
  }
};
