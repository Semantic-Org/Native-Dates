---
source: "1545d0094bfd"
title: Espaçamento e intervalos enxutos em coreano
description: Formate datas em coreano com espaçamento após os contadores em Hangul, intervalos de datas contraídos e períodos do dia antes da hora.
try:
  - 'Clique em **+35 days** ou digite `35` no campo **Span** para ver `6월` aparecer na data final quando o intervalo cruza para junho.'
  - 'Clique em **+4 days** para ver `format()` contrair o ano e o mês compartilhados em `2026년 5월 1일~5일`.'
  - 'Mude o horário para **09:30** e veja o marcador coreano de período do dia alternar de `오후` para `오전` antes da hora.'
---

Diferentemente do chinês e do japonês, a ortografia coreana exige um espaço após cada contador de ano, mês e dia. Chamar `configure({ locale: 'ko' })` uma vez aplica esse espaçamento em toda propriedade `.text` e chamada a `format()`.

Chamar `range.format('long')` contrai o ano e o mês compartilhados em torno de um til, mantendo `일` nos dois números de dia. Ao cruzar para outro mês, o contador do mês final volta a aparecer automaticamente.

Relógios de 12 horas colocam o marcador coreano de manhã ou tarde antes da hora. Ler `day.yearMonth.text` formata títulos mensais limpos sem contador de dia no final.
