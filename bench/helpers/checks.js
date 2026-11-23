// long strings like a CSV report a short window from the first differing character
const firstDifference = (answered, expected, at) => {
  if (Array.isArray(expected)) {
    for (let index = 0; index < Math.max(answered?.length ?? 0, expected.length); index++) {
      const found = firstDifference(answered?.[index], expected[index], `${at}[${index}]`);
      if (found) {
        return found;
      }
    }
    return Array.isArray(answered) ? undefined : { at, answered, expected };
  }
  if (typeof answered === 'string' && typeof expected === 'string' && answered !== expected) {
    let index = 0;
    while (answered[index] === expected[index]) {
      index++;
    }
    return {
      at: `${at} at character ${index}`,
      answered: answered.slice(index, index + 40),
      expected: expected.slice(index, index + 40),
    };
  }
  return JSON.stringify(answered) === JSON.stringify(expected) ? undefined : { at, answered, expected };
};

// a faster but wrong change fails here instead of reading as a win
export const checkAnswer = (op, answered, expected) => {
  const found = firstDifference(answered, expected, 'the answer');
  if (found) {
    throw new Error(
      `bench ${op} answered ${JSON.stringify(found.answered)} where ${
        JSON.stringify(found.expected)
      } was expected, in ${found.at}`,
    );
  }
};
