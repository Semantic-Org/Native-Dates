---
source: "66dc60a9a9b2"
title: Portugués
lede: Formatea e interpreta fechas en portugués en Brasil y en locales europeos o africanos.
---

Especifica `'pt-BR'` o `'pt-PT'` como locale para formatear fechas en portugués (consulta [Localización](/guides/localization/)). Brasil y Portugal comparten las fechas numéricas día/mes/año y los meses en minúscula, pero difieren en el preset medio y en el ordinal del primer día del mes.

## Interpretar fechas en formato día/mes/año

Las cadenas ISO con el año al principio nunca intercambian el mes y el día. Con [el plugin loose](/plugins/loose/), los locales en portugués leen automáticamente fechas con barras, fechas con puntos y fechas con el mes en letra en orden día/mes/año:

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true, locale: 'pt-PT' })?.toString(); // '2026-11-16'
date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-16'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  locale: 'pt-BR',
  zone: 'America/Sao_Paulo',
})?.hour; // 14
date('29/02/2026', { loose: true, locale: 'pt-BR' }); // null
```

En fechas parciales, los pares numéricos día-mes y mes-año se interpretan en el núcleo sin plugins, y el modo loose reconoce nombres de meses en portugués:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Presets, preposiciones y ordinales

Los presets integrados devuelven nombres de meses en minúscula con sus preposiciones naturales. El preset medio muestra el mes abreviado en Brasil y números con barras en Portugal:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

Encierra palabras literales como `'[de]'` y `'[às]'` entre corchetes dentro de patrones de tokens personalizados. Dejarlas sin corchetes lanza un error en lugar de expandir letras sueltas:

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

En Brasil, los meses y días abreviados van en minúscula y terminan en punto. `dd` usa iniciales de una letra porque *segunda* y *sexta* comparten las dos primeras letras.

Brasil también escribe el primer día del mes como *1º* en *1º de maio*, mientras que Portugal usa números cardinales. Acota las reglas de [`ordinals`](/api/configure/) y nombres de días a `'pt-BR'` para que Portugal conserve sus valores por defecto:

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: { 'pt-BR': { short: { fri: 'Sex', sat: 'Sáb' } } },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## Inicio de la semana

Los nombres de los días de *segunda-feira* a *sexta-feira* cuentan desde el domingo, mientras que `dayOfWeek` sigue la numeración ISO del 1 en lunes al 7 en domingo.

Los límites de semana siguen el `weekStart` de cada región: domingo en Brasil y Portugal, y lunes en Angola, Mozambique y Cabo Verde:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Pasa `'monday'` cuando los informes de negocio agrupen de lunes a domingo. Los números ISO de `weekOfYear` siempre cuentan semanas iniciadas en lunes:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Zonas horarias y fechas relativas

Brasil abarca cuatro zonas horarias y eliminó el horario de verano en 2019. `'America/Sao_Paulo'` se mantiene en UTC-3 todo el año, pero conserva los desplazamientos históricos de verano:

| Zona en Brasil | Zona IANA principal | Zonas regionales y alias |
|---|---|---|
| Fernando de Noronha | `America/Noronha` | UTC-2. Resuelve `'Noronha'` y `'FNT'` directamente. |
| Hora de Brasilia | `America/Sao_Paulo` | UTC-3, compartida con Bahía, Recife, Fortaleza y Belém; resuelve `'BRT'`, Brasilia, Río de Janeiro, Belo Horizonte y Salvador. |
| Amazonas y Mato Grosso | `America/Manaus` | UTC-4, compartida con Cuiabá, Campo Grande y Porto Velho; resuelve `'AMT'`. |
| Acre | `America/Rio_Branco` | UTC-5, compartida con Eirunepé; resuelve `'ACT'` automáticamente con `'pt-BR'`. |

Con [el plugin zones](/plugins/zones/), las principales ciudades brasileñas y las siglas regionales se resuelven de serie, incluido BRT dentro de cadenas en modo loose:

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo')
  .locale('pt-BR')
  .in('ACT')
  .format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-11-16 14:30 BRT', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T17:30:00.000Z'
```

Las fechas de calendario devuelven expresiones propias hasta *anteontem* (anteayer) y *depois de amanhã* (pasado mañana). [`DateTime`](/api/date-time/) cuenta horas transcurridas y redacta los intervalos futuros de forma distinta en Brasil y en Portugal.

Como la medianoche UTC coincide con las 21:00 de Brasilia, pasa [`today('America/Sao_Paulo')`](/api/date-fn/#today) en servidores UTC en lugar de llamar a [`fromNow()`](/api/calendar-date/#fromnow):

```js
import { date, today } from 'native-dates';

const ref = date('2026-11-16');

date('2026-11-14').from(ref, 'pt-BR'); // 'anteontem'
date('2026-11-18').from(ref, 'pt-BR'); // 'depois de amanhã'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-BR'); // 'em 2 dias'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-PT');
// 'dentro de 2 dias'
ref.from(today('America/Sao_Paulo'), 'pt-BR');
```
