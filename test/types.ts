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
export const length: Duration = meeting.until(viaCore);
export const lengthInHours: number = meeting.until(viaCore, unit);
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
export const text: string = `${meeting.format(spec)} ${due.text} ${length.format('narrow')} ${meeting.fromNow()}`;
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

// loose adds a null answer to every factory and a dayFirst setting
export const typed: DateTime | null = datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true });
export const submitted: CalendarDate | null = date('07.09.2026', { loose: true, dayFirst: true });
export const span: DateRange | null = dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true });
export const zoned: unknown = looseZoned('Sep 7 2026', zone);

// options held in a variable widen loose to a boolean, and the answer may still be null
const held = { loose: true, zone };
export const heldTyped: DateTime | null = datetime('TBD', held);
// @ts-expect-error a loose read from held options answers null for what it cannot read
export const heldDay: CalendarDate = date('TBD', held);
// @ts-expect-error so does a loose range
export const heldSpan: DateRange = dateRange('TBD', 'TBD', held);

// zones adds zoneAliases to the settings and exports its abbreviation table
timezones.IST = 'Asia/Jerusalem';
const settings: Settings = { zoneAliases: { hq: 'Europe/Berlin' }, dayFirst: true, weekStart: 'monday' };
const active: ActiveSettings = configure(settings);
export const configured: Record<string, string> = active.zoneAliases;

// a locale is a tag, a header or a list of tags such as navigator.languages, and reads back as a tag or a list
declare const languages: readonly string[];
export const fromBrowser: CalendarDate = due.locale(languages);
export const appWide: ActiveSettings = configure({ locale: languages });
export const inFrench: string = due.format('long', ['fr-CH', 'fr']);
export const fromHeader: string | readonly string[] | undefined = due.locale('fr-CH;q=0.8, de;q=0.9').locale();

// @ts-expect-error a carried locale may be a list, which has no toUpperCase()
due.locale()?.toUpperCase();
// @ts-expect-error so may the configured one
active.locale?.toUpperCase();
// @ts-expect-error epoch became epochMilliseconds
meeting.epoch;
// @ts-expect-error weekday became dayOfWeek
due.weekday;
// @ts-expect-error remove() was dropped, minus() is the name
meeting.remove(1, 'day');
// @ts-expect-error a date has no clock
due.hour;
// @ts-expect-error a month-day has no order
birthday.isBefore(due);
// @ts-expect-error a loose read answers null for what it cannot read
export const unchecked: DateTime = datetime('TBD', { loose: true });
