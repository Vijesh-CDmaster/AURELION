/**
 * Multi-Agent Reinforcement Learning (MARL) Engine
 *
 * Architecture : Centralized Training with Decentralized Execution (CTDE)
 * Algorithm    : Independent Q-Learning with shared reward shaping
 * Scale        : 100 representative agents × 100 households = 10,000 devices
 *
 * State space (per agent, discretized):
 *   [freq_bin, dfdt_bin, soc_bin, time_bin, load_bin]
 *
 * Action space:
 *   IDLE | SHED_LOAD | INCREASE_LOAD | DISCHARGE_TO_GRID | CHARGE_FROM_GRID
 *
 * Reward function:
 *   r = -α|Δf| + β·(|Δf_prev|-|Δf|) - γ·cost - δ·comfort + ε·directional_bonus
 */

// ── Discretization ──────────────────────────────────────────────────
const FREQ_BINS  = 11;  // [49.0 … 51.0]
const DFDT_BINS  = 5;   // [-0.1 … +0.1]
const SOC_BINS   = 5;   // [0% … 100%]
const TIME_BINS  = 6;   // 4-hour blocks
const LOAD_BINS  = 3;   // low / mid / high

const NUM_STATES  = FREQ_BINS * DFDT_BINS * SOC_BINS * TIME_BINS * LOAD_BINS; // 4 950
const NUM_ACTIONS = 5;

export enum AgentAction {
  IDLE              = 0,
  SHED_LOAD         = 1,
  INCREASE_LOAD     = 2,
  DISCHARGE_TO_GRID = 3,
  CHARGE_FROM_GRID  = 4,
}

const ACTION_NAMES = ['IDLE', 'SHED_LOAD', 'INCREASE_LOAD', 'DISCHARGE_V2G', 'CHARGE'] as const;

// ── Types ───────────────────────────────────────────────────────────

export interface HouseholdDevice {
  type: 'ev' | 'hvac' | 'battery' | 'smart_appliance';
  ratedPower: number;      // kW
  currentPower: number;    // kW  (+consume / -generate)
  stateOfCharge: number;   // 0-1
  isControllable: boolean;
  comfortCost: number;     // 0-1
}

export interface HouseholdAgent {
  id: string;
  clusterId: number;
  devices: HouseholdDevice[];
  qTable: Float32Array;
  totalLoad: number;
  lastAction: AgentAction;
  lastState: number;
  lastReward: number;
  cumulativeReward: number;
  responseTimeUs: number; // µs
  epsilon: number;
}

export interface MARLMetrics {
  totalVPPResponseMW: number;
  avgResponseTimeMs: number;
  avgReward: number;
  episodeCount: number;
  convergenceRate: number;
  activeAgents: number;
  rewardHistory: number[];
  frequencyTrackingError: number;
  virtualInertia: number;
  qTableStats: { avgQ: number; maxQ: number; minQ: number; nonZeroPercent: number };
}

export interface ClusterInfo {
  id: number;
  name: string;
  agentCount: number;
  householdCount: number;
  avgResponse: number;
  avgReward: number;
  dominantAction: string;
  totalPowerMW: number;
  status: 'active' | 'idle';
}

export interface DeviceStats {
  totalDevices: number;
  evCount: number;
  hvacCount: number;
  batteryCount: number;
  applianceCount: number;
  avgSoC: number;
  totalControllableLoadMW: number;
}

// ── Engine ───────────────────────────────────────────────────────────

export class MARLEngine {
  agents: HouseholdAgent[] = [];
  metrics!: MARLMetrics;

  // Hyper-parameters
  private learningRate: number;
  private discountFactor: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private rewardWeights = { frequency: 10.0, improvement: 5.0, cost: 0.5, comfort: 0.3 };

  // Config flags sourced from store config each tick
  private _minSoCReserve = 0.20; // gate: only discharge if SoC > this
  private _minSoCFloor   = 0.10; // clamp: never discharge below this
  private _bidirectionalCharging = true;  // when false, mask V2G actions for EVs
  private _isolatedClusters = new Set<string>(); // clusters isolated by defense

