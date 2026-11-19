import * as core from '@native-dates/core';
import * as nativeDates from 'native-dates';
import { describe, expect, it } from 'vitest';

describe('@native-dates/core exports', () => {
  it('are every name native-dates exports and no other', () => {
    expect(Object.keys(core).sort()).toEqual(Object.keys(nativeDates).sort());
  });

  it('are the very classes, functions and symbols native-dates exports, not a second copy of them', () => {
    const different = Object.keys(nativeDates).filter((name) => core[name] !== nativeDates[name]);
    expect(different).toEqual([]);
  });

  it('share one configuration with native-dates', () => {
    core.configure({ zone: 'Asia/Tokyo' });
    try {
      expect(nativeDates.configure().zone).toBe('Asia/Tokyo');
      expect(nativeDates.date('2026-11-16').as('datetime').zone).toBe('Asia/Tokyo');
    }
    finally {
      core.configure({ zone: null });
    }
  });

  // its exports map names only the import condition, as the one in native-dates does
  it.todo('load with require() from a CommonJS file, as Node 26 loads any ES module');
});
