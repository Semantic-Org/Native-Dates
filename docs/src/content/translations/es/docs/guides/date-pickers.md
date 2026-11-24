---
source: "9de557f3ce5d"
title: Selectores de fecha e interfaz
lede: Conecta controles del navegador y selectores de fecha con Native Dates y mantén los widgets basados en Date aislados en la capa de interfaz.
---

Mantén los valores de Native Dates en el estado de tu aplicación y en la lógica de dominio.

Convierte a cadenas ISO o a objetos `Date` nativos de JavaScript solo en el límite del componente donde un control del navegador o un widget de terceros los requiera. Así separas las reglas de zonas horarias y la aritmética de calendario de las peculiaridades de cada biblioteca de interfaz.

## Controles HTML nativos

Los controles nativos de fecha y hora en HTML leen y escriben cadenas ISO estándar directamente. No requieren ninguna biblioteca de selección y nunca desplazan un día de calendario al cambiar de zona horaria.

| Control | Al escribir en el control | Al leer hacia el núcleo |
|---|---|---|
| `<input type="date">` | `d.toString()` | Pasa cadenas no vacías a [`date()`](/api/date-fn/) para obtener una fecha de calendario sin zona horaria. |
| `<input type="time">` | `t.format('HH:mm')`, o `t.toString()` con `step="1"` | Pasa `value` a [`time()`](/api/time-fn/) para obtener una hora del día sin zona horaria. |
| `<input type="month">` | `ym.toString()` | Pasa `value` a [`yearMonth()`](/api/year-month-fn/) para un período de facturación o vencimiento de tarjeta. |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | Pasa `value` y una zona horaria a [`datetime()`](/api/datetime-fn/) para obtener un instante concreto. |

Vincula tu estado al valor y a los límites del control, y vuelve a interpretar la cadena modificada con la función de fábrica correspondiente:

```js
import { date, time, today, yearMonth } from 'native-dates';

const due = date('2026-11-16');
const opens = time('9:30am');
const billing = yearMonth('2026-11');

// <input type="date" value={due.toString()} min={today().toString()}>
due.toString(); // '2026-11-16'

// <input type="time" value={opens.format('HH:mm')}>
opens.format('HH:mm'); // '09:30'

// <input type="month" value={billing.toString()}>
billing.toString(); // '2026-11'
```

