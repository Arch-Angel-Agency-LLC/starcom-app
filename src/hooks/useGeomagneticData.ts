// Placeholder geomagnetic data hook
import { useEffect, useState } from 'react';
export interface GeomagneticData { kp?: number }
export const useGeomagneticData = (active: boolean) => {
  const [data, setData] = useState<GeomagneticData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) { setData(null); return; }
    // mock fetch
    setData({ kp: 3 });
    setLastUpdated(new Date());
  }, [active]);
  return { data, lastUpdated };
};
export default useGeomagneticData;
