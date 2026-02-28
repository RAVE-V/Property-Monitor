'use client';

import React, { useState } from 'react';
import Map from './components/Map';
import SidePanel from './components/SidePanel';
import Filters from './components/Filters';
import { useProperties } from './hooks/useProperties';

export default function Home() {
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [filters, setFilters] = useState({});
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  const { data: propertiesGeoJSON, isLoading } = useProperties(bbox, filters);

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
        <div className="absolute top-4 left-4 z-10 flex gap-4 items-start">
          <Filters onFilterChange={setFilters} />
        </div>

        <Map 
          onBoundsChange={handleBoundsChange} 
          onMarkerClick={handleMarkerClick}
          propertiesGeoJSON={propertiesGeoJSON}
        />
        
        {isLoading && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-10 text-sm font-medium">
            Filtering properties...
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
