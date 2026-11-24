// verifies lockstep versions, bumps all packages together, and publishes them to npm in dependency order

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { marketplaceFrom } from './skills.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// native-dates publishes first so @native-dates/core's exact version dependency resolves immediately
export const PACKAGES = [
  { name: 'native-dates', dir: '.', scoped: false },
  { name: '@native-dates/core', dir: 'packages/core', scoped: true, exactCoreDep: true },
  { name: '@native-dates/plugins', dir: 'packages/plugins', scoped: true, caretCorePeer: true },
  { name: '@native-dates/polyfill', dir: 'packages/polyfill', scoped: true },
  { name: '@native-dates/setup', dir: 'packages/setup', scoped: true },
];

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const REPO_URL = 'https://github.com/Semantic-Org/Native-Dates';
const SHIPPED_PATH_RE = /^(src\/|types\/|packages\/|ai\/skills\/)/;
const CHANGELOG_HEADING_RE = (version) =>
  new RegExp(`^## v${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\b|\\s|$)`, 'm');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

export function parseSemver(value) {
  if (typeof value !== 'string') { return null; }
  const match = value.match(SEMVER_RE);
  if (!match) { return null; }
  const pre = match[4] ? match[4].split('.') : [];
  if (pre.some((id) => /^0\d+$/.test(id))) { return null; }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre,
    raw: value,
  };
}

export function compareSemver(a, b) {
  const left = typeof a === 'string' ? parseSemver(a) : a;
  const right = typeof b === 'string' ? parseSemver(b) : b;
  if (!left || !right) {
    throw new Error(`invalid semver comparison: '${a}' vs '${b}'`);
  }
  for (const field of ['major', 'minor', 'patch']) {
    if (left[field] !== right[field]) { return left[field] > right[field] ? 1 : -1; }
  }
  if (!left.pre.length && !right.pre.length) { return 0; }
  if (!left.pre.length) { return 1; }
  if (!right.pre.length) { return -1; }
  const limit = Math.max(left.pre.length, right.pre.length);
  for (let i = 0; i < limit; i++) {
    if (i >= left.pre.length) { return -1; }
    if (i >= right.pre.length) { return 1; }
    const l = left.pre[i];
    const r = right.pre[i];
    if (l === r) { continue; }
    const lNum = /^\d+$/.test(l);
    const rNum = /^\d+$/.test(r);
    if (lNum && rNum) { return Number(l) > Number(r) ? 1 : -1; }
    if (lNum !== rNum) { return lNum ? -1 : 1; }
    return l > r ? 1 : -1;
  }
  return 0;
}

