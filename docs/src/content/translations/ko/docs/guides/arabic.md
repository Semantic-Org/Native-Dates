---
source: f8fde894143d
title: 아랍어
lede: 아랍어권 지역별 역법과 동아라비아·서아라비아 숫자 체계에 맞춰 아랍어 날짜를 포맷합니다.
---

[현지화](/guides/localization/) 안내에 따라 단순 `'ar'` 대신 `'ar-EG'`나 `'ar-SA'` 같은 국가 태그를 설정하세요. 숫자 체계, 그레고리력 월명, 주 시작 요일이 아랍어권 국가마다 다릅니다.

## 동아라비아 숫자와 서아라비아 숫자

아랍에미리트, 마그레브 지역, 단순 `'ar'`은 서아라비아 숫자(0–9)를 출력하는 반면, 이집트, 사우디아라비아, 레반트 지역, 이라크는 동아라비아 숫자를 출력합니다.

모든 사용자에게 동일한 숫자 체계를 적용하려면 로케일 뒤에 `-u-nu-latn` 또는 `-u-nu-arab`을 붙이세요.

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

토큰 패턴은 월명과 요일명을 현지화하더라도 숫자는 항상 ASCII로 출력합니다. 숫자형 프리셋은 슬래시 앞에 오른쪽에서 왼쪽으로 쓰기 제어 문자(`\u200F`)를 삽입하므로, 테스트 단언문, CSV, URL에는 `'YYYY-MM-DD'` 패턴을 쓰는 것이 안전합니다.

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## 히즈라력 날짜와 지역별 월명

최신 엔진에서 `'ar-SA'`의 기본 역법은 그레고리력입니다. 히즈라력 1447년 샤왈 1일처럼 공식 움 알쿠라(Umm al-Qura) 히즈라력 날짜를 출력하려면 로케일 태그에 `'-u-ca-islamic-umalqura'`를 붙여 프리셋과 함께 전달하세요.

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

태양력 한 달은 히즈라력 두 달에 걸치므로 토큰 패턴과 부분 날짜는 그레고리력을 유지합니다. 먼저 [`on()`](/api/year-month/#on)으로 특정 일을 고정한 뒤 포맷하세요.

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

그레고리력 월명과 12시간제·24시간제 표기는 네 개 지역권으로 나뉩니다.

| 지역 | 대표 태그 | 출력 특징 |
|---|---|---|
| 이집트, 걸프 지역, 수단 | `ar-EG, ar-SA` | ‘يناير’, ‘يوليو’, ‘نوفمبر’ 등 이집트·걸프식 월명과 12시간제 오전·오후(‘ص’ / ‘م’) 사용 |
| 레반트와 이라크 | `ar-LB, ar-IQ` | ‘كانون الثاني’, ‘تموز’, ‘تشرين الثاني’ 등 레반트식 월명과 12시간제 사용 |
| 모로코 | `ar-MA` | ‘ماي’, ‘يوليوز’, ‘غشت’, ‘شتنبر’, ‘نونبر’, ‘دجنبر’ 등 모로코식 월명과 24시간제 사용 |
| 알제리와 튀니지 | `ar-DZ, ar-TN` | ‘جانفي’, ‘فيفري’, ‘جوان’, ‘جويلية’, ‘أوت’ 등 마그레브식 월명과 12시간제 사용 |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## 주 시작 요일과 주말

한 주의 시작 요일은 이집트·요르단·카타르·알제리에서 토요일, 사우디아라비아·예멘에서 일요일, 아랍에미리트·모로코·튀니지·레바논에서 월요일입니다.

`weekStart`, 주 경계 계산, 요일 헤더는 각 로케일 태그를 자동으로 따르며, 여러 국가를 묶어 집계할 때는 영어 요일명 `'monday'`를 명시적으로 전달할 수 있습니다.

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

[`isWeekend()`](/api/calendar-date/#calendar-predicates)와 [`isWeekday()`](/api/calendar-date/#calendar-predicates)도 활성 로케일을 따릅니다. 사우디아라비아와 이집트처럼 금요일과 토요일이 주말인 지역에서는 금요일이 주말, 일요일이 평일로 판정됩니다.

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## 6가지 복수형과 오른쪽에서 왼쪽으로 쓰는 텍스트

아랍어는 0, 1, 2(쌍수 ‘يومان’), 3–10, 11–99, 100 이상까지 6가지 복수형을 구분합니다. [`Duration`](/api/duration/)과 [`from()`](/api/date-time/#from)은 수량에 맞는 어형을 자동으로 선택하며, 달력 날짜에서는 모레에 해당하는 ‘بعد الغد’도 출력합니다.

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

오른쪽에서 왼쪽으로 흐르는 문단 안에 ISO 날짜나 UTC 오프셋을 섞어 쓰면 브라우저가 부호 순서를 뒤집을 수 있으므로, 기술용 타임스탬프는 `<bdi>`로 감싸세요.

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## 입력 파싱과 시간대

[`loose` 플러그인](/plugins/loose/)을 불러오면 아랍어 로케일에서 일-월-연 순 슬래시 날짜, 방향 제어 문자가 섞인 동아라비아 숫자, ‘ص’ / ‘م’ 시각, 표준 월명과 두 단어짜리 레반트식 월명을 자동으로 파싱합니다.

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

[`zones` 플러그인](/plugins/zones/)은 걸프·북아프리카 주요 영어 도시명과 `'GST'` 같은 지역 약어를 바로 해석합니다. `'ar-SA'` 로케일에서는 `'AST'`가 리야드로 해석됩니다.

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

일정 계산에는 고정 UTC 오프셋 대신 전체 IANA 시간대를 사용하세요. `'Africa/Casablanca'`는 라마단 기간에 오프셋이 1시간 줄어들어 UTC+0으로 바뀌며, 카이로는 자정에 서머타임이 시작되어 바로 01:00으로 넘어갑니다.

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
