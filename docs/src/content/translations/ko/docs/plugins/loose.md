---
source: be45ccc1b61a
title: loose
lede: 폼, CSV, 레거시 피드 등 신뢰할 수 없는 텍스트를 로케일에 맞춰 파싱하고 읽을 수 없으면 null을 반환하는 선택형 플러그인입니다.
---

## 선택형 느슨한 파싱

모든 팩토리 함수는 기본적으로 엄격한 ISO 8601 문자열만 파싱하며, 형식이 잘못된 입력에서는 예외를 던집니다. 이 플러그인을 가져오면 신뢰할 수 없는 사용자 입력 텍스트, CSV 열, 레거시 헤더를 다루기 위한 느슨한 모드(`loose` 모드) 옵션인 `{ loose: true }`를 사용할 수 있습니다.

```js title="loose.js"
import '@native-dates/plugins/loose';
import { date, datetime, duration, time } from 'native-dates';

date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
datetime('Sat, 06 Sep 2026 14:30:00 GMT', { loose: true })?.toString();
// '2026-09-06T14:30:00.000Z'
time('September 6, 2026 5:30 PM', { loose: true })?.toString(); // '17:30:00'
duration('2h', { loose: true })?.toString(); // 'PT2H'
```

느슨한 모드를 지정하지 않은 호출은 그대로 엄격한 파싱을 유지합니다. 플러그인을 가져와도 코드베이스의 기존 호출 동작은 바뀌지 않습니다.

## 활성 로케일 기준 파싱

느슨한 모드는 활성 로케일에서 `Intl`이 출력하는 날짜와 시각 표현을 역으로 파싱합니다. 월명, 오전·오후 및 하루의 때를 나타내는 표현, 숫자 날짜의 일·월 순서는 런타임에서 가져오며, 다른 문자 체계의 숫자도 자동으로 변환됩니다.

활성 로케일은 포맷과 동일한 우선순위를 따릅니다. 호출 시 전달한 `locale` 옵션, [`configure()`](/api/configure/) 설정, 런타임 기본값 순으로 결정됩니다.

```js locale="en-US" label="English"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'en-US' });

date('06/11/2026', { loose: true })?.toString(); // '2026-06-11'
date('September 6, 2026', { loose: true })?.toString(); // '2026-09-06'
time('9:10 in the evening', { loose: true })?.toString(); // '21:10:00'
datetime('Sep 6, 2026, 5:30 PM', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 17
```

```js locale="fr" label="Français"
import '@native-dates/plugins/loose';
import { configure, date, datetime, monthDay } from 'native-dates';

configure({ locale: 'fr' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('1er mai 2026', { loose: true })?.toString(); // '2026-05-01'
monthDay('1er mai', { loose: true })?.toString(); // '05-01'
datetime('16 novembre 2026 à 14:30', {
  loose: true,
  zone: 'Europe/Paris',
})?.hour; // 14
```

```js locale="es" label="Español"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'es' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de noviembre de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 de la noche', { loose: true })?.toString(); // '21:10:00'
datetime('16 nov 2026, 14:30', {
  loose: true,
  zone: 'Europe/Madrid',
})?.hour; // 14
```

```js locale="pt-BR" label="Português"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'pt-BR' });

date('06/11/2026', { loose: true })?.toString(); // '2026-11-06'
date('16 de novembro de 2026', { loose: true })?.toString(); // '2026-11-16'
time('9:10 da noite', { loose: true })?.toString(); // '21:10:00'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  zone: 'America/Sao_Paulo',
})?.hour; // 14
```

```js locale="zh-CN" label="中文"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'zh-CN' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('晚上9:10', { loose: true })?.toString(); // '21:10:00'
datetime('2026年11月16日 下午2:30', {
  loose: true,
  zone: 'Asia/Shanghai',
})?.hour; // 14
```

```js locale="ja" label="日本語"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ja' });

date('2026/11/16', { loose: true })?.toString(); // '2026-11-16'
date('2026年11月16日', { loose: true })?.toString(); // '2026-11-16'
time('午後2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026年11月16日 14:30', {
  loose: true,
  zone: 'Asia/Tokyo',
})?.hour; // 14
```

