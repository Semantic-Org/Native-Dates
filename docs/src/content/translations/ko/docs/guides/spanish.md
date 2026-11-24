---
source: 7c459605683f
title: 스페인어
lede: 스페인과 미주 지역의 지역별 스페인어 날짜 형식과 시각 표기 관습을 다룹니다.
---

단순 `'es'`는 스페인의 월요일 주 시작과 24시간제를 따릅니다. 라틴아메리카나 미국 사용자를 대상으로 하는 앱에서는 [현지화](/guides/localization/) 안내에 따라 `'es-MX'` 같은 지역 태그를 설정하세요.

## 스페인, 라틴아메리카, 미국

스페인은 24시간제를 사용합니다. 반면 라틴아메리카와 미국 스페인어는 12시간제를 쓰며, 지역에 따라 오전·오후 띄어쓰기, 날짜 구분자, 페루식 9월 표기(‘setiembre’)가 달라집니다.

```js
import { datetime } from 'native-dates';

const cita = datetime('2026-09-16T17:30:00', 'UTC');

cita.format('medium', 'es-ES'); // '16 sept 2026, 17:30'
cita.format('medium', 'es-MX'); // '16 sep 2026, 5:30 p.m.'
cita.format('medium', 'es-AR'); // '16 sept 2026, 5:30 p. m.'
cita.format('medium', 'es-CO'); // '16/09/2026, 5:30 p. m.'
cita.format('long', 'es-PE'); // '16 de setiembre de 2026 a las 5:30 p. m.'
cita.date.format('short', 'es-PR'); // '09/16/26'
```

주 시작 요일도 스페인어권 지역에 따라 갈립니다. 범용 라틴아메리카 태그 `'es-419'`는 멕시코나 콜롬비아와 달리 월요일에 한 주를 시작합니다.

| 태그 | 시작 요일과 시각 | 지역 관습 |
|---|---|---|
| `'es'`, `'es-ES'` | `1`, `17:30` | 월요일 주 시작, 24시간제, 9월 약어 ‘sept’ 사용 |
| `'es-MX'`, `'es-US'` | `7`, `5:30 p.m.` | 일요일 주 시작, 공백 없는 12시간제 오전·오후 표기 |
| `'es-AR'`, `'es-CL'` | `1`, `5:30 p. m.` | 월요일 주 시작, 공백 있는 오전·오후 표기, 칠레는 하이픈 짧은 날짜 사용 |
| `'es-CO'`, `'es-PE'` | `7`, `5:30 p. m.` | 일요일 주 시작, 콜롬비아는 숫자형 `'medium'` 날짜, 페루는 ‘setiembre’ 사용 |
| `'es-PR'` | `7`, `5:30 p. m.` | 일요일 주 시작, 미국식 월-일-연 순 숫자 날짜 사용 |

