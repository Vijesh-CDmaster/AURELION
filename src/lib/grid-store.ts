import { create } from 'zustand';

export interface GridState {
  frequency: number;
  frequencyHistory: { time: string; value: number }[];
  latency: number;
  vppResponse: number;
  solarGeneration: number;
  loadDemand: number;
  activeThreats: number;
  vppEnabled: boolean;
  bidirectionalCharging: boolean;
  responseThreshold: number;
  capacityReserved: number;
  updateFrequency: (val: number) => void;
  toggleVPP: () => void;
  setVPPConfig: (config: Partial<Pick<GridState, 'bidirectionalCharging' | 'responseThreshold' | 'capacityReserved'>>) => void;
  addHistoryPoint: (point: { time: string; value: number }) => void;
}

export const useGridStore = create<GridState>((set) => ({
  frequency: 50.00,
  frequencyHistory: Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    value: 50.00 + (Math.random() * 0.1 - 0.05),
  })),
  latency: 45,
  vppResponse: 0,
  solarGeneration: 1240,
  loadDemand: 3100,
  activeThreats: 0,
  vppEnabled: true,
  bidirectionalCharging: true,
  responseThreshold: 0.05,
  capacityReserved: 15,

  updateFrequency: (val) => set((state) => ({ 
    frequency: val,
    vppResponse: val < 50 - state.responseThreshold ? 100 : val > 50 + state.responseThreshold ? -100 : 0
  })),
  
  toggleVPP: () => set((state) => ({ vppEnabled: !state.vppEnabled })),
  
  setVPPConfig: (config) => set((state) => ({ ...state, ...config })),

  addHistoryPoint: (point) => set((state) => ({
    frequencyHistory: [...state.frequencyHistory.slice(-29), point]
  })),
}));