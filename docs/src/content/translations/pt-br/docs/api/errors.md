---
source: "91f647c820ea"
title: Erros
lede: Toda entrada inválida ou operação sem suporte lança um Error padrão com um código legível por máquina.
---

## Formato dos erros

Chamadas inválidas falham na hora, em vez de retornar objetos de data corrompidos ou números `NaN` que contaminam cálculos posteriores. Todo erro lançado é um erro padrão do JavaScript com duas propriedades extras:

- **`error.code`** guarda um identificador estável em camelCase, como `'invalidDate'` ou `'unknownZone'`.
- **`error.at`** reproduz como string a entrada ou o alvo que causou o erro, como `'2026-02-30'`.

Tipos de argumento errados e combinações de tipos incompatíveis lançam `TypeError`. Datas impossíveis, strings ilegíveis, unidades ou fusos horários desconhecidos e operações sem suporte lançam `RangeError`.

```js title="catch.js"
import { date } from 'native-dates';

try {
  date('2026-02-30');
} catch (error) {
  error instanceof RangeError; // true
  error.code; // 'invalidDate'
  error.at; // '2026-02-30'
}
```

Em desenvolvimento, `error.message` inclui uma segunda linha com uma dica em inglês explicando como corrigir a chamada. Builds de produção com `NODE_ENV` definido como `'production'` removem essas dicas automaticamente, mantendo intactos o código do erro e a entrada registrada.

## Lidar com entradas não confiáveis

Inspecione `error.code` quando quiser exibir mensagens de validação próprias para cada tipo de falha e relance erros inesperados:

```js
import { datetime } from 'native-dates';

function parseTimestamp(raw, zone) {
  try {
    return datetime(raw, zone);
  } catch (error) {
    if (error.code === 'invalidDateTime') {
      return null;
    }
    throw error;
  }
}

parseTimestamp('not-a-date', 'UTC'); // null
```

Ao ler campos de formulário digitados por usuários, parâmetros de query ou células de CSV em que textos ilegíveis devem retornar `null`, importe [`@native-dates/plugins/loose`](/plugins/loose/) e ative o modo loose:

```js
import { date, duration } from 'native-dates';
import '@native-dates/plugins/loose';

date('2026-02-30', { loose: true }); // null
duration('whenever', { loose: true }); // null
```

:::tip[Erros de dados vs. erros de código no modo loose]
O modo loose só retorna `null` quando o próprio valor de entrada não pode ser lido. Erros nas opções da chamada — como um fuso horário desconhecido ou um intervalo invertido — continuam lançando exceção para que bugs permaneçam visíveis.
:::

## Códigos de TypeError

Erros `TypeError` indicam que uma entrada obrigatória está ausente, tem o tipo JavaScript incorreto ou pertence a um conceito de tempo diferente do esperado.

| Código | Lançado por | Causa |
|---|---|---|
| `missingDateTime` | `datetime()`, `DateTime` | A entrada é `null` ou `undefined`. |
| `missingDate` | `date()`, `CalendarDate` | A entrada é `null` ou `undefined`. |
| `missingTime` | `time()`, `Time` | A entrada é `null` ou `undefined`. |
| `missingYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | A entrada é `null` ou `undefined`. |
| `missingMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | A entrada é `null` ou `undefined`. |
| `invalidDateTime` | `datetime()`, `DateTime` | A entrada é de um tipo sem suporte, como um booleano. |
| `invalidDate` | `date()`, `CalendarDate` | A entrada é um único número avulso ou um tipo sem suporte. |
| `invalidTime` | `time()`, `Time` | A entrada é de um tipo sem suporte. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | A entrada é um único número ou um tipo sem suporte. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | A entrada é um único número ou um tipo sem suporte. |
| `invalidDuration` | `duration()`, `Duration`, `plus()`, `minus()` | A entrada é `null`, `undefined`, um tipo sem suporte, ou uma unidade passada junto com uma duração que já tem unidades. |
| `unsupportedCalendar` | `yearMonth()`, `monthDay()`, `YearMonth`, `MonthDay` | A entrada é um `Temporal.PlainYearMonth` ou `PlainMonthDay` com calendário diferente do ISO. |
| `invalidPoint` | `compare()`, `earliest()`, `latest()` | O valor não é `DateTime`, `CalendarDate`, `Time`, `YearMonth`, `Date`, timestamp Unix, ponto Temporal nem string interpretável. |
| `conflictingKinds` | `compare()`, `earliest()`, `latest()` | Comparação entre valores de tipos diferentes, como `CalendarDate` com `DateTime`. |
| `conflictingRanges` | `DateRange`, `DateTimeRange`, `TimeRange` | Passagem de um intervalo de um tipo para o construtor ou fábrica de outro tipo de intervalo. |

