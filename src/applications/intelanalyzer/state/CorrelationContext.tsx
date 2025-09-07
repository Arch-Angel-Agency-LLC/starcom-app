import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useIntelWorkspace } from '../../../services/intel/IntelWorkspaceContext';
import { adaptWorkspaceToEvents } from '../adapters/eventsAdapter';
import { useFilter } from './FilterContext';
import { computeAnomaliesByDay, computeCooccurrence, computeTagCooccurrence, computePlaceClusters, CooccurrencePair, PlaceCluster } from './correlationUtils';

type CorrelationState = {
  anomaliesByDay: Set<string>;
  cooccurrence: CooccurrencePair[];
  tagCooccurrence: CooccurrencePair[];
  placeClusters: PlaceCluster[];
  showClusters: boolean;
  setShowClusters: (on: boolean) => void;
};

const CorrelationContext = createContext<CorrelationState | undefined>(undefined);

export const CorrelationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { reports, intelItems } = useIntelWorkspace();
  const { filters } = useFilter();
  const [showClusters, setShowClusters] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('intelAnalyzer.showClusters');
      return raw ? raw === 'true' : false;
    } catch { return false; }
  });

  const events = useMemo(() => adaptWorkspaceToEvents(reports, intelItems), [reports, intelItems]);

  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (filters.timeRange) {
        const t = new Date(ev.timestamp).getTime();
        const s = filters.timeRange.start.getTime();
        const e = filters.timeRange.end.getTime();
        if (t < s || t > e) return false;
      }
      if (filters.categories?.length && !filters.categories.includes(ev.category)) return false;
      if (filters.entityRefs?.length && !ev.entityRefs?.some(id => filters.entityRefs!.includes(id))) return false;
      return true;
    });
  }, [events, filters]);

  const anomaliesByDay = useMemo(() => computeAnomaliesByDay(filtered), [filtered]);
  const cooccurrence = useMemo(() => computeCooccurrence(filtered), [filtered]);
  const tagCooccurrence = useMemo(() => computeTagCooccurrence(filtered), [filtered]);
  const placeClusters = useMemo(() => computePlaceClusters(filtered, 1), [filtered]);

  useEffect(() => {
    try {
      localStorage.setItem('intelAnalyzer.showClusters', String(showClusters));
  } catch (_e) {
      // non-fatal persistence error
      console.warn('CorrelationContext: failed to persist showClusters');
    }
  }, [showClusters]);

  const value: CorrelationState = { anomaliesByDay, cooccurrence, tagCooccurrence, placeClusters, showClusters, setShowClusters };
  return <CorrelationContext.Provider value={value}>{children}</CorrelationContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCorrelation = () => {
  const ctx = useContext(CorrelationContext);
  if (!ctx) throw new Error('useCorrelation must be used within CorrelationProvider');
  return ctx;
};
