import { checkAnswer } from './helpers/checks.js';
import { holdClock, requireHost } from './helpers/fixtures.js';

/*
  the first dates a page shows, on cold code: a calendar header, a month title, a timestamp and a due label.
  every page that shows a date pays this once, in one language, so the op is one page and stays short.
  the op imports the library itself, so the library's own module evaluation is inside the measure
  and work moved from first use to import still shows
*/

/*******************************
            Fixture
*******************************/

// the app configures nothing, so the page takes the browser's own zone and language
const reader = { zone: 'Europe/Berlin', locale: 'en-US', now: Date.parse('2026-03-08T11:00:00Z') };
holdClock(reader.now);

const page = { month: '2026-03-01', updatedAt: '2026-03-07T14:00:12.345Z', dueOn: '2026-03-11' };

/*******************************
              Ops
*******************************/

// purpose: a page loads the library and shows its first four dates, the cost every page with a date pays once
export async function firstPaint() {
  const { date, datetime, weekdayNames } = await import('native-dates');
  return [
    weekdayNames('short'),
    date(page.month).format('MMMM YYYY'),
    datetime(page.updatedAt).format('long'),
    date(page.dueOn).fromNow(),
  ];
}

/*******************************
        Expected Answers
*******************************/

// the same page in plain Temporal and Intl, built when the check runs

const expected = {
  firstPaint() {
    const intl = (options, timeZone = 'UTC') => new Intl.DateTimeFormat(reader.locale, { ...options, timeZone });
    const { firstDay } = new Intl.Locale(reader.locale).getWeekInfo();
    const month = Temporal.PlainDate.from(page.month);
    const today = Temporal.Instant.fromEpochMilliseconds(reader.now).toZonedDateTimeISO(reader.zone).toPlainDate();
    return [
      // 2024-01-01 was a Monday, so day n of that week is dayOfWeek n
      Array.from(
        { length: 7 },
        (_, index) => intl({ weekday: 'short' }).format(Date.UTC(2024, 0, ((firstDay - 1 + index) % 7) + 1)),
      ),
      `${intl({ month: 'long' }).format(Date.UTC(month.year, month.month - 1, 1))} ${month.year}`,
      intl({ dateStyle: 'long', timeStyle: 'short' }, reader.zone).format(Date.parse(page.updatedAt)),
      new Intl.RelativeTimeFormat(reader.locale, { numeric: 'auto' }).format(
        today.until(Temporal.PlainDate.from(page.dueOn)).days,
        'day',
      ),
    ];
  },
};

/*******************************
             Checks
*******************************/

export const checks = {
  firstPaint(shown) {
    requireHost('startup.js', reader);
    checkAnswer('startup firstPaint', shown, expected.firstPaint());
  },
};
