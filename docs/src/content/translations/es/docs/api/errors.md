---
source: "91f647c820ea"
title: Errores
lede: Toda entrada no válida u operación no admitida lanza un Error estándar con un código legible por máquina.
---

## Estructura de los errores

Las llamadas no válidas fallan de inmediato en lugar de devolver objetos de fecha rotos o valores `NaN` que corrompen los cálculos posteriores. Cada error lanzado es un error estándar de JavaScript con dos propiedades adicionales:

- **`error.code`** contiene un identificador estable en camelCase, como `'invalidDate'` o `'unknownZone'`.
- **`error.at`** reproduce como cadena la entrada problemática o el destino de la operación, por ejemplo `'2026-02-30'`.

Los tipos de argumento incorrectos y las combinaciones de tipos incompatibles lanzan un `TypeError`. Las fechas imposibles, las cadenas ilegibles, las unidades o zonas horarias desconocidas y las operaciones no admitidas lanzan un `RangeError`.

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

En desarrollo, `error.message` incluye una segunda línea con una sugerencia en inglés que explica cómo corregir la llamada. Las compilaciones de producción con `NODE_ENV` igual a `'production'` eliminan automáticamente esas sugerencias y mantienen sin cambios el código de error y el eco de la entrada.

## Manejar entradas no confiables

Inspecciona `error.code` cuando necesites mensajes de validación propios para fallos concretos y vuelve a lanzar los errores inesperados:

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

Al leer campos de formulario escritos por usuarios, parámetros de consulta o celdas CSV donde el texto ilegible debe devolver `null`, importa [`@native-dates/plugins/loose`](/plugins/loose/) y activa el modo loose:

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[Errores de datos frente a errores de código en modo loose]
El modo loose solo devuelve `null` cuando el valor de entrada en sí no puede interpretarse. Los fallos en las opciones de tu propia llamada, como una zona horaria desconocida o un rango invertido, siguen lanzando un error para que los defectos no pasen inadvertidos.
:::

## Códigos de TypeError

Los errores de tipo indican que falta una entrada obligatoria, tiene un tipo de JavaScript incorrecto o pertenece a un concepto de tiempo distinto del esperado.

| Código | Lanzado por | Causa |
|---|---|---|
| `missingDateTime` | `datetime()`, `DateTime` | La entrada es `null` o `undefined`. |
| `missingDate` | `date()`, `CalendarDate` | La entrada es `null` o `undefined`. |
| `missingTime` | `time()`, `Time` | La entrada es `null` o `undefined`. |
| `missingYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | La entrada es `null` o `undefined`. |
| `missingMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | La entrada es `null` o `undefined`. |
| `invalidDateTime` | `datetime()`, `DateTime` | La entrada es de un tipo no admitido, como un booleano. |
| `invalidDate` | `date()`, `CalendarDate` | La entrada es un único número aislado o un tipo no admitido. |
| `invalidTime` | `time()`, `Time` | La entrada es de un tipo no admitido. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | La entrada es un único número o un tipo no admitido. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | La entrada es un único número o un tipo no admitido. |
| `invalidDuration` | `duration()`, `Duration`, `plus()`, `minus()` | La entrada es `null`, `undefined`, un tipo no admitido, o se pasó una unidad junto a una duración que ya tiene unidades. |
| `unsupportedCalendar` | `yearMonth()`, `monthDay()`, `YearMonth`, `MonthDay` | La entrada es un `Temporal.PlainYearMonth` o `PlainMonthDay` con un calendario que no es ISO. |
| `invalidPoint` | `compare()`, `earliest()`, `latest()` | El valor no es un `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Date`, marca de tiempo Unix, punto de Temporal ni cadena interpretable. |
| `conflictingKinds` | `compare()`, `earliest()`, `latest()` | Comparación de valores de tipos distintos, como una `CalendarDate` con un `DateTime`. |
| `conflictingRanges` | `DateRange`, `DateTimeRange`, `TimeRange` | Paso de un rango de un tipo a un constructor o función de fábrica de otro tipo de rango. |

## Códigos de RangeError

Los errores de rango indican que un valor no se puede interpretar, queda fuera de los límites válidos o solicita una unidad, zona horaria u operación no admitida.

### Interpretación y valores

| Código | Lanzado por | Causa |
|---|---|---|
| `invalidDateTime` | `datetime()`, `DateTime` | La cadena no se puede interpretar como fecha y hora, o los campos contienen valores fuera de rango como el 30 de febrero. |
| `invalidDate` | `date()`, `CalendarDate` | La cadena no se puede interpretar como fecha, los números tienen decimales o los campos están fuera de rango. |
| `missingDay` | `date()`, `CalendarDate` | La llamada numérica `(year, month)` omite el argumento `day`. |
| `invalidTime` | `time()`, `Time` | La cadena no se puede interpretar como hora del día, el valor en formato de 12 horas está fuera del rango de 1 a 12 o los campos del reloj están fuera de rango. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | La cadena no se puede interpretar como año y mes, los números tienen decimales o el mes está fuera del rango 1 a 12. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | La cadena no se puede interpretar como mes y día, se pasó un separador ambiguo a `equals()` o los campos están fuera de rango. |
| `invalidYear` | `MonthDay.in()` | El año pasado a `in()` no es un entero o queda fuera del rango de años admitido por Temporal. |
| `invalidDay` | `YearMonth.on()` | El día pasado a `on()` no es un entero del 1 al 31. |
| `invalidDuration` | `duration()`, `Duration` | Frase de duración vacía o ilegible, duración ISO 8601 no válida o campos de duración fuera de rango. |
| `invalidNumber` | `datetime()`, `duration()`, funciones auxiliares de unidad | La entrada numérica es `NaN`, `Infinity`, `-Infinity` o una instancia `Date` no válida. |
| `conflictingSigns` | `duration()`, `Duration`, `minus()` | La duración mezcla unidades positivas y negativas que no pueden compensarse con exactitud, como `'1h -30m'` o días sin ancla menos horas. |
| `invalidFraction` | `duration()`, `months()`, `times()` | Las fracciones de mes o nanosegundo no pueden convertirse a una unidad fija más pequeña. |

