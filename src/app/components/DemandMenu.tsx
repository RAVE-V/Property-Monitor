import React from 'react';

interface DemandMenuProps {
  hotspotOpacity: number;
  onOpacityChange: (val: number) => void;
  showHospitals: boolean;
  onToggleHospitals: (val: boolean) => void;
  showTourism: boolean;
  onToggleTourism: (val: boolean) => void;
}

const DemandMenu: React.FC<DemandMenuProps> = ({ 
  hotspotOpacity, onOpacityChange, 
  showHospitals, onToggleHospitals,
  showTourism, onToggleTourism 
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-64 space-y-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Demand Intelligence</h3>
      
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-600 uppercase">Hotspot Opacity</label>
        <input 
          type="range" 
          min="0" max="1" step="0.1" 
          value={hotspotOpacity} 
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Hospital Workers</span>
          <button 
            onClick={() => onToggleHospitals(!showHospitals)}
            className={`w-10 h-5 rounded-full transition-colors ${showHospitals ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full transition-transform mx-1 ${showHospitals ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tourism & Landmarks</span>
          <button 
            onClick={() => onToggleTourism(!showTourism)}
            className={`w-10 h-5 rounded-full transition-colors ${showTourism ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full transition-transform mx-1 ${showTourism ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemandMenu;
