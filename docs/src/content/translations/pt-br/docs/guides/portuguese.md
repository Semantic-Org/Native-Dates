---
source: "66dc60a9a9b2"
title: Português
lede: Formate e interprete datas em português entre o Brasil, Portugal e países lusófonos da África.
---

Use `'pt-BR'` ou `'pt-PT'` ao configurar a [Localização](/guides/localization/) para formatar datas em português. Brasil e Portugal compartilham a ordem dia/mês/ano e os meses em minúsculas, mas diferem no preset `'medium'`, no ordinal de primeiro do mês e nas expressões relativas de futuro.

## Interpretação de datas em dia/mês/ano

Strings ISO começando pelo ano nunca trocam mês e dia. Com [o plugin loose](/plugins/loose/), as tags de português interpretam automaticamente datas no formato dia/mês/ano com barras, com pontos e por extenso:

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

Para datas parciais, pares numéricos de dia/mês e mês/ano já são interpretados no núcleo sem plugins, enquanto o modo loose reconhece nomes e abreviações de meses em português:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Presets, preposições e ordinais

Os presets nativos já produzem meses em minúsculas, preposições e crase sem trabalho extra. A diferença mais visível aparece no preset `'medium'`, que abrevia o mês em `'pt-BR'` e exibe números separados por barra em `'pt-PT'`:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

Em padrões de tokens personalizados, proteja palavras literais como `'[de]'` e `'[às]'` entre colchetes. Sem colchetes, a chamada lança erro em vez de expandir letras soltas como tokens:

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

Em `'pt-BR'`, meses e dias da semana abreviados vêm em minúsculas com ponto final. O token `dd` usa iniciais de uma letra porque *segunda* e *sexta* compartilham as duas primeiras letras.

No primeiro dia do mês, `'pt-BR'` usa *1º* (*1º de maio*), enquanto `'pt-PT'` mantém o número simples (*1 de maio*). Restrinja [`ordinals`](/api/configure/) e abreviações personalizadas a `'pt-BR'` para preservar os padrões de Portugal:

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

## Início da semana

Mesmo com a semana brasileira começando no domingo, `dayOfWeek` segue sempre o padrão ISO: `1` para segunda e `7` para domingo.

Os limites de semana seguem o `weekStart` de cada região: domingo no Brasil e em Portugal, segunda-feira em Angola, Moçambique e Cabo Verde:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Passe `'monday'` quando relatórios comerciais agruparem de segunda a domingo. Já `weekOfYear` segue sempre a numeração ISO iniciada na segunda-feira:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Fusos horários e datas relativas

O Brasil abrange quatro fusos horários e extinguiu o horário de verão em 2019. `'America/Sao_Paulo'` permanece em UTC-3 o ano inteiro, mas preserva os deslocamentos históricos de verão para datas anteriores:

| Fuso no Brasil | Fuso IANA principal | Fusos regionais e aliases |
|---|---|---|
| Fernando de Noronha | `America/Noronha` | UTC-2. Resolve `'Noronha'` e `'FNT'` diretamente. |
| Horário de Brasília | `America/Sao_Paulo` | UTC-3, compartilhado com Bahia, Recife, Fortaleza e Belém; resolve `'BRT'`, Brasília, Rio de Janeiro, Belo Horizonte e Salvador. |
| Amazonas e Mato Grosso | `America/Manaus` | UTC-4, compartilhado com Cuiabá, Campo Grande e Porto Velho; resolve `'AMT'`. |
| Acre | `America/Rio_Branco` | UTC-5, compartilhado com Eirunepé; resolve `'ACT'` automaticamente em `'pt-BR'`. |

Com [o plugin zones](/plugins/zones/), as principais cidades brasileiras e siglas regionais funcionam de imediato, inclusive `BRT` embutido em strings no modo loose:

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

Em datas de calendário, o tempo relativo retorna palavras naturais até *anteontem* e *depois de amanhã*. Já [`DateTime`](/api/date-time/) conta horas decorridas e diferencia o futuro entre `'pt-BR'` (*em 2 dias*) e `'pt-PT'` (*dentro de 2 dias*).

Como a meia-noite UTC cai às 21h no horário de Brasília, passe [`today('America/Sao_Paulo')`](/api/date-fn/#today) em servidores UTC em vez de chamar [`fromNow()`](/api/calendar-date/#fromnow) sem referência:

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
