import React from 'react';
import { useAppStore } from '../store';

interface FilterProps {
  onFilterChange: (filters: any) => void;
}

const Filters: React.FC<FilterProps> = ({ onFilterChange }) => {
  const minOccupancyFilter = useAppStore(state => state.minOccupancyFilter);
  const setMinOccupancyFilter = useAppStore(state => state.setMinOccupancyFilter);
  const minProfitFilter = useAppStore(state => state.minProfitFilter);
  const setMinProfitFilter = useAppStore(state => state.setMinProfitFilter);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0">Min Price</label>
        <input
          type="number"
          name="minPrice"
          placeholder="0.00"
          onChange={handleChange}
          className="bg-[#111] border border-[#333] text-white text-[10px] px-2 py-1 w-16 focus:border-brand-cyan focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0">Max Price</label>
        <input
          type="number"
          name="maxPrice"
          placeholder="∞"
          onChange={handleChange}
          className="bg-[#111] border border-[#333] text-white text-[10px] px-2 py-1 w-16 focus:border-brand-cyan focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0">Beds</label>
        <select name="minBedrooms" onChange={handleChange} className="bg-[#111] border border-[#333] text-white text-[10px] px-2 py-1 w-14 appearance-none focus:border-brand-cyan focus:outline-none">
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0">Tenure</label>
        <select name="tenure" onChange={handleChange} defaultValue="" className="bg-[#111] border border-[#333] text-white text-[10px] px-2 py-1 w-16 appearance-none focus:border-brand-cyan focus:outline-none">
          <option value="rent">Rent</option>
          <option value="sale">Sale</option>
          <option value="">Any</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0">Type</label>
        <select name="propertyType" onChange={handleChange} className="bg-[#111] border border-[#333] text-white text-[10px] px-2 py-1 w-16 appearance-none focus:border-brand-cyan focus:outline-none">
          <option value="">All</option>
          <option value="Flat">Flat</option>
          <option value="House">House</option>
        </select>
      </div>
      <div className="flex items-center gap-2 ml-1">
        <label className="text-[9px] font-black text-brand-gold uppercase tracking-widest mb-0">Distressed</label>
        <input
          type="checkbox"
          name="isTiredLandlord"
          onChange={(e) => onFilterChange((prev: any) => ({ ...prev, isTiredLandlord: e.target.checked }))}
          className="w-3.5 h-3.5 rounded-none border-[#333] bg-[#111] text-brand-gold focus:ring-brand-gold cursor-pointer"
        />
      </div>
      {/* Separator */}
      <div className="w-px h-4 bg-[#333] mx-1" />
      {/* Occupancy Slider */}
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Min Occ</label>
        <input
          type="range" min="0" max="90" step="10"
          value={minOccupancyFilter}
          onChange={e => setMinOccupancyFilter(Number(e.target.value))}
          className="w-16 accent-brand-cyan"
        />
        <span className="text-[10px] font-mono text-gray-300 w-8">{minOccupancyFilter > 0 ? `${minOccupancyFilter}%` : 'Any'}</span>
      </div>
      {/* Profit Slider */}
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Min Profit</label>
        <input
          type="range" min="0" max="2500" step="250"
          value={minProfitFilter}
          onChange={e => setMinProfitFilter(Number(e.target.value))}
          className="w-16 accent-brand-cyan"
        />
        <span className="text-[10px] font-mono text-gray-300 w-12">{minProfitFilter > 0 ? `£${minProfitFilter}` : 'Any'}</span>
      </div>
    </div>
  );
};

export default Filters;
