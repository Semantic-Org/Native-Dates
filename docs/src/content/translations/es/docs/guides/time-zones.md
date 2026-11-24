---
source: "21708b5b4a6f"
title: Zonas horarias
lede: Consulta instantes en cualquier zona horaria IANA y atraviesa con precisión los cambios del horario de verano.
---

Un [`DateTime`](/api/date-time/) combina dos datos: cuándo ocurre un instante y desde qué zona horaria lo lees. Cambiar de zona horaria te ofrece otra vista del mismo instante, mientras la plataforma gestiona cada desplazamiento UTC y cada cambio del horario de verano.

## Asociar un instante con una zona horaria

Pasa un nombre de zona horaria IANA como `'America/New_York'`, `'UTC'` o un desplazamiento fijo al crear un instante:

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

Si omites la zona horaria, los instantes usan tu valor configurado o, en su defecto, la zona horaria local del entorno.

Fija un valor predeterminado para toda la aplicación al inicio con [`configure()`](/api/configure/):

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## Ver el mismo instante en otra ciudad

Llama a [`in()`](/api/date-time/#in) para ver el mismo instante en otra ciudad. Las propiedades locales de calendario y reloj se actualizan a la zona horaria de destino, mientras la marca de tiempo subyacente permanece idéntica:

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## Los desplazamientos fijan el instante, no la zona horaria

Las cadenas provenientes de bases de datos y APIs suelen terminar con `Z` o un desplazamiento numérico. Ese sufijo fija cuándo ocurrió el instante, pero el nuevo `DateTime` usa la zona horaria que tú le indicaste:

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

Conservar la zona horaria IANA real importa en cuanto sumas días o meses a través de un cambio de horario de verano.

Un desplazamiento fijo nunca cambia con las estaciones, mientras que una zona horaria IANA conoce todas las reglas de transición locales.

:::note[Trabajar en UTC]
Pasa `'UTC'` como zona horaria cuando quieras evaluar propiedades y cálculos de calendario en UTC. Los métodos de serialización como [`toString()`](/api/date-time/#tostring) siempre producen cadenas UTC, sin importar la zona horaria desde la que consultes el valor. Consulta [Almacenamiento y envío](/guides/storing-and-sending/).
:::

## Cambios del horario de verano

Las unidades de calendario y las unidades de reloj se comportan de forma distinta cuando cambia la hora. El 8 de marzo de 2026, Nueva York adelanta el reloj de las 2:00 AM a las 3:00 AM, por lo que ese domingo dura 23 horas.

Sumar 1 día mantiene la cita a las 9:00 AM en hora local. Sumar 24 horas cuenta en cambio 24 horas exactas transcurridas:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[Horas omitidas al adelantar el reloj]
Cuando el reloj salta de las 2:00 AM a las 3:00 AM, horas locales como las 2:30 AM nunca llegan a existir en esa zona horaria. Pedir una hora omitida avanza la duración del salto en lugar de lanzar un error.
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[Controlar horas omitidas y horas repetidas]
Pasa la opción `disambiguation` a [`datetime()`](/api/datetime-fn/) o `at()` cuando tu lógica de agenda o auditoría necesite otra regla de desambiguación en saltos y repeticiones de hora. Su valor predeterminado es `'compatible'` y también acepta `'earlier'`, `'later'` o `'reject'`:

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // lanza RangeError [invalidDateTime]
```
:::

## Nombres de ciudades y abreviaturas

El núcleo acepta nombres canónicos IANA, `'UTC'` y desplazamientos fijos. Importa [`@native-dates/plugins/zones`](/plugins/zones/) para buscar nombres de ciudades en inglés, abreviaturas regionales y alias personalizados.

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

Las abreviaturas compartidas como `CST` e `IST` siguen la región del locale activo, y los nombres en inglés de grandes ciudades como `'Beijing'`, `'Mumbai'` y `'Osaka'` se resuelven sin definir alias manuales.
