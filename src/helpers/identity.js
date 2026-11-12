// Symbol.for keys survive cross-realm boundaries (bundles, iframes), so
// `instanceof DateTime` works against any realm's class definition
export const IS_DATE_TIME = Symbol.for('native-dates/DateTime');
export const IS_CALENDAR_DATE = Symbol.for('native-dates/CalendarDate');
export const IS_TIME = Symbol.for('native-dates/Time');
export const IS_DURATION = Symbol.for('native-dates/Duration');
export const IS_MONTH_DAY = Symbol.for('native-dates/MonthDay');
export const IS_RANGE = Symbol.for('native-dates/Range');
export const IS_DATE_RANGE = Symbol.for('native-dates/DateRange');
export const IS_DATE_TIME_RANGE = Symbol.for('native-dates/DateTimeRange');
export const IS_TIME_RANGE = Symbol.for('native-dates/TimeRange');
