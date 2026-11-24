---
source: c0cdbd2ef3c9
title: Ères japonaises, dates et horaires de nuit
description: Formatez les ères impériales japonaises avec gannen pour l’an 1, les dates en kanji sans zéro initial et les horaires de nuit franchissant minuit.
try:
  - "Cliquez sur **平成最後の日** puis **令和初日** pour voir le changement d’ère du 1er mai 2019 passer de `平成31年4月30日` à `令和元年5月1日`."
  - "Sélectionnez **2026-05-01** pour observer le calendrier impérial passer à `令和8年` tout en gardant le mois et le jour sans zéro initial."
  - "Modifiez les horaires de nuit autour de minuit et remarquez que `timeRange()` conserve une plage horaire pure avec le tiret ondulé japonais `～`."
---

Un seul appel à `configure({ locale: 'ja' })` applique le japonais à chaque aperçu texte et à chaque préréglage de formatage. Les préréglages standard associent des nombres sans zéro initial aux compteurs en kanji, et `day.yearMonth` retire le compteur de jour pour les en-têtes mensuels.

Les plages de dates et les valeurs `timeRange()` de nuit lisent automatiquement cette même locale configurée. Toutes deux relient leurs bornes par le tiret ondulé japonais sans introduire de dates calendaires artificielles au passage de minuit.

Ne passez une étiquette de locale que pour activer un autre calendrier. `'ja-u-ca-japanese'` formate dans le calendrier impérial japonais et affiche `元年` pour la première année de chaque ère.