```js locale="ko" label="한국어"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ko' });

date('26. 5. 5.', { loose: true })?.toString(); // '2026-05-05'
date('2026년 11월 16일', { loose: true })?.toString(); // '2026-11-16'
time('오후 2:30', { loose: true })?.toString(); // '14:30:00'
datetime('2026년 11월 16일 오후 2:30', {
  loose: true,
  zone: 'Asia/Seoul',
})?.hour; // 14
```

```js locale="ru" label="Русский"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ru' });

date('16.11.2026', { loose: true })?.toString(); // '2026-11-16'
date('16 ноября 2026 г.', { loose: true })?.toString(); // '2026-11-16'
time('9:10 вечера', { loose: true })?.toString(); // '21:10:00'
datetime('16 нояб. 2026 г., 14:30', {
  loose: true,
  zone: 'Europe/Moscow',
})?.hour; // 14
```

```js locale="ar-EG" label="العربية"
import '@native-dates/plugins/loose';
import { configure, date, datetime, time } from 'native-dates';

configure({ locale: 'ar-EG' });

date('١٦‏/١١‏/٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
date('١٦ نوفمبر ٢٠٢٦', { loose: true })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true })?.toString(); // '14:30:00'
datetime('١٦ نوفمبر ٢٠٢٦، ٢:٣٠ م', {
  loose: true,
  zone: 'Africa/Cairo',
})?.hour; // 14
```

한국어 같은 연-월-일 순 로케일은 맨 앞에 오는 두 자리 연도를 인식하므로 `'26. 5. 5.'`가 2026년 5월 5일로 파싱됩니다. 접속어, 서수 표기, 앞에 붙은 요일명은 전체 날짜와 부분 날짜 모두에서 자동으로 건너뜁니다.

## 잘못된 입력에 대한 null 반환

느슨한 모드를 켜면 읽을 수 없는 문자열, 빈 필드, 누락된 값, 2월 30일처럼 존재하지 않는 달력 날짜에서 예외를 던지지 않고 `null`을 반환합니다. 폼 핸들러나 데이터 가져오기 스크립트에서 모든 필드를 `try` 블록으로 감싸지 않고 반환값을 바로 확인할 수 있습니다.

```js
const submitted = date('TBD', { loose: true }); // null
const rolled = date('2026-02-30', { loose: true }); // null
const missing = datetime(undefined, { loose: true }); // null
```

[범위](/api/ranges/), [`YearMonth`](/api/year-month/), [`MonthDay`](/api/month-day/) 팩토리 함수도 같은 옵션을 지원합니다.

```js
import { dateRange, monthDay, yearMonth } from 'native-dates';

dateRange('Sep 1 2026', 'Sep 7 2026', { loose: true })?.toString(); // '2026-09-01/2026-09-07'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
dateRange('TBD', '2026-09-07', { loose: true }); // null
```

연도나 일이 빠진 불완전한 날짜를 `date()`나 `datetime()` 팩토리 함수에 전달하면 기본값을 임의로 채우지 않고 `null`을 반환합니다. 연·월이나 월·일만 있는 입력에는 부분 날짜 팩토리 함수를 사용하세요.

비영어 월명 옆에 붙은 두 자리 연도, 모호한 월 약어, AM/PM과 함께 쓰인 12시를 넘는 시각, [`datetime()`](/api/datetime-fn/)에 전달된 날짜 없는 시각 문자열은 거부됩니다. 알 수 없는 대문자 시간대 코드나 `'14h'`처럼 시만 단독으로 적힌 문자열도 `null`을 반환합니다.

:::note[잘못된 데이터는 null을 반환하지만, 잘못된 옵션은 여전히 예외를 던집니다]
느슨한 모드는 읽을 수 없는 입력 데이터만 처리합니다. `'Mars/Olympus'`처럼 존재하지 않는 시간대를 전달하는 것은 사용자 입력이 아니라 애플리케이션 코드의 오류이므로 여전히 즉시 예외를 던집니다.
:::

