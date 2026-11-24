---
source: 08b594522a33
title: Déclinaisons russes des mois et pluriels
description: Formatez les mois russes au nominatif isolé, les dates complètes au génitif, les plages de dates condensées et les durées à trois formes plurielles.
try:
  - "Comparez les deux premières lignes pour voir `YearMonth` afficher le nominatif `май` tandis que la date complète passe au génitif `1 мая`."
  - "Cliquez sur **1**, **2**, **5**, **11** et **21** pour voir `days()` alterner entre `день`, `дня` et `дней`, y compris l’exception de `11`."
  - "Choisissez une date en mars ou en août pour observer d’autres terminaisons de mois russes se décliner entre l’en-tête et la date."
---

Un seul appel à `configure({ locale: 'ru' })` applique partout les cas des mois et les déclinaisons plurielles du russe. Lire `day.yearMonth.text` choisit le mois isolé au nominatif pour les en-têtes, tandis que les dates complètes passent automatiquement au génitif.

Les plages de dates condensent le mois et l’année communs autour d’un tiret demi-cadratin. Lire `span.text` maintient le mois commun au génitif et produit `1–5 мая 2026 г.` sans gabarit manuel.

Les durées appliquent directement les trois règles plurielles du russe sur `days(total).text`. Les nombres se terminant par 1 comme 21 renvoient le singulier `день`, tandis que les nombres de 11 à 14 prennent le génitif pluriel.
