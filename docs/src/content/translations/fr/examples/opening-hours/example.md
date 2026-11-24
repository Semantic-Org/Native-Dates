---
source: 6fd6b6ec1692
title: Ouvert en ce moment
description: Vérifiez si des établissements dans différents fuseaux horaires sont ouverts à une heure du jour donnée, y compris pour les horaires de nuit franchissant minuit.
try:
  - "Sélectionnez `Asia/Tokyo` dans la barre d’aperçu et réglez l’heure sur **01:00** pour voir le bar à ramen rester ouvert après minuit."
  - "Basculez la barre d’aperçu sur `Europe/London` ou `America/Los_Angeles` pour voir cette même heure du jour interprétée dans ce nouveau fuseau horaire et convertie dans le monde entier."
  - "Ajoutez un établissement avec des horaires de nuit comme `22:00` à `04:00` dans le tableau `PLACES` de `app.js`."
---

Chaque établissement définit ses horaires sous forme d’une plage horaire `timeRange(open, close)` dans son propre fuseau horaire. Lorsque la fermeture précède l’ouverture, la plage passe automatiquement minuit.

Pour l’heure du jour saisie, `today().at(input.value)` construit l’instant dans votre fuseau horaire actif et `in(place.zone)` le convertit vers le fuseau horaire de l’établissement.

Vérifier `hours.contains(local.time)` indique ensuite si l’établissement est ouvert, sans cas particulier pour les horaires nocturnes ni calcul manuel de décalage UTC.
