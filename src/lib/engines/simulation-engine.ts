/**
 * Simulation Orchestrator
 *
 * Ties together GridPhysics, MARL, Forecast, and Defense engines into a
 * single coherent simulation loop.  Exposes a simple API consumed by
 * the Zustand store's  initializeSystemData()  and  tick()  methods.
 */

import { GridPhysicsEngine } from './grid-physics';
import { MARLEngine }        from './marl-engine';
import { ForecastEngine }    from './forecast-engine';
import { DefenseEngine }     from './defense-engine';
import { SkyCameraEngine }   from './sky-camera';

// Re-export types that the store will need
export type { GridPhysicsState }              from './grid-physics';
export type { MARLMetrics, ClusterInfo, DeviceStats } from './marl-engine';
export type { ForecastMetrics, ForecastBand, ShadingEvent as ForecastShadingEvent, CloudState, TransformerLocation } from './forecast-engine';
export type { DefenseMetrics, DefenseAction, AttackSignature } from './defense-engine';
export type { SkyCameraMetrics, SkyCameraFrame, CloudBlob } from './sky-camera';

export { AgentAction } from './marl-engine';

// ── Singleton engine instances (created lazily) ──────────────────────

let physics:  GridPhysicsEngine | null = null;
let marl:     MARLEngine        | null = null;
let forecast: ForecastEngine    | null = null;
let defense:  DefenseEngine     | null = null;
let skyCamera: SkyCameraEngine  | null = null;

let _prevFrequency = 50.0;
let _clusterLoadBuffers = new Map<string, number[]>(); // for defense engine
let _skyCamEnabled = true; // toggled by config

// ── Public API ───────────────────────────────────────────────────────

/** Create / reset all engines.  Safe to call multiple times. */
export function initEngines(cfg?: {
  learningRate?: number;
  discountFactor?: number;
}): void {
  physics  = new GridPhysicsEngine(0.05);
  marl     = new MARLEngine({
    learningRate:      cfg?.learningRate      ?? 0.001,
    discountFactor:    cfg?.discountFactor    ?? 0.95,
    numClusters:       10,
    agentsPerCluster:  10,
    householdsPerAgent: 100,
  });
  forecast = new ForecastEngine({ latitude: 35, numTransformers: 8, ensembleSize: 50 });
  defense  = new DefenseEngine();
  skyCamera = new SkyCameraEngine();
  _prevFrequency = 50.0;
  _clusterLoadBuffers = new Map();
}

/** One simulation tick — called every ~2 s from the store. */
export function tick(config: {
  vppEnabled: boolean;
  responseThreshold: number;
  deceptiveSignalInjection: boolean;
  detectionSensitivity: 'low' | 'medium' | 'high';
  capacityReservedPercent?: number;
  bidirectionalCharging?: boolean;
  autonomousEscalation?: boolean;
  forecastHorizon?: '10s' | '30s' | '60s';
}) {
  if (!physics || !marl || !forecast || !defense || !skyCamera) initEngines();
  // TypeScript narrowing after guard
  const ph = physics!, ml = marl!, fc = forecast!, df = defense!, sc = skyCamera!;

  // ── Apply runtime config to sub-engines ──
  ml.setRuntimeConfig({
    capacityReservedPercent: config.capacityReservedPercent,
    bidirectionalCharging: config.bidirectionalCharging,
    isolatedClusters: df.getIsolatedClusters(),
  });
  if (config.forecastHorizon) fc.setForecastHorizon(config.forecastHorizon);

  // 1. Forecast  →  renewable generation
  const fm = fc.step();
  const renewableMW = fm.totalGenerationMW;

  // 1b. Sky-camera CV pipeline (refines forecast cloud model)
  if (_skyCamEnabled) {
    const cloudPos = fc.getCloudPositions();
    const sunElev = fc.getCurrentSolarElevation();
    const gridSz = fc.getGridSize();
    sc.processFrame(cloudPos, gridSz, sunElev);

    // Build refinement data from forecast clouds
    const refinementInput = fm.clouds.map(c => ({
      id: c.id, x: c.position.x, y: c.position.y,
      vx: c.velocity.vx, vy: c.velocity.vy,
      opacity: c.opacity, size: c.size,
    }));
    const refined = sc.refineForecastClouds(refinementInput, gridSz);
    fc.applyCameraRefinement(refined);
  }

  // 2. Defense  →  may add adversarial load
  const baseLoad = ph.state.totalLoad;
  const clusterInfos = ml.getClusterInfo();
  // Build cluster load buffers for defense
  for (const ci of clusterInfos) {
    const key = ci.name;
    if (!_clusterLoadBuffers.has(key)) _clusterLoadBuffers.set(key, []);
    const buf = _clusterLoadBuffers.get(key)!;
    buf.push(ci.totalPowerMW);
    if (buf.length > 20) buf.shift();
  }
  const dm = df.step(baseLoad, _clusterLoadBuffers, {
    deceptiveEnabled: config.deceptiveSignalInjection,
    sensitivity: config.detectionSensitivity,
    autonomousEscalation: config.autonomousEscalation,
  });

  // External load delta from attack — always applied regardless of detection.
  // The attack physically perturbs the grid; detection is the *defense* layer.
  const attackLoadDelta = dm.rawAttackLoadDelta;

  // 3. MARL  →  VPP power (with desync jitter from defense countermeasures)
  const freq = ph.state.frequency;
  const dfdt = ph.state.dfdt;

  // Build desync jitter map if defense has activated desynchronisation
  let desyncJitterMap: Map<string, number> | undefined;
  if (dm.desyncActive) {
    desyncJitterMap = new Map();
    for (const agent of ml.agents) {
      desyncJitterMap.set(agent.id, df.getDesyncJitter(agent.id));
    }
  }

  const { vppPowerMW, metrics: mm } = ml.step(freq, dfdt, _prevFrequency, desyncJitterMap);
  _prevFrequency = freq;

  // Apply VPP only if enabled and deviation exceeds threshold
  const dev = Math.abs(freq - 50);
  if (config.vppEnabled && dev >= config.responseThreshold) {
    ph.setVPPInjection(vppPowerMW);
  } else {
    ph.setVPPInjection(0);
  }

  // 4. Physics  →  new frequency with fast-response inner loop
  //    40 sub-steps = 40 × 50 ms = 2 s; every 10 sub-steps (500ms)
  //    check if emergency fast-response is needed from MARL.
  ph.setRenewableGeneration(renewableMW * 1000);
  const SUBSTEPS = 40;
  const FAST_INTERVAL = 10; // check fast-response every 10 sub-steps
  const perStepLoad = attackLoadDelta / SUBSTEPS;
  let ps = { ...ph.state };

  for (let i = 0; i < SUBSTEPS; i++) {
    ps = ph.step(perStepLoad, 0);

    // Every FAST_INTERVAL sub-steps, run MARL fast-response (lookup only, no learning)
    if ((i + 1) % FAST_INTERVAL === 0) {
      const fastMW = ml.fastResponse(ps.frequency, ps.dfdt, config.responseThreshold);
      if (Math.abs(fastMW) > 0.01) {
        // Inject emergency VPP power into physics for remaining sub-steps
        ph.setVPPInjection(ph.state.vppInjection + fastMW);
      }
    }
  }

  return { physics: ps, marl: mm, forecast: fm, defense: dm, skyCamera: sc.metrics };
}

