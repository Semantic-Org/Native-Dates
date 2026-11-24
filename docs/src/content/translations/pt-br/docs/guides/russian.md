---
source: "621cb0fa9e99"
title: Russo
lede: Formate meses flexionados e plurais em russo, e interprete datas com pontos e fusos regionais.
---

Use `'ru'` ao configurar a [Localização](/guides/localization/) para formatar datas em russo. Os dados nativos de `Intl` cuidam dos casos gramaticais dos meses e das três formas de plural em durações sem nenhum arquivo de idioma.

## Casos dos meses e o sufixo de ano “г.”

Os presets colocam o mês no caso genitivo ao lado do número do dia, mantêm o caso nominativo em ano-mês isolado e acrescentam o sufixo de ano *г.*:

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

Padrões de tokens personalizados omitem *г.* para rótulos compactos de interface. Logo após um token de dia, `MMMM` e `MMM` mudam automaticamente do nominativo *май* para o genitivo *мая*:

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

Terminações literais como `-го` entre o dia e o mês preservam a flexão genitiva em `MMMM`, com ou sem colchetes:

```js
may.format('D-го MMMM'); // '6-го мая'
```

## Dias da semana, minúsculas e números do dia

O russo escreve meses e dias da semana em minúsculas, e a semana começa na segunda-feira com `weekStart` igual a `1`.

Iniciais de uma única letra colidem em vários dias da semana em russo, então tanto o estilo estreito quanto o curto retornam formas de duas letras de *пн* a *вс* (segunda a domingo):

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

Datas em russo não colocam ponto depois do número do dia, então `Do` retorna o número simples. Personalize ordinais ou dias da semana com inicial maiúscula em [`configure()`](/api/configure/):

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## Plurais de duração e datas relativas

O russo conta unidades com três formas: 1 e 21, 2 a 4, e 5 a 20. Formatar uma [`Duration`](/api/duration/) escolhe a forma correta automaticamente:

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

Em [`DateTime`](/api/date-time/), [`from()`](/api/date-time/#from) conta horas e minutos decorridos, de modo que 22 horas antes da meia-noite continua numérico.

Em [`CalendarDate`](/api/calendar-date/), ele compara dias de calendário e retorna palavras naturais do russo até *позавчера* (anteontem) e *послезавтра* (depois de amanhã):

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

## Interpretação de datas com pontos e meses em russo

O núcleo aceita strings começando pelo ano como `'2026.11.16'`. Com [o plugin loose](/plugins/loose/), a tag `'ru'` interpreta automaticamente datas dia/mês/ano com pontos, nomes de meses flexionados e o sufixo de ano *г.*:

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

O núcleo interpreta diretamente pares dia.mês e mês.ano com ponto. O modo loose reconhece tanto o nominativo quanto o genitivo dos meses russos em datas parciais:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## Fusos horários na Rússia e países vizinhos

A Rússia abrange onze fusos horários sem mudanças sazonais de relógio, e o Cazaquistão unificou seu horário em UTC+5 em 2024. Identificadores IANA completos preservam as transições históricas de deslocamento em cada fuso.

Com [o plugin zones](/plugins/zones/), cidades IANA, grandes centros russos e cazaques e siglas de Moscou são resolvidos diretamente sem aliases:

| Entrada | Suporte padrão | Resolução |
|---|---|---|
| `'Europe/Moscow'`, `'Asia/Almaty'` | Funciona no núcleo | Identificadores IANA completos funcionam de imediato e preservam regras históricas de deslocamento. |
| `'Moscow'`, `'Yekaterinburg'`, `'Minsk'` | Funciona com plugin | Cidades presentes em identificadores IANA são reconhecidas independentemente de maiúsculas ou minúsculas com o plugin zones. |
| `'MSK'`, `'мск'`, `'SPB'`, `'Kazan'`, `'Astana'` | Funciona com plugin | Siglas regionais, grafias alternativas e nomes em cirílico já vêm mapeados e são resolvidos diretamente. |

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
