---
source: "a1acc3289f74"
title: Reunião entre fusos horários
description: Escolha um horário de reunião amanhã no seu fuso local e veja esse mesmo instante em cidades ao redor do mundo.
try:
  - 'Defina o horário de início como **23:00** para ver Tóquio e Calcutá passarem para o dia da semana seguinte.'
  - 'Troque o fuso horário na barra de pré-visualização para agendar a reunião a partir de outra cidade.'
  - 'Adicione `''Australia/Sydney''` a `CITIES` em `cities.js` para incluir mais uma cidade na lista.'
---

O agendamento começa com `tomorrow().at(input.value)`, combinando a data de amanhã com o horário escolhido. Esse único instante alimenta toda a lista sem cálculos manuais de deslocamento UTC.

Para cada cidade, `meeting.in(zone)` exibe o mesmo instante naquele fuso horário IANA e `format('time')` formata o relógio local.

Comparar `there.date` com a data do organizador detecta quando uma cidade cruzou a meia-noite. A linha mostra o rótulo do dia da semana apenas quando o dia muda.
