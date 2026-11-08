import { CalendarDate, today } from '../calendar-date.js';
import { DateTime, now } from '../date-time.js';
import { cached } from '../helpers/intl.js';
import { locale as pickLocale } from '../helpers/zones.js';

const relativeTimeFormat = cached((locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }));

const minuteSeconds = 60;
const hourSeconds = 3600;
const daySeconds = 86400;
const monthSeconds = 30.436875 * daySeconds;
const yearSeconds = 365.2425 * daySeconds;

// thresholds: 44 seconds is seconds, 44 minutes is minutes, 21 hours is hours, 25 days is days
const pickUnit = (seconds) => {
  const size = Math.abs(seconds);
  if (size < 45) {
    return ['second', 1];
  }
  if (size < 45 * minuteSeconds) {
    return ['minute', minuteSeconds];
  }
  if (size < 22 * hourSeconds) {
    return ['hour', hourSeconds];
  }
  if (size < 26 * daySeconds) {
    return ['day', daySeconds];
  }
  if (size < 320 * daySeconds) {
    return ['month', monthSeconds];
  }
  return ['year', yearSeconds];
};

export const relativeSeconds = (seconds, locale) => {
  const [name, size] = pickUnit(seconds);
  const value = Math.round(seconds / size);
  return relativeTimeFormat(pickLocale(locale)).format(value, name);
};

// Intl supplies yesterday and tomorrow
export const relativeDays = (days, locale) => {
  const size = Math.abs(days);
  const [name, value] = size < 7
    ? ['day', days]
    : size < 26
    ? ['week', Math.round(days / 7)]
    : size < 320
    ? ['month', Math.round(days / 30.436875)]
    : ['year', Math.round(days / 365.2425)];
  return relativeTimeFormat(pickLocale(locale)).format(value, name);
};

DateTime.prototype.formatRelative = function formatRelative(to, locale) {
  const reference = to === undefined ? now(this.zone) : new DateTime(to, this.zone);
  return relativeSeconds((this.epoch - reference.epoch) / 1000, locale);
};
CalendarDate.prototype.formatRelative = function formatRelative(to, locale) {
  const reference = to === undefined ? today() : new CalendarDate(to);
  return relativeDays(reference.until(this, 'day'), locale);
};
