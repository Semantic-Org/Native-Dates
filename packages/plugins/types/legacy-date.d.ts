import type { Locale } from 'native-dates';

declare module 'native-dates' {
  interface DateTime {
    /**
     * Returns milliseconds since the Unix epoch, identical to `epochMilliseconds`.
     *
     * @returns Milliseconds since the Unix epoch
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getTime(): number;

    /**
     * Returns the four-digit calendar year evaluated in `this.zone`.
     *
     * @returns Four-digit year in `this.zone`
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/legacy-date';
     * import { datetime } from 'native-dates';
     *
     * datetime('2026-09-06T14:30', 'America/New_York').getFullYear(); // 2026
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getFullYear(): number;

    /**
     * Returns the zero-based month from 0 for January through 11 for December in `this.zone`,
     * matching native `Date` numbering. Read `this.month` for 1-indexed months.
     *
     * @returns Zero-based month from 0 through 11 in `this.zone`
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getMonth(): number;

    /**
     * Returns the day of the month from 1 through 31 in `this.zone`.
     *
     * @returns Day of the month from 1 through 31 in `this.zone`
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getDate(): number;

    /**
     * Returns the day of the week from 0 for Sunday through 6 for Saturday in `this.zone`,
     * matching native `Date` numbering. Read `this.dayOfWeek` for ISO numbering from Monday.
     *
     * @returns Day of the week from 0 through 6 in `this.zone`
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getDay(): number;

    /**
     * Returns the 24-hour clock hour from 0 through 23 in `this.zone` rather than the host OS zone.
     *
     * @returns Clock hour from 0 through 23 in `this.zone`
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getHours(): number;

    /**
     * Returns the clock minute from 0 through 59 in `this.zone`.
     *
     * @returns Clock minute from 0 through 59 in `this.zone`
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getMinutes(): number;

    /**
     * Returns the clock second from 0 through 59 in `this.zone`.
     *
     * @returns Clock second from 0 through 59 in `this.zone`
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getSeconds(): number;

    /**
     * Returns the millisecond from 0 through 999 in `this.zone`.
     *
     * @returns Millisecond from 0 through 999 in `this.zone`
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getMilliseconds(): number;

    /**
     * Returns the UTC offset in minutes west of UTC for `this.zone`, such as 240 for `'-04:00'`
     * or -330 for `'+05:30'`.
     *
     * @returns Offset in minutes west of UTC for `this.zone`
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/legacy-date';
     * import { datetime } from 'native-dates';
     *
     * datetime('2026-01-06T09:00', 'Asia/Kolkata').getTimezoneOffset(); // -330
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getTimezoneOffset(): number;

    /**
     * Returns the four-digit calendar year in UTC.
     *
     * @returns Four-digit year in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCFullYear(): number;

    /**
     * Returns the zero-based month from 0 for January through 11 for December in UTC.
     *
     * @returns Zero-based month from 0 through 11 in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCMonth(): number;

    /**
     * Returns the day of the month from 1 through 31 in UTC.
     *
     * @returns Day of the month from 1 through 31 in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCDate(): number;

    /**
     * Returns the day of the week from 0 for Sunday through 6 for Saturday in UTC.
     *
     * @returns Day of the week from 0 through 6 in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCDay(): number;

    /**
     * Returns the 24-hour clock hour from 0 through 23 in UTC.
     *
     * @returns Clock hour from 0 through 23 in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCHours(): number;

    /**
     * Returns the clock minute from 0 through 59 in UTC.
     *
     * @returns Clock minute from 0 through 59 in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCMinutes(): number;

    /**
     * Returns the clock second from 0 through 59 in UTC.
     *
     * @returns Clock second from 0 through 59 in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCSeconds(): number;

    /**
     * Returns the millisecond from 0 through 999 in UTC.
     *
     * @returns Millisecond from 0 through 999 in UTC
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#zone-aware-and-utc-getters Zone-aware and UTC getters}
     */
    getUTCMilliseconds(): number;

    /**
     * Returns the UTC ISO 8601 timestamp at millisecond precision, matching `Date.prototype.toISOString()`.
     *
     * @returns Millisecond-precision UTC ISO 8601 timestamp
     *
     * @example
     * ```ts
     * import '@native-dates/plugins/legacy-date';
     * import { datetime } from 'native-dates';
     *
     * datetime('2026-09-06T14:30:15.250', 'America/New_York').toISOString(); // '2026-09-06T18:30:15.250Z'
     * ```
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#string-and-locale-methods String and locale methods}
     */
    toISOString(): string;

