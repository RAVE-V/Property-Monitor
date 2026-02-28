import React, { useState, useMemo } from 'react';
import { calculateROI, DEFAULT_ASSUMPTIONS } from '../../libs/shared/roi';
import { Property, ROIInput } from '../../libs/shared/types';

interface SidePanelProps {
  property: Property;
  onClose: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ property, onClose }) => {
  const [income, setIncome] = useState<number>(2500); 
  const [rent, setRent] = useState<number>(property.price);
  const [bills, setBills] = useState<number>(Math.round(property.price * (DEFAULT_ASSUMPTIONS.billsPercent / 100)));
  const [fees, setFees] = useState<number>(DEFAULT_ASSUMPTIONS.managementFeePercent);
  const [setup, setSetup] = useState<number>(DEFAULT_ASSUMPTIONS.setupCosts);
  const [useTOMS, setUseTOMS] = useState<boolean>(false);

  const roiResult = useMemo(() => {
    const input = {
      propertyId: property.id,
      monthlyIncome: income,
      monthlyRent: rent,
      monthlyBills: bills,
      managementFees: fees,
      setupCosts: setup,
      useTOMS: useTOMS
    };
    return calculateROI(input);
  }, [property.id, income, rent, bills, fees, setup, useTOMS]);

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-bold truncate">{property.title}</h2>
          {property.isArticle4 && (
            <span className="inline-block mt-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              ⚠️ Article 4 Zone
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* ... Property Info Section (Unchanged) ... */}

        {/* Profit Calculator */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-semibold">Profit Calculator</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">TOMS VAT</span>
              <input 
                type="checkbox" 
                checked={useTOMS} 
                onChange={(e) => setUseTOMS(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
          
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
            {/* ... Rent/Bills/Fees inputs ... */}
          </div>
        </section>

        {/* Results */}
        <section className="bg-blue-600 text-white p-6 rounded-xl shadow-lg space-y-4">
          <div className="flex justify-between items-end border-b border-blue-500 pb-4">
            <div>
              <span className="block text-xs uppercase opacity-80 font-medium">Monthly Profit</span>
              <span className="text-3xl font-black">£{roiResult.monthlyProfit}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs uppercase opacity-80 font-medium">ROI %</span>
              <span className="text-2xl font-bold">{roiResult.roiPercentage}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="opacity-90">
              <span className="block opacity-70">Break-even ADR (60%)</span>
              <span className="font-bold">£{roiResult.breakEvenADR60}</span>
            </div>
            {useTOMS && (
              <div className="text-right opacity-90">
                <span className="block opacity-70">Est. TOMS VAT</span>
                <span className="font-bold">£{roiResult.tomsVAT}</span>
              </div>
            )}
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
