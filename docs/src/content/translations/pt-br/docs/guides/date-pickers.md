---
source: "9de557f3ce5d"
title: Seletores de data e UI
lede: Conecte inputs nativos do navegador e seletores de data ao Native Dates mantendo widgets baseados em Date isolados na fronteira da UI.
---

Mantenha os valores do Native Dates no estado e na lógica de domínio da sua aplicação.

Converta para strings ISO ou objetos `Date` nativos do JavaScript apenas na fronteira do componente, onde um input do navegador ou um widget de terceiros exige esse formato. Assim, regras de fuso horário e cálculos de calendário ficam separados das peculiaridades de cada biblioteca de UI.

## Inputs HTML nativos

Os controles nativos de data e horário do HTML leem e escrevem strings ISO padrão diretamente. Eles dispensam bibliotecas de seletor e nunca deslocam uma data de calendário entre fusos horários.

| Controle | Escrita no input | Leitura de volta para o núcleo |
|---|---|---|
| `<input type="date">` | `d.toString()` | Passe strings não vazias para [`date()`](/api/date-fn/) para obter uma data de calendário sem fuso horário. |
| `<input type="time">` | `t.format('HH:mm')`, ou `t.toString()` com `step="1"` | Passe `value` para [`time()`](/api/time-fn/) para obter uma hora do dia sem fuso horário. |
| `<input type="month">` | `ym.toString()` | Passe `value` para [`yearMonth()`](/api/year-month-fn/) para um mês de cobrança ou validade de cartão. |
| `<input type="datetime-local">` | `dt.format('YYYY-MM-DDTHH:mm')` | Passe `value` e um fuso horário para [`datetime()`](/api/datetime-fn/) para obter um instante específico. |

Vincule seu estado ao valor e aos limites do input e, ao alterar o campo, interprete a nova string de volta com a fábrica correspondente:

```js
import { date, time, today, yearMonth } from 'native-dates';

const due = date('2026-11-16');
const opens = time('9:30am');
const billing = yearMonth('2026-11');

// <input type="date" value={due.toString()} min={today().toString()}>
due.toString(); // '2026-11-16'

// <input type="time" value={opens.format('HH:mm')}>
opens.format('HH:mm'); // '09:30'

// <input type="month" value={billing.toString()}>
billing.toString(); // '2026-11'
```