  private numClusters: number;
  private agentsPerCluster: number;
  readonly householdsPerAgent: number;

  private static readonly CLUSTER_NAMES = [
    'Urban Residential', 'Industrial Zone', 'South Sector PV',
    'V2G Fleet Hub', 'Commercial District', 'Rural Solar Farm',
    'North Suburb', 'Campus Grid', 'Harbor District', 'Tech Park',
  ];

  constructor(cfg?: {
    learningRate?: number;
    discountFactor?: number;
    numClusters?: number;
    agentsPerCluster?: number;
    householdsPerAgent?: number;
  }) {
    this.learningRate      = cfg?.learningRate      ?? 0.001;
    this.discountFactor    = cfg?.discountFactor    ?? 0.95;
    this.epsilonDecay      = 0.9995;
    this.minEpsilon        = 0.05;
    this.numClusters       = cfg?.numClusters       ?? 10;
    this.agentsPerCluster  = cfg?.agentsPerCluster  ?? 10;
    this.householdsPerAgent = cfg?.householdsPerAgent ?? 100;

    this.initAgents();
    this.metrics = this.emptyMetrics();
  }

  // ── Initialization ──────────────────────────────────────────────

  private emptyMetrics(): MARLMetrics {
    return {
      totalVPPResponseMW: 0, avgResponseTimeMs: 0, avgReward: 0,
      episodeCount: 0, convergenceRate: 0,
      activeAgents: this.agents.length * this.householdsPerAgent,
      rewardHistory: [], frequencyTrackingError: 0, virtualInertia: 0,
      qTableStats: { avgQ: 0, maxQ: 0, minQ: 0, nonZeroPercent: 0 },
    };
  }

  private initAgents(): void {
    this.agents = [];
    for (let c = 0; c < this.numClusters; c++) {
      for (let a = 0; a < this.agentsPerCluster; a++) {
        const qTable = new Float32Array(NUM_STATES * NUM_ACTIONS);
        // Optimistic initialisation – small positive values encourage exploration
        for (let i = 0; i < qTable.length; i++) qTable[i] = Math.random() * 0.1;

        const devices = this.randomDevices();
        const agent: HouseholdAgent = {
          id: `C${c}-A${a}`,
          clusterId: c,
          devices,
          qTable,
          totalLoad: devices.reduce((s, d) => s + d.currentPower, 0),
          lastAction: AgentAction.IDLE,
          lastState: 0,
          lastReward: 0,
          cumulativeReward: 0,
          responseTimeUs: 0,
          epsilon: 0.3,
        };
        this.agents.push(agent);
      }
    }
  }

  private randomDevices(): HouseholdDevice[] {
    const devs: HouseholdDevice[] = [];
    if (Math.random() < 0.70)
      devs.push({ type: 'ev', ratedPower: 7.4, currentPower: Math.random() < 0.4 ? 7.4 * Math.random() : 0, stateOfCharge: Math.random(), isControllable: true, comfortCost: 0.3 });
    if (Math.random() < 0.90)
      devs.push({ type: 'hvac', ratedPower: 3.5, currentPower: 1 + Math.random() * 2.5, stateOfCharge: 0.5, isControllable: true, comfortCost: 0.6 });
    if (Math.random() < 0.40)
      devs.push({ type: 'battery', ratedPower: 5.0, currentPower: 0, stateOfCharge: 0.3 + Math.random() * 0.5, isControllable: true, comfortCost: 0.1 });
    if (Math.random() < 0.60)
      devs.push({ type: 'smart_appliance', ratedPower: 2.0, currentPower: Math.random() * 2, stateOfCharge: 0, isControllable: true, comfortCost: 0.4 });
    if (devs.length === 0)
      devs.push({ type: 'hvac', ratedPower: 3.5, currentPower: 2, stateOfCharge: 0.5, isControllable: true, comfortCost: 0.5 });
    return devs;
  }

  // ── State discretization ────────────────────────────────────────

