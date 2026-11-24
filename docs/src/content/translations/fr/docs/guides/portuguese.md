---
source: 66dc60a9a9b2
title: Portugais
lede: Formatez et analysez les dates en portugais pour le Brésil ainsi que les variantes européennes et africaines.
---

Définissez `'pt-BR'` ou `'pt-PT'` (voir [Localisation](/guides/localization/)) pour formater les dates en portugais. Le Brésil et le Portugal partagent les dates numériques jour en premier et les mois en minuscules, mais diffèrent sur le préréglage moyen et les ordinaux du premier du mois.

## Analyser les dates jour/mois/année

Les chaînes ISO année en premier n’inversent jamais le mois et le jour. Avec [le plugin `loose`](/plugins/loose/), les locales portugaises lisent automatiquement jour en premier les dates à barres obliques, à points et en toutes lettres :

```js
import '@native-dates/plugins/loose';
import { date, datetime } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-06'
date('16.11.2026', { loose: true, locale: 'pt-PT' })?.toString(); // '2026-11-16'
date('16 de novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString(); // '2026-11-16'
datetime('16 de novembro de 2026 às 14:30', {
  loose: true,
  locale: 'pt-BR',
  zone: 'America/Sao_Paulo',
})?.hour; // 14
date('29/02/2026', { loose: true, locale: 'pt-BR' }); // null
```

Pour les dates partielles, les paires numériques jour-mois et mois-année s’analysent dans le noyau sans plugin, et le mode souple reconnaît les noms de mois portugais :

```js
import { dayMonth, monthDay, monthYear, yearMonth } from 'native-dates';

dayMonth('16/11').toString(); // '11-16'
monthYear('11/26').toString(); // '2026-11'
monthDay('16 de fev.', { loose: true, locale: 'pt-BR' })?.toString(); // '02-16'
yearMonth('novembro de 2026', { loose: true, locale: 'pt-BR' })?.toString();
// '2026-11'
```

## Préréglages, prépositions et ordinaux

Les préréglages intégrés produisent des noms de mois en minuscules et les prépositions naturelles. Le préréglage `'medium'` écrit le mois abrégé au Brésil mais affiche des chiffres séparés par des barres obliques au Portugal :

```js
import { date, datetime } from 'native-dates';

const consulta = datetime('2026-11-16T14:30', 'America/Sao_Paulo').locale('pt-BR');

consulta.format('short'); // '16/11/2026, 14:30'
consulta.format('medium'); // '16 de nov. de 2026, 14:30'
consulta.format('long'); // '16 de novembro de 2026 às 14:30'
date('2026-11-16').format('medium', 'pt-PT'); // '16/11/2026'
```

Entourez les mots littéraux comme `'[de]'` et `'[às]'` de crochets dans les motifs de jetons personnalisés. Les omettre lève une erreur plutôt que d’interpréter des lettres isolées :

```js
consulta.format('DD/MM/YYYY [às] HH:mm'); // '16/11/2026 às 14:30'
consulta.format('D [de] MMMM [de] YYYY'); // '16 de novembro de 2026'
```

Au Brésil, les mois et jours abrégés restent en minuscules avec un point final. `dd` utilise des initiales d’une seule lettre car *segunda* et *sexta* partagent leurs deux premières lettres.

Le Brésil écrit aussi le premier du mois *1º* dans *1º de maio*, alors que le Portugal emploie des nombres simples. Limitez les surcharges [`ordinals`](/api/configure/) et de jours de la semaine à `'pt-BR'` afin que le Portugal conserve ses valeurs par défaut :

```js
import { configure, weekdayNames } from 'native-dates';

weekdayNames('narrow', undefined, 'pt-BR'); // ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

configure({
  ordinals: { 'pt-BR': (d) => (d === 1 ? '1º' : d) },
  weekdayNames: { 'pt-BR': { short: { fri: 'Sex', sat: 'Sáb' } } },
});
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-BR'); // 'Sex, 1º de maio'
date('2026-05-01').format('ddd, Do [de] MMMM', 'pt-PT'); // 'sexta, 1 de maio'
```

