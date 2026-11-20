import { describe, expect, it } from 'vitest';

import { checkDecisions, parseDecisions, renderDecisionsIndex } from './decisions-index.js';

describe('decisions-index', () => {
  const sample = [
    '# Package Decisions',
    '',
    '## D1: `DateRange` includes its end date while `TimeRange` is half-open (2026-11-10)',
    '',
    'Old range entry.',
    '',
    'Superseded by D2 (2026-11-12).',
    '',
    '## D2: `DateRange` includes its end date and `TimeRange` wraps midnight (2026-11-12)',
    '',
    '*90% confident*',
    '',
    'Civil date ranges include their final day.',
    '',
    'Reopen: callers hit off-by-one bugs when converting ranges.',
    '',
    '## D3: `Duration` uses `balance()` without a `normalize()` alias (2026-11-17)',
    '',
    'Luxon `normalize()` leaves `{ minutes: 90 }` unchanged.',
    '',
    'Reopen: cold-reader studies show callers expecting `normalize()`.',
    '',
  ].join('\n');

  it('parses sequential D<n> IDs, line ranges, confidence lines, reopen clauses, and supersessions', () => {
    const { entries, findings } = parseDecisions(sample);
    expect(findings).toEqual([]);
    expect(
      entries.map((
        entry,
      ) => [entry.id, entry.line, entry.endLine, entry.topic, entry.confidence, Boolean(entry.supersededBy)]),
    ).toEqual([
      [1, 3, 7, 'Ranges', null, true],
      [2, 9, 15, 'Ranges', 90, false],
      [3, 17, 21, 'Durations', null, false],
    ]);

    const rendered = renderDecisionsIndex(entries);
    expect(rendered).toContain(
      '### Ranges\n\n- **D2:** `DateRange` includes its end date and `TimeRange` wraps midnight (2026-11-12, 90% confident) [L9-L15](decisions/package.md#',
    );
    // superseded entries appear only in the chronological section
    expect(rendered.split('## Chronological')[0]).not.toContain('**D1:**');
    expect(rendered.split('## Chronological')[1]).toContain('Superseded by D2 (2026-11-12)');
    expect(checkDecisions(sample, rendered)).toEqual([]);
  });

  it('flags malformed headings, non-sequential IDs, out-of-order dates, missing reopen lines, unsorted titles, and stale indexes', () => {
    const broken = [
      '# Package Decisions',
      '',
      '## Missing ID and date',
      '',
      '## D3: `Duration` uses `balance()` (2026-11-18)',
      '',
      '*120% confident*',
      '',
      'Body without reopen.',
      '',
      '## D2: Unmatched widget knob (2026-11-15)',
      '',
      'Body.',
      '',
      'Reopen: never.',
    ].join('\n');

    expect(checkDecisions(broken, '')).toEqual([
      "ai/contributing/decisions/package.md: L3: expected '## D<n>: <Plain claim> (<YYYY-MM-DD>)' heading",
      'ai/contributing/decisions/package.md: L5: expected sequential ID D1, got D3',
      "ai/contributing/decisions/package.md: L5: confidence line must lead the entry as '*0-100% confident*'",
      "ai/contributing/decisions/package.md: L5: missing 'Reopen: <observable condition>' line",
      "ai/contributing/decisions/package.md: L11: no topic group matched 'Unmatched widget knob'",
      'ai/contributing/decisions/package.md: L11: date 2026-11-15 precedes earlier entry 2026-11-18',
    ]);

    expect(checkDecisions(sample, 'stale')).toEqual([
      'ai/contributing/decisions.md: stale index (run `npm run ai:index`)',
    ]);
  });
});
