---
source: 78385378fc10
title: Compte à rebours avant un lancement
description: Affichez un compte à rebours en direct jusqu’au vendredi à 17 h 00, avec la durée restante en format complet, compact et numérique.
try:
  - "Observez chaque seconde défiler pendant que `now().until(launch)` recalcule la durée restante."
  - "Remplacez le nom de jour anglais `'friday'` par `'monday'` dans `app.js` pour déplacer le jour de lancement."
  - "Sélectionnez `Asia/Tokyo` dans la barre d’aperçu, où le vendredi à 17 h 00 arrive plusieurs heures plus tôt."
---

L’instant cible est construit avec `today().next('friday').at('5pm')`, qui attend le nom du jour en anglais : l’appel avance jusqu’au prochain vendredi et fixe l’heure locale à 17 h 00.

Chaque seconde, `now().until(launch)` calcule la durée restante en jours, heures, minutes et secondes. Appeler `round('second')` supprime les millisecondes pour un décompte régulier seconde par seconde.

Enfin, `format()` affiche cette même durée en toutes lettres ainsi qu’en style compact et en compteur numérique, sans diviser manuellement des millisecondes.