export function nextVersion(current, target) {
  const parsed = parseSemver(current);
  if (!parsed) {
    throw new Error(`current package.json version '${current}' is not valid semver`);
  }
  let candidate;
  if (target === 'patch') {
    candidate = parsed.pre.length
      ? `${parsed.major}.${parsed.minor}.${parsed.patch}`
      : `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
  else if (target === 'minor') {
    candidate = `${parsed.major}.${parsed.minor + 1}.0`;
  }
  else if (target === 'major') {
    candidate = `${parsed.major + 1}.0.0`;
  }
  else {
    candidate = target;
  }
  if (!parseSemver(candidate)) {
    throw new Error(`'${target}' is not a valid semver version or bump keyword (patch, minor, major)`);
  }
  if (compareSemver(candidate, current) <= 0) {
    throw new Error(`target version ${candidate} must be greater than current version ${current}`);
  }
  return candidate;
}

export function checkLockstep(dir = root) {
  const findings = [];
  const rootPath = resolve(dir, 'package.json');
  const rootManifest = readJson(rootPath);
  const { version } = rootManifest;

  if (!parseSemver(version)) {
    findings.push(`package.json: version '${version}' is not valid semver`);
  }

  for (const spec of PACKAGES) {
    const manifestPath = resolve(dir, spec.dir, 'package.json');
    const label = spec.dir === '.' ? 'package.json' : `${spec.dir}/package.json`;
    if (!existsSync(manifestPath)) {
      findings.push(`${label}: missing manifest`);
      continue;
    }
    const pkg = readJson(manifestPath);
    if (pkg.name !== spec.name) {
      findings.push(`${label}: expected name '${spec.name}', found '${pkg.name}'`);
    }
    if (pkg.private) {
      findings.push(`${label}: publishable package is marked private`);
    }
    if (pkg.version !== version) {
      findings.push(`${label}: version is '${pkg.version}', expected '${version}'`);
    }
    if (spec.scoped && pkg.publishConfig?.access !== 'public') {
      findings.push(`${label}: scoped package must set publishConfig.access to 'public'`);
    }
    if (spec.exactCoreDep && pkg.dependencies?.['native-dates'] !== version) {
      findings.push(
        `${label}: dependencies['native-dates'] is '${pkg.dependencies?.['native-dates']}', expected '${version}'`,
      );
    }
    if (spec.caretCorePeer && pkg.peerDependencies?.['native-dates'] !== `^${version}`) {
      findings.push(
        `${label}: peerDependencies['native-dates'] is '${pkg.peerDependencies
          ?.['native-dates']}', expected '^${version}'`,
      );
    }
  }

  const docsManifestPath = resolve(dir, 'docs/package.json');
  if (existsSync(docsManifestPath)) {
    const docsManifest = readJson(docsManifestPath);
    if (docsManifest.private !== true) {
      findings.push('docs/package.json: must remain private: true');
    }
  }

  const marketplacePath = resolve(dir, '.claude-plugin/marketplace.json');
  if (!existsSync(marketplacePath)) {
    findings.push('.claude-plugin/marketplace.json: missing file (run `node tools/skills.js stamp`)');
  }
  else {
    const actual = JSON.stringify(readJson(marketplacePath));
    const expected = JSON.stringify(marketplaceFrom(rootManifest));
    if (actual !== expected) {
      findings.push(
        '.claude-plugin/marketplace.json: out of sync with package.json (run `node tools/skills.js stamp`)',
      );
    }
  }

  const lockPath = resolve(dir, 'package-lock.json');
  if (existsSync(lockPath)) {
    const lock = readJson(lockPath);
    if (lock.version !== version) {
      findings.push(`package-lock.json: top-level version is '${lock.version}', expected '${version}'`);
    }
    const lockKeys = ['', 'packages/core', 'packages/plugins', 'packages/polyfill', 'packages/setup'];
    for (const key of lockKeys) {
      const entry = lock.packages?.[key];
      if (entry && entry.version !== version) {
        const label = key || 'root';
        findings.push(`package-lock.json: packages['${label}'] version is '${entry.version}', expected '${version}'`);
      }
    }
  }

  const changelogPath = resolve(dir, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) {
    findings.push('CHANGELOG.md: missing file');
  }
  else if (parseSemver(version) && !CHANGELOG_HEADING_RE(version).test(readFileSync(changelogPath, 'utf8'))) {
    findings.push(`CHANGELOG.md: missing '## v${version}' entry (run \`npm run release:notes -- --write\`)`);
  }

  return { version, findings };
}

export function bumpVersions(target, { dir = root, dryRun = false, syncLockfile = true } = {}) {
  const rootPath = resolve(dir, 'package.json');
  const rootManifest = readJson(rootPath);
  const from = rootManifest.version;
  const to = nextVersion(from, target);
  const files = [];

  for (const spec of PACKAGES) {
    const manifestPath = resolve(dir, spec.dir, 'package.json');
    const rel = spec.dir === '.' ? 'package.json' : `${spec.dir}/package.json`;
    const pkg = readJson(manifestPath);
    pkg.version = to;
    if (spec.exactCoreDep && pkg.dependencies) {
      pkg.dependencies['native-dates'] = to;
    }
    if (spec.caretCorePeer && pkg.peerDependencies) {
      pkg.peerDependencies['native-dates'] = `^${to}`;
    }
    if (!dryRun) { writeJson(manifestPath, pkg); }
    files.push(rel);
  }

  const marketplacePath = resolve(dir, '.claude-plugin/marketplace.json');
  const nextRoot = { ...rootManifest, version: to };
  if (!dryRun) { writeJson(marketplacePath, marketplaceFrom(nextRoot)); }
  files.push('.claude-plugin/marketplace.json');

  if (syncLockfile && existsSync(resolve(dir, 'package-lock.json'))) {
    if (!dryRun) {
      execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd: dir, stdio: 'inherit' });
    }
    files.push('package-lock.json');
  }

  return { from, to, files };
}

