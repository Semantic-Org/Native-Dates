---
source: "8e121fa04579"
title: 月历网格
description: 基于 `YearMonth`、随区域设置变化的周边界和 `DateRange` 迭代构建可切换月份的日历网格。
try:
  - '向前、向后切换月份，再点击 **Today** 跳回当前月份。'
  - '在 `app.js` 中调用 `configure({ locale: ''de-DE'' })`，将日历网格切换为周一作为一周起始。'
  - '尝试用 `day.isWeekday()` 为工作日添加样式，或用 `current.plus(1, ''year'')` 按整年跳转。'
---

整个日历的状态仅由一个 `yearMonth(today())` 值维护。切换上下月只需调用一次 `minus()` 或 `plus()`。

为了补齐月初和月末的占位格，`startOf('week')` 和 `endOf('week')` 会按照当前区域设置的一周起始日自动向外扩展月份边界。

在该范围上调用 `every('day')` 可按顺序返回每个日期单元格，再用 `day.isToday()` 和 `day.isWeekend()` 直接控制单元格样式类名。
