---
source: "84e8bf9a4705"
title: Instalação
lede: Adicione o Native Dates em um único comando, com polyfill opcional para Safari e versões mais antigas do Node.
---

O Native Dates é um pacote ES module com tipos TypeScript incluídos e zero dependências de runtime.

## Instalar

Instale pelo npm ou use o comando de configuração interativa se você trabalha com um agente de código:

```bash label="npm"
npm i native-dates
```

```bash label="Com skills"
npx @native-dates/setup@latest
```

Depois, importe de `native-dates` na sua aplicação:

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## Suporte ao Safari e a versões mais antigas do Node

O Native Dates roda diretamente sobre as APIs nativas `Temporal` e `Intl` da plataforma. Versões atuais de Chrome, Edge, Firefox, Node 26+, Deno e Bun não precisam de mais nada.

Para Safari, navegadores mais antigos ou Node 22–25, instale o polyfill junto com `temporal-polyfill`:

```bash
npm i @native-dates/polyfill temporal-polyfill
```

Importe uma única vez no topo do arquivo de entrada, antes de carregar qualquer código com datas:

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[Custo zero em navegadores modernos]
Runtimes com `Temporal` e `Intl.DurationFormat` nativos nem sequer baixam nenhum dos polyfills.
:::

:::details[Notas de compatibilidade para runtimes mais antigos]
- **Carregamento síncrono:** Se um módulo importado executa código com datas no momento do carregamento, antes de o `await` de nível superior concluir, importe `@native-dates/polyfill/sync` no lugar.
- **Formatação de durações no Node 22–23:** `@native-dates/polyfill` inclui um fallback sem dependências para `Intl.DurationFormat`, fazendo [`Duration.format()`](/api/duration/#format) e `Duration.text` funcionarem também no Node 22–23 (navegadores e Node 24+ já oferecem o recurso nativamente e nunca baixam esse código).
:::

A seguir, leia [Personalização](/guides/customization/) para ajustar os padrões globais e adicionar plugins opcionais.
