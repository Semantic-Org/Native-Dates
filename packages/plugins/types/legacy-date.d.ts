import type { Locale } from 'native-dates';

declare module 'native-dates' {
  interface DateTime {
    getTime(): number;
    getFullYear(): number;
    getMonth(): number;
    getDate(): number;
    getDay(): number;
    getHours(): number;
    getMinutes(): number;
    getSeconds(): number;
    getMilliseconds(): number;
    getTimezoneOffset(): number;
    getUTCFullYear(): number;
    getUTCMonth(): number;
    getUTCDate(): number;
    getUTCDay(): number;
    getUTCHours(): number;
    getUTCMinutes(): number;
    getUTCSeconds(): number;
    getUTCMilliseconds(): number;
    toISOString(): string;
    toLocaleString(locales?: Locale, options?: Intl.DateTimeFormatOptions): string;
    toLocaleDateString(locales?: Locale, options?: Intl.DateTimeFormatOptions): string;
    toLocaleTimeString(locales?: Locale, options?: Intl.DateTimeFormatOptions): string;

    setTime(value: number): never;
    setFullYear(year: number, month?: number, date?: number): never;
    setMonth(month: number, date?: number): never;
    setDate(date: number): never;
    setHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): never;
    setMinutes(minutes: number, seconds?: number, milliseconds?: number): never;
    setSeconds(seconds: number, milliseconds?: number): never;
    setMilliseconds(milliseconds: number): never;
    setUTCFullYear(year: number, month?: number, date?: number): never;
    setUTCMonth(month: number, date?: number): never;
    setUTCDate(date: number): never;
    setUTCHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): never;
    setUTCMinutes(minutes: number, seconds?: number, milliseconds?: number): never;
    setUTCSeconds(seconds: number, milliseconds?: number): never;
    setUTCMilliseconds(milliseconds: number): never;
  }
}
