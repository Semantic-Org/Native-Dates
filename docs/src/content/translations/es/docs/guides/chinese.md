---
source: "1f74e099bd7a"
title: Chino
lede: Trabaja con formatos de fecha regionales y calendarios lunares en mercados de habla china.
---

Especifica un locale regional como `'zh-CN'` o `'zh-TW'` según tu audiencia (consulta [Localización](/guides/localization/)). Cada región define su sistema de escritura, orden de fechas, ciclo horario e inicio de semana.

## Hora estándar de China y CST

Usa `'Asia/Shanghai'` para la hora de Pekín. A diferencia de un desplazamiento fijo UTC+8, formatea nombres de zona localizados como *中国标准时间* y conserva los desplazamientos del horario de verano de China entre 1986 y 1991:

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

Con [el plugin zones](/plugins/zones/), CST depende del locale activo: apunta a Shanghái en China continental y a Taipéi en Taiwán. Las principales ciudades de China continental se resuelven de serie, mientras que Urumqi permanece en la hora de Xinjiang (UTC+6):

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## Diferencias regionales

China continental, Taiwán, Hong Kong, Macao y Singapur difieren en el reloj por defecto, el orden de las fechas cortas, los caracteres de los días de la semana y el primer día de la semana:

| Locale | Fecha corta | Inicio de semana | Reloj por defecto y convenciones de días |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | Lunes | Reloj de 24 horas por defecto, con días en chino simplificado de `周一` a `周日` (lunes a domingo). |
| `zh-TW` | `2026/11/16` | Domingo | Reloj de 12 horas con `上午` y `下午` para AM/PM, y días en chino tradicional como `週一`. |
| `zh-HK` | `16/11/2026` | Domingo | Reloj de 12 horas y fechas cortas día/mes/año, compartido con Macao. |
| `zh-SG` | `16/11/26` | Domingo | Reloj de 12 horas, días con `周` en simplificado y fechas día/mes/año con año de dos dígitos. |

El mismo instante se adapta al preset local de cada región:

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

En domingo, China continental cierra la semana en curso mientras que Taiwán, Hong Kong y Singapur abren una nueva. Pasa `'monday'` a [`startOf()`](/api/calendar-date/#startof) para mantener alineadas las claves de los informes semanales compartidos:

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

En chino simplificado, `'Ah:mm'` imprime *上午* o *下午*. Pasa `dayPeriod: 'short'` para obtener períodos naturales del día como madrugada (*凌晨*), mañana (*早上*), mediodía (*中午*) y noche (*晚上*):

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');

night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30'
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30'
```

## Patrones de formato e interpretación de entradas

Los patrones de tokens solo tratan las letras latinas como tokens, por lo que *年*, *月*, *日* y la puntuación china no necesitan corchetes. `'MMMM'` escribe los meses con caracteres chinos como *十一月*, mientras que `'dd'` muestra el carácter corto del día de la semana:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

Las funciones del núcleo interpretan directamente fechas en orden año-mes-día con caracteres chinos, barras y puntos, lo que permite reinterpretar la salida del preset largo sin plugins. Para fechas día/mes/año de Hong Kong, dígitos de ancho completo, horas con período del día o la abreviatura CST dentro de la cadena, carga [el plugin loose](/plugins/loose/):

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
time('晚上9:10', { loose: true, locale: 'zh-CN' })?.toString(); // '21:10:00'
time('凌晨12:00', { loose: true, locale: 'zh-TW' })?.toString(); // '00:00:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

El modo loose reconoce tanto *上午* / *下午* como palabras del período del día como *凌晨*, *中午* y *晚上* en `'zh-CN'` y `'zh-TW'`.

## Calendario lunar chino y calendario Minguo

Pasa `'zh-CN-u-ca-chinese'` al formatear una fecha o un instante para que los presets muestren años del ciclo sexagenario, el primer mes *正月* y meses intercalares como *闰六月*.

Los patrones de tokens siempre leen campos gregorianos. Las fechas parciales se mantienen en el calendario gregoriano porque carecen de día, mientras que la etiqueta Minguo de Taiwán (`'zh-TW-u-ca-roc'`) sí coincide con los meses gregorianos:

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## Tiempo relativo

[`CalendarDate`](/api/calendar-date/) cuenta días de calendario y devuelve *前天* para anteayer y *后天* para pasado mañana. [`DateTime`](/api/date-time/) cuenta segundos transcurridos, así que hace 23 horas nunca se muestra como ayer:

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

En servidores configurados en UTC, llamar a [`fromNow()`](/api/calendar-date/#fromnow) sin argumentos entre la medianoche y las 8:00 de Pekín corresponde al día UTC anterior; pasa [`today('Asia/Shanghai')`](/api/date-fn/#today) explícitamente.
