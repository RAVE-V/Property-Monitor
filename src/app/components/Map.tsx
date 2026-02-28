import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  onBoundsChange: (bbox: [number, number, number, number]) => void;
  onMarkerClick: (propertyId: string) => void;
  propertiesGeoJSON: any;
  hotspotsGeoJSON?: any;
  zonesGeoJSON?: any;
  hubsGeoJSON?: any;
  isochroneGeoJSON?: any;
  hotspotOpacity?: number;
}

const Map: React.FC<MapProps> = ({ 
  onBoundsChange, onMarkerClick, propertiesGeoJSON, 
  hotspotsGeoJSON, zonesGeoJSON, hubsGeoJSON, 
  isochroneGeoJSON, hotspotOpacity = 0.7 
}) => {
  // ... useEffect setup ...

    map.current.on('load', () => {
      // ... previous sources ...

      map.current.addSource('hubs', {
        type: 'geojson',
        data: hubsGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      map.current.addSource('isochrone', {
        type: 'geojson',
        data: isochroneGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      // --- New Layers ---

      // 1. Isochrone (Travel-time area)
      map.current.addLayer({
        id: 'isochrone-fill',
        type: 'fill',
        source: 'isochrone',
        paint: {
          'fill-color': '#228be6',
          'fill-opacity': 0.15,
          'fill-outline-color': '#1c7ed6'
        }
      }, 'article-4-zones');

      // 2. Demand Hubs (Glowing Circles)
      map.current.addLayer({
        id: 'demand-hubs',
        type: 'circle',
        source: 'hubs',
        paint: {
          'circle-color': '#4c6ef5',
          'circle-radius': 10,
          'circle-blur': 0.5,
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // ... previous layers ...
    });

  // Update Hubs/Isochrone Sources
  useEffect(() => {
    if (map.current?.getSource('hubs')) {
      (map.current.getSource('hubs') as maplibregl.GeoJSONSource).setData(hubsGeoJSON);
    }
  }, [hubsGeoJSON]);

  useEffect(() => {
    if (map.current?.getSource('isochrone')) {
      (map.current.getSource('isochrone') as maplibregl.GeoJSONSource).setData(isochroneGeoJSON);
    }
  }, [isochroneGeoJSON]);

      // 3. Properties (Existing)
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

      // Events
      map.current.on('click', 'unclustered-point', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (features?.[0]) {
          onMarkerClick(features[0].properties.id);
        }
      });

      map.current.on('moveend', () => {
        const bounds = map.current?.getBounds();
        if (bounds) {
          onBoundsChange([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
        }
      });
      
      const initialBounds = map.current.getBounds();
      onBoundsChange([initialBounds.getWest(), initialBounds.getSouth(), initialBounds.getEast(), initialBounds.getNorth()]);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update Sources
  useEffect(() => {
    if (map.current?.getSource('properties')) {
      (map.current.getSource('properties') as maplibregl.GeoJSONSource).setData(propertiesGeoJSON);
    }
  }, [propertiesGeoJSON]);

  useEffect(() => {
    if (map.current?.getSource('hotspots')) {
      (map.current.getSource('hotspots') as maplibregl.GeoJSONSource).setData(hotspotsGeoJSON);
    }
  }, [hotspotsGeoJSON]);

  useEffect(() => {
    if (map.current?.getSource('zones')) {
      (map.current.getSource('zones') as maplibregl.GeoJSONSource).setData(zonesGeoJSON);
    }
  }, [zonesGeoJSON]);

  useEffect(() => {
    if (map.current?.getLayer('sa-hotspots')) {
      map.current.setPaintProperty('sa-hotspots', 'heatmap-opacity', hotspotOpacity);
    }
  }, [hotspotOpacity]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
