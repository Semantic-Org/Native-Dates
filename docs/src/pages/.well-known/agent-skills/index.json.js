// the Agent Skills discovery index, where `npx skills add <site>` and other installers look for a site's skills
import { createHash } from 'node:crypto';

import { shippedSkills } from '../../../lib/skills.js';

export function GET() {
  const skills = shippedSkills().map(({ skill, description, raw }) => ({
    name: skill,
    type: 'skill-md',
    description,
    // the file /skills/<skill>.md already serves, so the digest is of those bytes
    url: `/skills/${skill}.md`,
    digest: `sha256:${createHash('sha256').update(raw).digest('hex')}`,
  }));
  const index = { $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json', skills };
  return new Response(`${JSON.stringify(index, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
