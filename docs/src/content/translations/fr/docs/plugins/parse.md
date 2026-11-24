---
source: 8dc73060ce55
title: parse
lede: Analysez strictement des chaînes de dates et d’heures à format fixe grâce aux motifs de jetons et à l’option format.
---

## Analyser avec un motif de format

Par défaut, le noyau analyse des chaînes ISO 8601 strictes, tandis que [`@native-dates/plugins/loose`](/plugins/loose/) lit du texte libre dans la locale active. Importer ce plugin ajoute l’option `{ format }` pour les chaînes à format fixe comme les exports bancaires et les journaux serveur.

```js title="parse.js"
import '@native-dates/plugins/parse';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
datetime('24/Nov/2026:12:40:01 -0500', {
  format: 'DD/MMM/YYYY:HH:mm:ss ZZ',
  zone: 'America/New_York',
  locale: 'en-US',
}).toString(); // '2026-11-24T17:40:01.000Z'
time('1430', { format: 'HHmm' }).toString(); // '14:30:00'
yearMonth('11/2026', { format: 'MM/YYYY' }).toString(); // '2026-11'
monthDay('29/02', { format: 'DD/MM' }).toString(); // '02-29'
```

L’analyse ISO stricte reste le comportement par défaut partout où l’option `format` est omise. Appeler une fonction fabrique avec `{ format }` avant d’importer ce plugin lève une erreur [`missingPlugin`](/api/errors/#plugins).

## Correspondance stricte et formats nommés

Les motifs reprennent le [vocabulaire de jetons](/guides/formatting/#token-patterns) du noyau. Les jetons de largeur fixe exigent le nombre exact de chiffres, et le texte littéral est comparé en respectant la casse sur l’ensemble de la chaîne.

Les dates impossibles comme le 30 février et les jours de la semaine incohérents lèvent une erreur au lieu de décaler la date. Les jetons répétés ou les champs d’horloge sur 12 heures et 24 heures contradictoires sont rejetés de la même manière.

```js
import { configure, date, dateRange } from 'native-dates';

date('Tue 2026-11-24', { format: 'ddd YYYY-MM-DD', locale: 'en-US' }).toString();
// '2026-11-24'
date('6/9/26', { format: 'D/M/YY' }).toString(); // '2026-09-06'

configure({ formats: { bank: 'DDMMYYYY' } });
date('24112026', { format: 'bank' }).toString(); // '2026-11-24'
dateRange('24112026', '30112026', { format: 'bank' }).toString();
// '2026-11-24/2026-11-30'
configure({ formats: null });
```

Les motifs nommés enregistrés dans [`configure()`](/api/configure/) fonctionnent aussi bien pour l’analyse que pour le formatage. Les fonctions fabriques de plages transmettent l’option `format` aux deux bornes, y compris lorsque le second argument est une durée.

## Noms localisés et ordinaux

Les noms de mois, les noms de jours de la semaine, les périodes de la journée et les ordinaux suivent la locale active. Les formes autonomes comme les formes fléchies des mois correspondent sans distinction de casse : les dates russes et grecques s’analysent donc sans règle supplémentaire.

La locale active suit le même ordre de priorité que pour le formatage : l’option passée à l’appel, puis [`configure()`](/api/configure/), puis la locale par défaut de l’environnement. Passez explicitement une locale dès que le texte d’entrée provient d’une langue fixe, comme des journaux serveur en anglais.

```js
import { date, time, yearMonth } from 'native-dates';

date('November 24th, 2026', { format: 'MMMM Do, YYYY', locale: 'en-US' }).toString();
// '2026-11-24'
date('6 ноября 2026', { format: 'D MMMM YYYY', locale: 'ru' }).toString();
// '2026-11-06'
date('6. November 2026', { format: 'Do MMMM YYYY', locale: 'de' }).toString();
// '2026-11-06'
date('2026年11月6日', { format: 'YYYY[年]M[月]Do', locale: 'ja' }).toString();
// '2026-11-06'
yearMonth('février 2026', { format: 'MMMM YYYY', locale: 'fr' }).toString();
// '2026-02'
time('9:05:12.5 pm', { format: 'h:mm:ss.S a', locale: 'en-US' }).toString();
// '21:05:12.500'
```

Les jetons ordinaux anglais vérifient le suffixe exact (`'24st'` est donc rejeté), et les [noms de jours de la semaine](/api/configure/) personnalisés définis dans la configuration de l’application s’appliquent automatiquement.

## Semaines ISO et dates ordinales

Les motifs de jour ordinal de l’année et de semaine ISO produisent directement des dates calendaires ou des instants. À côté d’un jeton de semaine, `YYYY` lit l’année de semaine ISO plutôt que l’année calendaire écrite par `format()` : `'2026-W01-1'` donne ainsi le 29 décembre 2025.

Les années bissextiles et les années de 52 ou 53 semaines sont contrôlées strictement, et omettre le jour de la semaine sur une semaine ISO place la date au lundi.

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## Fuseaux horaires et horodatages

Les motifs comportant un jeton de décalage UTC fixent un instant exact et le convertissent dans votre fuseau horaire cible. Les jetons `z` inclus dans le motif résolvent les identifiants IANA et, avec [`@native-dates/plugins/zones`](/plugins/zones/), les noms de villes ou les abréviations comme `JST`, mais pas les libellés de décalage arbitraires comme `GMT+2`.

Un fuseau horaire présent dans la chaîne est conservé sur le résultat, sauf si vous passez une option `zone` cible pour le convertir. Si une chaîne porte à la fois un décalage UTC et un nom de fuseau horaire qui se contredisent pour cet instant, l’analyse lève une erreur.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  locale: 'en-US',
}).zone; // 'Asia/Tokyo'

