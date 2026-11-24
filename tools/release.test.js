import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  bumpVersions,
  checkGitState,
  checkLockstep,
  checkRegistryState,
  compareSemver,
  extractChangelogSection,
  generateNotes,
  nextVersion,
  PACKAGES,
  parseArgs,
  parseSemver,
  prependChangelog,
} from './release.js';
import { marketplaceFrom } from './skills.js';

const writeJson = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

const dirs = [];
const makeRepo = (version = '1.0.0') => {
  const dir = mkdtempSync(resolve(tmpdir(), 'native-dates-release-'));
  dirs.push(dir);
  const rootManifest = {
    name: 'native-dates',
    version,
    description: 'Natural-language dates',
    author: 'Jack Lukic',
  };
  writeJson(resolve(dir, 'package.json'), rootManifest);
  writeJson(resolve(dir, 'packages/core/package.json'), {
    name: '@native-dates/core',
    version,
    publishConfig: { access: 'public' },
    dependencies: { 'native-dates': version },
  });
  writeJson(resolve(dir, 'packages/plugins/package.json'), {
    name: '@native-dates/plugins',
    version,
    publishConfig: { access: 'public' },
    peerDependencies: { 'native-dates': `^${version}` },
  });
  writeJson(resolve(dir, 'packages/polyfill/package.json'), {
    name: '@native-dates/polyfill',
    version,
    publishConfig: { access: 'public' },
  });
  writeJson(resolve(dir, 'packages/setup/package.json'), {
    name: '@native-dates/setup',
    version,
    publishConfig: { access: 'public' },
  });
  writeJson(resolve(dir, 'docs/package.json'), {
    name: 'native-dates-docs',
    version: '0.0.0',
    private: true,
  });
  writeJson(resolve(dir, '.claude-plugin/marketplace.json'), marketplaceFrom(rootManifest));
  writeJson(resolve(dir, 'package-lock.json'), {
    name: 'native-dates',
    version,
    packages: {
      '': { name: 'native-dates', version },
      'packages/core': { name: '@native-dates/core', version },
      'packages/plugins': { name: '@native-dates/plugins', version },
      'packages/polyfill': { name: '@native-dates/polyfill', version },
      'packages/setup': { name: '@native-dates/setup', version },
    },
  });
  writeFileSync(resolve(dir, 'CHANGELOG.md'), `# Changelog\n\n## v${version} (2026-11-23)\n\nInitial release.\n`);
  return dir;
};

afterEach(() => {
  while (dirs.length) {
    rmSync(dirs.pop(), { recursive: true, force: true });
  }
});

describe('semver helpers', () => {
  it('parses valid semver and rejects invalid forms', () => {
    expect(parseSemver('1.0.0')).toEqual({ major: 1, minor: 0, patch: 0, pre: [], raw: '1.0.0' });
    expect(parseSemver('1.2.3-rc.1')).toEqual({ major: 1, minor: 2, patch: 3, pre: ['rc', '1'], raw: '1.2.3-rc.1' });
    expect(parseSemver('v1.0.0')).toBeNull();
    expect(parseSemver('1.0')).toBeNull();
    expect(parseSemver('01.0.0')).toBeNull();
    expect(parseSemver('1.0.0-01')).toBeNull();
  });

  it('compares release and prerelease versions in semver order', () => {
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
    expect(compareSemver('1.0.0-rc.1', '1.0.0')).toBe(-1);
    expect(compareSemver('1.0.0-rc.2', '1.0.0-rc.10')).toBe(-1);
    expect(compareSemver('1.0.0-beta.1', '1.0.0-alpha.9')).toBe(1);
  });

  it('computes patch, minor, major, and explicit bumps while rejecting downgrades', () => {
    expect(nextVersion('1.0.0', 'patch')).toBe('1.0.1');
    expect(nextVersion('1.0.0', 'minor')).toBe('1.1.0');
    expect(nextVersion('1.0.0', 'major')).toBe('2.0.0');
    expect(nextVersion('1.0.0-rc.1', 'patch')).toBe('1.0.0');
    expect(nextVersion('1.0.0', '1.2.0-beta.1')).toBe('1.2.0-beta.1');
    expect(() => nextVersion('1.0.0', '1.0.0')).toThrow();
    expect(() => nextVersion('1.0.0', '0.9.9')).toThrow();
    expect(() => nextVersion('1.0.0', 'banana')).toThrow();
  });
});

