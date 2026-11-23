#!/usr/bin/env node
// rebuilds per-push benchmark history from prior PR workflow artifacts using only Node built-ins and gh CLI

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { loadHistoryMetrics, readBaselineSha } from './reporter.js';

const runGh = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function commitTouchesSource(repo, sha) {
  try {
    const raw = runGh(['api', `repos/${repo}/commits/${sha}`, '--jq', '.files[].filename']);
    const files = raw.split('\n').filter(Boolean);
    return files.some((file) => file.startsWith('src/') || file.startsWith('packages/'));
  }
  catch {
    return true;
  }
}

export function fetchPrHistory({ branch, repo, currentRunId = '', maxRuns = 20, outPath = './pr-history.json' }) {
  let runs = [];
  try {
    const raw = runGh([
      'run',
      'list',
      '--repo',
      repo,
      '--workflow=bench.yml',
      '--limit',
      String(maxRuns * 2),
      '--json',
      'databaseId,conclusion,headBranch,headSha,displayTitle,createdAt',
    ]);
    runs = JSON.parse(raw)
      .filter((run) => run.headBranch === branch && run.conclusion === 'success')
      .filter((run) => String(run.databaseId) !== String(currentRunId))
      .slice(0, maxRuns);
  }
  catch {
    runs = [];
  }

  const commits = [];
  for (const run of runs) {
    const dir = mkdtempSync(join(tmpdir(), 'pr-bench-'));
    try {
      runGh(['run', 'download', String(run.databaseId), '--repo', repo, '--pattern', 'bench-results-*', '--dir', dir]);
      const baselineSha = readBaselineSha(dir);
      const metrics = loadHistoryMetrics(dir, baselineSha);
      if (Object.keys(metrics).length === 0) { continue; }
      commits.push({
        sha: run.headSha,
        msg: run.displayTitle,
        timestamp: run.createdAt,
        touches_source: commitTouchesSource(repo, run.headSha),
        metrics,
      });
    }
    catch {
      continue;
    }
    finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  commits.sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
  const history = { schema_version: 2, commits };
  writeFileSync(resolve(outPath), `${JSON.stringify(history, null, 2)}\n`);
  return history;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      branch: { type: 'string' },
      repo: { type: 'string', default: process.env.GITHUB_REPOSITORY ?? '' },
      'current-run-id': { type: 'string', default: '' },
      'max-runs': { type: 'string', default: '20' },
      out: { type: 'string', default: './pr-history.json' },
    },
  });
  if (!values.branch || !values.repo) {
    console.error('fetch-pr-history.js --branch <name> --repo <owner/name> [--current-run-id <id>] [--out <file>]');
    process.exit(2);
  }
  const history = fetchPrHistory({
    branch: values.branch,
    repo: values.repo,
    currentRunId: values['current-run-id'],
    maxRuns: Number(values['max-runs']),
    outPath: values.out,
  });
  console.log(`Wrote ${history.commits.length} prior PR benchmark run(s) to ${values.out}`);
}
