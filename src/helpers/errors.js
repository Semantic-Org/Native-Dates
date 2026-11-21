import { createErrors } from './utils.js';

import { isDevelopment } from './environment.js';

export const refuse = createErrors({ namespace: 'dates', ErrorClass: RangeError }).throwError;
export const refuseType = createErrors({ namespace: 'dates', ErrorClass: TypeError }).throwError;

// wraps raw Temporal/Intl errors in a coded refusal while letting already-coded errors pass through
export const guard = (attempt, code, at, explanation) => {
  try {
    return attempt();
  }
  catch (error) {
    if (error?.code) {
      throw error;
    }
    return refuse(code, at, { explanation: explanation || error.message.replace(/^Temporal error: /, '') });
  }
};

// throws an uncoded RangeError inside a guard() block so guard() attaches the outer code and input
export const fail = (explanation) => {
  throw new RangeError(explanation);
};

export const readAs = (kind, readings) => {
  if (!Object.hasOwn(readings, kind)) {
    refuse('unknownKind', String(kind), {
      explanation: isDevelopment ? `\`as()\` on this value only supports [${Object.keys(readings).join(', ')}]` : 0,
    });
  }
  return readings[kind]();
};

// { loose: true } returns null only for malformed input data, never for bad caller options like an
// unknown zone or locale. `unknownUnit` is forgiven only on durations, where unit text comes from input
// strings like duration('5 foo', { loose: true }) rather than a method parameter
const point = new Set([
  'invalidDateTime',
  'invalidDate',
  'invalidTime',
  'missingDateTime',
  'missingDate',
  'missingTime',
  'invalidNumber',
]);
const length = new Set([
  'invalidDuration',
  'unknownUnit',
  'conflictingSigns',
  'invalidNumber',
  'invalidFraction',
]);

export const unreadable = { point, length, range: new Set([...point, ...length]) };

export const isUnreadable = (error, codes = point) => codes.has(error?.code);

// registered at module load when @native-dates/plugins/loose is imported
let looseParser = null;
let partsParser = null;

export const setLooseExtension = (parser, parts) => {
  looseParser = parser;
  partsParser = parts;
};

export const requireLoose = (at = 'loose') => {
  if (!looseParser) {
    refuse('missingPlugin', at, {
      explanation: isDevelopment
        ? "`{ loose: true }` and `dayFirst` require the loose plugin. Import '@native-dates/plugins/loose' once at startup"
        : 0,
    });
  }
};

export const parseLoose = (text, options) => {
  requireLoose();
  return looseParser(text, options);
};

// month and day or year and month written in words ('16 de enero', 'ноябрь 2026 г.')
export const parseLooseParts = (text, options) => partsParser(text, options);

export const loosely = (build, codes = point) => {
  requireLoose();
  try {
    return build();
  }
  catch (error) {
    if (isUnreadable(error, codes)) {
      return null;
    }
    throw error;
  }
};
