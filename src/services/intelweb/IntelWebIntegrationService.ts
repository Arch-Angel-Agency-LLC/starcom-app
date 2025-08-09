// IntelWebIntegrationService
// Bridges Intel/IntelReportData → VirtualFileSystem/DataPack + GraphData for IntelWeb

import { IntelReportData } from '../../models/IntelReportData';
import { DataPack, VirtualFileSystem, DataPackRelationship, VirtualFile, VirtualDirectory } from '../../types/DataPack';
import { IntelNode, IntelEdge } from '../../applications/intelweb/components/Graph/IntelGraph';

export interface BuildResult {
  vfs: VirtualFileSystem;
  graph: { nodes: IntelNode[]; edges: IntelEdge[] };
  dataPack?: DataPack;
  warnings?: string[];
}

// Helper utilities
// Removed classification constants/utilities for OSINT

function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function shortId(id?: string): string {
  if (!id) return Math.random().toString(36).slice(2, 8);
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || Math.random().toString(36).slice(2, 8);
}

function normalizeConfidence(value?: number): number {
  if (value == null || isNaN(value)) return 0.6;
  const v = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, v));
}

function iso(ts: number | string | Date | undefined): string | undefined {
  if (ts == null) return undefined;
  try {
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  } catch {
    return undefined;
  }
}

function deterministicFileId(path: string, fm: any): string {
  // Use path segments + primary identifier fields to ensure stability
  // e.g., reports/{slug}.md already stable; here we can just return path.
  return path; // Placeholder (path already deterministic after slugify + shortId stable input)
}

