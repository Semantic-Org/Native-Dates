---
source: "f8fde894143d"
title: Árabe
lede: Formate datas em árabe entre calendários regionais e algarismos orientais ou ocidentais.
---

Prefira uma tag com país como `'ar-EG'` ou `'ar-SA'` em vez de `'ar'` genérico ao configurar a [Localização](/guides/localization/). O sistema de algarismos, os nomes dos meses gregorianos e o primeiro dia da semana variam bastante entre países de língua árabe.

## Algarismos orientais e ocidentais

Emirados Árabes Unidos, países do Magrebe e a tag genérica `'ar'` usam algarismos ocidentais, enquanto Egito, Arábia Saudita, Levante e Iraque usam algarismos arábicos orientais.

Adicione `-u-nu-latn` ou `-u-nu-arab` quando precisar padronizar um único sistema de algarismos para todos os usuários:

```js
import { date } from 'native-dates';

const invoice = date('2026-11-16');

invoice.format('long', 'ar-EG'); // '١٦ نوفمبر ٢٠٢٦'
invoice.format('long', 'ar-AE'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-EG-u-nu-latn'); // '16 نوفمبر 2026'
invoice.format('long', 'ar-MA-u-nu-arab'); // '١٦ نونبر ٢٠٢٦'
```

Padrões de tokens sempre geram dígitos ASCII, localizando apenas os nomes de meses e dias da semana. Presets numéricos inserem marcas de direção direita-para-esquerda `\u200F` antes das barras, então prefira `'YYYY-MM-DD'` em asserções de teste, CSVs e URLs:

```js
invoice.format('YYYY-MM-DD', 'ar-EG'); // '2026-11-16'
invoice.format('dddd، D MMMM YYYY', 'ar-SA'); // 'الاثنين، 16 نوفمبر 2026'
invoice.format('short', 'ar-EG'); // '١٦\u200F/١١\u200F/٢٠٢٦'
```

## Datas islâmicas e meses regionais

Motores modernos usam o calendário gregoriano por padrão em `'ar-SA'`. Passe `'-u-ca-islamic-umalqura'` com um preset para formatar datas oficiais do calendário islâmico Umm al-Qura, como 1 de Shawwal de 1447 AH:

```js
import { date } from 'native-dates';

const eid = date('2026-03-20');

eid.format('long', 'ar-SA'); // '٢٠ مارس ٢٠٢٦'
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
eid.format('D MMMM YYYY', 'ar-SA-u-ca-islamic-umalqura'); // '20 مارس 2026'
```