  private discretize(freq: number, dfdt: number, soc: number, hour: number, loadNorm: number): number {
    const fb = Math.max(0, Math.min(FREQ_BINS  - 1, Math.floor((freq - 49.0)   / (2.0 / FREQ_BINS))));
    const db = Math.max(0, Math.min(DFDT_BINS  - 1, Math.floor((dfdt + 0.1)    / (0.2 / DFDT_BINS))));
    const sb = Math.max(0, Math.min(SOC_BINS   - 1, Math.floor(soc * SOC_BINS)));
    const tb = Math.max(0, Math.min(TIME_BINS  - 1, Math.floor(hour / (24 / TIME_BINS))));
    const lb = Math.max(0, Math.min(LOAD_BINS  - 1, Math.floor(loadNorm * LOAD_BINS)));
    return ((((fb * DFDT_BINS + db) * SOC_BINS + sb) * TIME_BINS + tb) * LOAD_BINS + lb);
  }

  // ── ε-greedy policy ─────────────────────────────────────────────

  private selectAction(agent: HouseholdAgent, state: number): AgentAction {
    // Build action mask (true = allowed)
    const mask = new Array(NUM_ACTIONS).fill(true);
    if (!this._bidirectionalCharging) {
      // Only mask V2G for EV devices — check if agent has EV but no battery
      const hasEV  = agent.devices.some(d => d.type === 'ev');
      const hasBat = agent.devices.some(d => d.type === 'battery');
      if (hasEV && !hasBat) {
        mask[AgentAction.DISCHARGE_TO_GRID] = false;
        mask[AgentAction.CHARGE_FROM_GRID]  = false;
      }
    }

    const allowedActions = ([] as number[]);
    for (let a = 0; a < NUM_ACTIONS; a++) if (mask[a]) allowedActions.push(a);
    if (allowedActions.length === 0) return AgentAction.IDLE;

    if (Math.random() < agent.epsilon) return allowedActions[Math.floor(Math.random() * allowedActions.length)] as AgentAction;
    let best = allowedActions[0], bestV = -Infinity;
    const base = state * NUM_ACTIONS;
    for (const a of allowedActions) {
      if (agent.qTable[base + a] > bestV) { bestV = agent.qTable[base + a]; best = a; }
    }
    return best as AgentAction;
  }

  // ── Reward ──────────────────────────────────────────────────────

  private reward(freq: number, dfdt: number, action: AgentAction, agent: HouseholdAgent, prevFreq: number): number {
    const dF    = Math.abs(freq - 50);
    const dFold = Math.abs(prevFreq - 50);
    const w     = this.rewardWeights;

    let r = -w.frequency * dF                        // penalise deviation
          + w.improvement * (dFold - dF);             // reward improvement

    // cost of action
    if (action === AgentAction.DISCHARGE_TO_GRID) r -= w.cost * 0.5;
    if (action === AgentAction.CHARGE_FROM_GRID)  r -= w.cost * 0.3;

    // comfort penalty when shedding
    if (action === AgentAction.SHED_LOAD) {
      const avgComf = agent.devices.reduce((s, d) => s + d.comfortCost, 0) / agent.devices.length;
      r -= w.comfort * avgComf;
    }

    // directional bonus: correct response to deviation
    if (freq < 49.95 && (action === AgentAction.SHED_LOAD || action === AgentAction.DISCHARGE_TO_GRID)) r += 2;
    else if (freq > 50.05 && (action === AgentAction.INCREASE_LOAD || action === AgentAction.CHARGE_FROM_GRID)) r += 2;
    else if (dF < 0.02 && action === AgentAction.IDLE) r += 1;

    return r;
  }

  // ── Execute action on devices ───────────────────────────────────