## Début de semaine

Les noms de jours de *segunda-feira* à *sexta-feira* se comptent à partir du dimanche, mais `dayOfWeek` suit la numérotation ISO de 1 (lundi) à 7 (dimanche).

Les bornes de semaine suivent la propriété `weekStart` de chaque région — dimanche au Brésil et au Portugal, lundi en Angola, au Mozambique et au Cap-Vert :

```js
import { date } from 'native-dates';

const quarta = date('2026-11-18').locale('pt-BR');

quarta.weekStart; // 7
quarta.startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-PT').startOf('week').toString(); // '2026-11-15'
quarta.locale('pt-AO').startOf('week').toString(); // '2026-11-16'
```

Passez le mot-clé anglais `'monday'` lorsque vos rapports métier regroupent du lundi au dimanche. Les numéros ISO `weekOfYear` comptent toujours à partir du lundi :

```js
quarta.startOf('week', 'monday').toString(); // '2026-11-16'
quarta.range('week', 'monday').toString(); // '2026-11-16/2026-11-22'
```

## Fuseaux horaires et dates relatives

Le Brésil s’étend sur quatre fuseaux horaires et a supprimé l’heure d’été en 2019. `'America/Sao_Paulo'` reste à UTC-3 toute l’année tout en conservant les décalages d’heure d’été historiques :

| Fuseau horaire au Brésil | Identifiant IANA principal | Fuseaux régionaux et alias |
|---|---|---|
| Fernando de Noronha | `America/Noronha` | UTC-2. Résout directement `'Noronha'` et l’abréviation `'FNT'`. |
| Heure de Brasília | `America/Sao_Paulo` | UTC-3, partagé avec Bahia, Recife, Fortaleza et Belém ; résout l’abréviation `'BRT'` et les villes `'Brasília'`, `'Rio de Janeiro'`, `'Belo Horizonte'` et `'Salvador'`. |
| Amazonas et Mato Grosso | `America/Manaus` | UTC-4, partagé avec Cuiabá, Campo Grande et Porto Velho ; résout l’abréviation `'AMT'`. |
| Acre | `America/Rio_Branco` | UTC-5, partagé avec Eirunepé ; résout automatiquement l’abréviation `'ACT'` avec la locale `'pt-BR'`. |

Avec [le plugin `zones`](/plugins/zones/), les grandes villes brésiliennes (y compris sous leur forme native comme `'Brasília'` ou `'São Paulo'`) et les abréviations régionales comme `'BRT'` ou `'ACT'` se résolvent directement, même lorsque `'BRT'` figure dans une chaîne analysée en mode souple :

```js
import '@native-dates/plugins/loose';
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T14:00', 'BRT').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'Brasília').zone; // 'America/Sao_Paulo'
datetime('2026-11-16T14:00', 'São Paulo')
  .locale('pt-BR')
  .in('ACT')
  .format('HH:mm Z'); // '12:00 -05:00'
datetime('2026-11-16 14:30 BRT', { loose: true, zone: 'UTC' })?.toString();
// '2026-11-16T17:30:00.000Z'
```

Les dates calendaires renvoient des expressions relatives de jour jusqu’à *anteontem* (avant-hier) et *depois de amanhã* (après-demain). [`DateTime`](/api/date-time/) compte les heures écoulées et formule différemment le futur au Brésil et au Portugal.

Comme minuit UTC tombe à 21 h 00, heure de Brasília, passez [`today('America/Sao_Paulo')`](/api/date-fn/#today) sur les serveurs en UTC au lieu d’appeler [`fromNow()`](/api/calendar-date/#fromnow) :

```js
import { date, today } from 'native-dates';

const ref = date('2026-11-16');

date('2026-11-14').from(ref, 'pt-BR'); // 'anteontem'
date('2026-11-18').from(ref, 'pt-BR'); // 'depois de amanhã'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-BR'); // 'em 2 dias'
datetime('2026-11-18T12:00Z').from('2026-11-16T12:00Z', 'pt-PT');
// 'dentro de 2 dias'
ref.from(today('America/Sao_Paulo'), 'pt-BR');
```
