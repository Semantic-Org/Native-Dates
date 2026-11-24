---
source: "46b27cf4cf7e"
title: Crear un plugin
lede: Extiende Native Dates con métodos opcionales en el prototipo y ampliación de módulos en TypeScript.
---

Los plugins se activan al importarlos.

Puedes publicar paquetes reutilizables o añadir utilidades de dominio en tu propia aplicación con el mismo patrón que usan [`zones`](/plugins/zones/) y [`legacy-date`](/plugins/legacy-date/) en [`@native-dates/plugins`](/plugins/).

## Añadir métodos al prototipo

Importa la clase que quieres extender y define el método en su `prototype`.

Todas las instancias se congelan al construirse. Los métodos de un plugin deben mantenerse puros y devolver un nuevo valor o un resultado calculado en lugar de mutar `this`.

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

Lee las propiedades públicas de la instancia o llama a [`this.toTemporal()`](/api/calendar-date/#totemporal), y construye los valores devueltos mediante métodos como [`this.plus()`](/api/calendar-date/#plus).

Cuando extiendas un método existente como [`format()`](/api/calendar-date/#format), guarda primero la referencia al método original y delega en él para las entradas que tu plugin no gestiona:

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

## Comprobar tipos entre paquetes duplicados

Evita comprobar `value.constructor.name` en las utilidades de un plugin. En monorrepositorios, microfrontends o iframes pueden coexistir dos copias del paquete en memoria a la vez.

Cada clase lleva una marca mediante un símbolo global. Los comprobadores de tipo, [`kindOf()`](/api/kind-of/) y los símbolos de marca como [`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) reconocen los valores entre contextos de ejecución y paquetes duplicados.

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## Declarar sideEffects en package.json

Quien use tu plugin lo activará con una importación sin identificadores (por efecto secundario). Declara tus archivos de entrada en `"sideEffects"` y coloca `"native-dates"` en `peerDependencies` para que el empaquetador conserve la importación y comparta las clases de la aplicación anfitriona:

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

:::warning[No marques un plugin con efectos secundarios como sideEffects false]
Indicar `"sideEffects": false` le dice al empaquetador que elimine las importaciones sin identificadores del plugin en producción, aunque las pruebas unitarias pasen en Node.
:::

## Ampliar tipos en TypeScript

Declara `module 'native-dates'` en tu archivo de declaraciones para fusionar las firmas de tus nuevos métodos con las clases existentes o con las opciones de configuración:

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

Al importar el plugin, TypeScript muestra tu método junto a los métodos integrados en cada llamada.
