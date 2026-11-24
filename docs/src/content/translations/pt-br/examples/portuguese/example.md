---
source: "fdb2094e7273"
title: Crase, intervalos e datas dia/mês em português
description: Formate datas e horas em português do Brasil com presets nativos, intervalos enxutos e interpretação de datas no formato dia/mês.
try:
  - 'Escolha **2026-05-17** em **Date** para ver a saída mudar de **sexta-feira** para **domingo**, mantendo `às` antes do horário.'
  - 'Defina **Days** como **20** para o intervalo cruzar de maio para junho e exibir tanto `de maio` quanto `de junho`.'
  - 'Edite **Typed date** para `25/12/2026` ou `em breve` para comparar a leitura no formato dia/mês com o resultado **Unreadable**.'
---

Configurar `'pt-BR'` uma vez em `configure()` ativa a formatação em português do Brasil e a interpretação dia/mês no modo loose em toda a aplicação. Ao formatar um instante com fuso, `format('full')` já gera a data completa com o dia da semana, o mês e o horário precedido por “às” sem nenhum template manual.

Intervalos de vários dias evitam repetir mês e ano em `range.format('long')`. Dentro de maio, “de maio de 2026” aparece uma única vez no final em vez de se repetir nas duas pontas.

Ler `start.yearMonth` isola o mês de competência ou do cabeçalho do calendário e formata “maio de 2026” direto pelo `Intl`.

Com o locale em `'pt-BR'`, `date(typed.value, { loose: true })` interpreta “08/05/2026” como 8 de maio — sem inverter dia e mês — e retorna `null` quando o texto não forma uma data válida.
