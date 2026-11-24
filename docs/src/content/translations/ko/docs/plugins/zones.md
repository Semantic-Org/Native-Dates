---
source: a3a6297a2309
title: zones
lede: 시간대를 받는 모든 곳에서 영어 도시명, 지역 약어, 로케일별 시간대 코드, 사용자 정의 별칭을 해석합니다.
---

## 도시명과 약어 해석

코어는 전체 IANA 식별자, 고정 UTC 오프셋, `'UTC'`를 지원합니다. 이 플러그인을 가져오면 라이브러리의 모든 시간대 매개변수에서 영어 도시명, 주요 지역 약어, 사용자 정의 별칭까지 사용할 수 있습니다.

```js title="zones.js"
import '@native-dates/plugins/zones';
import { date, datetime, today } from 'native-dates';

const standup = datetime('2026-11-16T09:30', 'PT');

standup.zone; // 'America/Los_Angeles'
standup.in('Berlin').hour; // 18
date('2026-11-16').at('9:00am', 'Beijing').zone; // 'Asia/Shanghai'
today('JST').toString(); // Asia/Tokyo 기준 현재 날짜
```

어떤 표기로 입력하든 생성된 인스턴스에는 표준 IANA 식별자로 정규화되어 저장됩니다. 입력 방식과 무관하게 시간대 비교와 직렬화 결과가 일관되게 유지됩니다.

## 도시명

런타임 시간대 데이터베이스에 등록된 모든 영어 도시명은 대소문자, 발음 구별 기호, 공백, 밑줄과 무관하게 해석됩니다. IANA가 다른 도시 이름으로 분류한 주요 도시의 영어 별칭도 바로 지원하며, `'서울'`, `'東京'`, `'北京'`, `'москва'` 같은 일부 현지 문자 표기 예외도 내장되어 있습니다.

```js
const moment = datetime('2026-11-03T17:30Z');

moment.in('los angeles').zone; // 'America/Los_Angeles'
moment.in('Mumbai').zone; // 'Asia/Kolkata'
moment.in('Rio de Janeiro').zone; // 'America/Sao_Paulo'
moment.in('東京').zone; // 'Asia/Tokyo'
moment.in('Москва').zone; // 'Europe/Moscow'
```

