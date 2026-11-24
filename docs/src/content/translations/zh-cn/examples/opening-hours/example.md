---
source: "6fd6b6ec1692"
title: 实时营业状态
description: 判断不同时区的门店在任意时钟时间是否营业，原生支持跨午夜的夜间营业时段。
try:
  - '在预览栏中选择 `Asia/Tokyo` 并将时间设为 **01:00**，查看拉面馆在午夜后仍处于营业状态。'
  - '将预览栏切换为 `Europe/London` 或 `America/Los_Angeles`，观察同一时钟时间在全球各地的营业变化。'
  - '在 `app.js` 的 `PLACES` 中添加一家跨夜营业的门店，例如营业时间为 `22:00` 到 `04:00`。'
---

每家门店都用 `timeRange(open, close)` 按当地时钟时间定义营业时段。当打烊时间早于开店时间时，范围会自动跨午夜回绕。

选定任意时间后，先用 `today().at(input.value)` 构建具体时刻，再调用 `in(place.zone)` 转换到门店所在时区。

最后通过 `hours.contains(local.time)` 即可判断门店当前是否营业，无需为跨夜时段编写特判逻辑或手动换算 UTC。
