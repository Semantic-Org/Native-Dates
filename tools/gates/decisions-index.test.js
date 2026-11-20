import { describe, expect, it } from 'vitest';

import { checkDecisions, parseDecisions, renderDecisionsIndex } from './decisions-index.js';

describe('decisions-index', () => {
  const sample = [
    '# Decisions',
    '',
    '## `DateRange` includes its end date while `TimeRange` is half-open (2026-11-10)',
    '',
    'Old range entry.',
    '',
    'Superseded by 2026-11-12.',
    '',
    '## `DateRange` includes its end date and `TimeRange` wraps midnight (2026-11-12)',
    '',
    '*90% confident*',
    '',
    'Civil date ranges include their final day.',
    '',
    'Reopen: callers hit off-by-one bugs when converting ranges.',
    '',
    '## `Duration` uses `balance()` without a `normalize()` alias (2026-11-17)',
    '',
    'Luxon `normalize()` leaves `{ minutes: 90 }` unchanged.',
    '',
    'Reopen: cold-reader studies show callers expecting `normalize()`.',
    '',
  ].join('\n');

  it('parses optional confidence lines, reopen clauses, and supersession notes into topic and file-order indexes', () => {
    const { entries, findings } = parseDecisions(sample);
    expect(findings).toEqual([]);
    expect(entries.map((entry) => [entry.topic, entry.confidence, Boolean(entry.supersededBy)])).toEqual([
      ['Ranges', null, true],
      ['Ranges', 90, false],
      ['Durations', null, false],
    ]);

    const rendered = renderDecisionsIndex(entries);
    expect(rendered).toContain('### Ranges\n\n- [L9](decisions.md#');
    expect(rendered).toContain('(2026-11-12, 90% confident)');
    // superseded entries appear only in the chronological section
    expect(rendered.split('## Chronological')[0]).not.toContain('2026-11-10');
    expect(rendered.split('## Chronological')[1]).toContain('Superseded by 2026-11-12');
    expect(checkDecisions(sample, rendered)).toEqual([]);
  });

  it('flags malformed headings, out-of-order dates, missing reopen lines, unsorted titles, and stale indexes', () => {
    const broken = [
      '# Decisions',
      '',
      '## Missing date heading',
      '',
      '## `Duration` uses `balance()` (2026-11-18)',
      '',
      '*120% confident*',
      '',
      'Body without reopen.',
      '',
      '## Unmatched widget knob (2026-11-15)',
      '',
      'Body.',
      '',
      'Reopen: never.',
    ].join('\n');

    expect(checkDecisions(broken, '')).toEqual([
      "ai/contributing/decisions.md: L3: expected '## <Plain claim> (<YYYY-MM-DD>)' heading",
      "ai/contributing/decisions.md: L5: confidence line must lead the entry as '*0-100% confident*'",
      "ai/contributing/decisions.md: L5: missing 'Reopen: <observable condition>' line",
      "ai/contributing/decisions.md: L11: no topic group matched 'Unmatched widget knob'",
      'ai/contributing/decisions.md: L11: date 2026-11-15 precedes earlier entry 2026-11-18',
    ]);

    expect(checkDecisions(sample, 'stale')).toEqual([
      'ai/contributing/decisions-index.md: stale index (run `npm run ai:index`)',
    ]);
  });
});
