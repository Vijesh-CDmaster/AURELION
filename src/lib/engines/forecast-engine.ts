/**
 * Probabilistic Solar Forecasting Engine
 *
 * Implements:
 *  1. Clear-sky irradiance model (Ineichen–Perez simplified)
 *  2. Cloud motion tracking (velocity + Markov opacity transitions)
 *  3. Monte-Carlo ensemble for probabilistic quantile forecasts
 *  4. Transformer-specific shadow projection (Gaussian attenuation)
 *  5. 30-second lead-time predictions with confidence intervals
 *
 * Scoring: CRPS, Pinball Loss, Reliability Diagram
 */

// ── Types ────────────────────────────────────────────────────────────

export interface CloudState {
  id: string;
  position: { x: number; y: number };
  velocity: { vx: number; vy: number };
  opacity: number;   // 0 … 1
  size: number;
  type: 'cumulus' | 'stratus' | 'cirrus';
}

export interface TransformerLocation {
  id: string;
  name: string;
  position: { x: number; y: number };
  capacity: number;               // kW
  currentGeneration: number;      // kW
  shadingFactor: number;          // 0 (clear) … 1 (full shadow)
  predictedShading30s: number;
  predictedShading60s: number;
}

export interface ForecastBand {
  timeOffset: number;    // seconds from now
  predicted: number;     // W/m²
  lower10: number;
  lower25: number;
  upper75: number;
  upper90: number;
  shadingProb: number;
}

export interface ShadingEvent {
  transformerId: string;
  transformerName: string;
  leadTimeSec: number;
  durationSec: number;
  severity: 'low' | 'medium' | 'high';
  probability: number;
  irradianceDrop: number; // W/m²
}

export interface ForecastMetrics {
  currentIrradiance: number;
  clearSkyIrradiance: number;
  cloudCoverage: number;            // 0-1
  forecastHorizon: number;          // seconds
  crps: number;
  pinballLoss: number;
  reliabilityScore: number;
  shadingEvents: ShadingEvent[];
  transformers: TransformerLocation[];
  forecast30s: ForecastBand[];
  clouds: CloudState[];
  totalGenerationMW: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

function solarElevation(hour: number, dayOfYear: number, latitude: number): number {
  const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  const dRad = decl * Math.PI / 180;
  const lRad = latitude * Math.PI / 180;
  const ha   = (hour - 12) * 15 * Math.PI / 180;
  const sinE = Math.sin(lRad) * Math.sin(dRad) + Math.cos(lRad) * Math.cos(dRad) * Math.cos(ha);
  return Math.asin(Math.max(-1, Math.min(1, sinE))) * 180 / Math.PI;
}

function clearSkyGHI(elevation: number): number {
  if (elevation <= 0) return 0;
  const eRad    = elevation * Math.PI / 180;
  const airmass = 1 / (Math.sin(eRad) + 0.50572 * Math.pow(elevation + 6.07995, -1.6364));
  return 1361 * 0.75 * Math.exp(-0.185 * airmass) * Math.sin(eRad);
}

// ── Engine ───────────────────────────────────────────────────────────

export class ForecastEngine {
  private clouds: CloudState[] = [];
  private transformers: TransformerLocation[] = [];
  private latitude: number;
  private gridSize: number;
  private ensembleSize: number;

  // Markov transition matrix for cloud opacity
  // States: clear (<0.25), light (0.25–0.50), medium (0.50–0.75), heavy (>0.75)
  private transMatrix = [
    [0.85, 0.10, 0.04, 0.01],
    [0.15, 0.60, 0.20, 0.05],
    [0.05, 0.20, 0.55, 0.20],
    [0.02, 0.08, 0.30, 0.60],
  ];

  // Scoring buffers
  private actuals:    number[] = [];
  private predicted:  number[] = [];
  private ensembleHistory: number[][] = []; // store full ensemble per step for proper CRPS

  // Configurable forecast horizon (seconds)
  private _forecastHorizonSec: number = 30;

  metrics!: ForecastMetrics;

  /** Set the forecast horizon from the config panel ('10s' | '30s' | '60s') */
  setForecastHorizon(horizon: '10s' | '30s' | '60s'): void {
    this._forecastHorizonSec = parseInt(horizon, 10);
  }

  constructor(cfg?: { latitude?: number; numTransformers?: number; gridSize?: number; ensembleSize?: number }) {
    this.latitude     = cfg?.latitude     ?? 35.0;
    this.gridSize     = cfg?.gridSize     ?? 100;
    this.ensembleSize = cfg?.ensembleSize ?? 50;

    this.initTransformers(cfg?.numTransformers ?? 8);
    this.initClouds();
    this.metrics = this.computeMetrics();
  }

