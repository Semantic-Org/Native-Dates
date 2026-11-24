---
source: 1f74e099bd7a
title: 중국어
lede: 중화권 지역별 날짜 형식과 음력 역법에 맞춰 중국어 날짜를 다룹니다.
---

[현지화](/guides/localization/) 안내에 따라 `'zh-CN'`이나 `'zh-TW'` 같은 지역 태그를 설정하세요. 지역마다 문자 체계, 날짜 순서, 시각 표기 방식, 주 시작 요일이 다릅니다.

## 중국 표준시와 CST

베이징 시간대에는 `'Asia/Shanghai'`를 전달하세요. 고정 UTC+8 오프셋과 달리 ‘中国标准时间’ 같은 현지화 시간대 이름을 출력하고, 중국의 1986~1991년 서머타임 오프셋 기록도 유지합니다.

```js
import { datetime } from 'native-dates';

const release = datetime('2026-11-16T09:30:00Z', 'Asia/Shanghai').locale('zh-CN');

release.format('YYYY-MM-DD HH:mm zzzz'); // '2026-11-16 17:30 中国标准时间'
datetime('1988-07-15T00:00:00Z', 'Asia/Shanghai').offset; // '+09:00'
```

[`zones` 플러그인](/plugins/zones/)을 불러오면 `'CST'`가 활성 로케일을 따라 중국 본토에서는 상하이, 대만에서는 타이베이로 해석됩니다. `'Beijing'`, `'Shenzhen'` 같은 주요 본토 영어 도시명과 내장 현지어 별칭 `'北京'`이 별도 설정 없이 해석되며, `'Urumqi'`는 UTC+6 신장 시간대로 유지됩니다.

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-CN' }).zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', { zone: 'CST', locale: 'zh-TW' }).zone; // 'Asia/Taipei'
datetime('2026-11-16T09:30:00Z', 'Beijing').zone; // 'Asia/Shanghai'
datetime('2026-11-16T09:30:00Z', 'Shenzhen').format('HH:mm', 'zh-CN'); // '17:30'
datetime('2026-11-16T09:30:00Z', 'Urumqi').offset; // '+06:00'
```

## 지역별 차이

중국 본토, 대만, 홍콩, 마카오, 싱가포르는 기본 시각 표기, 짧은 날짜 순서, 요일 한자, 주 시작 요일이 서로 다릅니다.

| 로케일 태그 | 짧은 날짜 | 주 시작 요일 | 기본 시각 및 요일 표기 |
|---|---|---|---|
| `zh-CN` | `2026/11/16` | 월요일 | 24시간제 기본, 간체자 `周一`~`周日` 요일 표기 |
| `zh-TW` | `2026/11/16` | 일요일 | `上午`·`下午`를 쓰는 12시간제, 번체자 `週一` 요일 표기 |
| `zh-HK` | `16/11/2026` | 일요일 | 12시간제와 일-월-연 순 짧은 날짜(마카오와 동일) |
| `zh-SG` | `16/11/26` | 일요일 | 12시간제, 간체자 `周` 요일, 두 자리 연도 일-월-연 순 날짜 |

같은 시점도 각 지역의 현지 프리셋에 맞춰 다르게 출력됩니다.

```js
import { datetime } from 'native-dates';

const meeting = datetime('2026-11-16T17:05:00+08:00', 'Asia/Shanghai');

meeting.format('medium', 'zh-CN'); // '2026年11月16日 17:05'
meeting.format('medium', 'zh-TW'); // '2026年11月16日 下午5:05'
meeting.date.format('short', 'zh-HK'); // '16/11/2026'
meeting.date.format('short', 'zh-SG'); // '16/11/26'
```

일요일은 중국 본토에서는 해당 주의 마지막 날이지만 대만, 홍콩, 싱가포르에서는 새 주의 첫날입니다. 지역 간 주간 리포트 키를 통일하려면 [`startOf()`](/api/calendar-date/#startof)에 영어 요일명 `'monday'`를 전달하세요.

```js
import { date } from 'native-dates';

const sunday = date('2026-11-15');

sunday.locale('zh-CN').range('week').toString(); // '2026-11-09/2026-11-15'
sunday.locale('zh-HK').range('week').toString(); // '2026-11-15/2026-11-21'
sunday.locale('zh-HK').startOf('week', 'monday').toString(); // '2026-11-09'
```

중국어 간체에서 `'Ah:mm'`은 ‘上午’ 또는 ‘下午’를 출력합니다. 새벽(‘凌晨’), 아침(‘早上’), 정오(‘中午’), 저녁(‘晚上’)처럼 자연스러운 세부 시각 구분이 필요하면 `dayPeriod: 'short'` 옵션을 전달하세요.

```js
import { time } from 'native-dates';

const night = time('20:30').locale('zh-CN');

