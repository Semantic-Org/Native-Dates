---
source: 9de557f3ce5d
title: Sélecteurs de dates et interface
lede: Reliez les champs natifs du navigateur et les sélecteurs de dates à Native Dates tout en isolant les composants Date historiques aux frontières de votre interface.
---

Conservez des valeurs Native Dates dans l’état de votre application et votre logique métier.

Ne convertissez en chaînes ISO ou en objets `Date` JavaScript natifs qu’à la frontière des composants où un champ du navigateur ou un composant tiers les attend. Les règles de fuseaux horaires et les calculs calendaires restent ainsi isolés des particularités des bibliothèques d’interface.

## Champs HTML natifs

Les contrôles HTML natifs de date et d’heure lisent et écrivent directement des chaînes ISO standard. Ils n’exigent aucune bibliothèque de sélecteur et ne décalent jamais un jour calendaire d’un fuseau horaire à l’autre.

| Contrôle | Écriture dans le champ | Lecture vers le noyau |
|---|---|---|
| `<input type="date">` | `d.toString()` | Passez les chaînes non vides à [`date()`](/api/date-fn/) pour obtenir une date calendaire sans fuseau horaire. |
| `<input type="time">` | `t.format('HH:mm')`, ou `t.toString()` avec `step="1"` | Passez `value` à [`time()`](/api/time-fn/) pour obtenir une heure du jour sans fuseau horaire. |
| `<input type="month">` | `ym.toString()` | Passez `value` à [`yearMonth()`](/api/year-month-fn/) pour une période de facturation ou une expiration de carte. |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | Passez `value` et un fuseau horaire à [`datetime()`](/api/datetime-fn/) pour obtenir un instant précis. |

Liez votre état à la valeur et aux bornes du champ, puis analysez la chaîne modifiée avec la fonction fabrique correspondante :

```js
import { date, time, today, yearMonth } from 'native-dates';

const due = date('2026-11-16');
const opens = time('9:30am');
const billing = yearMonth('2026-11');

// <input type="date" value={due.toString()} min={today().toString()}>
due.toString(); // '2026-11-16'

// <input type="time" value={opens.format('HH:mm')}>
opens.format('HH:mm'); // '09:30'

// <input type="month" value={billing.toString()}>
billing.toString(); // '2026-11'
```

