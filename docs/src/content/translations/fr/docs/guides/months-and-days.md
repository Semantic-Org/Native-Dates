---
source: 6291509fd7f2
title: Mois et jours
lede: Stockez un mois sans jour, ou un anniversaire récurrent sans année.
---

En JavaScript natif, stocker la date d’expiration d’une carte bancaire oblige à y ajouter un faux 1er du mois. Stocker un anniversaire sans année de naissance oblige à inventer une année bissextile fictive comme 2000. [`YearMonth`](/api/year-month/) et [`MonthDay`](/api/month-day/) ne stockent que les composantes qui existent vraiment.

## Mois de facturation et expirations de carte

Utilisez [`yearMonth()`](/api/year-month-fn/) pour les chaînes ISO ou les paires année-mois numériques, et [`monthYear()`](/api/year-month-fn/#monthyear) pour les expirations de carte du type `11/28` :

```js
import { monthYear, yearMonth } from 'native-dates';

const billing = yearMonth('2026-11');
const expiry = monthYear('11/28');

billing.daysInMonth; // 30
billing.quarter; // 4
expiry.isPast('UTC'); // false
```

Vérifiez qu’une date tombe dans un mois avec [`contains()`](/api/year-month/#contains), avancez par mois ou par trimestre avec [`plus()`](/api/year-month/#plus), et sélectionnez un jour précis avec [`on()`](/api/year-month/#on) :

```js
billing.contains('2026-11-16'); // true
billing.plus(3, 'months').toString(); // '2027-02'
yearMonth('2026-02').on(31).toString(); // '2026-02-28'
yearMonth('2028-02').on(31).toString(); // '2028-02-29'
```

Le jour 31 est automatiquement ramené au dernier jour des mois plus courts, y compris le 29 février lors des années bissextiles.

## Anniversaires et jours fériés annuels

Utilisez [`monthDay()`](/api/month-day-fn/) pour les chaînes mois en premier et [`dayMonth()`](/api/month-day-fn/#daymonth) pour les chaînes jour en premier. Le nom de la fonction fixe l’ordre ; `05/10` a ainsi le même sens partout :

```js
import { dayMonth, monthDay } from 'native-dates';

const birthday = monthDay('10/17');
const european = dayMonth('17/10');

birthday.equals(european); // true
birthday.in(2027).toString(); // '2027-10-17'
```

Trouvez la prochaine ou la plus récente occurrence à partir d’aujourd’hui ou d’une date de référence avec [`next()`](/api/month-day/#next) et [`previous()`](/api/month-day/#previous) :

```js
birthday.next('2026-05-01').toString(); // '2026-10-17'
birthday.next('2026-10-17').toString(); // '2027-10-17'
birthday.previous('2026-10-17').toString(); // '2025-10-17'
```

Le 29 février est ramené au 28 février les années non bissextiles. Appelez [`fallsOn()`](/api/month-day/#fallson) pour vérifier si une date donnée correspond :

```js
const leapDay = monthDay(2, 29);

leapDay.in(2027).toString(); // '2027-02-28'
leapDay.fallsOn('2027-02-28'); // true
leapDay.fallsOn('2028-02-28'); // false
leapDay.fallsOn('2028-02-29'); // true
```

## Passer des dates partielles aux dates complètes

Extrayez directement `.yearMonth` ou `.monthDay` depuis n’importe quelle date ou n’importe quel instant, ou appelez [`as()`](/api/date-time/#as) en cours de chaînage :

```js
import { date, datetime } from 'native-dates';

const invoice = date('2026-11-16');
invoice.yearMonth.toString(); // '2026-11'
invoice.monthDay.toString(); // '11-16'

datetime('2026-11-01T02:00:00Z', 'America/Los_Angeles').as('yearMonth').toString();
// '2026-10'
```

Dans l’autre sens, appelez `on()` avec un jour sur un `YearMonth` ou [`in()`](/api/month-day/#in) avec une année sur un `MonthDay` pour obtenir une date calendaire complète.

## Formater et stocker

Les deux types se formatent via `.text` et [`format()`](/api/year-month/#format), et produisent une chaîne ISO avec [`toString()`](/api/year-month/#tostring) :

```js
import { monthDay, yearMonth } from 'native-dates';

yearMonth('2026-11').format('long', 'en-US'); // 'November 2026'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
monthDay('10-17').format('long', 'en-US'); // 'October 17'

yearMonth('2026-11').toString(); // '2026-11'
monthDay('10/17').toString(); // '10-17'
```

Des chaînes comme `2026-11` et `10-17` se stockent proprement dans une base de données ou une URL et se relisent directement avec `yearMonth()` et `monthDay()`.
