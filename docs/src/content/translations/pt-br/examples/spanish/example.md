---
source: "53a71b3f58d3"
title: Preposições, minúsculas e datas dia/mês em espanhol
description: Formate datas em espanhol, intervalos enxutos e cabeçalhos mensais, e interprete strings no formato dia/mês sem confundir dia com mês.
try:
  - 'Defina **Days** como **35** para o intervalo cruzar para junho e exibir `de mayo` e `de junio` em cada ponta.'
  - 'Digite `15/08/2026` em **Typed date** para interpretar o dia antes do mês e formatar **15 de agosto de 2026**.'
  - 'Digite `32/05/2026` ou `pendiente` em **Typed date** para ver o modo loose retornar `null` e exibir **Unreadable**.'
---

Configurar `'es'` uma vez em `configure()` aplica a formatação em espanhol e a leitura no formato dia/mês do modo loose em toda a aplicação. Datas completas mantêm dias da semana e meses em minúsculas e ligam dia, mês e ano com “de”.

Intervalos de datas contraem partes compartilhadas em `range.format('long')` sem precisar repetir o locale. Um intervalo dentro de maio traz “de mayo de 2026” uma única vez; já quando cruza para junho, exibe o nome de cada mês dos dois lados do traço.

Cabeçalhos de calendário leem `start.yearMonth` para formatar “mayo de 2026” com a preposição “de” preservada.

Como `'es'` escreve datas com o dia primeiro, `date(typed.value, { loose: true })` interpreta “01/05/2026” como 1º de maio e retorna `null` em texto inválido.
