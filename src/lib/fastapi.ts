/**
 * FastAPI Client — typed REST API helper for the Python backend.
 * All pages use this to make REST calls to the FastAPI server.
 */

const API_BASE = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export const fastapi = {
  /** Generic GET */
  async get<T = any>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  },

  /** Generic POST */
  async post<T = any>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  },

  // ── Typed endpoint helpers ────────────────────────────────────────

  // Stats
  stats: () => fastapi.get<StatsResponse>('/api/stats/summary'),

  // Frequency
  frequencyLive: () => fastapi.get<FreqLive>('/api/frequency/live'),
  frequencyDetail: () => fastapi.get('/api/frequency/detail'),
  frequencyHistory: (limit = 200) => fastapi.get(`/api/frequency/history?limit=${limit}`),

  // Forecast
  forecastLive: () => fastapi.get('/api/forecast/live'),
  shadowVelocity: () => fastapi.get('/api/forecast/shadow-velocity'),
  transformerRisk: () => fastapi.get('/api/forecast/transformer-risk'),
  forecastAccuracy: () => fastapi.get('/api/forecast/accuracy-history'),
  solarHistory: () => fastapi.get('/api/forecast/history'),

  // Agents
  agentGrid: () => fastapi.get('/api/agents/grid-status'),
  agentClusters: () => fastapi.get('/api/agents/clusters'),
  agentInertia: () => fastapi.get('/api/agents/inertia'),
  agentReward: () => fastapi.get('/api/agents/reward-state'),
  agentResponseLog: () => fastapi.get('/api/agents/response-log'),
  agentOverride: (clusterId: string, action: string) =>
    fastapi.post('/api/agents/override', { cluster_id: clusterId, action }),

  // Defense
  defenseStatus: () => fastapi.get('/api/defense/status'),
  coherenceHistory: () => fastapi.get('/api/defense/coherence-history'),
  applianceSync: () => fastapi.get('/api/defense/appliance-sync'),
  defenseLog: () => fastapi.get('/api/defense/action-log'),
  desyncStrength: () => fastapi.get('/api/defense/desync-strength'),
  simulateAttack: (intensity = 2) =>
    fastapi.post('/api/defense/simulate-attack', { intensity }),

  // VPP
  vppMap: () => fastapi.get('/api/vpp/transformer-map'),
  vppClusters: () => fastapi.get('/api/vpp/clusters'),
  vppFormationLog: () => fastapi.get('/api/vpp/formation-log'),
  vppCapacity: () => fastapi.get('/api/vpp/capacity'),
  vppCapacityHistory: () => fastapi.get('/api/vpp/capacity-history'),

  // Devices
  devices: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fastapi.get(`/api/devices${qs}`);
  },
  deviceBreakdown: () => fastapi.get('/api/devices/breakdown'),
  deviceHistory: (id: string) => fastapi.get(`/api/devices/${id}/history`),
  deviceLoadHistory: () => fastapi.get('/api/devices/load-history'),
  deviceBatchControl: (deviceIds: string[], action: string) =>
    fastapi.post('/api/devices/batch-control', { device_ids: deviceIds, action }),

  // Simulation
  simScenarios: () => fastapi.get('/api/simulation/scenarios'),
  simStart: (scenario: string, intensity = 0.5, duration = 30) =>
    fastapi.post('/api/simulation/start', { scenario, intensity, duration }),
  simState: () => fastapi.get('/api/simulation/state'),
  simHistory: () => fastapi.get('/api/simulation/history'),

  // Analytics
  analyticsKpis: (range = '24h') => fastapi.get(`/api/analytics/kpis?range=${range}`),
  analyticsReport: () => fastapi.get('/api/analytics/report'),
  attackFrequency: () => fastapi.get('/api/analytics/attack-frequency'),
  marlRewards: () => fastapi.get('/api/analytics/marl-rewards'),

  // Config
  getConfig: () => fastapi.get('/api/config'),
  setThresholds: (warn: number, crit: number) =>
    fastapi.post('/api/config/thresholds', { warning_threshold: warn, critical_threshold: crit }),
  setMode: (mode: string) => fastapi.post('/api/config/mode', { mode }),
  saveConfig: () => fastapi.post('/api/config/save'),
  resetConfig: () => fastapi.post('/api/config/reset'),

  // Events
  events: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fastapi.get(`/api/events${qs}`);
  },
  recentEvents: (limit = 10) => fastapi.get(`/api/events/recent?limit=${limit}`),
  resolveEvent: (id: string) => fastapi.post(`/api/events/${id}/resolve`),

  // Auth
  login: (username: string, password: string) =>
    fastapi.post('/api/auth/login', { username, password }),

  // AI Insights (Claude-powered)
  ai: {
    dashboardSummary: () => fastapi.post<AiResponse>('/api/ai/dashboard-summary'),
    frequencyAnalysis: () => fastapi.post<AiResponse>('/api/ai/frequency-analysis'),
    agentRecommendation: () => fastapi.post<AiResponse>('/api/ai/agent-recommendation'),
    solarUncertainty: () => fastapi.post<AiResponse>('/api/ai/solar-uncertainty'),
    attackAnalysis: () => fastapi.post<AiResponse>('/api/ai/attack-analysis'),
    vppOptimisation: () => fastapi.post<AiResponse>('/api/ai/vpp-optimisation'),
    simulationDebrief: () => fastapi.post<AiResponse>('/api/ai/simulation-debrief'),
    analyticsSummary: () => fastapi.post<AiResponse>('/api/ai/analytics-summary'),
    explainEvent: (eventId: string) =>
      fastapi.post<AiResponse>('/api/ai/explain-event', { event_id: eventId }),
  },
};

// ── Response types ──────────────────────────────────────────────────

export interface StatsResponse {
  response_latency_ms: number;
  energy_saved_kwh: number;
  agents_active: number;
  attack_status: string;
  frequency: number;
  dfdt: number;
  freq_status: string;
  solar_irradiance: number;
  virtual_inertia: number;
  online_devices: number;
  device_count: number;
  vpp_capacity_kw: number;
}

export interface FreqLive {
  hz: number;
  dfdt: number;
  status: string;
  timestamp: string;
}

export interface AiResponse {
  insight: string;
}

export const WS_BASE = process.env.NEXT_PUBLIC_FASTAPI_WS_URL || 'ws://localhost:8000';
