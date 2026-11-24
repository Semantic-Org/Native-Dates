---
source: "f8fde894143d"
title: Árabe
lede: Formatea fechas en árabe con calendarios regionales y numeración arábiga oriental u occidental.
---

Especifica un locale con código de país como `'ar-EG'` o `'ar-SA'` en lugar de `'ar'` a secas (consulta [Localización](/guides/localization/)). El sistema de numeración, los nombres de los meses gregorianos y el inicio de la semana cambian según el país.

## Numerales orientales y occidentales

Emiratos Árabes Unidos, los países del Magreb y `'ar'` a secas muestran dígitos occidentales, mientras que Egipto, Arabia Saudita, el Levante e Irak utilizan dígitos arábigos orientales.

Añade `-u-nu-latn` o `-u-nu-arab` cuando necesites un único sistema numérico para todos los usuarios:

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

Los patrones de tokens siempre emiten dígitos ASCII y localizan los nombres de meses y días de la semana. Los presets numéricos insertan marcas de derecha a izquierda `\u200F` antes de las barras, por lo que conviene usar `'YYYY-MM-DD'` en aserciones, archivos CSV y URLs:

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## Fechas de la Hégira y meses regionales

Los motores modernos usan el calendario gregoriano por defecto para `'ar-SA'`. Añade `'-u-ca-islamic-umalqura'` junto con un preset para formatear fechas oficiales del calendario islámico Umm al-Qura, como el 1 de shawwal de 1447:

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

Los patrones de tokens y las fechas parciales permanecen en el calendario gregoriano porque un mes solar abarca dos meses islámicos. Fija primero un día concreto con [`on()`](/api/year-month/#on):

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

Los nombres de los meses gregorianos y el reloj de 12 o 24 horas se dividen en cuatro familias regionales:

| Región | Locales de ejemplo | Comportamiento de salida |
|---|---|---|
| Egipto, Golfo y Sudán | `ar-EG, ar-SA` | Meses egipcios y del Golfo como يناير, يوليو, نوفمبر con reloj de 12 horas y marcadores ص / م para AM y PM. |
| Levante e Irak | `ar-LB, ar-IQ` | Meses levantinos como كانون الثاني, تموز, تشرين الثاني con reloj de 12 horas. |
| Marruecos | `ar-MA` | Meses marroquíes como ماي, يوليوز, غشت, شتنبر, نونبر, دجنبر con reloj de 24 horas. |
| Argelia y Túnez | `ar-DZ, ar-TN` | Meses magrebíes como جانفي, فيفري, جوان, جويلية, أوت con reloj de 12 horas. |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## Inicio de semana y fines de semana

La semana empieza en sábado en Egipto, Jordania, Catar y Argelia; en domingo en Arabia Saudita y Yemen; y en lunes en Emiratos Árabes Unidos, Marruecos, Túnez y Líbano.

`weekStart`, los límites de semana y los encabezados de los días siguen cada locale automáticamente, mientras que los informes multipaís pueden fijar `'monday'` de forma explícita:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

[`isWeekend()`](/api/calendar-date/#calendar-predicates) e [`isWeekday()`](/api/calendar-date/#calendar-predicates) también respetan el locale activo. En mercados con fin de semana de viernes y sábado, como Arabia Saudita o Egipto, el viernes es fin de semana y el domingo es día laborable:

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## Plurales de seis formas y texto RTL

El árabe distingue seis formas plurales: cero, uno, dual como *يومان*, 3–10, 11–99 y centenas. [`Duration`](/api/duration/) y [`from()`](/api/date-time/#from) eligen cada forma automáticamente, además de *بعد الغد* para pasado mañana en fechas de calendario:

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

Los navegadores pueden reordenar los signos en fechas ISO o desplazamientos UTC dentro de párrafos de derecha a izquierda, así que envuelve las marcas de tiempo técnicas en `<bdi>`:

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## Interpretar entradas y zonas horarias

Con [el plugin loose](/plugins/loose/), los locales árabes leen automáticamente fechas con barras en orden día/mes/año, dígitos arábigos orientales con marcas de dirección, horas con *ص* / *م* y meses tanto estándar como levantinos de varias palabras:

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

[El plugin zones](/plugins/zones/) resuelve directamente grandes ciudades del Golfo y del norte de África junto con siglas regionales como GST. Con `'ar-SA'`, AST apunta a Riad:

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

Programa eventos con zonas horarias IANA completas en lugar de desplazamientos fijos. `'Africa/Casablanca'` atrasa una hora durante el Ramadán, y El Cairo adelanta el reloj a medianoche pasando directamente a la 01:00:

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
