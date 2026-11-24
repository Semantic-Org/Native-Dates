---
source: "08b594522a33"
title: Casos dos meses e plurais em russo
description: Formate meses russos no nominativo isolado, datas completas no genitivo, intervalos contraídos e durações com os três casos de plural.
try:
  - 'Compare as duas primeiras linhas para ver `YearMonth` exibir `май` no nominativo enquanto a data completa flexiona para o genitivo `1 мая`.'
  - 'Clique em **1**, **2**, **5**, **11** e **21** para ver `days()` alternar entre `день`, `дня` e `дней`, incluindo a exceção de `11`.'
  - 'Escolha uma data em março ou agosto para observar outras terminações de meses russos variarem entre cabeçalho e data completa.'
---

Chamar `configure({ locale: 'ru' })` uma vez aplica os casos dos meses e as declinações de plural do russo em toda a aplicação. Ler `day.yearMonth.text` usa o nominativo isolado para cabeçalhos, enquanto datas completas passam automaticamente para o genitivo.

Intervalos de datas contraem o mês e o ano compartilhados, ligando os dias com meia-risca. Ler `span.text` mantém o mês compartilhado no genitivo, produzindo `1–5 мая 2026 г.` sem templates manuais.

Contagens de duração aplicam as três formas de plural do russo diretamente em `days(total).text`. Números terminados em 1, como 21, usam o singular `день`, enquanto os números de 11 a 14 levam o genitivo plural.
