---
source: "7cf50337d2e5"
title: Plurais, algarismos e datas islâmicas em árabe
description: Formate durações com os seis casos de plural do árabe, sistemas de algarismos orientais e ocidentais, nomes regionais de meses e datas islâmicas do calendário Umm al-Qura.
try:
  - 'Clique em **1**, **2**, **5**, **11** e **100** para percorrer as formas de singular, dual `يومان`, plural, acusativo e centena do árabe.'
  - 'Compare `ar-EG` e `ar-MA` na mesma data para ver algarismos arábicos orientais ao lado de algarismos ocidentais e dos nomes marroquinos dos meses.'
  - 'Escolha datas diferentes para ver `ar-SA-u-ca-islamic-umalqura` converter datas ISO para o calendário islâmico Umm al-Qura.'
---

Chamar `configure({ locale: 'ar-EG' })` uma vez ativa os plurais do árabe e os algarismos arábicos orientais em todos os valores. Ler `days(2).text` gera um substantivo dual próprio, sem nenhum dígito.

Encadeie `.locale('ar-MA')` quando um valor e seus intervalos derivados precisarem de algarismos ocidentais e nomes marroquinos de meses enquanto o restante da aplicação mantém o padrão configurado.

Passar `'ar-SA-u-ca-islamic-umalqura'` converte qualquer data de calendário para o calendário islâmico Umm al-Qura da Arábia Saudita, enquanto `day.monthDay` preserva uma referência gregoriana ao lado.

Ao incorporar texto em árabe em uma página da esquerda para a direita, envolva cada valor formatado em `<bdi>` para que algarismos e traços de intervalo mantenham a ordem da direita para a esquerda.
