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
}

export interface ROIInput {
  propertyId: string;
  monthlyIncome: number;
  monthlyRent: number;
  monthlyBills: number;
  managementFees: number;
  setupCosts: number;
}

export interface ROIResult {
  propertyId: string;
  monthlyProfit: number;
  annualProfit: number;
  roiPercentage: number;
}