내장 도시 별칭은 NYC, San Francisco, Beijing, Mumbai, Munich, Osaka 같은 주요 거점의 영어 도시명과 일부 현지 문자 표기(`'서울'`, `'東京'`, `'北京'`, `'москва'`)를 포함합니다. 인식할 수 없는 이름은 로컬 시스템 시간대로 대체되지 않고 여전히 [`unknownZone`](/api/errors/#units-zones-and-formats) 오류를 던집니다.

## 로케일에 따라 달라지는 약어

일부 약어는 국가마다 서로 다른 시간대를 가리킵니다. 여러 지역이 공유하는 약어가 전달되면 플러그인은 활성 로케일의 지역을 먼저 확인하고, 해당하지 않으면 기본 시간대로 해석합니다.

```js
const call = datetime('2026-11-16T09:30Z');

call.locale('en-US').in('CST').zone; // 'America/Chicago'
call.locale('zh-CN').in('CST').zone; // 'Asia/Shanghai'
call.locale('he-IL').in('IST').zone; // 'Asia/Jerusalem'
```

로케일은 값 자체, `{ locale }` 옵션, [`configure()`](/api/configure/), 런타임 기본값 순으로 결정됩니다.

| 이름 | 기본값 및 지역별 해석 |
|---|---|
| `CST` | 기본값 `'America/Chicago'`, `zh` 및 `zh-CN`에서는 `'Asia/Shanghai'`, `zh-TW`에서는 `'Asia/Taipei'`, `es-CU`에서는 `'America/Havana'` |
| `IST` | 기본값 `'Asia/Kolkata'`, `en-IE`에서는 `'Europe/Dublin'`, `he`에서는 `'Asia/Jerusalem'` |
| `PST` | 기본값 `'America/Los_Angeles'`, `fil` 및 `en-PH`에서는 `'Asia/Manila'` |
| `BST` | 기본값 `'Europe/London'`, `bn`에서는 `'Asia/Dhaka'` |
| `AST` | 기본값 `'America/Halifax'`, `ar-SA`에서는 `'Asia/Riyadh'` |
| `ACT` | 기본값 `'Australia/Adelaide'`, `pt-BR`에서는 `'America/Rio_Branco'` |
| `AMT` | 기본값 `'America/Manaus'`, `hy`에서는 `'Asia/Yerevan'` |
| `San Juan` | 기본값 `'America/Argentina/San_Juan'`, `es-PR`에서는 `'America/Puerto_Rico'` |

## 주요 약어

약어와 지역명은 해당 지역에서 서머타임을 적용하는 대표 IANA 시간대로 매핑됩니다.

| 약어 | 표준 시간대 | 지역 |
|---|---|---|
| `PT`, `PST`, `PDT`, `Pacific` | `'America/Los_Angeles'` | 북미 태평양 시간(`PST`는 로케일 기준 적용) |
| `MT`, `MST`, `MDT`, `Mountain` | `'America/Denver'` | 북미 산악 시간 |
| `CT`, `CST`, `CDT`, `Central` | `'America/Chicago'` | 북미 중부 시간(`CST`는 로케일 기준 적용) |
| `ET`, `EST`, `EDT`, `Eastern` | `'America/New_York'` | 북미 동부 시간 |
| `HNE`, `HAE` | `'America/Toronto'` | 캐나다 프랑스어권 동부 시간 |
| `AKT`, `AKST`, `AKDT`, `Alaska` | `'America/Anchorage'` | 알래스카 시간 |
| `HT`, `HST`, `Hawaii` | `'Pacific/Honolulu'` | 하와이 시간 |
| `AT`, `AST` | `'America/Halifax'` | 대서양 시간(`AST`는 로케일 기준 적용) |
| `BRT`, `FNT` | `'America/Sao_Paulo'`, `'America/Noronha'` | 브라질리아 및 페르난두지노로냐 시간 |
| `ART`, `COT`, `CLT` | `'America/Argentina/Buenos_Aires'`, `'America/Bogota'`, `'America/Santiago'` | 아르헨티나, 콜롬비아, 칠레 시간 |
| `GMT`, `Z` | `'UTC'` | 협정 세계시 |
| `UK`, `WET`, `BST` | `'Europe/London'` | 영국 및 서유럽 시간(`BST`는 로케일 기준 적용) |
| `CET`, `CEST`, `ECT` | `'Europe/Paris'` | 중앙유럽 시간 |
| `EET` | `'Europe/Helsinki'` | 동유럽 시간 |
| `MSK`, `мск` | `'Europe/Moscow'` | 모스크바 표준시 |
| `WAT`, `EAT`, `SAST` | `'Africa/Lagos'`, `'Africa/Nairobi'`, `'Africa/Johannesburg'` | 서·동·남아프리카 시간 |
| `GST`, `IRST`, `PKT` | `'Asia/Dubai'`, `'Asia/Tehran'`, `'Asia/Karachi'` | 걸프, 이란, 파키스탄 시간 |
| `IST`, `INST` | `'Asia/Kolkata'` | 인도 표준시(`IST`는 로케일 기준 적용) |
| `ICT`, `WIB`, `PHT` | `'Asia/Bangkok'`, `'Asia/Jakarta'`, `'Asia/Manila'` | 인도차이나, 인도네시아 서부, 필리핀 시간 |
| `JST`, `KST` | `'Asia/Tokyo'`, `'Asia/Seoul'` | 일본 및 한국 표준시 |
| `SGT`, `HKT` | `'Asia/Singapore'`, `'Asia/Hong_Kong'` | 싱가포르 및 홍콩 시간 |
| `AET`, `AEST`, `AEDT` | `'Australia/Sydney'` | 호주 동부 시간 |
| `ACT`, `AWT` | `'Australia/Adelaide'`, `'Australia/Perth'` | 호주 중부 및 서부 시간(`ACT`는 로케일 기준 적용) |
| `NZT`, `NZST`, `NZDT` | `'Pacific/Auckland'` | 뉴질랜드 시간 |

:::note[약어는 서머타임을 반영합니다]
원본 IANA 데이터에서 단독 `EST`는 3월 서머타임 전환을 반영하지 않는 고정 `-05:00` 오프셋입니다. 이 플러그인은 태평양·동부 시간 약어를 `'America/Los_Angeles'`와 `'America/New_York'`으로 매핑해 서머타임 계산이 정확하게 유지되도록 합니다. 연중 변하지 않는 고정 오프셋이 필요하면 `'-08:00'` 같은 숫자 오프셋을 전달하세요.
:::

## 사용자 정의 별칭

애플리케이션 시작 시 [`configure()`](/api/configure/)로 지사, 팀, 고정 약어 재정의용 축약 이름을 한 번 등록해 둘 수 있습니다. 사용자 정의 별칭은 로케일 기반 해석보다 우선 적용됩니다.

:::entry
### `configure()` :kind[function]

```js signature
configure({ zoneAliases }): Settings
```

전역 설정 테이블에 사용자 정의 시간대 이름을 추가하거나 제거합니다. 별칭 키는 대소문자나 발음 구별 기호를 구분하지 않고 일치하며, 대상 값으로는 전체 IANA 식별자, 영어 도시명, 약어를 모두 사용할 수 있습니다. 특정 키에 `null`을 설정하면 해당 별칭만 삭제되고, `zoneAliases: null`을 전달하면 모든 별칭이 초기화됩니다.

**매개변수**

```params
- name: zoneAliases
  type: Record<string, Zone | null> | null
  description: "사용자 정의 이름과 유효한 시간대 또는 `null`의 매핑 객체. `null`을 전달하면 모든 사용자 정의 별칭이 제거됩니다."
```

**반환값**

```returns
type: Settings
description: "정규화된 별칭 대상이 반영된 현재 설정의 스냅샷."
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

플러그인은 시작 시점에 기본 약어를 직접 조회하거나 고정할 수 있도록 변경 가능한 `timezones` 조회 맵도 내보냅니다. `timezones.IST = 'Asia/Jerusalem'`처럼 항목을 지정하면 모든 로케일에서 로케일 기반 해석보다 우선 적용됩니다.

```js
import { timezones } from '@native-dates/plugins/zones';

timezones.JST; // 'Asia/Tokyo'
```
