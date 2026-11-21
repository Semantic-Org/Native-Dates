// reads skills from ai/skills/**/*.md for /skills/<skill>.md and /llms*.txt
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { parse } from 'yaml';

import { PACKAGE_DIR } from './sizes.js';

const AUDIENCE_ORDER = ['essentials', 'usage', 'authoring'];

function walkMarkdown(dir) {
  if (!existsSync(dir)) { return []; }
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) { return walkMarkdown(full); }
    return entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md' ? [full] : [];
  });
}

export function shippedSkills() {
  const skillsRoot = resolve(PACKAGE_DIR, 'ai/skills');
  return walkMarkdown(skillsRoot)
    .map((file) => {
      const raw = readFileSync(file, 'utf8');
      const [, front = '', body = raw] = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/) ?? [];
      const data = front ? parse(front) : {};
      const stem = basename(file, '.md');
      const skill = data.skill ?? stem;
      return {
        skill,
        title: data.title ?? skill,
        description: data.description ?? '',
        audience: data.audience ?? 'usage',
        keywords: data.keywords ?? [],
        type: data.type ?? 'skill',
        raw,
        body: `${body.replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim()}\n`,
      };
    })
    .sort((a, b) => {
      const rank = (audience) => {
        const index = AUDIENCE_ORDER.indexOf(audience);
        return index === -1 ? AUDIENCE_ORDER.length : index;
      };
      return rank(a.audience) - rank(b.audience) || a.skill.localeCompare(b.skill);
    });
}
