// Symbol.for keys survive cross-realm boundaries (bundles, iframes), so
// `instanceof DateTime` works against any realm's class definition. marked pure so a bundle drops
// the brand of a noun it never imports
export const IS_DATE_TIME = /* @__PURE__ */ Symbol.for('native-dates/DateTime');
export const IS_CALENDAR_DATE = /* @__PURE__ */ Symbol.for('native-dates/CalendarDate');
export const IS_TIME = /* @__PURE__ */ Symbol.for('native-dates/Time');
export const IS_DURATION = /* @__PURE__ */ Symbol.for('native-dates/Duration');
export const IS_MONTH_DAY = /* @__PURE__ */ Symbol.for('native-dates/MonthDay');
export const IS_RANGE = /* @__PURE__ */ Symbol.for('native-dates/Range');
export const IS_DATE_RANGE = /* @__PURE__ */ Symbol.for('native-dates/DateRange');
export const IS_DATE_TIME_RANGE = /* @__PURE__ */ Symbol.for('native-dates/DateTimeRange');
export const IS_TIME_RANGE = /* @__PURE__ */ Symbol.for('native-dates/TimeRange');
export const IS_YEAR_MONTH = /* @__PURE__ */ Symbol.for('native-dates/YearMonth');
