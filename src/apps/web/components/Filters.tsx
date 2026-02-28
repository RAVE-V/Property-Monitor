import React from 'react';

interface FilterProps {
  onFilterChange: (filters: any) => void;
}

const Filters: React.FC<FilterProps> = ({ onFilterChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-white shadow-md rounded-lg z-10">
      <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-500 uppercase">Min Price</label>
        <input 
          type="number" 
          name="minPrice" 
          placeholder="Min £"
          onChange={handleChange}
          className="border rounded px-2 py-1 text-sm w-24"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-500 uppercase">Max Price</label>
        <input 
          type="number" 
          name="maxPrice" 
          placeholder="Max £"
          onChange={handleChange}
          className="border rounded px-2 py-1 text-sm w-24"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-500 uppercase">Beds</label>
        <select name="minBedrooms" onChange={handleChange} className="border rounded px-2 py-1 text-sm">
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
        <select name="propertyType" onChange={handleChange} className="border rounded px-2 py-1 text-sm">
          <option value="">All</option>
          <option value="Flat">Flat</option>
          <option value="House">House</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;
