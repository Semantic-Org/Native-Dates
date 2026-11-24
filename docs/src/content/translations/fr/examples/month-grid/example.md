---
source: 8e121fa04579
title: Une grille mensuelle
description: Construisez une grille de calendrier mensuel navigable à partir d’un YearMonth avec des bornes de semaine adaptées à la locale et une itération sur DateRange.
try:
  - "Reculez et avancez de mois en mois, puis cliquez sur **Today** pour revenir au mois en cours."
  - "Appelez `configure({ locale: 'de-DE' })` dans `app.js` pour faire commencer les semaines le lundi."
  - "Mettez en forme les jours ouvrés avec `day.isWeekday()` ou avancez d’une année complète avec `current.plus(1, 'year')`."
---

L’état du calendrier tient dans une seule valeur `yearMonth(today())`. Passer au mois précédent ou suivant se fait en un appel à `minus()` ou `plus()`.

Pour remplir les cases en début et en fin de grille, `startOf('week')` et `endOf('week')` étendent les bornes du mois pour les aligner sur le début de semaine de la locale active.

Appeler `every('day')` sur cette plage renvoie chaque case de jour dans l’ordre, où `day.isToday()` et `day.isWeekend()` pilotent directement les classes CSS.