Padrões de tokens e datas parciais permanecem no calendário gregoriano porque um único mês solar cruza dois meses islâmicos. Fixe primeiro um dia específico com [`on()`](/api/year-month/#on):

```js
import { yearMonth } from 'native-dates';

const march = yearMonth('2026-03');

march.format('long', 'ar-SA-u-ca-islamic-umalqura'); // 'مارس ٢٠٢٦'
march.on(1).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١٢ رمضان ١٤٤٧ هـ'
march.on(20).format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

Os nomes dos meses gregorianos e o uso de relógio de 12 ou 24 horas se dividem em quatro famílias regionais:

| Região | Tags de exemplo | Comportamento da saída |
|---|---|---|
| Egito, Golfo e Sudão | `ar-EG, ar-SA` | Meses egípcios e do Golfo como يناير, يوليو, نوفمبر com relógio de 12 horas (`ص` / `م` para AM e PM). |
| Levante e Iraque | `ar-LB, ar-IQ` | Meses levantinos como كانون الثاني, تموز, تشرين الثاني com relógio de 12 horas. |
| Marrocos | `ar-MA` | Meses marroquinos como ماي, يوليوز, غشت, شتنبر, نونبر, دجنبر com relógio de 24 horas. |
| Argélia e Tunísia | `ar-DZ, ar-TN` | Meses do Magrebe como جانفي, فيفري, جوان, جويلية, أوت com relógio de 12 horas. |

```js
import { datetime } from 'native-dates';

const july = datetime('2026-07-16T14:30', 'UTC');

july.format('long', 'ar-EG'); // '١٦ يوليو ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-LB'); // '١٦ تموز ٢٠٢٦ في ٢:٣٠ م'
july.format('long', 'ar-MA'); // '16 يوليوز 2026 في 14:30'
july.format('long', 'ar-DZ'); // '16 جويلية 2026 في 2:30 م'
```

## Início da semana e fins de semana

A semana começa no sábado no Egito, na Jordânia, no Catar e na Argélia; no domingo na Arábia Saudita e no Iêmen; e na segunda-feira nos Emirados Árabes Unidos, no Marrocos, na Tunísia e no Líbano.

O `weekStart`, os limites de semana e os cabeçalhos de dias da semana acompanham cada tag automaticamente, enquanto relatórios consolidados entre países podem passar `'monday'` de forma explícita:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'
wed.locale('ar-SA').startOf('week').toString(); // '2026-11-15'
wed.locale('ar-AE').startOf('week').toString(); // '2026-11-16'
weekdayNames('narrow', undefined, 'ar-EG')[0]; // 'س'
```

[`isWeekend()`](/api/calendar-date/#calendar-predicates) e [`isWeekday()`](/api/calendar-date/#calendar-predicates) também seguem o idioma ativo. Em mercados cujo fim de semana é sexta e sábado, como Arábia Saudita e Egito, sexta é fim de semana e domingo é dia útil:

```js
const fri = date('2026-11-20').locale('ar-SA');
const sun = date('2026-11-22').locale('ar-SA');

fri.isWeekend(); // true
sun.isWeekend(); // false
sun.isWeekday(); // true
```

## Seis formas de plural e texto RTL

O árabe tem seis formas de plural: zero, um, dois (como *يومان*), de 3 a 10, de 11 a 99 e centenas. [`Duration`](/api/duration/) e [`from()`](/api/date-time/#from) escolhem cada forma automaticamente, além de *بعد الغد* para “depois de amanhã” em datas de calendário:

```js
import { datetime, days } from 'native-dates';

days(1).format('long', 'ar-EG'); // 'يوم'
days(2).format('long', 'ar-EG'); // 'يومان'
days(5).format('long', 'ar-EG'); // '٥ أيام'
days(15).format('long', 'ar-EG'); // '١٥ يومًا'
days(100).format('long', 'ar-EG'); // '١٠٠ يوم'

const anchor = datetime('2026-11-16T09:00', 'Asia/Riyadh');
anchor.plus(2, 'days').from(anchor, 'ar-SA'); // 'خلال يومين'
anchor.date.plus(2, 'days').from(anchor.date, 'ar-SA'); // 'بعد الغد'
```

Navegadores podem reordenar sinais de datas ISO ou deslocamentos UTC dentro de parágrafos da direita para a esquerda, então envolva timestamps técnicos em `<bdi>`:

```html
<p dir="rtl">
  موعد الصيانة: ١٠–١٦ نوفمبر ٢٠٢٦ عند الساعة <bdi>09:00 +03:00</bdi>
</p>
```

## Interpretação de entradas e fusos horários

Com [o plugin loose](/plugins/loose/), tags árabes interpretam automaticamente datas com barras no formato dia/mês/ano, algarismos arábicos orientais com marcas de direção, horários com *ص* / *م* e tanto meses padrão quanto meses levantinos compostos:

```js
import '@native-dates/plugins/loose';
import { date, time, yearMonth } from 'native-dates';

date('06/11/2026', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-06'
date('١٦‏/١١‏/٢٠٢٦', { loose: true, locale: 'ar-EG' })?.toString(); // '2026-11-16'
date('16 تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11-16'
time('٢:٣٠ م', { loose: true, locale: 'ar-EG' })?.toString(); // '14:30:00'
yearMonth('تشرين الثاني 2026', { loose: true, locale: 'ar-LB' })?.toString(); // '2026-11'
```

[O plugin zones](/plugins/zones/) resolve diretamente as principais cidades do Golfo e do Norte da África, além de siglas regionais como `GST`. Com `'ar-SA'`, `AST` resolve para Riad:

```js
import '@native-dates/plugins/zones';
import { date, datetime } from 'native-dates';

datetime('2026-11-16T09:00', 'Makkah').zone; // 'Asia/Riyadh'
datetime('2026-11-16T09:00', 'Doha').zone; // 'Asia/Qatar'
datetime('2026-11-16T09:00', { zone: 'AST', locale: 'ar-SA' }).zone; // 'Asia/Riyadh'
```

Agende sempre com fusos horários IANA completos em vez de deslocamentos fixos. `'Africa/Casablanca'` recua uma hora durante o Ramadã, e o Cairo adianta o relógio à meia-noite direto para 01:00:

```js
datetime('2026-02-14T12:00', 'Africa/Casablanca').offset; // '+01:00'
datetime('2026-03-01T12:00', 'Africa/Casablanca').offset; // '+00:00'
datetime('2026-03-25T12:00', 'Africa/Casablanca').offset; // '+01:00'

const cairoSpring = date('2026-04-24').at('00:00', 'Africa/Cairo');
cairoSpring.hour; // 1
cairoSpring.hoursInDay; // 23
```
