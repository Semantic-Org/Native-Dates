---
source: "2eb400c31ff1"
title: Armazenamento e envio
lede: Serialize datas, horários e intervalos de forma limpa em APIs JSON, bancos de dados e campos HTML.
---

Todo tipo é serializado como uma string ISO 8601 padrão quando convertido em texto ou passado para `JSON.stringify()`. Do outro lado, essas mesmas strings são lidas de volta diretamente pela função correspondente.

## JSON e formatos de transporte

Passe os valores diretamente para `JSON.stringify()`, sem replacers personalizados nem objetos encapsuladores:

```js
import { date, duration, time } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');

JSON.stringify({
  startsAt: standup,
  dueOn: date('2026-11-16'),
  opensAt: time('9:30am'),
  length: duration('1h 30m'),
});
// '{"startsAt":"2026-11-16T17:30:00.000Z","dueOn":"2026-11-16","opensAt":"09:30:00","length":"PT1H30M"}'
```

| Tipo | Saída serializada | Campo típico em payloads |
|---|---|---|
| [`DateTime`](/api/date-time/) | `'2026-11-16T17:30:00.000Z'` | Timestamps de auditoria, decolagens de voos e instantes de reuniões |
| [`CalendarDate`](/api/calendar-date/) | `'2026-11-16'` | Datas de vencimento, feriados e diárias de reserva |
| [`Time`](/api/time/) | `'09:30:00'` | Horários de funcionamento de lojas e lembretes diários |
| [`Duration`](/api/duration/) | `'PT1H30M'` | Timeouts, SLAs, períodos de cobrança e temporizadores |
| [`YearMonth`](/api/year-month/) | `'2026-11'` | Meses de cobrança, validades de cartão e campos de mês |
| [`MonthDay`](/api/month-day/) | `'10-17'` | Aniversários recorrentes e feriados anuais sem o ano de nascimento |
| [Intervalos](/api/ranges/) | `'2026-11-01/2026-11-07'` | Janelas de reserva, sprints e intervalos ISO 8601 com barra |

Quando uma API externa, chave de cache ou coluna de inteiros esperar um número, leia a contagem desde 1970 na unidade desejada. Cada propriedade deixa explícita a sua unidade, já que alguns sistemas contam em segundos e outros em milissegundos:

```js
standup.toString(); // '2026-11-16T17:30:00.000Z'
standup.epochSeconds; // 1794850200
standup.epochMilliseconds; // 1794850200000
duration('1h 30m').toMilliseconds(); // 5400000
```

## De volta para o código

Passe cada string serializada de volta para sua função correspondente ao ler respostas JSON, linhas do banco de dados ou parâmetros de URL:

```js
import { date, dateRange, datetime, duration, time, yearMonth } from 'native-dates';

const startsAt = datetime('2026-11-16T17:30:00.000Z', 'America/Los_Angeles');
const dueOn = date('2026-11-16');
const opensAt = time('09:30:00');
const length = duration('PT1H30M');
const billing = yearMonth('2026-11');
const window = dateRange('2026-11-01/2026-11-07');
```

Todo `DateTime` serializa em UTC para que dois clientes registrando o mesmo evento produzam strings idênticas. Informar um fuso horário ao ler essa string de volta exibe exatamente o mesmo instante UTC no horário local, sem deslocar quando ele ocorreu.

## Eventos futuros e recorrentes

Para eventos passados, como recibos de pedidos ou logs de servidor, o timestamp UTC sozinho basta. Já eventos futuros agendados por pessoas exigem salvar o fuso horário IANA (`zone`) junto com o timestamp.

```js
import { date, datetime } from 'native-dates';

const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
const row = {
  startsAt: standup.toString(),
  zone: standup.zone, // 'America/Los_Angeles'
};

const nextWeek = datetime(row.startsAt, row.zone).plus(1, 'week');
nextWeek.hour; // 9
```

Com o fuso preservado, somar semanas ou meses mantém o horário local de 09:30 ao atravessar mudanças de horário de verão. Além disso, o sistema acompanha qualquer alteração futura nas leis locais de fuso horário.

:::tip[Armazene nomes IANA, não deslocamentos]
Um deslocamento como `'-08:00'` descreve apenas o inverno em Los Angeles. Salve `zone` sempre que cálculos futuros de calendário precisarem acompanhar mudanças locais de horário de verão.
:::

## Colunas de banco de dados

Combine o tipo da coluna SQL com o tipo do valor para que o banco de dados imponha os mesmos limites que o código da aplicação.

| Tipo | Coluna SQL | Por que faz sentido |
|---|---|---|
| `DateTime` | `timestamptz` ou `bigint` | Armazena um instante UTC exato, sem ambiguidade |
| `CalendarDate` | `date` | Armazena `YYYY-MM-DD` sem deslocamentos de meia-noite por fuso horário |
| `Time` | `time` | Armazena `HH:MM:SS` sem inventar uma data fictícia |
| `Duration` | `interval` ou `text` | Armazena intervalos estruturados ou strings ISO 8601 `PT` |

Evite colunas SQL `timestamp` sem fuso horário para instantes reais. Drivers de banco de dados costumam reinterpretar timestamps sem fuso no fuso horário local do servidor.

## Campos HTML e URLs

Controles HTML nativos de data, mês e horário leem e escrevem exatamente as strings ISO que os tipos do núcleo produzem. Parâmetros de busca em URLs usam o mesmo formato compacto.

```js
import { date, time, yearMonth } from 'native-dates';

// <input type="date" value="2026-11-16">
const due = date('2026-11-16');
due.toString(); // '2026-11-16'

// <input type="month" value="2026-11">
const billing = yearMonth('2026-11');
billing.toString(); // '2026-11'

// <input type="time" value="09:30">
const opens = time('09:30');
opens.toString().slice(0, 5); // '09:30'

const params = new URLSearchParams({ from: due.toString() });
params.toString(); // 'from=2026-11-16'
```

Ler campos de data com [`date()`](/api/date-fn/) também evita o bug clássico de `new Date('2026-11-16')`, em que a meia-noite UTC recua para o dia anterior nos fusos horários das Américas.
