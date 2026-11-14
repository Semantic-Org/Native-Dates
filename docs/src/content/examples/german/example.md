---
title: German ordinal periods, spans, and calendar weeks
description: Format German dates with ordinal periods and capitalized nouns, collapse day spans, and compute ISO Kalenderwochen across year boundaries.
tabs: [app.js, index.html]
try:
  - 'Click **2027-01-01** to see Friday, January 1 stay in `KW 53` of the previous ISO week-year.'
  - 'Pick **2027-01-04** in **Date** to watch the first Monday of January start `KW 1`.'
  - 'Set **Days** to **35** on **2026-05-01** so `format(''long'', ''de'')` keeps ordinal periods across May and June.'
related:
  - { title: Formatting, href: /guides/formatting/ }
  - { title: CalendarDate, href: /api/calendar-date/ }
  - { title: Ranges, href: /api/ranges/ }
---

German capitalizes weekday and month nouns and writes a period after ordinal day numbers. Calling `format('full', 'de')` produces "Freitag, 1. Mai 2026" with the comma and dot in place.

Date spans retain the ordinal period on both day numbers through `range.format('long', 'de')`. A four-day May span prints "1.–5. Mai 2026" without dropping the dot after the starting day.

Everyday numeric dates in Germany, Austria, and Switzerland separate day, month, and year with dots. Passing the `'L'` preset outputs zero-padded "01.05.2026" directly from `Intl`.

Work schedules across German-speaking countries track weeks by ISO Kalenderwoche, abbreviated "KW". Calling `format('W')` assigns January 1, 2027 to "KW 53" because ISO week 1 starts on January 4.
