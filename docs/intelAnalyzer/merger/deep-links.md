# Deep Links (URL Schema)

Query parameters (examples):
- `view=timeline|map|graph|table`
- `selected=evt-123,report-9`
- `filters=<base64url-encoded-json>`
- `board=board-abc`

Rules
- On load: parse query → apply filters, set view, restore selection; if `board` present, load board defaults then overlay query filters.
- On change: update query params (debounced) keeping them human-diffable; keep `filters` compact.
- Copy link: button in top bar and inspector.

Stability
- Maintain backward compatibility for 1 minor version; when schema changes, include `ver=2` and a migration step.
