---
source: cd25f69b961f
title: Erreurs
lede: Chaque entrée invalide ou opération non prise en charge lève une Error standard dotée d’un code exploitable par programme.
---

## Structure des erreurs

Les appels invalides échouent immédiatement au lieu de renvoyer des objets de date corrompus ou des nombres `NaN` qui faussent les calculs en aval. Chaque erreur levée est une erreur JavaScript standard portant deux propriétés supplémentaires :

- **`error.code`** contient un identifiant camelCase stable tel que `'invalidDate'` ou `'unknownZone'`.
- **`error.at`** restitue sous forme de chaîne l’entrée fautive ou la cible de l’opération, par exemple `'2026-02-30'`.

Les types d’arguments incorrects et les catégories temporelles incompatibles lèvent une `TypeError`. Les dates impossibles, chaînes illisibles, unités ou fuseaux horaires inconnus et opérations non prises en charge lèvent une `RangeError`.

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

En mode développement, `error.message` ajoute sous l’en-tête `dates refused [code] at ...` une seconde ligne explicative en anglais qui indique comment corriger l’appel. Les builds de production définissant `NODE_ENV` sur `'production'` retirent automatiquement ces indications textuelles tout en conservant le code d’erreur et l’écho de l’entrée.

## Gérer les entrées non fiables

Inspectez `error.code` lorsque vous voulez afficher des messages de validation personnalisés pour des cas d’échec précis, et propagez les erreurs inattendues :

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

Pour lire des champs de formulaire saisis par des utilisateurs, des paramètres d’URL ou des cellules CSV où un texte illisible doit renvoyer `null`, importez [`@native-dates/plugins/loose`](/plugins/loose/) et activez le mode souple :

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[Erreurs de données contre erreurs de code en mode souple]
Le mode souple renvoie `null` uniquement lorsque la valeur d’entrée elle-même ne peut pas être lue. Les erreurs dans vos propres options d’appel, comme un fuseau horaire inconnu ou une plage inversée, continuent de lever une erreur pour que les bugs restent visibles.
:::

## Codes TypeError

Les erreurs `TypeError` indiquent qu’une entrée obligatoire est absente, possède un type JavaScript incorrect ou relève d’un concept temporel différent de celui attendu.

| Code | Levée par | Cause |
|---|---|---|
| `missingDateTime` | `datetime()`, `DateTime` | L’entrée vaut `null` ou `undefined`. |
| `missingDate` | `date()`, `CalendarDate` | L’entrée vaut `null` ou `undefined`. |
| `missingTime` | `time()`, `Time` | L’entrée vaut `null` ou `undefined`. |
| `missingYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | L’entrée vaut `null` ou `undefined`. |
| `missingMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | L’entrée vaut `null` ou `undefined`. |
| `invalidDateTime` | `datetime()`, `DateTime` | L’entrée est d’un type non pris en charge, comme un booléen. |
| `invalidDate` | `date()`, `CalendarDate` | L’entrée est un nombre isolé ou un type non pris en charge. |
| `invalidTime` | `time()`, `Time` | L’entrée est d’un type non pris en charge. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | L’entrée est un nombre isolé ou un type non pris en charge. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | L’entrée est un nombre isolé ou un type non pris en charge. |
| `invalidDuration` | `duration()`, `Duration`, `plus()`, `minus()` | L’entrée vaut `null` ou `undefined`, est d’un type non pris en charge ou fournit une unité avec une durée qui possède déjà ses propres unités. |
| `unsupportedCalendar` | `yearMonth()`, `monthDay()`, `YearMonth`, `MonthDay` | L’entrée est un `Temporal.PlainYearMonth` ou `PlainMonthDay` utilisant un calendrier non ISO. |
| `invalidPoint` | `compare()`, `earliest()`, `latest()` | La valeur n’est ni un `DateTime`, un `CalendarDate`, un `Time`, un `YearMonth`, un `Date`, un horodatage Unix, un point Temporal ni une chaîne analysable. |
| `conflictingKinds` | `compare()`, `earliest()`, `latest()` | Comparaison de valeurs de types différents, par exemple un `CalendarDate` avec un `DateTime`. |
| `invalidRange` | `mergeRanges()` | Passage d’une valeur non itérable ou d’un élément qui n’est pas une instance de plage lorsque [`@native-dates/plugins/ranges`](/plugins/ranges/) est chargé. |
| `conflictingRanges` | `DateRange`, `DateTimeRange`, `TimeRange`, `subtract()`, `union()`, `mergeRanges()` | Passage d’une plage d’un type à un constructeur de classe, une fonction fabrique ou une opération ensembliste d’un autre type de plage. |