## Códigos de RangeError

Erros `RangeError` indicam que um valor não pode ser interpretado, está fora dos limites válidos ou solicita uma unidade, fuso horário ou operação sem suporte.

### Interpretação e valores

| Código | Lançado por | Causa |
|---|---|---|
| `invalidDateTime` | `datetime()`, `DateTime` | A string não pode ser interpretada como data e hora, ou os campos contêm valores fora do intervalo, como 30 de fevereiro. |
| `invalidDate` | `date()`, `CalendarDate` | A string não pode ser interpretada como data, os números são fracionários ou os campos estão fora do intervalo. |
| `missingDay` | `date()`, `CalendarDate` | Chamada numérica `(year, month)` sem o argumento `day`. |
| `invalidTime` | `time()`, `Time` | A string não pode ser interpretada como horário, o valor no formato de 12 horas está fora de 1 a 12 ou os campos de relógio estão fora do intervalo. |
| `invalidYearMonth` | `yearMonth()`, `monthYear()`, `YearMonth` | A string não pode ser interpretada como ano e mês, os números são fracionários ou o mês está fora de 1 a 12. |
| `invalidMonthDay` | `monthDay()`, `dayMonth()`, `MonthDay` | A string não pode ser interpretada como mês e dia, um separador ambíguo foi passado para `equals()` ou os campos estão fora do intervalo. |
| `invalidYear` | `MonthDay.in()` | O ano passado para `in()` não é inteiro ou está fora da faixa de anos suportada pelo Temporal. |
| `invalidDay` | `YearMonth.on()` | O dia passado para `on()` não é um inteiro de 1 a 31. |
| `invalidDuration` | `duration()`, `Duration` | Expressão de duração vazia ou ilegível, duração ISO 8601 inválida ou campos de duração fora do intervalo. |
| `invalidNumber` | `datetime()`, `duration()`, auxiliares de unidade | A entrada numérica é `NaN`, `Infinity`, `-Infinity` ou uma instância inválida de `Date`. |
| `conflictingSigns` | `duration()`, `Duration`, `minus()` | A duração mistura unidades positivas e negativas que não podem se compensar, como `'1h -30m'` ou dias sem âncora menos horas. |
| `invalidFraction` | `duration()`, `months()`, `times()` | Meses ou nanossegundos fracionários não podem ser convertidos em uma unidade fixa menor. |

### Unidades, fusos e formatos

