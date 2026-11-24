---
source: 84e8bf9a4705
title: 설치
lede: 명령 한 줄로 Native Dates를 설치하고, 필요하면 Safari와 구버전 Node용 폴리필을 추가합니다.
---

Native Dates는 TypeScript 타입 정의가 포함된 ES 모듈 패키지이며 런타임 의존성이 전혀 없습니다.

## 설치하기

npm에서 바로 설치하거나, 코딩 에이전트와 함께 작업한다면 전용 설정 명령을 실행하세요.

```bash label="npm"
npm i native-dates
```

```bash label="스킬 포함 설치"
npx @native-dates/setup@latest
```

설치 후 앱에서 `native-dates`를 불러와 사용하세요.

```js title="app.js"
import { date, now, today } from 'native-dates';

const due = today().plus(2, 'weeks');
const current = now('Europe/Berlin');
const standup = date('2026-11-16').at('9:30am', 'America/Los_Angeles');
standup.format('YYYY-MM-DD HH:mm'); // '2026-11-16 09:30'
```

## Safari 및 구버전 Node 지원

Native Dates는 플랫폼에 내장된 `Temporal`과 `Intl` API 위에서 직접 동작합니다. 최신 Chrome, Edge, Firefox, Node 26 이상, Deno, Bun에서는 추가 설정이 필요 없습니다.

Safari, 구버전 브라우저, 또는 Node 22–25를 지원해야 한다면 `temporal-polyfill`과 함께 폴리필 패키지를 설치하세요.

```bash
npm i @native-dates/polyfill temporal-polyfill
```

날짜 관련 코드를 불러오기 전에 진입 파일 최상단에서 한 번만 가져오면 됩니다.

```js title="main.js"
import '@native-dates/polyfill';
import { today } from 'native-dates';

const launch = today().plus(30, 'days');
```

:::tip[최신 브라우저에서는 추가 비용 없음]
네이티브 `Temporal`과 `Intl.DurationFormat`을 지원하는 런타임은 어느 폴리필도 내려받지 않습니다.
:::

:::details[구버전 런타임 호환성 참고 사항]
- **동기 로딩:** 불러온 모듈이 최상위 `await` 완료 전에 로드 시점에서 바로 날짜를 계산한다면 대신 `@native-dates/polyfill/sync`를 불러오세요.
- **Node 22–23에서의 기간 포맷:** `@native-dates/polyfill`에는 의존성이 없는 `Intl.DurationFormat` 폴백이 포함되어 있어 Node 22–23에서도 [`Duration.format()`](/api/duration/#format)과 `Duration.text`가 동작합니다(브라우저와 Node 24 이상에는 기본 내장되어 있어 내려받지 않습니다).
:::

다음으로 [커스터마이징](/guides/customization/)을 읽고 앱 전역 기본값 설정과 선택적 플러그인 추가 방법을 살펴보세요.