## 느슨한 파싱에서의 시간대 처리

UTC 표기나 숫자 오프셋이 포함된 문자열은 특정 시점을 가리키며, 이를 지정한 시간대나 기본 설정 시간대로 변환합니다. 오프셋이 없는 문자열은 텍스트에 적힌 날짜와 시각을 그대로 유지한 채 대상 시간대에 배치합니다.

```js
datetime('Sat, 06 Sep 2026 14:30:00 GMT', {
  loose: true,
  zone: 'America/New_York',
})?.hour; // 10

datetime('September 6, 2026 5:30 PM', {
  loose: true,
  zone: 'America/Los_Angeles',
})?.hour; // 17
```

시각 뒤에 붙는 시간대 약어는 `zone` 옵션과 동일한 규칙으로 해석됩니다. UTC, GMT, 표준 IANA 식별자 외에 중국어 로케일의 `CST` 같은 지역별 약어까지 읽으려면 [`@native-dates/plugins/zones`](/plugins/zones/)를 함께 가져오세요.

## 일-월-연 순 숫자 날짜

슬래시, 마침표, 하이픈으로 구분된 숫자 날짜는 활성 로케일의 순서를 자동으로 따릅니다. 입력이 활성 로케일과 다른 순서를 따른다면 호출마다 `dayFirst`를 전달하거나 [`configure()`](/api/configure/)로 기본값을 지정하세요.

```js
import { configure } from 'native-dates';

date('07.09.2026', { loose: true, locale: 'en-US' })?.toString(); // '2026-07-09'
date('07.09.2026', { loose: true, locale: 'de-DE' })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, locale: 'en-US', dayFirst: true })?.toString(); // '2026-09-07'

configure({ dayFirst: true });
date('7/9/26', { loose: true })?.toString(); // '2026-09-07'
date('07.09.2026', { loose: true, dayFirst: false })?.toString(); // '2026-07-09'
configure({ dayFirst: null });
```

`configure()`에 `dayFirst: null`을 전달하면 다시 활성 로케일을 따릅니다. [`monthDay()`](/api/month-day-fn/) 같은 부분 날짜 팩토리 함수는 로케일과 무관하게 함수 이름이 가리키는 순서대로 숫자 쌍을 읽습니다.

## 지역별 시각 표기와 월명 규칙

마침표로 구분한 시각(`'14.30'`)은 핀란드어나 덴마크어처럼 시각 표기에 마침표를 쓰는 로케일에서만 파싱되며, 다른 로케일에서는 `null`을 반환합니다. 날짜 뒤에 오는 마침표 초 표기는 파싱되지만, 마침표로 구분된 세 부분짜리 단독 문자열은 날짜로 처리됩니다.

영어의 ‘in the evening’이나 한국어의 ‘밤’처럼 하루의 때를 나타내는 표현은 12시간제 시각만 보정하고 24시간제 시각은 그대로 둡니다. 날짜와 시각을 잇는 연결어는 AM/PM으로 오인하지 않으므로, “~시에”를 뜻하는 웨일스어 ‘am’은 14:30을 그대로 유지하는 반면 영어의 `'AM 12:30'`은 자정 직후(00:30)로 파싱됩니다.

히브리어와 바스크어를 포함해 전체 날짜 안에서 격변화하거나 접사가 붙은 월명도 자동으로 파싱됩니다. 축약된 월명은 정확히 한 달만 가리켜야 하므로, 프랑스어 ‘juil’은 7월로 파싱되지만 ‘jui’는 `null`을 반환합니다.

```js label="마침표 시각 표기"
datetime('16.11.2026 klo 14.30.15', {
  loose: true,
  locale: 'fi',
  zone: 'UTC',
})?.toString(); // '2026-11-16T14:30:15.000Z'
time('14.30', { loose: true, locale: 'fi' })?.toString(); // '14:30:00'
time('14.30', { loose: true, locale: 'de' }); // null
time('14.30.15', { loose: true, locale: 'fi' }); // null
```

