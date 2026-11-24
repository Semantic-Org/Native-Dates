---
source: "8dc73060ce55"
title: parse
lede: Interpreta de forma estricta cadenas de fecha y hora de estructura fija usando patrones de tokens con la opción format.
---

## Interpretación con un patrón de formato

El núcleo interpreta por defecto cadenas estrictas en ISO 8601, mientras que [`@native-dates/plugins/loose`](/plugins/loose/) lee texto libre en el locale activo. Importar este plugin añade la opción `{ format }` para cadenas de estructura fija como extractos bancarios y logs de servidor.

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

La interpretación ISO estricta sigue siendo el comportamiento predeterminado siempre que omitas la opción `format`. Llamar a cualquier función de fábrica con `{ format }` antes de importar este plugin lanza un error [`missingPlugin`](/api/errors/#plugins).

## Coincidencia estricta y formatos con nombre

Los patrones usan el [vocabulario de tokens](/guides/formatting/#token-patterns) del núcleo. Los tokens de ancho fijo exigen el número exacto de dígitos, y el texto literal debe coincidir con toda la cadena distinguiendo mayúsculas de minúsculas.

Las fechas imposibles como el 30 de febrero y los días de la semana que no corresponden a la fecha lanzan un error en lugar de avanzar al mes siguiente. Los tokens repetidos o los campos contradictorios de reloj de 12 y 24 horas se rechazan del mismo modo.

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

Los patrones con nombre registrados en [`configure()`](/api/configure/) sirven tanto para interpretar como para formatear. Las funciones de rangos reenvían la opción `format` a ambos extremos y también admiten una duración como segundo argumento.

## Nombres localizados y ordinales

Los nombres de meses, días de la semana, períodos del día y ordinales siguen el locale activo. Tanto las formas independientes como las flexionadas de los meses se reconocen sin distinguir mayúsculas de minúsculas, por lo que las fechas en ruso o en griego se interpretan sin reglas adicionales.

El locale activo sigue el mismo orden de prioridad que el formateo: la opción en la llamada, luego [`configure()`](/api/configure/) y por último el valor predeterminado del entorno. Pasa un locale explícito siempre que el texto de entrada provenga de un idioma fijo, como logs de servidor en inglés.

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

Los tokens ordinales en inglés validan el sufijo exacto, de modo que `'24st'` se rechaza, mientras que los [nombres de días de la semana](/api/configure/) personalizados registrados en la configuración de la aplicación se aplican automáticamente.

## Semanas ISO y fechas ordinales

Los patrones de día ordinal del año y de semana ISO se resuelven directamente en fechas de calendario o instantes. Junto a un token de semana, `YYYY` lee el año de semana ISO en lugar del año de calendario que escribe `format()`, por lo que `'2026-W01-1'` corresponde al 29 de diciembre de 2025.

Los años bisiestos y los años de 52 o 53 semanas se comprueban de forma estricta, y omitir el día de la semana en una semana ISO sitúa el resultado en lunes.

```js
import { date } from 'native-dates';

date('2026-328', { format: 'YYYY-DDDD' }).toString(); // '2026-11-24'
date('2026-W48-2', { format: 'YYYY-[W]WW-E' }).toString(); // '2026-11-24'
date('2026-W48', { format: 'YYYY-[W]WW' }).toString(); // '2026-11-23'
date('2026-W01-1', { format: 'YYYY-[W]WW-E' }).toString(); // '2025-12-29'
```

## Zonas horarias y marcas de tiempo

Los patrones con un token de desplazamiento fijan un instante exacto y lo convierten a tu zona horaria de destino. Los tokens `z` dentro del patrón resuelven identificadores IANA y, con [`@native-dates/plugins/zones`](/plugins/zones/), nombres de ciudades en inglés o abreviaturas como JST, pero no etiquetas arbitrarias de desplazamiento como GMT+2.

Una zona indicada en la cadena se conserva en el resultado a menos que pases una opción `zone` de destino para convertirlo. Si una cadena incluye a la vez un desplazamiento y un nombre de zona que no concuerdan para ese instante, la interpretación lanza un error.

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

Las marcas de tiempo Unix se interpretan con `X` para segundos enteros y `x` para milisegundos. Pasar un patrón de solo fecha a una [función de fecha y hora](/api/datetime-fn/) sitúa el instante al comienzo de ese día en la zona horaria de destino.

## Combinación con el modo loose

Carga [`@native-dates/plugins/loose`](/plugins/loose/) junto con este plugin para devolver `null` en lugar de lanzar un error cuando el texto de entrada no coincide con el formato. Los valores ausentes, los números, las fechas imposibles y las transiciones rechazadas del horario de verano devuelven `null` en las funciones de fábrica, mientras que las instancias existentes de fecha y hora pasan sin cambios.

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

:::note[Los datos no válidos devuelven null; los patrones no válidos siguen lanzando error]
El modo loose solo convierte en `null` las cadenas de entrada que no coinciden. Un patrón vacío o incompleto lanza [`unknownFormat`](/api/errors/#units-zones-and-formats), y un token que el tipo de destino no posee lanza [`unsupportedToken`](/api/errors/#units-zones-and-formats).
:::

## Tokens admitidos

Los tokens siguen el vocabulario de formateo, y los espacios al principio y al final se eliminan automáticamente a menos que el propio patrón empiece o termine con espacios.

| Token | Ejemplo | Qué reconoce |
|---|---|---|
| `YYYY` | `'2026'` | Año de calendario de cuatro dígitos, o año de semana ISO si acompaña a `W` o `WW`. |
| `YY` | `'26'` | Año de dos dígitos: del 69 al 99 se lee como 1969–1999 y del 00 al 68 como 2000–2068. |
| `M`, `MM` | `'9'`, `'09'` | Número de mes del 1 al 12, sin relleno o con cero a la izquierda. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Nombre localizado abreviado o completo del mes gregoriano, incluidas las formas flexionadas. |
| `D`, `DD` | `'6'`, `'06'` | Día del mes del 1 al 31, sin relleno o con cero a la izquierda. |
| `Do` | `'24th'`, `'6.'` | Día del mes con ordinales en inglés o el marcador de día del locale activo. |
| `DDD`, `DDDD` | `'1'`, `'328'` | Día ordinal ISO del año del 1 al 366, sin relleno o con ceros hasta tres dígitos. |
| `W`, `WW` | `'5'`, `'48'` | Semana ISO del año del 1 al 53, sin relleno o con cero a la izquierda. |
| `E` | `'2'` | Día ISO de la semana del 1 (lunes) al 7 (domingo). |
| `d` | `'0'` | Día de la semana del 0 (domingo) al 6 (sábado). |
| `dd`, `ddd`, `dddd` | `'Tu'`, `'Tue'`, `'Tuesday'` | Nombre más corto, abreviado o completo del día de la semana en el locale activo. |
| `H`, `HH` | `'9'`, `'09'` | Hora en reloj de 24 horas del 0 al 23, sin relleno o con cero a la izquierda. |
| `h`, `hh` | `'9'`, `'09'` | Hora en reloj de 12 horas del 1 al 12, sin relleno o con cero a la izquierda. |
| `m`, `mm` | `'5'`, `'05'` | Minuto del 0 al 59, sin relleno o con cero a la izquierda. |
| `s`, `ss` | `'8'`, `'08'` | Segundo del 0 al 59, sin relleno o con cero a la izquierda. |
| `S`, `SS`, `SSS` | `'5'`, `'25'`, `'250'` | Fracciones de segundo en décimas, centésimas o milisegundos. |
| `A`, `a` | `'PM'`, `'pm'` | AM o PM en inglés sin distinguir mayúsculas de minúsculas, o el período del día del locale activo. |
| `Z`, `ZZ` | `'-05:00'`, `'-0500'` | Desplazamiento UTC con o sin dos puntos, o `Z` para UTC. |
| `z`, `zz` | `'UTC'`, `'JST'` | Identificador de zona IANA sin espacios, o nombre de ciudad en inglés o abreviatura cuando `@native-dates/plugins/zones` está cargado. No interpreta etiquetas de desplazamiento como `'GMT+2'`. |
| `X`, `x` | `'1795542001'` | Marca de tiempo Unix en segundos enteros o milisegundos, incluidos valores negativos. |
| `[text]` | `'[W]'` | Texto literal escapado que debe coincidir distinguiendo mayúsculas de minúsculas. La letra `T` suelta también pasa sin escapar. |

Los tokens exclusivos de formateo, como los trimestres o los nombres largos de zona horaria, no se pueden interpretar y lanzan [`unknownFormat`](/api/errors/#units-zones-and-formats). Los patrones a los que les faltan campos obligatorios para el tipo de destino lanzan el mismo error, mientras que los tokens que el tipo de destino no posee lanzan [`unsupportedToken`](/api/errors/#units-zones-and-formats).

## Opciones de las funciones

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

Interpreta cadenas de entrada según un patrón de tokens o un formato con nombre en todas las funciones de fecha, hora, fecha parcial y rango. Los valores ya interpretados de fecha, hora, `Date` y `Temporal` pasan sin cambios una vez validado el patrón, mientras que los números se rechazan.

**Parámetros**

```params
- name: format
  type: string
  required: true
  description: "Patrón de tokens como `'DDMMYYYY'` o formato con nombre registrado en `configure({ formats })`."
- name: zone
  type: Zone
  description: Zona horaria usada para interpretar cadenas de fecha y hora locales o convertir desplazamientos y marcas de tiempo Unix.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 asociada al valor y usada para nombres de meses, días de la semana, períodos del día y ordinales.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "Estrategia para resolver huecos y repeticiones del horario de verano en cadenas de fecha y hora locales. `'reject'` lanza `invalidDateTime` o devuelve `null` en modo loose."
- name: loose
  type: boolean
  default: "false"
  description: "Opción dependiente de `@native-dates/plugins/loose` para devolver `null` en lugar de lanzar un error cuando la entrada no coincide con el formato."
```

**Devuelve**

```returns
type: DateTime | CalendarDate | Time | YearMonth | MonthDay | Range
description: "Instancia interpretada, o `null` cuando se pasa `{ loose: true }` a una función de fábrica y la entrada no coincide."
```

```js
date('24112026', { format: 'DDMMYYYY' }).toString(); // '2026-11-24'
yearMonth('202611', { format: 'YYYYMM' }).toString(); // '2026-11'
timeRange('0930', '1700', { format: 'HHmm' }).toString(); // '09:30:00/17:00:00'
```
:::
