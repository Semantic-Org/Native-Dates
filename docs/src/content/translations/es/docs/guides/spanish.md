---
source: '5fd1889df7de'
reviewed: false
title: Español
lede: Maneja formatos regionales, inicios de semana y cambios horarios en España y América.
---

La etiqueta `'es'` usa el inicio de semana en lunes y el reloj de 24 horas de España. En aplicaciones para Latinoamérica o Estados Unidos, pasa una etiqueta regional como `'es-MX'` en [Localización](/guides/localization/).

## España, Latinoamérica y EE. UU.

España usa reloj de 24 horas, mientras Latinoamérica y el español de EE. UU. usan 12 horas con distinta puntuación, separadores y *setiembre* en Perú:

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

El primer día de la semana también varía entre países, y la etiqueta genérica `'es-419'` empieza en lunes a diferencia de México o Colombia:

| Etiquetas | Inicio y hora | Convención regional |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Semana desde el lunes, reloj de 24 horas y septiembre abreviado como *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Semana desde el domingo y periodo de 12 horas sin espacio interno. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Semana desde el lunes y periodo con espacio, con fechas cortas con guiones en Chile. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Semana desde el domingo, formato medio numérico en Colombia y *setiembre* en Perú. |
| `'es-PR'` | `7`, `5:30 p. m.` | Semana desde el domingo y fechas numéricas en orden mes/día/año. |

Fija el lunes con `startOf('week', 'monday')` al agrupar reportes semanales para que Madrid y Ciudad de México compartan la misma clave:

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Preposiciones, minúsculas y días de la semana

Las fechas largas unen sus partes con *de*, *del* y *a las*. Encierra esos conectores entre corchetes en patrones personalizados para evitar `unknownFormat`:

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

Meses, días y marcadores horarios van en minúsculas en español. Capitaliza solo la primera letra cuando una fecha encabece un título.

Las iniciales de una letra repiten *M* entre *martes* y *miércoles*. Con `'dd'` obtienes dos letras sin colisión, y [`configure()`](/api/configure/) permite personalizar el miércoles o *1.º* el primer día del mes:

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## Lectura de fechas y meses en español

El paquete base rechaza fechas con barras y [el plugin flexible](/plugins/loose/) usa orden mes/día/año por defecto. Pasa `dayFirst: true` para barras, puntos o guiones chilenos, salvo en entradas de Puerto Rico:

```js
import '@native-dates/plugins/loose';
import { date, dayMonth, monthDay, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true }).toString(); // '2026-06-11'
date('06/11/2026', { loose: true, dayFirst: true }).toString(); // '2026-11-06'
date('16-09-2026', { loose: true, dayFirst: true }).toString(); // '2026-09-16'
```

`dayMonth()` lee pares numéricos sin plugins, y las fechas parciales en modo flexible reconocen los meses en español, incluido *setiembre* en Perú:

```js
dayMonth('16/11').toString(); // '11-16'
monthDay('15 de enero', { loose: true, locale: 'es' }).toString(); // '01-15'
monthDay('16 set.', { loose: true, locale: 'es-PE' }).toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' }).toString(); // '2026-01'
```

## Zonas horarias y cambios a medianoche

La mayor parte de México permanece en UTC-6 todo el año salvo la frontera norte y Quintana Roo, mientras `'CST'` apunta a Chicago y observa horario de verano:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

El [plugin de zonas](/plugins/zones/) resuelve Bogotá, Cancún y Córdoba directamente, mientras `'San Juan'` apunta a Argentina en lugar de Puerto Rico. Registra abreviaturas locales en `zoneAliases`:

```js
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'

configure({
  zoneAliases: { cdmx: 'America/Mexico_City', cot: 'America/Bogota' },
});
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
```

Chile y Cuba inician el horario de verano a medianoche, saltando de 00:00 a 01:00. Llamar a `at('00:00', zona)` o `startOf('day')` cae en 01:00 de esa misma fecha:

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## Tiempo relativo

El español nombra cinco días seguidos desde *anteayer* hasta *pasado mañana*. `CalendarDate` devuelve esas palabras, mientras `DateTime` cuenta horas reales:

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

En servidores compartidos, pasa `today(zona)` en vez de `fromNow()` para que el cambio entre *hoy* y *mañana* siga la medianoche de cada usuario.
