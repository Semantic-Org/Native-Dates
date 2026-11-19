import * as core from '@native-dates/core';
import * as nativeDates from 'native-dates';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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

  // test files are ES modules, so require() runs in a second Node process started as CommonJS
  it('resolves require() from a CommonJS module to the same named exports as import', () => {
    const script = `console.log(JSON.stringify(Object.keys(require('@native-dates/core'))));`;
    const printed = execFileSync(process.execPath, ['--input-type=commonjs', '--eval', script], {
      cwd: fileURLToPath(new URL('../../..', import.meta.url)),
      encoding: 'utf8',
    });
    expect(JSON.parse(printed).sort()).toEqual(Object.keys(core).sort());
  });
});
