/**
 * How to format: a preset (`'short'`, `'medium'`, `'long'`, `'full'`, `'month'`, and for a datetime
 * `'date'`, `'time'` or `'text'`), the names moment and day.js use (`'LT'` through `'LLLL'`), an
 * `Intl.DateTimeFormat` options bag, or a token pattern like `'YYYY-MM-DD'`. A letter in a pattern that
 * is no token refuses, so text goes in brackets: `'MMM D [at] h:mm a'`
 */
export type FormatSpec =
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'month'
  | 'date'
  | 'time'
  | 'text'
  | 'LT'
  | 'LTS'
  | 'L'
  | 'l'
  | 'LL'
  | 'll'
  | 'LLL'
  | 'lll'
  | 'LLLL'
  | 'llll'
  | Intl.DateTimeFormatOptions
  | (string & {});