Cuando un formulario recoge un día y una hora del día en controles separados, mantén cada uno vinculado a su propio tipo. Combínalos con [`at()`](/api/calendar-date/#at) al crear un instante:

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[Comprueba los controles vacíos antes de interpretar]
Al limpiar un control HTML se emite una cadena vacía, y al escribir en un selector con campo de texto puede emitirse un objeto `Date` no válido. Comprueba si hay valores vacíos o `NaN` antes de llamar a una función de fábrica, ya que el núcleo lanza un error en lugar de tomar la fecha actual por defecto.
:::

## React Day Picker

React Day Picker usa objetos `Date` nativos de JavaScript a medianoche local para representar los días seleccionados. Mantén una [`CalendarDate`](/api/calendar-date/) en el estado y convierte los valores al pasar las props:

```jsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { date, today } from 'native-dates';

function DueDateField() {
  const [due, setDue] = useState(() => date('2026-11-16'));

  return (
    <DayPicker
      mode="single"
      selected={due?.toJSDate()}
      disabled={{ before: today().toJSDate() }}
      onSelect={(picked) => setDue(picked ? date(picked) : null)}
    />
  );
}
```

Para seleccionar rangos, encapsula la conversión en dos pequeñas funciones auxiliares y guarda un [`DateRange`](/api/ranges/). Mientras el usuario está eligiendo el rango, la fecha final puede ser `undefined` o coincidir con la inicial, así que recurrir a `picked.to ?? picked.from` mantiene el rango válido:

```js
import { date, dateRange } from 'native-dates';

function toPickerRange(range) {
  if (!range) return undefined;
  return { from: range.start.toJSDate(), to: range.end.toJSDate() };
}

function fromPickerRange(picked) {
  if (!picked?.from) return null;
  return dateRange(date(picked.from), date(picked.to ?? picked.from));
}

const stay = dateRange('2026-11-16', '2026-11-20');
const pickerValue = toPickerRange(stay);
const restored = fromPickerRange(pickerValue);

restored.count('days'); // 5
restored.toString(); // '2026-11-16/2026-11-20'
```

De forma predeterminada, [`toJSDate()`](/api/calendar-date/#tojsdate) y `date()` siguen la zona horaria del navegador. Si tu aplicación sobrescribe la zona predeterminada con [`configure()`](/api/configure/), pasa la zona activa del navegador a ambas llamadas para mantener alineada la cuadrícula del calendario:

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X y selectores basados en Date

Con `AdapterDateFns`, los selectores de fecha de MUI X pasan objetos `Date` nativos de JavaScript a través de las props de valor y de cambio. Mantén ese adaptador dentro de `LocalizationProvider` y un único componente envoltorio ligero para que las fechas heredadas no entren en el estado de la aplicación.

Los selectores con campo de texto disparan el manejador de cambios en cada pulsación y pasan un `Date` no válido mientras el usuario aún está escribiendo. Comprueba `Number.isNaN()` antes de convertir:

```jsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { date, today } from 'native-dates';

function CalendarDatePicker({ value, onChange, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        {...props}
        value={value ? value.toJSDate() : null}
        minDate={today().toJSDate()}
        onChange={(next) => {
          if (!next || Number.isNaN(next.getTime())) {
            onChange(null);
            return;
          }
          onChange(date(next));
        }}
      />
    </LocalizationProvider>
  );
}
```

Usa la misma función auxiliar de conversión para un selector de fecha y hora, pasando una zona IANA explícita a [`datetime()`](/api/datetime-fn/) para que el instante devuelto quede fijado a esa zona:

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## Formularios y validación de esquemas

Herramientas de formularios como React Hook Form y Zod encajan con naturalidad cuando los campos permanecen como cadenas durante la edición. Conviértelos en valores tipados durante la validación del esquema.

Para controles ISO estrictos, transforma cada cadena dentro de tu esquema y ejecuta las comprobaciones de dominio directamente sobre los tipos interpretados:

```js
import { z } from 'zod';
import { date } from 'native-dates';

const isoDate = z.string().transform((raw, ctx) => {
  try {
    return date(raw);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid YYYY-MM-DD date' });
    return z.NEVER;
  }
});

const bookingSchema = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine(({ checkIn, checkOut }) => checkOut.isAfter(checkIn), {
    message: 'Check-out must come after check-in',
    path: ['checkOut'],
  });
```

Cuando los usuarios escriben fechas informales como “Nov 16, 2026” en un campo de texto, carga el [plugin loose](/plugins/loose/) y pasa `{ loose: true }`. Las cadenas ilegibles devuelven `null` en lugar de lanzar un error, lo que elimina la necesidad de un bloque `try/catch`:

```js
import '@native-dates/plugins/loose';
import { date, isCalendarDate } from 'native-dates';

function parseTypedDate(raw, locale = 'en-US') {
  const parsed = date(raw, { loose: true, locale });
  return isCalendarDate(parsed) ? parsed : null;
}

parseTypedDate('Nov 16, 2026')?.toString(); // '2026-11-16'
parseTypedDate('not a date'); // null
```

Las guardias de tipo como [`isCalendarDate()`](/api/kind-of/) e `isDateTime()` también encajan directamente en reglas personalizadas de esquema cuando validas un estado ya interpretado.

## Gráficos, tablas y vistas de Date de solo lectura

Los gráficos y tablas de datos suelen leer marcas de tiempo mediante getters nativos como `getTime()` y `getHours()`.

Importa el [plugin legacy-date](/plugins/legacy-date/) una vez al arrancar para añadir esos getters de solo lectura a [`DateTime`](/api/date-time/). Los getters locales se evalúan en la propia zona horaria de la instancia y no en la del equipo anfitrión, mientras que los setters que mutan la instancia lanzan un error:

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// Pasa valores DateTime a getters de solo lectura de Date
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// Ordena filas de un mismo tipo del núcleo
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

Llama a [`compare()`](/api/compare/) dentro del comparador de ordenación de tu tabla para cualquier columna que almacene un único tipo, como solo fechas o solo instantes. Mezclar tipos distintos en una misma comparación lanza un error.

:::tip[Cuando un widget comprueba instanceof Date]
El plugin `legacy-date` extiende únicamente `DateTime` y nunca suplanta la identidad de un `Date` nativo. Si un gráfico o una tabla comprueba la identidad del objeto o muta los valores directamente, pasa `dt.toJSDate()` o `dt.epochMilliseconds` al entregar los datos a la serie.
:::

## Envío a APIs y bases de datos

Una vez interpretados los valores del formulario en la capa de interfaz, pásalos directamente a `JSON.stringify()` sin conversión manual. Consulta [Almacenamiento y envío](/guides/storing-and-sending/) para conocer los formatos ISO de intercambio y cómo convertir de nuevo JSON o filas de base de datos con las funciones de fábrica.
