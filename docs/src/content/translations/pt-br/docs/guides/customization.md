---
source: "97915c43145b"
title: Personalização
lede: Defina padrões globais para toda a aplicação e estenda o Native Dates com formatos personalizados ou plugins opcionais.
---

Por padrão, o Native Dates segue o fuso horário e o locale do runtime. Use [`configure()`](/api/configure/) e os plugins opcionais quando sua aplicação precisar de padrões fixos, formatos nomeados ou recursos extras de interpretação e fusos horários.

## Padrões globais da aplicação

Chame [`configure()`](/api/configure/) na inicialização para definir um fuso horário, um locale ou um início de semana padrão em toda a aplicação (os nomes de dia da semana em `weekStart` são informados em inglês, como `'monday'`). Chaves omitidas preservam o valor atual, e passar `null` restaura o padrão do runtime:

```js title="main.js"
import { configure, date, now } from 'native-dates';

configure({
  zone: 'America/New_York',
  locale: 'en-US',
  weekStart: 'monday',
});

now().zone; // 'America/New_York'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
```

Chamadas individuais ainda podem informar seu próprio fuso horário, chamar [`locale()`](/api/date-time/#locale) ou passar outro início de semana para sobrescrever o padrão.

:::warning[Configure uma única vez na inicialização em servidores]
Os padrões globais são compartilhados por todo o processo JavaScript. Em um servidor multiusuário, associe o fuso horário e o locale de cada requisição diretamente ao valor, em vez de alterar `configure()` a cada requisição.
:::

## Formatos nomeados

Registre formatos nomeados em `formats` e passe esses nomes para [`format()`](/guides/formatting/). Cada entrada aceita um padrão de tokens ou um objeto de opções do `Intl`:

```js title="main.js"
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
const placed = datetime('2026-11-06T09:05', 'Europe/Berlin');
placed.format('receipt'); // 'Friday, November 6'
```

Formatos nomeados funcionam em datas, horários, datas parciais e intervalos, enquanto durações aceitam apenas seus estilos integrados. Nomes personalizados têm precedência sobre os presets integrados, portanto registrar `'short'` sobrescreve esse preset em toda a aplicação.

## Como adicionar plugins

Os plugins opcionais para busca por nomes de cidades em inglês, interpretação em modo loose e getters legados de `Date` ficam em [`@native-dates/plugins`](/plugins/):

```bash
npm i @native-dates/plugins
```

Importe cada subcaminho uma vez na inicialização para ativá-lo:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Berlin').zone; // 'Europe/Berlin'
date('Nov 16, 2026', { loose: true }); // CalendarDate(2026-11-16)
```

Depois de carregados, os plugins também registram suas próprias opções em [`configure()`](/api/configure/). O plugin `zones` adiciona `zoneAliases` para apelidos personalizados, e o plugin `loose` adiciona `dayFirst` para definir a ordem de datas numéricas:

```js title="main.js"
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { configure, date, now } from 'native-dates';

configure({
  zoneAliases: { hq: 'Europe/Berlin' },
  dayFirst: true,
});

now('hq').zone; // 'Europe/Berlin'
date('07.09.2026', { loose: true }).toString(); // '2026-09-07'
```

Explore a [visão geral dos plugins](/plugins/) para conferir o tamanho de cada subcaminho, ou leia [Criando um plugin](/guides/writing-a-plugin/) para empacotar o seu próprio.

## Nomes de dias da semana e ordinais personalizados

Os nomes de meses e dias da semana vêm dos dados de `Intl` do runtime. Quando o design exigir abreviações ou ordinais próprios, sobrescreva-os com `weekdayNames` (usando as chaves de três letras em inglês, como `tue` e `thu`) e `ordinals`:

```js title="main.js"
import { configure, date } from 'native-dates';

configure({
  weekdayNames: {
    en: { short: { tue: 'Tues', thu: 'Thurs' } },
  },
  ordinals: {
    fr: (day) => (day === 1 ? '1er' : day),
  },
});

date('2026-11-03').format('ddd', 'en-US'); // 'Tues'
date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
```

Passe `null` em qualquer uma das duas chaves para voltar aos padrões do runtime e da biblioteca. A seguir, leia [Localização](/guides/localization/) para lidar com idiomas por usuário, limites de semana e sistemas de calendário.
