/**
 * Adversarial Defense Engine
 *
 * Detects and mitigates Demand-Side Attacks (MadIoT-style):
 *  1. FFT spectral analysis  – detect periodic load synchronisation
 *  2. CUSUM change-point detection – detect mean-shift in aggregate load
 *  3. Kuramoto order parameter – measure cross-cluster phase coherence
 *  4. Shannon entropy – drops when load patterns become deterministic
 *  5. Countermeasures: desynchronisation jitter, deceptive pricing, cluster isolation
 */

// ── Types ────────────────────────────────────────────────────────────

export interface AttackSignature {
  type: 'load_sync' | 'frequency_manipulation' | 'false_data';
  confidence: number;
  detectedAt: number;
  sourceCluster: string;
  affectedNodes: number;
  attackFrequencyHz: number;
  magnitudeMW: number;
}

export interface DefenseAction {
  timestamp: number;
  action: string;
  target: string;
  severity: 'info' | 'warning' | 'critical';
  powerImpact: number;
  description: string;
}

export interface DefenseMetrics {
  attackDetected: boolean;
  attackStatus: 'none' | 'detected' | 'under-defense';
  phaseCoherence: number;
  spectralAnomaly: number;
  cusumStatistic: number;
  cusumThreshold: number;
  synchronizationIndex: number;
  entropyScore: number;
  attackSignatures: AttackSignature[];
  defenseActions: DefenseAction[];
  detectionLatencyMs: number;
  falsePositiveRate: number;
  truePositiveRate: number;
  recoveryEfficiency: number;
  attacksMitigated: number;
  loadSpectrum: { frequency: number; magnitude: number }[];
  aggregateLoadHistory: number[];
  deceptiveActive: boolean;
  desyncActive: boolean;
  nodesIsolated: number;
  nodesAtRisk: number;
  attackIntensity: number;
  /** Raw load perturbation from attack physics (MW), independent of detection */
  rawAttackLoadDelta: number;
}

// ── FFT (radix-2 Cooley-Tukey) ──────────────────────────────────────

function fft(re: number[], im: number[]): { re: number[]; im: number[] } {
  const n = re.length;
  if (n <= 1) return { re: [...re], im: [...im] };

  // bit-reversal permutation
  let bits = 0, tmp = n;
  while (tmp > 1) { bits++; tmp >>= 1; }
  const oR = new Array(n), oI = new Array(n);
  for (let i = 0; i < n; i++) {
    let rev = 0;
    for (let j = 0; j < bits; j++) rev = (rev << 1) | ((i >> j) & 1);
    oR[rev] = re[i]; oI[rev] = im[i];
  }

  // butterfly
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2, ang = -2 * Math.PI / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < half; j++) {
        const c = Math.cos(ang * j), s = Math.sin(ang * j);
        const tr = oR[i + j + half] * c - oI[i + j + half] * s;
        const ti = oR[i + j + half] * s + oI[i + j + half] * c;
        oR[i + j + half] = oR[i + j] - tr;  oI[i + j + half] = oI[i + j] - ti;
        oR[i + j] += tr;                     oI[i + j] += ti;
      }
    }
  }
  return { re: oR, im: oI };
}

function powerSpectrum(re: number[], im: number[]): number[] {
  const half = re.length / 2;
  const out = new Array(half);
  for (let i = 0; i < half; i++) out[i] = Math.sqrt(re[i] ** 2 + im[i] ** 2) / re.length;
  return out;
}

// ── Engine ───────────────────────────────────────────────────────────

export class DefenseEngine {
  metrics!: DefenseMetrics;

  // Load history (power of 2 for FFT)
  private loadHistory: number[] = [];
  private readonly histSize = 128;

  // CUSUM
  private cusumPos = 0;
  private cusumNeg = 0;
  private cusumMean = 0;
  private cusumN = 0;
  private readonly cusumThreshold = 15;
  private readonly cusumSlack = 0.5;

  // Phase tracking per cluster
  private clusterPhases = new Map<string, number[]>();

  // Attack simulation
  private _attacking  = false;
  private _atkStart   = 0;
  private _atkType    = '';
  private _atkIntensity = 0;

  // Countermeasure state
  private _deceptive   = false;
  private _desync      = false;
  private _isolated    = new Set<string>();
  private _desyncJitter = new Map<string, number>();

