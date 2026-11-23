import { date, datetime, today } from 'native-dates';

import { checkAnswer } from './helpers/checks.js';
import { between, distinctInstants, holdClock, seeded } from './helpers/fixtures.js';

/*
  a server with many users, each read in their own zone and locale passed per call, and a nightly billing job.
  nothing is configured, and the first op runs as a fresh process does, before any formatter exists
*/

/*******************************
            Fixture
*******************************/

// the last day of January, so a month added to the 29th, 30th and 31st has to clamp
const now = Date.parse('2026-01-31T06:00:00Z');
holdClock(now);

const random = seeded(20260131);
// leans toward the start of a list, as real users cluster in a few zones and languages
const common = (list) => list[Math.floor(list.length * random() ** 2.5)];

const zones = [
  'America/New_York',
  'Europe/London',
  'America/Los_Angeles',
  'Europe/Berlin',
  'Asia/Tokyo',
  'America/Chicago',
  'Europe/Paris',
  'Asia/Kolkata',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Europe/Madrid',
  'America/Toronto',
  'Asia/Shanghai',
  'Europe/Amsterdam',
  'America/Mexico_City',
  'Asia/Seoul',
  'Europe/Rome',
  'Asia/Singapore',
  'America/Denver',
  'Europe/Stockholm',
  'Africa/Cairo',
  'Europe/Istanbul',
  'America/Bogota',
  'Asia/Dubai',
  'Europe/Warsaw',
  'Pacific/Auckland',
  'America/Argentina/Buenos_Aires',
  'Africa/Johannesburg',
  'Asia/Jakarta',
  'Europe/Lisbon',
  'America/Vancouver',
  'Asia/Bangkok',
  'Europe/Dublin',
  'Africa/Lagos',
  'Asia/Manila',
  'Europe/Athens',
  'America/Santiago',
  'Asia/Karachi',
  'Europe/Helsinki',
  'Pacific/Honolulu',
];

// a locale as a server holds one: a raw Accept-Language header, a regional tag or a bare tag
const locales = [
  'en-US,en;q=0.9',
  'en-US',
  'en',
  'es-MX',
  'de-DE,de;q=0.9,en;q=0.7',
  'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'ja',
  'en-GB,en;q=0.9,fr;q=0.5',
  'fr-CH, fr;q=0.9, en;q=0.8',
  'de',
  'es-ES,es;q=0.9',
  'zh-CN,zh;q=0.9,en;q=0.8',
  'fr',
  'ru-RU,ru;q=0.9,en-US;q=0.8',
  'ko-KR,ko;q=0.9,en;q=0.8',
  'it',
  'en-IN',
  'pt',
  'ar-EG',
  'nl',
  'fr-CA',
  'tr',
  'zh-TW',
  'es-AR',
  'ja,en-US;q=0.8,en;q=0.6',
  'de-AT',
  'ru',
  'ko',
];

// the database driver hands back Date objects, each distinct to the millisecond
const placed = distinctInstants(random, 4_000, Date.UTC(2024, 6, 1), now);
const users = Array.from({ length: 400 }, (_, index) => ({ id: index, zone: common(zones), locale: common(locales) }));
const requestsFrom = (offset) =>
  users.map((user, index) => ({
    user,
    orders: placed.slice(index * 10 + offset, index * 10 + offset + 5).map((ms) => ({ placedAt: new Date(ms) })),
  }));
const firstRequests = requestsFrom(0);
const nextRequests = requestsFrom(5);

// renewal days from six weeks back to six weeks out, about half of them due
const firstRenewal = Temporal.PlainDate.from('2025-12-20');
const subscriptions = Array.from({ length: 10_000 }, (_, index) => ({
  id: index,
  renewsOn: firstRenewal.add({ days: between(random, 0, 85) }).toString(),
}));

/*******************************
              Ops
*******************************/

// unchanged from docs/src/content/docs/guides/localization.md
function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

// purpose: a fresh server process formats five orders for each of 400 users in their own zone and locale
export function firstRequests400() {
  return firstRequests.map(({ user, orders }) => orders.map((order) => formatOrder(order, user)));
}

// purpose: the same server, now warm, formats the next five orders for each of the 400 users
export function steadyRequests400() {
  return nextRequests.map(({ user, orders }) => orders.map((order) => formatOrder(order, user)));
}

// purpose: a nightly job rolls 10,000 subscriptions forward a month where due, with a period end and an invoice due date
export function billingRun10k() {
  const day = today('UTC');
  return subscriptions.map((subscription) => {
    const renews = date(subscription.renewsOn);
    if (renews.isAfter(day)) {
      return subscription.renewsOn;
    }
    const next = renews.plus(1, 'month');
    return [next.toString(), next.endOf('month').toString(), renews.plus(30, 'days').toString()];
  });
}

/*******************************
        Expected Answers
*******************************/

// the same tasks in plain Temporal and Intl, built when a check runs so they add nothing before an op

// the headers above list languages in the order they are wanted
const tagsOf = (locale) => locale.split(',').map((part) => part.split(';')[0].trim());

const formatters = new Map();
const formatterFor = ({ zone, locale }) => {
  const key = `${zone} ${locale}`;
  if (!formatters.has(key)) {
    formatters.set(key, {
      long: new Intl.DateTimeFormat(tagsOf(locale), { dateStyle: 'long', timeStyle: 'short', timeZone: zone }),
      medium: new Intl.DateTimeFormat(tagsOf(locale), { dateStyle: 'medium', timeZone: 'UTC' }),
    });
  }
  return formatters.get(key);
};

const expectedOrders = (requests) =>
  requests.map(({ user, orders }) =>
    orders.map(({ placedAt }) => {
      const { long, medium } = formatterFor(user);
      const shipDay = Temporal.Instant.fromEpochMilliseconds(placedAt.getTime())
        .toZonedDateTimeISO(user.zone).add({ days: 2 }).toPlainDate();
      return {
        placed: long.format(placedAt),
        shipBy: medium.format(Date.UTC(shipDay.year, shipDay.month - 1, shipDay.day)),
      };
    })
  );

const expected = {
  firstRequests400: () => expectedOrders(firstRequests),
  steadyRequests400: () => expectedOrders(nextRequests),
  billingRun10k() {
    const day = Temporal.Instant.fromEpochMilliseconds(now).toZonedDateTimeISO('UTC').toPlainDate();
    return subscriptions.map((subscription) => {
      const renews = Temporal.PlainDate.from(subscription.renewsOn);
      if (Temporal.PlainDate.compare(renews, day) > 0) {
        return subscription.renewsOn;
      }
      const next = renews.add({ months: 1 });
      return [next.toString(), next.with({ day: next.daysInMonth }).toString(), renews.add({ days: 30 }).toString()];
    });
  },
};

/*******************************
             Checks
*******************************/

export const checks = {
  firstRequests400: (pages) => checkAnswer('server firstRequests400', pages, expected.firstRequests400()),
  steadyRequests400: (pages) => checkAnswer('server steadyRequests400', pages, expected.steadyRequests400()),
  billingRun10k: (renewals) => checkAnswer('server billingRun10k', renewals, expected.billingRun10k()),
};
