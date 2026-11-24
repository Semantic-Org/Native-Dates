const UNIT_STYLES = ['long', 'short', 'narrow'];
const CLOCK_STYLES = ['long', 'short', 'narrow', 'numeric', '2-digit'];
const SUB_STYLES = ['long', 'short', 'narrow', 'numeric'];
const STYLES = ['long', 'short', 'narrow', 'digital'];
const DISPLAYS = ['auto', 'always'];

const UNITS = [
  { field: 'years', unit: 'year', styles: UNIT_STYLES, digital: 'short' },
  { field: 'months', unit: 'month', styles: UNIT_STYLES, digital: 'short' },
  { field: 'weeks', unit: 'week', styles: UNIT_STYLES, digital: 'short' },
  { field: 'days', unit: 'day', styles: UNIT_STYLES, digital: 'short' },
  { field: 'hours', unit: 'hour', styles: CLOCK_STYLES, digital: 'numeric' },
  { field: 'minutes', unit: 'minute', styles: CLOCK_STYLES, digital: 'numeric' },
  { field: 'seconds', unit: 'second', styles: CLOCK_STYLES, digital: 'numeric' },
  { field: 'milliseconds', unit: 'millisecond', styles: SUB_STYLES, digital: 'numeric' },
  { field: 'microseconds', unit: 'microsecond', styles: SUB_STYLES, digital: 'numeric' },
  { field: 'nanoseconds', unit: 'nanosecond', styles: SUB_STYLES, digital: 'numeric' },
];

const isNumeric = (style) => style === 'numeric' || style === '2-digit';

function resolveOptions(locales, options) {
  if (options !== undefined && (options === null || typeof options !== 'object')) {
    throw new TypeError('invalid options');
  }
  const opts = options ?? {};
  const nfOpts = {};
  if (opts.localeMatcher !== undefined) { nfOpts.localeMatcher = opts.localeMatcher; }
  if (opts.numberingSystem !== undefined) { nfOpts.numberingSystem = opts.numberingSystem; }
  const { locale, numberingSystem } = new Intl.NumberFormat(locales, nfOpts).resolvedOptions();

  const style = opts.style ?? 'short';
  if (!STYLES.includes(style)) {
    throw new RangeError('invalid style');
  }

  const resolved = { locale, numberingSystem, style };
  let prevStyle = '';
  for (const { field, styles, digital } of UNITS) {
    const rawStyle = opts[field];
    const rawDisplay = opts[`${field}Display`];
    if (rawStyle !== undefined && !styles.includes(rawStyle)) {
      throw new RangeError(`invalid ${field}`);
    }
    if (rawDisplay !== undefined && !DISPLAYS.includes(rawDisplay)) {
      throw new RangeError(`invalid ${field}Display`);
    }

    let unitStyle;
    if (rawStyle !== undefined) {
      unitStyle = rawStyle;
    }
    else if (style === 'digital') {
      unitStyle = digital;
    }
    else if (isNumeric(prevStyle)) {
      unitStyle = 'numeric';
    }
    else {
      unitStyle = style;
    }

    if (isNumeric(prevStyle)) {
      if (!isNumeric(unitStyle)) {
        throw new RangeError(`invalid ${field}`);
      }
      if (unitStyle === 'numeric' && styles.includes('2-digit')) {
        unitStyle = '2-digit';
      }
    }

    const isClock = field === 'hours' || field === 'minutes' || field === 'seconds';
    const isSubsecond = field === 'milliseconds' || field === 'microseconds' || field === 'nanoseconds';
    const defaultDisplay = (rawStyle !== undefined && !(isSubsecond && unitStyle === 'numeric'))
        || (style === 'digital' && isClock)
        || ((field === 'minutes' || field === 'seconds') && isNumeric(prevStyle))
      ? 'always'
      : 'auto';

    resolved[field] = unitStyle;
    resolved[`${field}Display`] = rawDisplay ?? defaultDisplay;
    prevStyle = unitStyle;
  }

  if (opts.fractionalDigits !== undefined) {
    const digits = Number(opts.fractionalDigits);
    if (!Number.isInteger(digits) || digits < 0 || digits > 9) {
      throw new RangeError('invalid fractionalDigits');
    }
    resolved.fractionalDigits = digits;
  }

  return resolved;
}

