# CI/CD Security

`security.yml` runs on every push, PR to `main`, and weekly on Mondays.

| Job | Tool | What it checks |
|---|---|---|
| `dependencies` | `bunx audit-ci` | High/critical npm vulnerabilities |
| `codeql` | GitHub CodeQL | Static analysis for JS/TS (security-extended) |
| `secrets` | Gitleaks | Committed API keys, tokens, secrets |
| `migrations` | sqlfluff + custom rules | Supabase SQL migration safety |
| `gate` | — | Fails the PR if any check above failed |

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
