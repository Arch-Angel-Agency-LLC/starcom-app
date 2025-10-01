import { IntelReportData } from '../../types/IntelWorkspace';
import { deriveSummary } from './adapters/reportMappers';
import { IntelItemUI, CreateIntelItemInput } from '../../types/intel/IntelItemUI';

// Storage Keys (legacy + new)
const LEGACY_KEY = 'intel-reports'; // very first dashboard key
const INTERMEDIATE_REPORTS_KEY = 'intelWorkspace.reports'; // Phase 1 refactor key
const MIGRATION_FLAG = 'intelWorkspace.migrated';
const WORKSPACE_KEY_V1 = 'intelWorkspace.v1';

interface WorkspaceStateV1 {
  version: 1;
  reports: IntelReportData[];
  intel: IntelItemInternal[];
  packages: any[];
  metadata?: {
    createdAt: string;
    upgradedFrom?: 'legacy' | 'intermediate';
  };
}

interface IntelItemInternal {
  id: string;
  frontmatter: {
    title: string;
    type: string;
    classification: string;
    source: string;
    reliability: string;
    confidence: number;
    timestamp: number;
    collectedAt: string;
    tags: string[];
    categories: string[];
    latitude?: number;
    longitude?: number;
    verified: boolean;
    version?: number;
    history?: { timestamp: string; action: string; user?: string; changes?: string[] }[];
  };
  content: string;
  createdAt: string;
  modifiedAt: string;
}

export class IntelWorkspaceManager {
  private state: WorkspaceStateV1 | null = null;
  private listeners = new Set<() => void>();
  private initializing = false;

