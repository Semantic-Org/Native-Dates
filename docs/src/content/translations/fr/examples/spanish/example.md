---
source: 53a71b3f58d3
title: Prépositions espagnoles, casse et dates jour en premier
description: Formatez des dates espagnoles, des plages condensées et des en-têtes mensuels, et analysez les chaînes à barres obliques jour en premier sans inversion mois-jour.
try:
  - "Réglez **Days** sur **35** pour que la plage bascule en juin et répète `de mayo` et `de junio` de chaque côté."
  - "Saisissez `15/08/2026` dans **Typed date** pour lire le jour avant le mois et afficher **15 de agosto de 2026**."
  - "Saisissez `32/05/2026` ou `pendiente` dans **Typed date** pour voir le mode souple renvoyer `null` et afficher **Unreadable**."
---

Définir `'es'` une seule fois dans `configure()` applique le formatage espagnol et l’analyse souple jour en premier dans toute votre application. Les dates complètes laissent les jours et les mois en minuscules et relient le jour, le mois et l’année par « de ».

Les plages de dates condensent les éléments communs via `range.format('long')` sans répéter la locale. Une plage à l’intérieur de mai n’affiche « de mayo de 2026 » qu’une seule fois, tandis qu’un passage en juin affiche chaque nom de mois de part et d’autre du tiret.

Les en-têtes de calendrier lisent `start.yearMonth` pour formater « mayo de 2026 » en conservant la préposition « de ».

Comme `'es'` écrit les dates jour en premier, `date(typed.value, { loose: true })` lit « 01/05/2026 » comme le 1er mai et renvoie `null` sur un texte invalide.