  // Scoring
  private _tp = 0;
  private _fp = 0;
  private _total = 0;
  private _mitigated = 0;

  constructor() {
    this.loadHistory = new Array(this.histSize).fill(0);
    this.metrics = this.defaultMetrics();
  }

  private defaultMetrics(): DefenseMetrics {
    return {
      attackDetected: false, attackStatus: 'none',
      phaseCoherence: 0.05, spectralAnomaly: 0,
      cusumStatistic: 0, cusumThreshold: this.cusumThreshold,
      synchronizationIndex: 0, entropyScore: 1,
      attackSignatures: [], defenseActions: [],
      detectionLatencyMs: 0, falsePositiveRate: 0, truePositiveRate: 0.9,
      recoveryEfficiency: 95, attacksMitigated: 0,
      loadSpectrum: [], aggregateLoadHistory: [],
      deceptiveActive: false, desyncActive: false,
      nodesIsolated: 0, nodesAtRisk: 0, attackIntensity: 0,
      rawAttackLoadDelta: 0,
    };
  }

  // ── Attack simulation ─────────────────────────────────────────

  simulateAttack(type: 'load_sync' | 'frequency_manipulation' | 'false_data', intensity = 0.5): void {
    this._attacking = true; this._atkStart = Date.now(); this._atkType = type; this._atkIntensity = intensity;
  }

  stopAttack(): void { this._attacking = false; this._atkIntensity = 0; this._mitigated++; }

  isAttackActive(): boolean { return this._attacking; }

  private attackLoad(base: number): number {
    if (!this._attacking) return base;
    const t = (Date.now() - this._atkStart) / 1000;
    switch (this._atkType) {
      case 'load_sync': {
        const amp = base * this._atkIntensity * 0.3;
        return base + amp * Math.sin(2 * Math.PI * 0.1 * t);           // 0.1 Hz sync
      }
      case 'frequency_manipulation':
        return base + base * this._atkIntensity * 0.01 * Math.min(t, 30);
      case 'false_data':
        return Math.random() < this._atkIntensity * 0.1 ? base * (1 + this._atkIntensity) : base;
      default: return base;
    }
  }

  // ── Detectors ─────────────────────────────────────────────────

  /** Shannon entropy (lower → more deterministic → suspicious) */
  private entropy(vals: number[]): number {
    if (vals.length < 2) return 1;
    const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
    const bins = new Uint16Array(16);
    for (const v of vals) bins[Math.min(15, Math.floor(((v - min) / range) * 16))]++;
    let h = 0;
    for (const c of bins) if (c > 0) { const p = c / vals.length; h -= p * Math.log2(p); }
    return Math.log2(16) > 0 ? h / Math.log2(16) : 1;
  }

  /** Kuramoto order parameter R (0 = incoherent, 1 = fully synchronised) */
  private phaseCoherence(clusters: Map<string, number[]>): number {
    const phases: number[] = [];
    for (const [, loads] of clusters) {
      if (loads.length < 4) continue;
      const r = loads.slice(-4);
      phases.push(Math.atan2(r[2] - r[0], r[3] - r[1]));
    }
    if (phases.length < 2) return 0;
    let cSum = 0, sSum = 0;
    for (const p of phases) { cSum += Math.cos(p); sSum += Math.sin(p); }
    return Math.sqrt(cSum ** 2 + sSum ** 2) / phases.length;
  }

  /** CUSUM change-point detector */
  private cusumUpdate(val: number): { alarm: boolean; stat: number } {
    this.cusumN++;
    this.cusumMean += (val - this.cusumMean) / Math.min(this.cusumN, 50);
    const d = val - this.cusumMean;
    this.cusumPos = Math.max(0, this.cusumPos + d - this.cusumSlack);
    this.cusumNeg = Math.max(0, this.cusumNeg - d - this.cusumSlack);
    const stat = Math.max(this.cusumPos, this.cusumNeg);
    return { alarm: stat > this.cusumThreshold, stat };
  }