export class IntelWebIntegrationService {
  // Convert reports to a VFS and GraphData (minimal viable implementation)
  async buildFromReports(reports: IntelReportData[]): Promise<BuildResult> {
    const warnings: string[] = [];

    // Initialize VFS skeleton
    const nowISO = new Date().toISOString();
    const root: VirtualDirectory = { path: '', name: 'root', children: ['reports/', 'entities/', 'locations/'], files: [], createdAt: nowISO, modifiedAt: nowISO };
    const dirReports: VirtualDirectory = { path: 'reports/', name: 'reports', children: [], files: [], createdAt: nowISO, modifiedAt: nowISO };
    const dirEntities: VirtualDirectory = { path: 'entities/', name: 'entities', children: [], files: [], createdAt: nowISO, modifiedAt: nowISO };
    const dirLocations: VirtualDirectory = { path: 'locations/', name: 'locations', children: [], files: [], createdAt: nowISO, modifiedAt: nowISO };

    const fileIndex = new Map<string, VirtualFile>();
    const directoryIndex = new Map<string, VirtualDirectory>([
      [root.path, root],
      [dirReports.path, dirReports],
      [dirEntities.path, dirEntities],
      [dirLocations.path, dirLocations]
    ]);

    const relationshipGraph: DataPackRelationship[] = [];

    // Registries to resolve wikilinks
    const entityPathByName = new Map<string, string>();
    const locationPathByCoord = new Map<string, string>();

    // First pass: create report and entity files
    for (const report of reports) {
      const title = report.title || 'Untitled Report';
      const rSlug = `${slugify(title)}-${shortId(report.id)}`;
      const reportPath = `reports/${rSlug}.md`;
      const confidence = normalizeConfidence(report.confidence);
      const coords =
        typeof report.latitude === 'number' && typeof report.longitude === 'number'
          ? [report.latitude, report.longitude]
          : undefined;

      const entityNames: string[] = [];
      // Entities may be objects or strings; map to names
      const entities = (report as any).entities as any[] | undefined;
      if (Array.isArray(entities)) {
        for (const e of entities) {
          const name = typeof e === 'string' ? e : e?.name ?? e?.title;
          if (name && !entityNames.includes(name)) entityNames.push(String(name));
        }
      }

      // Ensure entity files exist
      for (const name of entityNames) {
        if (!entityPathByName.has(name)) {
          const ePath = `entities/${slugify(name)}-${shortId(name)}.md`;
          const eFile: VirtualFile = {
            path: ePath,
            name: ePath.split('/').pop() || `${slugify(name)}.md`,
            extension: 'md',
            size: 0,
            mimeType: 'text/markdown',
            encoding: 'utf-8',
            hash: '',
            createdAt: nowISO,
            modifiedAt: nowISO,
            content: `---\nconfidence: 0.75\ntype: entity\ntags: [entity]\n---\n\n# ${name}\n\n`,
            frontmatter: {
              confidence: 0.75,
              type: 'entity',
              tags: ['entity']
            },
            relationships: []
          };
          fileIndex.set(ePath, eFile);
          dirEntities.files.push(ePath);
          entityPathByName.set(name, ePath);
        }
      }

      // Optional location node
      let locationPath: string | undefined;
      if (coords) {
        const key = `${coords[0].toFixed(5)}_${coords[1].toFixed(5)}`;
        locationPath = locationPathByCoord.get(key);
        if (!locationPath) {
          locationPath = `locations/${key}.md`;
          const lFile: VirtualFile = {
            path: locationPath,
            name: `${key}.md`,
            extension: 'md',
            size: 0,
            mimeType: 'text/markdown',
            encoding: 'utf-8',
            hash: '',
            createdAt: nowISO,
            modifiedAt: nowISO,
            content: `---\nconfidence: 1\ntype: location\ncoordinates: [${coords[0]}, ${coords[1]}]\n---\n\n# Location ${key}\n`,
            frontmatter: {
              confidence: 1,
              type: 'location',
              coordinates: [coords[0], coords[1]]
            },
            relationships: []
          };
          fileIndex.set(locationPath, lFile);
          dirLocations.files.push(locationPath);
          locationPathByCoord.set(key, locationPath);
        }
      }

      // Build report content with wikilinks
      const wikilinksBlock = entityNames.length ? '## Entities\n- ' + entityNames.map(n => `[[${n}]]`).join('\n- ') : undefined;

      // Aggregate tags from tags + categories
      const tagSet = new Set<string>();
      if (Array.isArray(report.tags)) report.tags.forEach(t => tagSet.add(t));
      if (Array.isArray(report.categories)) report.categories.forEach(c => tagSet.add(c));
      const tags = Array.from(tagSet);

      const reportFrontmatter = {
        confidence,
        type: 'report',
        coordinates: coords,
        tags,
        entities: entityNames,
        sources: Array.isArray(report.sources) ? report.sources : [],
        timestamp: iso(report.timestamp),
        author: report.author
      } as Record<string, unknown>;

      const reportBody = [
        `---`,
        `confidence: ${confidence}`,
        `type: report`,
        coords ? `coordinates: [${coords[0]}, ${coords[1]}]` : undefined,
        `tags: [${tags.join(', ')}]`,
        entityNames.length ? `entities: [${entityNames.join(', ')}]` : undefined,
        reportFrontmatter.timestamp ? `timestamp: ${reportFrontmatter.timestamp}` : undefined,
        reportFrontmatter.author ? `author: ${reportFrontmatter.author}` : undefined,
        `---`,
        '',
        `# ${title}`,
        '',
        report.summary ? '## Executive Summary\n' + report.summary : undefined,
        wikilinksBlock,
        report.content ? '## Content\n' + report.content : undefined
      ].filter(Boolean).join('\n');

      const rFile: VirtualFile = {
        path: reportPath,
        name: `${rSlug}.md`,
        extension: 'md',
        size: reportBody.length,
        mimeType: 'text/markdown',
        encoding: 'utf-8',
        hash: '',
        createdAt: nowISO,
        modifiedAt: nowISO,
        content: reportBody,
        frontmatter: reportFrontmatter,
        relationships: []
      };

      fileIndex.set(reportPath, rFile);
      dirReports.files.push(reportPath);

      // Relationships: report → entities (predicate: mentions)
      for (const name of entityNames) {
        const ePath = entityPathByName.get(name);
        if (ePath) {
          relationshipGraph.push({
            source: reportPath,
            target: ePath,
            type: 'wikilink',
            strength: 0.6,
            metadata: {
              predicate: 'mentions',
              provenance: {
                source: 'IntelWebIntegrationService',
                reportId: report.id || rSlug,
                reportPath,
                author: report.author,
                timestamp: reportFrontmatter.timestamp || iso(report.timestamp) || nowISO
              }
            }
          });
        }
      }

      // Relationships: entity → location (predicate: located_at)
      if (coords && locationPath) {
        for (const name of entityNames) {
          const ePath = entityPathByName.get(name);
          if (ePath) {
            relationshipGraph.push({
              source: ePath,
              target: locationPath,
              type: 'related',
              strength: 0.7,
              metadata: {
                predicate: 'located_at',
                provenance: {
                  source: 'IntelWebIntegrationService',
                  reportId: report.id || rSlug,
                  reportPath,
                  author: report.author,
                  timestamp: reportFrontmatter.timestamp || iso(report.timestamp) || nowISO
                }
              }
            });
          }
        }
      }

      // Relationship: report → location (predicate: observed_at)
      if (coords && locationPath) {
        relationshipGraph.push({
          source: reportPath,
          target: locationPath,
          type: 'related',
          strength: 0.5,
          metadata: {
            predicate: 'observed_at',
            provenance: {
              source: 'IntelWebIntegrationService',
              reportId: report.id || rSlug,
              reportPath,
              author: report.author,
              timestamp: reportFrontmatter.timestamp || iso(report.timestamp) || nowISO
            }
          }
        });
      }
    }

    const vfs: VirtualFileSystem = {
      root,
      fileIndex,
      directoryIndex,
      relationshipGraph
    };

    // Build GraphData directly from VFS (simple pass)
    const { nodes, edges } = this.toGraphData(vfs);

    return { vfs, graph: { nodes, edges }, warnings };
  }

