# CI Workflow Specification (MVP)

Purpose: Define GitHub Actions workflow for automated snapshot generation and commit.

## Workflow File
`.github/workflows/content-snapshot.yml` (to be added)

## Triggers
- Scheduled: `cron: "0 * * * *"` (hourly)
- Manual: `workflow_dispatch`

## Job Steps (Proposed)
1. checkout repository
2. setup Node (version from .nvmrc or package engines)
3. install dependencies (npm ci)
4. run unit tests (npm test) — optional gate
5. run snapshot generator script `node scripts/snapshot/generateSnapshot.ts --config scripts/snapshot/config/feeds.json --out public/content-snapshots/latest.json`
6. verify quality gates (generator exit code)
7. diff `public/content-snapshots/latest.json` vs HEAD version
8. if changed: commit + push with message `chore(snapshot): update latest.json (items=X avgConf=Y)`
9. upload artifact (snapshot + logs) for debugging

## Permissions
- `contents: write` needed to push snapshot commit.
- Read-only for others.

## Commit Strategy
- Single file commit if diff.
- Use skip CI token if you want to prevent recursive triggers (e.g., `[skip ci]`).

## Environment Variables
| Name | Purpose |
|------|---------|
| SNAPSHOT_LOG_LEVEL | Adjust verbosity (info default) |
| UPDATE_GOLDEN | Update golden snapshot tests when set to 1 (manual) |

## Caching
(Optional) Use actions/cache for npm modules keyed by package-lock.json hash.

## Failure Handling
- If generator exit code != 0 -> job fails; no commit.
- If gates fail (exit 3) -> job fails; existing snapshot retained.

## Logs
- Upload `snapshot-run.log` artifact.
- Summarize metrics in job summary (markdown): itemCount, avgConfidence, degraded sources.

## Future Enhancements
- IPFS publish step after commit.
- Issue creation if drift alerts present.
- Slack / webhook notification on repeated failures.

---
Add this workflow only after generator script exists. Update this doc if step order changes or additional gates added.
