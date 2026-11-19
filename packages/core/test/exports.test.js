import * as core from '@native-dates/core';
import * as nativeDates from 'native-dates';
import { describe, expect, it } from 'vitest';

describe('@native-dates/core', () => {
  it('exports the exact same set of names as native-dates', () => {
    expect(Object.keys(core).sort()).toEqual(Object.keys(nativeDates).sort());
  });

  it('re-exports the identical class, function, and symbol references from native-dates', () => {
    const different = Object.keys(nativeDates).filter((name) => core[name] !== nativeDates[name]);
    expect(different).toEqual([]);
  });

  it('shares configure() state with native-dates', () => {
    core.configure({ zone: 'Asia/Tokyo' });
    try {
      expect(nativeDates.configure().zone).toBe('Asia/Tokyo');
      expect(nativeDates.date('2026-11-16').as('datetime').zone).toBe('Asia/Tokyo');
    }
    finally {
      core.configure({ zone: null });
    }
  });
});
