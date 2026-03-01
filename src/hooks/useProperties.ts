import { useState, useEffect } from 'react';

export function useProperties(filters: any) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== null).map(([k, v]) => [k, String(v)])),
          all: 'true' // Always fetch globally so user can see all UK clusters
        };

        const query = new URLSearchParams(params);
        const response = await fetch(`/api/properties?${query.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error('useProperties error:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [JSON.stringify(filters)]);

  return { data, isLoading, error };
}
