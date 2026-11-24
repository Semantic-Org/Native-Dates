---
source: "3c5dbea3c614"
title: Durações digitadas
description: Interprete expressões de duração em inglês e strings ISO 8601 de um campo de texto para exibir por extenso, em total de horas e no formato de transmissão.
try:
  - 'Digite `90 minutes` para ver a duração por extenso, o total de `1.5` horas e a serialização como `PT90M`.'
  - 'Experimente expressões de duração em inglês como `2 weeks and 3 days` ou strings ISO 8601 como `PT45M`.'
  - 'Digite `soon` para ver a mensagem de erro explicar o problema e sugerir exemplos válidos.'
---

Passar o texto digitado pelo usuário para `duration()` interpreta expressões de duração em inglês e strings ISO 8601 em um único valor estruturado.

A partir daí, `format()` exibe o tempo por extenso e `total('hours')` converte a duração em um único número decimal. A interpolação em string produz o formato ISO 8601 padrão para salvar no banco de dados ou enviar em uma API.

Entradas ilegíveis lançam um erro cuja propriedade `error.message` aponta o texto inválido e mostra exemplos válidos direto na tela.
