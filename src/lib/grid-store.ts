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

export interface AgentCluster {
  name: string;
  count: number;
  response: number;
  status: 'active' | 'idle';
}

export interface Device {
  id: string;
  type: string;
  status: 'online' | 'offline' | 'responding';
  load: string;
  cluster: string;
  latency: string;
}

export interface PerformanceMetric {
  day: string;
  stability: number;
  savings: number;
  attacks: number;
}

export interface ForecastPoint {
  time: string;
  generation: number;
  shading: 'none' | 'medium' | 'high';
}

export interface ShadingEvent {
  time: string;
  transformer: string;
  severity: string;
  duration: string;
}

export interface SimulationRecord {
  id: string;
  scenario: string;
  date: string;
  stability: string;
  outcome: string;
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
  
  // Collections
  agentClusters: AgentCluster[];
  devices: Device[];
  performanceData: PerformanceMetric[];
  solarForecast: ForecastPoint[];
  shadingEvents: ShadingEvent[];
  simulationHistory: SimulationRecord[];
  
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
  initializeSystemData: () => void;
}

export const useGridStore = create<GridState>((set) => ({
  frequency: 50.00,
  frequencyHistory: [],
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
  alerts: [],
  agentClusters: [],
  devices: [],
  performanceData: [],
  solarForecast: [],
  shadingEvents: [],
  simulationHistory: [],

  initializeSystemData: () => set((state) => {
    if (state.frequencyHistory.length > 0) return state;

    const now = new Date();
    
    // Frequency History
    const freqHistory = Array.from({ length: 60 }, (_, i) => ({
      time: `${i}:00`,
      value: 50.00 + (Math.random() * 0.04 - 0.02),
    }));

    // Agent Clusters
    const clusters: AgentCluster[] = [
      { name: "Urban Residential Cluster A", count: 2450, response: 98, status: "active" },
      { name: "Industrial Zone 4", count: 120, response: 100, status: "active" },
      { name: "South Sector PV Cluster", count: 4800, response: 88, status: "active" },
      { name: "V2G Fleet Hub", count: 850, response: 95, status: "idle" },
    ];

    // Devices
    const devicesList: Device[] = [
      { id: "EV-902", type: "EV Charger", status: "online", load: "+7.2kW", cluster: "Cluster A", latency: "12ms" },
      { id: "AC-441", type: "HVAC", status: "online", load: "-2.4kW", cluster: "Cluster B", latency: "45ms" },
      { id: "BAT-11", type: "Home Battery", status: "responding", load: "+5.0kW", cluster: "Cluster A", latency: "8ms" },
      { id: "EV-885", type: "EV Charger", status: "offline", load: "0.0kW", cluster: "Cluster C", latency: "N/A" },
      { id: "AC-102", type: "HVAC", status: "online", load: "-1.8kW", cluster: "Cluster A", latency: "52ms" },
      { id: "BAT-09", type: "Home Battery", status: "online", load: "+4.2kW", cluster: "Cluster B", latency: "10ms" },
    ];

    // Performance Data
    const perfDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const perfData: PerformanceMetric[] = perfDays.map(day => ({
      day,
      stability: 94 + Math.random() * 5,
      savings: 900 + Math.random() * 600,
      attacks: Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0
    }));

    // Solar Forecast
    const forecastPoints: ForecastPoint[] = Array.from({ length: 7 }, (_, i) => ({
      time: `${10 + i}:00`,
      generation: 2000 + Math.random() * 3000,
      shading: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'none'
    }));

    // Shading Events
    const events: ShadingEvent[] = [
      { time: "13:12", transformer: "T-42", severity: "High", duration: "12m" },
      { time: "14:45", transformer: "T-88", severity: "Low", duration: "8m" },
      { time: "16:20", transformer: "T-12", severity: "Medium", duration: "15m" },
    ];

    // Simulation History
    const simHistory: SimulationRecord[] = [
      { id: "SIM-101", scenario: "Adversarial Demand Attack", date: "2024-05-20 10:15", stability: "98%", outcome: "SUCCESS" },
      { id: "SIM-099", scenario: "Sudden Cloud Shading", date: "2024-05-20 09:30", stability: "92%", outcome: "SUCCESS" },
      { id: "SIM-098", scenario: "Mass EV Charging", date: "2024-05-19 18:45", stability: "84%", outcome: "WARNING" },
    ];

    // Alerts
    const initialAlerts: Alert[] = [
      { id: '1', time: '12:00:00', type: 'System', severity: 'info', message: 'MARL Agents synchronized with Transformer T-42', status: 'resolved' },
      { id: '2', time: '12:15:00', type: 'Forecast', severity: 'warning', message: 'Potential cloud shading detected in West Sector', status: 'active' }
    ];

    return {
      frequencyHistory: freqHistory,
      agentClusters: clusters,
      devices: devicesList,
      performanceData: perfData,
      solarForecast: forecastPoints,
      shadingEvents: events,
      simulationHistory: simHistory,
      alerts: initialAlerts
    };
  }),

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