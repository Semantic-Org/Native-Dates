---
source: be45ccc1b61a
title: loose
lede: Analyse souple sensible à la locale et retours null sur demande pour les formulaires, fichiers CSV et flux hérités.
---

## Analyse souple sur demande

Par défaut, toutes les fonctions fabriques analysent des chaînes ISO 8601 strictes et lèvent une erreur sur les entrées mal formées. Importer ce plugin active `{ loose: true }` pour lire les saisies utilisateur non fiables, les colonnes CSV et les en-têtes hérités.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

L’analyse stricte reste le comportement par défaut partout où le mode souple n’est pas activé. Importer le plugin ne modifie aucun appel existant dans votre base de code.

## Lire dans la locale active

Le mode souple relit les dates et les heures du jour produites par `Intl` pour la locale active. Les noms de mois, les marqueurs AM/PM, les périodes de la journée et l’ordre numérique du jour et du mois proviennent de l’environnement d’exécution, et les chiffres de n’importe quel système d’écriture sont convertis automatiquement.

La locale active suit le même ordre de priorité que le formatage : l’option `locale`, puis [`configure()`](/api/configure/), puis la locale par défaut de l’environnement.

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
})?.hour; // 14
```

Les locales qui placent l’année en premier, comme le coréen, lisent les années sur deux chiffres en tête : `'26. 5. 5.'` correspond ainsi au 5 mai 2026 en coréen. Les mots de liaison, les ordinaux et les noms de jours en début de chaîne sont ignorés aussi bien sur les dates complètes que sur les dates partielles.

## Renvoyer null sur les entrées invalides

En mode souple, les chaînes illisibles, les champs vides, les valeurs manquantes et les dates calendaires impossibles comme le 30 février renvoient `null` au lieu de lever une erreur. Vos gestionnaires de formulaires et scripts d’import vérifient directement le résultat sans entourer chaque champ d’un bloc `try`.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

Les fonctions fabriques de [plages](/api/ranges/) et de dates partielles ([`YearMonth`](/api/year-month/) et [`MonthDay`](/api/month-day/)) acceptent la même option :

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

Les dates incomplètes auxquelles il manque l’année ou le jour renvoient `null` dans les fonctions fabriques de date et de date et heure plutôt que d’inventer une valeur par défaut. Utilisez une fonction fabrique de date partielle lorsque seuls le mois et l’année ou le mois et le jour sont présents.

Les années sur deux chiffres placées à côté d’un nom de mois non anglais, les abréviations de mois ambiguës, les heures supérieures à 12 accompagnées d’AM ou de PM et les heures seules passées à [`datetime()`](/api/datetime-fn/) sont rejetées. Les codes de fuseau horaire en majuscules inconnus et les heures isolées comme `'14h'` renvoient également `null`.

:::note[Les données invalides renvoient null, les options invalides lèvent toujours une erreur]
Le mode souple ne traite que les données d’entrée illisibles. Passer un fuseau horaire inconnu comme `'Mars/Olympus'` relève d’une erreur dans le code applicatif et non d’une saisie utilisateur : l’appel lève donc toujours une erreur immédiatement.
:::

## Fuseaux horaires dans les chaînes souples

Les chaînes contenant un marqueur UTC ou un décalage numérique désignent un instant précis et le convertissent dans votre fuseau horaire cible ou configuré. Les chaînes sans décalage conservent exactement la date et l’heure écrites dans le texte et les placent directement dans votre fuseau horaire cible.

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

Une abréviation de fuseau horaire placée après une heure se résout selon les mêmes règles que l’option `zone`. Chargez [`@native-dates/plugins/zones`](/plugins/zones/) pour reconnaître d’autres abréviations que UTC, GMT et les identifiants IANA standard, y compris les codes dépendant de la locale comme `CST` sous les locales chinoises.

## Dates numériques jour en premier

Les dates numériques séparées par des barres obliques, des points ou des tirets suivent automatiquement l’ordre de la locale active. Passez `dayFirst` à l’appel ou définissez-le dans [`configure()`](/api/configure/) lorsqu’une entrée suit un ordre différent de la locale active.

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

Passez `dayFirst: null` à `configure()` pour revenir à l’ordre de la locale active. Les fonctions fabriques de dates partielles comme [`monthDay()`](/api/month-day-fn/) lisent toujours les paires numériques dans l’ordre indiqué par leur nom, quelle que soit la locale.

## Règles régionales d’horloge et de mois

Les heures séparées par un point comme `'14.30'` ne s’analysent que dans les locales dont l’horloge utilise un point, comme le finnois et le danois, et renvoient `null` ailleurs. Les secondes séparées par un point sont acceptées après une date, tandis qu’une chaîne isolée à trois segments séparés par des points reste interprétée comme une date.

Les expressions de période de la journée comme l’anglais *in the evening* ou le coréen *밤* ajustent les horloges sur 12 heures sans toucher aux horaires sur 24 heures. Les connecteurs entre date et heure ne sont jamais pris pour AM ou PM : le gallois *am* (qui signifie « à ») conserve `14:30` intact, tandis que l’anglais `'AM 12:30'` s’analyse en `00:30` (trente minutes après minuit).

Les formes fléchies ou pourvues d’affixes des noms de mois dans les dates complètes s’analysent automatiquement, y compris en hébreu et en basque. Un nom de mois abrégé doit correspondre à un seul mois sans ambiguïté : en français, *juil* correspond à juillet tandis que *jui* renvoie `null`.

```js label="Heures avec point"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="Périodes de la journée"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="Connecteurs"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="Formes de mois"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## Options des fonctions fabriques

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

Étend chaque fonction fabrique avec une analyse de secours sensible à la locale et un retour `null` en cas d’entrée illisible. Appeler un constructeur de classe comme `new DateTime()` avec `{ loose: true }` active cette analyse de secours, tout en continuant de lever une erreur si la chaîne reste illisible.

**Paramètres**

```params
- name: loose
  type: boolean
  default: "false"
  description: "Lecture du texte informel dans la locale active, repli sur `Date` du moteur pour les formats machine et retour `null` si l’entrée est illisible."
- name: dayFirst
  type: boolean
  description: "Surcharge de l’ordre numérique de la locale active pour des chaînes comme `'07.09.2026'`."
- name: zone
  type: Zone
  description: Fuseau horaire utilisé pour interpréter les chaînes locales de date et heure ou afficher des instants.
- name: locale
  type: Locale
  description: Étiquette de locale BCP 47 attachée à la valeur et utilisée pour les noms de mois, les périodes de la journée, le style d’horloge et l’ordre des dates.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "Stratégie de levée d’ambiguïté pour les heures manquantes ou répétées lors des changements d’heure sur les chaînes locales (`'reject'` renvoie `null` en mode souple)."
```

**Valeur de retour**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: Instance analysée, ou `null` si `input` est illisible.
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

Remplace l’ordre numérique par défaut pour les appels en mode souple qui ne précisent ni `dayFirst` ni `locale`. Non défini par défaut afin que le mode souple suive la locale active.

**Paramètres**

```params
- name: dayFirst
  type: boolean | null
  description: "Ordre numérique forcé en mode souple : jour en premier (`true`), mois en premier (`false`) ou `null` pour suivre la locale active."
```
:::