describe('checkLockstep', () => {
  it('passes on the real repository checkout', () => {
    const result = checkLockstep();
    expect(result.findings).toEqual([]);
  });

  it('flags mismatched workspace versions, core dep, plugins peerDep, access, marketplace, and lockfile', () => {
    const dir = makeRepo('1.0.0');
    writeJson(resolve(dir, 'packages/core/package.json'), {
      name: '@native-dates/core',
      version: '1.0.1',
      dependencies: { 'native-dates': '0.9.0' },
    });
    writeJson(resolve(dir, 'packages/plugins/package.json'), {
      name: '@native-dates/plugins',
      version: '1.0.0',
      publishConfig: { access: 'public' },
      peerDependencies: { 'native-dates': '^0.9.0' },
    });
    writeJson(resolve(dir, '.claude-plugin/marketplace.json'), { name: 'native-dates', plugins: [] });
    writeJson(resolve(dir, 'docs/package.json'), { name: 'native-dates-docs', private: false });
    writeJson(resolve(dir, 'package-lock.json'), {
      name: 'native-dates',
      version: '0.9.0',
      packages: { '': { name: 'native-dates', version: '0.9.0' } },
    });
    writeFileSync(resolve(dir, 'CHANGELOG.md'), '# Changelog\n\n## v0.9.0 (2026-11-01)\n\nOld.\n');

    const { findings } = checkLockstep(dir);
    expect(findings.some((f) => f.includes('packages/core/package.json: version'))).toBe(true);
    expect(findings.some((f) => f.includes('publishConfig.access'))).toBe(true);
    expect(findings.some((f) => f.includes("dependencies['native-dates']"))).toBe(true);
    expect(findings.some((f) => f.includes("peerDependencies['native-dates']"))).toBe(true);
    expect(findings.some((f) => f.includes('marketplace.json'))).toBe(true);
    expect(findings.some((f) => f.includes('docs/package.json'))).toBe(true);
    expect(findings.some((f) => f.includes('package-lock.json: top-level version'))).toBe(true);
    expect(findings.some((f) => f.includes("CHANGELOG.md: missing '## v1.0.0'"))).toBe(true);
  });
});

