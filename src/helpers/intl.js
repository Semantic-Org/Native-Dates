import { cached } from './utils.js';

import { guard } from './errors.js';

// DateTime lets a defined options.timeZone override its zone, while plain dates and times pin 'UTC' to match epochOf()
export const zonedDateTimeFormat = cached((locale, options, zone) =>
  guard(
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone: options.timeZone ?? zone }),
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
