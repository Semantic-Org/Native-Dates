import { shippedSkills } from '../../lib/skills.js';

export function getStaticPaths() {
  return shippedSkills().map((entry) => ({
    params: { name: entry.skill },
    props: { skill: entry },
  }));
}

export function GET({ props }) {
  return new Response(props.skill.raw, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}