    /**
     * Formats the date and time in `this.zone` and `this.locale()` unless overridden in arguments.
     *
     * @param locales - Optional BCP 47 locale tag overriding `this.locale()`
     * @param options - `Intl.DateTimeFormatOptions` defaulting the zone to `this.zone`
     * @returns Locale-formatted date and time string
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#string-and-locale-methods String and locale methods}
     */
    toLocaleString(locales?: Locale, options?: Intl.DateTimeFormatOptions): string;

    /**
     * Formats the date portion in `this.zone` and `this.locale()` unless overridden in arguments.
     *
     * @param locales - Optional BCP 47 locale tag overriding `this.locale()`
     * @param options - `Intl.DateTimeFormatOptions` defaulting the zone to `this.zone`
     * @returns Locale-formatted date string
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#string-and-locale-methods String and locale methods}
     */
    toLocaleDateString(locales?: Locale, options?: Intl.DateTimeFormatOptions): string;

    /**
     * Formats the time portion in `this.zone` and `this.locale()` unless overridden in arguments.
     *
     * @param locales - Optional BCP 47 locale tag overriding `this.locale()`
     * @param options - `Intl.DateTimeFormatOptions` defaulting the zone to `this.zone`
     * @returns Locale-formatted time string
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#string-and-locale-methods String and locale methods}
     */
    toLocaleTimeString(locales?: Locale, options?: Intl.DateTimeFormatOptions): string;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Pass epoch milliseconds to `datetime()` instead.
     *
     * @param value - Epoch milliseconds
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setTime(value: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Replace local fields with `set()` to return a new instance.
     *
     * @param year - Calendar year
     * @param month - Zero-based month
     * @param date - Day of the month
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setFullYear(year: number, month?: number, date?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Replace 1-indexed months with `set()` to return a new instance.
     *
     * @param month - Zero-based month
     * @param date - Day of the month
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setMonth(month: number, date?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Replace the day of the month with `set()` to return a new instance.
     *
     * @param date - Day of the month
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setDate(date: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Replace clock fields with `set()` to return a new instance.
     *
     * @param hours - Clock hour
     * @param minutes - Clock minute
     * @param seconds - Clock second
     * @param milliseconds - Millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Replace the minute with `set()` to return a new instance.
     *
     * @param minutes - Clock minute
     * @param seconds - Clock second
     * @param milliseconds - Millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setMinutes(minutes: number, seconds?: number, milliseconds?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Replace the second with `set()` to return a new instance.
     *
     * @param seconds - Clock second
     * @param milliseconds - Millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setSeconds(seconds: number, milliseconds?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Replace the millisecond with `set()` to return a new instance.
     *
     * @param milliseconds - Millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setMilliseconds(milliseconds: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Switch to UTC first with `in('UTC').set()`.
     *
     * @param year - UTC year
     * @param month - Zero-based UTC month
     * @param date - UTC day of the month
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setUTCFullYear(year: number, month?: number, date?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Switch to UTC first with `in('UTC').set()`, passing a 1-indexed month.
     *
     * @param month - Zero-based UTC month
     * @param date - UTC day of the month
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setUTCMonth(month: number, date?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Switch to UTC first with `in('UTC').set()`.
     *
     * @param date - UTC day of the month
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setUTCDate(date: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Switch to UTC first with `in('UTC').set()`.
     *
     * @param hours - UTC hour
     * @param minutes - UTC minute
     * @param seconds - UTC second
     * @param milliseconds - UTC millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setUTCHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Switch to UTC first with `in('UTC').set()`.
     *
     * @param minutes - UTC minute
     * @param seconds - UTC second
     * @param milliseconds - UTC millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setUTCMinutes(minutes: number, seconds?: number, milliseconds?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Switch to UTC first with `in('UTC').set()`.
     *
     * @param seconds - UTC second
     * @param milliseconds - UTC millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setUTCSeconds(seconds: number, milliseconds?: number): never;

    /**
     * Throws a `RangeError` (`code: 'immutable'`) because `DateTime` instances cannot be mutated in place.
     * Switch to UTC first with `in('UTC').set()`.
     *
     * @param milliseconds - UTC millisecond
     *
     * @see {@link https://nativedates.dev/plugins/legacy-date/#setters-throw-on-mutation Setters throw on mutation}
     */
    setUTCMilliseconds(milliseconds: number): never;
  }
}
