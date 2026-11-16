import { cached } from './intl.js';
import { locale as pickLocale } from './zones.js';

// 'auto' lets Intl say 'yesterday' and 'last month', which are claims about the calendar. a rounded
// length of time cannot make them: 22 hours ago can be earlier today, and 26 days ago the same month.
// so a phrase counts, '1 day ago', except where the calendar is what was measured
const relativeTimeFormat = cached((locale, numeric) => new Intl.RelativeTimeFormat(locale, { numeric }));

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
  // nothing apart is 'now', never 'in 0 seconds'
  return relativeTimeFormat(pickLocale(locale), value === 0 ? 'auto' : 'always').format(value, name);
};

// whole calendar days, so Intl supplies today, yesterday and tomorrow. weeks and up are counted
export const relativeDays = (days, locale) => {
  const size = Math.abs(days);
  const [name, value] = size < 7
    ? ['day', days]
    : size < 26
    ? ['week', roundAway(days / 7)]
    : size < 320
    ? ['month', roundAway(days * daySeconds / monthSeconds)]
    : ['year', roundAway(days * daySeconds / yearSeconds)];
  return relativeTimeFormat(pickLocale(locale), name === 'day' ? 'auto' : 'always').format(value, name);
};
