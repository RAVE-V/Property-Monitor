import { useState, useEffect } from 'react';

export function useIsochrones(center: [number, number] | null, minutes: number) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!center) {
      setData(null);
      return;
    }

    const fetchIsochrone = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, call OpenRouteService API
        // For now, return a mock circle-polygon around the center
        const [lng, lat] = center;
        const radius = minutes * 0.005; // approx conversion for mock
        
        setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [lng - radius, lat - radius],
              [lng + radius, lat - radius],
              [lng + radius, lat + radius],
              [lng - radius, lat + radius],
              [lng - radius, lat - radius],
            ]]
          },
          properties: { minutes }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIsochrone();
  }, [center?.[0], center?.[1], minutes]);

  return { data, isLoading };
}
