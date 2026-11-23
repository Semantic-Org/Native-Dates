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

export const parseSourcePrefixes = (raw = '') =>
  String(raw)
    .split(',')
    .map((prefix) => prefix.trim())
    .filter(Boolean);

export const matchesSourcePrefixes = (files, prefixes) =>
  prefixes.length === 0 || files.some((file) => prefixes.some((prefix) => file.startsWith(prefix)));

// filter by branch, fork repository, and PR creation timestamp so reused or cross-fork branch names never collide
export function filterWorkflowRuns(runs, { branch, headRepo = '', createdAt = '', currentRunId = '', maxRuns = 20 }) {
  return runs
    .filter((run) => run.event === 'pull_request' && run.conclusion === 'success')
    .filter((run) => String(run.id) !== String(currentRunId))
    .filter((run) => run.head_branch === branch)
    .filter((run) => !headRepo || run.head_repository?.full_name === headRepo)
    .filter((run) => !createdAt || (run.created_at ?? '') >= createdAt)
    .slice(0, maxRuns);
}

function commitTouchesSource(repo, sha, prefixes) {
  if (prefixes.length === 0) { return true; }
  try {
    const raw = runGh(['api', `repos/${repo}/commits/${sha}`, '--jq', '.files[].filename']);
    const files = raw.split('\n').filter(Boolean);
    return matchesSourcePrefixes(files, prefixes);
  }
  catch {
    return true;
  }
}

export function fetchPrHistory({
  branch,
  repo,
  headRepo = '',
  createdAt = '',
  sourcePrefixes = [],
  currentRunId = '',
  maxRuns = 20,
  outPath = './pr-history.json',
}) {
  let runs = [];
  try {
    const perPage = Math.min(100, Math.max(20, maxRuns * 2));
    const raw = runGh(['api', `repos/${repo}/actions/workflows/bench.yml/runs?event=pull_request&per_page=${perPage}`]);
    const parsed = JSON.parse(raw);
    runs = filterWorkflowRuns(parsed.workflow_runs ?? [], { branch, headRepo, createdAt, currentRunId, maxRuns });
  }
  catch {
    runs = [];
  }

  const commits = [];
  for (const run of runs) {
    const dir = mkdtempSync(join(tmpdir(), 'pr-bench-'));
    try {
      runGh(['run', 'download', String(run.id), '--repo', repo, '--pattern', 'bench-results-*', '--dir', dir]);
      const baselineSha = readBaselineSha(dir);
      const metrics = loadHistoryMetrics(dir, baselineSha);
      if (Object.keys(metrics).length === 0) { continue; }
      commits.push({
        sha: run.head_sha,
        msg: run.display_title,
        timestamp: run.created_at,
        touches_source: commitTouchesSource(repo, run.head_sha, sourcePrefixes),
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
      'head-repo': { type: 'string', default: '' },
      'created-at': { type: 'string', default: '' },
      source: { type: 'string', default: '' },
      repo: { type: 'string', default: process.env.GITHUB_REPOSITORY ?? '' },
      'current-run-id': { type: 'string', default: '' },
      'max-runs': { type: 'string', default: '20' },
      out: { type: 'string', default: './pr-history.json' },
    },
  });
  if (!values.branch || !values.repo) {
    console.error('fetch-pr-history.js --branch <name> --repo <owner/name> [--out <file>]');
    process.exit(2);
  }
  const history = fetchPrHistory({
    branch: values.branch,
    repo: values.repo,
    headRepo: values['head-repo'],
    createdAt: values['created-at'],
    sourcePrefixes: parseSourcePrefixes(values.source),
    currentRunId: values['current-run-id'],
    maxRuns: Number(values['max-runs']),
    outPath: values.out,
  });
  console.log(`Wrote ${history.commits.length} prior PR benchmark run(s) to ${values.out}`);
}
