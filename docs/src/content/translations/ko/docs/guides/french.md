---
source: a214ff99444f
title: 프랑스어
lede: 지역별 시각 표기와 주 시작 요일에 맞춰 프랑스어 날짜를 포맷하고 파싱합니다.
---

단순 `'fr'`은 프랑스 본토 관습을 따릅니다. 사용자가 현지 날짜 순서, 시각 구분자, 주 시작 요일을 기대한다면 [현지화](/guides/localization/) 안내에 따라 `'fr-CA'` 같은 지역 태그를 설정하세요.

## 지역별 차이

짧은 날짜 순서, 시각 구분자, 주 시작 요일은 프랑스어권 지역마다 달라집니다.

| 로케일 | 짧은 포맷 | 주 시작 요일 | 지역별 특징 |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — 월요일 | 슬래시 구분자, 24시간제, 7월 약어 `'juil.'` 사용 |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — 일요일 | 캐나다식 ISO 날짜 순서, 공백이 들어간 `'h'` 시각 표기, 7월 약어 `'juill.'` 사용 |
| `fr-CH` | `'01.11.26 14:30'` | `1` — 월요일 | 마침표 구분자, `'short'`는 두 자리 연도, `'L'`은 네 자리 연도 출력 |
| `fr-BE` | `'1/11/26 14:30'` | `1` — 월요일 | `'short'`는 0을 채우지 않은 일자와 두 자리 연도, `'L'`은 네 자리 연도 출력 |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — 토요일 | 토요일 주 시작과 기본 12시간제 사용 |

프리셋이 현지 문장부호를 출력하도록 전체 지역 태그를 전달하세요.

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

캐나다 프랑스어는 한 주가 일요일에 시작하며 [`startOf('week')`](/api/calendar-date/#startof)와 [`weekdayNames()`](/api/month-names/#weekdaynames)가 이 규칙을 자동으로 따릅니다. 데이터베이스 리포트에 ISO 주차가 필요하면 영어 요일명 `'monday'`로 월요일을 고정하세요.

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## 프랑스어 표기법과 포맷 토큰

`'HH[h]mm'`처럼 토큰 패턴 안에 리터럴 알파벳을 넣을 때는 대괄호로 감싸세요. 대괄호 없이 `'HHhmm'`이라고 쓰면 [`unknownFormat`](/api/errors/#units-zones-and-formats) 오류를 던지지만, 단독 악센트 문자 ‘à’는 이스케이프 없이 그대로 출력됩니다.

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

프랑스어에서는 매월 1일을 ‘1er’로 쓰고 나머지 날짜는 일반 숫자로 적습니다. `'fr'`에 [`ordinals`](/api/configure/) 규칙을 등록하면 하위 지역 태그가 이를 자동으로 상속합니다.

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

프랑스어 본문에서는 요일과 월명을 소문자로 씁니다. 날짜가 제목 맨 앞에 올 때만 첫 글자를 대문자로 바꾸세요.

`MMM` 뒤에 마침표를 따로 붙이지 마세요. 축약된 월명에는 이미 마침표가 포함되어 있으며, ‘mars’, ‘mai’, ‘juin’, ‘août’처럼 짧은 이름은 마침표를 붙이지 않습니다.

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## 프랑스어 날짜·시각 입력 파싱

코어는 캐나다식 ISO 문자열과 `'14h30'` 같은 프랑스어 시·분 표기를 바로 파싱합니다. [`loose` 플러그인](/plugins/loose/)을 불러오면 프랑스어 로케일에서 일-월-연 순 슬래시 날짜, 마침표 날짜, 서수 표기, 문장형 날짜까지 자동으로 파싱합니다.

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

축약된 월명은 정확히 하나의 월과 일치해야 합니다. ‘juil’은 7월로 파싱되지만, ‘jui’는 ‘juin’과 ‘juillet’ 모두의 앞부분과 겹치므로 `null`을 반환합니다.

느슨한 모드에서는 부분 날짜도 프랑스어 월명과 악센트가 붙은 약어를 인식합니다. [`dayMonth()`](/api/month-day-fn/#daymonth)와 영어 기간 표현을 받는 [`duration()`](/api/duration-fn/)은 플러그인 없이 코어에서 바로 동작합니다.

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## 시간대

북미는 유럽보다 봄에는 2~3주 먼저, 가을에는 1주 늦게 서머타임을 전환하므로 그 기간에는 파리와 몬트리올의 시차가 6시간에서 5시간으로 줄어듭니다.

모로코도 라마단 기간에 UTC+0으로 돌아가므로 고정 시간을 빼는 대신 [`in()`](/api/date-time/#in)으로 시점을 변환하세요.

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

[`zones` 플러그인](/plugins/zones/)을 불러오면 영어 도시명은 물론 `'Montréal'`, `'Bruxelles'`, `'Genève'` 같은 주요 프랑스어권 도시명과 캐나다 시간대 약어 `'HNE'`가 별도 별칭 설정 없이 바로 해석됩니다.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## 상대 날짜와 줄바꿈 방지 공백

달력 날짜는 이틀 전을 ‘avant-hier’, 이틀 후를 ‘après-demain’으로 반환하는 반면, [`DateTime`](/api/date-time/)은 정확한 경과 단위를 세므로 자정 전후의 시간 차이가 어제로 잘못 표시되지 않습니다.

테스트 단언문을 작성할 때는 `'aujourd’hui'`의 곡선 아포스트로피와 짧은 기간 출력에 들어가는 좁은·일반 줄바꿈 방지 공백에 주의하세요.

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
