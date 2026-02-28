import React, { useState, useMemo } from 'react';
import { calculateROI, DEFAULT_ASSUMPTIONS } from '../../libs/shared/roi';
import { Property, ROIInput } from '../../libs/shared/types';

interface SidePanelProps {
  property: Property;
  onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ property, onClose }) => {
  const [income, setIncome] = useState<number>(2500); // Default placeholder
  const [rent, setRent] = useState<number>(property.price);
  const [bills, setBills] = useState<number>(Math.round(property.price * (DEFAULT_ASSUMPTIONS.billsPercent / 100)));
  const [fees, setFees] = useState<number>(DEFAULT_ASSUMPTIONS.managementFeePercent);
  const [setup, setSetup] = useState<number>(DEFAULT_ASSUMPTIONS.setupCosts);

  const roiResult = useMemo(() => {
    const input: ROIInput = {
      propertyId: property.id,
      monthlyIncome: income,
      monthlyRent: rent,
      monthlyBills: bills,
      managementFees: fees,
      setupCosts: setup
    };
    return calculateROI(input);
  }, [property.id, income, rent, bills, fees, setup]);

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold truncate">{property.title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Property Info */}
        <section>
          <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400">
            Photo Placeholder
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <span className="block text-gray-500 uppercase text-xs">Asking Rent</span>
              <span className="text-lg font-bold">£{property.price}</span>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <span className="block text-gray-500 uppercase text-xs">Bedrooms</span>
              <span className="text-lg font-bold">{property.bedrooms || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Profit Calculator */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Profit Calculator (R2R-SA)</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Monthly Revenue (Est.)</label>
              <input 
                type="number" 
                value={income} 
                onChange={(e) => setIncome(Number(e.target.value))}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Monthly Rent</label>
                <input 
                  type="number" 
                  value={rent} 
                  onChange={(e) => setRent(Number(e.target.value))}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Monthly Bills</label>
                <input 
                  type="number" 
                  value={bills} 
                  onChange={(e) => setBills(Number(e.target.value))}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-end">
            <div>
              <span className="block text-xs uppercase opacity-80 font-medium">Monthly Profit</span>
              <span className="text-3xl font-black">£{roiResult.monthlyProfit}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs uppercase opacity-80 font-medium">ROI %</span>
              <span className="text-2xl font-bold">{roiResult.roiPercentage}%</span>
            </div>
          </div>
        </section>

        <section className="text-xs text-gray-500">
          * ROI calculation based on 2025 R2R assumptions including management fees and setup costs.
        </section>
      </div>
    </div>
  );
};

export default SidePanel;