## Codes RangeError

Les erreurs `RangeError` indiquent qu’une valeur ne peut pas être analysée, sort des bornes valides ou demande une unité, un fuseau horaire ou une opération non pris en charge.

### Analyse et valeurs

| Code | Levée par | Cause |
|---|---|---|
| `invalidDateTime` | `datetime()`, `DateTime` | La chaîne ne peut pas être analysée comme une date et heure, ou les champs contiennent des valeurs hors bornes comme le 30 février. |
| `invalidDate` | `date()`, `CalendarDate` | La chaîne ne peut pas être analysée comme une date calendaire, les nombres sont fractionnaires ou les champs sont hors bornes. |
| `missingDay` | `date()`, `CalendarDate` | Un appel numérique `(year, month)` omet l’argument `day`. |
| `invalidTime` | `time()`, `Time` | La chaîne ne peut pas être analysée comme une heure du jour, une heure au format 12 h n’est pas comprise entre 1 et 12 ou les champs horaires sont hors bornes. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | La chaîne ne peut pas être analysée comme un année-mois, les nombres sont fractionnaires ou le mois n’est pas compris entre 1 et 12. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | La chaîne ne peut pas être analysée comme un mois-jour, un séparateur ambigu est passé à `equals()` ou les champs sont hors bornes. |
| `invalidYear` | `MonthDay.in()` | L’année passée à `in()` n’est pas un entier ou dépasse les années prises en charge par Temporal. |
| `invalidDay` | `YearMonth.on()` | Le jour passé à `on()` n’est pas un entier de 1 à 31. |
| `invalidDuration` | `duration()`, `Duration` | Expression de durée en anglais vide ou illisible, durée ISO 8601 invalide ou champs de durée hors bornes. |
| `invalidNumber` | `datetime()`, `duration()`, fonctions d’unités | L’entrée numérique est `NaN`, `Infinity`, `-Infinity` ou une instance `Date` invalide. |
| `conflictingSigns` | `duration()`, `Duration`, `minus()` | La durée mélange des unités positives et négatives qui ne peuvent pas se compenser proprement, comme `'1h -30m'` ou des jours non ancrés moins des heures. |
| `invalidFraction` | `duration()`, `months()`, `times()` | Des fractions de mois ou de nanosecondes ne peuvent pas être converties vers une unité fixe plus petite. |

### Unités, fuseaux horaires et formats

| Code | Levée par | Cause |
|---|---|---|
| `unknownUnit` | Calculs, bornes, arrondi, `set()`, `duration()` | Nom d’unité ou abréviation en anglais non reconnu. |
| `unknownDayOfWeek` | `dayOfWeek()`, `next()`, `previous()`, bornes de semaine, `configure()` | Nom de jour en anglais non reconnu ou numéro du jour de la semaine en dehors de 1 à 7. |
| `unknownSetting` | `configure()` | Clé de réglage passée à `configure()` non reconnue. |
| `unknownWidth` | `configure()` | Une entrée de `weekdayNames` désigne une largeur autre que `narrow`, `short` ou `long`, ou omet la largeur. |
| `unknownZone` | Fonctions fabriques, `in()`, `configure()` | Identifiant de fuseau horaire IANA inconnu, fuseau horaire non textuel ou décalage UTC mal formé. |
| `invalidZoneAliases` | `configure()` | `zoneAliases` n’est ni un objet simple ni `null`. |
| `unknownLocale` | `locale()`, fonctions fabriques, `format()`, `monthNames()`, `weekdayNames()`, `configure()` | L’étiquette de locale, la liste d’étiquettes ou l’en-tête `Accept-Language` contient une étiquette de locale BCP 47 invalide. |
| `unknownFormat` | `format()`, `monthNames()`, `weekdayNames()` | Spécification de format ou options `Intl` invalides, style de durée ou de libellé non pris en charge ou encore jetons non reconnus ou collés en dehors des `[crochets]`. |
| `unsupportedToken` | `format()` | Le motif de jetons demande un champ absent de la valeur, comme `HH` sur un `CalendarDate` ou `YYYY` sur un `Time`. |
| `unknownKind` | `as()`, `DateRange.count()` | Type cible non pris en charge par le récepteur. |

