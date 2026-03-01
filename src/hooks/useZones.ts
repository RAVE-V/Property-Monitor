import { useState, useEffect } from 'react';

export function useZones(bbox: [number, number, number, number] | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const bboxKey = bbox?.join(',');

  useEffect(() => {
    if (!bboxKey) return;

    const fetchZones = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/zones?bbox=${bboxKey}`);
        if (!response.ok) throw new Error('Failed to fetch zones');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('useZones error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [bboxKey]);

  return { data, isLoading };
}
