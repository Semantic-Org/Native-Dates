---
source: "fabd612a3cd5"
title: Calendários e períodos do dia em chinês
description: Formate datas gregorianas em chinês, períodos do dia antes da hora, meses do calendário lunar tradicional e anos da era Minguo a partir de uma única entrada.
try:
  - 'Clique em **Lunar New Year** para ver 17 de fevereiro de 2026 formatado como `2026丙午年正月初一`, com `正月` indicando o primeiro mês lunar.'
  - 'Mude o horário de **09:30** para **14:30** e observe o período do dia mudar de `上午9:30` para `下午2:30` antes dos dígitos.'
  - 'Compare a linha de `zh-TW-u-ca-roc`, que conta a mesma data como o ano 115 do calendário Minguo.'
---

Chamar `configure({ locale: 'zh-CN' })` uma vez define os contadores e o espaçamento do chinês em todas as chamadas de data, horário e `MonthDay`. Em relógios de 12 horas, o marcador de manhã ou tarde aparece logo antes dos dígitos da hora.

Para feriados civis e aniversários recorrentes, `day.monthDay` remove o ano e formata rótulos enxutos de mês e dia usando esse mesmo locale configurado.

Passe uma tag explícita apenas ao converter calendários. `'zh-CN-u-ca-chinese'` formata anos lunares pelo ciclo sexagesimal com `正月` para o primeiro mês, e `'zh-TW-u-ca-roc'` conta os anos no calendário Minguo enquanto a data armazenada continua em ISO 8601.
