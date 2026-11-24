---
source: "68d49ce6b3ea"
title: monthNames()
lede: Retorne arrays com nomes localizados de meses e dias da semana para cabeçalhos e menus de calendário.
---

## Rótulos de calendário

Ambas as funções leem tabelas `Intl` em cache no core e retornam um novo array a cada chamada. Você pode usar `map`, `slice` ou `reverse` na lista retornada à vontade, sem alterar nenhum estado compartilhado.

:::entry
### `monthNames()` :kind[function]

```js signature
monthNames(style?, locale?): string[]
```

Retorna um array com os 12 nomes localizados dos meses do calendário gregoriano, de janeiro a dezembro. Por padrão, usa nomes completos no [locale configurado](/api/configure/).

**Parâmetros**

```params
- name: style
  type: "'long' | 'short'"
  default: "'long'"
  description: Nomes completos de meses como `'January'` ou nomes abreviados como `'Jan'`.
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que substitui o padrão configurado.
```

**Retorno**

```returns
type: string[]
description: Doze rótulos de meses ordenados do índice `0` para janeiro até `11` para dezembro.
```

```js title="months.js"
import { monthNames } from 'native-dates';

monthNames('short', 'en-US');
// ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

monthNames('long', 'fr-FR').slice(0, 3);
// ['janvier', 'février', 'mars']
```
:::

:::entry
### `weekdayNames()` :kind[function]

```js signature
weekdayNames(style?, firstDay?, locale?): string[]
```

Retorna um array com 7 rótulos localizados de dias da semana, rotacionados para começar em `firstDay`, no `weekStart` definido nas [configurações globais](/api/configure/) ou no primeiro dia da semana do locale ativo.

Os limites semanais em [`startOf('week')`](/api/calendar-date/#startof) e os intervalos de semana seguem a mesma regra de primeiro dia, mantendo os cabeçalhos do calendário sempre alinhados às grades semanais. Rótulos personalizados de dias da semana definidos em [`configure()`](/api/configure/) também se aplicam aqui.

**Parâmetros**

```params
- name: style
  type: "'short' | 'long' | 'narrow'"
  default: "'short'"
  description: "Rótulos abreviados como `'Mon'`, nomes completos como `'Monday'` ou cabeçalhos compactos de uma ou duas letras como `'Mo'`."
- name: firstDay
  type: DayOfWeek
  description: Nome do dia da semana inicial em inglês ou número ISO de 1 (segunda-feira) a 7 (domingo).
- name: locale
  type: Locale
  description: Tag de locale BCP 47 que substitui o padrão configurado.
```

**Retorno**

```returns
type: string[]
description: Sete rótulos de dias da semana começando em `firstDay`, no `weekStart` configurado ou no primeiro dia do locale.
```

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('short', undefined, 'en-US');
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

weekdayNames('narrow', undefined, 'en-US');
// ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

weekdayNames('narrow', undefined, 'pt-BR');
// ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

weekdayNames('short', 'monday', 'en-US');
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInGrid = date('2026-11-18', { locale: 'en-US' }).range('week').every('day');
daysInGrid[0].format({ weekday: 'short' }); // 'Sun'
```
:::