  private execute(agent: HouseholdAgent, action: AgentAction): number {
    let powerDelta = 0; // kW: +ve = reduced load / injected

    switch (action) {
      case AgentAction.IDLE: break;

      case AgentAction.SHED_LOAD:
        for (const d of agent.devices) {
          if (d.isControllable && d.currentPower > 0) {
            const cut = d.currentPower * 0.5;
            d.currentPower -= cut;
            powerDelta += cut;
          }
        }
        break;

      case AgentAction.INCREASE_LOAD:
        for (const d of agent.devices) {
          if (d.isControllable) {
            const headroom = d.ratedPower - d.currentPower;
            if (headroom > 0) { const inc = headroom * 0.4; d.currentPower += inc; powerDelta -= inc; }
          }
        }
        break;

      case AgentAction.DISCHARGE_TO_GRID:
        for (const d of agent.devices) {
          if ((d.type === 'ev' || d.type === 'battery') && d.stateOfCharge > this._minSoCReserve) {
            const dis = d.ratedPower * 0.8;
            d.currentPower = -dis;
            d.stateOfCharge = Math.max(this._minSoCFloor, d.stateOfCharge - 0.01);
            powerDelta += dis;
          }
        }
        break;

      case AgentAction.CHARGE_FROM_GRID:
        for (const d of agent.devices) {
          if ((d.type === 'ev' || d.type === 'battery') && d.stateOfCharge < 0.90) {
            d.currentPower = d.ratedPower;
            d.stateOfCharge = Math.min(0.95, d.stateOfCharge + 0.01);
            powerDelta -= d.ratedPower;
          }
        }
        break;
    }

    agent.totalLoad = agent.devices.reduce((s, d) => s + d.currentPower, 0);
    return powerDelta * this.householdsPerAgent; // scale to cluster
  }

  // ── Q-Learning update ───────────────────────────────────────────
  //   Q(s,a) ← Q(s,a) + α [ r + γ·max_a' Q(s',a') – Q(s,a) ]

  private updateQ(agent: HouseholdAgent, s: number, a: AgentAction, r: number, sNext: number): void {
    const cur = agent.qTable[s * NUM_ACTIONS + a];
    let maxNext = -Infinity;
    const base = sNext * NUM_ACTIONS;
    for (let i = 0; i < NUM_ACTIONS; i++) {
      if (agent.qTable[base + i] > maxNext) maxNext = agent.qTable[base + i];
    }
    agent.qTable[s * NUM_ACTIONS + a] = cur + this.learningRate * (r + this.discountFactor * maxNext - cur);
  }

  // ── Main tick ───────────────────────────────────────────────────

  /** Configure runtime parameters from the store's config panel */
  setRuntimeConfig(cfg: {
    capacityReservedPercent?: number;
    bidirectionalCharging?: boolean;
    isolatedClusters?: Set<string>;
  }): void {
    if (cfg.capacityReservedPercent !== undefined) {
      const pct = cfg.capacityReservedPercent / 100;
      this._minSoCReserve = Math.max(0.05, pct * 1.3); // gate
      this._minSoCFloor   = Math.max(0.05, pct);       // floor
    }
    if (cfg.bidirectionalCharging !== undefined) this._bidirectionalCharging = cfg.bidirectionalCharging;
    if (cfg.isolatedClusters !== undefined) this._isolatedClusters = cfg.isolatedClusters;
  }

