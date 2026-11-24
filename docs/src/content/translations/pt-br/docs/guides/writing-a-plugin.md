---
source: "46b27cf4cf7e"
title: Criando um plugin
lede: Estenda o Native Dates com métodos de protótipo sob demanda e ampliação de tipos em TypeScript.
---

Plugins são ativados no momento em que são importados.

Você pode publicar pacotes reutilizáveis ou criar helpers de domínio na própria aplicação usando o mesmo modelo de [`zones`](/plugins/zones/) e [`legacy-date`](/plugins/legacy-date/) em [`@native-dates/plugins`](/plugins/).

## Anexar métodos ao protótipo

Importe a classe que você quer estender e adicione o novo método ao seu `prototype`.

Todas as instâncias são congeladas na construção. Os métodos de plugin devem ser puros e retornar um novo valor ou resultado calculado, sem mutar `this`.

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

Leia propriedades públicas da instância ou chame [`this.toTemporal()`](/api/calendar-date/#totemporal), e construa o retorno com métodos como [`this.plus()`](/api/calendar-date/#plus).

Ao estender um método existente como [`format()`](/api/calendar-date/#format), guarde primeiro a função original e delegue a ela as entradas que o plugin não tratar:

```js
const baseFormat = CalendarDate.prototype.format;

CalendarDate.prototype.format = function format(spec, locale) {
  if (spec === 'compact') {
    return this.toString().replaceAll('-', '');
  }
  return baseFormat.call(this, spec, locale);
};

date('2026-11-16').format('compact'); // '20261116'
date('2026-11-16').format('short', 'en-US'); // '11/16/26'
```

## Verificar tipos entre bundles

Evite testar `value.constructor.name` nos helpers do plugin. Em monorepos, micro-frontends ou iframes, duas cópias do mesmo pacote podem coexistir em memória.

Cada classe carrega um símbolo global de marcação. Type guards, [`kindOf()`](/api/kind-of/) e símbolos como [`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) reconhecem valores entre contextos isolados e bundles duplicados.

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## Declarar sideEffects no package.json

Quem usa o plugin o ativa com uma importação direta. Liste os arquivos de entrada em `"sideEffects"` e declare `"native-dates"` em `peerDependencies` para que o bundler preserve a importação e compartilhe as classes da aplicação hospedeira:

```json title="package.json"
{
  "name": "my-dates-plugin",
  "type": "module",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "default": "./index.js"
    }
  },
  "sideEffects": ["./index.js"],
  "peerDependencies": {
    "native-dates": "^1.0.0"
  }
}
```

:::warning[Não marque plugins com efeito colateral como sideEffects false]
Definir `"sideEffects": false` faz o bundler remover importações diretas do plugin no build de produção, mesmo quando os testes unitários passam no Node.
:::

## Estender os tipos em TypeScript

Use `declare module 'native-dates'` no seu arquivo de declarações para mesclar novas assinaturas de método às classes ou às opções de configuração:

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

Assim que o módulo for importado, o TypeScript passa a exibir o seu método junto aos métodos nativos onde quer que a classe seja usada.
