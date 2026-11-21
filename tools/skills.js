// reads the skills authored in ai/skills and lays them out as skills/<name>/SKILL.md, the folder agent tooling reads from an installed package

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// the only frontmatter keys the Agent Skills format defines, its validator refuses any other
const FORMAT_KEYS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];

const markdownIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) { return markdownIn(path); }
      return entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md' ? [path] : [];
    })
    : [];

export function skillFrom(source, file) {
  const [, front = '', body = source] = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/) ?? [];
  let frontmatter = {};
  try {
    frontmatter = parse(front) ?? {};
  }
  catch {
    // the ai gate reports the YAML error itself, here it reads as a missing name and description
  }
  const { name, description, metadata = {} } = frontmatter;
  return { name, description, metadata, frontmatter, file, source, body };
}

const isStringMap = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
  && Object.values(value).every((entry) => typeof entry === 'string');

export function checkSkill({ name, description, metadata, frontmatter, file }) {
  const findings = [];
  if (typeof name !== 'string' || name.length > 64 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    findings.push('`name` must be 1-64 lowercase letters, digits, and single hyphens');
  }
  else if (name !== basename(file, '.md')) {
    findings.push(`\`name\` is '${name}' but the file is '${basename(file)}'`);
  }
  if (typeof description !== 'string' || !description.trim() || description.length > 1024) {
    findings.push('`description` must be 1-1024 characters');
  }
  if (!isStringMap(metadata)) {
    findings.push('`metadata` must map string keys to string values');
  }
  for (const key of Object.keys(frontmatter)) {
    if (!FORMAT_KEYS.includes(key)) {
      findings.push(`\`${key}\` is not an Agent Skills frontmatter key, move it under \`metadata\``);
    }
  }
  return findings;
}

const readSkills = (resolveDir) =>
  markdownIn(resolve(resolveDir, 'ai/skills')).map((file) => skillFrom(readFileSync(file, 'utf8'), file));

export function checkSkills(resolveDir = root) {
  const skills = readSkills(resolveDir);
  const names = skills.map(({ name }) => name);
  return skills.flatMap((skill, index) => {
    const findings = checkSkill(skill);
    // every skill becomes skills/<name>, so a second one would overwrite the first
    if (!findings.length && names.indexOf(skill.name) !== index) {
      findings.push(`\`name\` '${skill.name}' is already taken`);
    }
    return findings.map((finding) => `${relative(resolveDir, skill.file)}: ${finding}`);
  });
}

// pass an explicit resolveDir when imported by Astro's bundled build pipeline
export function skillsFrom(resolveDir = root) {
  const findings = checkSkills(resolveDir);
  if (findings.length) { throw new Error(`skills outside the Agent Skills format\n${findings.join('\n')}`); }
  return readSkills(resolveDir);
}

// defaults to the package root and never the working directory, since ai/skills is a folder named skills too
export const cleanSkills = (packageDir = root) =>
  rmSync(resolve(packageDir, 'skills'), { recursive: true, force: true });

export function packSkills(packageDir = root) {
  const skills = skillsFrom();
  cleanSkills(packageDir);
  for (const { name, source } of skills) {
    mkdirSync(resolve(packageDir, 'skills', name), { recursive: true });
    writeFileSync(resolve(packageDir, 'skills', name, 'SKILL.md'), source);
  }
}

// quiet on success so `npm pack --json` stays parseable
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [verb] = process.argv.slice(2);
  if (verb === 'pack') { packSkills(); }
  else if (verb === 'clean') { cleanSkills(); }
  else {
    console.error('usage: node tools/skills.js <pack|clean>');
    process.exitCode = 1;
  }
}
