---
source: 7f0f623e1e92
title: dateRange()
lede: Créer une DateRange, une DateTimeRange ou une TimeRange à partir de bornes, de durées ou de chaînes de plage.
---

## Créer des plages

Les fonctions fabriques autonomes construisent des [Plages](/api/ranges/) à partir d’entrées brutes, de paires de bornes ou de chaînes de plage uniques. Si vous disposez déjà d’un point typé, appelez directement [`to()`](/api/ranges/#to) ou [`range()`](/api/ranges/#range) dessus.

:::entry
### `dateRange()` :kind[function]

```js signature
dateRange(start, end, options?): DateRange
dateRange(interval, options?): DateRange
```

Crée une [`DateRange`](/api/ranges/#daterange) inclusive (bornes incluses) couvrant deux dates calendaires. Lorsque le second argument est une durée telle que `'7 days'` (en anglais), le dernier jour se situe six jours après la date de début pour couvrir sept jours au total.

```js title="dates.js"
import { dateRange, days } from 'native-dates';

const fromEnds = dateRange('2026-09-01', '2026-09-07');
const fromLength = dateRange('2026-09-01', days(7));
const fromInterval = dateRange('2026-09-01/2026-09-07');

fromEnds.duration.days; // 7
fromLength.toString(); // '2026-09-01/2026-09-07'
fromInterval.equals(fromEnds); // true
```

**Paramètres**

```params
- name: start
  type: CalendarDateInput | string
  required: true
  description: Date de début ou chaîne de plage complète lorsque `end` est omis.
- name: end
  type: CalendarDateInput | DurationInput | ReadOptions
  description: Date de fin incluse, durée ou objet d’options lorsque `start` est une chaîne de plage.
- name: options
  type: Zone | ReadOptions
  description: Fuseau horaire ou options de lecture appliqués lors de l’analyse des bornes.
  options:
    - name: zone
      type: Zone
      description: Fuseau horaire utilisé pour extraire les jours calendaires de chaînes d’instant ou d’objets `Date`.
    - name: locale
      type: Locale
      description: Étiquette de locale BCP 47 portée par la plage renvoyée et ses bornes.
    - name: loose
      type: boolean
      default: 'false'
      description: "Analyse de chaînes de dates informelles et renvoi de `null` en cas d’entrée illisible avec `@native-dates/plugins/loose`."
    - name: dayFirst
      type: boolean
      description: "Ordre numérique des dates remplaçant celui de la locale active en mode souple."
```

**Valeur de retour**

```returns
type: DateRange
description: "Instance `DateRange` bornes incluses, ou `null` lorsque le mode souple ne parvient pas à lire une borne."
```
:::

:::entry
### `datetimeRange()` :kind[function]

```js signature
datetimeRange(start, end, options?): DateTimeRange
datetimeRange(interval, options?): DateTimeRange
```

Crée une [`DateTimeRange`](/api/ranges/#datetimerange) en intervalle semi-ouvert qui inclut son instant de début avec sa borne supérieure exclue. Lorsque l’entrée de fin ne porte pas de fuseau horaire explicite, elle est lue dans le fuseau horaire de l’instant de début.

**Paramètres**

```params
- name: start
  type: DateTimeInput | string
  required: true
  description: Instant de début ou chaîne de plage lorsque `end` est omis.
- name: end
  type: DateTimeInput | DurationInput | ReadOptions
  description: Instant de fin exclu (borne supérieure exclue), durée ou objet d’options pour une chaîne de plage.
- name: options
  type: Zone | ReadOptions
  description: Fuseau horaire ou options de lecture comme `zone`, `locale` ou `loose` appliqués aux deux bornes.
```

**Valeur de retour**

```returns
type: DateTimeRange
description: "Instance `DateTimeRange` en intervalle semi-ouvert, ou `null` lorsque le mode souple ne parvient pas à lire une borne."
```

```js
import { datetimeRange } from 'native-dates';

const meeting = datetimeRange('2026-09-01T09:00', '90m', 'America/New_York');
meeting.end.format('short', 'en-US'); // '9/1/26, 10:30 AM'

const zoned = datetimeRange('2026-09-01T09:00[America/New_York]/2026-09-01T10:30[America/New_York]');
zoned.start.zone; // 'America/New_York'
```
:::

:::entry
### `timeRange()` :kind[function]

```js signature
timeRange(start, end, options?): TimeRange
timeRange(interval, options?): TimeRange
```

Crée une [`TimeRange`](/api/ranges/#timerange) en intervalle semi-ouvert entre deux heures du jour, borne supérieure exclue. Lorsque l’heure de fin est antérieure sur l’horloge à l’heure de début, la plage horaire franchit minuit.

**Paramètres**

```params
- name: start
  type: TimeInput | string
  required: true
  description: Heure de début ou chaîne de plage lorsque `end` est omis.
- name: end
  type: TimeInput | DurationInput | ReadOptions
  description: Heure de fin exclue (borne supérieure exclue), durée en unités d’horloge ou objet d’options pour une chaîne de plage.
- name: options
  type: Zone | ReadOptions
  description: Fuseau horaire ou options de lecture comme `zone`, `locale` ou `loose` lors de l’extraction d’heures depuis des horodatages.
```

**Valeur de retour**

```returns
type: TimeRange
description: "Instance `TimeRange` en intervalle semi-ouvert, ou `null` lorsque le mode souple ne parvient pas à lire une borne."
```

```js
import { timeRange } from 'native-dates';

const office = timeRange('9am - 5pm');
const overnight = timeRange('22:00', '8h');

office.toString(); // '09:00:00/17:00:00'
overnight.toString(); // '22:00:00/06:00:00'
```
:::

## Chaînes de plage et mode souple

Les plages passées sous forme d’une seule chaîne se découpent sur une barre oblique ISO ou sur des séparateurs de plage entourés d’espaces. Les barres obliques situées dans les noms de fuseaux horaires IANA entre crochets restent intactes.

| Forme | Exemple | Lecture |
|---|---|---|
| Chaîne de plage ISO avec barre oblique | `'2026-09-01/2026-09-07'`, `'09:00/17:00'` | Découpe sur `/` hors des noms de fuseaux horaires entre crochets, conformément à la sortie de [`toString()`](/api/ranges/#tostring). |
| Trait d’union ou tiret demi-cadratin entouré d’espaces | `'9am - 5pm'`, `'2026/09/01 - 2026/09/07'` | Découpe d’abord sur `-` ou `–` entouré d’espaces, ce qui préserve les tirets et barres obliques internes aux dates. |
| Séparateur anglais `to` | `'2026-09-01 to 2026-09-07'` | Découpe sur ` to ` entouré d’espaces. |
| Début et durée | `dateRange('2026-09-01', '7d')`, `timeRange('9am', '90m')` | Lit le second argument comme une durée lorsqu’il s’agit d’une [`Duration`](/api/duration/), d’un objet de champs de durée ou d’une expression de durée en anglais ou abrégée. |

Avec le [plugin loose](/plugins/loose/) chargé, le mode souple analyse les bornes informelles et renvoie `null` lorsqu’une borne ne peut pas être lue :

```js
import { dateRange } from 'native-dates';
import '@native-dates/plugins/loose';

dateRange('Sep 1, 2026 to Sep 7, 2026', { loose: true })?.toString();
// '2026-09-01/2026-09-07'

dateRange('not a range', { loose: true }); // null
```
