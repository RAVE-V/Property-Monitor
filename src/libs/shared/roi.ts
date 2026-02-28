import { ROIInput, ROIResult } from './types';

export function calculateROI(input: ROIInput): ROIResult {
  const { monthlyIncome, monthlyRent, monthlyBills, managementFees, setupCosts } = input;
  
  const monthlyExpenses = monthlyRent + monthlyBills + (monthlyIncome * (managementFees / 100));
  const monthlyProfit = monthlyIncome - monthlyExpenses;
  const annualProfit = monthlyProfit * 12;
  
  let roiPercentage = 0;
  if (setupCosts > 0) {
    roiPercentage = (annualProfit / setupCosts) * 100;
  }

  return {
    propertyId: input.propertyId,
    monthlyProfit: Math.round(monthlyProfit),
    annualProfit: Math.round(annualProfit),
    roiPercentage: Math.round(roiPercentage * 100) / 100
  };
}

export const DEFAULT_ASSUMPTIONS = {
  managementFeePercent: 10,
  billsPercent: 15, // 15% of rent
  setupCosts: 3000, // Initial furnishing/legal
};
