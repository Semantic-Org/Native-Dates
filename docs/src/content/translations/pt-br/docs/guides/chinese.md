---
source: "1f74e099bd7a"
title: Chinês
lede: Formate datas regionais e calendários lunares nos mercados de língua chinesa.
---

Use uma tag regional como `'zh-CN'` ou `'zh-TW'` ao configurar a [Localização](/guides/localization/). Cada região define o sistema de escrita, a ordem da data, o ciclo do relógio e o início da semana.

## Horário padrão da China e CST

Use `'Asia/Shanghai'` para o horário de Pequim. Diferente de um deslocamento UTC+8 fixo, esse fuso horário formata nomes localizados como *中国标准时间* e preserva o horário de verão que vigorou na China entre 1986 e 1991:

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

Com [o plugin zones](/plugins/zones/), `CST` acompanha o idioma ativo, resolvendo para Xangai na China continental e Taipé em Taiwan. As principais cidades continentais funcionam direto pelo nome em inglês, enquanto Ürümqi permanece no horário de Xinjiang (UTC+6):

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## Diferenças regionais

China continental, Taiwan, Hong Kong, Macau e Singapura variam no relógio padrão, na ordem da data curta, nos caracteres dos dias da semana e no primeiro dia da semana:

| Tag regional | Data curta | Início da semana | Convenções de relógio e dias da semana |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | Segunda-feira | Relógio de 24 horas por padrão, com caracteres simplificados de `周一` a `周日` (segunda a domingo). |
| `zh-TW` | `2026/11/16` | Domingo | Relógio de 12 horas com `上午` e `下午` (AM/PM) e dias da semana tradicionais como `週一`. |
| `zh-HK` | `16/11/2026` | Domingo | Relógio de 12 horas e datas curtas no formato dia/mês/ano, convenção compartilhada com Macau. |
| `zh-SG` | `16/11/26` | Domingo | Relógio de 12 horas, dias da semana com `周` simplificado e datas dia/mês/ano com ano em dois dígitos. |

O mesmo instante se adapta ao preset local de cada região:

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

Aos domingos, a China continental encerra a semana atual, enquanto Taiwan, Hong Kong e Singapura abrem uma nova. Passe `'monday'` para [`startOf()`](/api/calendar-date/#startof) quando precisar manter chaves de relatórios semanais alinhadas:

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

Em chinês simplificado, `'Ah:mm'` imprime *上午* ou *下午*. Passe `dayPeriod: 'short'` para períodos naturais do dia, como madrugada (*凌晨*), manhã (*早上*), meio-dia (*中午*) e noite (*晚上*):

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

## Padrões de tokens e interpretação de entradas

Padrões de tokens tratam apenas letras latinas como tokens, então *年*, *月*, *日* e a pontuação chinesa dispensam colchetes. `'MMMM'` escreve meses em ideogramas como *十一月*, enquanto `'dd'` imprime o dia da semana em um único caractere:

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

As fábricas do núcleo interpretam diretamente datas em ideogramas começando pelo ano, com barras ou pontos, aceitando de volta a saída do preset `'long'` sem plugins. Para datas dia/mês/ano de Hong Kong, dígitos de largura total, horários com períodos do dia ou `CST` embutido, carregue [o plugin loose](/plugins/loose/):

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

O modo loose reconhece tanto *上午* / *下午* quanto expressões de período do dia como *凌晨*, *中午* e *晚上* em `'zh-CN'` e `'zh-TW'`.

## Calendário lunar chinês e calendário Minguo

Passe `'zh-CN-u-ca-chinese'` ao formatar uma data ou instante para que os presets exibam anos do ciclo sexagenário, o primeiro mês (*正月*) e meses intercalares como *闰六月*.

Padrões de tokens leem sempre os campos gregorianos. Datas parciais permanecem no calendário gregoriano por não terem um dia definido, enquanto a tag do calendário Minguo de Taiwan (`'zh-TW-u-ca-roc'`) acompanha os meses gregorianos:

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## Tempo relativo

[`CalendarDate`](/api/calendar-date/) conta dias de calendário, retornando *前天* para anteontem e *后天* para depois de amanhã. [`DateTime`](/api/date-time/) conta segundos decorridos, então 23 horas atrás nunca vira “ontem”:

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

Em servidores em UTC, chamar [`fromNow()`](/api/calendar-date/#fromnow) sem argumentos entre meia-noite e 8h no horário de Pequim cai no dia UTC anterior, portanto passe [`today('Asia/Shanghai')`](/api/date-fn/#today) explicitamente.
