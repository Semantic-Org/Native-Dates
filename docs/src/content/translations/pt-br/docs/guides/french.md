---
source: "a214ff99444f"
title: Francês
lede: Formate e interprete datas em francês entre relógios regionais e diferentes inícios de semana.
---

A tag genérica `'fr'` segue as convenções da França metropolitana. Use uma tag regional como `'fr-CA'` ao configurar a [Localização](/guides/localization/) quando seus usuários esperarem ordem de data, separadores de horário e início de semana locais.

## Variantes regionais

A ordem da data curta, os separadores de horário e o primeiro dia da semana mudam entre as regiões francófonas:

| Tag regional | Formato curto | Início da semana | Diferenças regionais |
|---|---|---|---|
| `fr-FR`, `fr-SN`, `fr-MA` | `'01/11/2026 14:30'` | `1` — segunda-feira | Separadores com barra, relógio de 24 horas e julho abreviado como `'juil.'`. |
| `fr-CA` | `'2026-11-01 14 h 30'` | `7` — domingo | Ordem ISO no Canadá, notação de horário com `'h'` espaçado e julho como `'juill.'`. |
| `fr-CH` | `'01.11.26 14:30'` | `1` — segunda-feira | Separadores com ponto e ano em dois dígitos em `'short'`, quatro dígitos com `'L'`. |
| `fr-BE` | `'1/11/26 14:30'` | `1` — segunda-feira | Dia sem zero à esquerda e ano em dois dígitos em `'short'`, quatro dígitos com `'L'`. |
| `fr-DZ` | `'01/11/2026 2:30 PM'` | `6` — sábado | Semana começando no sábado e relógio de 12 horas por padrão. |

Passe a tag regional completa para que os presets usem a pontuação local:

```js
import { datetime } from 'native-dates';

const rdv = datetime('2026-11-01T14:30:00', 'Europe/Paris');

rdv.format('short', 'fr-FR'); // '01/11/2026 14:30'
rdv.format('short', 'fr-CA'); // '2026-11-01 14 h 30'
rdv.format('short', 'fr-CH'); // '01.11.26 14:30'
rdv.format('L', 'fr-CH'); // '01.11.2026'
```

