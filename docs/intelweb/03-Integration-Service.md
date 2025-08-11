# IntelWebIntegrationService

Purpose
Bridge Intel/IntelReportData into IntelWeb by building:
- VirtualFileSystem (Obsidian-like vault)
- Optional DataPack
- GraphData (nodes/edges)

Responsibilities
- Transform IntelReportData → Markdown + frontmatter + wikilinks
- Generate relationshipGraph and GraphData
- Normalize classification/confidence/timestamps
- Resolve/wikilink entities and related reports

Proposed API
- buildVaultFromReports(reports: IntelReportData[]): Promise<VirtualFileSystem>
- buildGraphFromVault(vfs: VirtualFileSystem): GraphData
- buildDataPack(vfs: VirtualFileSystem, options?): Promise<DataPack>
- fromFusion(intel: Intel[], context): Promise<{ vfs: VirtualFileSystem; graph: GraphData }>

Data contracts (TypeScript)
- Input: IntelReportData[] (src/models/IntelReportData.ts)
- Output: VirtualFileSystem (src/types/DataPack.ts), GraphData (IntelGraph.tsx)

Normalization helpers
- normalizeClassification(x: unknown): ClassificationLevel | 'UNCLASSIFIED'
- normalizeConfidence(x: number | undefined): number // clamp to [0,1]
- toISO(ts: number | string | Date): string
- toSlug(s: string): string
- coordinateValid(lat?: number, lng?: number): boolean

Flow
1) Index pass
   - Build registries: reports, entities, locations
2) Emit files
   - Create markdown files with frontmatter per mapping spec
3) Relationships
   - Compute relationshipGraph edges (entity-of, located-at, related)
4) Wikilinks
   - Insert [[Entity Name]] and [[Related Report]] into bodies
5) GraphData
   - Convert VFS → nodes/edges for IntelGraph

Error handling
- Skip invalid items; collect warnings; return with diagnostics
- Ensure graph references only existing file paths

Performance
- Pure in-memory transforms; avoid heavy I/O
- Optionally stream large inputs in batches

