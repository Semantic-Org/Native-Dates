---
source: "2716034cf571"
title: Formateo
lede: Formatea fechas, horas y duraciones con presets localizados, patrones de tokens o expresiones de tiempo relativo.
---

Native Dates utiliza los formateadores `Intl` integrados en la plataforma y los almacena en caché automáticamente. Obtienes salidas localizadas para cualquier idioma y región sin añadir archivos de locale a tu paquete.

## Salida rápida con text y presets

Cada instancia tiene una propiedad `.text` formateada en tu locale activo. Llamar a [`format()`](/api/date-time/#format) sin argumentos utiliza el preset predeterminado de cada tipo:

```js
import { date, datetime, duration, time } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');
standup.text; // 'Nov 16, 2026, 9:30 AM PST'
standup.format(); // 'Nov 16, 2026, 9:30 AM'

date('2026-11-16').text; // 'Nov 16, 2026'
time('9:30am').text; // '9:30 AM'
duration('1h 30m').text; // '1 hour, 30 minutes'
```

Pasa el nombre de un preset a `format()` para elegir el nivel de detalle:

| Preset | Ejemplo | Tipos compatibles y salida |
|---|---|---|
| `'short'` | `'5/4/26, 9:30 AM'` | Fecha numérica u hora corta en fechas, horas, fechas parciales y duraciones. |
| `'medium'` | `'May 4, 2026, 9:30 AM'` | Mes abreviado en fechas e instantes, u hora con segundos en [`Time`](/api/time/). |
| `'long'` | `'May 4, 2026 at 9:30 AM'` | Nombre completo del mes, hora con segundos en `Time`, o unidades completas en [`Duration`](/api/duration/). |
| `'full'` | `'Monday, May 4, 2026 at 9:30 AM'` | Día de la semana y mes completos en fechas e instantes, o mes completo en fechas parciales. |
| `'date'` | `'May 4, 2026'` | Parte de fecha en [`DateTime`](/api/date-time/) y [`CalendarDate`](/api/calendar-date/). |
| `'time'` | `'9:30 AM'` | Hora del día corta en `DateTime` y `Time`. |
| `'month'` | `'May 2026'` | Nombre completo del mes y año en `DateTime`, `CalendarDate` y [`YearMonth`](/api/year-month/). |
| `'text'` | `'May 4, 2026, 9:30 AM PDT'` | Fecha, hora y nombre corto de zona horaria en `DateTime`, o los campos propios de cada tipo en los demás. |

:::details[Nombres de presets de Moment y Day.js]
El núcleo también acepta los nombres de presets localizados habituales en Moment y Day.js:

| Preset | Ejemplo | Campos localizados |
|---|---|---|
| `'LT'`, `'LTS'` | `'9:30 AM'`, `'9:30:00 AM'` | Hora corta, u hora con segundos. |
| `'L'`, `'l'` | `'05/04/2026'`, `'5/4/2026'` | Año, mes y día numéricos, con o sin ceros a la izquierda. |
| `'LL'`, `'ll'` | `'May 4, 2026'` | Nombre de mes largo o abreviado con día y año. |
| `'LLL'`, `'lll'` | `'May 4, 2026 at 9:30 AM'` | Fecha larga o abreviada acompañada de hora corta. |
| `'LLLL'`, `'llll'` | `'Monday, May 4, 2026 at 9:30 AM'` | Día de la semana completo o abreviado, fecha y hora corta. |
:::

Las fechas, horas, valores de [año y mes](/api/year-month/) y de [mes y día](/api/month-day/) aceptan todos los presets anteriores y muestran solo los campos que poseen. Las [duraciones](/api/duration/) admiten además estilos compactos y digitales:

```js
import { date, duration, time, yearMonth } from 'native-dates';

date('2026-11-16').format('full', 'en-US'); // 'Monday, November 16, 2026'
yearMonth('2026-11').format('LL', 'en-US'); // 'November 2026'
time('9:30:15am').format('LTS', 'en-US'); // '9:30:15 AM'

const span = duration({ hours: 2, minutes: 15 });
span.format('narrow', 'en-US'); // '2h 15m'
span.format('digital', 'en-US'); // '2:15:00'
```

## Locales y opciones de Intl

Define un valor predeterminado una vez con [`configure()`](/api/configure/), asocia un locale a un valor con [`locale()`](/api/date-time/#locale) o pasa una etiqueta a una llamada concreta de `format()`. Lee [Localización](/guides/localization/) para decidir entre aplicaciones cliente y servidores multiusuario:

```js
import { configure, datetime } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'Europe/Berlin');
standup.locale('de-DE').plus(1, 'week').format('long'); // '23. November 2026 um 09:30'
standup.format('long', 'ja-JP'); // '2026年11月16日 9:30'

configure({ locale: 'en-GB' });
configure({ locale: null });
```

Cuando ningún preset encaja con tu diseño, pasa un objeto de opciones directamente al formateador subyacente:

```js
import { date } from 'native-dates';

const day = date('2026-11-16');

day.format({ weekday: 'long' }, 'en-US'); // 'Monday'
day.format({ month: 'short', day: 'numeric' }, 'en-US'); // 'Nov 16'
```

Como cada tipo contiene solo sus propios campos, los presets se adaptan automáticamente a la gramática, plurales, escrituras y calendarios locales sin archivos de locale. Explora los [ejemplos por idioma](/examples/) para revisar los casos particulares de tu locale de destino:

```js
import { date, days, yearMonth } from 'native-dates';

date('2019-05-01').format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'
yearMonth('2026-05').format('long', 'ru'); // 'май 2026 г.'
date('2026-05-01').format('long', 'ru'); // '1 мая 2026 г.'
days(2).format('long', 'ar'); // 'يومان'
```

:::tip[Texto para personas frente a cadenas de intercambio]
Reserva `format()` para el texto que ven las personas. Al almacenar valores o enviarlos por la red, llama a [`toString()`](/api/date-time/#tostring) o serializa a JSON para mantener un formato ISO 8601 estable. Consulta [Almacenamiento y envío](/guides/storing-and-sending/).
:::

## Patrones de tokens

Cuando necesites una estructura fija, pasa un patrón de tokens a `format()`. Encierra las palabras literales entre corchetes para que se copien tal cual:

```js
import { datetime, monthDay, yearMonth } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'America/Los_Angeles');

standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
standup.format('YYYY-MM-DDTHH:mmZ'); // '2026-11-16T09:30-08:00'
standup.format('dddd, MMM D [at] h:mm A', 'en-US'); // 'Monday, Nov 16 at 9:30 AM'
yearMonth('2026-11').format('MMM YYYY', 'en-US'); // 'Nov 2026'
monthDay('11-16').format('MMMM Do', 'en-US'); // 'November 16th'
```

Los nombres de meses y días de la semana dentro de los patrones de tokens salen de `Intl` en el locale activo. Los dígitos y años se mantienen en formato ISO occidental para que patrones como `'YYYY-MM-DD'` sigan siendo legibles por máquina en cualquier región.

:::details[Todos los tokens de formato]
| Token | Ejemplo | Salida |
|---|---|---|
| `YYYY` | `'2026'` | Año de cuatro dígitos, con signo en años negativos. |
| `YY` | `'26'` | Año de dos dígitos. |
| `Q` | `'4'` | Trimestre del calendario del 1 al 4. |
| `M`, `MM` | `'11'`, `'05'` | Número de mes, sin relleno o con cero a la izquierda. |
| `MMM`, `MMMM` | `'Nov'`, `'November'` | Nombre localizado del mes gregoriano, flexionado automáticamente cuando sigue a un token de día aunque haya texto literal en medio. |
| `D`, `DD` | `'5'`, `'05'` | Día del mes, sin relleno o con cero a la izquierda. |
| `Do` | `'16th'` | Día del mes con ordinales en inglés, el marcador de día del locale como `'6.'` o `'6日'`, u [`ordinals`](/api/configure/) personalizados. |
| `DDD`, `DDDD` | `'320'`, `'045'` | Día del año, sin relleno o con ceros hasta tres dígitos. |
| `E` | `'7'` | Día ISO de la semana del 1 (lunes) al 7 (domingo), igual que `dayOfWeek`. |
| `d` | `'0'` | Día de la semana del 0 (domingo) al 6 (sábado), igual que en Moment y Day.js. |
| `dd`, `ddd`, `dddd` | `'Mo'`, `'Mon'`, `'Monday'` | Nombre más corto, abreviado o completo del día de la semana en el locale activo, personalizable mediante [`weekdayNames`](/api/configure/). |
| `W`, `WW` | `'47'`, `'05'` | Semana ISO del año, sin relleno o con cero a la izquierda. |
| `H`, `HH` | `'9'`, `'09'` | Hora en reloj de 24 horas, sin relleno o con cero a la izquierda. |
| `h`, `hh` | `'9'`, `'09'` | Hora en reloj de 12 horas del 1 al 12. |
| `m`, `mm` | `'5'`, `'05'` | Minuto, sin relleno o con cero a la izquierda. |
| `s`, `ss` | `'8'`, `'08'` | Segundo, sin relleno o con cero a la izquierda. |
| `S`, `SS`, `SSS` | `'4'`, `'42'`, `'420'` | Décimas, centésimas o milisegundos. |
| `A`, `a` | `'AM'`, `'am'` | `'AM'` y `'PM'` en mayúsculas o minúsculas en inglés, o el período del día del locale como `'午後'` o `'م'`. |
| `Z`, `ZZ` | `'-08:00'`, `'-0800'` | Desplazamiento UTC con o sin dos puntos. |
| `z`, `zz` | `'PST'` | Nombre corto localizado de la zona horaria. |
| `zzz`, `zzzz` | `'Pacific Standard Time'` | Nombre completo localizado de la zona horaria. |
| `X` | `'1794850200'` | Marca de tiempo Unix en segundos enteros. |
| `x` | `'1794850200000'` | Marca de tiempo Unix en milisegundos. |
| `[text]` | `'[at]'` | Texto literal escapado que se copia directamente a la salida. |
:::

Las letras no reconocidas fuera de corchetes lanzan un error [`unknownFormat`](/api/errors/#units-zones-and-formats) en lugar de imprimirse sin más. También lanzan error los tokens pegados a letras acentuadas como `'às'` o las combinaciones incoherentes de horas como `'HHhmm'`. La letra `T` suelta se conserva sin escapar para marcas de tiempo ISO.

Pedir un campo que un tipo no posee lanza un error [`unsupportedToken`](/api/errors/#units-zones-and-formats) en vez de inventar la medianoche. Formatear tokens de hora como `'HH:mm'` en una fecha de calendario falla de inmediato.

El núcleo también exporta [`monthNames()`](/api/month-names/) y su equivalente [`weekdayNames()`](/api/month-names/#weekdaynames) (cuyo segundo argumento acepta el día inicial de la semana en inglés) para construir encabezados de calendario y listas desplegables de meses localizadas:

```js
import { monthNames, weekdayNames } from 'native-dates';

monthNames('short', 'en-US'); // ['Jan', 'Feb', 'Mar', ...]
weekdayNames('short', undefined, 'en-US'); // ['Sun', 'Mon', 'Tue', ...]
weekdayNames('narrow', 'monday', 'en-US'); // ['Mo', 'Tu', 'We', ...]
```

## Definir tus propios formatos

Registra nombres de formato reutilizables en [`configure()`](/api/configure/) cuando tu aplicación repita un patrón de tokens o un objeto de opciones de `Intl` en varias vistas. Los nombres personalizados funcionan en fechas, horas, fechas parciales y rangos, y tienen prioridad sobre los presets integrados. Consulta [Formatos con nombre](/guides/customization/#named-formats).

## Formatear rangos

Cada [rango](/api/ranges/) formatea presets y opciones mediante `Intl`, contrayendo automáticamente el mes o el año compartido. Al pasar un patrón de tokens, ambos extremos se formatean separados por `' – '`:

```js
import { dateRange, timeRange } from 'native-dates';

const week = dateRange('2026-09-01', '2026-09-07');
const shift = timeRange('9:00am', '5:00pm');

week.format('medium', 'en-US'); // 'Sep 1 – 7, 2026'
week.format('YYYY-MM-DD'); // '2026-09-01 – 2026-09-07'
shift.format('short', 'en-US'); // '9:00 AM – 5:00 PM'
```

## Expresiones de tiempo relativo

Llama a [`from()`](/api/date-time/#from) o [`fromNow()`](/api/date-time/#fromnow) en instantes y fechas de calendario para obtener expresiones localizadas mediante el formateador de tiempo relativo del entorno. [`formatRelative()`](/api/date-time/#formatrelative) funciona como alias:

```js
import { date, datetime, now, today } from 'native-dates';

now().minus(5, 'minutes').fromNow('en-US'); // '5 minutes ago'
today().plus(1, 'day').fromNow('en-US'); // 'tomorrow'

const anchor = datetime('2026-11-16T12:00', 'UTC');
anchor.minus(3, 'hours').from(anchor, 'en-US'); // '3 hours ago'
anchor.minus(23, 'hours').from(anchor, 'en-US'); // '1 day ago'

const currentDay = date('2026-11-16');
currentDay.minus(1, 'day').from(currentDay, 'en-US'); // 'yesterday'
currentDay.plus(14, 'days').from(currentDay, 'en-US'); // 'in 2 weeks'
```

Las fechas de calendario miden días completos, así que `from()` y `fromNow()` usan palabras como ayer, hoy y mañana dentro de un margen de siete días. Los instantes miden tiempo de reloj transcurrido y mantienen conteos numéricos más allá de “ahora”, ya que hace 23 horas todavía puede caer en el mismo día del calendario.

Consulta [Interpretación](/guides/parsing/) para convertir cadenas entrantes y valores externos en instancias tipadas.
