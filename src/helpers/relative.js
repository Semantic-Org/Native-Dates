import { cached } from './intl.js';
import { locale as pickLocale } from './zones.js';

// elapsed seconds use numeric: 'always' ('1 day ago') because 'yesterday' can be wrong 22h before 11pm.
// Use numeric: 'auto' only for 0 ('now') and whole-day CalendarDate diffs ('yesterday', 'tomorrow')
const relativeTimeFormat = cached((locale, numeric) => new Intl.RelativeTimeFormat(locale, { numeric }));

const minuteSeconds = 60;
const hourSeconds = 3600;
const daySeconds = 86400;
const monthSeconds = 30.436875 * daySeconds;
const yearSeconds = 365.2425 * daySeconds;

// Moment / Day.js relative-time cutoffs (45s, 45m, 22h, 26d, 320d)
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

// JS Math.round(-1.5) rounds toward +Infinity (-1), so round magnitude first for symmetric past/future output
const roundAway = (value) => Math.sign(value) * Math.round(Math.abs(value));

export const relativeSeconds = (seconds, locale) => {
  const [name, size] = pickUnit(seconds);
  const value = roundAway(seconds / size);
  return relativeTimeFormat(pickLocale(locale), value === 0 ? 'auto' : 'always').format(value, name);
};

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
