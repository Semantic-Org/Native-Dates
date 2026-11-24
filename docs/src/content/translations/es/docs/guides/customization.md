---
source: "97915c43145b"
title: Personalización
lede: Define valores predeterminados para toda la aplicación y amplía Native Dates con formatos propios o plugins opcionales.
---

De forma predeterminada, Native Dates usa la zona horaria y el locale del entorno de ejecución. Usa [`configure()`](/api/configure/) y plugins opcionales cuando tu aplicación necesite valores fijos, formatos con nombre o funciones adicionales de interpretación y zonas horarias.

## Valores predeterminados para toda la aplicación

Llama a [`configure()`](/api/configure/) al iniciar la aplicación para fijar una zona horaria, un locale o un día de inicio de semana (indicado con su nombre en inglés, como `'monday'`). Las claves que omitas conservan su valor actual, y pasar `null` restablece el valor del entorno:

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

Cada llamada individual puede seguir pasando su propia zona horaria, su [`locale()`](/api/date-time/#locale) o su día de inicio de semana para anular el valor predeterminado.

:::warning[Configura una sola vez al iniciar en servidores]
Los valores globales se comparten en todo el proceso de JavaScript. En un servidor multiusuario, asocia la zona horaria y el locale de cada petición directamente al valor en lugar de cambiar `configure()` para cada una.
:::

## Formatos con nombre

Registra formatos con nombre bajo `formats` y pásalos a [`format()`](/guides/formatting/). Cada entrada acepta un patrón de tokens o un objeto de opciones de `Intl`:

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

Los formatos con nombre funcionan con fechas, horas, fechas parciales y rangos, mientras que las duraciones solo admiten sus estilos integrados. Los nombres personalizados tienen prioridad sobre los presets integrados, así que registrar `'short'` lo sobrescribe en toda la aplicación.

## Añadir plugins

Los plugins opcionales para buscar ciudades por su nombre en inglés, interpretar entradas en modo loose y usar getters del `Date` clásico están disponibles en [`@native-dates/plugins`](/plugins/):

```bash
npm i @native-dates/plugins
```

Importa cada subruta una sola vez al iniciar la aplicación para activarla:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

Al cargarse, los plugins también pueden registrar sus propias opciones en [`configure()`](/api/configure/). El plugin `zones` añade `zoneAliases` para nombres personalizados y el plugin `loose` añade `dayFirst` para definir el orden de las fechas numéricas:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

Explora la [vista general de plugins](/plugins/) para consultar el tamaño de cada subruta, o lee [Crear un plugin](/guides/writing-a-plugin/) para empaquetar el tuyo.

## Nombres de días de la semana y ordinales personalizados

Los nombres de meses y días de la semana provienen de los datos `Intl` del entorno. Cuando un diseño requiere abreviaturas u ordinales de día propios, sobrescríbelos con `weekdayNames` y `ordinals` (usando claves de día abreviadas en inglés como `tue` o `thu` dentro de `weekdayNames`):

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

Pasa `null` en cualquiera de las dos claves para volver a los valores del entorno y a los predeterminados integrados. A continuación, lee [Localización](/guides/localization/) para gestionar los locales de cada usuario, los límites de la semana y los sistemas de calendario.
