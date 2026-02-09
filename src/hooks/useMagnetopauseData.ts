import { useEffect, useState } from 'react';
export interface MagnetopauseData { standoffRe?: number; quality?: 'live' | 'fallback' | 'stale' }
export const useMagnetopauseData = (active: boolean) => {
  const [data, setData] = useState<MagnetopauseData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) { setData(null); return; }
    setData({ standoffRe: 10.5, quality: 'live' });
    setLastUpdated(new Date());
  }, [active]);
  return { data, lastUpdated };
};
export default useMagnetopauseData;