주간 데이터베이스 리포트 키를 생성할 때 마드리드와 멕시코시티가 같은 주 구간에 묶이도록 영어 요일명 `'monday'`를 넘겨 [`startOf('week', 'monday')`](/api/calendar-date/#startof)로 고정하세요.

```js
import { date } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('es-ES').startOf('week').toString(); // '2026-11-16'
wed.locale('es-MX').startOf('week').toString(); // '2026-11-15'
wed.locale('es-MX').startOf('week', 'monday').toString(); // '2026-11-16'
```

## 전치사, 소문자 표기, 요일

긴 스페인어 날짜는 ‘de’, ‘del’, ‘a las’로 요소를 연결합니다. 토큰 패턴 안에서 이 연결어를 대괄호로 감싸야 리터럴 알파벳 때문에 [`unknownFormat`](/api/errors/#units-zones-and-formats) 오류를 던지는 일을 막을 수 있습니다.

```js
import { datetime } from 'native-dates';

const ev = datetime('2026-11-16T18:30:00', 'Europe/Madrid').locale('es-ES');

ev.format('D [de] MMMM [de] YYYY'); // '16 de noviembre de 2026'
ev.format('dddd, D [de] MMMM [a las] HH:mm');
// 'lunes, 16 de noviembre a las 18:30'
```

스페인어에서는 월명, 요일명, 오전·오후 표기를 모두 소문자로 씁니다. 포맷된 날짜가 제목 맨 앞에 올 때만 첫 글자를 대문자로 바꾸세요.

한 글자 요일 표기는 ‘martes’와 ‘miércoles’가 모두 ‘M’으로 겹칩니다. 두 글자 `'dd'`는 기본 상태에서 이 충돌을 피하며, [`configure()`](/api/configure/)를 사용하면 수요일 표기나 매월 1일 ‘1.º’ 서수를 원하는 대로 바꿀 수 있습니다.

```js
import { configure, date, weekdayNames } from 'native-dates';

const s = date('2026-05-01').format('full', 'es'); // 'viernes, 1 de mayo de 2026'
s[0].toUpperCase() + s.slice(1); // 'Viernes, 1 de mayo de 2026'
weekdayNames('narrow', 1, 'es-MX'); // ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

configure({
  weekdayNames: { es: { narrow: { tue: 'M', wed: 'X' } } },
  ordinals: { es: (day) => (day === 1 ? '1.º' : day) },
});
date('2026-05-06').format('dd', 'es-MX'); // 'X'
date('2026-05-01').format('Do [de] MMMM', 'es-AR'); // '1.º de mayo'
```

## 스페인어 날짜와 월명 파싱

[`loose` 플러그인](/plugins/loose/)을 불러오면 숫자 날짜 순서가 활성 로케일을 자동으로 따릅니다. 스페인과 칠레는 일-월-연 순으로, 푸에르토리코는 월-일-연 순으로 파싱됩니다.

```js
import '@native-dates/plugins/loose';
import { date, datetime, dayMonth, monthDay, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-06'
date('16-09-2026', { loose: true, locale: 'es-CL' })?.toString(); // '2026-09-16'
date('06/11/2026', { loose: true, locale: 'es-PR' })?.toString(); // '2026-06-11'
```

문장형 날짜, 전치사 연결어, 앞에 붙은 요일명, 페루식 ‘setiembre’, 공백이 있는 12시간제 시각도 느슨한 모드에서 파싱됩니다. 숫자 형식의 [`dayMonth()`](/api/month-day-fn/#daymonth)는 플러그인 없이 코어에서 바로 동작합니다.

```js
date('16 de noviembre de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-11-16'
date('mar, 16 jun 2026', { loose: true, locale: 'es' })?.toString(); // '2026-06-16'
datetime('el 16 de noviembre de 2026 a las 14:30', {
  loose: true,
  locale: 'es',
  zone: 'Europe/Madrid',
})?.hour; // 14
time('5:30 p. m.', { loose: true, locale: 'es-MX' })?.toString(); // '17:30:00'
dayMonth('16/11').toString(); // '11-16'
monthDay('16 set.', { loose: true, locale: 'es-PE' })?.toString(); // '09-16'
yearMonth('enero de 2026', { loose: true, locale: 'es' })?.toString(); // '2026-01'
```

## 시간대와 자정 서머타임 전환

멕시코 대부분 지역은 북부 접경 도시와 킨타나로오 주를 제외하면 연중 UTC-6을 유지합니다. `'CST'`는 활성 로케일을 따라 기본값에서는 시카고로, 쿠바에서는 아바나로 해석됩니다.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-07-15T12:00', 'Mexico City').format('HH:mm Z'); // '12:00 -06:00'
datetime('2026-07-15T12:00', 'CST').format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-07-15T12:00', { zone: 'CST', locale: 'es-CU' }).zone; // 'America/Havana'
datetime('2026-07-15T12:00', 'Tijuana').format('HH:mm Z'); // '12:00 -07:00'
```

[`zones` 플러그인](/plugins/zones/)은 `'Mexico City'`, `'Tijuana'`, `'San Juan'` 같은 스페인어권 주요 영어 도시명과 `'CDMX'`, `'COT'` 같은 라틴아메리카 약어를 별도 설정 없이 바로 해석합니다. `'San Juan'`은 `'es-PR'`에서는 푸에르토리코, 그 외 로케일에서는 아르헨티나로 해석됩니다.

```js
datetime('2026-07-15T12:00', 'CDMX').zone; // 'America/Mexico_City'
datetime('2026-07-15T12:00', 'COT').zone; // 'America/Bogota'
datetime('2026-07-15T12:00', 'San Juan').zone; // 'America/Argentina/San_Juan'
datetime('2026-07-15T12:00', { zone: 'San Juan', locale: 'es-PR' }).zone; // 'America/Puerto_Rico'
```

칠레와 쿠바는 자정에 서머타임이 시작되어 00:00에서 곧바로 01:00으로 건너뜁니다. [`at('00:00', zone)`](/api/calendar-date/#at)이나 `startOf('day')`를 호출하면 해당 날짜의 01:00으로 정확히 보정됩니다.

```js
import { date } from 'native-dates';

const spring = date('2026-09-06').at('00:00', 'America/Santiago');

spring.format('YYYY-MM-DD HH:mm Z'); // '2026-09-06 01:00 -03:00'
spring.hoursInDay; // 23
```

## 상대 날짜와 시각

스페인어는 이틀 전 ‘anteayer’부터 이틀 후 ‘pasado mañana’까지 연속된 닷새를 각각의 상대 날짜 표현으로 부릅니다. [`CalendarDate`](/api/calendar-date/)는 이 상대 날짜 표현을 반환하고, [`DateTime`](/api/date-time/)은 경과 시간을 기준으로 계산합니다.

```js
import { date, datetime, today } from 'native-dates';

const ref = date('2026-11-16');

ref.minus(2, 'days').from(ref, 'es'); // 'anteayer'
ref.plus(2, 'days').from(ref, 'es'); // 'pasado mañana'
datetime('2026-11-14T12:00Z').from('2026-11-16T12:00Z', 'es'); // 'hace 2 días'
date('2026-11-18').from(today('America/Bogota'), 'es-CO');
```

공용 서버에서는 ‘hoy’와 ‘mañana’가 바뀌는 자정 경계가 사용자 현지 시간대를 따르도록 [`fromNow()`](/api/calendar-date/#fromnow)를 호출하는 대신 `from()`에 [`today(zone)`](/api/date-fn/#today)을 전달하세요.
