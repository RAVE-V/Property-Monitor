// @ts-nocheck
'use client';
import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
// @ts-expect-error TypeScript doesn't know about CSS files
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  onBoundsChange: (bbox: [number, number, number, number]) => void;
  onMarkerClick: (propertyId: string) => void;
  onClusterClick?: () => void;
  propertiesGeoJSON: any;
  hotspotsGeoJSON?: any;
  zonesGeoJSON?: any;
  hubsGeoJSON?: any;
  isochroneGeoJSON?: any;
  hotspotOpacity?: number;
  showC5Zones?: boolean;
  selectedProperty?: any;
}

const Map: React.FC<MapProps> = ({
  onBoundsChange, onMarkerClick, onClusterClick, propertiesGeoJSON,
  hotspotsGeoJSON, zonesGeoJSON, hubsGeoJSON,
  isochroneGeoJSON, hotspotOpacity = 0.7, showC5Zones = false,
  selectedProperty
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-1.5, 53.5], // Centered purely on England/Scotland/Wales
      zoom: 6, // Default view
      maxBounds: [[-8.5, 49.8], [2.0, 59.0]], // Loosened bounds to allow full UK zoom out
      maxZoom: 18,
      minZoom: 4 // Allow zooming out further
    });

    map.current.on('load', () => {
      // Sources
      map.current!.addSource('properties', {
        type: 'geojson',
        data: propertiesGeoJSON || { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 10,   // Uncluster at zoom 10 so individual pins show early
        clusterRadius: 35
      });

      // Airbnb occupancy heatmap — separate source from the cyan property hotspots
      map.current!.addSource('airbnb-heatmap', {
        type: 'geojson',
        data: hotspotsGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      map.current!.addSource('hotspots', {
        type: 'geojson',
        data: hotspotsGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      map.current!.addSource('zones', {
        type: 'geojson',
        data: zonesGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      map.current!.addSource('hubs', {
        type: 'geojson',
        data: hubsGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      map.current!.addSource('isochrone', {
        type: 'geojson',
        data: isochroneGeoJSON || { type: 'FeatureCollection', features: [] }
      });

      // Layers

      // 1. Isochrone (Travel-time area)
      map.current!.addLayer({
        id: 'isochrone-fill',
        type: 'fill',
        source: 'isochrone',
        paint: {
          'fill-color': '#00f2ff',
          'fill-opacity': 0.1,
          'fill-outline-color': '#00f2ff'
        }
      });

      // 2. Zones (Article 4 - Non C5)
      map.current!.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        filter: ['!=', ['get', 'zoneType'], 'C5'],
        paint: {
          'fill-color': '#ff3e3e',
          'fill-opacity': 0.2,
          'fill-outline-color': '#ff3e3e'
        }
      });

      // 2b. Zones (C5)
      map.current!.addLayer({
        id: 'c5-zones-fill',
        type: 'fill',
        source: 'zones',
        filter: ['==', ['get', 'zoneType'], 'C5'],
        layout: {
          visibility: showC5Zones ? 'visible' : 'none'
        },
        paint: {
          'fill-color': '#a855f7',
          'fill-opacity': 0.3,
          'fill-outline-color': '#a855f7'
        }
      });

      // 3. Airbnb / VRBO Occupancy Heatmap (warm red, wavy, covers whole map)
      map.current!.addLayer({
        id: 'airbnb-hotspots',
        type: 'heatmap',
        source: 'airbnb-heatmap',
        paint: {
          // Weight by occupancy intensity (0-1)
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'intensity'],
            0, 0,
            1, 1
          ],
          // Radius grows with zoom for a soft, wavy feel
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 30,
            7, 60,
            10, 90,
            13, 120
          ],
          // Light red/coral gradient — transparent at 0, rich red at peak
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(255, 80, 80, 0)',
            0.15, 'rgba(255, 100, 80, 0.15)',
            0.35, 'rgba(255, 80,  60, 0.30)',
            0.55, 'rgba(255, 60,  40, 0.50)',
            0.75, 'rgba(240, 40,  20, 0.65)',
            1, 'rgba(220, 20,   0, 0.80)'
          ],
          'heatmap-opacity': hotspotOpacity,
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.6,
            10, 1.5
          ]
        }
      });

      // Legacy cyan hotspot overlay (keep as subtle layer at low opacity)
      map.current!.addLayer({
        id: 'sa-hotspots',
        type: 'heatmap',
        source: 'hotspots',
        paint: {
          'heatmap-opacity': hotspotOpacity * 0.35,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,242,255,0)',
            0.5, 'rgba(0,242,255,0.15)',
            1, 'rgba(0,242,255,0.25)'
          ]
        }
      });

      // 4. Demand Hubs (Glowing Circles)
      map.current!.addLayer({
        id: 'demand-hubs',
        type: 'circle',
        source: 'hubs',
        paint: {
          'circle-color': '#00f2ff',
          'circle-radius': 12,
          'circle-blur': 0.8,
          'circle-opacity': 0.6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // 5. Properties (Clusters)
      map.current!.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#00f2ff', // Brand cyan
          'circle-radius': [
            'step', ['get', 'point_count'],
            15, 10,
            20, 50,
            25
          ],
          'circle-opacity': 0.6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // 4b. Cluster Property Counts
      map.current!.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // 5. Individual Properties (Uniform Color)
      map.current!.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#00f2ff', // Uniform brand cyan for all pins
          'circle-radius': 6,
          'circle-stroke-width': [
            'case',
            ['get', 'isTiredLandlord'], 3,
            1
          ],
          'circle-stroke-color': [
            'case',
            ['get', 'isTiredLandlord'], '#ffcc00',
            '#ffffff'
          ],
          'circle-stroke-opacity': 0.8,
          'circle-opacity': 0.8
        }
      });

      // 6. Highlighted Selected Property
      map.current!.addLayer({
        id: 'selected-point-highlight',
        type: 'circle',
        source: 'properties',
        filter: ['==', ['get', 'id'], ''], // Initially empty filter
        paint: {
          'circle-color': '#ffffff',
          'circle-radius': 12,
          'circle-opacity': 1,
          'circle-stroke-width': 4,
          'circle-stroke-color': '#00f2ff', // Neon cyan ring
        }
      });

      // 7. Pulse Effect for Selected Property
      map.current!.addLayer({
        id: 'selected-point-pulse',
        type: 'circle',
        source: 'properties',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-color': '#00f2ff',
          'circle-radius': 25,
          'circle-opacity': 0.3,
          'circle-blur': 1
        }
      });

      // 8. Highlight Nearby Amenities (Proxy: high occupancy hotspots near selected point)
      map.current!.addLayer({
        id: 'nearby-amenities-highlight',
        type: 'circle',
        source: 'airbnb-heatmap', // Using the hotspot data as proxy for local demand/shops
        filter: ['==', ['get', 'id'], ''], // Initially empty
        paint: {
          'circle-color': '#f59e0b', // Amber
          'circle-radius': 8,
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // 9. Nearby Amenities Pulse
      map.current!.addLayer({
        id: 'nearby-amenities-pulse',
        type: 'circle',
        source: 'airbnb-heatmap',
        filter: ['==', ['get', 'id'], ''], // Initially empty
        paint: {
          'circle-color': '#f59e0b',
          'circle-radius': 20,
          'circle-opacity': 0.4,
          'circle-blur': 1
        }
      });

      // Hover cursor
      map.current!.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      // Events — Cluster click: zoom into cluster and trigger telemetry
      map.current!.on('click', 'clusters', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features || features.length === 0) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = map.current?.getSource('properties') as maplibregl.GeoJSONSource;
        if (source && clusterId !== undefined) {
          source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
            const coords = (features[0].geometry as any).coordinates;
            map.current?.flyTo({
              center: coords,
              zoom: Math.min(zoom, 15),
              duration: 1200,
              essential: true
            });
            // Notify parent to open telemetry
            if (onClusterClick) onClusterClick();
          });
        }
      });

      // Cursor for clusters
      map.current!.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      map.current!.on('click', 'unclustered-point', (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (features && features.length > 0 && features[0].properties) {
          onMarkerClick(features[0].properties.id);
        }
      });

      map.current!.on('moveend', () => {
        if (!map.current) return;
        const bounds = map.current.getBounds();
        if (bounds) {
          onBoundsChange([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
        }
      });

      const initialBounds = map.current.getBounds();
      if (initialBounds) {
        onBoundsChange([initialBounds.getWest(), initialBounds.getSouth(), initialBounds.getEast(), initialBounds.getNorth()]);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Sources — also fly-to centroid of data on first load
  useEffect(() => {
    if (!map.current || !map.current.getSource('properties')) return;
    const geoJSON = propertiesGeoJSON || { type: 'FeatureCollection', features: [] };
    (map.current.getSource('properties') as maplibregl.GeoJSONSource).setData(geoJSON);

    // Map remains static on load per requested behavior. Bound strictly to UK coordinates.
  }, [propertiesGeoJSON]);

  useEffect(() => {
    const geo = hotspotsGeoJSON || { type: 'FeatureCollection', features: [] };
    if (map.current && map.current.getSource('hotspots')) {
      (map.current.getSource('hotspots') as maplibregl.GeoJSONSource).setData(geo);
    }
    if (map.current && map.current.getSource('airbnb-heatmap')) {
      (map.current.getSource('airbnb-heatmap') as maplibregl.GeoJSONSource).setData(geo);
    }
  }, [hotspotsGeoJSON]);

  useEffect(() => {
    if (map.current && map.current.getSource('zones')) {
      (map.current.getSource('zones') as maplibregl.GeoJSONSource).setData(zonesGeoJSON || { type: 'FeatureCollection', features: [] });
    }
  }, [zonesGeoJSON]);

  useEffect(() => {
    if (map.current && map.current.getSource('hubs')) {
      (map.current.getSource('hubs') as maplibregl.GeoJSONSource).setData(hubsGeoJSON || { type: 'FeatureCollection', features: [] });
    }
  }, [hubsGeoJSON]);

  useEffect(() => {
    if (map.current && map.current.getSource('isochrone')) {
      (map.current.getSource('isochrone') as maplibregl.GeoJSONSource).setData(isochroneGeoJSON || { type: 'FeatureCollection', features: [] });
    }
  }, [isochroneGeoJSON]);

  useEffect(() => {
    if (map.current && map.current.getLayer('sa-hotspots')) {
      map.current?.setPaintProperty('sa-hotspots', 'heatmap-opacity', hotspotOpacity);
    }
  }, [hotspotOpacity]);

  useEffect(() => {
    if (map.current && map.current.getLayer('c5-zones-fill')) {
      map.current.setLayoutProperty('c5-zones-fill', 'visibility', showC5Zones ? 'visible' : 'none');
    }
  }, [showC5Zones]);

  // Handle external selection (from Telemetry table)
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (selectedProperty) {
      // 1. Highlight the selected property using the new layers
      if (map.current.getLayer('selected-point-highlight')) {
        map.current.setFilter('selected-point-highlight', ['==', ['get', 'id'], selectedProperty.id]);
        map.current.setFilter('selected-point-pulse', ['==', ['get', 'id'], selectedProperty.id]);
      }

      // 2. Fly to the property
      if (selectedProperty.lng && selectedProperty.lat) {

        // 3. Highlight nearby amenities (high demand spots visible in the new viewport)
        if (map.current.getLayer('nearby-amenities-highlight')) {
          const highlightFilter = ['has', 'occupancy']; // Include all data nodes as proxies in the zoomed viewport

          map.current.setFilter('nearby-amenities-highlight', highlightFilter);
          map.current.setFilter('nearby-amenities-pulse', highlightFilter);
          map.current.setPaintProperty('nearby-amenities-highlight', 'circle-opacity', 0.8);
          map.current.setPaintProperty('nearby-amenities-pulse', 'circle-opacity', 0.4);
        }

        map.current.flyTo({
          center: [selectedProperty.lng, selectedProperty.lat],
          zoom: 15,
          duration: 1500,
          essential: true
        });
      }
    } else {
      // Clear highlights when deselected
      if (map.current.getLayer('selected-point-highlight')) {
        map.current.setFilter('selected-point-highlight', ['==', ['get', 'id'], '']);
        map.current.setFilter('selected-point-pulse', ['==', ['get', 'id'], '']);

        if (map.current.getLayer('nearby-amenities-highlight')) {
          map.current.setFilter('nearby-amenities-highlight', ['==', ['get', 'id'], '']);
          map.current.setFilter('nearby-amenities-pulse', ['==', ['get', 'id'], '']);
          map.current.setPaintProperty('nearby-amenities-highlight', 'circle-opacity', 0);
          map.current.setPaintProperty('nearby-amenities-pulse', 'circle-opacity', 0);
        }
      }
    }
  }, [selectedProperty?.id]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
