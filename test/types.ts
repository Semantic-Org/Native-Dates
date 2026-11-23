import '@native-dates/plugins/legacy-date';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime as coreDatetime } from '@native-dates/core';
import { looseZoned } from '@native-dates/plugins/loose';
import { timezones } from '@native-dates/plugins/zones';
import {
  type ActiveSettings,
  CalendarDate,
  compare,
  configure,
  date,
  type DateRange,
  dateRange,
  DateTime,
  datetime,
  type DateTimeRange,
  dayOfWeek,
  type Duration,
  earliest,
  type ErrorCode,
  type FormatSpec,
  hours,
  IS_DATE_TIME,
  IS_RANGE,
  isDateTime,
  kindOf,
  type MonthDay,
  monthDay,
  monthNames,
  monthYear,
  type NativeDatesError,
  now,
  type Range,
  type ReadOptions,
  type Settings,
  type Time,
  time,
  type TimeRange,
  today,
  type Unit,
  weekdayNames,
  type YearMonth,
  yearMonth,
  type Zone,
} from 'native-dates';

const zone: Zone = 'America/New_York';
const options: ReadOptions = { zone, locale: 'en-US' };
const meeting: DateTime = datetime('2026-09-06T14:30', zone);
const viaCore: DateTime = coreDatetime('2026-09-06T14:30Z', options);
const due: CalendarDate = date(2026, 9, 6);
const opening: Time = time('9am');
const unit: Unit = 'hours';
const spec: FormatSpec = { dateStyle: 'long' };

export const chained: DateTime = today().plus(2, 'days').at('9am').in('Europe/Berlin');
export const constructed: CalendarDate = new CalendarDate('2026-09-06', options).endOf('month');
export const shifted: DateTime = new DateTime(Date.now(), zone).minus(hours(3)).startOf('week', 'sunday');
export const nextQuarter: CalendarDate = due.startOfNext('quarter');
export const lastSunday: CalendarDate = due.startOfPrevious('sunday');
export const nextWednesday: DateTime = meeting.startOfNext('wednesday');
export const lastWeek: DateTime = meeting.startOfPrevious('week', 'monday');
export const nextHour: Time = opening.startOfNext('hour');
export const previousMinute: Time = opening.startOfPrevious('minute');
export const elapsed: Duration = meeting.until(viaCore);
export const elapsedHours: number = meeting.until(viaCore, unit);
export const stay: DateRange = due.for(3, 'days');
export const week: DateRange = dateRange('2026-09-01/2026-09-07');
export const slots: DateTimeRange[] = meeting.for(90, 'minutes').split(30, 'minutes');
export const shift: TimeRange = opening.to('5pm');
export const appointment: DateTime = opening.on(due, zone);
export const birthday: MonthDay = monthDay('10-17');
export const nextBirthday: CalendarDate = birthday.next(due);
export const expiry: YearMonth = monthYear('11/26');
export const lastDay: CalendarDate = expiry.end;
export const order: -1 | 0 | 1 = compare(meeting, viaCore);
export const first: DateTime = earliest(meeting, viaCore, now());
export const kind: string | undefined = kindOf(stay);
export const brand: symbol = IS_DATE_TIME;
export const brandedInstance: true = meeting[IS_DATE_TIME];
export const brandedRange: true = stay[IS_RANGE];
export const sunday: number = dayOfWeek('sunday');
export const sundayOfGetDay: number = dayOfWeek(0);
export const names: string[] = [...monthNames('long', 'fr'), ...weekdayNames('narrow', 'monday')];
export const text: string = `${meeting.format(spec)} ${due.text} ${elapsed.format('narrow')} ${meeting.fromNow()}`;
export const epochs: [number, number, bigint] = [
  meeting.epochSeconds,
  meeting.epochMilliseconds,
  meeting.epochNanoseconds,
];

export function checkGuard(input: unknown): DateTime | null {
  return isDateTime(input) ? input : null;
}

