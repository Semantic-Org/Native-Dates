---
source: a3a6297a2309
title: zones
lede: Résolvez des noms de villes, des abréviations régionales, des codes sensibles à la locale et des alias personnalisés partout où un fuseau horaire est accepté.
---

## Résoudre des villes et des abréviations

Le noyau accepte les identifiants IANA complets, les décalages UTC fixes et `'UTC'`. Importer ce plugin étend chaque paramètre de fuseau horaire de la bibliothèque aux noms de villes IANA en anglais, aux abréviations courantes et aux alias personnalisés.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // date du jour dans Asia/Tokyo
```

Chaque graphie se normalise vers son identifiant IANA canonique sur l’instance renvoyée. La comparaison de fuseaux horaires et la sérialisation restent cohérentes, quelle que soit la façon dont le fuseau a été saisi.

## Noms de villes

Tous les noms de villes IANA en anglais présents dans la base de fuseaux horaires de l’environnement se résolvent indépendamment de la casse, des accents, des espaces ou des tirets bas. Les grandes métropoles classées sous un autre nom par IANA sont aussi reconnues d’emblée, y compris certains alias localisés ou dans leur écriture d’origine comme `'Montréal'`, `'Bruxelles'`, `'Genève'`, `'東京'`, `'北京'`, `'서울'` et `'Москва'`.

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

Les alias de villes intégrés couvrent les grands pôles mondiaux comme NYC, San Francisco, Beijing, Mumbai, Munich et Osaka. Un nom non reconnu lève toujours une erreur [`unknownZone`](/api/errors/#units-zones-and-formats) au lieu de se replier sur le fuseau horaire du système.

## Abréviations qui suivent la locale

Certaines abréviations désignent des fuseaux horaires différents selon le pays. Lorsqu’un code est partagé, le plugin consulte d’abord la région de la locale active et se replie ailleurs sur l’interprétation principale.

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

La locale provient de la valeur elle-même, de l’option `{ locale }`, de [`configure()`](/api/configure/) ou de la locale par défaut de l’environnement.

| Nom | Interprétation par défaut et régionale |
|---|---|
| `CST` | `'America/Chicago'` par défaut ; `'Asia/Shanghai'` en `zh` et `zh-CN` ; `'Asia/Taipei'` en `zh-TW` ; `'America/Havana'` en `es-CU`. |
| `IST` | `'Asia/Kolkata'` par défaut ; `'Europe/Dublin'` en `en-IE` ; `'Asia/Jerusalem'` en `he`. |
| `PST` | `'America/Los_Angeles'` par défaut ; `'Asia/Manila'` en `fil` et `en-PH`. |
| `BST` | `'Europe/London'` par défaut ; `'Asia/Dhaka'` en `bn`. |
| `AST` | `'America/Halifax'` par défaut ; `'Asia/Riyadh'` en `ar-SA`. |
| `ACT` | `'Australia/Adelaide'` par défaut ; `'America/Rio_Branco'` en `pt-BR`. |
| `AMT` | `'America/Manaus'` par défaut ; `'Asia/Yerevan'` en `hy`. |
| `San Juan` | `'America/Argentina/San_Juan'` par défaut ; `'America/Puerto_Rico'` en `es-PR`. |

## Abréviations courantes

Les abréviations et noms régionaux (y compris des abréviations francophones comme `'HNE'` et `'HAE'`) renvoient vers le fuseau horaire IANA principal de la région, avec prise en compte de l’heure d’été.

| Abréviations | Fuseau canonique | Région |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | Heure du Pacifique en Amérique du Nord (`PST` suit la locale). |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | Heure des Rocheuses en Amérique du Nord. |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | Heure du Centre en Amérique du Nord (`CST` suit la locale). |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | Heure de l’Est en Amérique du Nord. |
| `HNE`, `HAE` | `'America/Toronto'` | Heure de l’Est au Canada francophone. |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | Heure de l’Alaska. |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | Heure d’Hawaï. |
| `AT`, `AST` | `'America/Halifax'` | Heure de l’Atlantique (`AST` suit la locale). |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | Heure de Brasilia et de Fernando de Noronha. |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | Heure d’Argentine, de Colombie et du Chili. |
| `GMT`, `Z` | `'UTC'` | Temps universel coordonné. |
| `UK`, `WET`, `BST` | `'Europe/London'` | Royaume-Uni et Europe occidentale (`BST` suit la locale). |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | Heure d’Europe centrale. |
| `EET` | `'Europe/Helsinki'` | Heure d’Europe orientale. |
| `MSK`, `мск` | `'Europe/Moscow'` | Heure normale de Moscou. |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | Heure d’Afrique de l’Ouest, de l’Est et australe. |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | Heure du Golfe, d’Iran et du Pakistan. |
| `IST`, `INST` | `'Asia/Kolkata'` | Heure normale de l’Inde (`IST` suit la locale). |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | Heure d’Indochine, d’Indonésie occidentale et des Philippines. |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | Heure normale du Japon et de Corée. |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | Heure de Singapour et de Hong Kong. |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | Heure de l’Est australien. |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | Heure d’Australie centrale et occidentale (`ACT` suit la locale). |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | Heure de Nouvelle-Zélande. |

:::note[Les abréviations suivent l’heure d’été]
Dans les données IANA brutes, le code `EST` seul correspond à un décalage fixe de cinq heures qui ne passe jamais à l’heure d’été en mars. Ce plugin associe les abréviations du Pacifique et de l’Est à `'America/Los_Angeles'` et `'America/New_York'` pour que les calculs de changement d’heure restent exacts. Passez un décalage numérique comme `'-08:00'` si vous voulez un décalage fixe toute l’année.
:::

## Alias personnalisés

Déclarez des raccourcis pour vos bureaux, vos équipes ou des surcharges fixes d’abréviations une seule fois au démarrage avec [`configure()`](/api/configure/). Les alias personnalisés ont priorité sur la résolution dépendant de la locale.

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

Ajoute ou supprime des noms de fuseaux horaires personnalisés dans la table de configuration globale. La correspondance des clés d’alias ignore la casse et les accents, et chaque cible peut être un identifiant IANA complet, une ville ou une abréviation. Affectez `null` à une clé pour supprimer un alias, ou passez `zoneAliases: null` pour tous les effacer.

**Paramètres**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "Table associant des noms personnalisés à des fuseaux horaires valides ou à `null` (ou `null` directement pour effacer tous les alias personnalisés)."
```

**Valeur de retour**

```returns
type: Settings
description: Instantané de la configuration active avec des cibles d’alias normalisées.
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

Le plugin exporte aussi sa table modifiable `timezones` si vous souhaitez inspecter ou figer directement les abréviations de base au démarrage. Définir une entrée comme `timezones.IST = 'Asia/Jerusalem'` remplace la résolution dépendant de la locale pour toutes les locales :

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
