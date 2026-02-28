import Big from 'big.js';
import { ROIInput, ROIResult } from './types';

export interface AdvancedROIInput extends ROIInput {
  useTOMS?: boolean;
  taxYear2025?: boolean;
}

export interface AdvancedROIResult extends ROIResult {
  tomsVAT: number;
  breakEvenADR60: number;
}

export function calculateROI(input: AdvancedROIInput): AdvancedROIResult {
  const income = new Big(input.monthlyIncome);
  const rent = new Big(input.monthlyRent);
  const bills = new Big(input.monthlyBills);
  const feesPercent = new Big(input.managementFees).div(100);
  const setup = new Big(input.setupCosts);

  // Management Fees (usually on gross revenue)
  const managementFees = income.times(feesPercent);

  let tomsVAT = new Big(0);
  if (input.useTOMS) {
    // TOMS VAT = (Revenue - Direct Costs) * (20 / 120)
    // Direct Costs = Rent + Utilities (for R2R-SA)
    const directCosts = rent.plus(bills);
    const margin = income.minus(directCosts);
    if (margin.gt(0)) {
      tomsVAT = margin.times(20).div(120);
    }
  }

  const totalMonthlyExpenses = rent.plus(bills).plus(managementFees).plus(tomsVAT);
  const monthlyProfit = income.minus(totalMonthlyExpenses);
  const annualProfit = monthlyProfit.times(12);

  let roiPercentage = new Big(0);
  if (setup.gt(0)) {
    roiPercentage = annualProfit.div(setup).times(100);
  }

  // Break-even ADR at 60% occupancy (18.25 nights average)
  // Revenue = nights * ADR
  // Profit = (nights * ADR) - (Rent + Bills) - (nights * ADR * Fee%) - (TOMS if applicable)
  // Let X = ADR, N = 18.25
  // If no TOMS: Profit = NX - (R + B) - NXF = 0  => NX(1-F) = R+B => X = (R+B) / (N(1-F))
  // If TOMS: Profit = NX - (R+B) - NXF - (NX - (R+B)) * (20/120) = 0
  // NX - (R+B) - NXF - NX/6 + (R+B)/6 = 0
  // NX(1 - F - 1/6) = (R+B)(1 - 1/6) = (R+B)(5/6)
  // X = (R+B)(5/6) / (N(1 - F - 1/6))
  
  const N = new Big(18.25);
  let breakEvenADR60 = new Big(0);
  
  if (input.useTOMS) {
    const numerator = rent.plus(bills).times(5).div(6);
    const denominator = N.times(new Big(1).minus(feesPercent).minus(new Big(1).div(6)));
    if (denominator.gt(0)) {
      breakEvenADR60 = numerator.div(denominator);
    }
  } else {
    const numerator = rent.plus(bills);
    const denominator = N.times(new Big(1).minus(feesPercent));
    if (denominator.gt(0)) {
      breakEvenADR60 = numerator.div(denominator);
    }
  }

  return {
    propertyId: input.propertyId,
    monthlyProfit: Number(monthlyProfit.toFixed(0)),
    annualProfit: Number(annualProfit.toFixed(0)),
    roiPercentage: Number(roiPercentage.toFixed(2)),
    tomsVAT: Number(tomsVAT.toFixed(2)),
    breakEvenADR60: Number(breakEvenADR60.toFixed(2))
  };
}

export const DEFAULT_ASSUMPTIONS = {
  managementFeePercent: 10,
  billsPercent: 15, 
  setupCosts: 3000,
};
