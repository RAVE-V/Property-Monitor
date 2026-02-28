import { useState, useEffect } from 'react';

export function useProperties(bbox: [number, number, number, number] | null, filters: any) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!bbox) return;

    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          bbox: bbox.join(','),
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)),
        });
        
        const response = await fetch(`/api/properties?${query.toString()}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [bbox, JSON.stringify(filters)]);

  return { data, isLoading, error };
}
