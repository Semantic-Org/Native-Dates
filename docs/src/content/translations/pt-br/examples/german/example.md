---
source: "1c05d3e2b330"
title: Ordinais, intervalos e semanas do calendário em alemão
description: Formate datas em alemão com pontos ordinais e substantivos com inicial maiúscula, contraia intervalos de dias e calcule Kalenderwochen ISO na virada do ano.
try:
  - 'Clique em **2027-01-01** para ver sexta-feira, 1º de janeiro, permanecer na `KW 53` do ano-semana ISO anterior.'
  - 'Escolha **2027-01-04** em **Date** para observar a primeira segunda-feira de janeiro iniciar a `KW 1`.'
  - 'Defina **Days** como **35** em **2026-05-01** para ver `range.format(''long'')` manter os pontos ordinais entre maio e junho.'
---

Chamar `configure({ locale: 'de' })` uma vez aplica as iniciais maiúsculas e os pontos ordinais do alemão em todos os valores. `start.format('full')` produz “Freitag, 1. Mai 2026” com a vírgula e o ponto no lugar certo.

Intervalos de datas preservam o ponto ordinal nos dois números de dia em `range.format('long')`. Um intervalo de quatro dias em maio gera “1.–5. Mai 2026” sem perder o ponto após o dia inicial.

Datas numéricas no dia a dia da Alemanha, Áustria e Suíça separam dia, mês e ano com pontos. Ler `start.text` produz “01.05.2026” com zeros à esquerda diretamente pelo `Intl`.

Cronogramas nos países de língua alemã acompanham as semanas pela Kalenderwoche ISO, abreviada como “KW”. Em 1º de janeiro de 2027, `format('W')` retorna `'53'` (que `app.js` exibe com o prefixo “KW ”), pois a semana ISO 1 só começa em 4 de janeiro.
