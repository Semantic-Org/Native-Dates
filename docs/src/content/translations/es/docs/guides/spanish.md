---
source: '3d84e5239614'
reviewed: false
title: Fechas y horas en español
lede: Maneja las diferencias regionales entre España y América sin tropezar con preposiciones en patrones ni cambios horarios locales.
---

Como la etiqueta `'es'` aplica el lunes y las 24 horas de España, en Latinoamérica o EE. UU. conviene combinar [Internacionalización](/guides/internationalization/) con etiquetas regionales explícitas.

## España, Latinoamérica y EE. UU.

España usa reloj de 24 horas, mientras Latinoamérica y el español de EE. UU. usan 12 horas con distinta puntuación, separadores y *setiembre* en Perú:

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');
cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('medium', 'es-CL'); // '16-09-2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

El inicio de semana también divide al idioma en dos bloques, e incluso `'es-419'` empieza en lunes a diferencia de México o Colombia:

| Etiquetas | Inicio y hora | Convención regional |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Semana desde el lunes, reloj de 24 horas y septiembre abreviado como *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Semana desde el domingo y periodo de 12 horas sin espacio interno. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Semana desde el lunes y periodo con espacio, con fechas cortas con guiones en Chile. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Semana desde el domingo, formato medio numérico en Colombia y *setiembre* en Perú. |
| `'es-PR'` | `7`, `5:30 p. m.` | Semana desde el domingo y fechas numéricas en orden mes/día/año. |

Al agrupar reportes semanales en base de datos, fija el lunes con `startOf('week', 'monday')` para unificar Madrid y Ciudad de México:

```js
import { date } from 'native-dates';

const miercoles = date('2026-11-18');
miercoles.locale('es-ES').startOf('week').toString(); // '2026-11-16'
miercoles.locale('es-MX').startOf('week').toString(); // '2026-11-15'
miercoles.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Preposiciones, minúsculas y abreviaturas

Las fechas largas unen sus partes con *de*, *del* y *a las*. Encierra esos nexos entre corchetes para que letras sueltas no lancen `unknownFormat`:

```js
import { datetime } from 'native-dates';

const evento = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');
// evento.format('D de MMMM de YYYY') lanza RangeError [unknownFormat]
evento.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
evento.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

Meses, días y marcadores como `a` conservan minúsculas con *a. m.* y *p. m.*, así que capitaliza solo la letra inicial en títulos.

El formato estrecho nativo repite la M en *martes* y *miércoles*. Con `'dd'` obtienes dos letras, y [`configure()`](/api/configure/) define la X clásica o el ordinal primero:

```js
import { configure, date, weekdayNames } from 'native-dates';

const etiqueta = date('2026-05-01').format('full', 'es-ES');
// 'viernes, 1 de mayo de 2026'
etiqueta[0].toUpperCase() + etiqueta.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']
configure({
  weekdayNames: {
    es: {
      narrow: {
        mon: 'L',
        tue: 'M',
        wed: 'X',
        thu: 'J',
        fri: 'V',
        sat: 'S',
        sun: 'D',
      },
    },
  },
  ordinals: { es: (dia) => (dia === 1 ? '1.º' : dia) },
});
weekdayNames('narrow', 1, 'es-MX'); // ['L', 'M', 'X', 'J', 'V', 'S', 'D']
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## Lectura de fechas y meses en español

El paquete base rechaza fechas con barras y [`@native-dates/plugins/loose`](/plugins/loose/) asume mes/día/año. Pasa `dayFirst: true` con barras, puntos o guiones chilenos, salvo en formularios de Puerto Rico:

```js
import '@native-dates/plugins/loose';
import { date, dayMonth, monthDay, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true }).toString(); // '2026-06-11'
date('06/11/2026', { loose: true, dayFirst: true }).toString(); // '2026-11-06'
date('16-09-2026', { loose: true, dayFirst: true }).toString(); // '2026-09-16'
```

:::warning[Meses en español dentro de fechas completas]
Con `{ loose: true }`, las fechas completas delegan el mes al motor de JavaScript en inglés. Ocho abreviaturas coinciden por azar, pero *enero*, *abril*, *agosto*, *diciembre* y frases con *de* devuelven `null`.
:::

Las fechas parciales mes-día y año-mes reconocen los doce meses y la variante *setiembre*, salvo *del*, mientras `dayMonth()` lee pares numéricos sin plugins:

```js
date('15 nov 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-15'
date('15 ene 2026', { loose: true, locale: 'es' }); // null
date('16 de noviembre de 2026', { loose: true, locale: 'es' }); // null
monthDay('15 de enero', { loose: true, locale: 'es' }).toString(); // '01-15'
monthDay('16 set.', { loose: true, locale: 'es-PE' }).toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' }).toString(); // '2026-01'
dayMonth('16/11').toString(); // '11-16'
```

## Zonas horarias y cambios de hora

Desde 2022 casi todo México sigue en UTC-6 salvo la frontera y Quintana Roo, mientras CST y EST cambian en verano frente a Bogotá o Lima:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

El [plugin de zonas](/plugins/zones/) resuelve Bogotá, Cancún, Córdoba y Canary, pero `'San Juan'` apunta a Argentina y nombres como CDMX, La Habana o Quito requieren `zoneAliases`:

```js
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
configure({
  zoneAliases: {
    cdmx: 'America/Mexico_City',
    habana: 'America/Havana',
    art: 'America/Argentina/Buenos_Aires',
    cot: 'America/Bogota',
    clt: 'America/Santiago',
  },
});
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
```

En Chile y Cuba el cambio estival salta de 00:00 a 01:00. Llamar a `at('00:00', zona)` o `startOf('day')` aterriza en 01:00 sin caer al día previo:

```js
import { date } from 'native-dates';

const inicioPrimavera = date('2026-09-06').at('00:00', 'America/Santiago');
inicioPrimavera.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
inicioPrimavera.hoursInDay; // 23
```

## Tiempo relativo por día o por instante

El español nombra cinco días seguidos desde *anteayer* hasta *pasado mañana*, que `CalendarDate` devuelve hasta dos días mientras `DateTime` cuenta horas reales:

```js
import { date, datetime, today } from 'native-dates';

const referencia = date('2026-11-16');
referencia.minus(2, 'days').from(referencia, 'es'); // 'anteayer'
referencia.minus(1, 'day').from(referencia, 'es'); // 'ayer'
referencia.plus(2, 'days').from(referencia, 'es'); // 'pasado mañana'
const instante = datetime('2026-11-16T12:00:00Z', 'UTC');
instante.minus(2, 'days').from(instante, 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

En servidores compartidos, pasa `today(zona)` en vez de `fromNow()` para que el salto entre *hoy* y *mañana* respete la zona de cada usuario.
