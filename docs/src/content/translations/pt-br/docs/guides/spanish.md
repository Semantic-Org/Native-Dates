---
source: "7c459605683f"
title: Espanhol
lede: Adapte formatos de data e convenções de relógio em espanhol na Espanha e nas Américas.
---

A tag genérica `'es'` usa o padrão da Espanha, com semana iniciando na segunda-feira e relógio de 24 horas. Aplicações voltadas para a América Latina ou os Estados Unidos devem configurar uma tag regional como `'es-MX'` em [Localização](/guides/localization/).

## Espanha, América Latina e Estados Unidos

A Espanha usa relógio de 24 horas. A América Latina e o espanhol nos EUA usam relógio de 12 horas com espaçamentos regionais em AM/PM, separadores distintos e *setiembre* no Peru:

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

O primeiro dia da semana também se divide pelo mundo hispânico. A tag genérica `'es-419'` começa na segunda-feira, ao contrário do México e da Colômbia:

| Tags | Início e horário | Convenção regional |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | Semana começando na segunda, relógio de 24 horas e setembro abreviado como *sept*. |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | Semana começando no domingo e marcador de 12 horas sem espaço. |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | Semana começando na segunda e marcador com espaço, com datas curtas separadas por hífen no Chile. |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | Semana começando no domingo, datas médias numéricas na Colômbia e *setiembre* no Peru. |
| `'es-PR'` | `7`, `5:30 p. m.` | Semana começando no domingo e ordem numérica mês/dia/ano dos EUA. |

Fixe segunda-feira com [`startOf('week', 'monday')`](/api/calendar-date/#startof) ao agrupar relatórios semanais no banco de dados para que Madri e Cidade do México caiam no mesmo intervalo:

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Preposições, minúsculas e dias da semana

Datas longas em espanhol ligam as partes com *de*, *del* e *a las*. Coloque esses conectores literais entre colchetes dentro de padrões de tokens para que letras soltas não lancem [`unknownFormat`](/api/errors/#units-zones-and-formats):

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

Meses, dias da semana e marcadores AM/PM ficam em minúsculas em espanhol. Coloque apenas o primeiro caractere em maiúscula quando a data formatada iniciar um título.

Iniciais de uma única letra repetem *M* entre *martes* e *miércoles*. O token `'dd'` de duas letras evita essa colisão por padrão, e [`configure()`](/api/configure/) permite personalizar quarta-feira ou *1.º* no primeiro dia do mês:

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## Interpretação de datas e meses em espanhol

Com [o plugin loose](/plugins/loose/), datas numéricas acompanham o idioma ativo automaticamente. Espanha e Chile leem dia/mês/ano por padrão, enquanto Porto Rico lê mês/dia/ano:

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

Datas por extenso, preposições, dias da semana no início, *setiembre* peruano e horários de 12 horas com espaço também são interpretados no modo loose, enquanto [`dayMonth()`](/api/month-day-fn/#daymonth) numérico funciona no núcleo sem plugins:

```js
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('mar, 16 jun 2026', { loose: true, locale: 'es' })?.toString(); // '2026-06-16'
datetime('el 16 de noviembre de 2026 a las 14:30', {
  loose: true,
  locale: 'es',
  zone: 'Europe/Madrid',
})?.hour; // 14
time('5:30 p. m.', { loose: true, locale: 'es-MX' })?.toString(); // '17:30:00'
dayMonth('16/11').toString(); // '11-16'
monthDay('16 set.', { loose: true, locale: 'es-PE' })?.toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-01'
```

## Fusos horários e saltos de horário de verão à meia-noite

A maior parte do México permanece em UTC-6 o ano inteiro, exceto cidades da fronteira norte e Quintana Roo. `CST` acompanha o idioma ativo, resolvendo para Chicago por padrão e para Havana em Cuba:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

O [plugin zones](/plugins/zones/) resolve diretamente as principais cidades hispanófonas e siglas latino-americanas. `San Juan` resolve para Porto Rico em `'es-PR'` e para a Argentina nos demais casos:

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

Chile e Cuba iniciam o horário de verão à meia-noite, saltando direto de 00:00 para 01:00. Chamar [`at('00:00', zone)`](/api/calendar-date/#at) ou `startOf('day')` ajusta diretamente para 01:00 da mesma data:

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## Tempo relativo

O espanhol tem nomes próprios para cinco dias seguidos, de *anteayer* (anteontem) a *pasado mañana* (depois de amanhã). [`CalendarDate`](/api/calendar-date/) retorna essas palavras, enquanto [`DateTime`](/api/date-time/) conta horas decorridas:

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

Em servidores compartilhados, passe [`today(zone)`](/api/date-fn/#today) em vez de [`fromNow()`](/api/calendar-date/#fromnow) para que a virada da meia-noite entre *hoy* e *mañana* siga o fuso horário local do usuário.