  // Convert VFS to GraphData compatible with IntelGraph
  private toGraphData(vfs: VirtualFileSystem): { nodes: IntelNode[]; edges: IntelEdge[] } {
    const nodes: IntelNode[] = [];
    const edges: IntelEdge[] = [];

    const nodeById = new Map<string, IntelNode>();

    for (const file of vfs.fileIndex.values()) {
      const fm = (file.frontmatter || {}) as any;
      const type = (fm.type as IntelNode['type']) || 'report';
      const confidence = normalizeConfidence(typeof fm.confidence === 'number' ? fm.confidence : undefined);

      const node: IntelNode = {
        id: deterministicFileId(file.path, fm),
        type,
        confidence,
        title: file.name,
        description: fm.description || '',
        timestamp: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
        location: Array.isArray(fm.coordinates) ? fm.coordinates : undefined,
        tags: Array.isArray(file.hashtags) ? file.hashtags : [],
        metadata: fm,
        color: undefined,
        size: undefined,
        group: type,
        file
      };
      nodes.push(node);
      nodeById.set(node.id, node);
    }

    // Prefer explicit relationshipGraph edges
    for (const rel of vfs.relationshipGraph || []) {
      const sourceId = rel.source;
      const targetId = rel.target;
      if (!nodeById.has(sourceId) || !nodeById.has(targetId)) continue;

      const predicate = (rel.metadata && (rel.metadata as any).predicate) as string | undefined;
      let edgeType: IntelEdge['type'] = 'reference';
      if (predicate === 'located_at' || predicate === 'observed_at') edgeType = 'spatial';
      else if (predicate === 'temporal' || predicate === 'occurred_at') edgeType = 'temporal';
      else edgeType = 'reference';

      const id = `${sourceId}-${targetId}-${predicate || rel.type}`;
      edges.push({
        id,
        source: sourceId,
        target: targetId,
        type: edgeType,
        weight: typeof rel.strength === 'number' ? rel.strength : 0.5,
        confidence: Math.min(nodeById.get(sourceId)!.confidence, nodeById.get(targetId)!.confidence),
        metadata: rel.metadata || {}
      });
    }

    return { nodes, edges };
  }
}