datetime('24 Nov 2026 15:45 JST', {
  format: 'DD MMM YYYY HH:mm z',
  zone: 'UTC',
  locale: 'en-US',
}).toString(); // '2026-11-24T06:45:00.000Z'

datetime('1795542001', { format: 'X', zone: 'UTC' }).toString();
// '2026-11-24T17:40:01.000Z'
datetime('24112026', { format: 'DDMMYYYY', zone: 'America/New_York' }).toString();
// '2026-11-24T05:00:00.000Z'
```

Les horodatages Unix s’analysent avec `X` pour les secondes entières et `x` pour les millisecondes. Passer un motif ne contenant qu’une date à la [fonction fabrique `datetime()`](/api/datetime-fn/) positionne l’instant au début de cette journée dans le fuseau horaire cible.

## Combiner avec le mode souple

Chargez [`@native-dates/plugins/loose`](/plugins/loose/) en parallèle de ce plugin pour renvoyer `null` au lieu de lever une erreur lorsque le texte d’entrée ne correspond pas au motif. Les valeurs manquantes, les nombres, les dates impossibles et les transitions de changement d’heure rejetées renvoient `null` depuis les fonctions fabriques, tandis que les instances de date et d’heure existantes sont transmises telles quelles.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('not-a-date', { format: 'DDMMYYYY', loose: true }); // null
date('30022026', { format: 'DDMMYYYY', loose: true }); // null
datetime('08/03/2026 02:30', {
  format: 'DD/MM/YYYY HH:mm',
  zone: 'America/New_York',
  disambiguation: 'reject',
  loose: true,
}); // null
```

