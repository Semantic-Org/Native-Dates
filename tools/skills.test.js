import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { checkSkill, checkSkills, cleanSkills, marketplaceFrom, packSkills, skillFrom, skillsFrom } from './skills.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const findingsFor = (frontmatter, file = 'ai/skills/sample.md') =>
  checkSkill(skillFrom(`---\n${frontmatter.join('\n')}\n---\n\n# Sample\n`, file));

describe('checkSkill frontmatter', () => {
  it('accepts name, description, and string metadata', () => {
    const findings = findingsFor([
      'name: sample',
      'description: "Use when code needs { loose: true } parsing."',
      'metadata:',
      '  title: Sample Guide',
      '  audience: usage',
    ]);
    expect(findings).toEqual([]);
  });

  it('flags each key the Agent Skills format does not define', () => {
    const findings = findingsFor([
      'name: sample',
      'description: Sample.',
      'title: Sample Guide',
      'skill: sample',
    ]);
    expect(findings).toEqual([expect.stringContaining('`title`'), expect.stringContaining('`skill`')]);
  });

  it('flags a name that differs from the file name, since the name becomes the packed folder', () => {
    const findings = findingsFor(['name: sample', 'description: Sample.'], 'ai/skills/other.md');
    expect(findings).toEqual([expect.stringContaining("'other.md'")]);
  });

  it.each(['Sample', 'sample--guide', '-sample', 's'.repeat(65)])('flags the name %s', (name) => {
    const findings = findingsFor([`name: ${name}`, 'description: Sample.'], `ai/skills/${name}.md`);
    expect(findings).toEqual([expect.stringContaining('`name`')]);
  });

  it('flags a missing description and one over 1024 characters', () => {
    expect(findingsFor(['name: sample'])).toEqual([expect.stringContaining('`description`')]);
    expect(findingsFor(['name: sample', `description: ${'a'.repeat(1025)}`])).toEqual([
      expect.stringContaining('`description`'),
    ]);
  });

  it('flags metadata values that are not strings', () => {
    const findings = findingsFor(['name: sample', 'description: Sample.', 'metadata:', '  keywords: [a, b]']);
    expect(findings).toEqual([expect.stringContaining('`metadata`')]);
  });
});

describe('skills in ai/skills', () => {
  it('all pass the frontmatter check', () => {
    expect(checkSkills()).toEqual([]);
  });

  it('pack to skills/<name>/SKILL.md with only the package version stamped in, and clean removes the folder', () => {
    const packageDir = mkdtempSync(resolve(tmpdir(), 'skills-'));
    try {
      packSkills(packageDir);
      for (const { name, source } of skillsFrom()) {
        const packed = readFileSync(resolve(packageDir, 'skills', name, 'SKILL.md'), 'utf8');
        expect(packed).toContain(`\n  version: "${version}"\n`);
        expect(packed.replace(`  version: "${version}"\n`, '')).toBe(source);
      }
      cleanSkills(packageDir);
      expect(existsSync(resolve(packageDir, 'skills'))).toBe(false);
    }
    finally {
      rmSync(packageDir, { recursive: true, force: true });
    }
  });

  it('ship in the npm tarball as skills/<name>/SKILL.md, with no skills folder left in the repo root', () => {
    const printed = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SKIP_SIMPLE_GIT_HOOKS: '1' },
    });
    const [{ files }] = JSON.parse(printed);
    const shipped = files.map(({ path }) => path).filter((path) => /skills\//.test(path));
    expect(shipped.sort()).toEqual(skillsFrom().map(({ name }) => `skills/${name}/SKILL.md`).sort());
    expect(existsSync(resolve(root, 'skills'))).toBe(false);
    // what each agent's own plugin install reads, written at pack with the version and gone from the repo after
    for (const path of ['plugin.json', '.claude-plugin/plugin.json']) {
      expect(files.map((file) => file.path)).toContain(path);
      expect(existsSync(resolve(root, path))).toBe(false);
    }
  }, 60_000);

  it('are published through a marketplace file that names the npm release of the version in package.json', () => {
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    const published = JSON.parse(readFileSync(resolve(root, '.claude-plugin/marketplace.json'), 'utf8'));
    expect(published).toEqual(marketplaceFrom(manifest));
    expect(published.plugins[0].source).toEqual({ source: 'npm', package: 'native-dates', version });
  });
});
