import { create } from 'zustand';

// ─── DB sync helpers (fire-and-forget from client) ────────────────────────
const api = (path: string) => `/api/grid/${path}`;

async function dbGet<T = any>(path: string): Promise<T | null> {
  try {
    const res = await fetch(api(path));
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function dbPost<T = any>(path: string, body: any): Promise<T | null> {
  try {
    const res = await fetch(api(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function dbPut<T = any>(path: string, body: any): Promise<T | null> {
  try {
    const res = await fetch(api(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Snapshot counter — save a snapshot every N ticks (~every 30s at 2s interval)
let tickCounter = 0;
const SNAPSHOT_INTERVAL = 15;

export type AttackStatus = 'none' | 'detected' | 'under-defense';
export type GridStatus = 'stable' | 'warning' | 'critical';
export type DetectionSensitivity = 'low' | 'medium' | 'high';
export type ForecastHorizon = '10s' | '30s' | '60s';

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

export interface DefenseLogEntry {
  time: string;
  action: string;
  target: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface StabilityZone {
  label: string;
  freq: number;
  load: string;
}

export interface ClusterCoverage {
  name: string;
  assets: number;
  stability: number;
}

export interface SimulationParams {
  scenario: string;
  intensity: number;
  affectedNodes: number;
  duration: number;
}

export interface SimulationResults {
  maxDeviation: number;
  recoveryTime: number;
  energyCurtailed: number;
  currentFrequency: number;
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
  dfdt: number;

  // Collections
  agentClusters: AgentCluster[];
  devices: Device[];
  performanceData: PerformanceMetric[];
  solarForecast: ForecastPoint[];
  shadingEvents: ShadingEvent[];
  simulationHistory: SimulationRecord[];
  defenseLog: DefenseLogEntry[];
  stabilityZones: StabilityZone[];
  clusterCoverage: ClusterCoverage[];

  // Grid Status
  status: GridStatus;
  activeAgents: number;
  agentSyncRate: number;

  // Adversarial Defense
  attackStatus: AttackStatus;
  phaseCoherence: number;
  attackIntensity: number;
  nodesAtRisk: number;
  avgDetectionTime: number;
  falsePositiveRate: number;
  recoveryEfficiency: number;
  attacksMitigated: number;

  // Agent Metrics
  avgAgentResponse: number;
  virtualInertia: number;
  rewardWeightStatus: string;
  systemCapacity: number;

  // Device Metrics
  deviceMix: { evPercent: number; hvacPercent: number; storagePercent: number };
  assetsReachable: number;
  onlineDevices: number;
  offlineDevices: number;
  controllableLoad: number;

  // Configuration
  vppEnabled: boolean;
  bidirectionalCharging: boolean;
  responseThreshold: number;
  capacityReserved: number;
  criticalWarningLevel: number;
  detectionSensitivity: DetectionSensitivity;
  deceptiveSignalInjection: boolean;
  autonomousEscalation: boolean;
  forecastHorizon: ForecastHorizon;
  skyCamEnabled: boolean;
  primaryGridFeed: string;
  marlLearningRate: number;
  marlDiscountFactor: number;

  // Data source status
  dataSources: { name: string; status: 'connected' | 'disconnected' | 'error' }[];

  // Simulation
  simulationParams: SimulationParams;
  simulationResults: SimulationResults | null;

  // Coherence chart data
  coherenceData: { time: number; value: number; attack: number }[];

  // Forecast alert
  forecastAlert: { event: string; detail: string; probability: number; leadMinutes: number } | null;

  // Alerts
  alerts: Alert[];

  // Actions
  updateFrequency: (val: number) => void;
  toggleVPP: () => void;
  setVPPConfig: (config: Partial<Pick<GridState, 'bidirectionalCharging' | 'responseThreshold' | 'capacityReserved' | 'criticalWarningLevel' | 'detectionSensitivity' | 'deceptiveSignalInjection' | 'autonomousEscalation' | 'forecastHorizon' | 'skyCamEnabled' | 'primaryGridFeed'>>) => void;
  addHistoryPoint: (point: { time: string; value: number }) => void;
  triggerAttack: (type: AttackStatus) => void;
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  resolveAlert: (id: string) => void;
  initializeSystemData: () => void;
  tick: () => void;
  setSimulationParams: (params: Partial<SimulationParams>) => void;
  runSimulation: () => void;
  completeSimulation: () => void;
  addDefenseLogEntry: (entry: DefenseLogEntry) => void;

  // DB sync
  dbReady: boolean;
  loadFromDB: () => Promise<void>;
  saveSnapshot: () => void;
}

// Helper: generate random float in range
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const useGridStore = create<GridState>((set, get) => ({
  // Core — all start empty/zero, filled by initializeSystemData + tick
  frequency: 50.00,
  frequencyHistory: [],
  latency: 0,
  vppResponse: 0,
  solarGeneration: 0,
  loadDemand: 0,
  energySaved: 0,
  dfdt: 0,
  status: 'stable',
  activeAgents: 0,
  agentSyncRate: 0,

  // Adversarial Defense
  attackStatus: 'none',
  phaseCoherence: 0,
  attackIntensity: 0,
  nodesAtRisk: 0,
  avgDetectionTime: 0,
  falsePositiveRate: 0,
  recoveryEfficiency: 0,
  attacksMitigated: 0,

  // Agent metrics
  avgAgentResponse: 0,
  virtualInertia: 0,
  rewardWeightStatus: 'INITIALIZING',
  systemCapacity: 0,

  // Device metrics
  deviceMix: { evPercent: 0, hvacPercent: 0, storagePercent: 0 },
  assetsReachable: 0,
  onlineDevices: 0,
  offlineDevices: 0,
  controllableLoad: 0,

  // Collections — start empty
  agentClusters: [],
  devices: [],
  performanceData: [],
  solarForecast: [],
  shadingEvents: [],
  simulationHistory: [],
  defenseLog: [],
  stabilityZones: [],
  clusterCoverage: [],
  coherenceData: [],
  forecastAlert: null,

  // Configuration
  vppEnabled: true,
  bidirectionalCharging: true,
  responseThreshold: 0.05,
  capacityReserved: 15,
  criticalWarningLevel: 0.25,
  detectionSensitivity: 'medium',
  deceptiveSignalInjection: true,
  autonomousEscalation: true,
  forecastHorizon: '30s',
  skyCamEnabled: true,
  primaryGridFeed: '',
  marlLearningRate: 0.001,
  marlDiscountFactor: 0.95,
  dataSources: [],

  // Simulation
  simulationParams: { scenario: 'ev-mass', intensity: 45, affectedNodes: 60, duration: 30 },
  simulationResults: null,

  alerts: [],

  // DB sync
  dbReady: false,

  initializeSystemData: () => {
    const state = get();
    if (state.frequencyHistory.length > 0) return;

    // Generate local data first (synchronous), then overlay DB data
    set((state) => {
    if (state.frequencyHistory.length > 0) return state;

    const now = new Date();

    // Generate initial frequency history with real timestamps
    const freqHistory = Array.from({ length: 60 }, (_, i) => ({
      time: new Date(now.getTime() - (60 - i) * 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: 50.00 + (Math.random() * 0.04 - 0.02),
    }));

    // Dynamic agent clusters
    const clusterNames = ["Urban Residential", "Industrial Zone", "South Sector PV", "V2G Fleet Hub", "Commercial District", "Rural Solar Farm"];
    const numClusters = randInt(3, 6);
    const clusters: AgentCluster[] = clusterNames.slice(0, numClusters).map(name => ({
      name,
      count: randInt(100, 5000),
      response: randInt(85, 100),
      status: (Math.random() > 0.2 ? 'active' : 'idle') as 'active' | 'idle',
    }));

    // Dynamic devices
    const deviceTypes = ['EV Charger', 'HVAC', 'Home Battery', 'Solar Inverter', 'Smart Meter'];
    const clusterLabels = ['Cluster A', 'Cluster B', 'Cluster C', 'Cluster D'];
    const numDevices = randInt(6, 15);
    const devicesList: Device[] = Array.from({ length: numDevices }, () => {
      const type = deviceTypes[randInt(0, deviceTypes.length)];
      const statusRoll = Math.random();
      const devStatus = statusRoll > 0.15 ? 'online' : statusRoll > 0.05 ? 'responding' : 'offline';
      const loadVal = devStatus === 'offline' ? 0 : rand(-3, 8);
      return {
        id: `${type.substring(0, 2).toUpperCase()}-${randInt(100, 999)}`,
        type,
        status: devStatus as Device['status'],
        load: `${loadVal >= 0 ? '+' : ''}${loadVal.toFixed(1)}kW`,
        cluster: clusterLabels[randInt(0, clusterLabels.length)],
        latency: devStatus === 'offline' ? 'N/A' : `${randInt(5, 80)}ms`,
      };
    });

    // Performance data
    const perfDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const perfData: PerformanceMetric[] = perfDays.map(day => ({
      day,
      stability: rand(90, 99.5),
      savings: rand(600, 1800),
      attacks: Math.random() > 0.6 ? randInt(0, 6) : 0,
    }));

    // Solar forecast
    const forecastPoints: ForecastPoint[] = Array.from({ length: 10 }, (_, i) => {
      const hour = 8 + i;
      return {
        time: `${hour}:00`,
        generation: rand(500, 5000),
        shading: (Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'none') as ForecastPoint['shading'],
      };
    });

    // Shading events
    const numShadingEvents = randInt(2, 6);
    const events: ShadingEvent[] = Array.from({ length: numShadingEvents }, () => ({
      time: `${randInt(10, 17)}:${String(randInt(0, 59)).padStart(2, '0')}`,
      transformer: `T-${randInt(10, 99)}`,
      severity: ['Low', 'Medium', 'High'][randInt(0, 3)],
      duration: `${randInt(5, 25)}m`,
    }));

    // Stability zones
    const zoneNames = ["Zone Alpha (North)", "Zone Beta (West)", "Zone Gamma (South)", "Zone Delta (East)"];
    const loadLevels = ["Low", "Normal", "High", "Surplus"];
    const zones: StabilityZone[] = zoneNames.map((label) => ({
      label,
      freq: 50 + rand(-0.015, 0.015),
      load: loadLevels[randInt(0, 4)],
    }));

    // Cluster coverage
    const coverageClusters: ClusterCoverage[] = [
      { name: "West Sector", assets: randInt(50, 150), stability: rand(80, 99) },
      { name: "Central Hub", assets: randInt(80, 200), stability: rand(80, 99) },
      { name: "East Grid", assets: randInt(40, 120), stability: rand(85, 99) },
    ];

    // Coherence data
    const coherence = Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: rand(0.05, 0.25),
      attack: 0,
    }));

    // Defense metrics
    const avgDetTime = rand(0.8, 3.5);
    const fpRate = rand(0.01, 0.12);
    const recEff = rand(88, 99);
    const attacksMit = randInt(5, 30);

    // Total agents from clusters
    const totalAgents = clusters.reduce((s, c) => s + c.count, 0);

    // Device mix computed from actual devices
    const evCount = devicesList.filter(d => d.type.includes('EV')).length;
    const hvacCount = devicesList.filter(d => d.type.includes('HVAC')).length;
    const total = devicesList.length || 1;
    const evPct = Math.round((evCount / total) * 100);
    const hvacPct = Math.round((hvacCount / total) * 100);
    const storagePct = Math.max(0, 100 - evPct - hvacPct);

    const onlineCount = devicesList.filter(d => d.status !== 'offline').length;
    const offlineCount = devicesList.length - onlineCount;

    // Data sources
    const sources = [
      { name: "Pecan Street API", status: (Math.random() > 0.1 ? 'connected' : 'disconnected') as 'connected' | 'disconnected' },
      { name: "NREL Solar Data", status: (Math.random() > 0.1 ? 'connected' : 'disconnected') as 'connected' | 'disconnected' },
      { name: "GridWatch Live", status: (Math.random() > 0.3 ? 'connected' : 'error') as 'connected' | 'error' },
    ];

    // Forecast alert from shading events
    const upcomingEvent = events.length > 0 ? events[0] : null;
    const fAlert = upcomingEvent ? {
      event: 'Potential Shading Event',
      detail: `${upcomingEvent.transformer} sector in ${upcomingEvent.duration}. Probability: ${randInt(70, 95)}%.`,
      probability: rand(0.7, 0.95),
      leadMinutes: randInt(5, 30),
    } : null;

    // Simulation history
    const scenarios = ["Adversarial Demand Attack", "Sudden Cloud Shading", "Mass EV Charging", "Frequency Cascade", "VPP Outage"];
    const simHistory: SimulationRecord[] = Array.from({ length: randInt(2, 5) }, () => {
      const stability = rand(78, 99);
      return {
        id: `SIM-${String(randInt(1, 999)).padStart(3, '0')}`,
        scenario: scenarios[randInt(0, scenarios.length)],
        date: new Date(now.getTime() - randInt(1, 72) * 3600000).toLocaleString(),
        stability: `${stability.toFixed(0)}%`,
        outcome: stability > 85 ? 'SUCCESS' : 'WARNING',
      };
    });

    return {
      frequencyHistory: freqHistory,
      agentClusters: clusters,
      devices: devicesList,
      performanceData: perfData,
      solarForecast: forecastPoints,
      shadingEvents: events,
      simulationHistory: simHistory,
      stabilityZones: zones,
      clusterCoverage: coverageClusters,
      coherenceData: coherence,
      alerts: [],
      activeAgents: totalAgents,
      agentSyncRate: rand(97, 99.9),
      latency: rand(20, 80),
      solarGeneration: rand(800, 3000),
      loadDemand: rand(2000, 5000),
      energySaved: rand(400, 1500),
      avgDetectionTime: avgDetTime,
      falsePositiveRate: fpRate,
      recoveryEfficiency: recEff,
      attacksMitigated: attacksMit,
      avgAgentResponse: rand(20, 70),
      virtualInertia: rand(0.4, 1.5),
      rewardWeightStatus: Math.random() > 0.5 ? 'MUTATED' : 'STABLE',
      systemCapacity: rand(85, 99),
      deviceMix: { evPercent: evPct, hvacPercent: hvacPct, storagePercent: storagePct },
      assetsReachable: rand(95, 99.9),
      onlineDevices: totalAgents - randInt(50, 300),
      offlineDevices: randInt(50, 300),
      controllableLoad: rand(1, 8),
      forecastAlert: fAlert,
      dataSources: sources,
      primaryGridFeed: 'https://api.aura-sentinel.io/v1/feed',
      dfdt: rand(-0.005, 0.005),
    };
  });

    // Load persistent data from MongoDB (async, overlays config/devices/clusters/simulations)
    get().loadFromDB();
  },

  // Called every tick (~2s) to drift all dynamic values in real-time
  tick: () => {
    // Periodic DB snapshot
    tickCounter++;
    if (tickCounter >= SNAPSHOT_INTERVAL) {
      tickCounter = 0;
      get().saveSnapshot();
    }

    set((state) => {
    if (state.frequencyHistory.length === 0) return state;

    const now = ts();
    const prevFreq = state.frequency;

    // Frequency drift
    const drift = rand(-0.012, 0.012);
    const newFreq = clamp(prevFreq + drift, 49.7, 50.3);
    const dev = Math.abs(50 - newFreq);
    let newStatus: GridStatus = 'stable';
    if (dev > 0.15) newStatus = 'critical';
    else if (dev > 0.08) newStatus = 'warning';

    // df/dt
    const newDfdt = newFreq - prevFreq;

    // VPP response
    const threshold = state.responseThreshold;
    const vpp = newFreq < 50 - threshold ? rand(50, 200) : newFreq > 50 + threshold ? rand(-150, -30) : 0;

    // Latency drift
    const newLatency = clamp(state.latency + rand(-3, 3), 10, 120);

    // Solar generation varies by time of day
    const hour = new Date().getHours();
    const solarBase = hour >= 6 && hour <= 19 ? rand(500, 4000) : rand(0, 100);
    const newSolar = clamp(state.solarGeneration + rand(-50, 50), 0, solarBase + 500);

    // Load demand drift
    const newLoad = clamp(state.loadDemand + rand(-30, 30), 1500, 6000);

    // Energy saved accumulates
    const newEnergySaved = state.energySaved + rand(0.1, 2);

    // Agent metrics drift
    const newAgentResponse = clamp(state.avgAgentResponse + rand(-2, 2), 15, 100);
    const newInertia = clamp(state.virtualInertia + rand(-0.05, 0.05), 0.2, 2.0);
    const agentSync = clamp(state.agentSyncRate + rand(-0.3, 0.3), 95, 99.99);

    // Phase coherence
    let newCoherence = state.phaseCoherence;
    if (state.attackStatus !== 'none') {
      newCoherence = clamp(newCoherence + rand(0.01, 0.05), 0.3, 0.95);
    } else {
      newCoherence = clamp(newCoherence + rand(-0.02, 0.01), 0.02, 0.3);
    }

    // Attack intensity
    const newAttackIntensity = state.attackStatus !== 'none' ? clamp(state.attackIntensity + rand(-0.5, 0.5), 3, 15) : 0;
    const newNodesAtRisk = state.attackStatus !== 'none' ? clamp(state.nodesAtRisk + randInt(-50, 50), 200, 3000) : 0;

    // Controllable load varies
    const newControllableLoad = clamp(state.controllableLoad + rand(-0.2, 0.2), 0.5, 12);

    // Assets reachable
    const newReachable = clamp(state.assetsReachable + rand(-0.2, 0.2), 90, 99.99);

    // Coherence data shifts
    const newCoherenceData = [
      ...state.coherenceData.slice(1),
      {
        time: state.coherenceData.length,
        value: newCoherence,
        attack: state.attackStatus !== 'none' ? rand(0.3, 0.8) : 0,
      }
    ];

    // Stability zones drift
    const newZones = state.stabilityZones.map(z => ({
      ...z,
      freq: clamp(z.freq + rand(-0.003, 0.003), 49.95, 50.05),
    }));

    // Cluster coverage drifts
    const newCoverage = state.clusterCoverage.map(c => ({
      ...c,
      stability: clamp(c.stability + rand(-0.5, 0.5), 75, 99.9),
    }));

    // Defense metrics drift slowly
    const newDetTime = clamp(state.avgDetectionTime + rand(-0.05, 0.05), 0.5, 5);
    const newFpRate = clamp(state.falsePositiveRate + rand(-0.002, 0.002), 0.005, 0.2);
    const newRecEff = clamp(state.recoveryEfficiency + rand(-0.3, 0.3), 80, 99.9);

    // Agent cluster response drifts
    const newClusters = state.agentClusters.map(c => ({
      ...c,
      response: clamp(c.response + rand(-1, 1), 75, 100),
      status: (Math.random() > 0.05 ? c.status : (c.status === 'active' ? 'idle' : 'active')) as 'active' | 'idle',
    }));

    // Occasionally add a defense log entry during attacks
    const newDefenseLog = [...state.defenseLog];
    if (state.attackStatus !== 'none' && Math.random() > 0.6) {
      const actions = [
        "Detected phase alignment anomaly",
        "Injected noise signal",
        "Randomized agent rewards",
        "Frequency drift compensated",
        "Deployed desynchronization signals",
        "Escalated to autonomous defense",
        "Isolated compromised node cluster",
      ];
      const targets = ["Cluster A", "Cluster B", "Sector 4", "Global", "VPP-8", "T-42 Zone"];
      newDefenseLog.unshift({
        time: now,
        action: actions[randInt(0, actions.length)],
        target: targets[randInt(0, targets.length)],
        severity: Math.random() > 0.7 ? 'warning' : 'info',
      });
      if (newDefenseLog.length > 20) newDefenseLog.length = 20;
    }

    // Forecast alert updates occasionally
    let newForecastAlert = state.forecastAlert;
    if (newForecastAlert && Math.random() > 0.95) {
      const transformers = state.shadingEvents.map(e => e.transformer);
      const t = transformers[randInt(0, Math.max(1, transformers.length))] || `T-${randInt(10, 99)}`;
      newForecastAlert = {
        event: 'Potential Shading Event',
        detail: `${t} sector in ${randInt(3, 25)} mins. Probability: ${randInt(65, 95)}%.`,
        probability: rand(0.65, 0.95),
        leadMinutes: randInt(3, 25),
      };
    }

    return {
      frequency: newFreq,
      frequencyHistory: [...state.frequencyHistory.slice(-59), { time: now, value: newFreq }],
      status: newStatus,
      dfdt: newDfdt,
      vppResponse: Math.round(vpp),
      latency: newLatency,
      solarGeneration: Math.round(newSolar),
      loadDemand: Math.round(newLoad),
      energySaved: Math.round(newEnergySaved),
      avgAgentResponse: newAgentResponse,
      virtualInertia: newInertia,
      agentSyncRate: agentSync,
      phaseCoherence: newCoherence,
      attackIntensity: newAttackIntensity,
      nodesAtRisk: newNodesAtRisk,
      coherenceData: newCoherenceData,
      stabilityZones: newZones,
      clusterCoverage: newCoverage,
      avgDetectionTime: newDetTime,
      falsePositiveRate: newFpRate,
      recoveryEfficiency: newRecEff,
      agentClusters: newClusters,
      defenseLog: newDefenseLog,
      controllableLoad: newControllableLoad,
      assetsReachable: newReachable,
      forecastAlert: newForecastAlert,
    };
  });
  },

  updateFrequency: (val) => set((state) => {
    const dev = Math.abs(50 - val);
    let newStatus: GridStatus = 'stable';
    if (dev > 0.15) newStatus = 'critical';
    else if (dev > 0.08) newStatus = 'warning';

    return {
      frequency: val,
      status: newStatus,
      vppResponse: val < 50 - state.responseThreshold ? Math.round(rand(50, 200)) : val > 50 + state.responseThreshold ? Math.round(rand(-150, -30)) : 0,
    };
  }),

  toggleVPP: () => set((state) => {
    const newVal = !state.vppEnabled;
    dbPut('config', { vppEnabled: newVal });
    return { vppEnabled: newVal };
  }),

  setVPPConfig: (config) => {
    set((state) => ({ ...state, ...config }));
    // Persist config to MongoDB
    dbPut('config', config);
  },

  addHistoryPoint: (point) => set((state) => ({
    frequencyHistory: [...state.frequencyHistory.slice(-59), point],
  })),

  triggerAttack: (status) => set(() => {
    if (status === 'none') {
      return {
        attackStatus: 'none' as AttackStatus,
        phaseCoherence: rand(0.05, 0.15),
        attackIntensity: 0,
        nodesAtRisk: 0,
      };
    }
    return {
      attackStatus: status,
      phaseCoherence: rand(0.5, 0.85),
      attackIntensity: rand(5, 12),
      nodesAtRisk: randInt(500, 2500),
    };
  }),

  addAlert: (alert) => set((state) => {
    const newAlert = { ...alert, id: Math.random().toString(36).substr(2, 9) };
    // Persist to MongoDB
    dbPost('alerts', {
      alertId: newAlert.id,
      time: newAlert.time,
      type: newAlert.type,
      severity: newAlert.severity,
      message: newAlert.message,
      status: newAlert.status,
    });
    return { alerts: [newAlert, ...state.alerts].slice(0, 50) };
  }),

  resolveAlert: (id) => set((state) => {
    // Persist to MongoDB
    dbPut('alerts', { alertId: id });
    return { alerts: state.alerts.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a) };
  }),

  setSimulationParams: (params) => set((state) => ({
    simulationParams: { ...state.simulationParams, ...params },
  })),

  runSimulation: () => set((state) => {
    const p = state.simulationParams;
    const maxDev = rand(50, 300);
    const recTime = rand(1.5, 8);
    const energyCurt = rand(50, 500);
    const simFreq = 50 - (maxDev / 1000);

    return {
      simulationResults: {
        maxDeviation: maxDev,
        recoveryTime: recTime,
        energyCurtailed: energyCurt,
        currentFrequency: simFreq,
      },
    };
  }),

  completeSimulation: () => set((state) => {
    const results = state.simulationResults;
    if (!results) return state;

    const stability = 100 - (results.maxDeviation / 10);
    const newRecord: SimulationRecord = {
      id: `SIM-${String(randInt(1, 999)).padStart(3, '0')}`,
      scenario: state.simulationParams.scenario,
      date: new Date().toLocaleString(),
      stability: `${stability.toFixed(0)}%`,
      outcome: stability > 85 ? 'SUCCESS' : 'WARNING',
    };

    // Persist to MongoDB
    dbPost('simulations', {
      simId: newRecord.id,
      scenario: newRecord.scenario,
      date: newRecord.date,
      stability: newRecord.stability,
      outcome: newRecord.outcome,
      params: state.simulationParams,
      results: {
        maxDeviation: results.maxDeviation,
        recoveryTime: results.recoveryTime,
        energyCurtailed: results.energyCurtailed,
      },
    });

    return {
      simulationResults: null,
      simulationHistory: [newRecord, ...state.simulationHistory].slice(0, 20),
    };
  }),

  addDefenseLogEntry: (entry) => set((state) => {
    // Persist to MongoDB
    dbPost('defense-log', entry);
    return { defenseLog: [entry, ...state.defenseLog].slice(0, 20) };
  }),

  // ─── DB Sync Actions ──────────────────────────────────────────────────

  loadFromDB: async () => {
    try {
      // Seed DB if empty (fire-and-forget, idempotent)
      await dbPost('seed', {});

      // Load persistent data in parallel
      const [config, devices, clusters, simulations, alerts, defenseLogs] = await Promise.all([
        dbGet<any>('config'),
        dbGet<any[]>('devices'),
        dbGet<any[]>('clusters'),
        dbGet<any[]>('simulations'),
        dbGet<any[]>('alerts'),
        dbGet<any[]>('defense-log'),
      ]);

      const updates: Partial<GridState> = { dbReady: true };

      if (config) {
        updates.vppEnabled = config.vppEnabled ?? true;
        updates.bidirectionalCharging = config.bidirectionalCharging ?? true;
        updates.responseThreshold = config.responseThreshold ?? 0.05;
        updates.capacityReserved = config.capacityReserved ?? 15;
        updates.criticalWarningLevel = config.criticalWarningLevel ?? 0.25;
        updates.detectionSensitivity = config.detectionSensitivity ?? 'medium';
        updates.deceptiveSignalInjection = config.deceptiveSignalInjection ?? true;
        updates.autonomousEscalation = config.autonomousEscalation ?? true;
        updates.forecastHorizon = config.forecastHorizon ?? '30s';
        updates.skyCamEnabled = config.skyCamEnabled ?? true;
        updates.primaryGridFeed = config.primaryGridFeed ?? '';
        updates.marlLearningRate = config.marlLearningRate ?? 0.001;
        updates.marlDiscountFactor = config.marlDiscountFactor ?? 0.95;
        if (config.dataSources?.length) updates.dataSources = config.dataSources;
      }

      if (devices?.length) {
        updates.devices = devices.map((d: any) => ({
          id: d.deviceId,
          type: d.type,
          status: d.status,
          load: d.load,
          cluster: d.cluster,
          latency: d.latency,
        }));
      }

      if (clusters?.length) {
        updates.agentClusters = clusters.map((c: any) => ({
          name: c.name,
          count: c.count,
          response: c.response,
          status: c.status,
        }));
        updates.activeAgents = clusters.reduce((s: number, c: any) => s + c.count, 0);
      }

      if (simulations?.length) {
        updates.simulationHistory = simulations.map((s: any) => ({
          id: s.simId,
          scenario: s.scenario,
          date: s.date,
          stability: s.stability,
          outcome: s.outcome,
        }));
      }

      if (alerts?.length) {
        updates.alerts = alerts.map((a: any) => ({
          id: a.alertId,
          time: a.time,
          type: a.type,
          severity: a.severity,
          message: a.message,
          status: a.status,
        }));
      }

      if (defenseLogs?.length) {
        updates.defenseLog = defenseLogs.map((d: any) => ({
          time: d.time,
          action: d.action,
          target: d.target,
          severity: d.severity,
        }));
      }

      set(updates as any);
      console.log('✅ Grid store synced with MongoDB');
    } catch (err) {
      console.warn('⚠️ DB load failed, using local data:', err);
      set({ dbReady: true });
    }
  },

  saveSnapshot: () => {
    const state = get();
    dbPost('snapshots', {
      frequency: state.frequency,
      latency: state.latency,
      solarGeneration: state.solarGeneration,
      loadDemand: state.loadDemand,
      energySaved: state.energySaved,
      vppResponse: state.vppResponse,
      dfdt: state.dfdt,
      status: state.status,
      activeAgents: state.activeAgents,
      agentSyncRate: state.agentSyncRate,
      phaseCoherence: state.phaseCoherence,
      attackStatus: state.attackStatus,
      attackIntensity: state.attackIntensity,
      nodesAtRisk: state.nodesAtRisk,
      assetsReachable: state.assetsReachable,
      onlineDevices: state.onlineDevices,
      offlineDevices: state.offlineDevices,
      controllableLoad: state.controllableLoad,
    });
  },
}));