import { describe, it } from 'node:test';

import { configure, date, datetime, time, use } from '@native-dates/core';
import legacyDate from '@native-dates/core/plugins/legacy-date';
import loose from '@native-dates/core/plugins/loose';
import * as rangesNamespace from '@native-dates/core/plugins/ranges';
import relative from '@native-dates/core/plugins/relative';
import tokens from '@native-dates/core/plugins/tokens';
import zones from '@native-dates/core/plugins/zones';

import { expect } from './helpers/expect.js';

describe('plugin installation dx', () => {
  it('installs bare plugins, namespace imports, arrays, and configured plugin calls', () => {
    expect(() => use('not-a-plugin')).toThrow(/notAPlugin/);

    // array + namespace import + zero-arg call
    use([rangesNamespace, relative()]);
    expect(time('9am').to('5pm').toString()).toBe('09:00:00/17:00:00');
    expect(date('2026-09-06').formatRelative('2026-09-07')).toBe('yesterday');

    // configured plugin calls
    use(zones({ hq: 'Berlin' }), loose({ dayFirst: true }), legacyDate);
    expect(datetime('2026-09-06T12:00Z', 'hq').zone).toBe('Europe/Berlin');
    expect(date('07.09.2026', { loose: true }).toString()).toBe('2026-09-07');
    expect(datetime('2026-09-06T14:30Z').getFullYear()).toBe(2026);
  });

  it('installs plugins inside configure({ plugins }) before reading zoneAliases or zone', () => {
    configure({
      plugins: [tokens, zones],
      zoneAliases: { office: 'Tokyo' },
      zone: 'office',
      locale: 'en-US',
      dayFirst: false,
    });
    // repeat install is idempotent and does not double-wrap format()
    use(tokens, tokens);

    expect(datetime('2026-09-06T00:00Z').format('YYYY-MM-DD HH:mm')).toBe('2026-09-06 09:00');
    expect(datetime('2026-09-06T00:00Z').format('date')).toBe('Sep 6, 2026');
  });
});