:::note[Les données invalides renvoient null, les motifs invalides lèvent toujours une erreur]
Le mode souple ne convertit en `null` que les chaînes d’entrée qui ne correspondent pas au motif. Un motif vide ou incomplet lève [`unknownFormat`](/api/errors/#units-zones-and-formats), et un jeton absent du type cible lève [`unsupportedToken`](/api/errors/#units-zones-and-formats).
:::

## Jetons pris en charge

Les jetons suivent le vocabulaire de formatage ; les espaces de début et de fin sont retirés automatiquement, sauf si le motif lui-même commence ou se termine par un espace.

| Jeton | Exemple | Correspondance |
|---|---|---|
| `YYYY` | `'2026'` | Année calendaire sur quatre chiffres, ou année de semaine ISO lorsqu’il est associé à `W` ou `WW`. |
| `YY` | `'26'` | Année sur deux chiffres : 69 à 99 se lisent comme 1969–1999 et 00 à 68 comme 2000–2068. |
| `M`, `MM` | `'9'`, `'09'` | Numéro de mois de 1 à 12, sans zéro initial ou sur deux chiffres. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Nom court ou complet du mois grégorien dans la locale active, formes fléchies comprises. |
| `D`, `DD` | `'6'`, `'06'` | Jour du mois de 1 à 31, sans zéro initial ou sur deux chiffres. |
| `Do` | `'24th'`, `'6.'` | Jour du mois avec ordinal anglais ou marqueur de jour de la locale active. |
| `DDD`, `DDDD` | `'1'`, `'328'` | Jour ordinal ISO de l’année de 1 à 366, sans zéro initial ou sur trois chiffres. |
| `W`, `WW` | `'5'`, `'48'` | Semaine ISO de l’année de 1 à 53, sans zéro initial ou sur deux chiffres. |
| `E` | `'2'` | Jour ISO de la semaine, numéroté de 1 (lundi) à 7 (dimanche). |
| `d` | `'0'` | Jour de la semaine, numéroté de 0 (dimanche) à 6 (samedi). |
| `dd`, `ddd`, `dddd` | `'Tu'`, `'Tue'`, `'Tuesday'` | Nom localisé le plus court, abrégé ou complet du jour de la semaine. |
| `H`, `HH` | `'9'`, `'09'` | Heure sur 24 heures de 0 à 23, sans zéro initial ou sur deux chiffres. |
| `h`, `hh` | `'9'`, `'09'` | Heure sur 12 heures de 1 à 12, sans zéro initial ou sur deux chiffres. |
| `m`, `mm` | `'5'`, `'05'` | Minute de 0 à 59, sans zéro initial ou sur deux chiffres. |
| `s`, `ss` | `'8'`, `'08'` | Seconde de 0 à 59, sans zéro initial ou sur deux chiffres. |
| `S`, `SS`, `SSS` | `'5'`, `'25'`, `'250'` | Fractions de seconde en dixièmes, centièmes ou millisecondes. |
| `A`, `a` | `'PM'`, `'pm'` | AM ou PM en anglais sans distinction de casse, ou période de la journée de la locale active. |
| `Z`, `ZZ` | `'-05:00'`, `'-0500'` | Décalage UTC avec ou sans deux-points, ou `Z` pour UTC. |
| `z`, `zz` | `'UTC'`, `'JST'` | Identifiant IANA sans espace, ou ville ou abréviation lorsque `@native-dates/plugins/zones` est chargé. N’analyse pas les libellés de décalage comme `'GMT+2'`. |
| `X`, `x` | `'1795542001'` | Horodatage Unix en secondes entières ou en millisecondes, y compris négatif. |
| `[text]` | `'[W]'` | Texte littéral échappé, comparé en respectant la casse. Un `T` isolé passe aussi sans échappement. |

Les jetons réservés au formatage comme les trimestres et les noms longs de fuseaux horaires ne peuvent pas être analysés et lèvent [`unknownFormat`](/api/errors/#units-zones-and-formats). Les motifs auxquels il manque des champs requis pour le type cible lèvent la même erreur, tandis que les jetons que le type cible ne porte pas lèvent [`unsupportedToken`](/api/errors/#units-zones-and-formats).

## Options des fonctions fabriques

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { format, zone?, locale?, disambiguation?, loose? }): DateTime
date(input, { format, locale?, loose? }): CalendarDate
time(input, { format, locale?, loose? }): Time
yearMonth(input, { format, locale?, loose? }): YearMonth
monthYear(input, { format, locale?, loose? }): YearMonth
monthDay(input, { format, locale?, loose? }): MonthDay
dayMonth(input, { format, locale?, loose? }): MonthDay
dateRange(start, end, { format, locale?, loose? }): DateRange
datetimeRange(start, end, { format, zone?, locale?, disambiguation?, loose? }): DateTimeRange
timeRange(start, end, { format, locale?, loose? }): TimeRange
```

Analyse une chaîne d’entrée selon un motif de jetons ou un format nommé dans chaque fonction fabrique de date, d’heure du jour, de date partielle et de plage. Les valeurs de date, d’heure du jour, `Date` et `Temporal` déjà analysées passent directement une fois le motif validé, tandis que les nombres sont rejetés.

**Paramètres**

```params
- name: format
  type: string
  required: true
  description: "Motif de jetons tel que `'DDMMYYYY'` ou motif nommé enregistré dans `configure({ formats })`."
- name: zone
  type: Zone
  description: Fuseau horaire utilisé pour interpréter les chaînes locales de date et heure ou convertir les horodatages avec décalage ou depuis l’époque Unix.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 portée par la valeur et utilisée pour les noms de mois, les noms de jours de la semaine, les périodes de la journée et les ordinaux.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "Stratégie de levée d’ambiguïté pour les heures manquantes ou répétées lors des changements d’heure sur les chaînes locales (`'reject'` lève `invalidDateTime`, ou renvoie `null` en mode souple)."
- name: loose
  type: boolean
  default: "false"
  description: "Option requérant `@native-dates/plugins/loose` pour renvoyer `null` au lieu de lever une erreur lorsque l’entrée ne correspond pas au format."
```

**Valeur de retour**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "Instance analysée, ou `null` lorsque `{ loose: true }` est défini sur une fonction fabrique et que l’entrée ne correspond pas."
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
