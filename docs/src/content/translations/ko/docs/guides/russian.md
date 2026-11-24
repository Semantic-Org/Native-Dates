---
source: 621cb0fa9e99
title: 러시아어
lede: 러시아어 월명 격변화와 복수형 단위를 포맷하고 마침표 날짜와 지역 시간대를 파싱합니다.
---

[현지화](/guides/localization/) 안내에 따라 `'ru'`를 설정하면 러시아어 날짜 형식이 적용됩니다. 내장 `Intl` 데이터가 별도 로케일 파일 없이 문법적 월명 격변화와 3단계 기간 복수형을 자동으로 처리합니다.

## 월명 격변화와 ‘г.’ 연도 접미사

프리셋은 일자 숫자 옆에 오는 월명을 생격(genitive)으로 바꾸고, 독립된 연월 표기에서는 주격(nominative)을 유지하며 연도 뒤에 ‘г.’ 접미사를 붙입니다.

```js
import { date, yearMonth } from 'native-dates';

const release = date('2026-11-16').locale('ru');

release.format('long'); // '16 ноября 2026 г.'
release.format('medium'); // '16 нояб. 2026 г.'
yearMonth('2026-11').format('long', 'ru'); // 'ноябрь 2026 г.'
```

사용자 지정 토큰 패턴은 간결한 UI 레이블을 위해 ‘г.’ 접미사를 생략합니다. 일자 토큰 바로 뒤에 `MMMM`이나 `MMM`이 오면 주격 ‘май’가 생격 ‘мая’로 자동 전환됩니다.

```js
const may = date('2026-05-06').locale('ru');

may.format('MMMM YYYY'); // 'май 2026'
may.format('D MMMM YYYY'); // '6 мая 2026'
may.format('D MMM'); // '6 мая'
date('2026-03-08').format('D MMM', 'ru'); // '8 мар.'
```

일자와 월명 사이에 `-го` 같은 리터럴 어미가 들어가더라도 대괄호 유무와 관계없이 `MMMM`의 생격 변화가 유지됩니다.

```js
may.format('D-го MMMM'); // '6-го мая'
```

## 요일, 소문자 표기, 일자 숫자

러시아어는 월명과 요일명을 소문자로 표기하며, 한 주가 월요일에 시작해 `weekStart`는 `1`입니다.

러시아어에서는 한 글자 요일 이니셜이 여러 요일과 겹치므로 `'narrow'`와 `'short'` 스타일 모두 월요일부터 일요일까지 두 글자 ‘пн’~‘вс’를 반환합니다.

```js
import { date, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'ru');
// ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
date('2026-11-16').format('dddd, D MMMM', 'ru'); // 'понедельник, 16 ноября'
```

러시아어 날짜는 일자 뒤에 마침표를 붙이지 않으므로 `Do`는 일반 숫자를 출력합니다. 서수 어미나 첫 글자 대문자 요일이 필요하면 [`configure()`](/api/configure/)에서 직접 설정하세요.

```js
import { configure, date } from 'native-dates';

configure({
  weekdayNames: { ru: { short: { mon: 'Пн', fri: 'Пт' } } },
  ordinals: { ru: (day) => `${day}-е` },
});

date('2026-11-16').format('ddd, Do MMMM', 'ru'); // 'Пн, 16-е ноября'
```

## 기간 복수형과 상대 날짜

러시아어는 1·21, 2~4, 5~20에 따라 단위를 세 가지 어형으로 구분합니다. [`Duration`](/api/duration/)을 포맷하면 각 수량에 맞는 어형이 자동으로 선택됩니다.

```js
import { days, duration } from 'native-dates';

days(1).format('long', 'ru'); // '1 день'
days(2).format('long', 'ru'); // '2 дня'
days(5).format('long', 'ru'); // '5 дней'
days(21).format('long', 'ru'); // '21 день'
duration({ days: 2, hours: 5, minutes: 21 }).format('long', 'ru');
// '2 дня 5 часов 21 минута'
```

