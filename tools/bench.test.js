import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

// bench.yml measures with the base branch's bench, so this is the only place a bench file runs before it lands
describe('tools/bench.js --check', () => {
  it('runs every op in bench/ once against this tree and passes each answer check', () => {
    const files = readdirSync(resolve(root, 'bench')).filter((file) => file.endsWith('.js'));
    const output = execFileSync(process.execPath, ['tools/bench.js', '--check'], { cwd: root, encoding: 'utf8' });
    for (const file of files) {
      expect(output).toMatch(new RegExp(`bench/${file}: [1-9]\\d* ops ran and their answers checked`));
    }
  }, 120_000);
});
