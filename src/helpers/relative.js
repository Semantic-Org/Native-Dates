import { cached } from './utils.js';
import { locale as pickLocale } from './zones.js';

// elapsed seconds use numeric: 'always' ('1 day ago') because 'yesterday' can be wrong 22h before 11pm.
// Use numeric: 'auto' only for 0 ('now') and whole-day CalendarDate diffs ('yesterday', 'tomorrow')
const relativeTimeFormat = cached((locale, numeric) => new Intl.RelativeTimeFormat(locale, { numeric }));

const format = (value, name, locale, auto) =>
  relativeTimeFormat(pickLocale(locale), auto ? 'auto' : 'always').format(value, name);

// JS Math.round(-1.5) rounds toward +Infinity (-1), so round magnitude first for symmetric past/future output
const formatScaled = (amount, size, step, name, locale) => {
  const value = Math.sign(amount) * Math.round(size / step);
  return format(value, name, locale, !value);
};

export const relativeDays = (days, locale) => {
  const size = Math.abs(days);
  return size < 7
    ? format(days, 'day', locale, true)
    : formatScaled(
      days,
      size,
      size < 26 ? 7 : size < 320 ? 30.436875 : 365.2425,
      size < 26 ? 'week' : size < 320 ? 'month' : 'year',
      locale,
    );
};

// Moment / Day.js relative-time cutoffs (45s, 45m, 22h, 26d, 320d)
export const relativeSeconds = (seconds, locale) => {
  const size = Math.abs(seconds);
  return size >= 26 * 86400
    ? relativeDays(seconds / 86400, locale)
    : formatScaled(
      seconds,
      size,
      size < 45 ? 1 : size < 2700 ? 60 : size < 79200 ? 3600 : 86400,
      size < 45 ? 'second' : size < 2700 ? 'minute' : size < 79200 ? 'hour' : 'day',
      locale,
    );
};
