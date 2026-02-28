import { useState, useEffect } from 'react';

export function useHotspots(bbox: [number, number, number, number] | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!bbox) return;

    const fetchHotspots = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/hotspots?bbox=${bbox.join(',')}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotspots();
  }, [bbox]);

  return { data, isLoading };
}
