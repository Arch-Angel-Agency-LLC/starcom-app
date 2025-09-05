# Data Models (MVP JSON Shapes)

## Event (derived from Report/Intel Item)
```
{
  "id": "evt-...",
  "title": "...",
  "timestamp": "2025-09-05T12:34:56Z",
  "category": "GENERAL|OSINT|...",
  "tags": ["..."],
  "lat": 40.7, "lon": -74.0,   // optional
  "confidence": 0.82,           // 0..1 optional
  "sourceType": "REPORT|INTEL_ITEM",
  "sourceId": "report-...|intelitem-...",
  "entityRefs": ["entity:Acme", "entity:John Doe"]
}
```

## Entity
```
{
  "id": "entity:Acme",
  "label": "Acme Corporation",
  "type": "ORG|PERSON|PLACE|OTHER",
  "aliases": ["Acme Co"],
  "tags": ["..."],
  "confidence": 0.9
}
```

## Filters
```
{
  "time": {"start": "2025-08-01T00:00:00Z", "end": "2025-09-05T00:00:00Z"},
  "status": ["DRAFT", "APPROVED"],
  "type": ["REPORT", "INTEL_ITEM"],
  "tags": ["q3-2025", "analysis"],
  "categories": ["OSINT"],
  "confidence": {"min": 0.5, "max": 1},
  "geo": {"polygon": [[lon,lat], ...]}
}
```

## Board
```
{
  "id": "board-...",
  "name": "SE Region Activity",
  "createdAt": "2025-09-05T12:00:00Z",
  "modifiedAt": "2025-09-05T12:20:00Z",
  "view": "TIMELINE|MAP|GRAPH|TABLE",
  "filters": { /* see Filters */ },
  "selection": {"ids": ["evt-1", "evt-2"], "type": "MIXED"},
  "layout": { "left": {"open": true}, "right": {"width": 380} },
  "notes": "..."
}
```
