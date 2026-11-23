/**
 * Structured error codes attached to every `RangeError` or `TypeError` thrown by `native-dates`
 * and `@native-dates/plugins`.
 *
 * @see {@link https://nativedates.dev/guides/parsing/ Parsing}
 */
export type ErrorCode =
  | 'missingDateTime'
  | 'missingDate'
  | 'missingTime'
  | 'missingMonthDay'
  | 'missingYearMonth'
  | 'missingDay'
  | 'missingPoints'
  | 'missingAnchor'
  | 'missingPlugin'
  | 'invalidDateTime'
  | 'invalidDate'
  | 'invalidTime'
  | 'invalidDuration'
  | 'invalidMonthDay'
  | 'invalidYearMonth'
  | 'invalidRange'
  | 'invalidStep'
  | 'invalidNumber'
  | 'invalidFraction'
  | 'invalidYear'
  | 'invalidDay'
  | 'invalidPoint'
  | 'cannotAdd'
  | 'cannotSubtract'
  | 'cannotSet'
  | 'cannotRound'
  | 'cannotBalance'
  | 'cannotTotal'
  | 'unknownZone'
  | 'unknownLocale'
  | 'unknownDisambiguation'
  | 'unknownUnit'
  | 'unknownDayOfWeek'
  | 'unknownFormat'
  | 'unknownKind'
  | 'unknownSetting'
  | 'unknownWidth'
  | 'unsupportedUnit'
  | 'unsupportedToken'
  | 'unsupportedComparison'
  | 'unsupportedZone'
  | 'unsupportedCalendar'
  | 'unsupportedIntersection'
  | 'conflictingSigns'
  | 'conflictingKinds'
  | 'conflictingRanges'
  | 'immutable';

/**
 * Structured refusal error (`RangeError` or `TypeError`) thrown by `native-dates` with machine-readable
 * `code` and `at` properties.
 */
export interface NativeDatesError extends Error {
  /** Machine-readable refusal code stable across development and production builds. */
  readonly code: ErrorCode;
  /** Stringified offending input or operation context. */
  readonly at: string;
}
