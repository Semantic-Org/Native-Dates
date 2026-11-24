---
source: "a214ff99444f"
title: Francés
lede: Formatea e interpreta fechas en francés respetando los relojes regionales y el inicio de semana.
---

`'fr'` a secas usa las convenciones del francés metropolitano. Especifica un locale regional como `'fr-CA'` (consulta [Localización](/guides/localization/)) cuando tus usuarios esperen el orden de fechas, los separadores horarios y el inicio de semana propios de su región.

## Variantes regionales

El orden de la fecha corta, los separadores horarios y el primer día de la semana varían entre regiones francófonas:

| Locale | Formato corto | Inicio de semana | Diferencias regionales |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — lunes | Separadores con barra, reloj de 24 horas y julio abreviado como `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — domingo | Orden ISO en Canadá, notación horaria con `'h'` espaciada y julio como `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — lunes | Separadores con punto y año de dos dígitos en `'short'`, cuatro dígitos con `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — lunes | Día sin cero inicial y año de dos dígitos en `'short'`, cuatro dígitos con `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — sábado | Semana desde el sábado y reloj de 12 horas por defecto. |

Pasa el locale regional completo para que los presets utilicen la puntuación local:

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

El francés canadiense empieza la semana en domingo, y [`startOf('week')`](/api/calendar-date/#startof) junto con [`weekdayNames()`](/api/month-names/#weekdaynames) siguen esa regla automáticamente. Fija el lunes cuando los informes de base de datos exijan semanas ISO:

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Tipografía francesa y tokens de formato

Encierra las letras literales entre corchetes dentro de patrones como `'HH[h]mm'`. Escribir `'HHhmm'` sin corchetes lanza [`unknownFormat`](/api/errors/#units-zones-and-formats), mientras que una *à* acentuada pasa tal cual sin escapar:

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

En francés, el primer día del mes se escribe *1er* y los demás días llevan números cardinales. Registra una regla de [`ordinals`](/api/configure/) en `'fr'` y todos los locales regionales la heredan automáticamente:

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

Al igual que en español, los días de la semana y los meses van en minúscula en francés. Pon en mayúscula solo la primera letra cuando una fecha abra un encabezado.

No escribas un punto después de `MMM`: los meses abreviados ya traen su propio punto, mientras que nombres cortos como *mars*, *mai*, *juin* y *août* no llevan ninguno:

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## Interpretar fechas y horas en francés

El núcleo lee directamente cadenas ISO canadienses y horas en formato francés como `'14h30'`. Con [el plugin loose](/plugins/loose/), los locales franceses interpretan automáticamente fechas día/mes/año con barras o puntos, ordinales y fechas escritas con el mes en letra:

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

Las abreviaturas de meses deben corresponder a un único mes, así que *juil* se interpreta como julio mientras que *jui* devuelve `null` por coincidir tanto con *juin* como con *juillet*.

Las fechas parciales reconocen nombres de meses y abreviaturas acentuadas en modo loose. [`dayMonth()`](/api/month-day-fn/#daymonth) y [`duration()`](/api/duration-fn/) funcionan en el núcleo sin plugins:

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## Zonas horarias

Norteamérica cambia la hora dos o tres semanas antes que Europa en primavera y una semana después en otoño, lo que reduce la diferencia entre París y Montreal de seis horas a cinco.

Marruecos además vuelve a UTC+0 durante el Ramadán, así que convierte instantes con [`in()`](/api/date-time/#in) en lugar de restar un número fijo de horas:

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

Con [el plugin zones](/plugins/zones/), las principales ciudades francófonas y las abreviaturas canadienses se resuelven directamente sin definir alias:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## Fechas relativas y espacios de no separación

Las fechas de calendario usan *avant-hier* para anteayer y *après-demain* para pasado mañana, mientras que [`DateTime`](/api/date-time/) cuenta unidades exactas para que las horas nocturnas no se muestren como ayer.

En las aserciones de pruebas, ten en cuenta el apóstrofo tipográfico de *aujourd’hui* y los espacios de no separación (fino o normal) dentro de las duraciones cortas:

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
