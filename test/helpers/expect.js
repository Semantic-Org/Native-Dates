import assert from 'node:assert/strict';

export const expect = (actual) => ({
  toBe(expected) {
    assert.equal(actual, expected);
  },
  toEqual(expected) {
    assert.deepEqual(actual, expected);
  },
  toMatch(pattern) {
    assert.match(actual, pattern);
  },
  toBeNull() {
    assert.equal(actual, null);
  },
  toBeUndefined() {
    assert.equal(actual, undefined);
  },
  toHaveLength(length) {
    assert.equal(actual.length, length);
  },
  toBeInstanceOf(Kind) {
    assert.equal(actual instanceof Kind, true);
  },
  toBeCloseTo(expected, digits = 2) {
    const tolerance = 10 ** -digits / 2;
    assert.ok(
      Math.abs(actual - expected) < tolerance,
      `expected ${actual} to be within ${tolerance} of ${expected}`,
    );
  },
  toThrow(pattern) {
    assert.throws(actual, pattern);
  },
  not: {
    toBe(expected) {
      assert.notEqual(actual, expected);
    },
    toMatch(pattern) {
      assert.doesNotMatch(actual, pattern);
    },
    toBeInstanceOf(Kind) {
      assert.equal(actual instanceof Kind, false);
    },
  },
});
