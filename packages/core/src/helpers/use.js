import { CalendarDate } from '../calendar-date.js';
import { DateTime } from '../date-time.js';
import { Duration } from '../duration.js';
import { Time } from '../time.js';
import { refuseType } from './errors.js';
import { isArray, isDevelopment, isFunction } from './types.js';

const installed = new WeakSet();

// installs one or more plugins idempotently: use(ranges, tokens) or use([ranges, tokens])
export const use = (...plugins) => {
  const list = plugins.length === 1 && isArray(plugins[0]) ? plugins[0] : plugins;
  const classes = { DateTime, CalendarDate, Time, Duration };
  for (const entry of list) {
    const plugin = entry?.default ?? entry;
    if (!isFunction(plugin)) {
      refuseType('notAPlugin', String(plugin), {
        explanation: isDevelopment ? 'use() takes plugin imports from @native-dates/core/plugins/*' : 0,
      });
    }
    if (!installed.has(plugin)) {
      installed.add(plugin);
      plugin(classes);
    }
  }
};
