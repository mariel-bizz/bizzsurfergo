# CI/CD Security

`security.yml` runs on every push, PR to `main`, and weekly on Mondays.

| Job | Tool | What it checks |
|---|---|---|
| `dependencies` | `bunx audit-ci` | High/critical npm vulnerabilities |
| `codeql` | GitHub CodeQL | Static analysis for JS/TS (security-extended) |
| `secrets` | Gitleaks | Committed API keys, tokens, secrets |
| `migrations` | sqlfluff + custom rules | Supabase SQL migration safety |
| `sbom` | CycloneDX npm | Generates SBOM (JSON + XML), uploaded as build artifact |
| `gate` | — | Fails the PR if any check above failed |

## SBOM

Each run produces a CycloneDX 1.5 SBOM (`sbom.cdx.json` + `sbom.cdx.xml`)
listing every npm dependency with version, license, and PURL. Download from
the workflow run page → Artifacts → `sbom-cyclonedx-<sha>` (kept 90 days).
Use it for vulnerability tracking, license review, or feeding tools like
Dependency-Track / Grype.

## Migration safety rules

The `migrations` job blocks merges when a SQL file in `supabase/migrations/`:

- Creates a table without `ENABLE ROW LEVEL SECURITY` in the same migration
- Adds a policy with `USING (true)` or `WITH CHECK (true)`
- Contains `ALTER DATABASE`
- Creates an extension in the `public` schema (use the `extensions` schema)
- Disables RLS
- Grants `ALL` to `PUBLIC` or `anon`

## Required permissions

The workflow needs `security-events: write` (already set) so CodeQL can upload
results to the repo's Security tab. No additional secrets are required —
`GITHUB_TOKEN` is provided automatically.

## Viewing results

- **Code scanning alerts**: repo → Security → Code scanning
- **Secret scan output**: workflow run logs (and Security tab if enabled)
- **Audit / migration findings**: workflow run logs, surfaced as PR annotations

## Local pre-commit (optional)

```bash
bunx audit-ci --high
gitleaks detect --source . --no-banner
sqlfluff lint --dialect postgres supabase/migrations
```
