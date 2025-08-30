import { IntelReportUI, CreateIntelReportInput, IntelReportStatus } from '../../types/intel/IntelReportUI';
import { IntelReportData, IntelReportFile } from '../../types/IntelWorkspace';
import { uiToWorkspaceReportData, workspaceFileToUI } from './adapters/reportMappers';
import { intelWorkspaceManager } from './IntelWorkspaceManager';
import { computeChangedFields, nextVersion, makeHistoryEntry } from './reportLifecycle';

export interface IntelReportService {
  listReports(): Promise<IntelReportUI[]>;
  createReport(input: CreateIntelReportInput, author: string): Promise<IntelReportUI>;
  saveReport(report: IntelReportUI): Promise<void>;
  updateStatus(id: string, status: IntelReportUI['status']): Promise<IntelReportUI | null>;
  getReport(id: string): Promise<IntelReportUI | null>;
  migrateLegacyIfNeeded(): Promise<void>;
  onChange(listener: (reports: IntelReportUI[]) => void): () => void;
  deleteReport(id: string): Promise<void>;
  importReport(report: IntelReportUI, opts?: { strategy?: 'newId' | 'overwrite' | 'skip' }): Promise<IntelReportUI | null>;
}

class WorkspaceBackedIntelReportService implements IntelReportService {
  private listeners = new Set<(reports: IntelReportUI[]) => void>();
  private initialized = false;

  private notify(reports: IntelReportUI[]) { this.listeners.forEach(l => l(reports)); }

  private async ensure(): Promise<void> {
    if (!this.initialized) {
      await intelWorkspaceManager.ensureInitialized();
      this.initialized = true;
      // subscribe to workspace changes
      intelWorkspaceManager.subscribe(async () => {
        const list = await this.listReports();
        this.notify(list);
      });
    }
  }

  async migrateLegacyIfNeeded(): Promise<void> {
    // Handled inside workspace manager initialization path.
    await this.ensure();
  }

  private wrapAsFile(data: IntelReportData): IntelReportFile {
    return {
      path: '',
      filename: data.id + '.intelReport',
      extension: '.intelReport',
      reportData: data,
      size: 0,
      createdAt: data.createdAt,
      modifiedAt: data.modifiedAt,
      checksum: ''
    };
  }

  async listReports(): Promise<IntelReportUI[]> {
    await this.ensure();
    return intelWorkspaceManager.getReports().map(d => workspaceFileToUI(this.wrapAsFile(d)));
  }

  async getReport(id: string): Promise<IntelReportUI | null> {
    await this.ensure();
    const found = intelWorkspaceManager.getReports().find(r => r.id === id);
    return found ? workspaceFileToUI(this.wrapAsFile(found)) : null;
  }

  private validTransitions: Record<IntelReportStatus, IntelReportStatus[]> = {
    DRAFT: ['SUBMITTED', 'ARCHIVED'],
    SUBMITTED: ['REVIEWED', 'DRAFT', 'ARCHIVED'],
    REVIEWED: ['APPROVED', 'SUBMITTED', 'ARCHIVED'],
    APPROVED: ['ARCHIVED'],
    ARCHIVED: []
  };

  async createReport(input: CreateIntelReportInput, author: string): Promise<IntelReportUI> {
    await this.ensure();
    const now = new Date();
    const id = `intel-${now.getTime()}`;
    const initial: IntelReportUI = {
      id,
      title: input.title,
      content: input.content,
      author,
      category: input.category,
      tags: input.tags,
      classification: input.classification,
      status: input.status || 'DRAFT',
      createdAt: now,
      updatedAt: now,
      latitude: input.latitude,
      longitude: input.longitude,
      summary: input.summary,
      conclusions: input.conclusions || [],
      recommendations: input.recommendations || [],
      methodology: input.methodology || [],
      confidence: input.confidence,
      priority: input.priority,
      targetAudience: input.targetAudience || [],
      sourceIntelIds: input.sourceIntelIds || [],
      version: 1,
      manualSummary: !!input.summary,
      history: [makeHistoryEntry({ action: 'CREATED', user: author })]
    };
    const data = uiToWorkspaceReportData(initial);
    const meta: any = data.metadata || (data.metadata = {});
    meta.history = initial.history?.map(h => ({ ...h }));
    intelWorkspaceManager.addReport(data);
    return workspaceFileToUI(this.wrapAsFile(data));
  }