  private notify() { this.listeners.forEach(l => l()); }

  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  private loadState(): WorkspaceStateV1 | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(WORKSPACE_KEY_V1);
    if (!raw) return null;
    try { return JSON.parse(raw) as WorkspaceStateV1; } catch { return null; }
  }

  private saveState() {
    if (typeof window === 'undefined' || !this.state) return;
    localStorage.setItem(WORKSPACE_KEY_V1, JSON.stringify(this.state));
  }

  async ensureInitialized(): Promise<void> {
    if (this.state || this.initializing) return;
    this.initializing = true;
    try {
      // 1. Existing workspace?
      const existing = this.loadState();
      if (existing) { this.state = existing; return; }

      // 2. Intermediate reports key from Phase 1?
      const intermediateRaw = localStorage.getItem(INTERMEDIATE_REPORTS_KEY);
      if (intermediateRaw) {
        try {
          const reports = JSON.parse(intermediateRaw) as IntelReportData[];
          this.state = {
            version: 1,
            reports,
            intel: [],
            packages: [],
            metadata: { createdAt: new Date().toISOString(), upgradedFrom: 'intermediate' }
          };
          this.saveState();
          return;
        } catch {/* fallthrough */}
      }

      // 3. Legacy migration (original localStorage structure)
      const migrated = localStorage.getItem(MIGRATION_FLAG);
      if (!migrated) {
        const legacyRaw = localStorage.getItem(LEGACY_KEY);
        if (legacyRaw) {
          try {
            const legacy = JSON.parse(legacyRaw) as any[];
            const nowISO = new Date().toISOString();
            const reports: IntelReportData[] = legacy.map(item => {
              const id: string = item.id || `intel-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
              const createdAt = new Date(item.createdAt || nowISO).toISOString();
              const updatedAt = new Date(item.updatedAt || createdAt).toISOString();
              const summary = deriveSummary(item.content || '');
              return {
                id,
                title: item.title || 'Untitled',
                type: 'INTEL_REPORT',
                summary,
                content: item.content || '',
                conclusions: [],
                recommendations: [],
                analysisType: 'GENERAL',
                methodology: [],
                confidence: 0.5,
                priority: 'ROUTINE',
                sourceIntel: [],
                author: item.author || 'unknown',
                contributors: [],
                createdAt,
                modifiedAt: updatedAt,
                targetAudience: [],
                distributionRestrictions: [],
                relatedReports: [],
                metadata: {
                  status: item.status || 'DRAFT',
                  categories: item.category ? [item.category] : [],
                  tags: item.tags || [],
                  geo: (item.latitude && item.longitude) ? { lat: item.latitude, lon: item.longitude } : undefined
                }
              } as IntelReportData;
            });
            this.state = {
              version: 1,
              reports,
              intel: [],
              packages: [],
              metadata: { createdAt: nowISO, upgradedFrom: 'legacy' }
            };
            this.saveState();
            localStorage.setItem(MIGRATION_FLAG, 'true');
            return;
          } catch {/* ignore */}
        }
      }

      // 4. Empty new workspace
      this.state = {
        version: 1,
        reports: [],
        intel: [],
        packages: [],
        metadata: { createdAt: new Date().toISOString() }
      };
      this.saveState();
    } finally {
      this.initializing = false;
    }
  }

  private getState(): WorkspaceStateV1 {
    if (!this.state) throw new Error('Workspace not initialized');
    return this.state;
  }

  // REPORT OPERATIONS -------------------------------------------------------
  getReports(): IntelReportData[] { return this.getState().reports.slice(); }

  addReport(report: IntelReportData) {
    const s = this.getState();
    s.reports.push(report);
    this.saveState();
    this.notify();
  }

  updateReport(report: IntelReportData) {
    const s = this.getState();
    const idx = s.reports.findIndex(r => r.id === report.id);
    if (idx !== -1) {
      s.reports[idx] = report;
      this.saveState();
      this.notify();
    }
  }

  removeReport(id: string) {
    const s = this.getState();
    const idx = s.reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      s.reports.splice(idx, 1);
      this.saveState();
      this.notify();
    }
  }

  // INTEL ITEM OPERATIONS ---------------------------------------------------
  getIntelItems(): IntelItemUI[] {
    return this.getState().intel.map(i => this.internalIntelToUI(i));
  }
  getIntelItem(id: string): IntelItemUI | null {
    const found = this.getState().intel.find(i => i.id === id);
    return found ? this.internalIntelToUI(found) : null;
  }

  addIntelItem(input: CreateIntelItemInput): IntelItemUI {
    const now = new Date();
    const id = `intelitem-${now.getTime()}-${Math.random().toString(36).slice(2,6)}`;
    const internal: IntelItemInternal = {
      id,
      frontmatter: {
        title: input.title,
        type: input.type,
        classification: input.classification,
        source: input.source,
        reliability: input.reliability,
        confidence: input.confidence,
        timestamp: now.getTime(),
        collectedAt: now.toISOString(),
        tags: input.tags,
        categories: input.categories,
        latitude: input.latitude,
        longitude: input.longitude,
        verified: input.verified ?? false,
        version: 1,
        history: [{ timestamp: now.toISOString(), action: 'CREATED' as const }]
      },
      content: input.content,
      createdAt: now.toISOString(),
      modifiedAt: now.toISOString()
    };
    const s = this.getState();
    s.intel.push(internal);
    this.saveState();
    this.notify();
    return this.internalIntelToUI(internal);
  }

  updateIntelItem(item: IntelItemUI) {
    const s = this.getState();
    const idx = s.intel.findIndex(i => i.id === item.id);
    if (idx === -1) return;
    const now = new Date();
    const prev = s.intel[idx];
    const prevFront = prev.frontmatter;
    const changes: string[] = [];
    const track = <T extends keyof IntelItemUI>(field: T, before: any, after: any) => {
      if (Array.isArray(before) && Array.isArray(after)) {
        if (before.join('\u0001') !== after.join('\u0001')) changes.push(String(field));
      } else if (before !== after) changes.push(String(field));
    };
    track('title', prevFront.title, item.title);
    track('type', prevFront.type, item.type);
    track('classification', prevFront.classification, item.classification);
    track('reliability', prevFront.reliability, item.reliability);
    track('confidence', prevFront.confidence, item.confidence);
    track('tags', prevFront.tags, item.tags);
    track('categories', prevFront.categories, item.categories);
    track('latitude', prevFront.latitude, item.latitude);
    track('longitude', prevFront.longitude, item.longitude);
    track('verified', prevFront.verified, item.verified);
    track('content', prev.content, item.content);

    s.intel[idx] = {
      ...s.intel[idx],
      frontmatter: {
        ...s.intel[idx].frontmatter,
        title: item.title,
        type: item.type,
        classification: item.classification,
        reliability: item.reliability,
        confidence: item.confidence,
        tags: item.tags,
        categories: item.categories,
        latitude: item.latitude,
        longitude: item.longitude,
        verified: item.verified,
        version: (s.intel[idx].frontmatter.version || 1) + (changes.length ? 1 : 0),
        history: [ ...(s.intel[idx].frontmatter.history || []), { timestamp: now.toISOString(), action: 'UPDATED' as const, changes: changes.length? changes: undefined }]
      },
      content: item.content,
      modifiedAt: now.toISOString()
    };
    this.saveState();
    this.notify();
  }

  private internalIntelToUI(internal: IntelItemInternal): IntelItemUI {
    return {
      id: internal.id,
      title: internal.frontmatter.title,
      type: internal.frontmatter.type,
      classification: internal.frontmatter.classification as any,
      source: internal.frontmatter.source,
      reliability: internal.frontmatter.reliability as any,
      confidence: internal.frontmatter.confidence,
      tags: internal.frontmatter.tags,
      categories: internal.frontmatter.categories,
      latitude: internal.frontmatter.latitude,
      longitude: internal.frontmatter.longitude,
      content: internal.content,
      createdAt: new Date(internal.createdAt),
      updatedAt: new Date(internal.modifiedAt),
      verified: internal.frontmatter.verified,
      version: internal.frontmatter.version,
      history: internal.frontmatter.history as any
    };
  }
}

export const intelWorkspaceManager = new IntelWorkspaceManager();
