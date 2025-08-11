import { useEffect, useState } from 'react';
export interface SolarWindData { speed?: number; density?: number; bz?: number }
export const useSolarWindData = (active: boolean) => {
  const [data, setData] = useState<SolarWindData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) { setData(null); return; }
    setData({ speed: 420, density: 6, bz: -2 });
    setLastUpdated(new Date());
  }, [active]);
  return { data, lastUpdated };
};
export default useSolarWindData;
