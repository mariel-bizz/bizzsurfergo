# BizzSurfer GO

[![Security Scan](../../actions/workflows/security.yml/badge.svg?branch=main)](../../actions/workflows/security.yml)

Built with [Lovable](https://lovable.dev). The `Security Scan` badge above reflects the latest run of `.github/workflows/security.yml` on `main` (dependency audit, CodeQL, Gitleaks, migration safety, SBOM).

## Workflows

- **Security Scan** — runs on every push to `main`, every PR, weekly on Mondays at 06:00 UTC, and on demand via the **Run workflow** button on the [Actions tab](../../actions/workflows/security.yml).

## Reviewing scan output

Open any workflow run from the Actions tab to find:

- **SBOM** — artifact `sbom-cyclonedx-<sha>` (CycloneDX JSON + XML, 90 days)
- **Migration reports** — artifact `migration-reports-<sha>` containing `sqlfluff.txt`, `sqlfluff.json`, and `risky-patterns.txt` (30 days)
- **CodeQL alerts** — repo → Security → Code scanning
