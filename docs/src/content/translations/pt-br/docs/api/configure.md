---
source: "e011cab2c85c"
title: configure()
lede: Leia ou atualize padrões globais do processo para fuso horário, locale, início da semana, formatos, nomes de dias da semana, ordinais e plugins.
---

## Padrões globais

:::entry
### `configure()` :kind[function]

```js signature
configure(settings?): ActiveSettings
```

Atualiza um ou mais padrões globais do processo e retorna uma cópia da configuração ativa. Chamar a função sem argumentos apenas lê as configurações atuais, sem alterá-las.

Propriedades omitidas mantêm o valor atual. Passe `null` em qualquer opção para restaurar o comportamento padrão do runtime e da biblioteca.

```js title="setup.js"
import { configure, date, datetime } from 'native-dates';

configure({
  zone: 'Europe/Berlin',
  locale: 'de-DE',
});

datetime('2026-11-16T17:30:00Z').zone; // 'Europe/Berlin'
date('2026-11-18').startOf('week').toString(); // '2026-11-16'
configure().weekStart; // undefined

configure({ weekStart: 'sunday' });
date('2026-11-18').startOf('week').toString(); // '2026-11-15'
configure().weekStart; // 7

// restaura o fuso do runtime, o locale do runtime e o início de semana do locale
configure({ zone: null, locale: null, weekStart: null });
```

**Parâmetros**

```params
- name: settings
  type: Settings
  description: Padrões globais do processo a atualizar, mantendo chaves omitidas inalteradas.
  options:
    - name: zone
      type: Zone | null
      description: Fuso horário padrão para fábricas e `now()`, com `null` restaurando o fuso local do runtime.
    - name: locale
      type: Locale | null
      description: Tag de locale padrão, lista de tags ou cabeçalho `Accept-Language` para formatação, limites de semana, fins de semana e plugins, com `null` ou `''` restaurando o locale do runtime.
    - name: weekStart
      type: DayOfWeek | null
      description: Primeiro dia da semana para limites semanais e `weekdayNames()`, como nome em inglês ou número de 1 (segunda-feira) a 7 (domingo), seguindo o locale ativo quando ausente ou `null`.
    - name: weekend
      type: readonly DayOfWeek[] | null
      description: "Dias de fim de semana usados por `isWeekend()`, `isWeekday()` e `DateRange.count('weekdays' | 'weekends')`. Prevalece sobre `.locale()` de cada instância; passe `[]` para nenhum dia de fim de semana ou `null` para seguir o locale."
    - name: weekdayNames
      type: "Record<Locale, { narrow?, short?, long? }> | null"
      description: "Rótulos personalizados de dias da semana indexados por idioma, largura (`narrow`, `short` ou `long`) e nome do dia em inglês, com tags regionais sobrepondo o idioma base e valor vazio restaurando os nomes do runtime."
    - name: ordinals
      type: "Record<Locale, (day: number) => string | number> | null"
      description: "Formatador personalizado para o token `Do` de dia do mês indexado por tag de idioma, com `null` restaurando os sufixos em inglês e marcadores de dia embutidos."
    - name: formats
      type: "Record<string, string | Intl.DateTimeFormatOptions> | null"
      description: "Formatos personalizados reutilizáveis para `format(name)`, definidos como padrão de tokens ou objeto de opções `Intl`, com precedência sobre presets embutidos e limpeza via `null`."
    - name: dayFirst
      type: boolean | null
      description: "Ordem numérica de data padrão para chamadas em modo loose que omitem `dayFirst` e `locale`, seguindo o locale ativo quando ausente ou `null`."
    - name: zoneAliases
      type: Record<string, Zone | null> | null
      description: "Nomes personalizados mapeados para fusos horários com `@native-dates/plugins/zones`, aceitando `null` em uma chave ou no mapa inteiro para limpar aliases."
```

**Retorno**

```returns
type: "{ zone, locale, weekStart, weekend, dayFirst, zoneAliases, weekdayNames, ordinals, formats }"
description: Cópia rasa das configurações ativas após aplicar as atualizações, com chaves não definidas retornando `undefined`.
```

As opções `weekdayNames` e `ordinals` alteram o texto exibido por padrões de tokens e por [`weekdayNames()`](/api/month-names/#weekdaynames), sem precisar de plugins:

```js
import { configure, date, weekdayNames } from 'native-dates';

configure({
  weekdayNames: { lv: { narrow: { fri: 'Pk', sun: 'Sv' } } },
  ordinals: { fr: (day) => (day === 1 ? '1er' : day) },
});

date('2026-11-01').format('Do MMMM', 'fr'); // '1er novembre'
weekdayNames('narrow', 'monday', 'lv'); // ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

configure({ weekdayNames: null, ordinals: null });
```

Formatos nomeados dão à aplicação seus próprios presets em todo tipo que formata data ou horário:

```js
import { configure, date, datetime } from 'native-dates';

configure({
  formats: {
    invoice: 'YYYY-MM-DD',
    receipt: { weekday: 'long', month: 'long', day: 'numeric' },
  },
});

date('2026-11-06').format('invoice'); // '2026-11-06'
datetime('2026-11-06T09:05', 'Europe/Berlin').format('receipt'); // 'Friday, November 6'

configure({ formats: null });
```

Plugins estendem `configure()` com suas próprias opções assim que são importados. Definir uma opção de plugin antes de importá-lo lança `RangeError`:

```js
import { configure, date, now } from 'native-dates';
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';

configure({
  dayFirst: true,
  zoneAliases: { hq: 'Europe/Berlin' },
});

date('07.09.2026', { loose: true })?.toString(); // '2026-09-07'
now('hq').zone; // 'Europe/Berlin'

configure({ dayFirst: null });
```
:::

:::warning[Configure uma única vez na inicialização de servidores]
A configuração global altera um estado compartilhado por todo o processo JavaScript. Defina os padrões uma vez ao subir o servidor e associe o fuso horário e o [`locale()`](/api/date-time/#locale) de cada usuário diretamente ao valor dentro dos handlers de requisição. Veja [Localização](/guides/localization/).
:::

## Auxiliar de dia da semana

Converta o nome em inglês de um dia da semana no número ISO correspondente usado em toda a biblioteca.

:::entry
### `dayOfWeek()` :kind[function]

```js signature
dayOfWeek(day): number
```

Converte um nome de dia da semana em inglês, um prefixo de três letras em inglês ou um número ISO em um inteiro de 1 (segunda-feira) a 7 (domingo). Nomes não reconhecidos ou números fora desse intervalo lançam `RangeError`.

**Parâmetros**

```params
- name: day
  type: DayOfWeek
  required: true
  description: Nome do dia da semana em inglês como `'monday'`, prefixo sem distinção de maiúsculas como `'Fri'`, ou inteiro de 1 a 7.
```

**Retorno**

```returns
type: number
description: Dia da semana de 1 para segunda-feira até 7 para domingo.
```

```js
import { dayOfWeek } from 'native-dates';

dayOfWeek('monday'); // 1
dayOfWeek('Fri'); // 5
dayOfWeek('sunday'); // 7
dayOfWeek(3); // 3
```
:::