night.format('short'); // '20:30'
night.format('Ah:mm'); // '下午8:30'
night.format({
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  dayPeriod: 'short',
}); // '晚上8:30'
```

## 포맷 템플릿과 입력 파싱

토큰 패턴은 라틴 알파벳만 토큰으로 인식하므로 ‘年’, ‘月’, ‘日’과 중국어 문장부호에는 대괄호가 필요 없습니다. `'MMMM'`은 ‘十一月’처럼 한자 월명을 출력하고 `'dd'`는 한 글자 요일을 출력합니다.

```js
import { datetime } from 'native-dates';

const slot = datetime('2026-11-06T14:05:00+08:00', 'Asia/Shanghai').locale('zh-CN');

slot.format('YYYY年M月D日 ddd HH:mm'); // '2026年11月6日 周五 14:05'
slot.format('MMMDo / MMMMDo'); // '11月6日 / 十一月6日'
slot.format('dd / ddd / dddd'); // '五 / 周五 / 星期五'
slot.format('ddd', 'zh-TW'); // '週五'
```

코어 팩토리 함수는 한자 연-월-일 순 날짜, 슬래시, 마침표 형식을 바로 파싱하므로 플러그인 없이도 `'long'` 프리셋 결과를 왕복 변환할 수 있습니다. 홍콩식 일-월-연 순 슬래시 날짜, 전각 숫자, 세부 시각 구분이 붙은 시각, 문자열 안의 CST 약어를 읽으려면 [`loose` 플러그인](/plugins/loose/)을 불러오세요.

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { date, datetime, monthDay, time, yearMonth } from 'native-dates';

date('2026年11月16日').toString(); // '2026-11-16'
yearMonth('2026年11月').toString(); // '2026-11'
date('16/11/2026', { loose: true, locale: 'zh-HK' })?.toString(); // '2026-11-16'
date('２０２６年１１月１６日', { loose: true })?.toString(); // '2026-11-16'
time('下午5:05', { loose: true, locale: 'zh-TW' })?.toString(); // '17:05:00'
time('晚上9:10', { loose: true, locale: 'zh-CN' })?.toString(); // '21:10:00'
time('凌晨12:00', { loose: true, locale: 'zh-TW' })?.toString(); // '00:00:00'
monthDay('11月16日', { loose: true })?.toString(); // '11-16'
datetime('2026年11月16日 14:30 CST', {
  loose: true,
  locale: 'zh-CN',
  zone: 'UTC',
})?.toString(); // '2026-11-16T06:30:00.000Z'
```

느슨한 모드는 `'zh-CN'`과 `'zh-TW'` 모두에서 ‘上午’ / ‘下午’는 물론 ‘凌晨’, ‘中午’, ‘晚上’ 같은 세부 시각 표현까지 함께 파싱합니다.

## 중국 음력과 민국력

날짜나 시점을 포맷할 때 `'zh-CN-u-ca-chinese'`를 전달하면 프리셋이 간지 연도, 음력 1월(‘正月’), 윤달(‘闰六月’)을 출력합니다.

토큰 패턴은 항상 그레고리력 필드를 읽습니다. 부분 날짜는 일(day) 정보가 없어 그레고리력으로 대체되지만, 대만의 민국력 태그 `'zh-TW-u-ca-roc'`는 그레고리력과 월 경계가 일치해 그대로 적용됩니다.

```js
import { date, yearMonth } from 'native-dates';

date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'); // '2026丙午年正月初一'
date('2025-07-25').format('medium', 'zh-CN-u-ca-chinese'); // '2025年闰六月初一'
date('2026-02-17').format('YYYY-MM-DD', 'zh-CN-u-ca-chinese'); // '2026-02-17'
yearMonth('2026-02').format('long', 'zh-CN-u-ca-chinese'); // '2026年2月'
yearMonth('2026-11').format('long', 'zh-TW-u-ca-roc'); // '民國115年11月'
```

## 상대 날짜와 시각

[`CalendarDate`](/api/calendar-date/)는 달력 일수를 세어 이틀 전은 ‘前天’, 이틀 후는 ‘后天’을 반환합니다. [`DateTime`](/api/date-time/)은 경과 초를 기준으로 계산하므로 23시간 전이 어제로 표시되지 않습니다.

```js
import { date, datetime, today } from 'native-dates';

const base = date('2026-11-16');
date('2026-11-14').from(base, 'zh-CN'); // '前天'
date('2026-11-18').from(base, 'zh-CN'); // '后天'

const anchor = datetime('2026-11-16T12:00:00+08:00', 'Asia/Shanghai');
anchor.minus(2, 'days').from(anchor, 'zh-CN'); // '2天前'
date('2026-11-18').from(today('Asia/Shanghai'), 'zh-CN');
```

UTC 서버에서는 베이징 시각 자정부터 오전 8시 사이에 인자 없는 [`fromNow()`](/api/calendar-date/#fromnow)를 호출하면 UTC 기준 전날로 계산되므로 [`today('Asia/Shanghai')`](/api/date-fn/#today)를 명시적으로 전달하세요.
