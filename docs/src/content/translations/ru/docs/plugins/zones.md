---
source: a3a6297a2309
title: zones
lede: Разрешение английских названий городов, региональных аббревиатур, зависящих от локали кодов и пользовательских псевдонимов везде, где принимается часовой пояс.
---

## Разрешение городов и аббревиатур

Ядро библиотеки принимает полные идентификаторы IANA, фиксированные смещения UTC и `'UTC'`. Импорт этого плагина расширяет каждый параметр `zone` во всей библиотеке, позволяя передавать английские названия городов из базы IANA, распространённые аббревиатуры, встроенные названия на национальных языках (`'москва'`, `'мск'`, `'東京'`, `'北京'`, `'서울'`) и пользовательские псевдонимы.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // текущая дата в Asia/Tokyo
```

Любое написание приводится к каноническому идентификатору IANA на итоговом экземпляре. Сравнение часовых поясов и сериализация значений остаются единообразными независимо от того, как именно был указан пояс.

## Названия городов

Любое английское название города из базы часовых поясов среды выполнения разрешается независимо от регистра, диакритических знаков, пробелов и подчёркиваний. Крупные города, которые в IANA записаны под другим названием, также работают из коробки, включая встроенные псевдонимы на национальных языках (`'москва'`, `'мск'`, `'東京'`, `'北京'`, `'서울'`).

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

Встроенные английские псевдонимы городов охватывают крупные центры вроде `NYC`, `San Francisco`, `Beijing`, `Mumbai`, `Munich` и `Osaka`. Нераспознанные имена по-прежнему выбрасывают ошибку [`unknownZone`](/api/errors/#units-zones-and-formats), а не подставляют системный часовой пояс.

## Аббревиатуры с учётом локали

Некоторые аббревиатуры обозначают разные часовые пояса в разных странах. Если сокращение неоднозначно, плагин сначала проверяет регион активной локали, а в остальных случаях использует основное значение по умолчанию.

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

Локаль берётся из самого значения, опции `{ locale }`, настроек [`configure()`](/api/configure/) или локали среды выполнения по умолчанию.

| Обозначение | Основное и региональные значения |
|---|---|
| `CST` | `'America/Chicago'` по умолчанию; `'Asia/Shanghai'` для `zh` и `zh-CN`; `'Asia/Taipei'` для `zh-TW`; `'America/Havana'` для `es-CU`. |
| `IST` | `'Asia/Kolkata'` по умолчанию; `'Europe/Dublin'` для `en-IE`; `'Asia/Jerusalem'` для `he`. |
| `PST` | `'America/Los_Angeles'` по умолчанию; `'Asia/Manila'` для `fil` и `en-PH`. |
| `BST` | `'Europe/London'` по умолчанию; `'Asia/Dhaka'` для `bn`. |
| `AST` | `'America/Halifax'` по умолчанию; `'Asia/Riyadh'` для `ar-SA`. |
| `ACT` | `'Australia/Adelaide'` по умолчанию; `'America/Rio_Branco'` для `pt-BR`. |
| `AMT` | `'America/Manaus'` по умолчанию; `'Asia/Yerevan'` для `hy`. |
| `San Juan` | `'America/Argentina/San_Juan'` по умолчанию; `'America/Puerto_Rico'` для `es-PR`. |

## Распространённые аббревиатуры

Аббревиатуры и региональные названия сопоставляются с основным часовым поясом IANA этого региона с учётом сезонного перевода часов.

| Аббревиатуры | Канонический часовой пояс | Регион |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | Тихоокеанское время Северной Америки (`PST` зависит от локали). |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | Горное время Северной Америки. |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | Центральное время Северной Америки (`CST` зависит от локали). |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | Восточное время Северной Америки. |
| `HNE`, `HAE` | `'America/Toronto'` | Восточное время франкоязычной Канады. |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | Время Аляски. |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | Гавайское время. |
| `AT`, `AST` | `'America/Halifax'` | Атлантическое время (`AST` зависит от локали). |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | Время Бразилиа и Фернанду-ди-Норонья. |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | Время Аргентины, Колумбии и Чили. |
| `GMT`, `Z` | `'UTC'` | Всемирное координированное время. |
| `UK`, `WET`, `BST` | `'Europe/London'` | Великобритания и Западная Европа (`BST` зависит от локали). |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | Центральноевропейское время. |
| `EET` | `'Europe/Helsinki'` | Восточноевропейское время. |
| `MSK`, `мск` | `'Europe/Moscow'` | Московское время. |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | Западная, Восточная и Южная Африка. |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | Персидский залив, Иран и Пакистан. |
| `IST`, `INST` | `'Asia/Kolkata'` | Индийское стандартное время (`IST` зависит от локали). |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | Индокитай, Западная Индонезия и Филиппины. |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | Японское и корейское стандартное время. |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | Сингапурское и гонконгское время. |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | Восточноавстралийское время. |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | Центрально- и западноавстралийское время (`ACT` зависит от локали). |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | Новозеландское время. |

:::note[Аббревиатуры учитывают летнее время]
В самой базе IANA код `EST` означает фиксированное смещение на пять часов, которое никогда не переводится весной. Этот плагин сопоставляет тихоокеанские и восточные аббревиатуры с `'America/Los_Angeles'` и `'America/New_York'`, чтобы расчёты с учётом перехода на летнее время оставались точными. Если нужно фиксированное смещение круглый год, передайте числовое смещение вроде `'-08:00'`.
:::

## Пользовательские псевдонимы

Зарегистрируйте короткие имена для офисов, команд или фиксированных переопределений аббревиатур один раз при запуске через [`configure()`](/api/configure/). Пользовательские псевдонимы имеют приоритет над разрешением по локали.

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

Добавляет или удаляет пользовательские названия часовых поясов в глобальной таблице настроек. Ключи сопоставляются без учёта регистра и диакритических знаков, а значениями могут быть полные имена IANA, названия городов или аббревиатуры. Укажите `null` для отдельного ключа, чтобы удалить один псевдоним, или передайте `zoneAliases: null`, чтобы очистить все псевдонимы.

**Параметры**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "Словарь соответствий пользовательских имён допустимым часовым поясам (или `null` для удаления одного псевдонима) либо `null` для очистки всех пользовательских псевдонимов."
```

**Возвращаемое значение**

```returns
type: Settings
description: Снимок активной конфигурации с приведёнными к каноническому виду целевыми часовыми поясами.
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

Плагин также экспортирует изменяемый словарь `timezones`, если нужно просмотреть или зафиксировать базовые аббревиатуры напрямую при старте. Присваивание вроде `timezones.IST = 'Asia/Jerusalem'` переопределяет разрешение по локали сразу для всех локалей:

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