// ── Event injection helpers ──────────────────────────────────────────

export function injectFrequencyDip(mhz: number): void {
  if (!physics) return;
  physics.state.frequency -= mhz / 1000;
}

export function injectLoadSpike(mw: number): void {
  if (!physics) return;
  physics.state.totalLoad += mw;
}

export function triggerAttack(type: 'load_sync' | 'frequency_manipulation' | 'false_data', intensity?: number): void {
  defense?.simulateAttack(type, intensity);
}

export function stopAttack(): void {
  defense?.stopAttack();
}

export function clearAttack(): void {
  defense?.stopAttack();
}

// ── Accessors ────────────────────────────────────────────────────────

export function getMARLEngine():    MARLEngine        | null { return marl; }
export function getPhysicsEngine(): GridPhysicsEngine | null { return physics; }
export function getForecastEngine():ForecastEngine    | null { return forecast; }
export function getDefenseEngine(): DefenseEngine     | null { return defense; }
export function getSkyCameraEngine(): SkyCameraEngine | null { return skyCamera; }

export function setSkyCamEnabled(enabled: boolean): void { _skyCamEnabled = enabled; }

export function updateMARLHyperparams(cfg: { learningRate?: number; discountFactor?: number }): void {
  marl?.updateHyperparams(cfg);
}

/** Run a self-contained stress-test simulation for N ticks and return results */
export function runStressTest(params: {
  scenario: string;
  intensity: number;     // 0-100
  affectedNodes: number; // 0-100
  duration: number;      // ticks
  vppEnabled: boolean;
  responseThreshold: number;
  deceptiveSignalInjection: boolean;
  detectionSensitivity: 'low' | 'medium' | 'high';
}): {
  maxDeviation: number;
  recoveryTime: number;
  energyCurtailed: number;
  finalFrequency: number;
  avgVPPResponse: number;
  attackDetected: boolean;
} {
  if (!physics) initEngines();
  const ph = physics!, ml = marl!, fc = forecast!, df = defense!;

  const savedFreq = ph.state.frequency;
  const savedLoad = ph.state.totalLoad;

  // Inject scenario
  const mwImpact = (params.intensity / 100) * 500;
  switch (params.scenario) {
    case 'adversarial':
      df.simulateAttack('load_sync', params.intensity / 100);
      break;
    case 'cloud-shading':
      ph.state.renewableGeneration *= (1 - params.intensity / 100);
      ph.state.totalGeneration = ph.state.conventionalGeneration + ph.state.renewableGeneration;
      break;
    case 'ev-mass':
      ph.state.totalLoad += mwImpact;
      break;
    case 'freq-dip':
      ph.state.frequency -= (params.intensity / 100) * 0.5;
      break;
  }

  let maxDev = 0, recoveryTick = params.duration, totalVPP = 0, detected = false;

  for (let t = 0; t < params.duration; t++) {
    const res = tick({
      vppEnabled: params.vppEnabled,
      responseThreshold: params.responseThreshold,
      deceptiveSignalInjection: params.deceptiveSignalInjection,
      detectionSensitivity: params.detectionSensitivity,
    });
    const dev = Math.abs(res.physics.frequency - 50);
    if (dev > maxDev) maxDev = dev;
    totalVPP += Math.abs(res.marl.totalVPPResponseMW);
    if (res.defense.attackDetected) detected = true;
    if (dev < 0.02 && recoveryTick === params.duration) recoveryTick = t;
  }

  // Clean up attack
  if (params.scenario === 'adversarial') df.stopAttack();

  // Restore baseline
  ph.state.totalLoad = savedLoad;

  const recoverySec = recoveryTick * 2; // each tick = 2s
  const curtailed = maxDev * 1000 * (recoveryTick * 2) / 3600; // rough kWh

  return {
    maxDeviation: maxDev * 1000,        // mHz
    recoveryTime: recoverySec,          // seconds
    energyCurtailed: curtailed,
    finalFrequency: ph.state.frequency,
    avgVPPResponse: totalVPP / params.duration,
    attackDetected: detected,
  };
}
