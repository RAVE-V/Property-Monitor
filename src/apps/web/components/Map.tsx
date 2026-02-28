import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  onBoundsChange: (bbox: [number, number, number, number]) => void;
  onMarkerClick: (propertyId: string) => void;
  propertiesGeoJSON: any;
}

const Map: React.FC<MapProps> = ({ onBoundsChange, onMarkerClick, propertiesGeoJSON }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Placeholder style
      center: [-0.1276, 51.5074], // London
      zoom: 12,
    });

    // Try to enable WebGPU if available (MapLibre v5+)
    // (Actual API might vary based on final v5 release)
    
    map.current.on('load', () => {
      if (!map.current) return;

      // Add source with clustering
      map.current.addSource('properties', {
        type: 'geojson',
        data: propertiesGeoJSON || { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#51bbd6',
          'circle-radius': 20,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // Cluster count
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Unclustered point (marker)
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // Click event for properties
      map.current.on('click', 'unclustered-point', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (features?.[0]) {
          onMarkerClick(features[0].properties.id);
        }
      });

      // Sync bounds
      map.current.on('moveend', () => {
        const bounds = map.current?.getBounds();
        if (bounds) {
          onBoundsChange([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
          ]);
        }
      });
      
      // Initial bounds update
      const initialBounds = map.current.getBounds();
      onBoundsChange([
        initialBounds.getWest(),
        initialBounds.getSouth(),
        initialBounds.getEast(),
        initialBounds.getNorth()
      ]);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update data when geojson changes
  useEffect(() => {
    if (map.current?.getSource('properties')) {
      (map.current.getSource('properties') as maplibregl.GeoJSONSource).setData(propertiesGeoJSON);
    }
  }, [propertiesGeoJSON]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
};

export default Map;
