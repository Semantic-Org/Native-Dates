# External Repository Setup

> status: reference (2026-11-19). Covers GitHub settings, Vercel configuration, DNS, and local HTTPS certificates configured outside git. None of these are required to run tests, size checks, or HTTP docs locally.

## Overview

| Feature | External prerequisites | Workflow / command |
|---|---|---|
| Unit tests, bundle check, formatting, and docs build | None | `.github/workflows/test.yml` |
| PR Bundle Size comparison and sticky comment | None (optional GitHub App for bot identity) | `.github/workflows/bundle-size.yml` + `bundle-size-report.yml` |
| Dedicated bot identity on PR comments | GitHub App + 2 secrets | `SEMANTIC_BUNDLE_BOT_CLIENT_ID`, `SEMANTIC_BUNDLE_BOT_PRIVATE_KEY` |
| Staging and production docs deploys | Vercel project, 2 domains, 3 secrets | `.github/workflows/staging-deploy.yml` and `release-deploy.yml` |
| Local HTTPS docs dev server (`:443`) | Trusted local dev CA | `npm -w docs run cert` (`docs/cert/README.md`) |

Packages are published to npm manually from a maintainer machine. No npm token is stored in GitHub Actions.

## CI Checks (`test.yml`, `bundle-size.yml`, `bundle-size-report.yml`)

`Test` and `Bundle Size` run with a read-only `GITHUB_TOKEN`. Because `pull_request` jobs from forks cannot write PR comments, `bundle-size-report.yml` runs on `workflow_run` from `main` after `Bundle Size` finishes, downloads the numeric `bundle-size-report` JSON artifact without checking out PR code, and updates the sticky comment via `.github/actions/sticky-bot-comment` (see [`tools/ci/bundle/README.md`](../../../tools/ci/bundle/README.md)).

When tachometer benchmarks (`bench/`) land from [`plan/roadmap.md`](../plan/roadmap.md), add `Semantic Performance Bot` (`SEMANTIC_PERF_BOT_CLIENT_ID`, `SEMANTIC_PERF_BOT_PRIVATE_KEY`) alongside `Semantic Bundle Bot`.

## Optional Comment Bots

Installing the organization's GitHub Apps posts sticky comments under dedicated bot identities instead of `github-actions[bot]`:

| GitHub App | Repository / Org Secrets | Used for |
|---|---|---|
| Semantic Bundle Bot | `SEMANTIC_BUNDLE_BOT_CLIENT_ID`, `SEMANTIC_BUNDLE_BOT_PRIVATE_KEY` | Sticky Bundle Size comment |
| Semantic Performance Bot | `SEMANTIC_PERF_BOT_CLIENT_ID`, `SEMANTIC_PERF_BOT_PRIVATE_KEY` | Sticky Bench comment (when `bench/` is enabled) |

1. Grant the GitHub App access to `Semantic-Org/Native-Dates` with `Pull requests: Read and write` permission.
2. Add the secrets under **Repository Settings -> Secrets and variables -> Actions** (or organization secrets). `bundle-size-report.yml` automatically switches from `github-actions` to `Semantic Bundle Bot` when `SEMANTIC_BUNDLE_BOT_CLIENT_ID` is present.

## Vercel Documentation Deploys

GitHub Actions builds the Astro site and deploys prebuilt static artifacts to Vercel (`docs/vercel.json` disables Vercel's built-in Git auto-deploys):

1. **Vercel project:** `nativedates` with **Root Directory** set to `docs`.
2. **Domains:** `nativedates.dev` (production) and `staging.nativedates.dev` (staging), using DNS-only records.
3. **Custom `staging` environment:** Attached to `staging.nativedates.dev` with `SITE_URL=https://staging.nativedates.dev` (drives canonical URLs, OG cards, and non-production `noindex` meta tags). Disable **Vercel Authentication / Deployment Protection** on `staging` so public preview links resolve.
4. **GitHub Actions secrets:**

   | Secret | Value |
   |---|---|
   | `VERCEL_TOKEN` | Vercel access token with deploy access to `nativedates` |
   | `VERCEL_ORG_ID` | Vercel team / organization ID |
   | `VERCEL_NATIVEDATES_PROJECT_ID` | Vercel project ID |

5. **Triggers:** `staging-deploy.yml` deploys on pushes to `main` touching `docs/`, `src/`, or `packages/`; `release-deploy.yml` deploys to `nativedates.dev` on `v*` tags or manual `workflow_dispatch`.