const defaultExec = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  return {
    status: result.status ?? 1,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
};

export function checkGitState({
  dir = root,
  version,
  allowDirty = false,
  allowBranch = false,
  checkRemote = true,
  exec = defaultExec,
} = {}) {
  const findings = [];
  const status = exec('git', ['status', '--porcelain'], dir);
  if (status.status !== 0) {
    findings.push(`git status failed: ${status.stderr}`);
    return { branch: null, sha: null, findings };
  }
  if (!allowDirty && status.stdout) {
    findings.push('working tree is dirty: commit or stash changes before publishing');
  }

  const branchRes = exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], dir);
  const branch = branchRes.stdout || null;
  if (!allowBranch && branch !== 'main') {
    findings.push(`current branch is '${branch}', expected 'main' (pass --allow-branch to override)`);
  }

  const shaRes = exec('git', ['rev-parse', '--short', 'HEAD'], dir);
  const sha = shaRes.stdout || null;

  if (checkRemote) {
    const headFull = exec('git', ['rev-parse', 'HEAD'], dir);
    const remoteMain = exec('git', ['ls-remote', '--heads', 'origin', 'refs/heads/main'], dir);
    const remoteSha = remoteMain.status === 0 ? remoteMain.stdout.split(/\s+/)[0] : '';
    if (remoteSha && headFull.stdout && remoteSha !== headFull.stdout && branch === 'main') {
      findings.push(
        `local main (${headFull.stdout.slice(0, 7)}) differs from origin/main (${
          remoteSha.slice(0, 7)
        }): pull or push first`,
      );
    }
  }

  if (version) {
    const tagName = `v${version}`;
    const localTag = exec('git', ['tag', '-l', tagName], dir);
    if (localTag.stdout === tagName) {
      findings.push(`git tag '${tagName}' already exists locally`);
    }
    if (checkRemote) {
      const remoteTag = exec('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tagName}`], dir);
      if (remoteTag.status === 0 && remoteTag.stdout) {
        findings.push(`git tag '${tagName}' already exists on origin`);
      }
    }
  }

  return { branch, sha, findings };
}

export function checkRegistryState({
  dir = root,
  version,
  tag = 'latest',
  resume = false,
  exec = defaultExec,
} = {}) {
  const findings = [];
  const parsed = parseSemver(version);
  if (parsed?.pre.length && tag === 'latest') {
    findings.push(
      `version ${version} is a prerelease: pass an explicit dist-tag like --tag next so it never overwrites 'latest'`,
    );
  }

  const whoami = exec('npm', ['whoami'], dir);
  const user = whoami.status === 0 ? whoami.stdout : null;
  if (!user) {
    findings.push('not logged in to npm (run `npm login` first)');
  }

  const plan = [];
  for (const spec of PACKAGES) {
    const info = exec('npm', ['view', spec.name, 'versions', 'dist-tags', '--json'], dir);
    let versions = [];
    let latest = null;
    if (info.status === 0 && info.stdout) {
      const parsedInfo = JSON.parse(info.stdout);
      const rawVersions = parsedInfo.versions;
      versions = Array.isArray(rawVersions) ? rawVersions : rawVersions ? [rawVersions] : [];
      latest = parsedInfo['dist-tags']?.latest ?? null;
    }
    else if (!/E404|404 Not Found/i.test(`${info.stderr}\n${info.stdout}`)) {
      findings.push(`npm view ${spec.name} failed: ${info.stderr || info.stdout}`);
    }

    const exists = versions.includes(version);
    if (
      !exists && parsed && !parsed.pre.length && tag === 'latest' && latest
      && parseSemver(latest) && compareSemver(version, latest) < 0
    ) {
      findings.push(
        `${spec.name}: ${version} is older than published latest (${latest}): pass an explicit --tag for maintenance releases`,
      );
    }

    plan.push({
      ...spec,
      version,
      tag,
      status: exists ? 'skip' : 'publish',
    });
  }

  const alreadyPublished = plan.filter((entry) => entry.status === 'skip');
  if (alreadyPublished.length === plan.length) {
    findings.push(`all ${plan.length} packages are already published on npm at ${version}`);
  }
  else if (alreadyPublished.length > 0 && !resume) {
    const names = alreadyPublished.map((entry) => entry.name).join(', ');
    findings.push(
      `already published at ${version}: ${names} (pass --resume to publish only the remaining packages)`,
    );
  }

  return { user, plan, findings };
}

