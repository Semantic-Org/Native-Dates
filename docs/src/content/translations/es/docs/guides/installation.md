---
source: "84e8bf9a4705"
title: Instalación
lede: Instala Native Dates con un solo comando y añade un polyfill opcional para Safari y versiones anteriores de Node.
---

Native Dates es un paquete de módulos ES con tipos de TypeScript incluidos y cero dependencias en tiempo de ejecución.

## Instalar

Instálalo desde npm o usa el comando de configuración si trabajas con un agente de IA:

```bash label="npm"
npm i native-dates
```

```bash label="Con skills"
npx @native-dates/setup@latest
```

Luego importa lo que necesites desde `native-dates` en tu aplicación:

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## Soporte para Safari y versiones anteriores de Node

Native Dates se ejecuta directamente sobre las APIs integradas `Temporal` e `Intl` de la plataforma. Las versiones actuales de Chrome, Edge, Firefox, Node 26+, Deno y Bun no necesitan nada más.

En Safari, navegadores antiguos o Node 22–25, instala el polyfill junto con `temporal-polyfill`:

```bash
npm i @native-dates/polyfill temporal-polyfill
```

Impórtalo una vez al inicio de tu archivo de entrada, antes de cargar código que trabaje con fechas:

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[Sin costo en navegadores modernos]
Los entornos con `Temporal` e `Intl.DurationFormat` nativos ni siquiera descargan ninguno de los dos polyfills.
:::

:::details[Notas de compatibilidad para entornos antiguos]
- **Carga síncrona:** si un módulo importado evalúa fechas al cargarse, antes de que finalice un `await` de nivel superior, importa `@native-dates/polyfill/sync` en su lugar.
- **Formateo de duraciones en Node 22–23:** `@native-dates/polyfill` incluye un respaldo sin dependencias de `Intl.DurationFormat` para que [`Duration.format()`](/api/duration/#format) y `Duration.text` también funcionen en Node 22–23 (los navegadores y Node 24+ lo traen de forma nativa y nunca lo descargan).
:::

A continuación, lee [Personalización](/guides/customization/) para ajustar los valores predeterminados y añadir plugins opcionales.
