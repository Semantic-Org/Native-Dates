import { cached } from './utils.js';
import { locale as pickLocale } from './zones.js';

// elapsed seconds use numeric: 'always' ('1 day ago') because 'yesterday' can be wrong 22h before 11pm.
// Use numeric: 'auto' only for 0 ('now') and whole-day CalendarDate diffs ('yesterday', 'tomorrow')
const relativeTimeFormat = cached((locale, numeric) => new Intl.RelativeTimeFormat(locale, { numeric }));

// JS Math.round(-1.5) rounds toward +Infinity (-1), so round magnitude first for symmetric past/future output
const roundAway = (value) => Math.sign(value) * Math.round(Math.abs(value));

const format = (value, name, auto, locale) =>
  relativeTimeFormat(pickLocale(locale), auto ? 'auto' : 'always').format(value, name);

export const relativeDays = (days, locale) => {
  const size = Math.abs(days);
  if (size < 7) {
    return format(days, 'day', true, locale);
  }
  const value = roundAway(days / (size < 26 ? 7 : size < 320 ? 30.436875 : 365.2425));
  return format(value, size < 26 ? 'week' : size < 320 ? 'month' : 'year', false, locale);
};

// Moment / Day.js relative-time cutoffs (45s, 45m, 22h, 26d, 320d)
export const relativeSeconds = (seconds, locale) => {
  const size = Math.abs(seconds);
  if (size >= 26 * 86400) {
    return relativeDays(seconds / 86400, locale);
  }
  const step = size < 45 ? 1 : size < 45 * 60 ? 60 : size < 22 * 3600 ? 3600 : 86400;
  const name = size < 45 ? 'second' : size < 45 * 60 ? 'minute' : size < 22 * 3600 ? 'hour' : 'day';
  const value = roundAway(seconds / step);
  return format(value, name, !value, locale);
};
