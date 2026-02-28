import React from 'react';

interface DemandMenuProps {
  hotspotOpacity: number;
  onOpacityChange: (val: number) => void;
  showHospitals: boolean;
  onToggleHospitals: (val: boolean) => void;
  showTourism: boolean;
  onToggleTourism: (val: boolean) => void;
  showC5Zones: boolean;
  onToggleC5Zones: (val: boolean) => void;
}

const DemandMenu: React.FC<DemandMenuProps> = ({
  hotspotOpacity, onOpacityChange,
  showHospitals, onToggleHospitals,
  showTourism, onToggleTourism,
  showC5Zones, onToggleC5Zones
}) => {
  return (
    <div className="panel-glass p-0 w-[280px] bg-[#000000]/95 border border-[#333] flex flex-col shadow-2xl">
      <div className="px-4 py-2 border-b border-[#333] flex justify-between items-center bg-[#111]">
        <h3 className="text-[11px] font-bold text-gray-400 tracking-[0.2em] font-mono">LAYERS</h3>
        <div className="text-gray-500 font-mono text-[10px] w-4 h-4 rounded border border-[#444] flex items-center justify-center cursor-pointer hover:bg-gray-800">?</div>
      </div>

      <div className="p-4 space-y-4">
        <LayerToggle
          label="HEALTHCARE COHORT"
          active={showHospitals}
          onToggle={() => onToggleHospitals(!showHospitals)}
          icon="🏥"
        />
        <LayerToggle
          label="TOURISM/LANDMARKS"
          active={showTourism}
          onToggle={() => onToggleTourism(!showTourism)}
          icon="🏛️"
        />
        <div className="h-px bg-[#333] my-2" />
        <LayerToggle
          label="C5 SHORT-TERM LETS"
          active={showC5Zones}
          onToggle={() => onToggleC5Zones(!showC5Zones)}
          icon="⛔"
        />

        <div className="pt-4 mt-6 border-t border-[#333]">
          <label className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-widest mb-3 block">HOTSPOT INTENSITY</label>
          <input
            type="range"
            min="0" max="1" step="0.1"
            value={hotspotOpacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-[#444] rounded-none appearance-none cursor-pointer accent-wm-green"
          />
        </div>
      </div>
    </div>
  );
};

const LayerToggle = ({ label, active, onToggle, icon }: { label: string, active: boolean, onToggle: () => void, icon?: string }) => (
  <div
    className="flex items-center gap-3 cursor-pointer group"
    onClick={onToggle}
  >
    <div className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors border ${active ? 'bg-wm-green border-wm-green' : 'bg-[#111] border-[#444] group-hover:border-gray-500'}`}>
      {active && <span className="text-black text-[10px] font-bold block leading-none">✓</span>}
    </div>
    <div className="flex items-center gap-2">
      {icon && <span className="text-xs">{icon}</span>}
      <span className={`text-[12px] font-bold font-mono tracking-wide transition-colors ${active ? 'text-white/90' : 'text-gray-500 group-hover:text-gray-300'}`}>{label}</span>
    </div>
  </div>
);

export default DemandMenu;
