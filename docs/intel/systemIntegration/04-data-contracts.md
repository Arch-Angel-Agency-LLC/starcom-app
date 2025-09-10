# Data Contracts (Rules)

- UI dates: Date objects; storage: ISO strings.
- Coordinates: latitude/longitude; adapters accept legacy lat/long.
- Enums: use IntelReportUI definitions for classification/status/priority.
- Extend types only in `src/models/Intel/*` or `src/types/intel/*`.