Lorsqu’un formulaire recueille une date et une heure du jour dans deux champs distincts, gardez chaque contrôle lié à son propre type. Assemblez-les avec [`at()`](/api/calendar-date/#at) au moment de créer un instant :

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[Vérifiez les champs vides avant l’analyse]
Effacer un champ HTML émet une chaîne vide, et saisir du texte dans un sélecteur textuel peut produire un objet `Date` invalide. Vérifiez les valeurs vides ou `NaN` avant d’appeler une fonction fabrique, car le noyau lève une erreur au lieu de prendre la date du jour par défaut.
:::

## React Day Picker

React Day Picker utilise des objets `Date` JavaScript natifs réglés à minuit local pour représenter les jours sélectionnés. Gardez un [`CalendarDate`](/api/calendar-date/) dans votre état et convertissez-le uniquement au passage des props :

```jsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { date, today } from 'native-dates';

function DueDateField() {
  const [due, setDue] = useState(() => date('2026-11-16'));

  return (
    <DayPicker
      mode="single"
      selected={due?.toJSDate()}
      disabled={{ before: today().toJSDate() }}
      onSelect={(picked) => setDue(picked ? date(picked) : null)}
    />
  );
}
```

Pour la sélection de plages, isolez la conversion dans deux courtes fonctions utilitaires et stockez une [`DateRange`](/api/ranges/). Pendant que l’utilisateur choisit ses bornes, la date de fin peut être `undefined` ou identique au début ; se replier sur `picked.to ?? picked.from` garde la plage valide :

```js
import { date, dateRange } from 'native-dates';

function toPickerRange(range) {
  if (!range) return undefined;
  return { from: range.start.toJSDate(), to: range.end.toJSDate() };
}

function fromPickerRange(picked) {
  if (!picked?.from) return null;
  return dateRange(date(picked.from), date(picked.to ?? picked.from));
}

const stay = dateRange('2026-11-16', '2026-11-20');
const pickerValue = toPickerRange(stay);
const restored = fromPickerRange(pickerValue);

restored.count('days'); // 5
restored.toString(); // '2026-11-16/2026-11-20'
```

Par défaut, [`toJSDate()`](/api/calendar-date/#tojsdate) et `date()` suivent le fuseau horaire du navigateur. Si votre application remplace le fuseau horaire par défaut via [`configure()`](/api/configure/), passez le fuseau horaire actif du navigateur aux deux appels pour que la grille du calendrier reste alignée :

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X et sélecteurs utilisant Date

Avec `AdapterDateFns`, les sélecteurs MUI X échangent des objets `Date` JavaScript natifs via leurs props de valeur et de changement. Gardez cet adaptateur dans `LocalizationProvider` et un fin composant enveloppe afin que les objets `Date` historiques n’entrent jamais dans l’état applicatif.

Les sélecteurs avec saisie clavier déclenchent le gestionnaire de changement à chaque frappe et passent un `Date` invalide tant que la saisie est en cours. Vérifiez `Number.isNaN()` avant toute conversion :

```jsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { date, today } from 'native-dates';

function CalendarDatePicker({ value, onChange, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        {...props}
        value={value ? value.toJSDate() : null}
        minDate={today().toJSDate()}
        onChange={(next) => {
          if (!next || Number.isNaN(next.getTime())) {
            onChange(null);
            return;
          }
          onChange(date(next));
        }}
      />
    </LocalizationProvider>
  );
}
```

Appliquez le même utilitaire de frontière pour un sélecteur de date et heure, en passant un fuseau horaire IANA explicite à [`datetime()`](/api/datetime-fn/) afin que l’instant renvoyé reste ancré :

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## Formulaires et validation de schémas

Des outils de formulaires comme React Hook Form et Zod s’intègrent proprement lorsque les champs restent des chaînes pendant l’édition. Analysez-les en valeurs typées au moment de la validation du schéma.

Pour des champs ISO stricts, transformez chaque chaîne dans le schéma puis exécutez vos règles métier directement sur les types analysés :

```js
import { z } from 'zod';
import { date } from 'native-dates';

const isoDate = z.string().transform((raw, ctx) => {
  try {
    return date(raw);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid YYYY-MM-DD date' });
    return z.NEVER;
  }
});

const bookingSchema = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine(({ checkIn, checkOut }) => checkOut.isAfter(checkIn), {
    message: 'Check-out must come after check-in',
    path: ['checkOut'],
  });
```

Lorsque les utilisateurs saisissent des dates informelles comme « Nov 16, 2026 » dans un champ texte, chargez le [plugin loose](/plugins/loose/) et passez `{ loose: true }`. Les chaînes illisibles renvoient `null` au lieu de lever une erreur, ce qui évite un bloc de gestion d’erreur :

```js
import '@native-dates/plugins/loose';
import { date, isCalendarDate } from 'native-dates';

function parseTypedDate(raw, locale = 'en-US') {
  const parsed = date(raw, { loose: true, locale });
  return isCalendarDate(parsed) ? parsed : null;
}

parseTypedDate('Nov 16, 2026')?.toString(); // '2026-11-16'
parseTypedDate('not a date'); // null
```

Les gardes de type comme [`isCalendarDate()`](/api/kind-of/) et `isDateTime()` s’intègrent aussi directement dans vos règles de schéma personnalisées pour valider un état déjà analysé.

## Graphiques, tableaux et vues Date en lecture seule

Les bibliothèques de graphiques et de tableaux lisent souvent les horodatages via des accesseurs natifs comme `getTime()` et `getHours()`.

Importez le [plugin legacy-date](/plugins/legacy-date/) une seule fois au démarrage pour attacher ces accesseurs en lecture seule sur [`DateTime`](/api/date-time/). Les accesseurs locaux s’évaluent dans le fuseau horaire de l’instance plutôt que dans celui de la machine hôte, tandis que les setters mutateurs lèvent une erreur :

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// Passez des valeurs DateTime aux accesseurs Date en lecture seule
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// Triez les lignes selon un même type du noyau
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

Appelez [`compare()`](/api/compare/) dans la fonction de tri de votre tableau pour toute colonne contenant un seul type, par exemple uniquement des dates calendaires ou uniquement des instants. Mélanger différents types dans une même comparaison lève une erreur.

:::tip[Quand un composant vérifie instanceof Date]
Le plugin `legacy-date` étend uniquement `DateTime` et n’usurpe jamais l’identité d’un `Date` natif. Si un graphique ou un tableau contrôle `instanceof Date` ou modifie les valeurs sur place, passez plutôt `dt.toJSDate()` ou `dt.epochMilliseconds` à la frontière de la série.
:::

## Envoyer vers des API et des bases de données

Une fois les valeurs du formulaire analysées à la frontière de l’interface, passez-les directement à `JSON.stringify()` sans conversion manuelle. Consultez [Stockage et échange](/guides/storing-and-sending/) pour les formats d’échange ISO et la reconstruction des objets depuis JSON ou une base de données.
