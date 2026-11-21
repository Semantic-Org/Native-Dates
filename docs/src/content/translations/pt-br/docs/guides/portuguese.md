---
source: '9a6d3a577ae7'
reviewed: false
title: Datas e horários em português
lede: Leia datas no padrão dia/mês/ano com segurança e adapte formatação e fusos horários para aplicações em português.
---

Consulte [Internacionalização](/guides/internationalization/) para definir o idioma globalmente ou por valor, e fique atento às datas com barras e às diferenças regionais no mundo lusófono.

## Lendo datas no padrão dia/mês/ano

Strings ISO com ano na frente nunca invertem mês e dia. Carregue [`@native-dates/plugins/loose`](/plugins/loose/) com `dayFirst` para datas com barras ou pontos, ou 06/11/2026 vira 11 de junho:

```js
import '@native-dates/plugins/loose';
import { configure, date } from 'native-dates';

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
configure({ dayFirst: true });
date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('29/02/2026', { loose: true }); // null
date('2026-11-06', { loose: true })?.toString(); // '2026-11-06'
```

Datas completas reconhecem meses apenas em inglês. Abreviações cognatas como *nov* ou *mar* passam por coincidência, mas *fev*, *mai* e frases com *de* retornam `null`.

Em datas parciais, `dayMonth()` e `monthYear()` leem pares numéricos brasileiros sem plugins, e o modo flexível reconhece os doze meses em português:

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' }); // null
date('16 fev 2026', { loose: true, locale: 'pt-BR' }); // null
dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Formatação, preposições e abreviações

Os presets nativos já trazem minúsculas e preposições naturais no português brasileiro. O preset `'medium'` abrevia o mês no Brasil, mas usa barras em Portugal:

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');
consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

Envolva preposições literais entre colchetes, como `'[de]'` e a crase `'[às]'`. Sem colchetes, o *à* passa como texto e o *s* imprime os segundos:

```js
consulta.format('DD/MM/YYYY às HH:mm'); // '16/11/2026 à0 14:30'
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

No Brasil, meses e dias curtos vêm em minúsculas com ponto, e `dd` usa iniciais de uma letra porque *segunda* e *sexta* começam igual.

O uso brasileiro também grafa o dia primeiro como *1º* em *1º de maio*, enquanto Portugal mantém 1. Ajuste `ordinals` e `weekdayNames` só para o Brasil:

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: {
    'pt-BR': {
      short: {
        sun: 'Dom',
        mon: 'Seg',
        tue: 'Ter',
        wed: 'Qua',
        thu: 'Qui',
        fri: 'Sex',
        sat: 'Sáb',
      },
    },
  },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-02').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sáb, 2 de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## Início da semana e numeração dos dias

Os nomes de *segunda-feira* a *sexta-feira* refletem a semana iniciada no domingo, mas `dayOfWeek` segue a ISO 8601 com segunda igual a 1 e domingo 7.

Os recortes semanais seguem `weekStart`, começando no domingo no Brasil e em Portugal e na segunda-feira em Angola e Cabo Verde:

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');
date('2026-11-16').dayOfWeek; // 1
quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Fixe o início na segunda-feira quando relatórios ou folhas de ponto exigirem semanas comerciais. Já `weekOfYear` conta sempre semanas ISO:

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Fusos horários do Brasil e datas relativas

O Brasil tem quatro fusos civis e aboliu o horário de verão em 2019, mantendo `'America/Sao_Paulo'` em UTC-3 hoje com histórico preservado. Como America/Brasilia não existe na IANA, Brasília, Rio de Janeiro, Belo Horizonte e Salvador lançam `unknownZone`:

| Fuso no Brasil | Identificador IANA | Resolução no plugin zones |
|---|---|---|
| Fernando de Noronha | `America/Noronha` | Aceita `'Noronha'`, enquanto `'FNT'` exige cadastro em `zoneAliases`. |
| Horário de Brasília | `America/Sao_Paulo`, `America/Bahia`, `America/Recife`, `America/Fortaleza`, `America/Belem` | Aceita `'BRT'`, `'São Paulo'`, `'Bahia'`, `'Belém'` e `'Maceió'`, mas Brasília, Rio de Janeiro e Salvador exigem apelido. |
| Amazonas e Mato Grosso | `America/Manaus`, `America/Cuiaba`, `America/Campo_Grande`, `America/Porto_Velho`, `America/Boa_Vista` | Aceita `'Manaus'`, `'Cuiabá'` e `'Campo Grande'`, enquanto `'AMT'` exige cadastro em `zoneAliases`. |
| Acre | `America/Rio_Branco`, `America/Eirunepe` | Aceita `'Rio Branco'` e `'Eirunepé'`, mas `'ACT'` aponta por padrão para `Australia/Adelaide`. |

Com [`@native-dates/plugins/zones`](/plugins/zones/), cidades IANA acentuadas e BRT funcionam direto. Cadastre capitais estaduais e siglas regionais em `zoneAliases`:

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

configure({
  zoneAliases: {
    brasilia: 'America/Sao_Paulo',
    amt: 'America/Manaus',
    act: 'America/Rio_Branco',
    fnt: 'America/Noronha',
  },
});
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo').in('ACT').format('HH:mm Z');
// '12:00 -05:00'
```

:::warning[Siglas de fuso dentro do texto]
O plugin de fusos resolve apenas o parâmetro de fuso, não siglas como BRT anexadas ao fim de uma string informal. Remova a sigla do texto e passe `{ zone: 'BRT' }` nas opções da chamada.
:::

`CalendarDate` usa advérbios até *anteontem* e *depois de amanhã*, enquanto `DateTime` conta horas corridas e diferencia datas futuras entre Brasil e Portugal.

A meia-noite UTC chega às 21h de Brasília, adiantando `fromNow()` em servidores UTC, então compare sempre com a data local do usuário:

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
