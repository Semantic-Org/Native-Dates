---
source: '83ac67113f71'
reviewed: false
title: Português
lede: Formate e leia datas no Brasil, em Portugal e nos países africanos de língua portuguesa.
---

Passe `'pt-BR'` ou `'pt-PT'` em [Localização](/guides/localization/) para formatar datas em português. Brasil e Portugal compartilham datas numéricas em dia/mês/ano e meses em minúsculas, mas diferem no preset médio e no ordinal do dia 1º.

## Lendo datas no padrão dia/mês/ano

Strings ISO com ano na frente nunca invertem mês e dia. Para entradas com barras ou pontos, carregue [o plugin flexível](/plugins/loose/) com `dayFirst` para que `'06/11/2026'` seja lido como 6 de novembro:

```js
import '@native-dates/plugins/loose';
import { configure, date } from 'native-dates';

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'

configure({ dayFirst: true });
date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('29/02/2026', { loose: true }); // null
```

Em datas parciais, pares numéricos de dia-mês e mês-ano são lidos no núcleo sem plugins, e o modo flexível reconhece meses em português:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Presets, preposições e ordinais

Os presets nativos exibem meses em minúsculas e preposições naturais. O preset médio abrevia o mês no Brasil, mas usa números com barras em Portugal:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

Envolva palavras literais entre colchetes nos padrões de tokens, incluindo `'[de]'` e `'[às]'` antes do horário:

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

No Brasil, meses e dias curtos vêm em minúsculas com ponto, e `dd` usa iniciais de uma letra porque *segunda* e *sexta* começam igual.

O uso brasileiro também grafa o primeiro dia do mês como *1º* em *1º de maio*, enquanto Portugal usa números simples. Restrinja `ordinals` e os dias da semana a `'pt-BR'` para preservar o padrão português:

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

Os nomes de *segunda-feira* a *sexta-feira* contam a partir do domingo, enquanto `dayOfWeek` segue a numeração ISO de 1 na segunda a 7 no domingo.

Os limites de semana seguem o `weekStart` regional, começando no domingo no Brasil e em Portugal e na segunda-feira em Angola, Moçambique e Cabo Verde:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Passe `'monday'` quando relatórios comerciais agruparem de segunda a domingo. O número anual `weekOfYear` conta sempre semanas ISO:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Fusos horários e datas relativas

O Brasil abrange quatro fusos horários e encerrou o horário de verão em 2019, mantendo `'America/Sao_Paulo'` em UTC-3 o ano todo e preservando o histórico de verão:

| Fuso no Brasil | Zona IANA principal | Demais zonas e siglas |
|---|---|---|
| Fernando de Noronha | `America/Noronha` | UTC-2. Resolve `'Noronha'`; cadastre `'FNT'` em `zoneAliases`. |
| Horário de Brasília | `America/Sao_Paulo` | UTC-3, junto com Bahia, Recife, Fortaleza e Belém; resolve `'BRT'`. |
| Amazonas e Mato Grosso | `America/Manaus` | UTC-4, junto com Cuiabá, Campo Grande e Porto Velho; cadastre `'AMT'`. |
| Acre | `America/Rio_Branco` | UTC-5, junto com Eirunepé; cadastre `'ACT'`, que aponta para Adelaide. |

Com [o plugin de fusos](/plugins/zones/), cidades IANA acentuadas e `'BRT'` funcionam direto, e `zoneAliases` mapeia siglas regionais ou cidades fora da IANA:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: { brasilia: 'America/Sao_Paulo', act: 'America/Rio_Branco' },
});

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo').in('ACT').format('HH:mm Z');
// '12:00 -05:00'
```

Datas de calendário retornam palavras naturais até *anteontem* e *depois de amanhã*, enquanto `DateTime` conta horas corridas e diferencia expressões futuras entre Brasil e Portugal.

Como a meia-noite UTC ocorre às 21h de Brasília, passe `today('America/Sao_Paulo')` em servidores UTC em vez de chamar `fromNow()`:

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
