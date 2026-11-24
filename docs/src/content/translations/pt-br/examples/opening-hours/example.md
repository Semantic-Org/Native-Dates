---
source: "6fd6b6ec1692"
title: Aberto agora
description: Verifique se estabelecimentos em diferentes fusos horários estão abertos em qualquer horário, incluindo expedientes noturnos que cruzam a meia-noite.
try:
  - 'Selecione `Asia/Tokyo` na barra de pré-visualização e defina o horário como **01:00** para ver o bar de lámen continuar aberto após a meia-noite.'
  - 'Troque o fuso na barra de pré-visualização para `Europe/London` ou `America/Los_Angeles` para ver o mesmo horário se deslocar pelo resto do mundo.'
  - 'Adicione um local com expediente noturno, como `22:00` até `04:00`, em `PLACES` dentro de `app.js`.'
---

Cada estabelecimento define seu expediente como um `timeRange(open, close)` no próprio horário local. Quando o fechamento vem antes da abertura, o intervalo cruza a meia-noite automaticamente.

Para qualquer horário escolhido, `today().at(input.value)` cria o instante e `in(place.zone)` converte para o relógio local do estabelecimento.

Verificar `hours.contains(local.time)` responde se o local está aberto, sem casos especiais para expedientes noturnos nem contas manuais com UTC.
