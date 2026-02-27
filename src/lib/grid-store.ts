import { create } from 'zustand';
import {
  initEngines,
  tick as simTick,
  getMARLEngine,
  getPhysicsEngine,
  getForecastEngine,
  getDefenseEngine,
  getSkyCameraEngine,
  setSkyCamEnabled,
  triggerAttack as simTriggerAttack,
  stopAttack as simStopAttack,
  runStressTest,
  injectFrequencyDip,
  injectLoadSpike,
} from './engines/simulation-engine';
import { dbTickHook, loadLatestSnapshot } from './db-sync';

// ── Re-used UI types (backward-compatible with all pages) ────────────

export type AttackStatus = 'none' | 'detected' | 'under-defense';
export type GridStatus   = 'stable' | 'warning' | 'critical';
export type DetectionSensitivity = 'low' | 'medium' | 'high';
export type ForecastHorizon = '10s' | '30s' | '60s';

export interface Alert {
  id: string; time: string; type: string;
  severity: 'info' | 'warning' | 'critical' | 'attack';
  message: string; status: 'active' | 'resolved';
}

export interface AgentCluster {
  name: string; count: number; response: number; status: 'active' | 'idle';
  dominantAction?: string; avgReward?: number;
}

export interface Device {
  id: string; type: string; status: 'online' | 'offline' | 'responding';
  load: string; cluster: string; latency: string;
}

export interface PerformanceMetric { day: string; stability: number; savings: number; attacks: number; }
export interface ForecastPoint { time: string; generation: number; shading: 'none' | 'medium' | 'high'; }
export interface ShadingEvent { time: string; transformer: string; severity: string; duration: string; }
export interface SimulationRecord { id: string; scenario: string; date: string; stability: string; outcome: string; }
export interface DefenseLogEntry { time: string; action: string; target: string; severity: 'info' | 'warning' | 'critical'; }
export interface StabilityZone { label: string; freq: number; load: string; }
export interface ClusterCoverage { name: string; assets: number; stability: number; }
export interface SimulationParams { scenario: string; intensity: number; affectedNodes: number; duration: number; }

export interface SimulationResults {
  maxDeviation: number; recoveryTime: number; energyCurtailed: number;
  currentFrequency: number; avgVPPResponse?: number; attackDetected?: boolean;
}

export interface LiveSimFrame {
  tick: number;
  frequency: number;
  dfdt: number;
  vppMW: number;
  loadMW: number;
  genMW: number;
  attackDetected: boolean;
  status: GridStatus;
}

export type LiveSimStatus = 'idle' | 'running' | 'paused' | 'complete';

// ── NEW: Engine telemetry types ──────────────────────────────────────

export interface MARLTelemetry {
  convergenceRate: number;
  avgReward: number;
  rewardHistory: number[];
  episodeCount: number;
  qTableStats: { avgQ: number; maxQ: number; minQ: number; nonZeroPercent: number };
  frequencyTrackingError: number;
}

export interface DefenseTelemetry {
  spectralAnomaly: number;
  cusumStatistic: number;
  cusumThreshold: number;
  synchronizationIndex: number;
  entropyScore: number;
  loadSpectrum: { frequency: number; magnitude: number }[];
  detectionLatencyMs: number;
}

export interface ForecastTelemetry {
  currentIrradiance: number;
  clearSkyIrradiance: number;
  crps: number;
  pinballLoss: number;
  reliabilityScore: number;
  forecastBands: { timeOffset: number; predicted: number; lower10: number; lower25: number; upper75: number; upper90: number; shadingProb: number }[];
  clouds: { id: string; x: number; y: number; opacity: number; size: number }[];
  transformers: { id: string; name: string; shadingFactor: number; currentGenMW: number; predicted30s: number }[];
}

export interface SkyCameraTelemetry {
  framesProcessed: number;
  avgProcessingMs: number;
  cloudFraction: number;
  blobCount: number;
  avgOpticalDepth: number;
  avgCloudVelocity: number;
  rampAlert: boolean;
  rampMagnitude: number;
  rampLeadTimeSec: number;
}

// ── Full store interface ─────────────────────────────────────────────

export interface GridState {
  frequency: number;
  frequencyHistory: { time: string; value: number }[];
  latency: number;
  vppResponse: number;
  solarGeneration: number;
  loadDemand: number;
  energySaved: number;
  dfdt: number;

  agentClusters: AgentCluster[];
  devices: Device[];
  performanceData: PerformanceMetric[];
  solarForecast: ForecastPoint[];
  shadingEvents: ShadingEvent[];
  simulationHistory: SimulationRecord[];
  defenseLog: DefenseLogEntry[];
  stabilityZones: StabilityZone[];
  clusterCoverage: ClusterCoverage[];

  status: GridStatus;
  activeAgents: number;
  agentSyncRate: number;

  attackStatus: AttackStatus;
  phaseCoherence: number;
  attackIntensity: number;
  nodesAtRisk: number;
  avgDetectionTime: number;
  falsePositiveRate: number;
  recoveryEfficiency: number;
  attacksMitigated: number;

  avgAgentResponse: number;
  virtualInertia: number;
  rewardWeightStatus: string;
  systemCapacity: number;

  deviceMix: { evPercent: number; hvacPercent: number; storagePercent: number };
  assetsReachable: number;
  onlineDevices: number;
  offlineDevices: number;
  controllableLoad: number;

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

