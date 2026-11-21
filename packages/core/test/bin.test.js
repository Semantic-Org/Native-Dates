import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('@native-dates/core bin', () => {
  it('hands off to the native-dates setup command', () => {
    const printed = execFileSync(process.execPath, [fileURLToPath(new URL('../bin.js', import.meta.url)), '--help'], {
      encoding: 'utf8',
    });
    expect(printed).toMatch(/^usage: npx native-dates/);
  });
});
