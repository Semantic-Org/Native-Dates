---
source: 'a3a6297a2309'
title: zones
lede: Resuelve nombres de ciudades, abreviaturas regionales, códigos de zona sensibles al locale y alias personalizados en cualquier lugar donde se acepte una zona.
---

## Resolver ciudades y abreviaturas

El núcleo acepta identificadores IANA completos, desplazamientos UTC fijos y `'UTC'`. Importar este plugin extiende todos los parámetros de zona de la biblioteca para aceptar nombres de ciudades, abreviaturas comunes y alias personalizados.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // fecha actual en Asia/Tokyo
```

Todas las variantes se normalizan a su identificador IANA canónico en la instancia resultante. Comparar zonas o serializar valores se mantiene consistente sin importar cómo se haya escrito la zona.

## Nombres de ciudades

Cualquier ciudad presente en la base de datos de zonas horarias del entorno (por su nombre IANA en inglés) se resuelve sin importar mayúsculas, acentos, espacios ni guiones bajos. Las grandes ciudades que IANA registra bajo otro nombre también funcionan de inmediato, incluidas sus grafías en escrituras locales.

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

Los alias integrados cubren grandes centros urbanos con nombres en inglés como NYC, San Francisco, Beijing, Mumbai, Munich y Osaka. Los nombres no reconocidos siguen lanzando un error [`unknownZone`](/api/errors/#units-zones-and-formats) en lugar de recurrir al reloj local del sistema.

## Abreviaturas que siguen el locale

Algunas abreviaturas designan zonas distintas según el país. Cuando un nombre es compartido, el plugin comprueba primero la región del locale activo y recurre a la lectura principal en el resto de los casos.

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

El locale se toma del propio valor, de la opción `{ locale }`, de [`configure()`](/api/configure/) o del valor predeterminado del entorno.

| Nombre | Lectura predeterminada y variantes regionales |
|---|---|
| `CST` | `'America/Chicago'` por defecto; `'Asia/Shanghai'` en `zh` y `zh-CN`; `'Asia/Taipei'` en `zh-TW`; `'America/Havana'` en `es-CU`. |
| `IST` | `'Asia/Kolkata'` por defecto; `'Europe/Dublin'` en `en-IE`; `'Asia/Jerusalem'` en `he`. |
| `PST` | `'America/Los_Angeles'` por defecto; `'Asia/Manila'` en `fil` y `en-PH`. |
| `BST` | `'Europe/London'` por defecto; `'Asia/Dhaka'` en `bn`. |
| `AST` | `'America/Halifax'` por defecto; `'Asia/Riyadh'` en `ar-SA`. |
| `ACT` | `'Australia/Adelaide'` por defecto; `'America/Rio_Branco'` en `pt-BR`. |
| `AMT` | `'America/Manaus'` por defecto; `'Asia/Yerevan'` en `hy`. |
| `San Juan` | `'America/Argentina/San_Juan'` por defecto; `'America/Puerto_Rico'` en `es-PR`. |

## Abreviaturas comunes

Las abreviaturas y nombres regionales se asignan a la zona IANA principal con horario de verano de esa región.

| Abreviaturas | Zona canónica | Región |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | Hora del Pacífico en Norteamérica (`PST` sigue el locale). |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | Hora de la Montaña en Norteamérica. |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | Hora del Centro en Norteamérica (`CST` sigue el locale). |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | Hora del Este en Norteamérica. |
| `HNE`, `HAE` | `'America/Toronto'` | Hora del Este en Canadá francófono. |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | Hora de Alaska. |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | Hora de Hawái. |
| `AT`, `AST` | `'America/Halifax'` | Hora del Atlántico (`AST` sigue el locale). |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | Hora de Brasilia y Fernando de Noronha. |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | Hora de Argentina, Colombia y Chile. |
| `GMT`, `Z` | `'UTC'` | Tiempo universal coordinado. |
| `UK`, `WET`, `BST` | `'Europe/London'` | Reino Unido y Europa Occidental (`BST` sigue el locale). |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | Hora de Europa Central. |
| `EET` | `'Europe/Helsinki'` | Hora de Europa Oriental. |
| `MSK`, `мск` | `'Europe/Moscow'` | Hora estándar de Moscú. |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | Hora de África Occidental, Oriental y del Sur. |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | Hora del Golfo, Irán y Pakistán. |
| `IST`, `INST` | `'Asia/Kolkata'` | Hora estándar de la India (`IST` sigue el locale). |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | Hora de Indochina, Indonesia Occidental y Filipinas. |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | Hora estándar de Japón y Corea. |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | Hora de Singapur y Hong Kong. |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | Hora del Este de Australia. |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | Hora Central y Occidental de Australia (`ACT` sigue el locale). |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | Hora de Nueva Zelanda. |

:::note[Las abreviaturas respetan el horario de verano]
En los datos IANA sin procesar, EST a secas es un desplazamiento fijo de cinco horas que nunca adelanta el reloj en marzo. Este plugin asigna las abreviaturas del Pacífico y del Este a `'America/Los_Angeles'` y `'America/New_York'` para que los cálculos de horario de verano sean precisos. Pasa un desplazamiento numérico como `'-08:00'` si necesitas un desplazamiento fijo durante todo el año.
:::

## Alias personalizados

Registra nombres cortos para oficinas, equipos o reemplazos fijos de abreviaturas una sola vez al iniciar la aplicación con [`configure()`](/api/configure/). Los alias personalizados tienen prioridad sobre la resolución basada en el locale.

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

Añade o elimina nombres de zona personalizados en la tabla global de configuración. Las claves de los alias no distinguen mayúsculas ni acentos, y los destinos pueden ser nombres IANA completos, ciudades o abreviaturas. Asigna `null` a una clave para borrar un alias concreto, o pasa `zoneAliases: null` para borrarlos todos.

**Parámetros**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "Mapa de nombres personalizados a zonas válidas o `null`, o `null` para borrar todos los alias personalizados."
```

**Devuelve**

```returns
type: Settings
description: Copia de la configuración activa con los destinos de los alias normalizados.
```

```js
import { configure } from 'native-dates';

configure({
  zoneAliases: {
    hq: 'Berlin',
    west: 'PT',
    ist: 'Asia/Jerusalem',
  },
});

datetime('2026-11-16T09:30', 'west').in('hq').zone; // 'Europe/Berlin'
datetime('2026-11-16T09:30Z', 'IST').zone; // 'Asia/Jerusalem'

configure({ zoneAliases: null });
```
:::

El plugin también exporta su mapa mutable `timezones` por si necesitas inspeccionar o fijar abreviaturas base directamente al arrancar. Asignar una entrada como `timezones.IST = 'Asia/Jerusalem'` sobrescribe la resolución por locale para todos los locales:

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