function toDurationRecord(input) {
  let source = input;
  if (typeof input === 'string') {
    if (!globalThis.Temporal?.Duration?.from) {
      throw new TypeError('invalid duration');
    }
    source = globalThis.Temporal.Duration.from(input);
  }
  if (source === null || typeof source !== 'object') {
    throw new TypeError('invalid duration');
  }

  const values = {};
  let hasField = false;
  let sign = 0;
  for (const { field } of UNITS) {
    const raw = source[field];
    if (raw === undefined) {
      values[field] = 0;
      continue;
    }
    hasField = true;
    const value = Number(raw);
    if (!Number.isInteger(value)) {
      throw new RangeError('invalid duration');
    }
    if (value !== 0) {
      const nextSign = value < 0 ? -1 : 1;
      if (sign !== 0 && sign !== nextSign) {
        throw new RangeError('invalid duration');
      }
      sign = nextSign;
    }
    values[field] = value;
  }

  if (!hasField) {
    throw new TypeError('invalid duration');
  }
  return { values, sign };
}

function getTimeSeparator(locale, numberingSystem) {
  const parts = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
    numberingSystem,
  }).formatToParts(0);
  const hourIndex = parts.findIndex((part) => part.type === 'hour');
  const next = hourIndex >= 0 ? parts[hourIndex + 1] : undefined;
  return next?.type === 'literal' && !/[\p{L}\s]/u.test(next.value) ? next.value : ':';
}

function tagParts(parts, unit) {
  return parts.map((part) => ({ ...part, unit }));
}

function formatFractionParts(locale, numberingSystem, fracDigits, unit) {
  if (!fracDigits) { return []; }
  const nf = new Intl.NumberFormat(locale, {
    numberingSystem,
    useGrouping: false,
    minimumFractionDigits: fracDigits.length,
    maximumFractionDigits: fracDigits.length,
  });
  return nf.formatToParts(Number(`0.${fracDigits}`))
    .filter((part) => part.type === 'decimal' || part.type === 'fraction')
    .map((part) => ({ ...part, unit }));
}

function sliceFraction(rem, width, fractionalDigits) {
  const padded = rem.toString().padStart(width, '0');
  if (fractionalDigits !== undefined) {
    return padded.slice(0, fractionalDigits);
  }
  return padded.replace(/0+$/, '');
}

function collectSubunits(values, index) {
  if (index === 6) {
    const total = BigInt(Math.abs(values.milliseconds)) * 1_000_000n
      + BigInt(Math.abs(values.microseconds)) * 1_000n
      + BigInt(Math.abs(values.nanoseconds));
    return { extra: total / 1_000_000_000n, rem: total % 1_000_000_000n, width: 9 };
  }
  if (index === 7) {
    const total = BigInt(Math.abs(values.microseconds)) * 1_000n
      + BigInt(Math.abs(values.nanoseconds));
    return { extra: total / 1_000_000n, rem: total % 1_000_000n, width: 6 };
  }
  const total = BigInt(Math.abs(values.nanoseconds));
  return { extra: total / 1_000n, rem: total % 1_000n, width: 3 };
}

class DurationFormat {
  #opts;
  #timeSep;

  constructor(locales, options) {
    this.#opts = resolveOptions(locales, options);
  }

  static supportedLocalesOf(locales, options) {
    return Intl.NumberFormat.supportedLocalesOf(locales, options);
  }

