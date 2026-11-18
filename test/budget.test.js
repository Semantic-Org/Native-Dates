import { describe, expect, it } from 'vitest';

import { budget, evaluateBudget } from '../tools/gates/budget.js';
import { sentences } from '../tools/gates/prose.js';

describe('sentences', () => {
  it('extracts developer prose strings and templates while ignoring short tokens and operators', () => {
    const code = [
      "const id = 'native-dates/id';",
      "const expr = 'a === b && c !== d';",
      "const msg = 'expected a function listener';",
      'const hint = `expected function, got ${typeof x}. Pass \\`call((v) => {})\\``;',
    ].join('\n');

    expect(sentences(code)).toEqual([
      'expected a function listener',
      'expected function, got ${…}. Pass `call((v) => {})`',
    ]);
  });
});

describe('evaluateBudget', () => {
  // each bundle starts one allowed change under its own ceiling, whatever the budget's numbers are
  const startOf = ({ ceiling }) => ceiling - budget.change;
  const makeSide = (overrides = {}) =>
    Object.fromEntries(
      budget.bundles.map((bundle) => [
        bundle.name,
        { min: 2000, br: startOf(bundle), prose: 0, devProse: 1, expectsDevProse: true, ...overrides[bundle.name] },
      ]),
    );

  it('passes when bundles stay within ceilings and strip development prose', () => {
    const base = makeSide();
    const head = makeSide();
    const result = evaluateBudget({ head, base, title: 'Feat: Add helper' });

    expect(result.violations).toEqual([]);
    expect(result.leakedProse).toEqual([]);
  });

  it('fails Bug PRs at the bug threshold while allowing priced Feat growth within change', () => {
    const base = makeSide();
    const first = budget.bundles[0];
    const head = makeSide({
      [first.name]: { min: 2100, br: startOf(first) + budget.bug },
    });

    const bugResult = evaluateBudget({ head, base, title: 'Bug: Fix edge case' });
    expect(bugResult.violations.length).toBe(1);

    const featResult = evaluateBudget({
      head,
      base,
      title: 'Feat: Add option',
      body: `Expected bytes: +${budget.bug}`,
    });
    expect(featResult.violations).toEqual([]);
  });

  it('flags surviving production prose and missing __DEV__=true prose', () => {
    const firstBundle = budget.bundles[0].name;
    const leaked = evaluateBudget({
      head: makeSide({ [firstBundle]: { prose: 1 } }),
    });
    expect(leaked.leakedProse.length).toBe(1);

    const brokenDevFold = evaluateBudget({
      head: makeSide(
        Object.fromEntries(budget.bundles.map(({ name }) => [name, { devProse: 0, expectsDevProse: true }])),
      ),
    });
    expect(brokenDevFold.leakedProse.length).toBe(1);
  });
});