| Código | Lançado por | Causa |
|---|---|---|
| `unknownUnit` | Aritmética, limites, arredondamento, `set()`, `duration()` | Nome ou abreviação de unidade em inglês não reconhecido. |
| `unknownDayOfWeek` | `dayOfWeek()`, `next()`, `previous()`, limites semanais, `configure()` | Nome do dia em inglês não reconhecido, ou número do dia da semana fora de 1 a 7. |
| `unknownSetting` | `configure()` | Chave de configuração passada para `configure()` não reconhecida. |
| `unknownWidth` | `configure()` | Uma entrada em `weekdayNames` informa uma largura diferente de `narrow`, `short` ou `long`, ou omite a largura. |
| `unknownZone` | Fábricas, `in()`, `configure()` | ID de fuso horário IANA desconhecido, fuso que não é string ou deslocamento UTC malformado. |
| `invalidZoneAliases` | `configure()` | `zoneAliases` não é um objeto simples nem `null`. |
| `unknownLocale` | `locale()`, fábricas, `format()`, `monthNames()`, `weekdayNames()`, `configure()` | A tag de locale, lista de tags ou cabeçalho `Accept-Language` contém uma tag de idioma inválida. |
| `unknownFormat` | `format()`, `monthNames()`, `weekdayNames()` | Especificação de formato ou opções `Intl` inválidas, estilo de duração ou rótulo sem suporte, ou tokens não reconhecidos ou colados fora de colchetes `[...]`. |
| `unsupportedToken` | `format()` | O padrão de tokens pede um campo que o valor não possui, como `HH` em uma `CalendarDate` ou `YYYY` em um `Time`. |
| `unknownKind` | `as()`, `DateRange.count()` | O tipo de destino não é suportado pelo valor de origem. |

### Aritmética e medições

| Código | Lançado por | Causa |
|---|---|---|
| `unsupportedUnit` | `CalendarDate`, `Time`, `YearMonth` | Uso de unidades de relógio em `CalendarDate`, unidades de calendário em `Time` ou unidades menores que mês em `YearMonth`. |
| `cannotAdd` | `plus()`, `add()` | A soma ultrapassa a faixa de datas representável pelo Temporal. |
| `cannotSubtract` | `minus()`, `subtract()` | A subtração ultrapassa a faixa de datas representável pelo Temporal. |
| `cannotSet` | `set()` | O valor do campo é fracionário ou está fora do intervalo para aquele mês de calendário ou unidade de relógio. |
| `cannotRound` | `round()`, `floor()`, `ceil()`, `Time.startOf()`, `Time.startOfNext()`, `Time.startOfPrevious()` | Unidade de arredondamento sem suporte ou passo que não divide exatamente a unidade superior. |
| `missingAnchor` | `Duration.balance()`, `total()`, `compare()` | Uma duração sem âncora precisa de uma data de calendário inicial para converter meses ou anos em semanas, dias ou unidades de relógio. |
| `cannotBalance` | `Duration.balance()` | O balanceamento da duração provoca estouro ou falha no arredondamento do Temporal. |
| `cannotTotal` | `Duration.total()`, `until()`, `since()` | O cálculo do total provoca estouro ou usa uma unidade sem suporte. |
| `missingPoints` | `earliest()`, `latest()` | Chamada sem argumentos ou com um array vazio. |
| `unsupportedComparison` | `CalendarDate`, `Time`, `YearMonth`, `MonthDay`, intervalos | Coerção numérica via `valueOf()`, `+` unário, `-`, `<` ou `>` em um tipo sem timestamp numérico. |

### Intervalos

| Código | Lançado por | Causa |
|---|---|---|
| `invalidRange` | `DateRange`, `DateTimeRange`, `to()` | O `end` do intervalo é anterior ao `start`. |
| `invalidStep` | `every()`, `split()` | A duração de passo passada para `every()` ou `split()` é zero ou negativa. |
| `unsupportedIntersection` | `TimeRange.intersection()` | Dois intervalos noturnos de horário se sobrepõem em duas janelas separadas ao cruzar a meia-noite. |
| `unsupportedZone` | `TimeRange.in()` | Chamada de `in()` em um `TimeRange`, que não tem data de calendário para situar em um fuso horário. |

### Plugins

| Código | Lançado por | Causa |
|---|---|---|
| `missingPlugin` | Fábricas, `configure()` | Uso de `loose`, `dayFirst` ou `zoneAliases` antes de importar o plugin correspondente. |
| `immutable` | Setters legados de `DateTime` | Chamada de um setter de `Date` que altera a instância, como `setHours()`, quando [`@native-dates/plugins/legacy-date`](/plugins/legacy-date/) está carregado. |
