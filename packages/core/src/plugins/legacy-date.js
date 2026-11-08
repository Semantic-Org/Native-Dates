import { DateTime } from '../date-time.js';
import { refuse } from '../helpers/errors.js';
import { isDevelopment } from '../helpers/types.js';

// what a Date caller reads, with Date's own conventions kept: a month from 0, sunday as 0,
// the offset in minutes west of UTC. so code that never heard of Temporal keeps working on a
// DateTime, and the local family answers in the value's zone rather than the machine's

const reads = {
  getTime() {
    return this.epoch;
  },
  getFullYear() {
    return this.year;
  },
  getMonth() {
    return this.month - 1;
  },
  getDate() {
    return this.day;
  },
  getDay() {
    return this.weekday % 7;
  },
  getHours() {
    return this.hour;
  },
  getMinutes() {
    return this.minute;
  },
  getSeconds() {
    return this.second;
  },
  getMilliseconds() {
    return this.millisecond;
  },
  getTimezoneOffset() {
    return -this.toTemporal().offsetNanoseconds / 60_000_000_000;
  },
  getUTCFullYear() {
    return this.toJSDate().getUTCFullYear();
  },
  getUTCMonth() {
    return this.toJSDate().getUTCMonth();
  },
  getUTCDate() {
    return this.toJSDate().getUTCDate();
  },
  getUTCDay() {
    return this.toJSDate().getUTCDay();
  },
  getUTCHours() {
    return this.toJSDate().getUTCHours();
  },
  getUTCMinutes() {
    return this.toJSDate().getUTCMinutes();
  },
  getUTCSeconds() {
    return this.toJSDate().getUTCSeconds();
  },
  getUTCMilliseconds() {
    return this.toJSDate().getUTCMilliseconds();
  },
  // Date's millisecond form, where toString() keeps the finer digits a value has
  toISOString() {
    return this.toJSDate().toISOString();
  },
  toLocaleString(locales, options) {
    return this.toJSDate().toLocaleString(locales, { timeZone: this.zone, ...options });
  },
  toLocaleDateString(locales, options) {
    return this.toJSDate().toLocaleDateString(locales, { timeZone: this.zone, ...options });
  },
  toLocaleTimeString(locales, options) {
    return this.toJSDate().toLocaleTimeString(locales, { timeZone: this.zone, ...options });
  },
};

const setters = [
  'setTime',
  'setFullYear',
  'setMonth',
  'setDate',
  'setHours',
  'setMinutes',
  'setSeconds',
  'setMilliseconds',
  'setUTCFullYear',
  'setUTCMonth',
  'setUTCDate',
  'setUTCHours',
  'setUTCMinutes',
  'setUTCSeconds',
  'setUTCMilliseconds',
];

const proto = DateTime.prototype;
Object.assign(proto, reads);
// a DateTime never changes in place, so every setter a Date has refuses and names the way
for (const name of setters) {
  proto[name] = function refuseSetter() {
    return refuse('immutable', name, {
      explanation: isDevelopment
        ? "a DateTime does not change in place. set('hour', 9) or plus(1, 'day') gives a new value"
        : 0,
    });
  };
}
