# Intel → IntelWeb Mapping Specification

Purpose
Define how Intel/IntelReportData are converted into an Obsidian-style vault (Markdown + frontmatter + wikilinks) and into GraphData suitable for IntelGraph (2D/3D).

Sources
- IntelReportData (src/models/IntelReportData.ts)
- IntelReport (src/models/Intel/IntelReport.ts)
- Entities/Relationships (src/types/IntelReportArchitecture.ts)
- Fusion output (src/models/Intel/IntelFusion.ts)

Node schema
- id: stable id, prefixed (report:, entity:, location:, event:, source:)
- type: report | entity | location | event | source
- title: from report.title or entity.name
- classification: UNCLASSIFIED | CONFIDENTIAL | SECRET | TOP_SECRET
- confidence: number in [0,1] (normalize if in 0–100)
- timestamp: ISO or epoch → Date
- tags: string[]
- location: [lat, lng] for location nodes; for reports/entities with coords, set metadata.coordinates

Edge schema
- type: reference | entity-of | located-at | temporal | causal | related
- weight: 0..1 (default 0.5; scale by evidence)
- confidence: 0..1 (min(source, target))

Frontmatter (Markdown)
- classification: string
- confidence: number (0..1)
- type: one of node types
- coordinates: [lat, lng] optional
- tags: [...]
- entities: ['Entity Name', ...] for reports
- sources: ['OSINT-..', ...]
- keyFindings: [...]
- relationships: optional structured block if needed

Files and wikilinks
- reports/<slug>.md — links to entities [[Entity Name]] and related reports [[Report Title]]
- entities/<slug>.md — back-links created via graph traverse
- locations/<lat_lng>.md — referenced by [[lat,lng]] or structured relationships
- events/<slug>.md — temporal relationships

Mapping rules
- classification: direct
- confidence: if 0–100 → /100; if undefined → derive from reliability or default 0.6
- tags: merge from report.tags, categories, keyFindings keywords
- entities: emit separate files if not present; link from report
- relationships: populate VirtualFileSystem.relationshipGraph for explicit edges

Validation and coercion
- Ensure confidence ∈ [0,1]
- Only allow known classifications; default UNCLASSIFIED
- Normalize timestamps to ISO for frontmatter, Date for node metadata

Output artifacts
- VFS: VirtualFileSystem with fileIndex, directoryIndex, relationshipGraph
- DataPack (optional): built from VFS
- GraphData: nodes/edges for direct rendering

---

Detailed field mapping
- IntelReportData.title → report file H1 + frontmatter.title (optional)
- IntelReportData.content → markdown body (preserve headings)
- IntelReportData.summary/executiveSummary → frontmatter.summary; also add Summary section
- IntelReportData.tags/categories → frontmatter.tags
- IntelReportData.latitude/longitude → frontmatter.coordinates: [lat, lng]
- IntelReportData.timestamp → frontmatter.timestamp (ISO)
- IntelReportData.author → frontmatter.author
- IntelReportData.classification → frontmatter.classification
- IntelReportData.confidence (0–100) → frontmatter.confidence: confidence/100
- IntelReportData.keyFindings → frontmatter.keyFindings and a Key Findings section
- IntelReportData.recommendations → Recommendations section
- IntelReportData.sources → frontmatter.sources (string IDs)
- IntelReportData.entities → emit entity files and link via wikilinks in report body
- IntelReportData.relationships → relationshipGraph edges (typed); optional inline list in frontmatter

ID and slug rules
- Slugify: lower-kebab; remove non-alphanumerics; collapse dashes
- report:<reportId> → file: reports/<slug(report.title)>-<shortId>.md
- entity:<entityId|slug> → file: entities/<slug(entity.name)>-<shortId>.md
- location: use geo hash or lat_lng rounded to 5 decimals → locations/<lat>_<lng>.md
- Maintain a registry mapping IDs → file paths to resolve wikilinks

Wikilink generation
- Reports link to entities: [[Entity Name]] using entity registry
- Related reports: [[Other Report Title]] if relationships include related/connected
- Locations: either [[lat,lng]] shorthand resolved via registry, or rely on relationshipGraph located-at edges

relationshipGraph emission
- For each report→entity: { source: reportPath, target: entityPath, type: 'reference' | 'entity-of', strength: 0.6 }
- For report→report: type 'related' | 'cites' | 'supports' | 'contradicts' per metadata
- For entity/event→location: type 'located-at'
- Use DataPackRelationship shape with metadata: { createdFrom: 'mapping-v1', sourceIds: [...] }

Type coercion rules
- classification: fallback to UNCLASSIFIED if invalid
- confidence: clamp and normalize; if report.reliability exists (A–F), map to numeric then to [0,1]
- coordinates: drop if missing/invalid; do not create location node

---

Examples

Report (reports/regional-threat-assessment-xyz.md)
```markdown
---
classification: SECRET
confidence: 0.82
type: report
coordinates: [40.7128, -74.006]
tags: [analysis, threat-assessment, q3-2025]
sources: [OSINT, HUMINT]
entities: [Acme Corporation, John Doe]
timestamp: 2025-08-01T12:34:56Z
author: analyst_001
---

# Regional Threat Assessment

## Executive Summary
Summary text...

## Key Findings
- Increased activity near [[Acme Corporation]]
- Coordination with [[John Doe]]

## Recommendations
- Enhance monitoring
```

Entity (entities/acme-corporation-ab12.md)
```markdown
---
classification: CONFIDENTIAL
confidence: 0.75
type: entity
tags: [corporation, target]
---

# Acme Corporation
Overview...
```

Location (locations/40.71280_-74.00600.md)
```markdown
---
classification: UNCLASSIFIED
confidence: 1
type: location
coordinates: [40.7128, -74.006]
---

# New York City (approx)
```

relationshipGraph snippet
```json
[
  {"source":"reports/regional-threat-assessment-xyz.md","target":"entities/acme-corporation-ab12.md","type":"entity-of","strength":0.6},
  {"source":"entities/acme-corporation-ab12.md","target":"locations/40.71280_-74.00600.md","type":"located-at","strength":0.7}
]
```

Validation checklist
- All files have required frontmatter keys: classification, type
- Confidence ∈ [0,1]; timestamps ISO
- Paths are present in registry; wikilinks resolvable
- relationshipGraph edges reference existing file paths

