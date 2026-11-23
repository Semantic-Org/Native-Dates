import { configure, date, datetime, weekdayNames } from 'native-dates';

import { checkAnswer } from './helpers/checks.js';
import { holdClock, requireHost } from './helpers/fixtures.js';

/*
  the first dates a page shows in a language: a calendar header, a month title, a timestamp and a due label.
  one language is too short to time, so a reader switches through nine and the result reads as nine first paints.
  this file calls nothing from the library before its op, so every table and formatter is built inside it
*/

/*******************************
            Fixture
*******************************/

const reader = { zone: 'Europe/Berlin', now: Date.parse('2026-03-08T11:00:00Z') };
holdClock(reader.now);

// English and the eight languages the docs carry a guide for
const languages = ['en-US', 'ar-EG', 'zh-CN', 'fr', 'ja', 'ko', 'pt-BR', 'ru', 'es'];
const page = { month: '2026-03-01', updatedAt: '2026-03-07T14:00:12.345Z', dueOn: '2026-03-11' };

/*******************************
              Ops
*******************************/

// purpose: a page switches through nine languages, each showing its first weekday header, month title, timestamp and due label
export function firstPaint9() {
  return languages.map((locale) => {
    configure({ locale });
    return [
      weekdayNames('short'),
      date(page.month).format('MMMM YYYY'),
      datetime(page.updatedAt).format('long'),
      date(page.dueOn).fromNow(),
    ];
  });
}

/*******************************
        Expected Answers
*******************************/

// the same page in plain Temporal and Intl, built when the check runs

const expected = {
  firstPaint9: () =>
    languages.map((locale) => {
      const intl = (options, timeZone = 'UTC') => new Intl.DateTimeFormat(locale, { ...options, timeZone });
      const { firstDay } = new Intl.Locale(locale).getWeekInfo();
      const month = Temporal.PlainDate.from(page.month);
      const today = Temporal.Instant.fromEpochMilliseconds(reader.now).toZonedDateTimeISO(reader.zone).toPlainDate();
      return [
        // 2024-01-01 was a Monday, so day n of that week is dayOfWeek n
        Array.from(
          { length: 7 },
          (_, index) => intl({ weekday: 'short' }).format(Date.UTC(2024, 0, ((firstDay - 1 + index) % 7) + 1)),
        ),
        // token output keeps ASCII digits in every locale
        `${intl({ month: 'long' }).format(Date.UTC(month.year, month.month - 1, 1))} ${month.year}`,
        intl({ dateStyle: 'long', timeStyle: 'short' }, reader.zone).format(Date.parse(page.updatedAt)),
        new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
          today.until(Temporal.PlainDate.from(page.dueOn)).days,
          'day',
        ),
      ];
    }),
};

/*******************************
             Checks
*******************************/

export const checks = {
  firstPaint9(pages) {
    requireHost('first-paint.js', reader);
    checkAnswer('first-paint firstPaint9', pages, expected.firstPaint9());
  },
};
