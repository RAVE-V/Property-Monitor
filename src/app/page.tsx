'use client';

import React, { useState } from 'react';
import Map from './components/Map';
import SidePanel from './components/SidePanel';
import Filters from './components/Filters';
import DemandMenu from './components/DemandMenu';
import { useProperties } from './hooks/useProperties';
import { useHotspots } from './hooks/useHotspots';
import { useZones } from './hooks/useZones';
import { useIsochrones } from './hooks/useIsochrones';

export default function Home() {
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [filters, setFilters] = useState({});
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [hotspotOpacity, setHotspotOpacity] = useState(0.7);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showTourism, setShowTourism] = useState(false);
  const [selectedHub, setSelectedHub] = useState<[number, number] | null>(null);

  const { data: propertiesGeoJSON, isLoading: loadingProps } = useProperties(bbox, filters);
  const { data: hotspotsGeoJSON } = useHotspots(bbox);
  const { data: zonesGeoJSON } = useZones(bbox);
  const { data: isochroneGeoJSON } = useIsochrones(selectedHub, 10);

  const handleBoundsChange = (newBbox: [number, number, number, number]) => {
    setBbox(newBbox);
  };

  const handleMarkerClick = (propertyId: string) => {
    const feature = propertiesGeoJSON?.features?.find((f: any) => f.properties.id === propertyId);
    if (feature) {
      setSelectedProperty(feature.properties);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden flex">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 items-start">
          <Filters onFilterChange={setFilters} />
          <DemandMenu 
            hotspotOpacity={hotspotOpacity}
            onOpacityChange={setHotspotOpacity}
            showHospitals={showHospitals}
            onToggleHospitals={setShowHospitals}
            showTourism={showTourism}
            onToggleTourism={setShowTourism}
          />
        </div>

        <Map 
          onBoundsChange={handleBoundsChange} 
          onMarkerClick={handleMarkerClick}
          propertiesGeoJSON={propertiesGeoJSON}
          hotspotsGeoJSON={hotspotsGeoJSON}
          zonesGeoJSON={zonesGeoJSON}
          isochroneGeoJSON={isochroneGeoJSON}
          hotspotOpacity={hotspotOpacity}
        />
        
        {loadingProps && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-10 text-sm font-medium">
            Updating intelligence layers...
          </div>
        )}
      </div>

      {selectedProperty && (
        <div className="w-96 h-full z-20 border-l animate-in slide-in-from-right duration-300">
          <SidePanel 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
          />
        </div>
      )}
    </main>
  );
}
