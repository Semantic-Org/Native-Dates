---
source: "7b49470321d3"
title: Localización
lede: Elige entre el locale del navegador, una configuración global de la aplicación, un locale en cada valor o un ajuste puntual por llamada.
---

Native Dates formatea mediante los datos `Intl` integrados en el motor de JavaScript. Todos los idiomas, escrituras, reglas de plural y sistemas de calendario funcionan sin descargar archivos de locale.

Dónde definir la configuración regional depende de tu entorno de ejecución. Elige el alcance que mejor encaje con tu aplicación:

- **Valor predeterminado del entorno** cuando una aplicación en el navegador sigue la configuración del sistema del usuario
- **[`configure()`](/api/configure/) global** cuando una aplicación cliente tiene su propio selector de idioma o un locale fijo
- **[`locale()`](/api/date-time/#locale) por valor** cuando un servidor formatea por petición o una cadena de operaciones conserva su propio locale
- **[`format()`](/api/date-time/#format) puntual** cuando una etiqueta concreta necesita otro calendario o variante regional

## Sin configuración en el navegador

Cuando no se configura ni se pasa ningún locale, cada propiedad `.text`, llamada a `format()`, rango, duración y función de nombres utiliza el locale activo del entorno.

Las aplicaciones de navegador de un solo usuario que siguen el idioma del sistema no requieren ninguna configuración:

```js
import { dateRange, hours, today } from 'native-dates';

today().text;
dateRange('2026-09-01', '2026-09-07').format('medium');
hours(2).format('long');
```

## Valor predeterminado para aplicaciones cliente

Llama a [`configure()`](/api/configure/) una vez al iniciar la aplicación cuando tengas tu propio selector de idioma o un locale fijo. Vuelve a llamarlo cuando el usuario cambie de idioma.

Todos los valores, rangos, duraciones, fechas parciales y funciones de nombres se formatean en ese locale:

```js title="main.js"
import { configure, date, days, monthNames, yearMonth } from 'native-dates';

configure({ locale: 'es-ES' });

date('2026-05-15').format('long'); // '15 de mayo de 2026'
yearMonth('2026-05').format('long'); // 'mayo de 2026'
days(2).text; // '2 días'
monthNames('short').slice(0, 3); // ['ene', 'feb', 'mar']

configure({ locale: null });
```

Pasa `locale: null` para restablecer el locale predeterminado del entorno.

## Llevar un locale en cada valor

Llama a [`locale()`](/api/date-time/#locale) sobre cualquier valor para obtener una copia con ese locale, o pasa `{ locale }` a una fábrica. [`lang()`](/api/date-time/#lang) funciona como alias si prefieres un nombre más corto.

Todo lo que derive de ese valor conserva el mismo locale. Las operaciones aritméticas, los cambios de zona horaria, la extracción de fecha u hora, los rangos y las duraciones medidas lo heredan automáticamente:

```js
import { date, datetime } from 'native-dates';

const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr-FR');

arrival.text; // '15 mai 2026, 16:30 UTC+2'
arrival.plus(3, 'days').date.format('long'); // '18 mai 2026'

const stay = date('2026-09-01', { locale: 'de-DE' }).to('2026-09-07');
stay.format('medium'); // '01.–07.09.2026'
```

En un servidor multiusuario, asocia el locale de cada petición al crear el valor en lugar de modificar la configuración global del proceso:

```js title="orders.js"
import { datetime } from 'native-dates';

function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

formatOrder({ placedAt: '2026-05-15T14:30:00Z' }, { zone: 'Asia/Tokyo', locale: 'ja-JP' });
```

:::warning[Evita llamar a configure en cada petición en servidores]
La configuración global modifica estado compartido en todo el proceso de JavaScript. En un servidor multiusuario, otra petición puede sobrescribir una llamada a `configure()` entre operaciones asíncronas. Asocia `locale()` directamente al valor.
:::

Llamar a `locale()` sin argumentos devuelve la etiqueta activa, o `undefined` si no se definió ninguna. Pasar un valor vacío la limpia, de modo que `locale(user.locale)` se encadena de forma segura incluso cuando la columna de la base de datos está vacía.

Las cadenas de locale sin procesar y los encabezados HTTP `Accept-Language` funcionan directamente sin preprocesamiento. Las etiquetas con guion bajo como `'en_US'` se normalizan automáticamente, y las etiquetas de encabezados se ordenan por peso de calidad descartando las de peso cero. Las cadenas inválidas lanzan [`unknownLocale`](/api/errors/#units-zones-and-formats):

```js
datetime('2026-05-15T14:30:00Z').locale('en_US').locale(); // 'en-US'
datetime('2026-05-15T14:30:00Z').locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale(); // ['de', 'fr-CH']
```

El locale de una instancia controla el texto localizado, los límites de la semana y los días de fin de semana. Las comparaciones exactas, la ordenación, [`equals()`](/api/date-time/#equals) y la serialización ISO con [`toString()`](/api/date-time/#tostring) lo ignoran:

```js
import { date } from 'native-dates';

const french = date('2026-05-15').locale('fr');
const japanese = date('2026-05-15').locale('ja');

french.equals(japanese); // true
french.toString(); // '2026-05-15'
french.to(japanese).locale(); // 'fr'
```

Cuando un método combina dos valores con distintos locales, el valor sobre el que se llamó al método conserva el suyo.

## Sobrescribir el calendario o variante en una llamada

Pasa una etiqueta BCP 47 a `format()` cuando un texto concreto necesite otro calendario, sistema de numeración o variante regional. El valor original conserva su locale intacto:

```js
import { date } from 'native-dates';

const reiwa = date('2019-05-01').locale('ja-JP');
reiwa.format('long'); // '2019年5月1日'
reiwa.format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'

const eid = date('2026-03-20').locale('ar-SA');
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

## Orden de resolución del locale

Al formatear cualquier valor, rango, duración o expresión de tiempo relativo, Native Dates comprueba cada fuente en orden y usa el primer locale que encuentra:

| Prioridad | Fuente | Cuándo usarlo |
|---|---|---|
| 1 | `value.format(spec, locale)` | Una llamada concreta necesita otro calendario, escritura o variante regional. |
| 2 | `value.locale(tag)` o `{ locale }` | Peticiones de servidor, cadenas reutilizables o secciones localizadas de la interfaz. |
| 3 | `configure({ locale })` | Aplicaciones cliente con un ajuste o selector global de idioma. |
| 4 | Valor `Intl` del entorno | Aplicaciones de navegador que siguen el idioma del sistema del usuario. |

## Semanas y fines de semana

Los límites de la semana y los encabezados de días siguen automáticamente el locale activo. El entorno usa domingo en Estados Unidos, Japón, Corea y Brasil; sábado en Egipto; y lunes en la mayor parte de Europa y China.

Como [`startOf('week')`](/api/calendar-date/#startof), [`range('week')`](/api/calendar-date/#range) y [`weekdayNames()`](/api/month-names/#weekdaynames) comparten la misma regla de primer día, los encabezados de calendario siempre coinciden con las filas de la cuadrícula:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('en-US').startOf('week').toString(); // '2026-11-15'
wed.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'

weekdayNames('short', undefined, 'en-US')[0]; // 'Sun'
weekdayNames('short', undefined, 'de-DE')[0]; // 'Mo'
```

Pasa el nombre de un día de la semana en inglés para anular una sola llamada, o configura `weekStart` (también en inglés) en [`configure()`](/api/configure/) para fijar el primer día en todos los locales. Pasar un valor vacío vuelve a seguir el locale, y los entornos sin datos de semana usan el lunes de forma predeterminada.

:::details[Proteger informes de semanas fijas]
Una instancia conserva el locale del valor del que procede. Fija `weekStart` o comprueba `day.weekStart` (del 1 para el lunes al 7 para el domingo) siempre que las semanas sirvan como clave de datos almacenados, como informes o períodos de facturación:

```js title="reports.js"
function weekKey(day) {
  if (day.weekStart !== 1) {
    throw new Error('weekly reports are keyed by Monday weeks');
  }
  return day.startOf('week').toString();
}
```

Los números de semana ISO de `weekOfYear` siempre cuentan las semanas desde el lunes, y `dayOfWeek` sigue la misma numeración con lunes como primer día.
:::

Las comprobaciones de fin de semana también siguen el locale activo. [`isWeekend()`](/api/calendar-date/#calendar-predicates) e [`isWeekday()`](/api/calendar-date/#calendar-predicates) consideran viernes y sábado como fin de semana en Arabia Saudita y Egipto, y solo viernes en Irán. India usa únicamente el domingo, mientras que la mayoría de los demás locales usan sábado y domingo:

```js
const friday = date('2026-11-20');

friday.locale('en-US').isWeekend(); // false
friday.locale('ar-SA').isWeekend(); // true
```

## Nombres de días de la semana y ordinales personalizados

Los nombres de meses y días de la semana provienen del entorno, de modo que coinciden con lo que muestra el dispositivo del usuario. Dos tokens de formato no tienen un campo estándar en la plataforma: los días de la semana de dos letras con `dd` y los ordinales de día con `Do`.

De forma predeterminada, `dd` trunca el nombre breve del día a dos letras en escrituras que abrevian así, y en caso contrario usa la forma estrecha del entorno. `Do` formatea sufijos ordinales en inglés cuando el locale es inglés y usa el marcador de día del locale en los demás casos, como `'6.'` en alemán.

Sobrescribe cualquiera de los dos de forma global mediante `weekdayNames` y `ordinals` en [`configure()`](/api/configure/). Las etiquetas regionales como `'fr-CA'` heredan las entradas de su idioma base y aplican encima sus ajustes propios, sin afectar a los presets ni a las opciones de `Intl`. Consulta [Personalización](/guides/customization/#custom-weekday-names-and-ordinals) para ver ejemplos.

Explora los [ejemplos por idioma](/examples/#localization) y las guías por idioma bajo **Fechas y horas en** en la barra lateral para revisar particularidades regionales, de escritura y de calendario. A continuación, lee [Tipos de tiempo](/guides/types-of-time/) para elegir el tipo adecuado para cada valor de tu aplicación.
