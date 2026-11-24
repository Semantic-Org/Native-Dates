---
source: c532ba117dba
title: Analyse
lede: Analysez des chaînes ISO, des durées, des plages et des saisies utilisateur en mode souple sans approximation silencieuse.
---

Le noyau analyse directement les entrées standard et sans ambiguïté dans le type que vous demandez :

- [`datetime()`](/api/datetime-fn/) pour les instants, les millisecondes depuis l’époque Unix et les horodatages
- [`date()`](/api/date-fn/) pour les dates calendaires sans horloge ni fuseau horaire
- [`time()`](/api/time-fn/) pour les heures du jour au format 24 heures ou 12 heures
- [`duration()`](/api/duration-fn/) pour les expressions de durée en anglais, les formes compactes et les durées ISO 8601
- [`yearMonth()`](/api/year-month-fn/) et [`monthDay()`](/api/month-day-fn/) pour les mois de facturation, les expirations de carte et les anniversaires récurrents
- [`dateRange()`](/api/range-fn/#daterange), [`datetimeRange()`](/api/range-fn/#datetimerange) et [`timeRange()`](/api/range-fn/#timerange) pour les chaînes de plage et les paires de bornes

## Dates ISO et horodatages

Passez à `date()` une chaîne année en premier, trois nombres (année, mois, jour) ou un objet de champs. Les chaînes année en premier acceptent des mois et des jours sur un ou deux chiffres, séparés par n’importe quel caractère autre qu’une lettre latine ou un deux-points. Les dates chinoises, japonaises, coréennes et à points espacés sont toutes reconnues directement par le noyau.

Les mois sont numérotés de 1 à 12. Les dates calendaires impossibles comme le 30 février, ainsi que les chaînes ISO de semaine ou de trimestre comme `'2026-W05-1'`, lèvent une erreur au lieu de deviner.

```js
import { date } from 'native-dates';

date('2026-11-16');
date('2026/11/6');
date('2026年11月16日');
date('2026. 11. 16.');
date(2026, 11, 16);
date({ year: 2026, month: 11, day: 16 });
```

Passez des chaînes ISO 8601 ou des objets de champs à `datetime()`. Un suffixe `Z` ou un décalage numérique fixe l’instant exact, tandis qu’une chaîne sans décalage se lit comme une heure locale dans le fuseau horaire cible.

```js
import { datetime } from 'native-dates';

datetime('2026-11-16T17:30:00Z', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30', 'America/Los_Angeles'); // 9:30 AM PST
datetime('2026-11-16T09:30[Europe/Berlin]'); // 9:30 AM CET
datetime({ year: 2026, month: 11, day: 16, hour: 9, minute: 30 }, 'Europe/Berlin');
```

Passer un horodatage avec décalage à `date()` ou `time()` en extrait la date calendaire ou l’heure locale dans le fuseau horaire demandé :

```js
import { time } from 'native-dates';

date('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 2026-11-16
date('2026-11-17T01:30:00Z', 'Asia/Tokyo'); // 2026-11-17
time('2026-11-17T01:30:00Z', 'America/Los_Angeles'); // 17:30:00
```

## Heures du jour et durées

Passez à `time()` une heure ISO sur 24 heures, une chaîne heure-minute comme `'14h30'`, une heure sur 12 heures, des arguments numériques ou un objet de champs. Une heure seule comme `'14h'` lève toujours une erreur afin que les durées restent sans ambiguïté.

```js
import { time } from 'native-dates';

time('09:30');
time('14h30');
time('9:30am');
time('5:15 PM');
time(17, 15, 30);
time({ hour: 9, minute: 30 });
```

Passez à `duration()` une forme compacte, une expression de durée en anglais, une chaîne ISO 8601, un nombre accompagné d’une unité ou un objet de champs.

```js
import { duration } from 'native-dates';

duration('1h 30m');
duration('2 weeks and 3 days');
duration('PT90M');
duration(90, 'minutes');
duration({ hours: 1, minutes: 30 });
```

## Dates partielles et plages

Passez des chaînes ISO année-mois à [`yearMonth()`](/api/year-month-fn/), ou lisez les expirations de carte commençant par le mois avec [`monthYear()`](/api/year-month-fn/#monthyear) :

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

yearMonth('2026-11');
monthYear('11/28'); // YearMonth(2028-11)

monthDay('10/17');
dayMonth('17/10'); // MonthDay(10-17)
```

Les dates récurrentes sans année fonctionnent de la même façon avec [`monthDay()`](/api/month-day-fn/) et [`dayMonth()`](/api/month-day-fn/#daymonth). Pour les plages, les [fonctions fabriques de plages](/api/range-fn/) lisent deux bornes ou une chaîne de plage unique :

```js
import { dateRange, timeRange } from 'native-dates';

dateRange('2026-11-01/2026-11-07');
timeRange('9am - 5pm');
```

## Horodatages Unix, Date et Temporal

Les millisecondes depuis l’époque Unix, les instances JavaScript natives `Date` et les objets [Temporal](/guides/temporal/) passent directement dans `datetime()`.

Passer un nombre brut à `date()` lève une erreur, car l’entrée est ambiguë. Convertissez d’abord les millisecondes Unix en `DateTime` dans un fuseau horaire précis, puis extrayez sa date calendaire.

```js
import { date, datetime } from 'native-dates';

const fromEpoch = datetime(1794850200000, 'UTC');
const fromJSDate = datetime(new Date('2026-11-16T17:30:00Z'));
const localDay = date(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
```

## Pourquoi les chaînes ambiguës lèvent une erreur

Si une année sur quatre chiffres en tête n’offre qu’une seule lecture possible, `'03/05/2026'` désigne le 5 mars aux États-Unis et le 3 mai en Europe comme en Amérique latine. Le noyau refuse les chaînes numériques ambiguës au lieu de deviner le mauvais mois en production.

:::warning[Les valeurs vides ne prennent jamais l’instant actuel par défaut]
Passer une valeur vide à n’importe quelle fonction fabrique lève une erreur au lieu de renvoyer la date ou l’instant actuels : un champ d’API manquant ne peut donc jamais se faire passer pour aujourd’hui. Appelez [`now()`](/api/datetime-fn/#now) ou [`today()`](/api/date-fn/#today) lorsque vous souhaitez la date du jour ou l’instant présent.
:::

## Saisie utilisateur avec le plugin loose

Pour analyser du texte libre provenant de formulaires, d’exports CSV ou d’en-têtes RFC 2822, importez [`@native-dates/plugins/loose`](/plugins/loose/) et passez `{ loose: true }`. Le mode souple lit les dates et les heures du jour telles que la locale active les écrit : noms de mois localisés, périodes de la journée, heures séparées par des points et chiffres non ASCII.

```js
import '@native-dates/plugins/loose';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('Nov 16, 2026', { loose: true }); // 2026-11-16
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // 2026-11-16
datetime('Mon, 16 Nov 2026 17:30:00 GMT', { loose: true });
time('오후 2:30', { loose: true, locale: 'ko' }); // 14:30:00
yearMonth('Nov 2026', { loose: true }); // 2026-11
monthDay('17 février', { loose: true, locale: 'fr' }); // 02-17
```

Les dates numériques avec barres obliques ou points suivent l’ordre de la locale active. Passez `dayFirst` sur un appel précis ou configurez-le globalement via [`configure()`](/api/configure/) lorsqu’une entrée suit un ordre différent de celui de la locale active.

```js
date('03/05/2026', { loose: true, locale: 'en-US' }); // 2026-03-05
date('03/05/2026', { loose: true, locale: 'fr' }); // 2026-05-03
date('03/05/2026', { loose: true, locale: 'en-US', dayFirst: true }); // 2026-05-03
```

En mode souple, chaque fonction fabrique et chaque plage renvoie `null` au lieu de lever une erreur face à une entrée illisible. Les options invalides, comme un nom de fuseau horaire inconnu, continuent de lever une erreur.

```js
import { duration } from 'native-dates';

date('not a date', { loose: true }); // null
duration('soon', { loose: true }); // null
```