export function narrowRange(range: Range): CalendarDate | DateTime | Time {
  if (range.kind === 'date') {
    return range.start;
  }
  return range.end;
}

// legacy-date adds the read methods of Date to a datetime
export const legacy: [number, number, string] = [
  meeting.getFullYear(),
  meeting.getTimezoneOffset(),
  meeting.toISOString(),
];

// loose adds nullable return overloads to factories and the dayFirst setting
export const typed: DateTime | null = datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true });
export const submitted: CalendarDate | null = date('07.09.2026', { loose: true, dayFirst: true });
export const span: DateRange | null = dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true });
export const strictDate: CalendarDate = date('2026-09-06', { loose: false });
export const strictSpan: DateRange = dateRange('2026-09-01', '2026-09-07', { loose: false });
export const strictMonth: YearMonth = yearMonth('2026-09', { loose: false });
export const strictMonthDay: MonthDay = monthDay('09-06', { loose: false });
export const zoned: unknown = looseZoned('Sep 7 2026', { zone });

// options in a variable widen loose to boolean and remain nullable
const held = { loose: true, zone };
export const heldTyped: DateTime | null = datetime('TBD', held);
export const heldMonth: YearMonth | null = yearMonth('TBD', held);
export const heldMonthDay: MonthDay | null = monthDay('TBD', held);
// @ts-expect-error loose options in a variable may return null
export const heldDay: CalendarDate = date('TBD', held);
// @ts-expect-error loose range options in a variable may return null
export const heldSpan: DateRange = dateRange('TBD', 'TBD', held);

// zones adds zoneAliases to settings and exports its abbreviation table
timezones.IST = 'Asia/Jerusalem';
const settings: Settings = { zoneAliases: { hq: 'Europe/Berlin' }, dayFirst: true, weekStart: 'monday' };
const active: ActiveSettings = configure(settings);
export const configured: Record<string, string> = active.zoneAliases;

// locale accepts a tag, an Accept-Language header, or a tag list such as navigator.languages
declare const languages: readonly string[];
export const fromBrowser: CalendarDate = due.locale(languages);
export const appWide: ActiveSettings = configure({ locale: languages });
export const inFrench: string = due.format('long', ['fr-CH', 'fr']);
export const fromHeader: string | readonly string[] | undefined = due.locale('fr-CH;q=0.8, de;q=0.9').locale();
export const rangeDays: CalendarDate[] = dateRange('2026-05-01', '2 weeks').every('day');
export const daySlots: DateTime[] = due.every(6, 'hours', 'UTC');
export const totalDays: number = dateRange('2026-05-01', '2 weeks').count();
export const workdays: number = dateRange('2026-05-01', '2 weeks').count('weekdays');
export const mondays: number = dateRange('2026-05-01', '2 weeks').count('mondays');

// @ts-expect-error points() was renamed to every()
dateRange('2026-05-01', '2 weeks').points('day');
// @ts-expect-error count() is only defined on DateRange
datetimeRange('2026-05-01T09:00', '2h', 'UTC').count('days');
// @ts-expect-error count() is only defined on DateRange
timeRange('09:00', '17:00').count('days');

// @ts-expect-error instance locale may be a string[] without toUpperCase()
due.locale()?.toUpperCase();
// @ts-expect-error configured locale may also be a string[]
active.locale?.toUpperCase();
// @ts-expect-error epoch was renamed to epochMilliseconds
meeting.epoch;
// @ts-expect-error weekday was renamed to dayOfWeek
due.weekday;
// @ts-expect-error remove() does not exist (use minus())
meeting.remove(1, 'day');
// @ts-expect-error CalendarDate has no hour property
due.hour;
// @ts-expect-error MonthDay is unordered
birthday.isBefore(due);
// @ts-expect-error startOfNext() takes a weekday by name, so a count before a unit is not next Tuesday
due.startOfNext(2, 'months');
// @ts-expect-error startOfPrevious() takes a weekday by name
meeting.startOfPrevious(7);
// @ts-expect-error Time.startOfNext() takes a single clock unit argument
opening.startOfNext(2, 'hours');
// @ts-expect-error loose: true returns DateTime | null
export const unchecked: DateTime = datetime('TBD', { loose: true });