O francês canadense inicia a semana no domingo, e [`startOf('week')`](/api/calendar-date/#startof) e [`weekdayNames()`](/api/month-names/#weekdaynames) seguem essa regra automaticamente. Fixe segunda-feira quando relatórios do banco de dados exigirem semanas ISO:

```js
import { date, weekdayNames } from 'native-dates';

const mercredi = date('2026-11-18');

mercredi.locale('fr-FR').startOf('week').toString(); // '2026-11-16'
mercredi.locale('fr-CA').startOf('week').toString(); // '2026-11-15'
weekdayNames('short', undefined, 'fr-CA')[0]; // 'dim.'
mercredi.locale('fr-CA').startOf('week', 'monday').toString(); // '2026-11-16'
```

## Tipografia francesa e padrões de tokens

Coloque letras literais entre colchetes em padrões como `'HH[h]mm'`. Escrever `'HHhmm'` sem colchetes lança [`unknownFormat`](/api/errors/#units-zones-and-formats), enquanto um *à* acentuado isolado passa direto sem escape:

```js
import { datetime } from 'native-dates';

const depart = datetime('2026-11-01T14:30:00', 'Europe/Paris').locale('fr-FR');

depart.format('HH[h]mm'); // '14h30'
depart.format('[le] dddd D MMMM à HH[h]mm'); // 'le dimanche 1 novembre à 14h30'
```

O francês usa *1er* para o primeiro dia do mês e números simples nos demais dias. Registre uma regra de [`ordinals`](/api/configure/) em `'fr'` para que todas as tags regionais a herdem automaticamente:

```js
import { configure, date } from 'native-dates';

date('2026-11-01').format('long', 'fr-FR'); // '1 novembre 2026'

configure({ ordinals: { fr: (jour) => (jour === 1 ? '1er' : jour) } });
date('2026-11-01').format('Do MMMM YYYY', 'fr-FR'); // '1er novembre 2026'
date('2026-11-02').format('Do MMMM YYYY', 'fr-FR'); // '2 novembre 2026'
date('2026-11-01').format('Do MMMM YYYY', 'fr-CA'); // '1er novembre 2026'
```

Dias da semana e meses ficam em minúsculas na prosa em francês. Coloque apenas a primeira letra em maiúscula quando a data abrir um título.

Evite escrever um ponto depois de `MMM`: meses abreviados já trazem o próprio ponto, enquanto nomes curtos como *mars*, *mai*, *juin* e *août* não recebem nenhum:

```js
import { monthNames } from 'native-dates';

const s = date('2026-11-01').format('full', 'fr'); // 'dimanche 1 novembre 2026'
s[0].toUpperCase() + s.slice(1); // 'Dimanche 1 novembre 2026'
monthNames('short', 'fr-FR').slice(4, 8); // ['mai', 'juin', 'juil.', 'août']
monthNames('short', 'fr-CA').slice(4, 8); // ['mai', 'juin', 'juill.', 'août']
```

## Interpretação de datas e horários em francês

O núcleo interpreta diretamente strings ISO canadenses e horários franceses com hora e minuto como `'14h30'`. Com [o plugin loose](/plugins/loose/), as tags em francês leem automaticamente datas dia/mês/ano com barras ou pontos, ordinais e datas por extenso:

```js
import '@native-dates/plugins/loose';
import { date, datetime, time } from 'native-dates';

time('14h30').toString(); // '14:30:00'
time('14 h 30').toString(); // '14:30:00'
date('06/11/2026', { loose: true, locale: 'fr' })?.toString(); // '2026-11-06'
date('14.07.2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-14'
date('1er mai 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-05-01'
date('6 juil 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-07-06'
date('6 jui 2026', { loose: true, locale: 'fr' }); // null
datetime('lundi 16 novembre 2026 à 14h30', {
  loose: true,
  locale: 'fr',
  zone: 'Europe/Paris',
})?.hour; // 14
```

Abreviações de mês precisam corresponder a um único mês: *juil* é interpretado como julho, mas *jui* retorna `null` por ser ambíguo entre *juin* e *juillet*.

Datas parciais reconhecem nomes de meses e abreviações acentuadas em francês no modo loose. [`dayMonth()`](/api/month-day-fn/#daymonth) e [`duration()`](/api/duration-fn/) funcionam no núcleo sem plugins:

```js
import { dayMonth, duration, monthDay, yearMonth } from 'native-dates';

dayMonth('14/07').toString(); // '07-14'
monthDay('1er mai', { loose: true, locale: 'fr' })?.toString(); // '05-01'
yearMonth('févr. 2026', { loose: true, locale: 'fr' })?.toString(); // '2026-02'
duration('2h 30m').toString(); // 'PT2H30M'
```

## Fusos horários

A América do Norte muda o horário de verão duas a três semanas antes da Europa na primavera do hemisfério norte e uma semana depois no outono, reduzindo temporariamente a diferença entre Paris e Montreal de seis para cinco horas.

O Marrocos também volta para UTC+0 durante o Ramadã, então converta instantes com [`in()`](/api/date-time/#in) em vez de subtrair horas fixas:

```js
import { date } from 'native-dates';

const hiver = date('2026-01-15').at('15:00', 'Europe/Paris');
const mars = date('2026-03-16').at('15:00', 'Europe/Paris');

hiver.in('America/Montreal').format('short', 'fr-CA'); // '2026-01-15 09 h 00'
mars.in('America/Montreal').format('short', 'fr-CA'); // '2026-03-16 10 h 00'
```

Com [o plugin zones](/plugins/zones/), as principais cidades francófonas e siglas canadenses são resolvidas diretamente sem aliases:

```js
import '@native-dates/plugins/zones';
import { datetime } from 'native-dates';

datetime('2026-11-16T09:30', 'Montréal').zone; // 'America/Montreal'
datetime('2026-11-16T09:30', 'Bruxelles').zone; // 'Europe/Brussels'
datetime('2026-11-16T09:30', 'Genève').zone; // 'Europe/Zurich'
datetime('2026-11-16T09:30', 'HNE').zone; // 'America/Toronto'
```

## Datas relativas e espaços inquebráveis

Datas de calendário retornam *avant-hier* para anteontem e *après-demain* para depois de amanhã, enquanto [`DateTime`](/api/date-time/) conta unidades exatas para que horários de madrugada nunca sejam lidos como “ontem”.

Em asserções de teste, espere o apóstrofo tipográfico em *aujourd’hui* e espaços inquebráveis estreitos ou padrão dentro de durações curtas:

```js
import { date, datetime, duration } from 'native-dates';

const ref = date('2026-11-10');

ref.minus(2, 'days').from(ref, 'fr-FR'); // 'avant-hier'
ref.from(ref, 'fr-FR'); // 'aujourd’hui'
ref.plus(2, 'days').from(ref, 'fr-FR'); // 'après-demain'
datetime('2026-11-09T14:00Z').from('2026-11-10T14:00Z', 'fr-FR'); // 'il y a 1 jour'
duration({ hours: 3, minutes: 15 }).format('short', 'fr-FR');
// '3\u202fh et 15\u00a0min'
```
