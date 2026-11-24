---
source: "7c459605683f"
title: Español
lede: Configura formatos de fecha, relojes de 12 o 24 horas e inicios de semana entre España, América Latina y Estados Unidos.
---

`'es'` a secas aplica las convenciones de España: semana iniciada en lunes y reloj de 24 horas. Si tu aplicación atiende a América Latina o Estados Unidos, conviene pasar un locale regional como `'es-MX'` (consulta [Localización](/guides/localization/)).

## España, América Latina y Estados Unidos

En España los presets usan reloj de 24 horas. En América Latina y el español de Estados Unidos predomina el formato de 12 horas, pero cada región cambia el espaciado de `a. m.`/`p. m.`, los separadores de fecha y grafías locales como *setiembre* en Perú:

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

El inicio de semana también cambia según el país. Ten en cuenta que el locale genérico `'es-419'` empieza en lunes, a diferencia de México o Colombia:

| Locales | Inicio y reloj | Convención regional |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Semana desde el lunes, reloj de 24 horas y septiembre abreviado como *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Semana desde el domingo y marcador de 12 horas sin espacio interno. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Semana desde el lunes y marcador con espacio; en Chile la fecha corta usa guiones. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Semana desde el domingo, formato medio numérico en Colombia y *setiembre* en Perú. |
| `'es-PR'` | `7`, `5:30 p. m.` | Semana desde el domingo y orden numérico mes/día/año como en Estados Unidos. |

Fija el lunes con [`startOf('week', 'monday')`](/api/calendar-date/#startof) al agrupar informes semanales en base de datos para que Madrid y Ciudad de México queden en el mismo bloque:

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Preposiciones, minúsculas y días de la semana

En patrones de tokens personalizados, encierra los conectores literales como `[de]`, `[del]` o `[a las]` entre corchetes; dejar letras sueltas sin escapar lanza [`unknownFormat`](/api/errors/#units-zones-and-formats):

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

`Intl` devuelve meses, días de la semana y marcadores horarios en minúscula. Cuando una fecha abra un título o una tarjeta, convierte a mayúscula solo el primer carácter.

Para evitar la colisión de la inicial `M` entre martes y miércoles en cuadrículas compactas, `'dd'` y `weekdayNames('narrow')` usan abreviaturas de dos letras de serie. Si prefieres `X` para el miércoles o `1.º` para el primero de mes, configúralo con [`configure()`](/api/configure/):

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

## Interpretar fechas y meses en español

Con [el plugin loose](/plugins/loose/), las fechas numéricas adoptan el orden del locale activo: España y Chile leen día/mes/año de forma automática, mientras que Puerto Rico lee mes/día/año:

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

El modo loose también interpreta fechas completas con conectores, días de la semana al principio, *setiembre* con `'es-PE'` y horas en formato de 12 horas con espacio (`p. m.`), mientras que [`dayMonth()`](/api/month-day-fn/#daymonth) funciona en el núcleo sin plugins para pares numéricos:

```js
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('mar, 16 jun 2026', { loose: true, locale: 'es' })?.toString(); // '2026-06-16'
datetime('el 16 de noviembre de 2026 a las 14:30', {
  loose: true,
  locale: 'es',
  zone: 'Europe/Madrid',
})?.hour; // 14
time('5:30 p. m.', { loose: true, locale: 'es-MX' })?.toString(); // '17:30:00'
dayMonth('16/11').toString(); // '11-16'
monthDay('16 set.', { loose: true, locale: 'es-PE' })?.toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-01'
```

## Zonas horarias y saltos de horario de verano a medianoche

La mayor parte de México permanece en UTC-6 todo el año, salvo las ciudades fronterizas del norte y Quintana Roo. `CST` depende del locale activo: apunta a Chicago por defecto y a La Habana cuando el locale es `'es-CU'`:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

El [plugin zones](/plugins/zones/) resuelve directamente nombres de ciudades en inglés (como `'Mexico City'`), grandes ciudades hispanohablantes y siglas latinoamericanas como `'CDMX'` o `'COT'`. `San Juan` apunta a Puerto Rico con `'es-PR'` y a Argentina en el resto de los locales:

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

Chile y Cuba inician el horario de verano a medianoche, saltando directamente de las 00:00 a las 01:00. Llamar a [`at('00:00', zone)`](/api/calendar-date/#at) o a `startOf('day')` avanza limpiamente a la 01:00 de ese mismo día:

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## Tiempo relativo

Al comparar fechas de calendario, [`CalendarDate`](/api/calendar-date/) usa expresiones relativas de día desde *anteayer* hasta *pasado mañana*, mientras que [`DateTime`](/api/date-time/) mide el tiempo transcurrido y devuelve conteos numéricos:

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

En servidores compartidos, pasa [`today(zone)`](/api/date-fn/#today) en lugar de [`fromNow()`](/api/calendar-date/#fromnow) para que el cambio de día entre *hoy* y *mañana* siga la zona horaria del usuario.
