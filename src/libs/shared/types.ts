export interface Property {
  id: string;
  portalId: string;
  url: string;
  title: string;
  price: number;
  bedrooms: number | null;
  propertyType: string | null;
  location: { lng: number, lat: number };
  scrapedAt?: Date;
  // Phase 4 Fields
  firstSeenAt?: Date;
  originalPrice?: number;
  timeOnMarket?: number; // in days
  isTiredLandlord?: boolean;
  tenure?: string | null;
  status?: string | null;
}

export interface ROIInput {
  propertyId: string;
  monthlyIncome: number;
  monthlyRent: number;
  monthlyBills: number;
  managementFees: number;
  setupCosts: number;
  useTOMS?: boolean;
}

export interface ROIResult {
  propertyId: string;
  monthlyProfit: number;
  annualProfit: number;
  roiPercentage: number;
  breakEvenADR60: number;
  tomsVAT: number;
}
