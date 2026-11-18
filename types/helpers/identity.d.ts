/**
 * Global brand symbol `Symbol.for('native-dates/DateTime')`, matching any `DateTime` instance
 * across realms and duplicate bundles.
 *
 * @example
 * ```ts
 * import { IS_DATE_TIME, now } from 'native-dates';
 *
 * Boolean(now()[IS_DATE_TIME]); // true
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_DATE_TIME: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/CalendarDate')`, matching any `CalendarDate`
 * instance across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_CALENDAR_DATE: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/Time')`, matching any `Time` instance
 * across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_TIME: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/Duration')`, matching any `Duration` instance
 * across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_DURATION: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/MonthDay')`, matching any `MonthDay` instance
 * across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_MONTH_DAY: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/Range')` shared across all range classes,
 * matching any range instance across realms and duplicate bundles.
 *
 * @example
 * ```ts
 * import { IS_RANGE, timeRange } from 'native-dates';
 *
 * Boolean(timeRange('9am', '5pm')[IS_RANGE]); // true
 * ```
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_RANGE: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/DateRange')`, matching any `DateRange`
 * instance across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_DATE_RANGE: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/DateTimeRange')`, matching any `DateTimeRange`
 * instance across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_DATE_TIME_RANGE: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/TimeRange')`, matching any `TimeRange`
 * instance across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_TIME_RANGE: unique symbol;

/**
 * Global brand symbol `Symbol.for('native-dates/YearMonth')`, matching any `YearMonth`
 * instance across realms and duplicate bundles.
 *
 * @see {@link https://nativedates.dev/api/kind-of/#cross-realm-instanceof-and-brands Cross-realm instanceof and brands}
 */
export const IS_YEAR_MONTH: unique symbol;
