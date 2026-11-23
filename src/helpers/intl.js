import { cached } from './utils.js';

import { guard } from './errors.js';

// DateTime passes options.timeZone ?? zone in format.js, while plainDateTimeFormat always pins 'UTC' to match epochOf()
export const zonedDateTimeFormat = cached((locale, options, timeZone) =>
  guard(
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone }),
    'unknownFormat',
    options,
  )
);
export const plainDateTimeFormat = (locale, options) => zonedDateTimeFormat(locale, options, 'UTC');
export const durationFormat = cached((locale, style, hoursDisplay) =>
  new Intl.DurationFormat(locale, { style, hoursDisplay })
);
export const unitFormat = cached((locale, unit, unitDisplay) =>
  new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay })
);
