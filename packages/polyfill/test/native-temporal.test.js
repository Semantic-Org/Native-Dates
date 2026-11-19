import { describe, expect, it } from 'vitest';

describe.each([
  '@native-dates/polyfill',
  '@native-dates/polyfill/sync',
])('%s on a runtime with Temporal', (entry) => {
  it('leaves the Temporal of the runtime in place', async () => {
    const native = globalThis.Temporal;
    await import(entry);
    expect(globalThis.Temporal).toBe(native);
  });
});