  step(frequency: number, dfdt: number, prevFrequency: number, desyncJitterMap?: Map<string, number>): { vppPowerMW: number; metrics: MARLMetrics } {
    const t0   = performance.now();
    const hour = new Date().getHours();
    let totalKw = 0, totalReward = 0, converged = 0;
    let totalResponseUs = 0, activeCount = 0;

    for (const agent of this.agents) {
      // Skip agents whose cluster has been isolated by defense
      const clusterName = MARLEngine.CLUSTER_NAMES[agent.clusterId] || `Cluster ${agent.clusterId}`;
      if (this._isolatedClusters.has(clusterName)) {
        agent.lastAction = AgentAction.IDLE;
        continue;
      }
      // ── Desync jitter: if the defense engine has assigned jitter to this agent,
      //    probabilistically skip its action this tick to break attacker synchronisation.
      //    Jitter value is in ms (0-5000); we translate to a skip probability per 2 s tick.
      if (desyncJitterMap) {
        const jitterMs = desyncJitterMap.get(agent.id) ?? 0;
        if (jitterMs > 0) {
          // Probability of skipping this tick = jitter / tick_interval
          // e.g. 2500ms jitter → 50% chance of skip in a 5000ms window
          const skipProb = Math.min(0.8, jitterMs / 5000);
          if (Math.random() < skipProb) {
            // Agent defers action — counts as IDLE for this tick
            agent.lastAction = AgentAction.IDLE;
            continue;
          }
        }
      }

      const storageDevs = agent.devices.filter(d => d.type === 'ev' || d.type === 'battery');
      const avgSoC  = storageDevs.length > 0 ? storageDevs.reduce((s, d) => s + d.stateOfCharge, 0) / storageDevs.length : 0.5;
      const maxLoad = agent.devices.reduce((s, d) => s + d.ratedPower, 0);
      const loadNorm = maxLoad > 0 ? Math.min(1, agent.totalLoad / maxLoad) : 0.5;

      const state = this.discretize(frequency, dfdt, avgSoC, hour, loadNorm);

      // Update Q from previous transition
      if (this.metrics.episodeCount > 0) {
        const r = this.reward(frequency, dfdt, agent.lastAction, agent, prevFrequency);
        this.updateQ(agent, agent.lastState, agent.lastAction, r, state);
        agent.lastReward = r;
        agent.cumulativeReward += r;
        totalReward += r;
      }

      const action = this.selectAction(agent, state);
      const a0 = performance.now();
      const dkw = this.execute(agent, action);
      agent.responseTimeUs = (performance.now() - a0) * 1000;

      totalKw += dkw;
      totalResponseUs += agent.responseTimeUs;
      activeCount++;
      agent.lastState  = state;
      agent.lastAction = action;
      agent.epsilon    = Math.max(this.minEpsilon, agent.epsilon * this.epsilonDecay);
      if (agent.epsilon <= this.minEpsilon * 1.1) converged++;
    }

    const elapsed = performance.now() - t0;
    const n = this.agents.length;
    const vppMW = totalKw / 1000;
    const dF = Math.abs(frequency - 50);
    const vInertia = dF > 0.001 ? Math.abs(vppMW) * this.dt / (2 * dF) : 0;

    this.metrics = {
      totalVPPResponseMW: vppMW,
      avgResponseTimeMs: activeCount > 0 ? (totalResponseUs / activeCount) / 1000 : 0, // per-agent avg in ms
      avgReward: n > 0 ? totalReward / n : 0,
      episodeCount: this.metrics.episodeCount + 1,
      convergenceRate: (converged / n) * 100,
      activeAgents: n * this.householdsPerAgent,
      rewardHistory: [...this.metrics.rewardHistory.slice(-99), n > 0 ? totalReward / n : 0],
      frequencyTrackingError: dF,
      virtualInertia: vInertia,
      qTableStats: this.qStats(),
    };

    return { vppPowerMW: vppMW, metrics: this.metrics };
  }

  private readonly dt = 2; // seconds per tick (matches UI interval)

  // ── Telemetry helpers ───────────────────────────────────────────

  qStats(): MARLMetrics['qTableStats'] {
    let sum = 0, max = -Infinity, min = Infinity, nz = 0, total = 0;
    for (const a of this.agents) {
      for (let i = 0; i < a.qTable.length; i++) {
        const v = a.qTable[i]; sum += v;
        if (v > max) max = v; if (v < min) min = v;
        if (Math.abs(v) > 0.001) nz++; total++;
      }
    }
    return {
      avgQ: total > 0 ? sum / total : 0,
      maxQ: max === -Infinity ? 0 : max,
      minQ: min === Infinity  ? 0 : min,
      nonZeroPercent: total > 0 ? (nz / total) * 100 : 0,
    };
  }

