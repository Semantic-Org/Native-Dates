---
source: "c85157f664b2"
title: Visão geral
lede: Datas e horários legíveis e imutáveis construídos sobre as APIs nativas Temporal e Intl do navegador.
---

Os motores JavaScript modernos já trazem `Temporal` para cálculos de calendário e fuso horário e `Intl` para formatação localizada. O Native Dates envolve essas APIs nativas com métodos expressivos e diretos, fáceis de ler no código, sem nenhuma dependência de runtime.

```js
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const standup = date('2026-11-16')
  .at('9:30am', 'America/Los_Angeles')
  .in('Europe/Berlin');
```

Como o próprio runtime já carrega o banco de fusos horários IANA e as regras de cada idioma, qualquer região ou localidade funciona sem incluir tabelas extras no bundle.

## Tipos separados para tarefas diferentes

O `Date` nativo do JavaScript usa um único objeto tanto para um feriado quanto para um horário de abertura ou um timestamp de banco de dados. No Native Dates, cada conceito tem seu próprio tipo, carregando apenas os campos que fazem sentido para ele:

- [`CalendarDate`](/api/calendar-date/) para uma data de calendário, como 10 de maio de 2026, independente de fuso horário
- [`Time`](/api/time/) para uma hora do dia, como 09:30, que reinicia de forma limpa à meia-noite
- [`DateTime`](/api/date-time/) para um instante específico associado a um fuso horário
- [`Duration`](/api/duration/) para uma duração, como 90 minutos ou 2 semanas
- [`YearMonth`](/api/year-month/) e [`MonthDay`](/api/month-day/) para meses de cobrança, validade de cartão e aniversários recorrentes
- [Intervalos](/api/ranges/) para períodos entre duas datas, horários ou instantes

Medir diferenças, montar intervalos e formatar com presets localizados ou padrões de tokens já funciona sem configuração extra:

```js
import { dateRange, datetime, monthDay, now, timeRange, yearMonth } from 'native-dates';

const deadline = datetime('2027-01-01T00:00:00Z');
now().until(deadline).format('long');

const sprint = dateRange('2026-11-02', '2026-11-15');
const shift = timeRange('9:00am', '5:00pm');
sprint.contains('2026-11-10'); // true
shift.duration.hours; // 8

const billing = yearMonth('2026-11');
const birthday = monthDay('10/17');
```

Leia [Tipos de tempo](/guides/types-of-time/) a seguir para saber como escolher entre eles e converter de um tipo para outro.

## Valores imutáveis

Toda instância é imutável. Chamar métodos como [`plus()`](/api/date-time/#plus) ou [`in()`](/api/date-time/#in) sempre retorna um novo valor e mantém o original intacto.

Passar uma data para uma função auxiliar ou componente de interface nunca altera o estado de quem a chamou:

```js
const original = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const moved = original.plus(1, 'hour');

original.text; // 'Nov 16, 2026, 9:30 AM PST'
moved.text; // 'Nov 16, 2026, 10:30 AM PST'
```

Todo valor também expõe a propriedade `.text`, com um resumo legível no locale ativo, além de uma saída personalizada para `util.inspect`, fazendo o `console.log()` no Node imprimir uma prévia concisa em uma linha:

```js
import { time } from 'native-dates';

date('2026-05-10').text; // 'May 10, 2026'
time('9:30am').text; // '9:30 AM'
```

:::tip[Comparando valores]
Como os métodos sempre retornam novas instâncias, `===` compara referências de objeto, não igualdade de valor. Chame [`equals()`](/api/date-time/#equals) para verificar se duas instâncias representam a mesma data, o mesmo horário ou o mesmo instante.
:::

## Núcleo e plugins

O pacote principal [`native-dates`](/guides/installation/) cobre criação, fusos horários, cálculos de calendário, datas parciais, intervalos, durações, frases de tempo relativo, presets localizados e padrões de tokens.

Plugins opcionais para busca por nomes de cidades e abreviações, interpretação em modo loose e métodos legados de `Date` ficam em [`@native-dates/plugins`](/plugins/) como importações por subcaminho. Veja [Personalização](/guides/customization/#adding-plugins) para adicionar plugins ou definir padrões globais.

Siga para [Instalação](/guides/installation/) para adicionar o pacote ao projeto e configurar o polyfill caso precise oferecer suporte ao Safari.
