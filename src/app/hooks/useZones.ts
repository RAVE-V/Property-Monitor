import { useState, useEffect } from 'react';

export function useZones(bbox: [number, number, number, number] | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!bbox) return;

    const fetchZones = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/zones?bbox=${bbox.join(',')}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [bbox]);

  return { data, isLoading };
}