### Unidades, zonas horarias y formatos

| Código | Lanzado por | Causa |
|---|---|---|
| `unknownUnit` | Aritmética, límites, redondeo, `set()`, `duration()` | Nombre o abreviatura de unidad en inglés no reconocido. |
| `unknownDayOfWeek` | `dayOfWeek()`, `next()`, `previous()`, límites de semana, `configure()` | Nombre de día en inglés no reconocido, o número de día de la semana fuera del rango 1 a 7. |
| `unknownSetting` | `configure()` | La clave de configuración pasada a `configure()` no existe. |
| `unknownWidth` | `configure()` | Una entrada de `weekdayNames` indica una anchura distinta de `narrow`, `short` o `long`, o la omite. |
| `unknownZone` | Funciones de fábrica, `in()`, `configure()` | Identificador IANA desconocido, zona que no es una cadena o desplazamiento UTC mal formado. |
| `invalidZoneAliases` | `configure()` | `zoneAliases` no es un objeto plano ni `null`. |
| `unknownLocale` | `locale()`, funciones de fábrica, `format()`, `monthNames()`, `weekdayNames()`, `configure()` | La etiqueta de locale, lista de etiquetas o encabezado `Accept-Language` contiene una etiqueta de locale no válida. |
| `unknownFormat` | `format()`, `monthNames()`, `weekdayNames()` | Especificación de formato u opciones de `Intl` no válidas, estilo de duración o etiqueta no admitido, o tokens no reconocidos o pegados fuera de corchetes `[...]`. |
| `unsupportedToken` | `format()` | El patrón de tokens pide un campo del que el valor carece, como `HH` en una `CalendarDate` o `YYYY` en un `Time`. |
| `unknownKind` | `as()`, `DateRange.count()` | El tipo de destino no es compatible con el valor sobre el que se llama. |

### Aritmética y medición

| Código | Lanzado por | Causa |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`, `Time`, `YearMonth` | Uso de unidades de reloj en una `CalendarDate`, unidades de calendario en un `Time` o unidades menores que un mes en un `YearMonth`. |
| `cannotAdd` | `plus()`, `add()` | La suma desborda el rango de fechas representable por Temporal. |
| `cannotSubtract` | `minus()`, `subtract()` | La resta desborda el rango de fechas representable por Temporal. |
| `cannotSet` | `set()` | El valor del campo tiene decimales o está fuera de rango para ese mes del calendario o unidad de reloj. |
| `cannotRound` | `round()`, `floor()`, `ceil()`, `Time.startOf()`, `Time.startOfNext()`, `Time.startOfPrevious()` | Unidad de redondeo no admitida, o el incremento no divide de forma exacta la unidad siguiente. |
| `missingAnchor` | `Duration.balance()`, `total()`, `compare()` | Una duración sin ancla necesita una fecha de inicio de calendario para convertir meses o años en semanas, días o unidades de reloj. |
| `cannotBalance` | `Duration.balance()` | Equilibrar la duración produce un desbordamiento o falla el redondeo de Temporal. |
| `cannotTotal` | `Duration.total()`, `until()`, `since()` | Calcular la duración total produce un desbordamiento o utiliza una unidad no admitida. |
| `missingPoints` | `earliest()`, `latest()` | Llamada sin argumentos o con un array vacío. |
| `unsupportedComparison` | `CalendarDate`, `Time`, `YearMonth`, `MonthDay`, rangos | Conversión numérica mediante `valueOf()`, `+` unario, `-`, `<` o `>` en un tipo que no tiene valor numérico Unix. |

### Rangos

| Código | Lanzado por | Causa |
|---|---|---|
| `invalidRange` | `DateRange`, `DateTimeRange`, `to()` | El extremo `end` del rango es anterior a `start`. |
| `invalidStep` | `every()`, `split()` | La duración de paso pasada a `every()` o `split()` es cero o negativa. |
| `unsupportedIntersection` | `TimeRange.intersection()` | Dos rangos de horas que cruzan la medianoche se superponen en dos franjas separadas. |
| `unsupportedZone` | `TimeRange.in()` | Llamada a `in()` sobre un `TimeRange`, que no tiene una fecha de calendario para situarse en una zona horaria. |

### Plugins

| Código | Lanzado por | Causa |
|---|---|---|
| `missingPlugin` | Funciones de fábrica, `configure()` | Uso de `loose`, `dayFirst` o `zoneAliases` antes de importar el plugin correspondiente. |
| `immutable` | Setters heredados de `DateTime` | Llamada a un setter de `Date` que muta la instancia, como `setHours()`, cuando está cargado [`@native-dates/plugins/legacy-date`](/plugins/legacy-date/). |
