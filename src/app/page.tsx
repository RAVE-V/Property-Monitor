'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Map from './components/Map';
import SidePanel from './components/SidePanel';
import Filters from './components/Filters';
import DemandMenu from './components/DemandMenu';
import PropertyListView from './components/PropertyListView';
import { useProperties } from './hooks/useProperties';
import { useHotspots } from './hooks/useHotspots';
import { useZones } from './hooks/useZones';
import { useIsochrones } from './hooks/useIsochrones';
import { useAppStore } from './store';

export default function Home() {
  // Use precise selectors to prevent unnecessary re-renders
  const bbox = useAppStore(state => state.bbox);
  const setBbox = useAppStore(state => state.setBbox);
  const selectedPropertyId = useAppStore(state => state.selectedPropertyId);
  const setSelectedPropertyId = useAppStore(state => state.setSelectedPropertyId);
  const isListViewOpen = useAppStore(state => state.isListViewOpen);
  const toggleListView = useAppStore(state => state.toggleListView);
  const setListViewOpen = useAppStore(state => state.setListViewOpen);
  const filters = useAppStore(state => state.filters);
  const setFilters = useAppStore(state => state.setFilters);
  const setProperties = useAppStore(state => state.setProperties);
  const minOccupancyFilter = useAppStore(state => state.minOccupancyFilter);
  const minProfitFilter = useAppStore(state => state.minProfitFilter);

  const [hotspotOpacity, setHotspotOpacity] = useState(0.7);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showTourism, setShowTourism] = useState(false);
  const [showC5Zones, setShowC5Zones] = useState(false);
  const [selectedHub, setSelectedHub] = useState<[number, number] | null>(null);

  const { data: propertiesGeoJSON, isLoading: loadingProps } = useProperties(filters);
  const { data: hotspotsGeoJSON } = useHotspots(bbox);
  const { data: zonesGeoJSON } = useZones(bbox);
  const { data: isochroneGeoJSON } = useIsochrones(selectedHub, 10);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Map properties to a flat format for the store
  const formattedProps = React.useMemo(() => {
    if (!propertiesGeoJSON?.features) return [];

    const hotspots = hotspotsGeoJSON?.features || [];

    // Inverse Distance Weighting (IDW) for occupancy
    const getWeightedOccupancy = (lng: number, lat: number) => {
      if (!hotspots.length) return null;
      let totalWeight = 0;
      let weightedSum = 0;
      let maxDistSq = 0.01; // ~10km bounding radius in degrees squared

      for (const h of hotspots) {
        const [hLng, hLat] = h.geometry.coordinates;
        // distance squared
        const d2 = Math.pow(lng - hLng, 2) + Math.pow(lat - hLat, 2);

        if (d2 < maxDistSq) {
          // Add small epsilon to avoid division by zero
          const weight = 1 / (d2 + 0.000001);
          weightedSum += h.properties.occupancy * weight;
          totalWeight += weight;
        }
      }
      return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
    };

    // Calculate deterministic jitter based on string ID to spread out identical postcodes
    const getJitter = (str: string, index: number, maxJitter = 0.003) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
      // Use pseudo-random seeded by hash and index to generate an x, y spread
      const angle = (Math.abs(hash * (index + 1)) % 360) * (Math.PI / 180);
      const dist = (Math.abs(hash) % 100 / 100) * maxJitter;
      return [Math.cos(angle) * dist, Math.sin(angle) * dist];
    };

    return propertiesGeoJSON.features.map((f: any, i: number) => {
      const p = f.properties;
      let [lng, lat] = f.geometry?.coordinates || [0, 0];

      // Apply jitter to spread properties located at exact same abstract lat/lng (e.g. outcode centroids)
      const [jLng, jLat] = getJitter(p.id, i);
      lng += jLng;
      lat += jLat;

      // Update original GeoJSON feature geometry mutably so Map component renders the spread
      if (f.geometry?.coordinates) {
        f.geometry.coordinates = [lng, lat];
      }

      // Calculate SA profit (Rentals only)
      const rent = p.price || 0;
      let profit = null;

      // If price > 20,000 it is almost certainly a For Sale listing, not rental
      if (rent > 0 && rent < 20000 && p.tenure !== 'sale') {
        const estIncome = Math.round(rent * 2.8);
        const bills = Math.round(rent * 0.15);
        const fees = Math.round(estIncome * 0.10);
        profit = estIncome - rent - bills - fees;
      }

      return {
        id: p.id,
        title: p.title,
        price: p.price,
        bedrooms: p.bedrooms,
        propertyType: p.propertyType,
        url: p.url,
        source: p.source,
        isArticle4: p.isArticle4,
        isTiredLandlord: p.isTiredLandlord,
        timeOnMarket: p.timeOnMarket,
        saProfit: profit,
        occupancyRate: getWeightedOccupancy(lng, lat)
      };
    });
  }, [propertiesGeoJSON, hotspotsGeoJSON]);

  // Sync with store
  useEffect(() => {
    if (isMounted) {
      setProperties(formattedProps);
    }
  }, [formattedProps, setProperties, isMounted]);

  const filteredGeoJSON = React.useMemo(() => {
    if (!propertiesGeoJSON) return null;
    return {
      type: 'FeatureCollection',
      features: propertiesGeoJSON.features.filter((_: any, i: number) => {
        const fp = formattedProps[i];
        if (!fp) return false;

        // Apply global filters (Occupancy, Profit, Tenure, etc)
        if (minOccupancyFilter > 0 && (fp.occupancyRate || 0) < minOccupancyFilter) return false;
        if (minProfitFilter > 0 && (fp.saProfit || 0) < minProfitFilter) return false;

        // Notice we REMOVED the `selectedPropertyId` filter here. 
        // We want all pins to stay on the map even if one is selected. 
        // The Map.tsx component handles highlighting the selected one.

        return true;
      })
    };
  }, [propertiesGeoJSON, formattedProps, minOccupancyFilter, minProfitFilter]);

  const selectedProperty = React.useMemo(() => {
    if (!selectedPropertyId || !propertiesGeoJSON) return null;
    const feature = propertiesGeoJSON.features.find((f: any) => f.properties.id === selectedPropertyId);
    if (!feature) return null;
    // Merge geometry coordinates (lng, lat) into properties for occupancy fetch + display
    const [lng, lat] = feature.geometry?.coordinates || [];
    return { ...feature.properties, lng, lat };
  }, [selectedPropertyId, propertiesGeoJSON]);

  if (!isMounted) return <div className="w-screen h-screen bg-black" />;

  return (
    <main className="relative w-screen h-screen overflow-hidden flex flex-col bg-brand-bg select-none font-mono">
      {/* Top Header Bar */}
      <header className="h-12 bg-[#000000] border-b border-[#222222] flex items-center justify-between px-4 z-50 relative text-white">
        <div className="flex items-center gap-4">
          {/* Brand: blinking dot + name */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-wm-green shadow-[0_0_8px_#10b981]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-wm-green animate-ping opacity-60" />
            </div>
            <h1 className="text-[15px] font-black tracking-[0.15em] uppercase">
              Property Monitor
            </h1>
            <span className="text-gray-600 font-mono text-[9px] tracking-normal lowercase">v2.5.20</span>
          </div>

          {/* Region selector */}
          <div className="bg-[#111] border border-[#333] px-3 py-1 flex items-center min-w-[80px] justify-between cursor-pointer hover:bg-[#1a1a1a]">
            <span className="text-[11px] text-gray-300">UK</span>
            <span className="text-[8px] text-gray-500 ml-2">▼</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center border-l border-r border-[#222222] mx-4">
          <Filters onFilterChange={setFilters} />
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-3">
            <button
              onClick={toggleListView}
              className={`text-[9px] font-black transition-colors uppercase tracking-widest px-3 py-1 border ${isListViewOpen ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-[#111] border-[#333] text-gray-400 hover:text-white hover:border-gray-500'}`}
            >
              {isListViewOpen ? 'Close Telemetry' : 'Open Telemetry'}
            </button>
            <Link href="/pipeline" className="text-[9px] font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest bg-[#111] border border-[#333] px-3 py-1 hover:border-gray-500">Satellite Dashboard</Link>
          </nav>
        </div>
      </header>


      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          {/* Overlay UI Controls */}
          <div className="absolute top-6 left-6 z-40 flex flex-col gap-6 items-start">
            <DemandMenu
              hotspotOpacity={hotspotOpacity}
              onOpacityChange={setHotspotOpacity}
              showHospitals={showHospitals}
              onToggleHospitals={setShowHospitals}
              showTourism={showTourism}
              onToggleTourism={setShowTourism}
              showC5Zones={showC5Zones}
              onToggleC5Zones={setShowC5Zones}
            />
          </div>

          <Map
            onBoundsChange={setBbox}
            onMarkerClick={setSelectedPropertyId}
            onClusterClick={() => setListViewOpen(true)}
            propertiesGeoJSON={filteredGeoJSON}
            hotspotsGeoJSON={hotspotsGeoJSON}
            zonesGeoJSON={zonesGeoJSON}
            isochroneGeoJSON={isochroneGeoJSON}
            hotspotOpacity={hotspotOpacity}
            showC5Zones={showC5Zones}
            selectedProperty={selectedProperty}
          />

          {loadingProps && (
            <div className="absolute bottom-10 left-10 z-40 bg-black/60 border border-wm-green/40 px-3 py-1.5 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-wm-green animate-ping" />
              <span className="text-[9px] font-black text-wm-green uppercase tracking-widest">Processing Intelligence Layers...</span>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-6 left-4 z-40 bg-black/80 border border-white/10 backdrop-blur-sm px-3 py-2.5 flex gap-5 items-start text-[10px] font-mono">
            {/* Airbnb/VRBO heatmap scale */}
            <div>
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">SA Demand (Airbnb/VRBO)</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-28 h-2 rounded-full"
                  style={{ background: 'linear-gradient(to right, rgba(255,80,80,0.1), rgba(255,60,40,0.5), rgba(220,20,0,0.9))' }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-600 mt-0.5 w-28">
                <span>Low</span>
                <span>High Occ.</span>
              </div>
            </div>
          </div>
        </div>


        {selectedProperty && (
          <div className="w-[400px] h-full z-40 animate-in slide-in-from-right duration-500">
            <SidePanel
              property={selectedProperty}
              onClose={() => setSelectedPropertyId(null)}
            />
          </div>
        )}
      </div>

      {
        isListViewOpen && (
          <div className="h-[300px] w-full z-40 animate-in slide-in-from-bottom duration-500">
            <PropertyListView />
          </div>
        )
      }
    </main >
  );
}
