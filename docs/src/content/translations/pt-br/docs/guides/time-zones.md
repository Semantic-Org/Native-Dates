---
source: "21708b5b4a6f"
title: Fusos horários
lede: Veja instantes em qualquer fuso horário IANA e atravesse transições de horário de verão sem surpresas.
---

Um [`DateTime`](/api/date-time/) reúne duas informações: quando um instante acontece e em qual fuso horário você o está lendo. Trocar o fuso oferece outra visão do mesmo instante, enquanto a plataforma cuida de cada deslocamento UTC e transição de horário de verão.

## Instantes e fusos horários

Informe um nome IANA como `'America/New_York'`, `'UTC'` ou um deslocamento fixo ao criar um instante:

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const eastCoast = datetime('2026-11-16T12:30', 'America/New_York');
const audit = datetime('2026-11-16T17:30:00Z', 'UTC');

standup.zone; // 'America/Los_Angeles'
standup.offset; // '-08:00'
```

Quando você omite o fuso horário, o instante usa o padrão configurado e, se não houver um, adota o fuso local do runtime.

Defina um padrão para toda a aplicação uma única vez na inicialização com [`configure()`](/api/configure/):

```js
import { configure, now } from 'native-dates';

configure({ zone: 'Europe/Berlin' });
now().zone; // 'Europe/Berlin'
```

## O mesmo instante em outro lugar

Chame [`in()`](/api/date-time/#in) para ver o mesmo instante em outra cidade. As propriedades locais de calendário e relógio se atualizam para o fuso horário de destino, enquanto o timestamp subjacente permanece idêntico:

```js
import { date } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const berlin = standup.in('Europe/Berlin');
const tokyo = standup.in('Asia/Tokyo');

berlin.format('time', 'en-US'); // '6:30 PM'
tokyo.day; // 17
berlin.equals(standup); // true
```

## Deslocamentos fixam o instante, não o fuso horário

Strings vindas de bancos de dados e APIs costumam terminar com `Z` ou um deslocamento UTC numérico. Esse sufixo fixa o momento exato em que o evento ocorreu, mas o novo `DateTime` continua usando o fuso horário que você pediu:

```js
import { datetime } from 'native-dates';

const created = datetime('2026-03-07T14:00:00Z', 'America/New_York');
const berlin = datetime('2026-03-07T16:00:00+02:00', 'Europe/Berlin');

created.zone; // 'America/New_York'
created.hour; // 9
berlin.hour; // 15
```

Manter o fuso horário IANA real faz diferença assim que você soma dias ou meses atravessando uma mudança de horário de verão.

Um deslocamento fixo nunca muda com as estações do ano, enquanto um fuso IANA conhece todas as regras locais de transição.

:::note[Trabalhando em UTC]
Passe `'UTC'` como fuso horário quando quiser avaliar propriedades e cálculos de calendário em UTC. Métodos de serialização como [`toString()`](/api/date-time/#tostring) sempre geram strings UTC, independentemente do fuso horário usado para visualização. Veja [Armazenamento e envio](/guides/storing-and-sending/).
:::

## Transições de horário de verão

Unidades de calendário e unidades de relógio se comportam de formas diferentes quando o relógio muda. Em 8 de março de 2026, Nova York adianta o relógio das 02:00 para as 03:00, fazendo esse domingo durar 23 horas.

Somar 1 dia preserva o compromisso local às 09:00. Somar 24 horas conta exatamente 24 horas decorridas:

```js
import { datetime } from 'native-dates';

const saturday = datetime('2026-03-07T09:00', 'America/New_York');

saturday.plus(1, 'day').text; // 'Mar 8, 2026, 9:00 AM EDT'
saturday.plus(24, 'hours').text; // 'Mar 8, 2026, 10:00 AM EDT'
saturday.plus(1, 'day').hoursInDay; // 23
```

:::warning[Horários pulados no início do horário de verão]
Quando o relógio pula das 02:00 para as 03:00, horários locais como 02:30 nunca chegam a existir naquele fuso horário. Pedir um horário local pulado avança pela duração do salto em vez de lançar erro.
:::

```js
const skipped = datetime('2026-03-08T02:30', 'America/New_York');
skipped.text; // 'Mar 8, 2026, 3:30 AM EDT'
```

:::details[Controlando lacunas e repetições no horário de verão]
Passe `disambiguation` para [`datetime()`](/api/datetime-fn/) ou `at()` quando agendamentos ou auditorias exigirem outra regra em horários pulados ou repetidos. O padrão é `compatible`, e a opção também aceita `earlier`, `later` ou `reject`:

```js
const fallBack = datetime('2026-11-01T01:30', {
  zone: 'America/New_York',
  disambiguation: 'later',
});
fallBack.offset; // '-05:00'

datetime('2026-03-08T02:30', {
  zone: 'America/New_York',
  disambiguation: 'reject',
}); // lança RangeError [invalidDateTime]
```
:::

## Nomes de cidades e abreviações

O núcleo aceita nomes IANA canônicos, `'UTC'` e deslocamentos fixos. Importe [`@native-dates/plugins/zones`](/plugins/zones/) para buscar fusos horários por nomes de cidades em inglês, abreviações regionais e apelidos personalizados.

```js
import '@native-dates/plugins/zones';
import { configure, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'los angeles').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30', 'PT').zone; // 'America/Los_Angeles'
datetime('2026-11-16T09:30', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'

configure({ zoneAliases: { hq: 'Europe/Berlin' } });
datetime('2026-11-16T09:30', 'hq').zone; // 'Europe/Berlin'
```

Abreviações compartilhadas como `CST` e `IST` seguem a região do locale ativo, e grandes cidades informadas em inglês, como `'Beijing'`, `'Mumbai'` e `'Osaka'`, são resolvidas sem precisar cadastrar apelidos manuais.
