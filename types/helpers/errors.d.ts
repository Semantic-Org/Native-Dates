/**
 * Structured error codes attached to every `RangeError` or `TypeError` thrown by `native-dates`
 * and `@native-dates/plugins`.
 *
 * @see {@link https://nativedates.dev/api/errors/ Errors}
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
  | 'missingTemporal'
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
  | 'invalidZoneAliases'
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
  | 'unsupportedUnion'
  | 'conflictingSigns'
  | 'conflictingKinds'
  | 'conflictingRanges'
  | 'immutable';

/**
 * Structured refusal error (`RangeError` or `TypeError`) thrown by `native-dates` and
 * `@native-dates/plugins` with machine-readable `code` and `at` properties.
 *
 * @see {@link https://nativedates.dev/api/errors/ Errors}
 */
export interface NativeDatesError extends Error {
  /** Machine-readable refusal code stable across development and production builds. */
  readonly code: ErrorCode;
  /** Stringified offending input or operation context. */
  readonly at: string;
}
