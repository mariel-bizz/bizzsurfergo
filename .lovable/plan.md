## What's happening

GitHub posts "No jobs were run" against a commit / PR whenever a workflow file matches the event, but every job inside ends up either skipped or filtered out. In our `security.yml` this happens in two realistic scenarios:

1. **Lovable pushes to a branch other than `main`** (preview / sync branches). The workflow has `branches: [main]` on both `push` and `pull_request`, so GitHub still shows the workflow file as "triggered" against the commit checks UI but runs zero jobs.
2. **A PR has no changes under `supabase/migrations/**`**, so the `migrations` job is skipped via `if: hashFiles(...)`. That alone shouldn't produce the message (other jobs still run) — but combined with branch mismatches, every job ends up skipped.

The cleanest fix is to make sure the workflow either runs real jobs or doesn't get registered as a run at all.

## Plan

Edit `.github/workflows/security.yml` with three small changes:

1. **Add `workflow_dispatch`** so the workflow can always be run manually without a trigger surprise.
2. **Broaden the push/PR triggers** so syncs from Lovable still produce real runs:
   - Keep `push.branches: [main]` (production scans).
   - Add `pull_request:` without a `branches` filter so any PR targeting any branch runs the scans.
3. **Move the `migrations` skip from job-level `if:` to a step-level guard.** The job itself always runs (so GitHub never reports "no jobs"), but the risky-pattern check no-ops when there are no migration files. Update the `gate` job's `needs` accordingly (it already tolerates `skipped`, but with this change `migrations` will always be `success`).

Optionally (only if the user wants belt-and-braces):

4. **Add a tiny `noop` job** with `runs-on: ubuntu-latest` and a single `echo` step that has no `if:`. This guarantees at least one job runs on every trigger, killing the "No jobs were run" message permanently regardless of future edits.

## Technical details

Concrete YAML changes:

```text
on:
  push:
    branches: [main]
  pull_request:        # remove "branches: [main]" so all PRs run
  schedule:
    - cron: "0 6 * * 1"
  workflow_dispatch:   # new

jobs:
  migrations:
    name: Migration safety
    runs-on: ubuntu-latest
    # remove: if: hashFiles('supabase/migrations/**/*.sql') != ''
    steps:
      - uses: actions/checkout@v4
      - name: Skip if no migrations
        id: check
        run: |
          if ls supabase/migrations/*.sql >/dev/null 2>&1; then
            echo "has_migrations=true" >> "$GITHUB_OUTPUT"
          else
            echo "has_migrations=false" >> "$GITHUB_OUTPUT"
          fi
      - name: Set up Python
        if: steps.check.outputs.has_migrations == 'true'
        uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      # …existing sqlfluff + risky-pattern steps gated by the same if
```

Everything else (dependencies, codeql, secrets, sbom, gate) stays the same.

## Outcome

- Lovable sync commits to non-main branches no longer create empty workflow runs (PRs against any branch trigger the real jobs; pushes to non-main are simply not registered as runs at all).
- The `migrations` job always reports `success`, so the "No jobs were run" notification stops.
- You can still run the full scan manually from the Actions tab via `workflow_dispatch`.