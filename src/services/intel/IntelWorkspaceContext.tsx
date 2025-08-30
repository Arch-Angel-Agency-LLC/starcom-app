import React, { createContext, useContext, useEffect, useState } from 'react';
import { intelWorkspaceManager } from './IntelWorkspaceManager';
import { IntelReportUI } from '../../types/intel/IntelReportUI';
import { workspaceFileToUI } from './adapters/reportMappers';
import { IntelReportData, IntelReportFile } from '../../types/IntelWorkspace';
import { IntelItemUI } from '../../types/intel/IntelItemUI';

interface WorkspaceContextValue {
  reports: IntelReportUI[];
  intelItems: IntelItemUI[];
  refresh(): Promise<void>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const IntelWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<IntelReportUI[]>([]);
  const [intelItems, setIntelItems] = useState<IntelItemUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      setLoading(true);
      await intelWorkspaceManager.ensureInitialized();
      const load = () => {
        const reportData: IntelReportData[] = intelWorkspaceManager.getReports();
        const reportUI = reportData.map(d => workspaceFileToUI({
          path: '', filename: d.id + '.intelReport', extension: '.intelReport', reportData: d,
          size: 0, createdAt: d.createdAt, modifiedAt: d.modifiedAt, checksum: ''
        } as IntelReportFile));
        setReports(reportUI);
        setIntelItems(intelWorkspaceManager.getIntelItems());
      };
      load();
      unsub = intelWorkspaceManager.subscribe(load);
      setLoading(false);
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const value: WorkspaceContextValue = {
    reports,
    intelItems,
    refresh: async () => {
      await intelWorkspaceManager.ensureInitialized();
    },
    loading
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useIntelWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useIntelWorkspace must be used within IntelWorkspaceProvider');
  return ctx;
}
