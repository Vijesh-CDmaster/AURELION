/**
 * SimulationMetric Model
 *
 * Stores per-tick simulation telemetry for long-term analytics.
 * Only a subset of each tick is persisted (key KPIs) to keep storage reasonable.
 * At ~1 doc every 2 s = ~43,200 docs/day.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISimulationMetric extends Document {
  tick: number;
  frequency: number;
  dfdt: number;
  totalLoad: number;
  totalGeneration: number;
  renewableGeneration: number;
  vppResponseMW: number;
  solarGenerationKW: number;

  // MARL snapshot
  marlAvgReward: number;
  marlConvergence: number;
  marlEpisode: number;
  marlVirtualInertia: number;
  avgResponseTimeMs: number;

  // Defense snapshot
  attackDetected: boolean;
  phaseCoherence: number;
  spectralAnomaly: number;
  cusumStatistic: number;

  // Forecast snapshot
  crps: number;
  reliabilityScore: number;
  cloudCoverage: number;

  // Sky camera
  rampAlert: boolean;
  rampMagnitude: number;

  createdAt: Date;
}

const SimulationMetricSchema = new Schema<ISimulationMetric>(
  {
    tick:                  { type: Number, required: true },
    frequency:             { type: Number, required: true },
    dfdt:                  { type: Number, required: true },
    totalLoad:             { type: Number, required: true },
    totalGeneration:       { type: Number, required: true },
    renewableGeneration:   { type: Number, required: true },
    vppResponseMW:         { type: Number, required: true },
    solarGenerationKW:     { type: Number, required: true },

    marlAvgReward:         { type: Number, default: 0 },
    marlConvergence:       { type: Number, default: 0 },
    marlEpisode:           { type: Number, default: 0 },
    marlVirtualInertia:    { type: Number, default: 0 },
    avgResponseTimeMs:     { type: Number, default: 0 },

    attackDetected:        { type: Boolean, default: false },
    phaseCoherence:        { type: Number, default: 0 },
    spectralAnomaly:       { type: Number, default: 0 },
    cusumStatistic:        { type: Number, default: 0 },

    crps:                  { type: Number, default: 0 },
    reliabilityScore:      { type: Number, default: 0.85 },
    cloudCoverage:         { type: Number, default: 0 },

    rampAlert:             { type: Boolean, default: false },
    rampMagnitude:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index: auto-delete metrics older than 7 days to save space
SimulationMetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
SimulationMetricSchema.index({ tick: -1 });

export const SimulationMetric: Model<ISimulationMetric> =
  mongoose.models.SimulationMetric ||
  mongoose.model<ISimulationMetric>('SimulationMetric', SimulationMetricSchema);
