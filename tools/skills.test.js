import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { checkSkill, checkSkills, cleanSkills, packSkills, skillFrom, skillsFrom } from './skills.js';

const root = fileURLToPath(new URL('..', import.meta.url));

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

  it('pack to skills/<name>/SKILL.md byte for byte, and clean removes the folder', () => {
    const packageDir = mkdtempSync(resolve(tmpdir(), 'skills-'));
    try {
      packSkills(packageDir);
      for (const { name, source } of skillsFrom()) {
        expect(readFileSync(resolve(packageDir, 'skills', name, 'SKILL.md'), 'utf8')).toBe(source);
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
  }, 60_000);
});