  getClusterInfo(): ClusterInfo[] {
    const names = MARLEngine.CLUSTER_NAMES;
    const out: ClusterInfo[] = [];
    for (let c = 0; c < this.numClusters; c++) {
      const ca = this.agents.filter(a => a.clusterId === c);
      const avgR = ca.reduce((s, a) => s + a.responseTimeUs, 0) / ca.length / 1000; // ms
      const avgRew = ca.reduce((s, a) => s + a.lastReward, 0) / ca.length;
      const totalPow = ca.reduce((s, a) => s + a.totalLoad, 0) * this.householdsPerAgent / 1000;
      const counts = new Array(NUM_ACTIONS).fill(0);
      ca.forEach(a => counts[a.lastAction]++);
      const dom = counts.indexOf(Math.max(...counts));
      out.push({
        id: c, name: names[c] || `Cluster ${c}`,
        agentCount: ca.length, householdCount: ca.length * this.householdsPerAgent,
        avgResponse: avgR, avgReward: avgRew,
        dominantAction: ACTION_NAMES[dom], totalPowerMW: totalPow,
        status: ca.some(a => a.lastAction !== AgentAction.IDLE) ? 'active' : 'idle',
      });
    }
    return out;
  }

  getDeviceStats(): DeviceStats {
    let ev = 0, hvac = 0, bat = 0, app = 0, tSoC = 0, nSoC = 0, tLoad = 0;
    const h = this.householdsPerAgent;
    for (const a of this.agents) {
      for (const d of a.devices) {
        switch (d.type) { case 'ev': ev += h; break; case 'hvac': hvac += h; break; case 'battery': bat += h; break; case 'smart_appliance': app += h; break; }
        if (d.type === 'ev' || d.type === 'battery') { tSoC += d.stateOfCharge; nSoC++; }
        tLoad += Math.abs(d.currentPower) * h;
      }
    }
    return { totalDevices: ev + hvac + bat + app, evCount: ev, hvacCount: hvac, batteryCount: bat, applianceCount: app, avgSoC: nSoC > 0 ? tSoC / nSoC : 0, totalControllableLoadMW: tLoad / 1000 };
  }

  updateHyperparams(cfg: { learningRate?: number; discountFactor?: number }): void {
    if (cfg.learningRate   !== undefined) this.learningRate   = cfg.learningRate;
    if (cfg.discountFactor !== undefined) this.discountFactor = cfg.discountFactor;
  }

  /**
   * Fast-response inner loop — pure Q-table lookup, NO learning.
   * Designed to run within the physics sub-step loop (40× per tick)
   * to achieve true <50ms decision latency per agent.
   *
   * Only fires when |Δf| > emergencyThreshold (e.g. 0.10 Hz).
   * Returns aggregate VPP power delta in MW.
   */
  fastResponse(frequency: number, dfdt: number, emergencyThreshold = 0.10): number {
    const dev = Math.abs(frequency - 50);
    if (dev < emergencyThreshold) return 0;

    const t0 = performance.now();
    const hour = new Date().getHours();
    let totalKw = 0;

    for (const agent of this.agents) {
      const storageDevs = agent.devices.filter(d => d.type === 'ev' || d.type === 'battery');
      const avgSoC = storageDevs.length > 0
        ? storageDevs.reduce((s, d) => s + d.stateOfCharge, 0) / storageDevs.length : 0.5;
      const maxLoad = agent.devices.reduce((s, d) => s + d.ratedPower, 0);
      const loadNorm = maxLoad > 0 ? Math.min(1, agent.totalLoad / maxLoad) : 0.5;

      const state = this.discretize(frequency, dfdt, avgSoC, hour, loadNorm);

      // Greedy action only (ε = 0) — no exploration during emergency
      let best = 0, bestV = -Infinity;
      const base = state * NUM_ACTIONS;
      for (let a = 0; a < NUM_ACTIONS; a++) {
        if (agent.qTable[base + a] > bestV) { bestV = agent.qTable[base + a]; best = a; }
      }

      const action = best as AgentAction;
      // Execute but with reduced magnitude (25%) to prevent overshoot
      const dkw = this.execute(agent, action) * 0.25;
      totalKw += dkw;
    }

    const elapsed = performance.now() - t0;
    // Update last response time metric (should be well under 50ms)
    if (this.metrics) {
      this.metrics.avgResponseTimeMs = Math.min(this.metrics.avgResponseTimeMs, elapsed);
    }

    return totalKw / 1000; // MW
  }

  // ── Serialization for DB persistence ──────────────────────────────

