---
source: 1c05d3e2b330
title: Points ordinaux allemands, plages et semaines calendaires
description: Formatez des dates allemandes avec points ordinaux et noms en majuscule, condensez des plages de jours et calculez les Kalenderwochen ISO au passage d’année.
try:
  - "Cliquez sur **2027-01-01** pour voir le vendredi 1er janvier rester en `KW 53` de l’année-semaine ISO précédente."
  - "Sélectionnez **2027-01-04** dans **Date** pour voir le premier lundi de janvier ouvrir `KW 1`."
  - "Réglez **Days** sur **35** avec **2026-05-01** sélectionné afin que `range.format('long')` conserve les points ordinaux entre mai et juin."
---

Un seul appel à `configure({ locale: 'de' })` applique la majuscule allemande sur les noms et les points ordinaux à chaque valeur. `start.format('full')` produit « Freitag, 1. Mai 2026 » avec la virgule et le point attendus.

Les plages de dates conservent le point ordinal sur les deux numéros de jour via `range.format('long')`. Une plage de quatre jours en mai affiche « 1.–5. Mai 2026 » sans supprimer le point après le premier jour.

Au quotidien, l’Allemagne, l’Autriche et la Suisse séparent le jour, le mois et l’année par des points. Lire `start.text` renvoie directement « 01.05.2026 » avec zéros initiaux depuis `Intl`.

Dans les pays germanophones, les plannings suivent la semaine calendaire ISO (*Kalenderwoche*, abrégée « KW »). Pour le 1er janvier 2027, `format('W')` renvoie `'53'` (auquel `app.js` ajoute le préfixe `'KW '`), car la semaine ISO 1 ne commence que le 4 janvier.