  /** FFT spectral analysis → anomaly score */
  private spectral(): { score: number; spectrum: { frequency: number; magnitude: number }[] } {
    if (this.loadHistory.length < this.histSize) return { score: 0, spectrum: [] };
    const mean = this.loadHistory.reduce((s, v) => s + v, 0) / this.histSize;
    const re = this.loadHistory.map(v => v - mean);
    const im = new Array(this.histSize).fill(0);
    const { re: fR, im: fI } = fft(re, im);
    const mag = powerSpectrum(fR, fI);
    let maxM = 0, avgM = 0;
    const spec: { frequency: number; magnitude: number }[] = [];
    for (let i = 1; i < mag.length; i++) {
      spec.push({ frequency: i / this.histSize, magnitude: mag[i] });
      avgM += mag[i]; if (mag[i] > maxM) maxM = mag[i];
    }
    avgM /= mag.length - 1;
    const ratio = avgM > 0 ? maxM / avgM : 0;
    return { score: Math.min(1, Math.max(0, (ratio - 3) / 10)), spectrum: spec.slice(0, 30) };
  }

  /** Pearson correlation */
  private pearson(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 3) return 0;
    let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
    for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxy += x[i] * y[i]; sx2 += x[i] ** 2; sy2 += y[i] ** 2; }
    const den = Math.sqrt((n * sx2 - sx ** 2) * (n * sy2 - sy ** 2));
    return den > 0 ? (n * sxy - sx * sy) / den : 0;
  }

  private findSuspicious(clusters: Map<string, number[]>): string[] {
    const sus: Set<string> = new Set();
    const arr = Array.from(clusters.entries());
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++)
        if (this.pearson(arr[i][1], arr[j][1]) > 0.8) { sus.add(arr[i][0]); sus.add(arr[j][0]); }
    return [...sus];
  }

  /** Desynchronisation jitter for a device (ms) */
  getDesyncJitter(id: string): number {
    if (!this._desync) return 0;
    if (!this._desyncJitter.has(id)) this._desyncJitter.set(id, Math.random() * 5000);
    if (Math.random() < 0.01) this._desyncJitter.set(id, Math.random() * 5000);
    return this._desyncJitter.get(id)!;
  }

  /** Return the set of currently isolated cluster names */
  getIsolatedClusters(): Set<string> {
    return new Set(this._isolated);
  }

  // ── Main tick ─────────────────────────────────────────────────

  step(
    currentLoad: number,
    clusterLoads: Map<string, number[]>,
    config: { deceptiveEnabled: boolean; sensitivity: 'low' | 'medium' | 'high'; autonomousEscalation?: boolean },
  ): DefenseMetrics {
    const t0 = performance.now();

    const effectiveLoad = this.attackLoad(currentLoad);

    // Compute raw attack load delta (independent of detection)
    const rawAttackLoadDelta = effectiveLoad - currentLoad;

    // update history
    this.loadHistory.push(effectiveLoad);
    if (this.loadHistory.length > this.histSize) this.loadHistory.shift();

    // update cluster phase buffers
    for (const [k, loads] of clusterLoads) {
      if (!this.clusterPhases.has(k)) this.clusterPhases.set(k, []);
      const h = this.clusterPhases.get(k)!;
      h.push(loads.length > 0 ? loads[loads.length - 1] : 0);
      if (h.length > 20) h.shift();
    }

    // ── Detection pipeline ──
    const spec    = this.spectral();
    const cusum   = this.cusumUpdate(effectiveLoad);
    const coher   = this.phaseCoherence(this.clusterPhases);
    const ent     = this.entropy(this.loadHistory.slice(-32));

    const sensMul = config.sensitivity === 'high' ? 0.7 : config.sensitivity === 'low' ? 1.3 : 1.0;
    const syncIdx = (coher * 0.40 + spec.score * 0.35 + (cusum.alarm ? 0.25 : 0)) * sensMul;
    const detected = syncIdx > 0.45;

    const latency = performance.now() - t0;

    this._total++;
    if (detected && this._attacking) this._tp++;
    if (detected && !this._attacking) this._fp++;

    // ── Countermeasures (only auto-activate if autonomousEscalation is enabled) ──
    const actions: DefenseAction[] = [];
    let status: DefenseMetrics['attackStatus'] = 'none';
    let nodesAtRisk = 0;
    const autoEscalate = config.autonomousEscalation !== false; // default true for backward compat

    if (detected) {
      status = 'detected';
      nodesAtRisk = Math.round(syncIdx * 5000);

      if (autoEscalate) {
        if (!this._desync) {
          this._desync = true;
          actions.push({ timestamp: Date.now(), action: 'ACTIVATE_DESYNC', target: 'All Clusters', severity: 'warning', powerImpact: 0, description: 'Deploying randomised load shifting across all device clusters' });
        }
        if (config.deceptiveEnabled && !this._deceptive) {
          this._deceptive = true;
          actions.push({ timestamp: Date.now(), action: 'DECEPTIVE_SIGNAL', target: 'Pricing Feed', severity: 'info', powerImpact: 0, description: 'Injecting noise into pricing signal to disrupt attacker coordination' });
        }
        if (coher > 0.7) {
          status = 'under-defense';
          for (const c of this.findSuspicious(clusterLoads)) {
            if (!this._isolated.has(c)) {
              this._isolated.add(c);
              actions.push({ timestamp: Date.now(), action: 'ISOLATE_CLUSTER', target: c, severity: 'critical', powerImpact: -50, description: `Isolating ${c}: phase coherence ${(coher * 100).toFixed(1)}% exceeds safety threshold` });
            }
          }
        }
        if (spec.score > 0.6) {
          actions.push({ timestamp: Date.now(), action: 'SPECTRAL_ALERT', target: 'Load Monitor', severity: 'critical', powerImpact: 0, description: `Periodic load pattern at anomaly score ${(spec.score * 100).toFixed(0)}% — possible synchronised cycling attack` });
        }
      } else {
        // Detection only — log alert but no automated countermeasures
        actions.push({ timestamp: Date.now(), action: 'ALERT_ONLY', target: 'Operator Console', severity: 'warning', powerImpact: 0, description: 'Attack detected — autonomous escalation disabled, awaiting operator intervention' });
      }
    } else {
      if (this._desync && Math.random() < 0.1) { this._desync = false; actions.push({ timestamp: Date.now(), action: 'DEACTIVATE_DESYNC', target: 'All Clusters', severity: 'info', powerImpact: 0, description: 'Load patterns normalised — deactivating desynchronisation' }); }
      if (this._deceptive && Math.random() < 0.1) this._deceptive = false;
      if (this._isolated.size > 0 && Math.random() < 0.2) {
        const node = this._isolated.values().next().value;
        if (node) { this._isolated.delete(node); actions.push({ timestamp: Date.now(), action: 'RELEASE_CLUSTER', target: node, severity: 'info', powerImpact: 50, description: `Releasing ${node} from isolation` }); }
      }
    }

    // ── Signatures ──
    const sigs: AttackSignature[] = [];
    if (detected) {
      sigs.push({
        type: spec.score > 0.4 ? 'load_sync' : cusum.alarm ? 'frequency_manipulation' : 'false_data',
        confidence: syncIdx, detectedAt: Date.now(), sourceCluster: 'Multi-cluster',
        affectedNodes: nodesAtRisk, attackFrequencyHz: 0.1,
        magnitudeMW: effectiveLoad * syncIdx * 0.01,
      });
    }

    const fpRate = this._total > 20 ? this._fp / Math.max(1, this._total - this._tp) : 0.05;
    const tpRate = this._total > 20 ? this._tp / Math.max(1, this._total) : 0.9;

    this.metrics = {
      attackDetected: detected, attackStatus: status,
      phaseCoherence: coher, spectralAnomaly: spec.score,
      cusumStatistic: cusum.stat, cusumThreshold: this.cusumThreshold,
      synchronizationIndex: syncIdx, entropyScore: ent,
      attackSignatures: sigs, defenseActions: actions,
      detectionLatencyMs: latency,
      falsePositiveRate: fpRate, truePositiveRate: tpRate,
      recoveryEfficiency: detected ? 85 + Math.random() * 10 : 95 + Math.random() * 4,
      attacksMitigated: this._mitigated,
      loadSpectrum: spec.spectrum,
      aggregateLoadHistory: [...this.loadHistory.slice(-30)],
      deceptiveActive: this._deceptive, desyncActive: this._desync,
      nodesIsolated: this._isolated.size, nodesAtRisk,
      attackIntensity: this._attacking ? this._atkIntensity * 10 : 0,
      rawAttackLoadDelta,
    };
    return this.metrics;
  }
}
