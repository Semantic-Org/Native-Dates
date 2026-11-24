---
source: "78385378fc10"
title: Contagem regressiva para um lançamento
description: Faça uma contagem regressiva ao vivo até sexta-feira às 17h e exiba a duração restante nos estilos por extenso, compacto e digital.
try:
  - 'Acompanhe cada segundo enquanto `now().until(launch)` recalcula o tempo restante.'
  - 'Troque `''friday''` por `''monday''` em `app.js` para mudar o dia do lançamento.'
  - 'Selecione `Asia/Tokyo` na barra de pré-visualização, onde sexta-feira às 17h chega várias horas mais cedo.'
---

O instante de destino vem de `today().next('friday').at('5pm')`, que avança até a próxima sexta-feira e define o relógio local para as 17h.

A cada segundo, `now().until(launch)` mede o tempo restante em dias, horas, minutos e segundos. Chamar `round('second')` descarta os milissegundos para que a contagem ao vivo avance em passos limpos.

Por fim, `format()` exibe essa mesma duração por extenso ao lado dos estilos compacto e de cronômetro digital, sem divisões manuais por milissegundos.
