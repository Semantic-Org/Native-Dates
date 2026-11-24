import { cached } from './utils.js';

import { guard } from './errors.js';

// DateTime passes options.timeZone ?? zone in format.js, while plainDateTimeFormat uses 'UTC' to match epochOf()
export const zonedDateTimeFormat = cached((locale, options, timeZone) =>
  guard(
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone }),
    'unknownFormat',
    options,
  )
);
export const plainDateTimeFormat = cached((locale, options) =>
  guard(
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }),
    'unknownFormat',
    options,
  )
);
export const durationFormat = cached((locale, style) =>
  new Intl.DurationFormat(locale, { style, hoursDisplay: 'auto' })
);
export const unitFormat = cached((locale, unit, unitDisplay) =>
  new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay })
);