  // ── Initialisation ────────────────────────────────────────────

  private initTransformers(n: number): void {
    const names = ['T-42 North','T-15 East','T-78 South','T-31 West','T-56 Central','T-89 Harbor','T-23 Campus','T-67 Industrial','T-44 Suburb','T-12 Park'];
    this.transformers = Array.from({ length: n }, (_, i) => ({
      id: `T-${String(i * 11 + 12).padStart(2, '0')}`,
      name: names[i] || `Transformer ${i}`,
      position: { x: 10 + Math.random() * (this.gridSize - 20), y: 10 + Math.random() * (this.gridSize - 20) },
      capacity: 500 + Math.random() * 2000,
      currentGeneration: 0,
      shadingFactor: 0,
      predictedShading30s: 0,
      predictedShading60s: 0,
    }));
  }

  private initClouds(): void {
    const n = 3 + Math.floor(Math.random() * 5);
    this.clouds = Array.from({ length: n }, (_, i) => ({
      id: `cloud-${i}`,
      position: { x: Math.random() * this.gridSize, y: Math.random() * this.gridSize },
      velocity: { vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 1 },
      opacity: 0.3 + Math.random() * 0.7,
      size: 5 + Math.random() * 15,
      type: (['cumulus', 'stratus', 'cirrus'] as const)[Math.floor(Math.random() * 3)],
    }));
  }

  // ── Cloud dynamics ────────────────────────────────────────────

  private advanceClouds(): void {
    for (const c of this.clouds) {
      c.position.x += c.velocity.vx;
      c.position.y += c.velocity.vy;
      // Turbulence
      c.velocity.vx += (Math.random() - 0.5) * 0.08;
      c.velocity.vy += (Math.random() - 0.5) * 0.04;
      c.velocity.vx = Math.max(-3, Math.min(3, c.velocity.vx));
      c.velocity.vy = Math.max(-2, Math.min(2, c.velocity.vy));
      // Wrap
      const s = this.gridSize;
      if (c.position.x < -c.size) c.position.x = s + c.size;
      if (c.position.x > s + c.size) c.position.x = -c.size;
      if (c.position.y < -c.size) c.position.y = s + c.size;
      if (c.position.y > s + c.size) c.position.y = -c.size;
      // Markov opacity
      const idx = c.opacity < 0.25 ? 0 : c.opacity < 0.5 ? 1 : c.opacity < 0.75 ? 2 : 3;
      const row = this.transMatrix[idx];
      let roll = Math.random(), cum = 0, next = idx;
      for (let i = 0; i < row.length; i++) { cum += row[i]; if (roll < cum) { next = i; break; } }
      c.opacity = [0.1, 0.35, 0.65, 0.9][next] + (Math.random() - 0.5) * 0.1;
      c.opacity = Math.max(0, Math.min(1, c.opacity));
      c.size += (Math.random() - 0.5) * 0.5;
      c.size = Math.max(3, Math.min(25, c.size));
    }
    // Spawn / despawn
    if (Math.random() < 0.03 && this.clouds.length < 12) {
      this.clouds.push({
        id: `cloud-${Date.now()}`,
        position: { x: -5, y: Math.random() * this.gridSize },
        velocity: { vx: 0.5 + Math.random(), vy: (Math.random() - 0.5) * 0.5 },
        opacity: 0.3 + Math.random() * 0.5,
        size: 5 + Math.random() * 10,
        type: (['cumulus', 'stratus', 'cirrus'] as const)[Math.floor(Math.random() * 3)],
      });
    }
    if (Math.random() < 0.01 && this.clouds.length > 2) {
      this.clouds.splice(Math.floor(Math.random() * this.clouds.length), 1);
    }
  }

  // ── Shadow model (Gaussian attenuation) ───────────────────────

  private shading(pt: { x: number; y: number }, cloudList?: CloudState[]): number {
    let maxSh = 0;
    for (const c of cloudList || this.clouds) {
      const dx = pt.x - c.position.x, dy = pt.y - c.position.y;
      const d2 = dx * dx + dy * dy;
      const r2 = (c.size * 0.75) ** 2;
      if (d2 < r2 * 4) {
        const sh = c.opacity * Math.exp(-d2 / (2 * r2));
        if (sh > maxSh) maxSh = sh;
      }
    }
    return Math.min(1, maxSh);
  }

  // ── Monte-Carlo ensemble forecast ─────────────────────────────

