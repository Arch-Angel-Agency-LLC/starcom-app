# Failure Modes & Handling (MVP)

Purpose: Enumerate known failures with standardized detection and response to keep snapshot generation robust and predictable.

## Classification
| Class | Description | Examples |
|-------|-------------|----------|
| Network | Fetch layer issues | DNS failure, timeout, 5xx |
| Parse | Data format issues | Malformed XML |
| Data Integrity | Missing critical fields | No title/published date |
| Quality Gate | Post-normalization threshold fail | Coverage < 90% |
| System | Unexpected exceptions | Null dereference |
| Config | Invalid or missing config | Bad JSON structure |

## Standard Error Codes
| Code | Class | Meaning | Action |
|------|-------|--------|--------|
| FEED_FETCH_FAILED | Network | Non-2xx HTTP or timeout | Log warn, degrade source |
| FEED_PARSE_ERROR | Parse | XML parse threw error | Log error, degrade source |
| ITEM_MALFORMED | Data Integrity | Item missing required fields | Skip item |
| NO_ITEMS | Data Integrity | Feed returned zero items | Degrade source |
| QUALITY_GATE_FAIL | Quality Gate | Gates after normalization failed | Abort write (exit 3) |
| CONFIG_INVALID | Config | Config unreadable/invalid | Exit 1 |
| VALIDATION_FAIL | Data Integrity | Schema validation failed | Exit 4 |
| UNCAUGHT_EXCEPTION | System | Unhandled runtime error | Exit 5 |

## Handling Matrix
| Failure | Continue? | Degrade Source? | Increment Fail Count? | Abort Snapshot? |
|---------|-----------|-----------------|-----------------------|-----------------|
| Single feed fetch fail | Yes | Yes | Yes | No |
| All feeds fail | N/A | Yes | Yes | Yes (exit 2) |
| Parse error per feed | Yes | Yes | Yes | No (unless all) |
| Item malformed | Yes | No (item-level) | No | No |
| Quality gate fail | N/A | N/A | N/A | Yes (exit 3) |
| Config invalid | N/A | N/A | N/A | Yes (exit 1) |
| Validation fail | N/A | N/A | N/A | Yes (exit 4) |
| Uncaught exception | N/A | N/A | N/A | Yes (exit 5) |

## Logging Requirements
Each failure log MUST include:
```
{ ts, level:'warn'|'error', adapterId?, code, message, data? }
```
- For network errors include status, durationMs.
- For parse errors include truncated snippet length (not full content).

## Retry Strategy (Deferred)
MVP: No automatic retries. Phase 2 could implement limited retry for transient network errors (e.g., ECONNRESET) with exponential backoff.

## Graceful Degradation Rules
- If ≥1 source succeeds and quality gates pass, snapshot is committed even if others degraded.
- Degraded sources appear with `degraded: true` in `sources[]`.

## Abort Conditions Summary
| Condition | Exit Code |
|-----------|-----------|
| All adapters degraded/failed | 2 |
| Quality gates fail | 3 |
| Schema validation fail | 4 |
| Unhandled exception | 5 |

## Post-Failure Actions (Future)
- Open/Update GitHub issue for recurring failures (threshold: same feed failing 3 consecutive runs).
- Attach last failing log snippet as issue body.

## Testing Failure Modes
- Fixture: invalid XML -> FEED_PARSE_ERROR
- Mock: HTTP 500 -> FEED_FETCH_FAILED
- Fixture: items missing title -> ITEM_MALFORMED skip
- Simulate: zero valid items but another adapter succeeds -> commit still occurs.

---
Update this list whenever new error codes introduced to keep uniform handling.