### Calculs et mesures

| Code | Levée par | Cause |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`, `Time`, `YearMonth` | Utilisation d’unités horaires sur un `CalendarDate`, d’unités calendaires sur un `Time` ou d’unités plus petites que le mois sur un `YearMonth`. |
| `cannotAdd` | `plus()`, `add()` | L’addition dépasse la plage de dates représentable par Temporal. |
| `cannotSubtract` | `minus()`, `subtract()` | La soustraction dépasse la plage de dates représentable par Temporal. |
| `cannotSet` | `set()` | La valeur du champ est fractionnaire ou hors bornes pour ce mois calendaire ou cette unité horaire. |
| `cannotRound` | `round()`, `floor()`, `ceil()`, `Time.startOf()`, `Time.startOfNext()`, `Time.startOfPrevious()` | Unité d’arrondi non prise en charge, ou pas d’arrondi ne divisant pas exactement l’unité supérieure. |
| `missingAnchor` | `Duration.balance()`, `total()`, `compare()` | Une durée non ancrée exige une date calendaire de départ pour convertir des mois ou des années en semaines, jours ou unités horaires. |
| `cannotBalance` | `Duration.balance()` | L’équilibrage d’une durée déborde ou échoue lors de l’arrondi Temporal. |
| `cannotTotal` | `Duration.total()`, `until()`, `since()` | Le calcul d’une durée totale déborde ou emploie une unité non prise en charge. |
| `missingPoints` | `earliest()`, `latest()` | Appel sans argument ou avec un tableau vide. |
| `unsupportedComparison` | `CalendarDate`, `Time`, `YearMonth`, `MonthDay`, plages | Conversion numérique via `valueOf()`, `+` unaire, `-`, `<` ou `>` sur un type dépourvu de valeur numérique d’époque Unix. |

### Plages

| Code | Levée par | Cause |
|---|---|---|
| `invalidRange` | `DateRange`, `DateTimeRange`, `to()` | La borne `end` de la plage est antérieure à `start`. |
| `invalidStep` | `every()`, `split()` | La durée de pas passée à `every()` ou `split()` est nulle ou négative. |
| `unsupportedIntersection` | `TimeRange.intersection()` | Deux plages horaires (dont au moins une franchit minuit) se chevauchent sur deux fenêtres distinctes qu’une seule `TimeRange` ne peut pas représenter. |
| `unsupportedUnion` | `TimeRange.union()`, `mergeRanges()` | Les plages horaires couvrent l’ensemble des 24 heures, ce qu’une seule `TimeRange` ne peut pas représenter. |
| `unsupportedZone` | `TimeRange.in()` | Appel de `in()` sur une `TimeRange`, qui ne possède aucune date calendaire à placer dans un fuseau horaire. |

### Plugins

| Code | Levée par | Cause |
|---|---|---|
| `missingPlugin` | Fonctions fabriques, `configure()` | Utilisation de `loose`, `dayFirst`, `format` ou `zoneAliases` avant d’importer le plugin correspondant. |
| `missingTemporal` | Fonctions fabriques, constructeurs de classe, `configure({ zone })` | Indication présente uniquement en développement lorsque `globalThis.Temporal` est absent et que `@native-dates/polyfill` n’a pas été chargé (les builds de production suppriment cette vérification et lèvent la `ReferenceError` native du moteur). |
| `immutable` | Setters hérités de `DateTime` | Appel d’un setter mutateur de `Date` tel que `setHours()` lorsque [`@native-dates/plugins/legacy-date`](/plugins/legacy-date/) est chargé. |
