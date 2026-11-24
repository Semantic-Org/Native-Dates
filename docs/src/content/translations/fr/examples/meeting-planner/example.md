---
source: a1acc3289f74
title: Une réunion sur plusieurs fuseaux
description: Choisissez une heure de réunion demain dans votre fuseau horaire local et affichez ce même instant dans plusieurs villes du monde.
try:
  - "Réglez l’heure de début sur **23:00** pour voir Tokyo et Kolkata passer au jour suivant."
  - "Basculez la barre d’aperçu sur un autre fuseau horaire afin de planifier la réunion depuis cette ville."
  - "Ajoutez `'Australia/Sydney'` au tableau `CITIES` dans `cities.js` pour inclure une ville supplémentaire dans le planning."
---

La planification commence par `tomorrow().at(input.value)`, qui associe la date calendaire de demain à l’heure du jour choisie. Cet instant unique pilote toute la liste sans calcul manuel de décalage UTC.

Pour chaque ville, `meeting.in(zone)` affiche ce même instant dans le fuseau horaire IANA correspondant et `format('time')` formate son heure locale.

Comparer `there.date` à la date de l’hôte détecte les villes qui ont franchi minuit. La ligne n’affiche le nom du jour de la semaine que lorsque la date diffère.
