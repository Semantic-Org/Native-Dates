---
source: 3c5dbea3c614
title: Saisie de durées
description: Analysez des expressions de durée en anglais et des chaînes ISO 8601 saisies dans un champ texte pour les afficher en toutes lettres, en heures décimales et en format d’échange.
try:
  - "Saisissez l’expression anglaise `90 minutes` pour la voir formatée en toutes lettres, totaliser `1.5` heure et se sérialiser en `PT90M`."
  - "Essayez l’expression anglaise `2 weeks and 3 days` ou la chaîne `PT45M` pour combiner formulations naturelles et ISO 8601."
  - "Saisissez `soon` pour voir le message d’erreur (émis en anglais en développement) expliquer le problème et proposer des exemples valides."
---

Passer la saisie utilisateur à `duration()` analyse les expressions de durée en anglais, les formes compactes comme `1h 30m` et les chaînes ISO 8601 en une seule valeur structurée.

À partir de là, `format()` affiche la durée en toutes lettres et `total('hours')` la convertit en un nombre décimal unique. L’interpolation en chaîne produit la forme ISO 8601 standard prête pour une base de données ou une API.

Une saisie illisible lève une erreur dont `error.message` indique la chaîne invalide et suggère des exemples valides directement dans la page.
