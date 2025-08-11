import { useEffect, useState } from 'react';
export interface MagneticFieldData { sampleCount?: number }
export const useMagneticFieldData = (active: boolean) => {
  const [data, setData] = useState<MagneticFieldData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) { setData(null); return; }
    setData({ sampleCount: 250 });
    setLastUpdated(new Date());
  }, [active]);
  return { data, lastUpdated };
};
export default useMagneticFieldData;
