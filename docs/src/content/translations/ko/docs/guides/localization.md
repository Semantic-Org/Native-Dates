---
source: 7b49470321d3
title: 현지화
lede: 브라우저 기본 로케일, 앱 전역 설정, 값별 로케일, 단일 호출 재정의 중 실행 환경에 맞는 범위를 선택합니다.
---

Native Dates는 JavaScript 엔진에 내장된 `Intl` 데이터를 사용해 포맷합니다. 로케일 파일을 따로 내려받지 않아도 모든 언어, 문자 체계, 복수형 규칙, 역법이 바로 동작합니다.

로케일을 어디에 지정할지는 실행 환경에 따라 다릅니다. 앱의 동작 방식에 맞는 범위를 선택하세요.

- **런타임 기본값**: 브라우저 앱이 사용자의 시스템 설정을 그대로 따를 때
- **앱 전역 [`configure()`](/api/configure/)**: 클라이언트 앱에 자체 언어 선택기나 고정 로케일이 있을 때
- **값 단위 [`locale()`](/api/date-time/#locale)**: 서버에서 요청별로 포맷하거나 체인이 고유한 로케일을 유지해야 할 때
- **단일 호출 [`format()`](/api/date-time/#format)**: 특정 레이블 하나에만 다른 역법이나 지역 변형을 적용할 때

## 브라우저에서의 무설정 동작

로케일을 설정하거나 전달하지 않으면 모든 `.text` 프로퍼티, `format()` 호출, 범위, 기간, 이름 헬퍼가 런타임의 활성 로케일을 사용합니다.

사용자의 시스템 언어를 그대로 따르는 단일 사용자 브라우저 앱이라면 별도 설정이 필요 없습니다.

```js
import { dateRange, hours, today } from 'native-dates';

today().text;
dateRange('2026-09-01', '2026-09-07').format('medium');
hours(2).format('long');
```

## 클라이언트 앱의 전역 기본값

앱에 자체 언어 선택기가 있거나 고정 로케일을 대상으로 한다면 시작 시 [`configure()`](/api/configure/)를 한 번 호출하고, 사용자가 언어를 바꿀 때마다 다시 갱신하세요.

그러면 모든 값, 범위, 기간, 부분 날짜, 이름 헬퍼가 해당 로케일로 포맷됩니다.

```js title="main.js"
import { configure, date, days, monthNames, yearMonth } from 'native-dates';

configure({ locale: 'es-ES' });

date('2026-05-15').format('long'); // '15 de mayo de 2026'
yearMonth('2026-05').format('long'); // 'mayo de 2026'
days(2).text; // '2 días'
monthNames('short').slice(0, 3); // ['ene', 'feb', 'mar']

configure({ locale: null });
```

`locale: null`을 전달하면 런타임의 기본 로케일로 되돌아갑니다.

## 값에 로케일 유지하기

임의의 값에서 [`locale()`](/api/date-time/#locale)을 호출하면 해당 로케일이 적용된 복사본을 반환하며, 팩토리 함수에 `{ locale }` 옵션을 넘겨도 됩니다. 더 짧은 이름을 원하면 별칭 [`lang()`](/api/date-time/#lang)을 사용할 수 있습니다.

그 값에서 파생되는 모든 결과는 같은 로케일을 유지합니다. 날짜 계산, 시간대 변환, 날짜·시각 추출, 범위 생성, 측정된 기간 모두 이를 상속합니다.

```js
import { date, datetime } from 'native-dates';

const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr-FR');

arrival.text; // '15 mai 2026, 16:30 UTC+2'
arrival.plus(3, 'days').date.format('long'); // '18 mai 2026'

const stay = date('2026-09-01', { locale: 'de-DE' }).to('2026-09-07');
stay.format('medium'); // '01.–07.09.2026'
```

다중 사용자 서버에서는 프로세스 전역 설정을 바꾸지 말고 값을 읽는 시점에 각 요청의 로케일을 연결하세요.

```js title="orders.js"
import { datetime } from 'native-dates';

function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

formatOrder({ placedAt: '2026-05-15T14:30:00Z' }, { zone: 'Asia/Tokyo', locale: 'ja-JP' });
```

:::warning[서버에서 요청마다 configure를 호출하지 마세요]
전역 설정은 JavaScript 프로세스 전체의 공유 상태를 변경합니다. 다중 사용자 서버에서는 비동기 경계를 넘나드는 동안 다른 요청이 `configure()` 설정을 덮어쓸 수 있으므로, 값 자체에 `locale()`을 연결하세요.
:::

인수 없이 `locale()`을 호출하면 현재 설정된 태그를 반환하고, 지정된 로케일이 없으면 `undefined`를 반환합니다. 빈 값을 전달하면 로케일이 해제되므로 데이터베이스 컬럼이 비어 있어도 `locale(user.locale)`을 안전하게 체이닝할 수 있습니다.

가공하지 않은 로케일 문자열과 HTTP `Accept-Language` 헤더도 전처리 없이 바로 받습니다. `'en_US'`처럼 밑줄을 쓴 태그는 자동으로 정규화되며, 헤더 태그는 품질 가중치(`q`) 순으로 정렬되고 가중치가 0인 항목은 제외됩니다. 유효하지 않은 로케일 문자열은 [`unknownLocale`](/api/errors/#units-zones-and-formats) 오류를 던집니다.

```js
datetime('2026-05-15T14:30:00Z').locale('en_US').locale(); // 'en-US'
datetime('2026-05-15T14:30:00Z').locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale(); // ['de', 'fr-CH']
```

인스턴스 로케일은 현지화 텍스트, 주 경계, 주말 판정에만 영향을 줍니다. 정확한 비교, 정렬, [`equals()`](/api/date-time/#equals), [`toString()`](/api/date-time/#tostring)의 ISO 직렬화는 로케일을 무시합니다.

```js
import { date } from 'native-dates';

const french = date('2026-05-15').locale('fr');
const japanese = date('2026-05-15').locale('ja');

french.equals(japanese); // true
french.toString(); // '2026-05-15'
french.to(japanese).locale(); // 'fr'
```

서로 다른 로케일을 지닌 두 값을 결합하는 메서드는 메서드를 호출한 대상 값의 로케일을 유지합니다.

## 일회성 역법 및 지역 변형 재정의

특정 레이블 하나에만 다른 역법, 숫자 체계, 또는 지역 변형이 필요하면 `format()`에 BCP 47 태그를 전달하세요. 값 자체의 기존 로케일은 바뀌지 않습니다.

```js
import { date } from 'native-dates';

const reiwa = date('2019-05-01').locale('ja-JP');
reiwa.format('long'); // '2019年5月1日'
reiwa.format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'

const eid = date('2026-03-20').locale('ar-SA');
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

## 로케일 해석 우선순위

값, 범위, 기간, 상대 표현을 포맷할 때 Native Dates는 아래 순서대로 확인해 가장 먼저 찾은 로케일을 사용합니다.

| 우선순위 | 출처 | 사용 상황 |
|---|---|---|
| 1 | `value.format(spec, locale)` | 단일 호출에만 다른 역법, 문자 체계, 지역 변형이 필요할 때. |
| 2 | `value.locale(tag)` 또는 `{ locale }` | 서버 요청, 재사용 가능한 체인, 특정 로케일로 표시하는 UI 영역. |
| 3 | `configure({ locale })` | 클라이언트 앱에 전역 언어 설정이나 전환 기능이 있을 때. |
| 4 | 런타임 `Intl` 기본값 | 브라우저 앱이 사용자의 시스템 언어를 따를 때. |

## 주 경계와 주말

주 시작 요일과 요일 헤더는 활성 로케일을 자동으로 따릅니다. 런타임 기준으로 미국, 일본, 한국, 브라질은 일요일, 이집트는 토요일, 유럽 대부분과 중국은 월요일을 주의 첫날로 봅니다.

[`startOf('week')`](/api/calendar-date/#startof), [`range('week')`](/api/calendar-date/#range), [`weekdayNames()`](/api/month-names/#weekdaynames)가 모두 같은 시작 요일 규칙을 공유하므로 달력 헤더와 주 단위 그리드가 항상 정확히 맞물립니다.

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('en-US').startOf('week').toString(); // '2026-11-15'
wed.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'

weekdayNames('short', undefined, 'en-US')[0]; // 'Sun'
weekdayNames('short', undefined, 'de-DE')[0]; // 'Mo'
```

한 번만 덮어쓰려면 영어 요일명을 명시적으로 전달하고, 모든 로케일에 걸쳐 주 시작 요일을 고정하려면 [`configure()`](/api/configure/)의 `weekStart`에 영어 요일명을 설정하세요. 빈 값을 전달하면 다시 로케일을 따르며, 주 데이터가 없는 런타임은 월요일을 기본값으로 사용합니다.

:::details[고정 주 기준 리포트 보호하기]
인스턴스는 파생된 원본 값의 로케일을 그대로 물려받습니다. 리포트나 청구 기간처럼 주 단위를 키로 삼는 저장 데이터라면 `weekStart`를 고정하거나 `day.weekStart`(월요일 1부터 일요일 7까지)를 확인하세요.

```js title="reports.js"
function weekKey(day) {
  if (day.weekStart !== 1) {
    throw new Error('weekly reports are keyed by Monday weeks');
  }
  return day.startOf('week').toString();
}
```

`weekOfYear`가 반환하는 ISO 연도별 주차는 항상 월요일부터 주를 계산하며, `dayOfWeek` 역시 동일한 월요일 시작 번호를 따릅니다.
:::

주말 판정 역시 활성 로케일을 따릅니다. [`isWeekend()`](/api/calendar-date/#calendar-predicates)와 [`isWeekday()`](/api/calendar-date/#calendar-predicates)는 사우디아라비아와 이집트에서 금요일과 토요일을, 이란에서는 금요일 하루를 주말로 판단합니다. 인도는 일요일 하루를, 그 밖의 대부분 로케일은 토요일과 일요일을 주말로 처리합니다.

```js
const friday = date('2026-11-20');

friday.locale('en-US').isWeekend(); // false
friday.locale('ar-SA').isWeekend(); // true
```

## 사용자 정의 요일명과 서수

월명과 요일명은 런타임에서 가져오므로 사용자 기기에 표시되는 이름과 일치합니다. 다만 두 글자 요일(`dd`)과 일 서수(`Do`) 두 가지 포맷 토큰에는 표준 플랫폼 필드가 없습니다.

기본적으로 `dd`는 약어를 두 글자로 줄이는 문자 체계에서는 짧은 요일을 두 글자로 자르고, 그렇지 않으면 런타임의 최소 폭(`narrow`) 요일을 사용합니다. `Do`는 영어에서는 영어 서수 접미사를, 그 밖의 로케일에서는 독일어 `'6.'` 같은 해당 로케일의 일 표기를 출력합니다.

두 항목 모두 [`configure()`](/api/configure/)의 `weekdayNames`와 `ordinals`로 전역 재정의할 수 있습니다. `'fr-CA'` 같은 지역 태그는 기본 언어 항목을 상속한 뒤 재정의 값을 덮어쓰며, 프리셋과 `Intl` 옵션 출력에는 영향을 주지 않습니다. 사용 예시는 [커스터마이징](/guides/customization/#custom-weekday-names-and-ordinals)을 참고하세요.

지역, 문자 체계, 역법별 세부 사례는 [언어별 예제](/examples/#localization)와 사이드바의 **언어별 다루기** 아래에 있는 각 언어 가이드를 살펴보세요. 다음으로 [날짜와 시각 타입](/guides/types-of-time/)을 읽고 앱의 각 값에 알맞은 타입을 골라 보세요.
