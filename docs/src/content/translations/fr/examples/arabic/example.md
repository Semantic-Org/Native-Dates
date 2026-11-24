---
source: 7cf50337d2e5
title: Pluriels arabes, chiffres et calendrier hégirien
description: Formatez les six formes plurielles arabes, les chiffres orientaux et occidentaux, les noms de mois régionaux et les dates du calendrier hégirien Umm al-Qura.
try:
  - "Cliquez sur **1**, **2**, **5**, **11** et **100** pour parcourir le singulier, le duel `يومان`, le pluriel, l’accusatif et la forme des centaines en arabe."
  - "Comparez `ar-EG` et `ar-MA` sur une même date pour voir les chiffres arabes orientaux côte à côte avec les chiffres occidentaux et les noms de mois marocains."
  - "Sélectionnez différentes dates pour voir `ar-SA-u-ca-islamic-umalqura` convertir des dates ISO vers le calendrier hégirien Umm al-Qura."
---

Un seul appel à `configure({ locale: 'ar-EG' })` active les pluriels arabes et les chiffres arabes orientaux sur chaque valeur. Lire `days(2).text` produit directement le duel sans aucun chiffre.

Attachez `.locale('ar-MA')` lorsqu’une valeur et ses plages dérivées doivent afficher les chiffres occidentaux et les noms de mois marocains tout en laissant le reste de l’application sur la locale configurée par défaut.

Passer `'ar-SA-u-ca-islamic-umalqura'` convertit n’importe quelle date calendaire vers le calendrier hégirien Umm al-Qura utilisé en Arabie saoudite, tandis que `day.monthDay` conserve une référence grégorienne en parallèle.

Lorsque vous intégrez du texte arabe dans une page de gauche à droite, entourez chaque valeur formatée d’une balise `<bdi>` afin que les chiffres et les tirets de plage conservent l’ordre de droite à gauche.
