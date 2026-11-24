---
source: "8e121fa04579"
title: Grade mensal
description: Monte uma grade mensal navegável a partir de um YearMonth usando limites de semana do locale e iteração com DateRange.
try:
  - 'Avance e volte pelos meses e depois clique em **Today** para retornar ao mês atual.'
  - 'Chame `configure({ locale: ''de-DE'' })` em `app.js` para fazer a grade começar na segunda-feira.'
  - 'Estilize dias úteis com `day.isWeekday()` ou salte um ano inteiro com `current.plus(1, ''year'')`.'
---

O estado do calendário é um único valor `yearMonth(today())`. Navegar entre meses exige apenas uma chamada a `minus()` ou `plus()`.

Para preencher as células da primeira e da última semana, `startOf('week')` e `endOf('week')` expandem os limites do mês conforme o primeiro dia da semana do locale ativo.

Chamar `every('day')` sobre esse intervalo retorna todas as células de dia em ordem, em que `day.isToday()` e `day.isWeekend()` definem diretamente as classes de cada célula.