  dataSources: { name: string; status: 'connected' | 'disconnected' | 'error' }[];

  simulationParams: SimulationParams;
  simulationResults: SimulationResults | null;

  coherenceData: { time: number; value: number; attack: number }[];
  forecastAlert: { event: string; detail: string; probability: number; leadMinutes: number } | null;
  alerts: Alert[];

  // NEW engine telemetry
  marlTelemetry: MARLTelemetry;
  defenseTelemetry: DefenseTelemetry;
  forecastTelemetry: ForecastTelemetry;
  skyCameraTelemetry: SkyCameraTelemetry;

  // Live simulation state
  liveSimStatus: LiveSimStatus;
  liveSimFrames: LiveSimFrame[];
  liveSimTick: number;
  liveSimTotalTicks: number;
  liveSimTimerId: ReturnType<typeof setInterval> | null;

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

  // Live simulation actions
  startLiveSimulation: () => void;
  pauseLiveSimulation: () => void;
  resumeLiveSimulation: () => void;
  stopLiveSimulation: () => void;
  _liveSimStep: () => void;

  // Engine-backed event injection
  injectEvent: (type: 'freq-dip' | 'load-spike' | 'vpp-loss' | 'demand-attack', magnitude?: number) => void;

  // DB persistence
  _dbSyncAfterTick: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

const rand  = (a: number, b: number) => Math.random() * (b - a) + a;
const randInt = (a: number, b: number) => Math.floor(rand(a, b));
const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── Store creation ───────────────────────────────────────────────────

export const useGridStore = create<GridState>((set, get) => ({
  // ─── Default values ──────────────────────────────────────────
  frequency: 50.0,
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

  attackStatus: 'none',
  phaseCoherence: 0,
  attackIntensity: 0,
  nodesAtRisk: 0,
  avgDetectionTime: 0,
  falsePositiveRate: 0,
  recoveryEfficiency: 0,
  attacksMitigated: 0,

  avgAgentResponse: 0,
  virtualInertia: 0,
  rewardWeightStatus: 'INITIALIZING',
  systemCapacity: 0,

  deviceMix: { evPercent: 0, hvacPercent: 0, storagePercent: 0 },
  assetsReachable: 0,
  onlineDevices: 0,
  offlineDevices: 0,
  controllableLoad: 0,

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

  simulationParams: { scenario: 'ev-mass', intensity: 45, affectedNodes: 60, duration: 30 },
  simulationResults: null,
  alerts: [],

  liveSimStatus: 'idle' as LiveSimStatus,
  liveSimFrames: [] as LiveSimFrame[],
  liveSimTick: 0,
  liveSimTotalTicks: 0,
  liveSimTimerId: null as ReturnType<typeof setInterval> | null,

  marlTelemetry: { convergenceRate: 0, avgReward: 0, rewardHistory: [], episodeCount: 0, qTableStats: { avgQ: 0, maxQ: 0, minQ: 0, nonZeroPercent: 0 }, frequencyTrackingError: 0 },
  defenseTelemetry: { spectralAnomaly: 0, cusumStatistic: 0, cusumThreshold: 15, synchronizationIndex: 0, entropyScore: 1, loadSpectrum: [], detectionLatencyMs: 0 },
  forecastTelemetry: { currentIrradiance: 0, clearSkyIrradiance: 0, crps: 0, pinballLoss: 0, reliabilityScore: 0.85, forecastBands: [], clouds: [], transformers: [] },
  skyCameraTelemetry: { framesProcessed: 0, avgProcessingMs: 0, cloudFraction: 0, blobCount: 0, avgOpticalDepth: 0, avgCloudVelocity: 0, rampAlert: false, rampMagnitude: 0, rampLeadTimeSec: 0 },

  // ════════════════════════════════════════════════════════════════
  // initializeSystemData — boots all four engines
  // ════════════════════════════════════════════════════════════════
  initializeSystemData: () => set((state) => {
    if (state.frequencyHistory.length > 0) return state;

    initEngines({ learningRate: state.marlLearningRate, discountFactor: state.marlDiscountFactor });

    // Async: try restoring from latest DB snapshot (fire-and-forget)
    loadLatestSnapshot().then(({ snapshot }) => {
      if (snapshot && snapshot.agents && snapshot.agents.length > 0) {
        const ml = getMARLEngine();
        if (ml) {
          const ok = ml.restoreFromSnapshot(snapshot.agents);
          if (ok) {
            console.log(`[GridStore] Restored training from snapshot "${snapshot.snapshotId}" (episode ${snapshot.episodeCount})`);
          }
        }
      }
    }).catch(() => { /* non-fatal */ });

    const ml  = getMARLEngine()!;
    const fc  = getForecastEngine()!;
    const now = new Date();

    // Seed frequency history
    const freqHistory = Array.from({ length: 60 }, (_, i) => ({
      time: new Date(now.getTime() - (60 - i) * 2000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: 50.00 + (Math.random() * 0.04 - 0.02),
    }));

    // Clusters from MARL engine
    const clusterInfos = ml.getClusterInfo();
    const clusters: AgentCluster[] = clusterInfos.map(ci => ({
      name: ci.name, count: ci.householdCount,
      response: Math.round(rand(88, 100)), status: ci.status,
      dominantAction: ci.dominantAction, avgReward: ci.avgReward,
    }));

    // Device list - representative sample from MARL devices
    const deviceTypes = ['EV Charger', 'HVAC', 'Home Battery', 'Solar Inverter', 'Smart Meter'];
    const clusterLabels = clusterInfos.map(c => c.name);
    const devicesList: Device[] = Array.from({ length: 12 }, () => {
      const type = deviceTypes[randInt(0, deviceTypes.length)];
      const sr = Math.random();
      const st = sr > 0.15 ? 'online' : sr > 0.05 ? 'responding' : 'offline';
      const lv = st === 'offline' ? 0 : rand(-3, 8);
      return {
        id: `${type.substring(0, 2).toUpperCase()}-${randInt(100, 999)}`,
        type, status: st as Device['status'],
        load: `${lv >= 0 ? '+' : ''}${lv.toFixed(1)}kW`,
        cluster: clusterLabels[randInt(0, clusterLabels.length)],
        latency: st === 'offline' ? 'N/A' : `${randInt(5, 80)}ms`,
      };
    });

    // Performance data
    const perfData: PerformanceMetric[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({
      day, stability: rand(90, 99.5), savings: rand(600, 1800),
      attacks: Math.random() > 0.6 ? randInt(0, 6) : 0,
    }));

    // Solar forecast from engine
    const fm = fc.step();
    const forecastPoints: ForecastPoint[] = Array.from({ length: 10 }, (_, i) => {
      const tr = fm.transformers[i % fm.transformers.length];
      return {
        time: `${8 + i}:00`,
        generation: tr ? Math.round(tr.currentGeneration) : Math.round(rand(500, 5000)),
        shading: (tr && tr.shadingFactor > 0.5 ? 'high' : tr && tr.shadingFactor > 0.2 ? 'medium' : 'none') as ForecastPoint['shading'],
      };
    });

    const shadingEvs: ShadingEvent[] = fm.shadingEvents.length > 0
      ? fm.shadingEvents.map(e => ({
          time: new Date(Date.now() + e.leadTimeSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          transformer: e.transformerName, severity: e.severity.charAt(0).toUpperCase() + e.severity.slice(1),
          duration: `${Math.round(e.durationSec / 60)}m`,
        }))
      : [{ time: 'N/A', transformer: 'T-42', severity: 'Low', duration: '5m' }];

    const zones: StabilityZone[] = ['Zone Alpha (North)', 'Zone Beta (West)', 'Zone Gamma (South)', 'Zone Delta (East)'].map(label => ({
      label, freq: 50 + rand(-0.015, 0.015), load: ['Low', 'Normal', 'High', 'Surplus'][randInt(0, 4)],
    }));

    const coverage: ClusterCoverage[] = fm.transformers.slice(0, 3).map(t => ({
      name: t.name, assets: randInt(50, 200), stability: rand(80, 99),
    }));

    const coherence = Array.from({ length: 20 }, (_, i) => ({ time: i, value: rand(0.05, 0.25), attack: 0 }));

    const ds = ml.getDeviceStats();
    const total = ds.totalDevices || 1;
    const evPct = Math.round((ds.evCount / total) * 100);
    const hvacPct = Math.round((ds.hvacCount / total) * 100);

    const sources = [
      { name: 'Pecan Street API', status: 'connected' as const },
      { name: 'NREL Solar Data', status: 'connected' as const },
      { name: 'GridWatch Live', status: (Math.random() > 0.3 ? 'connected' : 'error') as 'connected' | 'error' },
    ];

    const fAlert = fm.shadingEvents.length > 0 ? {
      event: 'Potential Shading Event',
      detail: `${fm.shadingEvents[0].transformerName} sector in ${Math.round(fm.shadingEvents[0].durationSec / 60)} mins. Probability: ${Math.round(fm.shadingEvents[0].probability * 100)}%.`,
      probability: fm.shadingEvents[0].probability, leadMinutes: Math.round(fm.shadingEvents[0].leadTimeSec / 60) || 1,
    } : null;

    const scenarios = ['Adversarial Demand Attack', 'Sudden Cloud Shading', 'Mass EV Charging', 'Frequency Cascade', 'VPP Outage'];
    const simHistory: SimulationRecord[] = Array.from({ length: randInt(2, 5) }, () => {
      const s = rand(78, 99);
      return {
        id: `SIM-${String(randInt(1, 999)).padStart(3, '0')}`,
        scenario: scenarios[randInt(0, scenarios.length)],
        date: new Date(now.getTime() - randInt(1, 72) * 3600000).toLocaleString(),
        stability: `${s.toFixed(0)}%`, outcome: s > 85 ? 'SUCCESS' : 'WARNING',
      };
    });

    return {
      frequencyHistory: freqHistory, agentClusters: clusters, devices: devicesList,
      performanceData: perfData, solarForecast: forecastPoints, shadingEvents: shadingEvs,
      simulationHistory: simHistory, stabilityZones: zones, clusterCoverage: coverage,
      coherenceData: coherence, alerts: [],
      activeAgents: ds.totalDevices, agentSyncRate: rand(97, 99.9),
      latency: rand(20, 50), solarGeneration: Math.round(fm.totalGenerationMW * 1000),
      loadDemand: Math.round(getPhysicsEngine()?.state.totalLoad ?? 3000),
      energySaved: rand(400, 1500), avgDetectionTime: rand(0.8, 3.5),
      falsePositiveRate: rand(0.01, 0.12), recoveryEfficiency: rand(88, 99),
      attacksMitigated: randInt(5, 30), avgAgentResponse: rand(20, 50),
      virtualInertia: rand(0.4, 1.5), rewardWeightStatus: 'INITIALIZING',
      systemCapacity: rand(85, 99),
      deviceMix: { evPercent: evPct, hvacPercent: hvacPct, storagePercent: Math.max(0, 100 - evPct - hvacPct) },
      assetsReachable: rand(95, 99.9), onlineDevices: ds.totalDevices - randInt(50, 300),
      offlineDevices: randInt(50, 300), controllableLoad: ds.totalControllableLoadMW,
      forecastAlert: fAlert, dataSources: sources,
      primaryGridFeed: 'https://api.aura-sentinel.io/v1/feed', dfdt: rand(-0.005, 0.005),
    };
  }),

  // ════════════════════════════════════════════════════════════════
  // tick — called every ~2 s, drives ALL engines
  // ════════════════════════════════════════════════════════════════
  tick: () => set((state) => {
    if (state.frequencyHistory.length === 0) return state;
    const now = ts();

    // ── Run full engine tick ──
    const res = simTick({
      vppEnabled: state.vppEnabled,
      responseThreshold: state.responseThreshold,
      deceptiveSignalInjection: state.deceptiveSignalInjection,
      detectionSensitivity: state.detectionSensitivity,
      capacityReservedPercent: state.capacityReserved,
      bidirectionalCharging: state.bidirectionalCharging,
      autonomousEscalation: state.autonomousEscalation,
      forecastHorizon: state.forecastHorizon,
    });

    const ph = res.physics;
    const mm = res.marl;
    const fm = res.forecast;
    const dm = res.defense;
    const scm = res.skyCamera;

    // Grid status from physics
    const dev = Math.abs(ph.frequency - 50);
    const newStatus: GridStatus = dev > 0.15 ? 'critical' : dev > 0.08 ? 'warning' : 'stable';

    // MARL cluster data
    const ml = getMARLEngine()!;
    const clusterInfos = ml.getClusterInfo();
    const clusters: AgentCluster[] = clusterInfos.map(ci => ({
      name: ci.name, count: ci.householdCount,
      response: Math.round(clamp(ci.avgResponse * 100 + 85, 75, 100)),
      status: ci.status, dominantAction: ci.dominantAction, avgReward: ci.avgReward,
    }));

    // Device stats from MARL
    const ds = ml.getDeviceStats();
    const total = ds.totalDevices || 1;
    const evPct = Math.round((ds.evCount / total) * 100);
    const hvacPct = Math.round((ds.hvacCount / total) * 100);

    // Coherence chart
    const newCoherenceData = [
      ...state.coherenceData.slice(1),
      { time: state.coherenceData.length, value: dm.phaseCoherence, attack: dm.attackDetected ? dm.spectralAnomaly : 0 },
    ];

    // Defense log
    const newDefenseLog = [...state.defenseLog];
    for (const act of dm.defenseActions) {
      newDefenseLog.unshift({
        time: new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action: act.description || act.action, target: act.target, severity: act.severity,
      });
    }
    if (newDefenseLog.length > 20) newDefenseLog.length = 20;

    // Zones drift
    const newZones = state.stabilityZones.map(z => ({ ...z, freq: clamp(z.freq + rand(-0.003, 0.003), 49.95, 50.05) }));
    const newCoverage = state.clusterCoverage.map(c => ({ ...c, stability: clamp(c.stability + rand(-0.5, 0.5), 75, 99.9) }));

    // Forecast alert
    let newForecastAlert = state.forecastAlert;
    if (fm.shadingEvents.length > 0) {
      const ev = fm.shadingEvents[0];
      newForecastAlert = {
        event: 'Potential Shading Event',
        detail: `${ev.transformerName} sector in ${Math.round(ev.leadTimeSec)}s. Probability: ${Math.round(ev.probability * 100)}%.`,
        probability: ev.probability, leadMinutes: Math.round(ev.leadTimeSec / 60) || 1,
      };
    }

    // Solar forecast and shading events
    const forecastUpdate: ForecastPoint[] = fm.transformers.slice(0, 10).map((t, i) => ({
      time: `${8 + i}:00`, generation: Math.round(t.currentGeneration),
      shading: (t.shadingFactor > 0.5 ? 'high' : t.shadingFactor > 0.2 ? 'medium' : 'none') as ForecastPoint['shading'],
    }));

    const shadingUpdate: ShadingEvent[] = fm.shadingEvents.map(e => ({
      time: new Date(Date.now() + e.leadTimeSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      transformer: e.transformerName, severity: e.severity.charAt(0).toUpperCase() + e.severity.slice(1),
      duration: `${Math.round(e.durationSec / 60)}m`,
    }));

    // ── Build engine telemetry ──
    const marlTelemetry: MARLTelemetry = {
      convergenceRate: mm.convergenceRate, avgReward: mm.avgReward, rewardHistory: mm.rewardHistory,
      episodeCount: mm.episodeCount, qTableStats: mm.qTableStats, frequencyTrackingError: mm.frequencyTrackingError,
    };

    const defenseTelemetry: DefenseTelemetry = {
      spectralAnomaly: dm.spectralAnomaly, cusumStatistic: dm.cusumStatistic, cusumThreshold: dm.cusumThreshold,
      synchronizationIndex: dm.synchronizationIndex, entropyScore: dm.entropyScore,
      loadSpectrum: dm.loadSpectrum, detectionLatencyMs: dm.detectionLatencyMs,
    };

    const forecastTelemetry: ForecastTelemetry = {
      currentIrradiance: fm.currentIrradiance, clearSkyIrradiance: fm.clearSkyIrradiance,
      crps: fm.crps, pinballLoss: fm.pinballLoss, reliabilityScore: fm.reliabilityScore,
      forecastBands: fm.forecast30s.map(b => ({ timeOffset: b.timeOffset, predicted: b.predicted, lower10: b.lower10, lower25: b.lower25, upper75: b.upper75, upper90: b.upper90, shadingProb: b.shadingProb })),
      clouds: fm.clouds.map(c => ({ id: c.id, x: c.position.x, y: c.position.y, opacity: c.opacity, size: c.size })),
      transformers: fm.transformers.map(t => ({ id: t.id, name: t.name, shadingFactor: t.shadingFactor, currentGenMW: t.currentGeneration / 1000, predicted30s: t.predictedShading30s })),
    };

    // ── Auto-generate alerts from engine state ──
    const newAlerts = [...state.alerts];
    if (dev > 0.15 && (state.alerts.length === 0 || state.alerts[0]?.type !== 'FREQ_CRITICAL')) {
      newAlerts.unshift({ id: Math.random().toString(36).substr(2, 9), time: now, type: 'FREQ_CRITICAL', severity: 'critical', message: `Frequency deviation ${(dev * 1000).toFixed(0)} mHz exceeds critical threshold (150 mHz)`, status: 'active' });
    } else if (dev > 0.08 && (state.alerts.length === 0 || state.alerts[0]?.type !== 'FREQ_WARNING')) {
      newAlerts.unshift({ id: Math.random().toString(36).substr(2, 9), time: now, type: 'FREQ_WARNING', severity: 'warning', message: `Frequency deviation ${(dev * 1000).toFixed(0)} mHz — approaching critical band`, status: 'active' });
    }
    if (dm.attackDetected && (state.alerts.length === 0 || state.alerts[0]?.type !== 'ATTACK')) {
      newAlerts.unshift({ id: Math.random().toString(36).substr(2, 9), time: now, type: 'ATTACK', severity: 'attack', message: `Attack detected — spectral anomaly ${(dm.spectralAnomaly * 100).toFixed(0)}%, phase coherence ${(dm.phaseCoherence * 100).toFixed(0)}%`, status: 'active' });
    }
    if (scm && scm.rampAlert && (state.alerts.length === 0 || state.alerts[0]?.type !== 'RAMP_ALERT')) {
      newAlerts.unshift({ id: Math.random().toString(36).substr(2, 9), time: now, type: 'RAMP_ALERT', severity: 'warning', message: `Sky-camera ramp alert: ${(scm.rampMagnitude * 100).toFixed(0)}% irradiance change in ${scm.rampLeadTimeSec.toFixed(0)}s`, status: 'active' });
    }
    // Auto-resolve stale alerts
    for (const a of newAlerts) {
      if (a.status === 'active') {
        if (a.type === 'FREQ_CRITICAL' && dev <= 0.10) a.status = 'resolved';
        if (a.type === 'FREQ_WARNING'  && dev <= 0.05) a.status = 'resolved';
        if (a.type === 'ATTACK' && !dm.attackDetected) a.status = 'resolved';
        if (a.type === 'RAMP_ALERT' && scm && !scm.rampAlert) a.status = 'resolved';
      }
    }
    if (newAlerts.length > 50) newAlerts.length = 50;

    // ── Rolling performanceData — 7-entry window updated every tick ──
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const todayLabel = dayNames[new Date().getDay()];
    const stabilityPct = Math.max(0, 100 - dev * 500); // 0.2Hz deviation → 0% stability
    const savingsKwh = Math.abs(mm.totalVPPResponseMW) * 2 / 3.6; // 2s tick worth of VPP
    const attacksToday = dm.attackDetected ? 1 : 0;
    const newPerformanceData = [...state.performanceData];
    if (newPerformanceData.length > 0) {
      const last = newPerformanceData[newPerformanceData.length - 1];
      if (last.day === todayLabel) {
        // Rolling average for stability, accumulating for savings/attacks
        last.stability = last.stability * 0.95 + stabilityPct * 0.05;
        last.savings += savingsKwh;
        last.attacks += attacksToday;
      } else {
        newPerformanceData.push({ day: todayLabel, stability: stabilityPct, savings: savingsKwh, attacks: attacksToday });
        if (newPerformanceData.length > 7) newPerformanceData.shift();
      }
    }

    // ── Real device table from MARL agents (representative sample) ──
    const agents = ml.agents;
    const clusterNames = clusterInfos.map(ci => ci.name);
    const sampleAgents = agents.filter((_, i) => i % 10 === 0).slice(0, 20); // every 10th agent
    const newDeviceTable: Device[] = sampleAgents.flatMap(agent => {
      const cName = clusterNames[agent.clusterId] || `Cluster ${agent.clusterId}`;
      return agent.devices.map((d, di) => {
        const typeLabel = d.type === 'ev' ? 'EV Charger' : d.type === 'hvac' ? 'HVAC' : d.type === 'battery' ? 'Home Battery' : 'Smart Appliance';
        const st = d.currentPower === 0 && d.type !== 'hvac' ? 'offline' : agent.lastAction !== 0 ? 'responding' : 'online';
        return {
          id: `${agent.id}-D${di}`,
          type: typeLabel,
          status: st as Device['status'],
          load: `${d.currentPower >= 0 ? '+' : ''}${d.currentPower.toFixed(1)}kW`,
          cluster: cName,
          latency: st === 'offline' ? 'N/A' : `${(agent.responseTimeUs / 1000).toFixed(1)}ms`,
        };
      });
    });

    return {
      frequency: ph.frequency, dfdt: ph.dfdt, status: newStatus,
      frequencyHistory: [...state.frequencyHistory.slice(-59), { time: now, value: ph.frequency }],
      vppResponse: Math.round(mm.totalVPPResponseMW),
      latency: clamp(mm.avgResponseTimeMs, 0.01, 120),
      solarGeneration: Math.round(fm.totalGenerationMW * 1000),
      loadDemand: Math.round(ph.totalLoad),
      // Energy saved: cumulative VPP injection × tick interval (2s → hours)
      energySaved: Math.round(state.energySaved + Math.abs(mm.totalVPPResponseMW) * (2 / 3600) * 1000), // kWh

      agentClusters: clusters,
      activeAgents: ds.totalDevices,
      agentSyncRate: clamp(100 - mm.frequencyTrackingError * 10, 95, 99.99),
      avgAgentResponse: clamp(mm.avgResponseTimeMs, 0.01, 100),
      virtualInertia: mm.virtualInertia,
      rewardWeightStatus: ml.getRewardWeightStatus(),
      systemCapacity: clamp(ds.totalControllableLoadMW / 10 * 100, 50, 99),

      attackStatus: dm.attackStatus as AttackStatus,
      phaseCoherence: dm.phaseCoherence,
      attackIntensity: dm.attackIntensity,
      nodesAtRisk: dm.nodesAtRisk,
      avgDetectionTime: dm.detectionLatencyMs,
      falsePositiveRate: dm.falsePositiveRate,
      recoveryEfficiency: dm.recoveryEfficiency,
      attacksMitigated: dm.attacksMitigated,

      deviceMix: { evPercent: evPct, hvacPercent: hvacPct, storagePercent: Math.max(0, 100 - evPct - hvacPct) },
      assetsReachable: clamp(98 - (ds.totalDevices - ds.evCount - ds.hvacCount) * 0.001, 90, 99.9),
      onlineDevices: ds.totalDevices - ds.batteryCount, // derive from actual stats
      offlineDevices: ds.batteryCount, // battery-only units counted as offline (no comms)
      controllableLoad: ds.totalControllableLoadMW,

      // Real device table from MARL agents (representative sample)
      devices: newDeviceTable,

      // Rolling performanceData — shift in latest tick metrics
      performanceData: newPerformanceData,

      // Auto-generated alerts
      alerts: newAlerts,

      coherenceData: newCoherenceData,
      defenseLog: newDefenseLog,
      stabilityZones: newZones,
      clusterCoverage: newCoverage,
      forecastAlert: newForecastAlert,
      solarForecast: forecastUpdate.length > 0 ? forecastUpdate : state.solarForecast,
      shadingEvents: shadingUpdate.length > 0 ? shadingUpdate : state.shadingEvents,

      marlTelemetry, defenseTelemetry, forecastTelemetry,
      skyCameraTelemetry: scm ? {
        framesProcessed: scm.framesProcessed, avgProcessingMs: scm.avgProcessingMs,
        cloudFraction: scm.cloudFraction, blobCount: scm.blobCount,
        avgOpticalDepth: scm.avgOpticalDepth, avgCloudVelocity: scm.avgCloudVelocity,
        rampAlert: scm.rampAlert, rampMagnitude: scm.rampMagnitude, rampLeadTimeSec: scm.rampLeadTimeSec,
      } : state.skyCameraTelemetry,
    };
  }),

  // ════════════════════════════════════════════════════════════════
  // DB persistence hook — fires after every tick return
  // Wrapped in a separate set() call so it doesn't delay the UI update
  // ════════════════════════════════════════════════════════════════
  _dbSyncAfterTick: () => {
    const s = get();
    const ml = getMARLEngine();
    if (!ml) return;

    // Build new alerts for this tick (compare IDs)
    const tickAlerts = s.alerts.filter(a => a.status === 'active').map(a => ({
      alertId: a.id, time: a.time, type: a.type,
      severity: a.severity, message: a.message, status: a.status,
      frequency: s.frequency, dfdt: s.dfdt, attackIntensity: s.attackIntensity,
    }));

    dbTickHook({
      tickNumber: s.marlTelemetry.episodeCount,
      getSnapshot: () => {
        const agents = ml.serializeAgents();
        return {
          snapshotId: `auto-ep-${s.marlTelemetry.episodeCount}`,
          episodeCount: s.marlTelemetry.episodeCount,
          avgReward: s.marlTelemetry.avgReward,
          convergenceRate: s.marlTelemetry.convergenceRate,
          frequencyTrackingError: s.marlTelemetry.frequencyTrackingError,
          qTableStats: s.marlTelemetry.qTableStats,
          hyperparams: ml.getHyperparams(),
          agents,
        };
      },
      metric: {
        tick: s.marlTelemetry.episodeCount,
        frequency: s.frequency, dfdt: s.dfdt,
        totalLoad: s.loadDemand, totalGeneration: s.solarGeneration,
        renewableGeneration: s.solarGeneration, vppResponseMW: s.vppResponse,
        solarGenerationKW: s.solarGeneration,
        marlAvgReward: s.marlTelemetry.avgReward,
        marlConvergence: s.marlTelemetry.convergenceRate,
        marlEpisode: s.marlTelemetry.episodeCount,
        marlVirtualInertia: s.virtualInertia,
        avgResponseTimeMs: s.avgAgentResponse,
        attackDetected: s.attackStatus !== 'none',
        phaseCoherence: s.phaseCoherence,
        spectralAnomaly: s.defenseTelemetry.spectralAnomaly,
        cusumStatistic: s.defenseTelemetry.cusumStatistic,
        crps: s.forecastTelemetry.crps,
        reliabilityScore: s.forecastTelemetry.reliabilityScore,
        cloudCoverage: s.skyCameraTelemetry.cloudFraction,
        rampAlert: s.skyCameraTelemetry.rampAlert,
        rampMagnitude: s.skyCameraTelemetry.rampMagnitude,
      },
      newAlerts: tickAlerts,
    });
  },

  // ════════════════════════════════════════════════════════════════
  // Actions
  // ════════════════════════════════════════════════════════════════
  updateFrequency: (val) => {
    const ph = getPhysicsEngine();
    if (ph) ph.state.frequency = val;
    set(() => {
      const d = Math.abs(50 - val);
      return { frequency: val, status: (d > 0.15 ? 'critical' : d > 0.08 ? 'warning' : 'stable') as GridStatus };
    });
  },

  toggleVPP: () => set((s) => ({ vppEnabled: !s.vppEnabled })),
  setVPPConfig: (config) => {
    if (config.skyCamEnabled !== undefined) setSkyCamEnabled(config.skyCamEnabled);
    set((s) => ({ ...s, ...config }));
  },

  addHistoryPoint: (pt) => set((s) => ({ frequencyHistory: [...s.frequencyHistory.slice(-59), pt] })),

  triggerAttack: (status) => {
    if (status === 'none') {
      simStopAttack();
      set({ attackStatus: 'none', phaseCoherence: rand(0.05, 0.15), attackIntensity: 0, nodesAtRisk: 0 });
    } else {
      simTriggerAttack('load_sync', 0.6);
      set({ attackStatus: status, phaseCoherence: rand(0.5, 0.85), attackIntensity: rand(5, 12), nodesAtRisk: randInt(500, 2500) });
    }
  },

  addAlert: (alert) => set((s) => ({
    alerts: [{ ...alert, id: Math.random().toString(36).substr(2, 9) }, ...s.alerts].slice(0, 50),
  })),
  resolveAlert: (id) => set((s) => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, status: 'resolved' } : a) })),

  setSimulationParams: (params) => set((s) => ({ simulationParams: { ...s.simulationParams, ...params } })),

  runSimulation: () => set((state) => {
    const p = state.simulationParams;
    const result = runStressTest({
      scenario: p.scenario, intensity: p.intensity, affectedNodes: p.affectedNodes,
      duration: Math.max(5, Math.round(p.duration / 2)),
      vppEnabled: state.vppEnabled, responseThreshold: state.responseThreshold,
      deceptiveSignalInjection: state.deceptiveSignalInjection, detectionSensitivity: state.detectionSensitivity,
    });
    return {
      simulationResults: {
        maxDeviation: result.maxDeviation, recoveryTime: result.recoveryTime,
        energyCurtailed: result.energyCurtailed, currentFrequency: result.finalFrequency,
        avgVPPResponse: result.avgVPPResponse, attackDetected: result.attackDetected,
      },
    };
  }),

  completeSimulation: () => set((state) => {
    const r = state.simulationResults;
    if (!r) return state;
    const stab = Math.max(0, 100 - r.maxDeviation / 10);
    const rec: SimulationRecord = {
      id: `SIM-${String(randInt(1, 999)).padStart(3, '0')}`,
      scenario: state.simulationParams.scenario, date: new Date().toLocaleString(),
      stability: `${stab.toFixed(0)}%`, outcome: stab > 85 ? 'SUCCESS' : 'WARNING',
    };
    return { simulationResults: null, simulationHistory: [rec, ...state.simulationHistory].slice(0, 20) };
  }),

  addDefenseLogEntry: (entry) => set((s) => ({ defenseLog: [entry, ...s.defenseLog].slice(0, 20) })),

  // ════════════════════════════════════════════════════════════════
  // Live Simulation — runs the stress test tick-by-tick with
  // animated frame output at ~500ms intervals
  // ════════════════════════════════════════════════════════════════
  startLiveSimulation: () => {
    const state = get();
    // Stop any existing live sim
    if (state.liveSimTimerId) clearInterval(state.liveSimTimerId);

    const p = state.simulationParams;
    const totalTicks = Math.max(5, Math.round(p.duration / 2));

    // Inject the scenario into the live engines
    const ph = getPhysicsEngine();
    const df = getDefenseEngine();
    if (!ph) return;

    const mwImpact = (p.intensity / 100) * 500;
    switch (p.scenario) {
      case 'adversarial':
        df?.simulateAttack('load_sync', p.intensity / 100);
        break;
      case 'cloud-shading':
        ph.state.renewableGeneration *= (1 - p.intensity / 100);
        ph.state.totalGeneration = ph.state.conventionalGeneration + ph.state.renewableGeneration;
        break;
      case 'ev-mass':
        ph.state.totalLoad += mwImpact;
        break;
      case 'freq-dip':
        ph.state.frequency -= (p.intensity / 100) * 0.5;
        break;
    }

    set({ liveSimStatus: 'running', liveSimFrames: [], liveSimTick: 0, liveSimTotalTicks: totalTicks, simulationResults: null });

    // Start the interval
    const timerId = setInterval(() => get()._liveSimStep(), 500);
    set({ liveSimTimerId: timerId });
  },

  _liveSimStep: () => {
    const state = get();
    if (state.liveSimStatus !== 'running') return;

    const currentTick = state.liveSimTick;
    if (currentTick >= state.liveSimTotalTicks) {
      // Simulation complete
      if (state.liveSimTimerId) clearInterval(state.liveSimTimerId);
      const frames = state.liveSimFrames;
      const maxDev = frames.reduce((mx, f) => Math.max(mx, Math.abs(f.frequency - 50) * 1000), 0);
      const recFrame = frames.findIndex(f => Math.abs(f.frequency - 50) < 0.02);
      const recoverySec = recFrame >= 0 ? recFrame * 2 : state.liveSimTotalTicks * 2;
      const totalVPP = frames.reduce((s, f) => s + Math.abs(f.vppMW), 0);
      const detected = frames.some(f => f.attackDetected);
      const last = frames[frames.length - 1];

      // Clean up attack
      if (state.simulationParams.scenario === 'adversarial') simStopAttack();

      set({
        liveSimStatus: 'complete',
        liveSimTimerId: null,
        simulationResults: {
          maxDeviation: maxDev,
          recoveryTime: recoverySec,
          energyCurtailed: maxDev * recoverySec / 3600,
          currentFrequency: last?.frequency ?? 50,
          avgVPPResponse: totalVPP / Math.max(1, frames.length),
          attackDetected: detected,
        },
      });
      return;
    }

    // Run one engine tick
    const res = simTick({
      vppEnabled: state.vppEnabled,
      responseThreshold: state.responseThreshold,
      deceptiveSignalInjection: state.deceptiveSignalInjection,
      detectionSensitivity: state.detectionSensitivity,
    });

    const ph = res.physics;
    const dev = Math.abs(ph.frequency - 50);
    const frame: LiveSimFrame = {
      tick: currentTick,
      frequency: ph.frequency,
      dfdt: ph.dfdt,
      vppMW: res.marl.totalVPPResponseMW,
      loadMW: ph.totalLoad,
      genMW: ph.totalGeneration,
      attackDetected: res.defense.attackDetected,
      status: dev > 0.15 ? 'critical' : dev > 0.08 ? 'warning' : 'stable',
    };

    set({
      liveSimTick: currentTick + 1,
      liveSimFrames: [...state.liveSimFrames, frame],
      frequency: ph.frequency,
      dfdt: ph.dfdt,
      status: frame.status,
    });
  },

  pauseLiveSimulation: () => {
    const state = get();
    if (state.liveSimTimerId) clearInterval(state.liveSimTimerId);
    set({ liveSimStatus: 'paused', liveSimTimerId: null });
  },

  resumeLiveSimulation: () => {
    const state = get();
    if (state.liveSimStatus !== 'paused') return;
    const timerId = setInterval(() => get()._liveSimStep(), 500);
    set({ liveSimStatus: 'running', liveSimTimerId: timerId });
  },

  stopLiveSimulation: () => {
    const state = get();
    if (state.liveSimTimerId) clearInterval(state.liveSimTimerId);
    simStopAttack();
    set({ liveSimStatus: 'idle', liveSimTimerId: null, liveSimFrames: [], liveSimTick: 0 });
  },

  // ════════════════════════════════════════════════════════════════
  // Engine-backed event injection (used by EventInjector)
  // ════════════════════════════════════════════════════════════════
  injectEvent: (type, magnitude = 150) => {
    switch (type) {
      case 'freq-dip':
        injectFrequencyDip(magnitude); // mHz
        break;
      case 'load-spike':
        injectLoadSpike(magnitude);    // MW
        break;
      case 'vpp-loss': {
        const ph = getPhysicsEngine();
        if (ph) ph.state.renewableGeneration *= 0.8;
        break;
      }
      case 'demand-attack':
        simTriggerAttack('load_sync', 0.6);
        set({ attackStatus: 'detected' });
        // Auto-clear after 10 seconds
        setTimeout(() => {
          simStopAttack();
          set({ attackStatus: 'none' });
        }, 10000);
        break;
    }
  },
}));
