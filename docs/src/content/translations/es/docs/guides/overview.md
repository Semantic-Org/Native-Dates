---
source: "c85157f664b2"
title: Vista general
lede: Fechas y horas legibles e inmutables construidas sobre las APIs Temporal e Intl del navegador.
---

Los motores modernos de JavaScript incluyen `Temporal` para cálculos de calendario y zonas horarias junto con `Intl` para el formateo localizado. Native Dates envuelve esas APIs integradas en una interfaz natural y legible, sin ninguna dependencia en tiempo de ejecución.

```js
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const standup = date('2026-11-16')
  .at('9:30am', 'America/Los_Angeles')
  .in('Europe/Berlin');
```

Como el entorno de ejecución ya incluye la base de datos de zonas horarias IANA y las reglas de cada locale, cualquier región e idioma funciona sin enviar tablas adicionales en tu paquete.

## Un tipo para cada concepto

El objeto `Date` integrado de JavaScript usa la misma estructura tanto para un día festivo como para un horario de apertura o una marca de tiempo de base de datos. Native Dates asigna un tipo propio a cada concepto para que cada valor tenga únicamente los campos que le corresponden:

- [`CalendarDate`](/api/calendar-date/) para una fecha de calendario como el 10 de mayo de 2026, independiente de las zonas horarias
- [`Time`](/api/time/) para una hora del día como las 9:30 AM, que vuelve a empezar limpiamente al pasar la medianoche
- [`DateTime`](/api/date-time/) para un instante específico asociado a una zona horaria
- [`Duration`](/api/duration/) para una duración como 90 minutos o 2 semanas
- [`YearMonth`](/api/year-month/) y [`MonthDay`](/api/month-day/) para períodos de facturación, vencimientos de tarjetas y cumpleaños recurrentes
- [Rangos](/api/ranges/) para intervalos entre dos fechas, horas o instantes

Medir diferencias, construir rangos y formatear con presets localizados o patrones de tokens funciona desde el primer momento:

```js
import { dateRange, datetime, monthDay, now, timeRange, yearMonth } from 'native-dates';

const deadline = datetime('2027-01-01T00:00:00Z');
now().until(deadline).format('long');

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');
sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

Lee [Tipos de tiempo](/guides/types-of-time/) para elegir el tipo adecuado en cada caso y pasar de uno a otro.

## Valores inmutables

Cada instancia es inmutable. Al llamar a métodos como [`plus()`](/api/date-time/#plus) o [`in()`](/api/date-time/#in), siempre obtienes un valor nuevo y el original queda intacto.

Pasar una fecha a una función auxiliar o a un componente de interfaz nunca puede alterar el estado de quien la llamó:

```js
const original = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const moved = original.plus(1, 'hour');

original.text; // 'Nov 16, 2026, 9:30 AM PST'
moved.text; // 'Nov 16, 2026, 10:30 AM PST'
```

Cada valor incluye además un getter `.text` con un resumen legible en su locale activo y una salida personalizada de `util.inspect` para que `console.log()` en Node muestre una vista previa concisa en una sola línea:

```js
import { time } from 'native-dates';

date('2026-05-10').text; // 'May 10, 2026'
time('9:30am').text; // '9:30 AM'
```

:::tip[Comparar valores]
Como los métodos devuelven instancias nuevas, `===` compara referencias de objetos y no igualdad de valores. Llama a [`equals()`](/api/date-time/#equals) para comprobar si dos instancias representan la misma fecha, hora o instante.
:::

## Núcleo y plugins

El paquete principal [`native-dates`](/guides/installation/) cubre la creación de valores, zonas horarias, aritmética de calendario, fechas parciales, rangos, duraciones, tiempo relativo, presets localizados y patrones de tokens.

Los plugins opcionales para búsqueda de ciudades en inglés y abreviaturas, interpretación en modo loose y métodos del `Date` clásico están disponibles en [`@native-dates/plugins`](/plugins/) como importaciones por subruta. Consulta [Personalización](/guides/customization/#adding-plugins) para añadir plugins o configurar valores predeterminados en toda la aplicación.

Ve a [Instalación](/guides/installation/) para añadir el paquete a tu proyecto y configurar el polyfill si das soporte a Safari.
