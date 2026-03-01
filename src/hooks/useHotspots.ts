import { useState, useEffect } from 'react';

export function useHotspots(bbox: [number, number, number, number] | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const bboxKey = bbox?.join(',');

  useEffect(() => {
    const fetchHotspots = async () => {
      setIsLoading(true);
      try {
        // Load all hotspots globally on init; use bbox only when available
        const url = bboxKey
          ? `/api/hotspots?bbox=${bboxKey}`
          : `/api/hotspots`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch hotspots');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('useHotspots error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotspots();
  }, [bboxKey]);

  return { data, isLoading };
}

