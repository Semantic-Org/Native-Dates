// the skills in ai/skills as /skills/<skill>.md and /llms*.txt serve them
import { skillsFrom } from '../../../tools/skills.js';

import { PACKAGE_DIR } from './sizes.js';

const AUDIENCE_ORDER = ['essentials', 'usage', 'authoring'];

export function shippedSkills() {
  return skillsFrom(PACKAGE_DIR)
    .map(({ name, description, metadata, source, body }) => ({
      skill: name,
      title: metadata.title ?? name,
      description,
      audience: metadata.audience ?? 'usage',
      raw: source,
      body: `${body.replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim()}\n`,
    }))
    .sort((a, b) => {
      const rank = (audience) => {
        const index = AUDIENCE_ORDER.indexOf(audience);
        return index === -1 ? AUDIENCE_ORDER.length : index;
      };
      return rank(a.audience) - rank(b.audience) || a.skill.localeCompare(b.skill);
    });
}