  /** Serialize all agent Q-tables + metadata for MongoDB persistence */
  serializeAgents(): {
    agentId: string; clusterId: number; qTableBase64: string;
    epsilon: number; cumulativeReward: number; lastAction: number;
    lastState: number; totalLoad: number;
    devices: { type: string; ratedPower: number; currentPower: number; stateOfCharge: number; isControllable: boolean; comfortCost: number }[];
  }[] {
    return this.agents.map(a => {
      // Float32Array → base64
      const bytes = new Uint8Array(a.qTable.buffer, a.qTable.byteOffset, a.qTable.byteLength);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const qTableBase64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');

      return {
        agentId: a.id, clusterId: a.clusterId,
        qTableBase64, epsilon: a.epsilon, cumulativeReward: a.cumulativeReward,
        lastAction: a.lastAction, lastState: a.lastState, totalLoad: a.totalLoad,
        devices: a.devices.map(d => ({ type: d.type, ratedPower: d.ratedPower, currentPower: d.currentPower, stateOfCharge: d.stateOfCharge, isControllable: d.isControllable, comfortCost: d.comfortCost })),
      };
    });
  }

  /** Restore agent Q-tables + metadata from a DB snapshot */
  restoreFromSnapshot(agentSnapshots: {
    agentId: string; clusterId: number; qTableBase64: string;
    epsilon: number; cumulativeReward: number; lastAction: number;
    lastState: number; totalLoad: number;
    devices: { type: string; ratedPower: number; currentPower: number; stateOfCharge: number; isControllable: boolean; comfortCost: number }[];
  }[]): boolean {
    if (agentSnapshots.length !== this.agents.length) {
      console.warn(`[MARL] Snapshot agent count (${agentSnapshots.length}) != engine agent count (${this.agents.length}). Skipping restore.`);
      return false;
    }

    for (let i = 0; i < agentSnapshots.length; i++) {
      const snap = agentSnapshots[i];
      const agent = this.agents[i];

      // base64 → Float32Array
      let bytes: Uint8Array;
      if (typeof atob === 'function') {
        const binary = atob(snap.qTableBase64);
        bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
      } else {
        bytes = new Uint8Array(Buffer.from(snap.qTableBase64, 'base64'));
      }
      const restored = new Float32Array(bytes.buffer);

      if (restored.length !== agent.qTable.length) {
        console.warn(`[MARL] Q-table size mismatch for ${snap.agentId}: expected ${agent.qTable.length}, got ${restored.length}`);
        continue;
      }

      agent.qTable.set(restored);
      agent.epsilon = snap.epsilon;
      agent.cumulativeReward = snap.cumulativeReward;
      agent.lastAction = snap.lastAction;
      agent.lastState = snap.lastState;
      agent.totalLoad = snap.totalLoad;

      // Restore device state
      if (snap.devices && snap.devices.length === agent.devices.length) {
        for (let d = 0; d < snap.devices.length; d++) {
          agent.devices[d].currentPower = snap.devices[d].currentPower;
          agent.devices[d].stateOfCharge = snap.devices[d].stateOfCharge;
        }
      }
    }

    console.log(`[MARL] Restored ${agentSnapshots.length} agents from snapshot`);
    return true;
  }

  /** Get current hyperparams (for snapshot metadata) */
  getHyperparams(): { learningRate: number; discountFactor: number; epsilonDecay: number; minEpsilon: number } {
    return {
      learningRate: this.learningRate,
      discountFactor: this.discountFactor,
      epsilonDecay: this.epsilonDecay,
      minEpsilon: this.minEpsilon,
    };
  }

  /** Dynamically sense whether reward weights have drifted enough to flag "MUTATED" */
  getRewardWeightStatus(): string {
    if (this.metrics.episodeCount < 20) return 'INITIALIZING';
    const recent = this.metrics.rewardHistory.slice(-10);
    const older  = this.metrics.rewardHistory.slice(-30, -10);
    if (recent.length < 5 || older.length < 5) return 'STABLE';
    const rAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const oAvg = older.reduce((s, v) => s + v, 0) / older.length;
    return Math.abs(rAvg - oAvg) > 1 ? 'MUTATED' : 'STABLE';
  }
}
