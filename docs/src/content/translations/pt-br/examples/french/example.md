---
source: "b2f722c41282"
title: Minúsculas, intervalos e horários regionais em francês
description: Formate datas em francês sem vírgula após o dia da semana, compare os separadores de horário 24h entre Paris e Québec e contraia intervalos de vários dias.
try:
  - 'Mude **Time** para **14:45** para comparar `14:45` em `fr` com `14 h 45` em `fr-CA`.'
  - 'Defina **Days** como **20** para o intervalo cruzar para junho e expandir `15–19 mai 2026` exibindo os dois meses.'
  - 'Escolha outro dia em **Date** para ver os dias da semana em minúsculas seguirem direto para o número do dia, sem vírgula.'
---

Chamar `configure({ locale: 'fr' })` uma vez aplica as minúsculas e a pontuação do francês em todos os valores. `start.format('full')` produz “vendredi 15 mai 2026” em minúsculas, sem vírgula após o dia da semana.

Combinar a data com um horário em `Europe/Paris` insere a preposição acentuada “à” antes do relógio de 24 horas. Com o francês configurado, `paris.format('long')` separa horas e minutos com dois-pontos em “09:30”.

Encadeie `.locale('fr-CA')` em um instante de Montreal para comparar convenções regionais. A tipografia do Québec grafa “09 h 30” com o marcador “h” entre espaços em vez de dois-pontos.

Ler `range.text` evita repetir o mês e o ano compartilhados, exibindo “15–19 mai 2026” e mostrando os dois meses quando o intervalo cruza para o mês seguinte.
