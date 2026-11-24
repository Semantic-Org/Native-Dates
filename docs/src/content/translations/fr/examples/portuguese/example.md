---
source: fdb2094e7273
title: Crase portugaise, plages et saisie jour en premier
description: Formatez des dates et heures en portugais brésilien avec jours composés et crase « às » avant l’heure, condensez des plages de dates et analysez la saisie jour en premier.
try:
  - "Sélectionnez **2026-05-17** dans **Date** pour passer du jour composé **sexta-feira** au mot simple **domingo** tout en conservant `às` devant l’heure."
  - "Réglez **Days** sur **20** afin que la plage passe de mai à juin et affiche à la fois `de maio` et `de junho`."
  - "Saisissez `25/12/2026` ou `em breve` dans **Typed date** pour comparer l’analyse jour en premier au résultat **Unreadable**."
---

Définir `'pt-BR'` une seule fois dans `configure()` applique partout le formatage en portugais brésilien et l’analyse souple jour en premier. Formater un instant avec fuseau horaire conserve les noms de jours avec trait d’union comme « sexta-feira », les mois en minuscules et la crase « às » devant l’heure.

Les plages multi-jours condensent le mois et l’année communs via `range.format('long')`. En restant dans le mois de mai, « de maio de 2026 » n’apparaît qu’une fois à la fin au lieu d’être répété sur les deux dates.

Lire `start.yearMonth` isole le mois calendaire ou de facturation tout en gardant la préposition « de » dans « maio de 2026 ».

Comme `'pt-BR'` écrit les dates jour en premier, `date(typed.value, { loose: true })` lit « 08/05/2026 » comme le 8 mai et renvoie `null` lorsque le texte est invalide.
