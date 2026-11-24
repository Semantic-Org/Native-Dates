---
source: b2f722c41282
title: Casse française, plages et horloges régionales
description: Formatez des dates françaises sans fichier de locale, comparez les séparateurs horaires de Paris et de Montréal, et condensez les plages multi-jours.
try:
  - "Réglez **Time** sur **14:45** pour comparer `14:45` en `fr` et `14 h 45` en `fr-CA`."
  - "Passez **Days** à **20** pour que la plage franchisse la fin mai et développe `15–19 mai 2026` en affichant les deux mois."
  - "Choisissez un autre jour dans **Date** pour vérifier le rendu de `format('full')` et la mise à jour synchronisée des deux horloges et de la plage."
---

Un seul appel à `configure({ locale: 'fr' })` active le formatage français sur toute l’application, sans aucun fichier de locale à charger : `start.format('full')` renvoie directement « vendredi 15 mai 2026 », avec la casse et la ponctuation françaises.

En associant la date à une heure du jour dans `Europe/Paris`, `paris.format('long')` applique le format français métropolitain (« 15 mai 2026 à 09:30 »), avec deux-points entre les heures et les minutes.

Attachez `.locale('fr-CA')` sur l’instant de Montréal pour appliquer les usages québécois à une valeur donnée sans modifier la locale globale : l’horloge bascule alors sur le séparateur espacé « 09 h 30 ».

La propriété `range.text` condense automatiquement le mois et l’année communs (« 15–19 mai 2026 ») et affiche les deux noms de mois dès que la plage bascule sur le mois suivant.
