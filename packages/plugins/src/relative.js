import { CalendarDate, DateTime, now, today } from 'native-dates';
import { cached } from 'native-dates/helpers/intl';
import { locale as pickLocale } from 'native-dates/helpers/zones';

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

// Math.round sends a negative half toward zero, so the past rounds as the future does
const roundAway = (value) => Math.sign(value) * Math.round(Math.abs(value));

export const relativeSeconds = (seconds, locale) => {
  const [name, size] = pickUnit(seconds);
  const value = roundAway(seconds / size);
  return relativeTimeFormat(pickLocale(locale)).format(value, name);
};

// Intl supplies yesterday and tomorrow
export const relativeDays = (days, locale) => {
  const size = Math.abs(days);
  const [name, value] = size < 7
    ? ['day', days]
    : size < 26
    ? ['week', roundAway(days / 7)]
    : size < 320
    ? ['month', roundAway(days / 30.436875)]
    : ['year', roundAway(days / 365.2425)];
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
