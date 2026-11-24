---
source: 8bfe5a8d41c8
title: Types de temps
lede: Choisissez le bon type pour une date calendaire, une heure du jour, un instant précis, une date partielle, une plage ou une durée.
---

L’objet `Date` natif de JavaScript sert à tout, qu’il s’agisse d’un anniversaire, d’un réveil à 9 h 30 ou de la seconde exacte à laquelle une commande a été passée.

Chaque concept dispose ici de son propre type afin de ne manipuler que les champs qui existent réellement :

- **[`CalendarDate`](/api/calendar-date/)** pour une date calendaire, comme le 10 mai 2026
- **[`Time`](/api/time/)** pour une heure du jour, comme 9 h 30
- **[`DateTime`](/api/date-time/)** pour un instant précis dans un fuseau horaire
- **[`Duration`](/api/duration/)** pour une durée, comme 2 heures ou 3 semaines
- **[`YearMonth`](/api/year-month/)** et **[`MonthDay`](/api/month-day/)** pour un mois sans jour, ou un jour récurrent sans année
- **[Plages](/api/ranges/)** pour une étendue entre deux dates, deux heures du jour ou deux instants

## CalendarDate

Utilisez [`CalendarDate`](/api/calendar-date/) lorsqu’un événement porte sur une journée entière plutôt que sur une seconde précise : anniversaires, dates d’échéance, jours fériés ou valeurs issues d’un sélecteur de date.

Créez-en une avec [`today()`](/api/date-fn/#today) ou [`date()`](/api/date-fn/) :

```js
import { date, today } from 'native-dates';

const birthday = date('2026-05-10');
const due = today().plus(2, 'weeks');

birthday.month; // 5
birthday.day; // 10
```

Comme une date calendaire n’a ni horloge ni fuseau horaire, le 10 mai reste le 10 mai pour tout le monde, où que se trouve l’utilisateur.

## Time

Utilisez [`Time`](/api/time/) pour une heure du jour indépendante de toute date précise, comme les horaires d’ouverture d’un magasin ou un rappel quotidien.

```js
import { time } from 'native-dates';

const opens = time('9:00am');
const closes = opens.plus(8, 'hours');

closes.hour; // 17
closes.format('short', 'en-US'); // '5:00 PM'
```

Ajouter des heures au-delà de minuit boucle proprement sur le cycle de 24 heures, sans date à faire avancer.

## DateTime

Utilisez [`DateTime`](/api/date-time/) lorsqu’un événement survient à un instant réel : une réunion, un départ de vol ou un horodatage enregistré en base de données.

Créez-en un avec [`now()`](/api/datetime-fn/#now) ou [`datetime()`](/api/datetime-fn/), ou associez une heure du jour à une date calendaire :

```js
import { date, datetime, now } from 'native-dates';

const current = now();
const created = datetime('2026-11-16T17:30:00Z');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
```

Chaque instant sait à la fois quand l’événement a lieu et dans quel fuseau horaire vous le consultez. Appelez [`in()`](/api/date-time/#in) pour afficher ce même instant dans une autre ville :

```js
standup.in('Europe/Berlin').format('time', 'en-US'); // '6:30 PM'
```

## Duration

Utilisez [`Duration`](/api/duration/) pour représenter une durée. Créez-en une avec les fonctions par unité comme [`hours()`](/api/duration-fn/#hours), ou passez une expression de durée en anglais à [`duration()`](/api/duration-fn/) :

```js
import { days, duration, hours } from 'native-dates';

const call = hours(1.5);
const trial = days(14);
const turnaround = duration('2 weeks, 3 days');
```

Mesurer l’écart entre deux valeurs renvoie également une durée :

```js
const opens = time('9:00am');
const lunch = time('12:30pm');

opens.until(lunch).format('long', 'en-US'); // '3 hours, 30 minutes'
```

## YearMonth

Utilisez [`YearMonth`](/guides/months-and-days/#billing-months-and-card-expiries) lorsqu’une valeur associe une année et un mois sans numéro de jour : période de facturation, date d’expiration de carte ou champ HTML de type mois.

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.on(15); // CalendarDate : 2026-11-15
```

Ce type se manipule en mois et en années, et [`on()`](/api/year-month/#on) sélectionne un jour précis de ce mois sous forme de date calendaire.

## MonthDay

Utilisez [`MonthDay`](/guides/months-and-days/#birthdays-and-annual-holidays) pour une date récurrente sans année, comme un anniversaire ou une fête annuelle.

```js
import { monthDay } from 'native-dates';

const birthday = monthDay('10/17');

birthday.in(2026); // CalendarDate : 2026-10-17
birthday.fallsOn('2026-10-17'); // true
```

Le 29 février est automatiquement ramené au 28 février les années non bissextiles lorsque vous appelez [`fallsOn()`](/api/month-day/#fallson) ou [`in()`](/api/month-day/#in).

## Plages

Utilisez les [plages](/guides/ranges/) pour représenter l’étendue entre deux dates, deux heures du jour ou deux instants. Créez-en une directement avec [`dateRange()`](/api/range-fn/#daterange), [`timeRange()`](/api/range-fn/#timerange) ou [`datetimeRange()`](/api/range-fn/#datetimerange) :

```js
import { dateRange, timeRange } from 'native-dates';

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');

sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8
```

Les plages de dates incluent leur dernier jour, tandis que les plages d’instants et les plages horaires excluent leur borne de fin afin que deux créneaux consécutifs ne se chevauchent jamais.

## Passer d’un type à l’autre

Ces types s’enchaînent directement lorsque vous ajoutez ou retirez des composantes. Associez une heure du jour à une date calendaire avec [`at()`](/api/calendar-date/#at) pour obtenir un instant, ou construisez une plage depuis un point existant avec [`for()`](/api/ranges/#to) ou [`to()`](/api/ranges/#to) :

```js
const reminder = today().plus(1, 'day').at('9:00am');
const upcoming = today().for(2, 'weeks');
```

Dans l’autre sens, lisez directement les propriétés partielles d’un instant ou d’une date, ou appelez [`as()`](/api/date-time/#as) au milieu d’un chaînage :

```js
reminder.date; // CalendarDate de demain
reminder.time; // Time : 09:00:00
reminder.yearMonth; // YearMonth
reminder.monthDay; // MonthDay
reminder.in('Asia/Tokyo').as('time'); // Time à Tokyo
```

:::tip[DateTime ou CalendarDate ?]
Demandez-vous si changer de fuseau horaire doit modifier ce que voit l’utilisateur. Un appel à 9 h 30 à Los Angeles a lieu à 18 h 30 à Berlin : il relève donc de `DateTime`. Un anniversaire le 10 mai reste le 10 mai partout dans le monde : il a sa place dans `CalendarDate`.
:::