  resolvedOptions() {
    return { ...this.#opts };
  }

  formatToParts(duration) {
    const { values, sign } = toDurationRecord(duration);
    const opts = this.#opts;
    const { locale, numberingSystem, style, fractionalDigits } = opts;
    const items = [];
    let digitalParts = null;
    let signDisplayed = sign >= 0;

    for (let i = 0; i < UNITS.length; i++) {
      const { field, unit } = UNITS[i];
      const unitStyle = opts[field];
      const display = opts[`${field}Display`];
      const nextNumeric = i >= 6 && i <= 8 && opts[UNITS[i + 1].field] === 'numeric';

      if (nextNumeric) {
        const { extra, rem, width } = collectSubunits(values, i);
        const absInt = BigInt(Math.abs(values[field])) + extra;
        const hasValue = absInt !== 0n || rem !== 0n;
        if (hasValue || display === 'always') {
          const negative = !signDisplayed;
          signDisplayed = true;
          const fracDigits = sliceFraction(rem, width, fractionalDigits);
          const intArg = absInt === 0n
            ? (negative ? -0 : 0)
            : absInt <= BigInt(Number.MAX_SAFE_INTEGER)
            ? (negative ? -Number(absInt) : Number(absInt))
            : (negative ? -absInt : absInt);

          if (isNumeric(unitStyle)) {
            if (!digitalParts) {
              digitalParts = [];
              items.push(digitalParts);
            }
            else {
              this.#timeSep ??= getTimeSeparator(locale, numberingSystem);
              digitalParts.push({ type: 'literal', value: this.#timeSep });
            }
            const nf = new Intl.NumberFormat(locale, {
              numberingSystem,
              useGrouping: false,
              minimumIntegerDigits: unitStyle === '2-digit' ? 2 : 1,
            });
            digitalParts.push(...tagParts(nf.formatToParts(intArg), unit));
            digitalParts.push(...formatFractionParts(locale, numberingSystem, fracDigits, unit));
          }
          else {
            digitalParts = null;
            const nf = new Intl.NumberFormat(locale, {
              numberingSystem,
              style: 'unit',
              unit,
              unitDisplay: unitStyle,
              minimumFractionDigits: fracDigits.length,
              maximumFractionDigits: fracDigits.length,
            });
            const combined = fracDigits
              ? Number(`${negative ? '-' : ''}${absInt}.${fracDigits}`)
              : intArg;
            items.push(tagParts(nf.formatToParts(combined), unit));
          }
        }
        break;
      }

      const raw = values[field];
      // keep zero minutes between displayed hours and seconds so digital output reads 1:00:05 instead of 1:05
      const hasSubseconds = opts.milliseconds === 'numeric'
        && (values.milliseconds !== 0 || values.microseconds !== 0 || values.nanoseconds !== 0);
      const forceMinutes = field === 'minutes'
        && digitalParts !== null
        && (values.seconds !== 0 || hasSubseconds || opts.secondsDisplay === 'always');

      if (raw === 0 && display !== 'always' && !forceMinutes) {
        continue;
      }

      const negative = !signDisplayed;
      signDisplayed = true;
      const value = raw === 0 ? (negative ? -0 : 0) : (negative ? -Math.abs(raw) : Math.abs(raw));

      if (isNumeric(unitStyle)) {
        if (!digitalParts) {
          digitalParts = [];
          items.push(digitalParts);
        }
        else {
          this.#timeSep ??= getTimeSeparator(locale, numberingSystem);
          digitalParts.push({ type: 'literal', value: this.#timeSep });
        }
        const nf = new Intl.NumberFormat(locale, {
          numberingSystem,
          useGrouping: false,
          minimumIntegerDigits: unitStyle === '2-digit' ? 2 : 1,
        });
        digitalParts.push(...tagParts(nf.formatToParts(value), unit));
      }
      else {
        digitalParts = null;
        const nf = new Intl.NumberFormat(locale, {
          numberingSystem,
          style: 'unit',
          unit,
          unitDisplay: unitStyle,
        });
        items.push(tagParts(nf.formatToParts(value), unit));
      }
    }

    if (items.length === 0) { return []; }
    if (items.length === 1) { return items[0]; }

    const listStyle = style === 'digital' ? 'short' : style;
    const listParts = new Intl.ListFormat(locale, { type: 'unit', style: listStyle })
      .formatToParts(items.map((_, idx) => String(idx)));
    const result = [];
    let itemIndex = 0;
    for (const part of listParts) {
      if (part.type === 'element') {
        result.push(...items[itemIndex++]);
      }
      else {
        result.push({ type: 'literal', value: part.value });
      }
    }
    return result;
  }

  format(duration) {
    return this.formatToParts(duration).map((part) => part.value).join('');
  }
}

Object.defineProperty(DurationFormat.prototype, Symbol.toStringTag, {
  value: 'Intl.DurationFormat',
  configurable: true,
});

export function installDurationFormat() {
  if (typeof Intl.DurationFormat === 'undefined') {
    Object.defineProperty(Intl, 'DurationFormat', {
      value: DurationFormat,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
}