```js label="하루의 때 표현"
time('밤 11:30', { loose: true, locale: 'ko' })?.toString(); // '23:30:00'
time('밤 1:30', { loose: true, locale: 'ko' })?.toString(); // '01:30:00'
time('14:30 nachmittags', { loose: true, locale: 'de' })?.toString(); // '14:30:00'
```

```js label="연결어"
time('am 14:30', { loose: true, locale: 'cy' })?.toString(); // '14:30:00'
time('am 12:30', { loose: true, locale: 'cy' })?.toString(); // '12:30:00'
time('AM 12:30', { loose: true, locale: 'en-US' })?.toString(); // '00:30:00'
```

```js label="월명 변형"
date('2026(e)ko azaroaren 16(a)', {
  loose: true,
  locale: 'eu',
})?.toString(); // '2026-11-16'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
```

## 팩토리 함수 옵션

:::entry
### `datetime()` :kind[function]

```js signature
datetime(input, { loose: true, zone?, locale?, dayFirst?, disambiguation? }): DateTime | null
date(input, { loose: true, zone?, locale?, dayFirst? }): CalendarDate | null
time(input, { loose: true, zone?, locale?, dayFirst? }): Time | null
duration(input, { loose: true, locale? }): Duration | null
yearMonth(input, { loose: true, zone?, locale? }): YearMonth | null
monthDay(input, { loose: true, zone?, locale?, dayFirst? }): MonthDay | null
dateRange(start, end, { loose: true, zone?, locale?, dayFirst? }): DateRange | null
```

모든 팩토리 함수에 로케일 기반 폴백 파싱과 읽을 수 없는 입력 시 `null` 반환 기능을 추가합니다. `new DateTime()` 같은 클래스 생성자에 `{ loose: true }`를 전달하면 폴백 파싱은 활성화되지만, 입력을 읽을 수 없을 때는 여전히 예외를 던집니다.

**매개변수**

```params
- name: loose
  type: boolean
  default: "false"
  description: "활성 로케일 기준으로 비정형 텍스트를 파싱하고, 기계 형식은 런타임 `Date` 파싱으로 대체하며, 읽을 수 없으면 `null`을 반환하는 옵션."
- name: dayFirst
  type: boolean
  description: "`'07.09.2026'` 같은 문자열에서 활성 로케일의 숫자 날짜 순서를 재정의하는 옵션."
- name: zone
  type: Zone
  description: "로컬 날짜와 시각 문자열을 해석하거나 시점을 변환할 시간대."
- name: locale
  type: Locale
  description: "반환값에 유지되며 월명, 오전·오후 표현, 시각 표기 방식, 날짜 순서 해석에 사용되는 BCP 47 로케일 태그."
- name: disambiguation
  type: Disambiguation
  default: "'compatible'"
  description: "로컬 날짜와 시각 문자열의 모호한 시각(서머타임 누락·중복 시각) 처리 방식. 느슨한 모드에서 `'reject'`는 `null`을 반환합니다."
```

**반환값**

```returns
type: DateTime | CalendarDate | Time | Duration | YearMonth | MonthDay | Range | null
description: "파싱된 인스턴스, 또는 `input`을 읽을 수 없을 때 `null`."
```

```js
date('Sept 6, 2026', { loose: true })?.toString(); // '2026-09-06'
date('2026-09', { loose: true }); // null
yearMonth('2026-09', { loose: true })?.toString(); // '2026-09'
```
:::

:::entry
### `configure()` :kind[function]

```js signature
configure({ dayFirst }): Settings
```

호출 시 `dayFirst`와 `locale`을 모두 생략한 느슨한 모드 호출의 기본 숫자 날짜 순서를 재정의합니다. 기본값은 미설정 상태이므로 활성 로케일을 따릅니다.

**매개변수**

```params
- name: dayFirst
  type: boolean | null
  description: "느슨한 모드의 숫자 날짜를 일-월-연 순(`true`) 또는 월-일-연 순(`false`)으로 고정하는 옵션. `null`을 전달하면 다시 활성 로케일을 따릅니다."
```
:::