  private ensembleForecast(pt: { x: number; y: number }, secAhead: number): { expected: number; q10: number; q25: number; q75: number; q90: number } {
    const vals: number[] = [];
    for (let e = 0; e < this.ensembleSize; e++) {
      const perturbed: CloudState[] = this.clouds.map(c => ({
        ...c,
        position: {
          x: c.position.x + c.velocity.vx * secAhead + (Math.random() - 0.5) * secAhead * 0.3,
          y: c.position.y + c.velocity.vy * secAhead + (Math.random() - 0.5) * secAhead * 0.2,
        },
        opacity: Math.max(0, Math.min(1, c.opacity + (Math.random() - 0.5) * 0.15)),
        size: Math.max(3, c.size + (Math.random() - 0.5) * 2),
      }));
      vals.push(this.shading(pt, perturbed));
    }
    vals.sort((a, b) => a - b);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return {
      expected: avg,
      q10: vals[Math.floor(vals.length * 0.10)],
      q25: vals[Math.floor(vals.length * 0.25)],
      q75: vals[Math.floor(vals.length * 0.75)],
      q90: vals[Math.floor(vals.length * 0.90)],
    };
  }

  // ── Main tick ─────────────────────────────────────────────────

  step(): ForecastMetrics {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const doy  = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const elev = solarElevation(hour, doy, this.latitude);
    const ghi  = clearSkyGHI(elev);

    this.advanceClouds();

    // -- Update transformers --
    for (const t of this.transformers) {
      t.shadingFactor = this.shading(t.position);
      const f30 = this.ensembleForecast(t.position, 30);
      const f60 = this.ensembleForecast(t.position, 60);
      t.predictedShading30s = f30.expected;
      t.predictedShading60s = f60.expected;
      t.currentGeneration   = t.capacity * (1 - t.shadingFactor) * Math.max(0, ghi / 1000);
    }

    // -- Overall cloud coverage (sample 5×5 grid) --
    let totalSh = 0;
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++)
      totalSh += this.shading({ x: (x + 0.5) * this.gridSize / 5, y: (y + 0.5) * this.gridSize / 5 });
    const coverage = totalSh / 25;

    const currentIrr = ghi * (1 - coverage * 0.8);

    // -- forecast bands (dynamic horizon) --
    const bands: ForecastBand[] = [];
    const center = { x: this.gridSize / 2, y: this.gridSize / 2 };
    const horizonSec = this._forecastHorizonSec;
    const bandStep = Math.max(1, Math.round(horizonSec / 10)); // ~10 data points
    for (let s = 0; s <= horizonSec; s += bandStep) {
      const ens = this.ensembleForecast(center, s);
      const predIrr = ghi * (1 - ens.expected * 0.8);
      bands.push({
        timeOffset: s,
        predicted:  predIrr,
        lower10:    ghi * (1 - ens.q90 * 0.8),
        lower25:    ghi * (1 - ens.q75 * 0.8),
        upper75:    ghi * (1 - ens.q25 * 0.8),
        upper90:    ghi * (1 - ens.q10 * 0.8),
        shadingProb: ens.expected > 0.3 ? ens.expected : 0,
      });
    }

    // -- Detect upcoming shading events --
    const events: ShadingEvent[] = [];
    for (const t of this.transformers) {
      if (t.predictedShading30s > 0.3 && t.shadingFactor < 0.2) {
        const sev = t.predictedShading30s > 0.7 ? 'high' : t.predictedShading30s > 0.4 ? 'medium' : 'low';
        events.push({
          transformerId: t.id,  transformerName: t.name,
          leadTimeSec: 30, durationSec: 60 + Math.random() * 120,
          severity: sev, probability: t.predictedShading30s,
          irradianceDrop: ghi * t.predictedShading30s * 0.8,
        });
      }
    }

    // -- Scoring --
    this.actuals.push(currentIrr);
    this.predicted.push(bands.length > 0 ? bands[0].predicted : currentIrr);
    // Store full ensemble for proper CRPS (use center-point nowcast ensemble)
    const nowcastEnsemble = this.generateScoringEnsemble(center, ghi);
    this.ensembleHistory.push(nowcastEnsemble);
    if (this.actuals.length > 100) { this.actuals.shift(); this.predicted.shift(); this.ensembleHistory.shift(); }
    const crps    = this.computeCRPS();
    const pinball = this.computePinball();
    const rel     = this.computeReliability();

    const totalGenMW = this.transformers.reduce((s, t) => s + t.currentGeneration, 0) / 1000;

    this.metrics = {
      currentIrradiance: currentIrr,
      clearSkyIrradiance: ghi,
      cloudCoverage: coverage,
      forecastHorizon: this._forecastHorizonSec,
      crps, pinballLoss: pinball, reliabilityScore: rel,
      shadingEvents: events,
      transformers: this.transformers.map(t => ({ ...t })),
      forecast30s: bands,
      clouds: this.clouds.map(c => ({ ...c, position: { ...c.position }, velocity: { ...c.velocity } })),
      totalGenerationMW: totalGenMW,
    };
    return this.metrics;
  }