export function generateNotes({
  dir = root,
  version,
  fromTag,
  date = new Date().toISOString().slice(0, 10),
  exec = defaultExec,
} = {}) {
  let baseTag = fromTag;
  if (!baseTag) {
    const desc = exec('git', ['describe', '--tags', '--abbrev=0'], dir);
    if (desc.status === 0 && desc.stdout) {
      baseTag = desc.stdout;
    }
  }
  const range = baseTag ? `${baseTag}..HEAD` : 'HEAD';
  const log = exec('git', ['log', '--first-parent', range, '--format=%H\t%s'], dir);
  if (log.status !== 0) {
    throw new Error(`git log failed: ${log.stderr}`);
  }

  const sections = {
    'Breaking Changes': [],
    Features: [],
    Performance: [],
    'Bug Fixes': [],
    'Agent Skills': [],
  };

  for (const line of log.stdout ? log.stdout.split('\n') : []) {
    const tab = line.indexOf('\t');
    if (tab === -1) { continue; }
    const sha = line.slice(0, tab);
    const subject = line.slice(tab + 1);
    const filesRes = exec('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', sha], dir);
    if (filesRes.status !== 0) { continue; }
    const shipped = (filesRes.stdout ? filesRes.stdout.split('\n') : []).filter((f) => SHIPPED_PATH_RE.test(f));
    if (!shipped.length) { continue; }

    const match = subject.match(/^([A-Za-z/]+):\s+(.+?)(?:\s+\(#(\d+)\))?$/);
    if (!match) { continue; }
    const cats = match[1].split('/');
    const desc = match[2];
    const pr = match[3] ? ` ([#${match[3]}](${REPO_URL}/pull/${match[3]}))` : '';

    const scopes = [];
    if (shipped.some((f) => /^(src|types)\//.test(f))) { scopes.push('core'); }
    if (shipped.some((f) => f.startsWith('packages/plugins/'))) { scopes.push('plugins'); }
    if (shipped.some((f) => f.startsWith('packages/polyfill/'))) { scopes.push('polyfill'); }
    if (shipped.some((f) => f.startsWith('packages/setup/'))) { scopes.push('setup'); }
    if (shipped.some((f) => f.startsWith('ai/skills/')) && !scopes.length) { scopes.push('skills'); }
    const badge = scopes.length && !(scopes.length === 1 && scopes[0] === 'core')
      ? `**${scopes.join(', ')}:** `
      : '';
    const entry = `- ${badge}${desc}${pr}`;

    if (cats.includes('BREAKING')) { sections['Breaking Changes'].push(entry); }
    else if (cats.includes('Feat')) { sections.Features.push(entry); }
    else if (cats.includes('Perf')) { sections.Performance.push(entry); }
    else if (cats.includes('Bug')) { sections['Bug Fixes'].push(entry); }
    else if (cats.includes('Docs') && scopes.length === 1 && scopes[0] === 'skills') {
      sections['Agent Skills'].push(entry);
    }
  }

  const body = Object.entries(sections)
    .filter(([, items]) => items.length > 0)
    .map(([heading, items]) => `### ${heading}\n\n${items.join('\n')}`)
    .join('\n\n');

  const markdown = body
    ? `## v${version} (${date})\n\n${body}\n`
    : `## v${version} (${date})\n\nMaintenance release.\n`;
  return { version, fromTag: baseTag ?? null, markdown };
}

export function prependChangelog(section, { dir = root, version, dryRun = false } = {}) {
  const path = resolve(dir, 'CHANGELOG.md');
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '# Changelog\n\n';
  if (version && CHANGELOG_HEADING_RE(version).test(existing)) {
    throw new Error(`CHANGELOG.md already contains an entry for v${version}`);
  }
  const cleanSection = `${section.trimEnd()}\n`;
  const firstRelease = existing.search(/^## v/m);
  const updated = firstRelease === -1
    ? `${existing.trimEnd()}\n\n${cleanSection}`
    : `${existing.slice(0, firstRelease)}${cleanSection}\n${existing.slice(firstRelease)}`;
  if (!dryRun) { writeFileSync(path, updated); }
  return updated;
}

export function extractChangelogSection(version, { dir = root } = {}) {
  const path = resolve(dir, 'CHANGELOG.md');
  if (!existsSync(path)) {
    throw new Error('CHANGELOG.md does not exist');
  }
  const content = readFileSync(path, 'utf8');
  const match = CHANGELOG_HEADING_RE(version).exec(content);
  if (!match) {
    throw new Error(`CHANGELOG.md has no '## v${version}' section`);
  }
  const start = match.index;
  const rest = content.slice(start + match[0].length);
  const next = rest.search(/\n## v/);
  const slice = next === -1 ? content.slice(start) : content.slice(start, start + match[0].length + next);
  return `${slice.trim()}\n`;
}

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const eq = token.indexOf('=');
    if (eq !== -1) {
      flags[token.slice(2, eq)] = token.slice(eq + 1);
    }
    else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if ((key === 'otp' || key === 'tag' || key === 'from') && next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      }
      else {
        flags[key] = true;
      }
    }
  }
  return { command: positional[0], rest: positional.slice(1), flags };
}

const printFindings = (label, findings) => {
  console.error(`${label} failed (${findings.length}):`);
  for (const item of findings) {
    console.error(`  - ${item}`);
  }
};

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  }
  finally {
    rl.close();
  }
}

async function runPublish(flags) {
  const dryRun = Boolean(flags['dry-run']);
  const resume = Boolean(flags.resume);
  const skipChecks = Boolean(flags['skip-checks']);
  const allowDirty = Boolean(flags['allow-dirty']);
  const allowBranch = Boolean(flags['allow-branch']);
  const offline = Boolean(flags.offline);
  const noRelease = Boolean(flags['no-release']);
  const yes = Boolean(flags.yes);
  const tag = typeof flags.tag === 'string' ? flags.tag : 'latest';
  let otp = typeof flags.otp === 'string' ? flags.otp : '';

  if (offline && !dryRun) {
    console.error('--offline can only be used with --dry-run');
    process.exitCode = 1;
    return;
  }
  if (otp && !/^\d{6}$/.test(otp)) {
    console.error(`--otp must be a 6-digit code, got '${otp}'`);
    process.exitCode = 1;
    return;
  }

  const lockstep = checkLockstep(root);
  const { version } = lockstep;
  const git = checkGitState({
    dir: root,
    version,
    allowDirty,
    allowBranch,
    checkRemote: !offline,
  });

  const findings = [...lockstep.findings, ...git.findings];
  let user = '(offline dry-run)';
  let plan = PACKAGES.map((spec) => ({ ...spec, version, tag, status: 'publish' }));

  if (!offline) {
    const registry = checkRegistryState({ dir: root, version, tag, resume });
    user = registry.user;
    plan = registry.plan;
    findings.push(...registry.findings);
    if (!noRelease) {
      const gh = defaultExec('gh', ['auth', 'status'], root);
      if (gh.status !== 0) {
        findings.push(
          'not logged in to GitHub CLI (run `gh auth login`, or pass --no-release to skip tagging and GitHub Release)',
        );
      }
    }
  }

  let releaseNotes = '';
  if (!noRelease && !findings.some((f) => f.startsWith('CHANGELOG.md:'))) {
    releaseNotes = extractChangelogSection(version, { dir: root });
  }

  if (findings.length) {
    printFindings('release preflight', findings);
    process.exitCode = 1;
    return;
  }

  if (!skipChecks) {
    console.log('Running release verification suite...');
    for (const script of ['check', 'types', 'errors', 'comments']) {
      const res = spawnSync('npm', ['run', script], { cwd: root, stdio: 'inherit' });
      if (res.status !== 0) {
        console.error(`verification failed at \`npm run ${script}\``);
        process.exitCode = res.status ?? 1;
        return;
      }
    }
  }

  const isPrerelease = Boolean(parseSemver(version)?.pre.length);
  console.log('');
  console.log(`Publish plan${dryRun ? ' (DRY RUN)' : ''}:`);
  console.log(`  version: ${version}`);
  console.log(`  tag:     ${tag}`);
  console.log(`  git:     ${git.branch} @ ${git.sha}`);
  console.log(`  npm:     ${user}`);
  for (const item of plan) {
    const action = item.status === 'skip' ? 'skip (already on npm)' : 'publish';
    console.log(`  - ${item.name.padEnd(24)} ${item.version}  [${action}]`);
  }
  if (!noRelease) {
    console.log(`  - git tag + push         v${version}`);
    console.log(`  - GitHub Release         v${version}${isPrerelease ? ' (prerelease)' : ''} from CHANGELOG.md`);
  }
  console.log('');

  if (!dryRun && !yes) {
    if (!process.stdin.isTTY) {
      console.error('refusing non-interactive publish without --yes');
      process.exitCode = 1;
      return;
    }
    const confirmation = await ask(
      `Type "${version}" to publish to npm${noRelease ? '' : ' and create GitHub Release'}: `,
    );
    if (confirmation !== version) {
      console.error(`aborted: expected '${version}', received '${confirmation}'`);
      process.exitCode = 1;
      return;
    }
    if (!otp) {
      const entered = await ask('2FA OTP code (leave blank for browser/passkey or token auth): ');
      if (entered) {
        if (!/^\d{6}$/.test(entered)) {
          console.error(`aborted: OTP must be 6 digits, got '${entered}'`);
          process.exitCode = 1;
          return;
        }
        otp = entered;
      }
    }
  }

  const toPublish = plan.filter((item) => item.status === 'publish');
  for (let i = 0; i < toPublish.length; i++) {
    const item = toPublish[i];
    const publishArgs = ['publish', '--tag', tag];
    if (dryRun) { publishArgs.push('--dry-run'); }
    if (otp) { publishArgs.push(`--otp=${otp}`); }
    console.log(
      `\n[${i + 1}/${toPublish.length}] ${
        dryRun ? 'Dry-run publishing' : 'Publishing'
      } ${item.name}@${item.version}...`,
    );
    const res = spawnSync('npm', publishArgs, { cwd: resolve(root, item.dir), stdio: 'inherit' });
    if (res.status !== 0) {
      const remaining = toPublish.slice(i).map((entry) => entry.name).join(', ');
      console.error(`\npublish failed on ${item.name}@${item.version}.`);
      if (i > 0) {
        console.error(`Remaining packages: ${remaining}`);
        console.error('Re-run with: npm run release:publish -- --resume');
      }
      process.exitCode = res.status ?? 1;
      return;
    }
  }

  if (dryRun) {
    if (!noRelease && releaseNotes) {
      console.log(`\n[dry-run] Would tag v${version}, push to origin, and create GitHub Release with notes:\n`);
      process.stdout.write(releaseNotes);
    }
    console.log(`\nDry run passed for all ${toPublish.length} packages at ${version}.`);
    return;
  }

  console.log(`\nPublished all ${toPublish.length} packages at ${version}.`);
  if (noRelease) { return; }

  const tagName = `v${version}`;
  console.log(`\nTagging and pushing ${tagName}...`);
  for (const args of [['tag', '-a', tagName, '-m', tagName], ['push', 'origin', tagName]]) {
    const res = spawnSync('git', args, { cwd: root, stdio: 'inherit' });
    if (res.status !== 0) {
      console.error(`git ${args.join(' ')} failed after npm publish`);
      process.exitCode = res.status ?? 1;
      return;
    }
  }

  console.log(`Creating GitHub Release ${tagName} from CHANGELOG.md...`);
  const ghArgs = ['release', 'create', tagName, '--title', tagName, '--notes-file', '-'];
  if (isPrerelease) { ghArgs.push('--prerelease'); }
  const ghRes = spawnSync('gh', ghArgs, {
    cwd: root,
    input: releaseNotes,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (ghRes.status !== 0) {
    console.error(`gh release create failed. Tag ${tagName} was pushed; re-run manually with:`);
    console.error(
      `  npm run release:notes -- --extract | gh release create ${tagName} --title "${tagName}" --notes-file -`,
    );
    process.exitCode = ghRes.status ?? 1;
    return;
  }
  console.log(`\nReleased ${tagName} (npm + git tag + GitHub Release).`);
}

async function main() {
  const { command, rest, flags } = parseArgs(process.argv.slice(2));

  if (command === 'check') {
    const lockstep = checkLockstep(root);
    const findings = [...lockstep.findings];
    if (flags.strict) {
      const git = checkGitState({
        dir: root,
        version: lockstep.version,
        allowDirty: Boolean(flags['allow-dirty']),
        allowBranch: Boolean(flags['allow-branch']),
        checkRemote: !flags.offline,
      });
      findings.push(...git.findings);
    }
    if (findings.length) {
      printFindings('release check', findings);
      process.exitCode = 1;
      return;
    }
    console.log(`release check ok (${PACKAGES.length} packages locked at ${lockstep.version})`);
    return;
  }

  if (command === 'notes') {
    const { version } = readJson(resolve(root, 'package.json'));
    if (flags.extract) {
      process.stdout.write(extractChangelogSection(version, { dir: root }));
      return;
    }
    const { fromTag, markdown } = generateNotes({
      dir: root,
      version,
      fromTag: typeof flags.from === 'string' ? flags.from : undefined,
    });
    if (flags.write) {
      prependChangelog(markdown, { dir: root, version, dryRun: Boolean(flags['dry-run']) });
      console.log(
        `${flags['dry-run'] ? '[dry-run] Would prepend' : 'Prepended'} v${version} notes${
          fromTag ? ` (since ${fromTag})` : ''
        } into CHANGELOG.md`,
      );
      return;
    }
    process.stdout.write(markdown);
    return;
  }

  if (command === 'bump') {
    const [target] = rest;
    if (!target) {
      console.error('usage: node tools/release.js bump <patch|minor|major|x.y.z> [--dry-run] [--no-notes]');
      process.exitCode = 1;
      return;
    }
    const dryRun = Boolean(flags['dry-run']);
    const result = bumpVersions(target, { dir: root, dryRun });
    console.log(`${dryRun ? '[dry-run] Would bump' : 'Bumped'} ${result.from} -> ${result.to}:`);
    for (const file of result.files) {
      console.log(`  - ${file}`);
    }
    if (!flags['no-notes']) {
      const hasPriorTag = defaultExec('git', ['describe', '--tags', '--abbrev=0'], root).status === 0;
      if (hasPriorTag) {
        const { fromTag, markdown } = generateNotes({ dir: root, version: result.to });
        prependChangelog(markdown, { dir: root, version: result.to, dryRun });
        console.log(
          `${
            dryRun ? '[dry-run] Would prepend' : 'Prepended'
          } v${result.to} notes (since ${fromTag}) into CHANGELOG.md`,
        );
      }
    }
    if (!dryRun) {
      const verified = checkLockstep(root);
      if (verified.findings.length) {
        printFindings('post-bump check', verified.findings);
        process.exitCode = 1;
        return;
      }
      console.log('Next step: review CHANGELOG.md, merge to main, then run `npm run release:publish`.');
    }
    return;
  }

  if (command === 'publish') {
    await runPublish(flags);
    return;
  }

  console.error('usage: node tools/release.js <check|bump|notes|publish> [options]');
  console.error('  check   [--strict] [--allow-dirty] [--allow-branch] [--offline]');
  console.error('  bump    <patch|minor|major|x.y.z> [--dry-run] [--no-notes]');
  console.error('  notes   [--write] [--extract] [--from=<tag>] [--dry-run]');
  console.error('  publish [--dry-run] [--otp=123456] [--tag=latest] [--resume] [--skip-checks] [--no-release]');
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
