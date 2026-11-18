import { DateTime } from 'native-dates';
import { isDevelopment } from 'native-dates/helpers/environment';
import { refuse } from 'native-dates/helpers/errors';
import { each } from 'native-dates/helpers/utils';

// attaches Date.prototype read methods onto DateTime for callers expecting a JS Date.
// Local getters (getHours, getDay, getTimezoneOffset) read in this.zone rather than the host machine's zone,
// preserving Date's 0-indexed months, Sunday = 0, and positive-west-of-UTC offset sign

const reads = {
  getTime() {
    return this.epochMilliseconds;
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
    return this.dayOfWeek % 7;
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
  // match Date's fixed .sssZ format (DateTime.toString() expands to 6 or 9 digits for sub-ms values)
  toISOString() {
    return this.toJSDate().toISOString();
  },
  toLocaleString(locales = this.locale(), options) {
    return this.toJSDate().toLocaleString(locales, { timeZone: this.zone, ...options });
  },
  toLocaleDateString(locales = this.locale(), options) {
    return this.toJSDate().toLocaleDateString(locales, { timeZone: this.zone, ...options });
  },
  toLocaleTimeString(locales = this.locale(), options) {
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
each(setters, (name) => {
  proto[name] = function refuseSetter() {
    return refuse('immutable', name, {
      explanation: isDevelopment
        ? "a `DateTime` is immutable and cannot be modified in place. Return a new instance with `.set('hour', 9)` or `.plus(1, 'day')` instead"
        : 0,
    });
  };
});
