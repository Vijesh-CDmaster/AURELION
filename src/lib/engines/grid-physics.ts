/**
 * Grid Physics Engine
 * 
 * Implements the swing equation for frequency dynamics in a low-inertia grid:
 *   M · (df/dt) = (P_gen + P_vpp - P_load) / f₀ - D · Δf
 * 
 * Where:
 *   M  = system inertia constant (MW·s²)
 *   f₀ = nominal frequency (50 Hz)
 *   D  = damping coefficient (MW/Hz)
 *   Δf = frequency deviation from nominal (Hz)
 * 
 * This models a 100% renewable grid with very low mechanical inertia,
 * making it vulnerable to rapid frequency excursions from cloud-shading
 * or sudden load changes.
 */

export interface GridPhysicsState {
  frequency: number;
  dfdt: number;
  nominalFrequency: number;
  inertiaConstant: number;
  dampingCoefficient: number;
  totalGeneration: number;
  totalLoad: number;
  vppInjection: number;
  renewableGeneration: number;
  conventionalGeneration: number;
  powerImbalance: number;
}

export class GridPhysicsEngine {
  state: GridPhysicsState;
  private readonly dt: number; // integration time step in seconds
  private _baselineLoad: number; // load target for natural decay
  private readonly _loadDecayRate = 0.02; // fraction per step toward baseline

  constructor(dt: number = 0.05) {
    this.dt = dt;
    this._baselineLoad = 3000;
    this.state = {
      frequency: 50.0,
      dfdt: 0,
      nominalFrequency: 50.0,
      inertiaConstant: 4.0,       // Low inertia for 100% renewables grid (MW·s²)
      dampingCoefficient: 1.2,    // MW/Hz
      totalGeneration: 3000,
      totalLoad: 3000,
      vppInjection: 0,
      renewableGeneration: 2000,
      conventionalGeneration: 1000,
      powerImbalance: 0,
    };
  }

  /**
   * Advance physics by one time step using the swing equation.
   * Can be called multiple substeps per tick for higher fidelity.
   */
  step(externalLoadDelta: number = 0, renewableDelta: number = 0): GridPhysicsState {
    const s = this.state;

    // Update renewable generation
    s.renewableGeneration = Math.max(0, s.renewableGeneration + renewableDelta);
    s.totalGeneration = s.conventionalGeneration + s.renewableGeneration;

    // Apply external load perturbation (events, attacks)
    s.totalLoad = Math.max(100, s.totalLoad + externalLoadDelta);

    // Natural load decay toward baseline — injected spikes dissipate over time
    const loadDiff = s.totalLoad - this._baselineLoad;
    if (Math.abs(loadDiff) > 1) {
      s.totalLoad -= loadDiff * this._loadDecayRate;
    }

    // Power imbalance (MW)
    s.powerImbalance = s.totalGeneration + s.vppInjection - s.totalLoad;

    // Damping force
    const deltaF = s.frequency - s.nominalFrequency;
    const dampingForce = s.dampingCoefficient * deltaF;

    // Swing equation: M · (df/dt) = P_imbalance / f₀ - D · Δf
    s.dfdt = (s.powerImbalance / s.nominalFrequency - dampingForce) / s.inertiaConstant;

    // Euler integration
    s.frequency += s.dfdt * this.dt;

    // Physical limits (under-frequency relays trip at ~47 Hz, over at ~53 Hz)
    s.frequency = Math.max(47.0, Math.min(53.0, s.frequency));

    return { ...s };
  }

  /**
   * Run multiple sub-steps per simulation tick for numerical stability
   */
  multiStep(substeps: number, externalLoadDelta: number = 0, renewableDelta: number = 0): GridPhysicsState {
    const perStepLoad = externalLoadDelta / substeps;
    const perStepRenew = renewableDelta / substeps;
    let result = { ...this.state };
    for (let i = 0; i < substeps; i++) {
      result = this.step(perStepLoad, perStepRenew);
    }
    return result;
  }

  setVPPInjection(mw: number): void {
    this.state.vppInjection = mw;
  }

  setLoad(mw: number): void {
    this.state.totalLoad = Math.max(100, mw);
  }

  setRenewableGeneration(mw: number): void {
    this.state.renewableGeneration = Math.max(0, mw);
    this.state.totalGeneration = this.state.conventionalGeneration + this.state.renewableGeneration;
  }

  getFrequencyDeviation(): number {
    return this.state.frequency - this.state.nominalFrequency;
  }

  /** Rate of Change of Frequency */
  getRoCoF(): number {
    return this.state.dfdt;
  }

  /** Determine grid status from frequency deviation */
  getGridStatus(): 'stable' | 'warning' | 'critical' {
    const dev = Math.abs(this.getFrequencyDeviation());
    if (dev > 0.15) return 'critical';
    if (dev > 0.08) return 'warning';
    return 'stable';
  }
}
