---
source: "a3a6297a2309"
title: zones
lede: Resolva nomes de cidades, abreviações regionais, códigos de fuso sensíveis ao locale e aliases personalizados onde quer que um fuso horário seja aceito.
---

## Resolver cidades e abreviações

O núcleo aceita identificadores IANA completos, deslocamentos UTC fixos e `'UTC'`. Importar este plugin amplia todo parâmetro de fuso horário da biblioteca para aceitar nomes de cidades, abreviações comuns e aliases personalizados.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // data atual em Asia/Tokyo
```

Qualquer grafia aceita é normalizada para o identificador IANA canônico na instância resultante. Comparar fusos ou serializar valores permanece consistente independentemente de como o fuso foi digitado.

## Nomes de cidades

Qualquer cidade presente na base de fusos horários do runtime é resolvida ignorando maiúsculas, acentos, espaços ou underscores. Grandes cidades cujo fuso IANA usa outro nome também funcionam direto com seus nomes em inglês e grafias em escrita local.

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

Os aliases integrados cobrem grandes polos pelos seus nomes em inglês, como NYC, San Francisco, Beijing, Mumbai, Munich e Osaka (além de grafias nativas como `東京` e `Москва`). Nomes não reconhecidos continuam lançando [`unknownZone`](/api/errors/#units-zones-and-formats) em vez de cair silenciosamente no relógio local do sistema.

## Abreviações que seguem o locale

Algumas abreviações representam fusos diferentes conforme o país. Quando uma sigla é compartilhada, o plugin consulta primeiro a região do locale ativo e usa a leitura principal nos demais casos.

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

O locale vem do próprio valor, da opção `{ locale }`, de [`configure()`](/api/configure/) ou do padrão do runtime.

| Nome | Leitura padrão e variações regionais |
|---|---|
| `CST` | `'America/Chicago'` por padrão; `'Asia/Shanghai'` em `zh` e `zh-CN`; `'Asia/Taipei'` em `zh-TW`; `'America/Havana'` em `es-CU`. |
| `IST` | `'Asia/Kolkata'` por padrão; `'Europe/Dublin'` em `en-IE`; `'Asia/Jerusalem'` em `he`. |
| `PST` | `'America/Los_Angeles'` por padrão; `'Asia/Manila'` em `fil` e `en-PH`. |
| `BST` | `'Europe/London'` por padrão; `'Asia/Dhaka'` em `bn`. |
| `AST` | `'America/Halifax'` por padrão; `'Asia/Riyadh'` em `ar-SA`. |
| `ACT` | `'Australia/Adelaide'` por padrão; `'America/Rio_Branco'` em `pt-BR`. |
| `AMT` | `'America/Manaus'` por padrão; `'Asia/Yerevan'` em `hy`. |
| `San Juan` | `'America/Argentina/San_Juan'` por padrão; `'America/Puerto_Rico'` em `es-PR`. |

## Abreviações comuns

Abreviações e nomes regionais apontam para o fuso IANA principal da região, com regras de horário de verão incluídas.

| Abreviações | Fuso canônico | Região |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | Horário do Pacífico na América do Norte (`PST` segue o locale). |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | Horário das Montanhas na América do Norte. |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | Horário Central na América do Norte (`CST` segue o locale). |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | Horário do Leste na América do Norte. |
| `HNE`, `HAE` | `'America/Toronto'` | Horário do Leste no Canadá francófono. |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | Horário do Alasca. |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | Horário do Havaí. |
| `AT`, `AST` | `'America/Halifax'` | Horário do Atlântico (`AST` segue o locale). |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | Horário de Brasília e de Fernando de Noronha. |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | Horário da Argentina, da Colômbia e do Chile. |
| `GMT`, `Z` | `'UTC'` | Tempo Universal Coordenado. |
| `UK`, `WET`, `BST` | `'Europe/London'` | Reino Unido e Europa Ocidental (`BST` segue o locale). |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | Horário da Europa Central. |
| `EET` | `'Europe/Helsinki'` | Horário do Leste Europeu. |
| `MSK`, `мск` | `'Europe/Moscow'` | Horário Padrão de Moscou. |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | Horário da África Ocidental, Oriental e Meridional. |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | Horário do Golfo, do Irã e do Paquistão. |
| `IST`, `INST` | `'Asia/Kolkata'` | Horário Padrão da Índia (`IST` segue o locale). |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | Horário da Indochina, da Indonésia Ocidental e das Filipinas. |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | Horário Padrão do Japão e da Coreia. |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | Horário de Singapura e de Hong Kong. |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | Horário do Leste da Austrália. |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | Horário Central e Ocidental da Austrália (`ACT` segue o locale). |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | Horário da Nova Zelândia. |

:::note[As abreviações respeitam o horário de verão]
Nos dados IANA brutos, `EST` isolado é um deslocamento fixo de menos cinco horas que nunca adianta em março. Este plugin mapeia abreviações do Pacífico e do Leste para `'America/Los_Angeles'` e `'America/New_York'` para que os cálculos de horário de verão permaneçam corretos. Passe um deslocamento numérico como `'-08:00'` quando precisar de um deslocamento fixo o ano inteiro.
:::

## Aliases personalizados

Registre apelidos para escritórios, equipes ou sobrescritas fixas de abreviações uma vez na inicialização com [`configure()`](/api/configure/). Aliases personalizados têm precedência sobre a resolução por locale.

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

Adiciona ou remove nomes personalizados de fuso na tabela global de configuração. As chaves ignoram maiúsculas e acentos, e os destinos podem ser identificadores IANA completos, cidades ou abreviações. Defina uma chave como `null` para remover um alias ou passe `zoneAliases: null` para limpar todos.

**Parâmetros**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "Mapa de nomes personalizados para fusos válidos ou `null`, ou `null` para limpar todos os aliases personalizados."
```

**Retorno**

```returns
type: Settings
description: Cópia da configuração ativa com os destinos dos aliases normalizados.
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

O plugin também exporta o mapa mutável `timezones` para inspecionar ou fixar abreviações base diretamente na inicialização. Atribuir `timezones.IST = 'Asia/Jerusalem'` sobrescreve a resolução por locale em todos os locales:

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
