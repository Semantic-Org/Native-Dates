import { isDevelopment } from './types.js';

const makeRefuse = (ErrorClass) => {
  const throwError = (code, at, { explanation } = {}) => {
    const line = `dates refused [${code}] ${at}`;
    const built = new ErrorClass(explanation ? `${line}\n${explanation}` : line);
    built.code = code;
    built.at = at;
    Error.captureStackTrace?.(built, throwError);
    throw built;
  };
  return throwError;
};

export const refuse = makeRefuse(RangeError);
export const refuseType = makeRefuse(TypeError);

// Temporal's own RangeErrors are precise but speak in spec terms. ours keep the code and echo the input
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

// value.as('date') is the call spelling of crossing to another kind, so a chain never stops at a
// property. each noun lists the kinds it can be read as, and any other kind is refused
export const readAs = (kind, readings) => {
  if (!Object.hasOwn(readings, kind)) {
    refuse('unknownKind', String(kind), {
      explanation: isDevelopment ? `this value reads as ${Object.keys(readings).join(' or ')}` : 0,
    });
  }
  return readings[kind]();
};

// { loose: true } gives null for input that cannot be read, and only for that. a bad zone is a
// mistake in the code, not in the data, and still throws. a bad unit is data when it sits inside a
// duration string and code when it names a method's unit, so only the duration door forgives it
const point = new Set([
  'unreadableDateTime',
  'unreadableDate',
  'unreadableTime',
  'notADateTime',
  'notADate',
  'notATime',
  'notFinite',
]);
const length = new Set([
  'unreadableDuration',
  'notADuration',
  'unknownUnit',
  'mixedSigns',
  'notFinite',
  'fractionalMonth',
]);

export const unreadable = { point, length, range: new Set([...point, ...length]) };

export const isUnreadable = (error, codes = point) => codes.has(error?.code);

// plugins/loose supplies Date.parse fallback and null-on-unreadable behavior
let looseParser = null;

export const setLooseExtension = (parser) => {
  looseParser = parser;
};

export const requireLoose = (at = 'loose') => {
  if (!looseParser) {
    refuse('missingPlugin', at, {
      explanation: isDevelopment
        ? "import '@native-dates/plugins/loose' for { loose: true } and dayFirst"
        : 0,
    });
  }
};

export const parseLoose = (text, zone, dayFirst) => {
  requireLoose();
  return looseParser(text, zone, dayFirst);
};

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
