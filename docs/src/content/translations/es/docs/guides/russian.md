---
source: "621cb0fa9e99"
title: Ruso
lede: Formatea meses declinados y plurales en ruso, e interpreta fechas con puntos y zonas horarias regionales.
---

Usa `'ru'` como locale para formatear fechas en ruso (consulta [Localización](/guides/localization/)). Los datos integrados de `Intl` resuelven las declinaciones de los meses y las tres formas plurales de duración sin archivos de locale.

## Casos de los meses y el sufijo de año “г.”

Los presets ponen el mes en genitivo junto al número de día, mantienen el nominativo en fechas de año y mes aisladas y añaden el sufijo de año *г.*:

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

Los patrones de tokens personalizados omiten *г.* para etiquetas compactas de interfaz. Justo después de un token de día, `MMMM` y `MMM` cambian del nominativo *май* al genitivo *мая*:

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

Las terminaciones literales como `-го` entre el día y el mes conservan la flexión en genitivo de `MMMM`, con o sin corchetes:

```js
may.format('D-го MMMM'); // '6-го мая'
```

## Días de la semana, minúsculas y números de día

En ruso, los nombres de meses y días de la semana van en minúscula, y las semanas empiezan en lunes con `weekStart` igual a `1`.

Las iniciales de una sola letra colisionan entre varios días en ruso, por lo que tanto el estilo `narrow` como el `short` devuelven abreviaturas de dos letras de *пн* a *вс* (lunes a domingo):

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

Las fechas rusas no llevan punto tras el número de día, así que `Do` devuelve un número simple. Personaliza ordinales o días en mayúscula con [`configure()`](/api/configure/):

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## Plurales de duraciones y fechas relativas

El ruso cuenta unidades con tres formas distintas: para 1 y 21, para 2 a 4 y para 5 a 20. Formatear una [`Duration`](/api/duration/) selecciona cada forma automáticamente:

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

En [`DateTime`](/api/date-time/), [`from()`](/api/date-time/#from) cuenta horas y minutos transcurridos, así que 22 horas antes de medianoche sigue expresándose con números.

En [`CalendarDate`](/api/calendar-date/), compara días de calendario y devuelve expresiones naturales como *позавчера* (anteayer) y *послезавтра* (pasado mañana):

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ru');
day.minus(2, 'days').from(day); // 'позавчера'
day.minus(1, 'day').from(day); // 'вчера'
day.plus(2, 'days').from(day); // 'послезавтра'

const moment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
moment.minus(1, 'minute').from(moment); // '1 минуту назад'
moment.plus(2, 'days').from(moment); // 'через 2 дня'
```

## Interpretar fechas con puntos y meses en ruso

El núcleo acepta cadenas con el año al principio como `'2026.11.16'`. Con [el plugin loose](/plugins/loose/), los locales en ruso leen automáticamente fechas día.mes.año con puntos, meses declinados y el sufijo *г.*:

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('16.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
date('06.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-06'
date('16 ноября 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
datetime('16.11.2026, 14:30', {
  zone: 'Europe/Moscow',
  locale: 'ru',
  loose: true,
})?.hour; // 14
```

El núcleo lee directamente pares día-mes y mes-año separados por puntos. El modo loose reconoce tanto el nominativo como el genitivo de los meses rusos en fechas parciales:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## Zonas horarias en Rusia y países vecinos

Rusia abarca once zonas horarias sin cambios estacionales, y Kazajistán se unificó en UTC+5 en 2024. Los identificadores IANA completos conservan las transiciones históricas de desplazamiento en cada zona.

Con [el plugin zones](/plugins/zones/), las ciudades IANA, las principales ciudades rusas y kazajas y las abreviaturas de Moscú se resuelven directamente sin alias:

| Entrada | Soporte por defecto | Resolución |
|---|---|---|
| `'Europe/Moscow'`, `'Asia/Almaty'` | Funciona en el núcleo | Los identificadores IANA completos funcionan de serie y conservan las reglas históricas de desplazamiento. |
| `'Moscow'`, `'Yekaterinburg'`, `'Minsk'` | Funciona con el plugin | Las ciudades presentes en identificadores IANA se reconocen sin distinguir entre mayúsculas y minúsculas con el plugin zones. |
| `'MSK'`, `'мск'`, `'SPB'`, `'Kazan'`, `'Astana'` | Funciona con el plugin | Las abreviaturas regionales, grafías alternativas y nombres en cirílico integrados se resuelven directamente. |

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'SPB').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
datetime('16 ноября 2026 14:30 мск', {
  loose: true,
  locale: 'ru',
  zone: 'UTC',
})?.toString(); // '2026-11-16T11:30:00.000Z'
```
