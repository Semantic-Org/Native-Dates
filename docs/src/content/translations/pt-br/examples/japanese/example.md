---
source: "c0cdbd2ef3c9"
title: Eras, datas e turnos em japonês
description: Formate eras imperiais japonesas com gannen no primeiro ano, datas em kanji sem zero à esquerda e turnos noturnos que cruzam a meia-noite.
try:
  - 'Clique em **平成最後の日** e **令和初日** para ver 1º de maio de 2019 passar de `平成31年4月30日` para `令和元年5月1日`.'
  - 'Escolha **2026-05-01** para ver o calendário imperial avançar para `令和8年`, mantendo mês e dia sem zero à esquerda.'
  - 'Edite os horários do turno cruzando a meia-noite e observe que `timeRange()` mantém um intervalo puro de horários com o traço ondulado japonês `～`.'
---

Chamar `configure({ locale: 'ja' })` uma vez define o japonês em todas as pré-visualizações de texto e presets de formatação. Os presets padrão combinam números sem zero à esquerda com contadores em kanji, e `day.yearMonth` omite o dia para títulos mensais.

Intervalos de datas e valores noturnos de `timeRange()` herdam automaticamente esse mesmo locale configurado. Ambos ligam as pontas com o traço ondulado japonês sem exigir datas artificiais ao cruzar a meia-noite.

Passe uma tag de locale apenas quando quiser outro calendário. `'ja-u-ca-japanese'` formata no calendário imperial japonês e imprime `元年` no primeiro ano de cada era.