[`DateTime`](/api/date-time/)의 [`from()`](/api/date-time/#from)은 경과 시·분을 기준으로 계산하므로 자정 22시간 전도 숫자로 표시됩니다.

[`CalendarDate`](/api/calendar-date/)에서는 달력 일수를 비교해 이틀 전 ‘позавчера’부터 이틀 후 ‘послезавтра’까지 자연스러운 러시아어 상대 날짜 표현을 반환합니다.

```js
import { date, datetime } from 'native-dates';

const day = date('2026-11-16').locale('ru');
day.minus(2, 'days').from(day); // 'позавчера'
day.minus(1, 'day').from(day); // 'вчера'
day.plus(2, 'days').from(day); // 'послезавтра'

const moment = datetime('2026-11-16T12:00:00Z', 'Europe/Moscow').locale('ru');
moment.minus(1, 'minute').from(moment); // '1 минуту назад'
moment.plus(2, 'days').from(moment); // 'через 2 дня'
```

## 마침표 날짜와 러시아어 월명 파싱

코어는 연-월-일 순 `'2026.11.16'` 문자열을 플러그인 없이 파싱합니다. [`loose` 플러그인](/plugins/loose/)을 불러오면 러시아어 로케일에서 일-월-연 순 마침표 날짜, 격변화된 월명, ‘г.’ 연도 접미사까지 자동으로 파싱합니다.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('16.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
date('06.11.2026', { loose: true, locale: 'ru' })?.toString(); // '2026-11-06'
date('16 ноября 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11-16'
datetime('16.11.2026, 14:30', {
  zone: 'Europe/Moscow',
  locale: 'ru',
  loose: true,
})?.hour; // 14
```

마침표로 구분된 일-월 및 월-연 쌍은 코어에서 바로 파싱됩니다. 느슨한 모드에서는 부분 날짜도 주격과 생격 러시아어 월명을 모두 인식합니다.

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('06.11').toString(); // '11-06'
monthYear('11.2026').toString(); // '2026-11'
monthDay('16 ноября', { loose: true, locale: 'ru' })?.toString(); // '11-16'
yearMonth('ноябрь 2026 г.', { loose: true, locale: 'ru' })?.toString(); // '2026-11'
```

## 러시아와 인접 국가의 시간대

러시아는 서머타임 없이 11개 시간대에 걸쳐 있으며, 카자흐스탄은 2024년에 UTC+5로 단일화되었습니다. 전체 IANA 식별자를 사용하면 모든 시간대의 과거 오프셋 변경 이력까지 보존됩니다.

[`zones` 플러그인](/plugins/zones/)을 불러오면 IANA 영어 도시명, 러시아·카자흐스탄 주요 영어 도시명, 모스크바 약어와 내장 키릴 문자 별칭(`'москва'`, `'мск'`)이 별도 설정 없이 바로 해석됩니다.

| 입력 | 기본 지원 여부 | 해석 방식 |
|---|---|---|
| `'Europe/Moscow'`, `'Asia/Almaty'` | 코어에서 동작 | 전체 IANA 식별자가 별도 설정 없이 동작하며 과거 오프셋 규칙을 유지 |
| `'Moscow'`, `'Yekaterinburg'`, `'Minsk'` | 플러그인에서 동작 | `zones` 플러그인에서 IANA 식별자에 포함된 영어 도시명을 대소문자 구분 없이 해석 |
| `'MSK'`, `'мск'`, `'SPB'`, `'Kazan'`, `'Astana'` | 플러그인에서 동작 | 내장 지역 약어, 대체 표기, 키릴 문자 명칭을 바로 해석 |

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T12:00:00Z', 'MSK').format('HH:mm', 'ru'); // '15:00'
datetime('2026-11-16T12:00:00Z', 'мск').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'SPB').zone; // 'Europe/Moscow'
datetime('2026-11-16T12:00:00Z', 'Astana').offset; // '+05:00'
datetime('16 ноября 2026 14:30 мск', {
  loose: true,
  locale: 'ru',
  zone: 'UTC',
})?.toString(); // '2026-11-16T11:30:00.000Z'
```
