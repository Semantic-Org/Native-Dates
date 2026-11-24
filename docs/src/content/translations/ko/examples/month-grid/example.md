---
source: 8e121fa04579
title: 월간 달력 그리드
description: YearMonth를 기반으로 로케일별 주 시작 요일과 DateRange 순회를 활용해 이동 가능한 월간 달력 그리드를 구성합니다.
try:
  - '이전·다음 달로 이동한 뒤 **Today**를 클릭해 현재 달로 바로 돌아와 보세요.'
  - '그리드의 주 시작 요일을 월요일로 바꾸려면 `app.js`에서 `configure({ locale: ''de-DE'' })`를 호출해 보세요.'
  - '`day.isWeekday()`로 평일 스타일을 적용하거나 `current.plus(1, ''year'')`로 1년 단위로 이동해 보세요.'
---

달력 상태는 `yearMonth(today())` 값 하나로 관리합니다. 이전 달이나 다음 달로 이동할 때는 `minus()` 또는 `plus()`를 한 번 호출하면 됩니다.

달력 첫 주와 마지막 주의 앞뒤 날짜 칸을 채우기 위해 `startOf('week')`와 `endOf('week')`로 해당 월의 경계를 활성 로케일의 주 시작 요일에 맞춰 확장합니다.

이렇게 만든 범위에 `every('day')`를 호출하면 모든 날짜 칸이 순서대로 반환되며, `day.isToday()`와 `day.isWeekend()` 결과로 각 칸의 클래스를 바로 지정합니다.