describe('bumpVersions', () => {
  it('updates all 5 packages and marketplace.json in lockstep', () => {
    const dir = makeRepo('1.0.0');
    const result = bumpVersions('minor', { dir, syncLockfile: false });
    expect(result).toEqual({
      from: '1.0.0',
      to: '1.1.0',
      files: [
        'package.json',
        'packages/core/package.json',
        'packages/plugins/package.json',
        'packages/polyfill/package.json',
        'packages/setup/package.json',
        '.claude-plugin/marketplace.json',
      ],
    });
    expect(JSON.parse(readFileSync(resolve(dir, 'packages/core/package.json'), 'utf8')).dependencies['native-dates'])
      .toBe('1.1.0');
    expect(
      JSON.parse(readFileSync(resolve(dir, 'packages/plugins/package.json'), 'utf8')).peerDependencies['native-dates'],
    ).toBe('^1.1.0');
    expect(JSON.parse(readFileSync(resolve(dir, '.claude-plugin/marketplace.json'), 'utf8')).plugins[0].version).toBe(
      '1.1.0',
    );
  });

  it('writes nothing during --dry-run', () => {
    const dir = makeRepo('1.0.0');
    bumpVersions('patch', { dir, dryRun: true, syncLockfile: false });
    expect(JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')).version).toBe('1.0.0');
  });
});

describe('checkGitState', () => {
  it('blocks dirty tree, non-main branch, diverged origin/main, and existing tags', () => {
    const fakeExec = (cmd, args) => {
      const key = `${cmd} ${args.join(' ')}`;
      if (key === 'git status --porcelain') { return { status: 0, stdout: ' M src/index.js', stderr: '' }; }
      if (key === 'git rev-parse --abbrev-ref HEAD') { return { status: 0, stdout: 'feat/foo', stderr: '' }; }
      if (key === 'git rev-parse --short HEAD') { return { status: 0, stdout: 'abc1234', stderr: '' }; }
      if (key === 'git rev-parse HEAD') { return { status: 0, stdout: 'abc1234567890', stderr: '' }; }
      if (key.startsWith('git ls-remote --heads')) {
        return { status: 0, stdout: 'def9999567890\trefs/heads/main', stderr: '' };
      }
      if (key === 'git tag -l v1.0.0') { return { status: 0, stdout: 'v1.0.0', stderr: '' }; }
      if (key.startsWith('git ls-remote --tags')) { return { status: 0, stdout: 'abc\trefs/tags/v1.0.0', stderr: '' }; }
      return { status: 0, stdout: '', stderr: '' };
    };
    const { findings } = checkGitState({ version: '1.0.0', exec: fakeExec });
    expect(findings.some((f) => f.includes('working tree is dirty'))).toBe(true);
    expect(findings.some((f) => f.includes("expected 'main'"))).toBe(true);
    expect(findings.some((f) => f.includes('already exists locally'))).toBe(true);
    expect(findings.some((f) => f.includes('already exists on origin'))).toBe(true);
  });
});

describe('checkRegistryState', () => {
  it('allows first-time 1.0.0 publish when npm returns E404', () => {
    const fakeExec = (cmd, args) => {
      if (args[0] === 'whoami') { return { status: 0, stdout: 'jlukic', stderr: '' }; }
      return { status: 1, stdout: '', stderr: 'npm error code E404' };
    };
    const { user, plan, findings } = checkRegistryState({ version: '1.0.0', exec: fakeExec });
    expect(user).toBe('jlukic');
    expect(findings).toEqual([]);
    expect(plan.map((p) => [p.name, p.status])).toEqual(PACKAGES.map((p) => [p.name, 'publish']));
  });

  it('refuses publishing a prerelease to latest', () => {
    const fakeExec = (cmd, args) =>
      args[0] === 'whoami'
        ? { status: 0, stdout: 'jlukic', stderr: '' }
        : { status: 1, stdout: '', stderr: 'E404' };
    const { findings } = checkRegistryState({ version: '1.0.0-rc.1', tag: 'latest', exec: fakeExec });
    expect(findings.some((f) => f.includes('prerelease'))).toBe(true);
  });

  it('blocks partial re-publish without --resume and skips published packages with --resume', () => {
    const fakeExec = (cmd, args) => {
      if (args[0] === 'whoami') { return { status: 0, stdout: 'jlukic', stderr: '' }; }
      if (args[1] === 'native-dates') {
        return {
          status: 0,
          stdout: JSON.stringify({ versions: ['1.0.0'], 'dist-tags': { latest: '1.0.0' } }),
          stderr: '',
        };
      }
      return { status: 1, stdout: '', stderr: 'E404' };
    };
    const blocked = checkRegistryState({ version: '1.0.0', exec: fakeExec });
    expect(blocked.findings.some((f) => f.includes('--resume'))).toBe(true);

    const resumed = checkRegistryState({ version: '1.0.0', resume: true, exec: fakeExec });
    expect(resumed.findings).toEqual([]);
    expect(resumed.plan[0].status).toBe('skip');
    expect(resumed.plan.slice(1).every((p) => p.status === 'publish')).toBe(true);
  });

  it('blocks overwriting a newer latest version with an older release on latest tag', () => {
    const fakeExec = (cmd, args) => {
      if (args[0] === 'whoami') { return { status: 0, stdout: 'jlukic', stderr: '' }; }
      return {
        status: 0,
        stdout: JSON.stringify({ versions: ['1.1.0'], 'dist-tags': { latest: '1.1.0' } }),
        stderr: '',
      };
    };
    const { findings } = checkRegistryState({ version: '1.0.5', tag: 'latest', exec: fakeExec });
    expect(findings.some((f) => f.includes('older than published latest'))).toBe(true);
  });
});

describe('parseArgs', () => {
  it('parses subcommand, positional args, boolean flags, and value flags', () => {
    expect(parseArgs(['publish', '--dry-run', '--otp', '123456', '--tag=next'])).toEqual({
      command: 'publish',
      rest: [],
      flags: { 'dry-run': true, otp: '123456', tag: 'next' },
    });
  });
});

describe('changelog notes', () => {
  it('filters to shipped package paths, scopes non-core changes, and links PRs', () => {
    const commits = [
      'aaa\tPerf: Speed Up ISO Parsing (#84)',
      'bbb\tBug: Loose Parsing of Locale Dates (#75)',
      'ccc\tFeat: Add Homepage Globe (#55)',
      'ddd\tDocs: Tighten Core Skill (#82)',
      'eee\tFeat: Support New Agent (#91)',
    ].join('\n');
    const filesBySha = {
      aaa: 'src/date-time.js\nsrc/helpers/parse.js',
      bbb: 'packages/plugins/src/loose.js\ndocs/src/content/docs/plugins/loose.md',
      ccc: 'docs/src/views/Home.astro',
      ddd: 'ai/skills/native-dates.md',
      eee: 'packages/setup/bin/setup.js',
    };
    const fakeExec = (cmd, args) => {
      if (args[0] === 'describe') { return { status: 0, stdout: 'v1.0.0', stderr: '' }; }
      if (args[0] === 'log') { return { status: 0, stdout: commits, stderr: '' }; }
      if (args[0] === 'diff-tree') { return { status: 0, stdout: filesBySha[args.at(-1)] ?? '', stderr: '' }; }
      return { status: 0, stdout: '', stderr: '' };
    };
    const { fromTag, markdown } = generateNotes({ version: '1.0.1', date: '2026-11-30', exec: fakeExec });
    expect(fromTag).toBe('v1.0.0');
    expect(markdown).toContain('## v1.0.1 (2026-11-30)');
    expect(markdown).toContain(
      '### Features\n\n- **setup:** Support New Agent ([#91](https://github.com/Semantic-Org/Native-Dates/pull/91))',
    );
    expect(markdown).toContain(
      '### Performance\n\n- Speed Up ISO Parsing ([#84](https://github.com/Semantic-Org/Native-Dates/pull/84))',
    );
    expect(markdown).toContain(
      '### Bug Fixes\n\n- **plugins:** Loose Parsing of Locale Dates ([#75](https://github.com/Semantic-Org/Native-Dates/pull/75))',
    );
    expect(markdown).toContain(
      '### Agent Skills\n\n- **skills:** Tighten Core Skill ([#82](https://github.com/Semantic-Org/Native-Dates/pull/82))',
    );
    expect(markdown).not.toContain('Homepage Globe');
  });

  it('prepends new sections above prior releases, refuses duplicates, and extracts sections', () => {
    const dir = makeRepo('1.0.0');
    const section = '## v1.0.1 (2026-11-30)\n\n### Bug Fixes\n\n- Fix DST edge case\n';
    prependChangelog(section, { dir, version: '1.0.1' });

    const content = readFileSync(resolve(dir, 'CHANGELOG.md'), 'utf8');
    expect(content.indexOf('## v1.0.1')).toBeLessThan(content.indexOf('## v1.0.0'));
    expect(() => prependChangelog(section, { dir, version: '1.0.1' })).toThrow(/already contains/);

    const extracted = extractChangelogSection('1.0.1', { dir });
    expect(extracted).toBe('## v1.0.1 (2026-11-30)\n\n### Bug Fixes\n\n- Fix DST edge case\n');
    expect(extractChangelogSection('1.0.0', { dir })).toContain('Initial release.');
  });
});