Quando um formulário coleta dia e horário em inputs separados, mantenha cada controle vinculado ao seu próprio tipo. Una os dois com [`at()`](/api/calendar-date/#at) na hora de criar um instante:

```js
const rawDate = '2026-11-16';
const rawTime = '09:30';

const day = rawDate ? date(rawDate) : null;
const clock = rawTime ? time(rawTime) : null;
const startsAt = day && clock ? day.at(clock, 'America/Los_Angeles') : null;

startsAt?.toString(); // '2026-11-16T17:30:00.000Z'
```

:::warning[Verifique inputs vazios antes de interpretar]
Limpar um input HTML emite uma string vazia, e digitar em um seletor com campo de texto pode emitir um `Date` inválido. Verifique se o valor está vazio ou é `NaN` antes de chamar uma fábrica, pois o núcleo lança erro em vez de assumir a data de hoje.
:::

## React Day Picker

O React Day Picker usa objetos `Date` nativos na meia-noite local para representar os dias selecionados. Guarde uma [`CalendarDate`](/api/calendar-date/) no estado e faça a conversão na fronteira das props:

```jsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { date, today } from 'native-dates';

function DueDateField() {
  const [due, setDue] = useState(() => date('2026-11-16'));

  return (
    <DayPicker
      mode="single"
      selected={due?.toJSDate()}
      disabled={{ before: today().toJSDate() }}
      onSelect={(picked) => setDue(picked ? date(picked) : null)}
    />
  );
}
```

Para seleção de intervalos, encapsule a conversão em duas funções auxiliares pequenas e armazene um [`DateRange`](/api/ranges/). Enquanto o usuário ainda está escolhendo as pontas do intervalo, a data final pode estar indefinida ou igual à inicial; usar `picked.to ?? picked.from` como fallback mantém o intervalo válido:

```js
import { date, dateRange } from 'native-dates';

function toPickerRange(range) {
  if (!range) return undefined;
  return { from: range.start.toJSDate(), to: range.end.toJSDate() };
}

function fromPickerRange(picked) {
  if (!picked?.from) return null;
  return dateRange(date(picked.from), date(picked.to ?? picked.from));
}

const stay = dateRange('2026-11-16', '2026-11-20');
const pickerValue = toPickerRange(stay);
const restored = fromPickerRange(pickerValue);

restored.count('days'); // 5
restored.toString(); // '2026-11-16/2026-11-20'
```

Por padrão, [`toJSDate()`](/api/calendar-date/#tojsdate) e `date()` seguem o fuso horário do navegador. Se a sua aplicação sobrescrever o fuso padrão com [`configure()`](/api/configure/), passe o fuso ativo do navegador para ambas as chamadas para manter a grade do calendário alinhada:

```js
const host = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pickerDate = due.toJSDate(host);
const picked = date(pickerDate, host);
```

## MUI X e seletores baseados em Date

Com `AdapterDateFns`, os seletores do MUI X trafegam objetos `Date` nativos pelas props de valor e de alteração. Mantenha esse adaptador dentro do `LocalizationProvider` e de um único componente intermediário enxuto, deixando datas legadas fora do estado da aplicação.

Seletores com campo de texto disparam o handler de alteração a cada tecla digitada, passando um `Date` inválido enquanto o usuário ainda escreve. Verifique `Number.isNaN()` antes de converter:

```jsx
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { date, today } from 'native-dates';

function CalendarDatePicker({ value, onChange, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        {...props}
        value={value ? value.toJSDate() : null}
        minDate={today().toJSDate()}
        onChange={(next) => {
          if (!next || Number.isNaN(next.getTime())) {
            onChange(null);
            return;
          }
          onChange(date(next));
        }}
      />
    </LocalizationProvider>
  );
}
```

Use o mesmo padrão de conversão para um seletor de data e hora, passando um fuso horário IANA explícito para [`datetime()`](/api/datetime-fn/) para manter o instante ancorado:

```js
import { datetime } from 'native-dates';

function fromPickerMoment(next, zone) {
  if (!next || Number.isNaN(next.getTime())) return null;
  return datetime(next, zone);
}

const meeting = fromPickerMoment(new Date('2026-11-16T17:30:00Z'), 'America/Los_Angeles');
meeting.format('short', 'en-US'); // '11/16/26, 9:30 AM'
```

## Formulários e validação de esquema

Bibliotecas de formulário como React Hook Form e Zod se integram bem quando os campos permanecem como strings durante a edição. Converta-os em valores tipados na etapa de validação de esquema.

Para controles ISO estritos, transforme cada string dentro do esquema e aplique as regras de domínio diretamente sobre os tipos interpretados:

```js
import { z } from 'zod';
import { date } from 'native-dates';

const isoDate = z.string().transform((raw, ctx) => {
  try {
    return date(raw);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid YYYY-MM-DD date' });
    return z.NEVER;
  }
});

const bookingSchema = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine(({ checkIn, checkOut }) => checkOut.isAfter(checkIn), {
    message: 'Check-out must come after check-in',
    path: ['checkOut'],
  });
```

Quando usuários digitam datas informais como Nov 16, 2026 em um campo de texto, carregue o [plugin loose](/plugins/loose/) e passe `{ loose: true }`. Strings ilegíveis retornam `null` em vez de lançar erro, dispensando um bloco `try/catch`:

```js
import '@native-dates/plugins/loose';
import { date, isCalendarDate } from 'native-dates';

function parseTypedDate(raw, locale = 'en-US') {
  const parsed = date(raw, { loose: true, locale });
  return isCalendarDate(parsed) ? parsed : null;
}

parseTypedDate('Nov 16, 2026')?.toString(); // '2026-11-16'
parseTypedDate('not a date'); // null
```

Type guards como [`isCalendarDate()`](/api/kind-of/) e `isDateTime()` também se encaixam direto em regras personalizadas de esquema ao validar um estado que já contém valores interpretados.

## Gráficos, tabelas e leituras compatíveis com Date

Bibliotecas de gráficos e tabelas costumam ler timestamps usando getters nativos como `getTime()` e `getHours()`.

Importe o [plugin legacy-date](/plugins/legacy-date/) uma vez na inicialização para adicionar esses getters somente leitura em [`DateTime`](/api/date-time/). Os getters locais leem os campos no fuso horário da própria instância em vez do fuso da máquina, enquanto setters que tentam alterar o valor lançam erro:

```js
import '@native-dates/plugins/legacy-date';
import { compare, datetime } from 'native-dates';

const rows = [
  { id: 'b', createdAt: datetime('2026-11-16T18:00:00Z', 'America/New_York') },
  { id: 'a', createdAt: datetime('2026-11-16T14:30:00Z', 'America/New_York') },
];

// Passe valores DateTime para acessores somente leitura de Date
rows[0].createdAt.getHours(); // 13
rows[0].createdAt.getTime(); // 1794852000000

// Ordene linhas por qualquer tipo único do núcleo
const sorted = [...rows].sort((a, b) => compare(a.createdAt, b.createdAt));
sorted[0].id; // 'a'
```

Chame [`compare()`](/api/compare/) dentro do comparador de ordenação da tabela para qualquer coluna de um único tipo, como apenas datas ou apenas instantes. Misturar tipos diferentes na mesma comparação lança erro.

:::tip[Quando um widget verifica instanceof Date]
O plugin `legacy-date` estende apenas `DateTime` e nunca falsifica `instanceof Date`. Se um gráfico ou tabela verificar a identidade do objeto ou alterar valores diretamente, passe `dt.toJSDate()` ou `dt.epochMilliseconds` na fronteira da série de dados.
:::

## Envio para APIs e bancos de dados

Depois de interpretar os valores do formulário na fronteira da UI, passe-os diretamente para `JSON.stringify()` sem conversão manual. Veja [Armazenamento e envio](/guides/storing-and-sending/) para os formatos ISO de transporte e para reconstruir valores de JSON ou registros de banco nas funções fábrica.
