---
source: 46b27cf4cf7e
title: 플러그인 작성
lede: 선택형 프로토타입 메서드와 TypeScript 모듈 보강으로 Native Dates를 확장하는 방법을 안내합니다.
---

플러그인은 모듈을 import하는 시점에 활성화됩니다.

[`@native-dates/plugins`](/plugins/)의 [`zones`](/plugins/zones/)나 [`legacy-date`](/plugins/legacy-date/)와 동일한 패턴으로 재사용 가능한 패키지를 배포하거나 앱 내부 전용 도메인 헬퍼를 추가할 수 있습니다.

## 프로토타입 메서드 추가

확장할 클래스를 import한 뒤 해당 클래스의 `prototype`에 메서드를 등록합니다.

모든 인스턴스는 생성 시 동결(freeze)됩니다. 플러그인 메서드는 `this`를 직접 수정하지 않고 새 값이나 계산 결과를 반환하는 순수 함수로 유지해야 합니다.

```js
import { CalendarDate, date } from 'native-dates';

CalendarDate.prototype.nextBusinessDay = function nextBusinessDay() {
  const step = this.dayOfWeek === 5 ? 3 : this.dayOfWeek === 6 ? 2 : 1;
  return this.plus(step, 'days');
};

date('2026-11-13').nextBusinessDay().toString(); // '2026-11-16'
```

인스턴스의 공개 프로퍼티를 읽거나 [`this.toTemporal()`](/api/calendar-date/#totemporal)을 호출하고, 반환값은 [`this.plus()`](/api/calendar-date/#plus) 같은 메서드로 생성하세요.

[`format()`](/api/calendar-date/#format) 같은 기존 메서드를 확장할 때는 먼저 원본 메서드를 변수에 보관한 뒤, 플러그인이 처리하지 않는 입력을 원본 메서드로 위임하세요.

```js
const baseFormat = CalendarDate.prototype.format;

CalendarDate.prototype.format = function format(spec, locale) {
  if (spec === 'compact') {
    return this.toString().replaceAll('-', '');
  }
  return baseFormat.call(this, spec, locale);
};

date('2026-11-16').format('compact'); // '20261116'
date('2026-11-16').format('short', 'en-US'); // '11/16/26'
```

## 번들 간 타입 판별

플러그인 헬퍼에서는 `value.constructor.name`으로 타입을 판별하지 마세요. 모노레포, 마이크로 프론트엔드, iframe 환경에서는 같은 패키지의 복사본 두 개가 메모리에 동시에 로드될 수 있습니다.

모든 클래스에는 전역 심볼 브랜드가 붙어 있습니다. 타입 가드, [`kindOf()`](/api/kind-of/), [`IS_DATE_TIME`](/api/kind-of/#cross-realm-instanceof-and-brands) 같은 브랜드 심볼을 사용하면 실행 영역(realm)이 다르거나 번들이 중복되어도 값을 정확히 판별합니다.

```js
import { date, IS_CALENDAR_DATE, IS_DATE_TIME, kindOf, now } from 'native-dates';

export function isDateOrMoment(value) {
  return Boolean(value?.[IS_CALENDAR_DATE] || value?.[IS_DATE_TIME]);
}

isDateOrMoment(date('2026-11-16')); // true
kindOf(now()); // 'datetime'
```

## package.json에 sideEffects 선언

호출자는 단순 import(bare import)로 플러그인을 활성화합니다. 번들러가 import를 제거하지 않고 호스트 앱의 클래스를 공유할 수 있도록 진입 파일을 `"sideEffects"`에 명시하고 `"native-dates"`를 `peerDependencies`에 추가하세요.

```json title="package.json"
{
  "name": "my-dates-plugin",
  "type": "module",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "default": "./index.js"
    }
  },
  "sideEffects": ["./index.js"],
  "peerDependencies": {
    "native-dates": "^1.0.0"
  }
}
```

:::warning[부수 효과 플러그인에 sideEffects false 지정 금지]
`"sideEffects": false`로 설정하면 Node 단위 테스트가 통과하더라도 프로덕션 빌드에서 번들러가 단순 플러그인 import를 제거해 버립니다.
:::

## TypeScript 타입 보강

타입 선언 파일에서 `module 'native-dates'`를 선언하면 기존 클래스나 설정 인터페이스에 새 메서드 시그니처를 병합할 수 있습니다.

```ts title="index.d.ts"
import 'native-dates';

declare module 'native-dates' {
  interface CalendarDate {
    nextBusinessDay(): CalendarDate;
  }
}
```

플러그인을 한 번 import하면 모든 호출 위치에서 TypeScript가 내장 메서드와 함께 새 메서드를 자동 완성합니다.
