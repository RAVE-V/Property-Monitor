import { create } from 'zustand';

export interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms?: number;
  propertyType?: string;
  url: string;
  source?: string;
  isArticle4?: boolean;
  saProfit?: number;
  occupancyRate?: number | null;
}

interface AppState {
  // Map State
  bbox: [number, number, number, number] | null;
  setBbox: (bbox: [number, number, number, number]) => void;

  // Property Data State
  visibleProperties: Property[];
  setProperties: (properties: Property[]) => void;

  // Selection State
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;

  // UI Toggles
  isListViewOpen: boolean;
  toggleListView: () => void;
  setListViewOpen: (open: boolean) => void;

  // Filters State
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;

  minOccupancyFilter: number;
  setMinOccupancyFilter: (val: number) => void;

  minProfitFilter: number;
  setMinProfitFilter: (val: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  bbox: null,
  setBbox: (bbox) => set({ bbox }),

  visibleProperties: [],
  setProperties: (properties) => set({ visibleProperties: properties }),

  selectedPropertyId: null,
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),

  isListViewOpen: false,
  toggleListView: () => set((state) => ({ isListViewOpen: !state.isListViewOpen })),
  setListViewOpen: (open) => set({ isListViewOpen: open }),

  filters: {},
  setFilters: (filters) => set((state) => ({
    filters: typeof filters === 'function' ? filters(state.filters) : filters
  })),

  minOccupancyFilter: 60,
  setMinOccupancyFilter: (val) => set({ minOccupancyFilter: val }),

  minProfitFilter: 500,
  setMinProfitFilter: (val) => set({ minProfitFilter: val })
}));