  async saveReport(report: IntelReportUI): Promise<void> {
    await this.ensure();
    const existingRaw = intelWorkspaceManager.getReports().find(r => r.id === report.id);
    if (!existingRaw) return;
    const existingUI = workspaceFileToUI(this.wrapAsFile(existingRaw));
    const changes = computeChangedFields(existingUI, report);
    if (changes.length === 0) return; // nothing to do
    const version = nextVersion(existingUI, changes, false);
    const historyEntry = makeHistoryEntry({ action: 'UPDATED', changes });
    const updated: IntelReportUI = {
      ...report,
      updatedAt: new Date(),
      version,
      history: [...(existingUI.history || []), historyEntry]
    };
    intelWorkspaceManager.updateReport(uiToWorkspaceReportData(updated));
  }

  async updateStatus(id: string, status: IntelReportUI['status']): Promise<IntelReportUI | null> {
    await this.ensure();
    const current = intelWorkspaceManager.getReports().find(r => r.id === id);
    if (!current) return null;
    const currentUI = workspaceFileToUI(this.wrapAsFile(current));
    if (currentUI.status === status) return currentUI;
    if (!this.validTransitions[currentUI.status].includes(status)) {
      throw new Error(`Invalid status transition: ${currentUI.status} -> ${status}`);
    }
    (current.metadata as any).status = status;
    current.modifiedAt = new Date().toISOString();
    const meta: any = current.metadata || (current.metadata = {});
    if (!meta.history) meta.history = [];
    const historyEntry = makeHistoryEntry({ action: 'STATUS_CHANGED', fromStatus: currentUI.status, toStatus: status });
    meta.history.push(historyEntry);
    meta.version = nextVersion(currentUI, [], true, status);
    intelWorkspaceManager.updateReport(current);
    return workspaceFileToUI(this.wrapAsFile(current));
  }

  async deleteReport(id: string): Promise<void> {
    await this.ensure();
    intelWorkspaceManager.removeReport(id);
  }

  async importReport(report: IntelReportUI, opts: { strategy?: 'newId' | 'overwrite' | 'skip' } = {}): Promise<IntelReportUI | null> {
    await this.ensure();
    const strategy = opts.strategy || 'newId';
    const existing = intelWorkspaceManager.getReports().find(r => r.id === report.id);
    let toImport: IntelReportUI = { ...report };
    if (existing) {
      if (strategy === 'skip') return null;
      if (strategy === 'newId') {
        toImport = { ...toImport, id: report.id + '-imp-' + Math.random().toString(36).slice(2,8) };
      }
      if (strategy === 'overwrite') {
        // keep same id, proceed
      }
    }
    // Ensure dates are Date objects
    toImport.createdAt = toImport.createdAt instanceof Date ? toImport.createdAt : new Date(toImport.createdAt);
    toImport.updatedAt = new Date();
    if (!toImport.version) toImport.version = 1;
    const historyEntry = makeHistoryEntry({ action: 'IMPORTED', user: 'import', timestamp: new Date().toISOString() });
    toImport.history = [...(toImport.history || []), historyEntry];
    const data = uiToWorkspaceReportData(toImport);
    const meta: any = data.metadata || (data.metadata = {});
    meta.history = toImport.history;
    meta.version = toImport.version;
    if (existing && strategy === 'overwrite') {
      intelWorkspaceManager.updateReport(data);
    } else {
      intelWorkspaceManager.addReport(data);
    }
    return workspaceFileToUI(this.wrapAsFile(data));
  }

  onChange(listener: (reports: IntelReportUI[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const intelReportService: IntelReportService = new WorkspaceBackedIntelReportService();