  // ── Scoring helpers ───────────────────────────────────────────

  /** Generate ensemble irradiance values at the nowcast point for CRPS scoring */
  private generateScoringEnsemble(pt: { x: number; y: number }, ghi: number): number[] {
    const vals: number[] = [];
    for (let e = 0; e < this.ensembleSize; e++) {
      const perturbed: CloudState[] = this.clouds.map(c => ({
        ...c,
        position: {
          x: c.position.x + (Math.random() - 0.5) * 2,
          y: c.position.y + (Math.random() - 0.5) * 1.5,
        },
        opacity: Math.max(0, Math.min(1, c.opacity + (Math.random() - 0.5) * 0.1)),
        size: Math.max(3, c.size + (Math.random() - 0.5) * 1.5),
      }));
      const sh = this.shading(pt, perturbed);
      vals.push(ghi * (1 - sh * 0.8));
    }
    return vals;
  }

  /**
   * Proper CRPS (Continuous Ranked Probability Score)
   * CRPS = (1/N) Σ|xi - y| - (1/2N²) ΣΣ|xi - xj|
   * where xi = ensemble members, y = observation
   */
  private computeCRPS(): number {
    if (this.actuals.length < 2 || this.ensembleHistory.length < 2) return 0;
    const n = this.actuals.length;
    let totalCRPS = 0;

    for (let t = 0; t < n; t++) {
      const y = this.actuals[t];
      const ens = this.ensembleHistory[t];
      if (!ens || ens.length === 0) continue;
      const N = ens.length;

      // Term 1: (1/N) Σ|xi - y|
      let term1 = 0;
      for (let i = 0; i < N; i++) term1 += Math.abs(ens[i] - y);
      term1 /= N;

      // Term 2: (1/2N²) ΣΣ|xi - xj|
      let term2 = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          term2 += Math.abs(ens[i] - ens[j]);
        }
      }
      term2 /= (2 * N * N);

      totalCRPS += term1 - term2;
    }

    return totalCRPS / n;
  }

  private computePinball(): number {
    if (this.actuals.length < 2) return 0;
    const tau = 0.5;
    let loss = 0;
    for (let i = 0; i < this.actuals.length; i++) {
      const e = this.actuals[i] - this.predicted[i];
      loss += e >= 0 ? tau * e : (tau - 1) * e;
    }
    return loss / this.actuals.length;
  }

  private computeReliability(): number {
    const n = Math.min(this.actuals.length, 20);
    if (n < 5) return 0.85;
    let in50 = 0, in80 = 0;
    for (let i = this.actuals.length - n; i < this.actuals.length; i++) {
      const a = this.actuals[i], p = this.predicted[i];
      const sp = Math.abs(p) * 0.15 || 50;
      if (a >= p - sp     && a <= p + sp)       in50++;
      if (a >= p - sp * 1.6 && a <= p + sp * 1.6) in80++;
    }
    return 1 - (Math.abs(in50 / n - 0.5) + Math.abs(in80 / n - 0.8)) / 2;
  }

  computeMetrics(): ForecastMetrics {
    return this.step();
  }

  getTotalGenerationMW(): number {
    return this.transformers.reduce((s, t) => s + t.currentGeneration, 0) / 1000;
  }

  /** Expose cloud state for sky-camera pipeline */
  getCloudPositions(): { x: number; y: number; size: number; opacity: number }[] {
    return this.clouds.map(c => ({
      x: c.position.x, y: c.position.y, size: c.size, opacity: c.opacity,
    }));
  }

  /** Expose grid size for sky-camera coordinate mapping */
  getGridSize(): number { return this.gridSize; }

  /** Apply camera-refined cloud velocities and opacities back into forecast model */
  applyCameraRefinement(
    refined: { id: string; x: number; y: number; vx: number; vy: number; opacity: number; size: number }[]
  ): void {
    for (const r of refined) {
      const cloud = this.clouds.find(c => c.id === r.id);
      if (cloud) {
        cloud.velocity.vx = r.vx;
        cloud.velocity.vy = r.vy;
        cloud.opacity = Math.max(0, Math.min(1, r.opacity));
      }
    }
  }

  /** Return current solar elevation angle (for sky-camera image synthesis) */
  getCurrentSolarElevation(): number {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const doy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (doy - 81));
    const dRad = decl * Math.PI / 180;
    const lRad = this.latitude * Math.PI / 180;
    const ha = (hour - 12) * 15 * Math.PI / 180;
    const sinE = Math.sin(lRad) * Math.sin(dRad) + Math.cos(lRad) * Math.cos(dRad) * Math.cos(ha);
    return Math.asin(Math.max(-1, Math.min(1, sinE))) * 180 / Math.PI;
  }
}
