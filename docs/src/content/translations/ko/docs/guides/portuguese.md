---
source: 66dc60a9a9b2
title: 포르투갈어
lede: 브라질과 유럽·아프리카 포르투갈어권 로케일에 맞춰 포르투갈어 날짜를 포맷하고 파싱합니다.
---

[현지화](/guides/localization/) 안내에 따라 `'pt-BR'` 또는 `'pt-PT'`를 설정하면 포르투갈어 날짜 형식이 적용됩니다. 브라질과 포르투갈 모두 일-월-연 순 숫자 날짜와 소문자 월명을 쓰지만, `'medium'` 프리셋과 매월 1일 서수 표기에서는 차이가 납니다.

## 일/월/연 순 날짜 파싱

연-월-일 순 ISO 문자열은 월과 일이 바뀌지 않습니다. [`loose` 플러그인](/plugins/loose/)을 불러오면 포르투갈어 로케일에서 슬래시 날짜, 마침표 날짜, 문장형 날짜를 자동으로 일-월-연 순으로 파싱합니다.

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true, locale: 'pt-PT' })?.toString(); // '2026-11-16'
date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-16'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  locale: 'pt-BR',
  zone: 'America/Sao_Paulo',
})?.hour; // 14
date('29/02/2026', { loose: true, locale: 'pt-BR' }); // null
```

부분 날짜의 경우 숫자 일-월 및 월-연 쌍은 플러그인 없이 코어에서 바로 파싱되며, 느슨한 모드에서는 포르투갈어 월명도 인식합니다.

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## 프리셋, 전치사, 서수 표기

내장 프리셋은 소문자 월명과 자연스러운 전치사를 출력합니다. `'medium'` 프리셋은 브라질에서는 축약 월명을 출력하는 반면 포르투갈에서는 슬래시로 구분된 숫자 날짜를 출력합니다.

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

사용자 지정 토큰 패턴에서는 `'[de]'`와 `'[às]'` 같은 리터럴 단어를 대괄호로 감싸세요. 대괄호를 빼먹으면 알파벳이 잘못 치환되는 대신 예외를 던집니다.

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

브라질 포르투갈어의 짧은 월명과 요일은 소문자에 끝 마침표가 붙습니다. ‘segunda’와 ‘sexta’의 첫 두 글자가 같으므로 `dd`는 한 글자 이니셜을 사용합니다.

브라질에서는 ‘1º de maio’처럼 매월 1일을 ‘1º’로 표기하지만 포르투갈에서는 일반 숫자를 씁니다. 포르투갈 기본값을 건드리지 않으려면 [`ordinals`](/api/configure/)와 요일 재정의 범위를 `'pt-BR'`로 한정하세요.

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: { 'pt-BR': { short: { fri: 'Sex', sat: 'Sáb' } } },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## 주 시작 요일

포르투갈어 요일명은 ‘segunda-feira’(월요일)부터 ‘sexta-feira’(금요일)까지 일요일을 기준으로 서수를 세지만, `dayOfWeek`는 월요일 1부터 일요일 7까지 ISO 번호를 따릅니다.

주 경계는 각 지역의 `weekStart`를 따라 브라질과 포르투갈에서는 일요일, 앙골라·모잠비크·카보베르데에서는 월요일에 시작합니다.

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

업무 리포트가 월요일부터 일요일까지 묶는다면 영어 요일명 `'monday'`를 전달하세요. ISO `weekOfYear` 주차는 항상 월요일 기준으로 계산됩니다.

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## 시간대와 상대 날짜

브라질은 4개 시간대에 걸쳐 있으며 2019년에 서머타임을 폐지했습니다. `'America/Sao_Paulo'`는 연중 UTC-3을 유지하면서도 과거 서머타임 오프셋 기록을 보존합니다.

| 브라질 시간대 | 대표 IANA 시간대 | 지역 시간대와 별칭 |
|---|---|---|
| 페르난두지노로냐 | `America/Noronha` | UTC-2. `'Noronha'`와 `'FNT'` 바로 해석 |
| 브라질리아 표준시 | `America/Sao_Paulo` | UTC-3(바이아, 헤시피, 포르탈레자, 벨렝과 동일). `'BRT'`, Brasília, Rio de Janeiro, Belo Horizonte, Salvador 해석 |
| 아마조나스·마투그로수 | `America/Manaus` | UTC-4(쿠이아바, 캄푸그란지, 포르투벨류와 동일). `'AMT'` 해석 |
| 아크리 | `America/Rio_Branco` | UTC-5(에이루네피와 동일). `'pt-BR'` 로케일에서 `'ACT'` 자동 해석 |

[`zones` 플러그인](/plugins/zones/)을 불러오면 영어 도시명과 현지 철자(`'Brasília'`, `'São Paulo'`)를 포함한 주요 브라질 도시명과 지역 약어가 별도 설정 없이 해석되며, 느슨한 모드에서는 문자열 안의 BRT 약어도 함께 파싱됩니다.

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo')
  .locale('pt-BR')
  .in('ACT')
  .format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-11-16 14:30 BRT', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T17:30:00.000Z'
```

달력 날짜는 이틀 전 ‘anteontem’부터 이틀 후 ‘depois de amanhã’까지 자연스러운 상대 날짜 표현을 반환합니다. [`DateTime`](/api/date-time/)은 경과 시간을 세며, 미래 기간 표현이 브라질과 포르투갈에서 서로 다릅니다.

UTC 자정은 브라질리아 시각 21:00에 해당하므로 UTC 서버에서는 [`fromNow()`](/api/calendar-date/#fromnow)를 호출하는 대신 `from()`에 [`today('America/Sao_Paulo')`](/api/date-fn/#today)를 전달하세요.

```js
import { date, today } from 'native-dates';

const ref = date('2026-11-16');

date('2026-11-14').from(ref, 'pt-BR'); // 'anteontem'
date('2026-11-18').from(ref, 'pt-BR'); // 'depois de amanhã'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-BR'); // 'em 2 dias'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-PT');
// 'dentro de 2 dias'
ref.from(today('America/Sao_Paulo'), 'pt-BR');
```