// disambiguation is typed on ReadOptions, at(), and on()
export const strictSpring: DateTime = datetime('2026-03-08T12:00', {
  zone: 'America/New_York',
  disambiguation: 'reject',
});
export const laterFold: DateTime = due.at('01:30', { zone: 'America/New_York', disambiguation: 'later' });
export const earlierOn: DateTime = opening.on(due, { zone: 'America/New_York', disambiguation: 'earlier' });
export const earliestYm: YearMonth = earliest(expiry, '2026-10');
export const temporalYear: number = due.toTemporal().year;
export const temporalEpoch: bigint = meeting.toTemporal().epochNanoseconds;
export const thursdayNum: number = dayOfWeek('thurs');
export const tuesdayNum: number = dayOfWeek('Tues');
export const upperThursdays: number = stay.count('THURSDAYS');
export const capDays: number = stay.count('Days');
export function readErrorCode(err: NativeDatesError): ErrorCode {
  return err.code;
}

// @ts-expect-error invalid disambiguation mode is rejected at compile time
datetime('2026-03-08T12:00', { zone: 'America/New_York', disambiguation: 'skip' });
// @ts-expect-error DateTime.at() keeps this.zone (use .in() to change zones)
meeting.at('09:00', { zone: 'Asia/Tokyo' });
// @ts-expect-error TemporalValue is no longer any, so invalid primitives fail typechecking
datetime(Symbol('nope'));
// @ts-expect-error booleans are not valid CalendarDateInput
date(true);
// @ts-expect-error unrelated object bags fail weak-type checking on CalendarDateInput
date({ totallyWrong: 123 });
// @ts-expect-error clock-only fields fail weak-type checking on CalendarDateInput
date({ hour: 12 });
// @ts-expect-error clock fields are rejected on CalendarDate.set()
due.set({ month: 2, hour: 12 });
// @ts-expect-error calendar fields are rejected on Time.set()
opening.set({ hour: 10, day: 5 });
// @ts-expect-error clock units are rejected on CalendarDate.plus()
due.plus(1, 'hours');
// @ts-expect-error quarter is not a direct CalendarDate.set() field
due.set('quarter', 2);
// @ts-expect-error quarter is not a direct DateTime.set() field
meeting.set('quarter', 2);
// @ts-expect-error month is larger than day on DateTime.round()
meeting.round('month');
// @ts-expect-error sub-month units are rejected on YearMonth.plus()
expiry.plus(5, 'days');
// @ts-expect-error Map is not a valid DurationInput
hours(1).plus(new Map());
// @ts-expect-error null is not accepted by equals()
meeting.equals(null);
// @ts-expect-error unrecognized unit names fail typechecking (no string & {} escape hatch)
due.plus(1, 'lightyears');
// @ts-expect-error clock units fail typechecking on CalendarDate.startOf()
due.startOf('hours');
// @ts-expect-error calendar units fail typechecking on Time.startOf()
opening.startOf('day');
// @ts-expect-error unrecognized weekday names fail typechecking
dayOfWeek('funday');
// @ts-expect-error unrecognized count kinds fail typechecking
stay.count('weeks');
// @ts-expect-error toTemporal() returns a typed Temporal shape rather than any
meeting.toTemporal().nonExistentMethod();
// @ts-expect-error point.for() rejects bare numbers without a unit
meeting.for(5_400_000);
// @ts-expect-error point.for() rejects bare numbers without a unit on Time
opening.for(2);
// @ts-expect-error point.for() rejects bare numbers without a unit on CalendarDate
due.for(3);
// @ts-expect-error point.for() rejects point endpoints
meeting.for(viaCore);
