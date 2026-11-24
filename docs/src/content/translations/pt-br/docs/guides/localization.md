---
source: "7b49470321d3"
title: Localização
lede: Escolha entre o locale padrão do navegador, uma configuração global da aplicação, um locale associado ao valor ou uma sobrescrita pontual.
---

O Native Dates formata valores usando os dados `Intl` nativos do motor JavaScript. Todos os idiomas, sistemas de escrita, regras de plural e calendários funcionam sem baixar arquivos de locale.

O lugar onde você define o locale depende do seu ambiente de execução. Escolha o escopo que combina com a sua aplicação:

- **Padrão do runtime** quando uma aplicação no navegador acompanha as configurações do sistema do usuário
- **[`configure()`](/api/configure/) global** quando uma aplicação cliente tem seu próprio seletor de idioma ou um locale fixo
- **[`locale()`](/api/date-time/#locale) no valor** quando um servidor formata por requisição ou um encadeamento carrega seu próprio idioma
- **[`format()`](/api/date-time/#format) pontual** quando um único rótulo precisa de outro calendário ou variante regional

## Zero configuração no navegador

Quando nenhum locale é configurado ou passado, toda propriedade `.text`, chamada a `format()`, intervalo, duração e auxiliar de nomes usa o locale ativo do runtime.

Aplicações no navegador usadas por uma única pessoa e que seguem o idioma do sistema não exigem nenhuma configuração:

```js
import { dateRange, hours, today } from 'native-dates';

today().text;
dateRange('2026-09-01', '2026-09-07').format('medium');
hours(2).format('long');
```

## Padrão global para aplicações cliente

Chame [`configure()`](/api/configure/) uma única vez na inicialização quando a aplicação tiver seu próprio seletor de idioma ou mirar um locale fixo. Chame novamente sempre que o usuário trocar de idioma.

Todos os valores, intervalos, durações, datas parciais e auxiliares de nomes passam a formatar nesse locale:

```js title="main.js"
import { configure, date, days, monthNames, yearMonth } from 'native-dates';

configure({ locale: 'es-ES' });

date('2026-05-15').format('long'); // '15 de mayo de 2026'
yearMonth('2026-05').format('long'); // 'mayo de 2026'
days(2).text; // '2 días'
monthNames('short').slice(0, 3); // ['ene', 'feb', 'mar']

configure({ locale: null });
```

Passe `locale: null` para restaurar o locale padrão do runtime.

## Locale associado ao valor

Chame [`locale()`](/api/date-time/#locale) em qualquer valor para retornar uma cópia naquele idioma, ou passe `{ locale }` para uma função de criação. [`lang()`](/api/date-time/#lang) funciona como alias se você preferir o nome mais curto.

Tudo o que deriva desse valor mantém o mesmo locale. Cálculos, trocas de fuso horário, extrações de data e horário, intervalos e durações medidas herdam o idioma automaticamente:

```js
import { date, datetime } from 'native-dates';

const arrival = datetime('2026-05-15T14:30:00Z', 'Europe/Paris').locale('fr-FR');

arrival.text; // '15 mai 2026, 16:30 UTC+2'
arrival.plus(3, 'days').date.format('long'); // '18 mai 2026'

const stay = date('2026-09-01', { locale: 'de-DE' }).to('2026-09-07');
stay.format('medium'); // '01.–07.09.2026'
```

Em um servidor multiusuário, associe o locale de cada requisição ao ler o valor, em vez de alterar configurações globais do processo:

```js title="orders.js"
import { datetime } from 'native-dates';

function formatOrder(order, user) {
  const placed = datetime(order.placedAt, user.zone).locale(user.locale);
  return {
    placed: placed.format('long'),
    shipBy: placed.plus(2, 'days').date.format('medium'),
  };
}

formatOrder({ placedAt: '2026-05-15T14:30:00Z' }, { zone: 'Asia/Tokyo', locale: 'ja-JP' });
```

:::warning[Evite chamar configure() por requisição em servidores]
A configuração global altera um estado compartilhado por todo o processo JavaScript. Em um servidor multiusuário, outra requisição pode sobrescrever uma chamada a `configure()` entre operações assíncronas. Associe `locale()` diretamente ao valor.
:::

Chamar `locale()` sem argumentos retorna a tag ativa, ou `undefined` se nenhuma foi definida. Passar um valor vazio limpa o locale, permitindo encadear `locale(user.locale)` com segurança mesmo quando a coluna do banco vier vazia.

Strings de locale brutas e cabeçalhos HTTP `Accept-Language` funcionam diretamente sem pré-processamento. Tags com underscore como `'en_US'` são normalizadas automaticamente, e tags de cabeçalho são ordenadas por peso de qualidade (`q`), descartando entradas com peso zero. Strings de locale inválidas lançam [`unknownLocale`](/api/errors/#units-zones-and-formats):

```js
datetime('2026-05-15T14:30:00Z').locale('en_US').locale(); // 'en-US'
datetime('2026-05-15T14:30:00Z').locale('fr-CH;q=0.8, de;q=0.9, es;q=0').locale(); // ['de', 'fr-CH']
```

O locale da instância controla texto formatado, início da semana e dias de fim de semana. Comparações exatas, ordenação, [`equals()`](/api/date-time/#equals) e serialização ISO com [`toString()`](/api/date-time/#tostring) o ignoram:

```js
import { date } from 'native-dates';

const french = date('2026-05-15').locale('fr');
const japanese = date('2026-05-15').locale('ja');

french.equals(japanese); // true
french.toString(); // '2026-05-15'
french.to(japanese).locale(); // 'fr'
```

Quando um método combina dois valores com locales diferentes, prevalece o locale do valor em que o método foi chamado.

## Sobrescritas pontuais de calendário e variante regional

Passe uma tag BCP 47 para `format()` quando um único rótulo precisar de outro calendário, sistema numérico ou variante regional. O valor original mantém seu locale intacto:

```js
import { date } from 'native-dates';

const reiwa = date('2019-05-01').locale('ja-JP');
reiwa.format('long'); // '2019年5月1日'
reiwa.format('long', 'ja-u-ca-japanese'); // '令和元年5月1日'

const eid = date('2026-03-20').locale('ar-SA');
eid.format('long', 'ar-SA-u-ca-islamic-umalqura'); // '١ شوال ١٤٤٧ هـ'
```

## Como os locales são resolvidos

Ao formatar qualquer valor, intervalo, duração ou frase de tempo relativo, o Native Dates verifica cada origem nesta ordem e usa o primeiro locale encontrado:

| Prioridade | Origem | Quando usar |
|---|---|---|
| 1 | `value.format(spec, locale)` | Uma chamada específica precisa de outro calendário, escrita ou variante regional. |
| 2 | `value.locale(tag)` ou `{ locale }` | Requisições no servidor, encadeamentos reutilizáveis ou trechos localizados da interface. |
| 3 | `configure({ locale })` | Aplicações cliente com idioma global ou seletor de idioma. |
| 4 | Padrão `Intl` do runtime | Aplicações no navegador que acompanham o idioma do sistema do usuário. |

## Semanas e fins de semana

Os limites da semana e os cabeçalhos dos dias da semana seguem automaticamente o locale ativo. O runtime informa domingo nos Estados Unidos, Japão, Coreia e Brasil, sábado no Egito e segunda-feira na maior parte da Europa e na China.

Como [`startOf('week')`](/api/calendar-date/#startof), [`range('week')`](/api/calendar-date/#range) e [`weekdayNames()`](/api/month-names/#weekdaynames) compartilham a mesma regra de primeiro dia, os cabeçalhos de calendário sempre ficam alinhados com a grade semanal:

```js
import { date, weekdayNames } from 'native-dates';

const wed = date('2026-11-18');

wed.locale('en-US').startOf('week').toString(); // '2026-11-15'
wed.locale('de-DE').startOf('week').toString(); // '2026-11-16'
wed.locale('ar-EG').startOf('week').toString(); // '2026-11-14'

weekdayNames('short', undefined, 'en-US')[0]; // 'Sun'
weekdayNames('short', undefined, 'de-DE')[0]; // 'Mo'
```

Passe um dia da semana em inglês (como `'monday'`) para sobrescrever uma única chamada, ou defina `weekStart` em [`configure()`](/api/configure/) para fixar o dia inicial em todos os locales. Passar um valor vazio volta a seguir o locale, e runtimes sem dados de semana assumem segunda-feira.

:::details[Protegendo relatórios com semana fixa]
Uma instância preserva o locale do valor de que derivou. Fixe `weekStart` ou verifique `day.weekStart` — de 1 para segunda-feira a 7 para domingo — sempre que semanas servirem de chave para dados armazenados, como relatórios ou períodos de cobrança:

```js title="reports.js"
function weekKey(day) {
  if (day.weekStart !== 1) {
    throw new Error('weekly reports are keyed by Monday weeks');
  }
  return day.startOf('week').toString();
}
```

Os números de semana ISO em `weekOfYear` sempre contam semanas a partir da segunda-feira, e `dayOfWeek` segue essa mesma numeração iniciando na segunda-feira.
:::

As verificações de fim de semana também seguem o locale ativo. [`isWeekend()`](/api/calendar-date/#calendar-predicates) e [`isWeekday()`](/api/calendar-date/#calendar-predicates) consideram sexta e sábado como fim de semana na Arábia Saudita e no Egito, e apenas sexta-feira no Irã. A Índia usa apenas o domingo, enquanto a maioria dos outros locales usa sábado e domingo:

```js
const friday = date('2026-11-20');

friday.locale('en-US').isWeekend(); // false
friday.locale('ar-SA').isWeekend(); // true
```

## Nomes de dias da semana e ordinais personalizados

Os nomes de meses e dias da semana vêm do runtime, refletindo o que o dispositivo do usuário já exibe. Dois tokens de formatação não têm campo padrão na plataforma: dias da semana com duas letras (`dd`) e ordinais de dia (`Do`).

Por padrão, `dd` trunca o dia da semana curto para duas letras em idiomas que abreviam dessa forma e, nos demais casos, usa a forma estreita do runtime. Já `Do` formata sufixos ordinais em inglês e o marcador de dia do locale nos outros idiomas, como `'6.'` em alemão.

Você pode sobrescrever ambos globalmente com `weekdayNames` e `ordinals` em [`configure()`](/api/configure/). Tags regionais como `'fr-CA'` herdam as entradas do idioma base e aplicam sobrescritas por cima, sem alterar presets nem opções do `Intl`. Veja [Personalização](/guides/customization/#custom-weekday-names-and-ordinals) para exemplos.

Explore os [exemplos por idioma](/examples/#localization) e os guias específicos em **Datas e horários em** na barra lateral para ver particularidades regionais, de escrita e de calendário. A seguir, leia [Tipos de tempo](/guides/types-of-time/) para escolher o tipo certo para cada valor na sua aplicação.
