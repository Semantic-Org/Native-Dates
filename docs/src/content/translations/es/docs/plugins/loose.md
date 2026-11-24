---
source: 'be45ccc1b61a'
title: loose
lede: Interpretación opcional sensible al locale que devuelve null ante texto no confiable de formularios, archivos CSV y fuentes heredadas.
---

## Interpretación opcional en modo loose

Cada función de fábrica interpreta por defecto cadenas estrictas en ISO 8601 y lanza un error ante entradas mal formadas. Al importar este plugin, habilitas `{ loose: true }` para texto no confiable ingresado por usuarios, columnas CSV y encabezados heredados.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

La interpretación estricta sigue siendo el comportamiento predeterminado siempre que omitas el modo loose. Importar el plugin nunca altera las llamadas existentes en tu código.

## Lectura según el locale activo

El modo loose interpreta las mismas fechas y horas que `Intl` genera para el locale activo. Los nombres de meses, las expresiones de AM/PM o períodos del día y el orden numérico de día y mes provienen del entorno de ejecución, y los dígitos de cualquier sistema de escritura se normalizan automáticamente.

El locale activo sigue el mismo orden de prioridad que el formateo: la opción `locale`, luego [`configure()`](/api/configure/) y por último el valor predeterminado del entorno.

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

Los locales que colocan primero el año, como el coreano, leen los años de dos dígitos al principio, así que `'26. 5. 5.'` se interpreta como el 5 de mayo de 2026 en coreano. Los conectores, ordinales y nombres iniciales de días de la semana se omiten tanto en fechas completas como en fechas parciales.

## Devolver null ante datos inválidos

Con el modo loose activado, las cadenas ilegibles, los campos vacíos, los valores ausentes y las fechas de calendario imposibles como el 30 de febrero devuelven `null` en lugar de lanzar un error. Así, los manejadores de formularios y los scripts de importación pueden comprobar el resultado directamente sin envolver cada campo en un bloque `try`.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

Las funciones de [rangos](/api/ranges/) y fechas parciales para [`YearMonth`](/api/year-month/) y [`MonthDay`](/api/month-day/) aceptan la misma opción:

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

Las fechas incompletas a las que les falta el año o el día devuelven `null` en las funciones de fecha y de fecha y hora, en lugar de inventar un valor predeterminado. Usa una función de fecha parcial cuando solo tengas mes y año o mes y día.

Se rechazan los años de dos dígitos junto a nombres de meses que no están en inglés, las abreviaturas ambiguas de meses, las horas mayores a 12 junto a AM o PM y las horas sin fecha pasadas a [`datetime()`](/api/datetime-fn/). Los códigos de zona desconocidos en mayúsculas y las horas abreviadas como `'14h'` también devuelven `null`.

:::note[Los datos inválidos devuelven null, las opciones inválidas siguen lanzando errores]
El modo loose solo cubre datos de entrada ilegibles. Pasar una zona horaria desconocida como `'Mars/Olympus'` es un error del código de la aplicación y no de la entrada del usuario, por lo que sigue lanzando un error de inmediato.
:::

## Zonas horarias en cadenas en modo loose

Las cadenas que incluyen una marca UTC o un desplazamiento numérico identifican un instante concreto y lo convierten a tu zona de destino o configurada. Las cadenas sin desplazamiento conservan la fecha y hora exactas escritas en el texto y las ubican directamente en tu zona de destino.

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

Una abreviatura de zona después de una hora de reloj se resuelve con las mismas reglas que la opción `zone`. Carga [`@native-dates/plugins/zones`](/plugins/zones/) para reconocer abreviaturas más allá de UTC, GMT y los identificadores IANA estándar, incluidos códigos específicos del locale como CST en locales chinos.

## Fechas numéricas con el día primero

Las fechas numéricas separadas por barras, puntos o guiones siguen automáticamente el orden del locale activo. Pasa `dayFirst` en cada llamada o configúralo en [`configure()`](/api/configure/) cuando una entrada use un orden distinto al del locale activo.

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

Pasa `dayFirst: null` a `configure()` para volver a seguir el locale activo. Las funciones de fechas parciales como [`monthDay()`](/api/month-day-fn/) siempre leen pares numéricos en el orden que indica su nombre, sin importar el locale.

## Reglas regionales de relojes y meses

Los relojes con punto como `'14.30'` solo se interpretan en locales cuyo reloj usa punto, como el finés y el danés, y devuelven `null` en el resto. Los segundos con punto se interpretan después de una fecha, mientras que las cadenas independientes de tres partes separadas por puntos se siguen leyendo como fechas.

Las expresiones de período del día como *in the evening* en inglés o *밤* en coreano ajustan los relojes de 12 horas sin alterar las horas en formato de 24 horas. Los conectores entre fecha y hora nunca se leen como AM o PM, así que el galés *am* (que significa “a las”) conserva las 14:30 intactas, mientras que el inglés `'AM 12:30'` se interpreta como medianoche.

Las formas flexionadas o con afijos de los meses en fechas completas se interpretan automáticamente, incluidos el hebreo y el euskera. Las abreviaturas de meses deben corresponder a un único mes: en francés, *juil* se interpreta como julio, mientras que *jui* devuelve `null`.

```js label="Relojes con punto"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="Períodos del día"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="Conectores"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="Formas de meses"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## Opciones de las funciones

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

Extiende todas las funciones de fábrica con interpretación de respaldo sensible al locale y devuelve `null` ante entradas ilegibles. Llamar a constructores de clase como `new DateTime()` con `{ loose: true }` activa la interpretación de respaldo, pero sigue lanzando un error si la entrada no se puede leer.

**Parámetros**

```params
- name: loose
  type: boolean
  default: "false"
  description: "Interpretación de texto informal en el locale activo, respaldo con el análisis nativo de `Date` para formatos técnicos y valor `null` cuando la entrada no es legible."
- name: dayFirst
  type: boolean
  description: "Orden numérico explícito que sobrescribe el del locale activo para cadenas como `'07.09.2026'`."
- name: zone
  type: Zone
  description: Zona horaria usada para interpretar cadenas de fecha y hora locales o mostrar instantes.
- name: locale
  type: Locale
  description: Etiqueta de locale BCP 47 asociada al valor y usada para nombres de meses, períodos del día, estilo de reloj y orden de fecha.
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "Estrategia para resolver huecos y repeticiones del horario de verano en cadenas de fecha y hora locales. `'reject'` devuelve `null` en modo loose."
```

**Devuelve**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: Instancia interpretada, o `null` cuando `input` no es legible.
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

Sobrescribe el orden numérico predeterminado de fechas para las llamadas en modo loose que no indican `dayFirst` ni `locale`. Está sin definir por defecto para que el modo loose siga el locale activo.

**Parámetros**

```params
- name: dayFirst
  type: boolean | null
  description: "Orden numérico fijo en modo loose: día primero (`true`), mes primero (`false`) o `null` para seguir el locale activo."
```
:::
