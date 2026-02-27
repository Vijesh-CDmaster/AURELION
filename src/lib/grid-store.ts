import { create } from 'zustand';

export type AttackStatus = 'none' | 'detected' | 'under-defense';
export type GridStatus = 'stable' | 'warning' | 'critical';

export interface Alert {
  id: string;
  time: string;
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'attack';
  message: string;
  status: 'active' | 'resolved';
}

export interface GridState {
  // Core Metrics
  frequency: number;
  frequencyHistory: { time: string; value: number }[];
  latency: number;
  vppResponse: number;
  solarGeneration: number;
  loadDemand: number;
  energySaved: number;
  
  // Grid Status
  status: GridStatus;
  activeAgents: number;
  
  // Adversarial Defense
  attackStatus: AttackStatus;
  phaseCoherence: number;
  
  // Configuration
  vppEnabled: boolean;
  bidirectionalCharging: boolean;
  responseThreshold: number;
  capacityReserved: number;
  
  // Alerts
  alerts: Alert[];
  
  // Actions
  updateFrequency: (val: number) => void;
  toggleVPP: () => void;
  setVPPConfig: (config: Partial<Pick<GridState, 'bidirectionalCharging' | 'responseThreshold' | 'capacityReserved'>>) => void;
  addHistoryPoint: (point: { time: string; value: number }) => void;
  triggerAttack: (type: AttackStatus) => void;
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  resolveAlert: (id: string) => void;
}

export const useGridStore = create<GridState>((set) => ({
  frequency: 50.00,
  frequencyHistory: Array.from({ length: 60 }, (_, i) => ({
    time: `${i}:00`,
    value: 50.00 + (Math.random() * 0.04 - 0.02),
  })),
  latency: 42,
  vppResponse: 0,
  solarGeneration: 1240,
  loadDemand: 3100,
  energySaved: 842,
  status: 'stable',
  activeAgents: 10248,
  attackStatus: 'none',
  phaseCoherence: 0.12,
  vppEnabled: true,
  bidirectionalCharging: true,
  responseThreshold: 0.05,
  capacityReserved: 15,
  alerts: [
    { id: '1', time: '12:00:00', type: 'System', severity: 'info', message: 'MARL Agents synchronized with Transformer T-42', status: 'resolved' },
    { id: '2', time: '12:15:00', type: 'Forecast', severity: 'warning', message: 'Potential cloud shading detected in West Sector', status: 'active' }
  ],

  updateFrequency: (val) => set((state) => {
    const dev = Math.abs(50 - val);
    let newStatus: GridStatus = 'stable';
    if (dev > 0.15) newStatus = 'critical';
    else if (dev > 0.08) newStatus = 'warning';
    
    return { 
      frequency: val,
      status: newStatus,
      vppResponse: val < 50 - state.responseThreshold ? 120 : val > 50 + state.responseThreshold ? -85 : 0
    };
  }),
  
  toggleVPP: () => set((state) => ({ vppEnabled: !state.vppEnabled })),
  
  setVPPConfig: (config) => set((state) => ({ ...state, ...config })),

  addHistoryPoint: (point) => set((state) => ({
    frequencyHistory: [...state.frequencyHistory.slice(-59), point]
  })),

  triggerAttack: (status) => set({ 
    attackStatus: status,
    phaseCoherence: status === 'none' ? 0.12 : 0.85
  }),

  addAlert: (alert) => set((state) => ({
    alerts: [{ ...alert, id: Math.random().toString(36).substr(2, 9) }, ...state.alerts].slice(0, 50)
  })),

  resolveAlert: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, status: 'resolved' } : a)
  })),
}));