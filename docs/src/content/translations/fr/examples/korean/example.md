---
source: 1545d0094bfd
title: Espacement coréen et plages condensées
description: Formatez des dates coréennes avec espacement des compteurs en hangeul, plages de dates condensées et périodes de la journée avant l’heure.
try:
  - "Cliquez sur **+35 days** ou saisissez `35` dans le champ **Span** pour voir `6월` apparaître sur la date de fin dès que la plage bascule en juin."
  - "Cliquez sur **+4 days** pour voir `format()` condenser l’année et le mois communs en `2026년 5월 1일~5일`."
  - "Réglez **Time** sur **09:30** pour que la période de la journée coréenne bascule de `오후` à `오전` devant l’heure."
---

Contrairement au chinois et au japonais, l’orthographe coréenne impose une espace après chaque compteur d’année, de mois et de jour. Un seul appel à `configure({ locale: 'ko' })` applique cet espacement à chaque propriété `.text` et à chaque appel à `format()`.

Appeler `range.format('long')` condense l’année et le mois communs autour d’un tilde tout en conservant `일` après chacun des deux numéros de jour. Dès que la plage passe au mois suivant, le compteur du mois de fin réapparaît automatiquement.

Au format 12 heures, le marqueur coréen du matin ou de l’après-midi précède l’heure. Lire `day.yearMonth.text` formate des en-têtes mensuels nets sans compteur de jour en fin de chaîne.
