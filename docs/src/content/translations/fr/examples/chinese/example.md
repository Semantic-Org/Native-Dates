---
source: fabd612a3cd5
title: Calendriers chinois et périodes de la journée
description: Formatez des dates grégoriennes chinoises, des périodes de la journée avant l’heure, des mois lunaires traditionnels et les années de l’ère Minguo à partir d’une seule saisie.
try:
  - "Cliquez sur **Lunar New Year** pour voir le 17 février 2026 se formater en `2026丙午年正月初一`, avec `正月` pour le premier mois lunaire."
  - "Changez l’heure de **09:30** à **14:30** pour voir la période de la journée passer de `上午9:30` à `下午2:30` devant les chiffres."
  - "Comparez la ligne `zh-TW-u-ca-roc`, qui compte la même date comme l’an 115 du calendrier Minguo."
---

Un seul appel à `configure({ locale: 'zh-CN' })` active les compteurs et l’espacement chinois sur chaque date, heure du jour et date anniversaire. Au format 12 heures, le marqueur du matin ou de l’après-midi se place directement devant les chiffres de l’heure.

Pour les jours fériés récurrents et les anniversaires, `day.monthDay` retire l’année et formate des libellés mois-jour concis dans cette locale configurée.

Ne passez une étiquette explicite que pour changer de calendrier. `'zh-CN-u-ca-chinese'` formate les années lunaires en tiges célestes et branches terrestres avec `正月` pour le premier mois, tandis que `'zh-TW-u-ca-roc'` compte les années dans le calendrier Minguo alors que votre date stockée reste en ISO 8601.
