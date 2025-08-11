import { useEffect, useState } from 'react';
export interface AuroralOvalData { resolution: string }
export const useAuroralOvalData = (active: boolean) => {
  const [data, setData] = useState<AuroralOvalData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) { setData(null); return; }
    setData({ resolution: 'low' });
    setLastUpdated(new Date());
  }, [active]);
  return { data, lastUpdated };
};
export default useAuroralOvalData;
