/**
 * GridConfig Model
 *
 * Stores snapshots of grid configuration for reproducibility.
 * Whenever the user changes a config value, a new snapshot is saved.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGridConfig extends Document {
  label: string;          // human-readable name (e.g. "Default", "High-Inertia")
  
  // MARL hyper-parameters
  learningRate: number;
  discountFactor: number;
  epsilonDecay: number;
  minEpsilon: number;
  numAgents: number;
  householdsPerAgent: number;

  // Physics / grid parameters
  nominalFrequency: number;
  inertiaConstant: number;
  dampingCoefficient: number;
  loadSensitivity: number;

  // VPP / battery
  batteryCapacityKWh: number;
  maxChargePowerKW: number;
  maxDischargePowerKW: number;
  capacityReservedPercent: number;
  bidirectionalCharging: boolean;

  // Defense
  autonomousEscalation: boolean;
  isolateCorruptedClusters: boolean;
  cusumThreshold: number;
  spectralThreshold: number;

  // Forecast
  forecastHorizon: number;     // in seconds
  crpsAlpha: number;

  // UI toggles
  tickIntervalMs: number;
  dbSaveInterval: number;      // ticks between DB flushes

  createdAt: Date;
}

const GridConfigSchema = new Schema<IGridConfig>(
  {
    label:                      { type: String, default: 'Default' },

    learningRate:               { type: Number, default: 0.01 },
    discountFactor:             { type: Number, default: 0.95 },
    epsilonDecay:               { type: Number, default: 0.9995 },
    minEpsilon:                 { type: Number, default: 0.05 },
    numAgents:                  { type: Number, default: 100 },
    householdsPerAgent:         { type: Number, default: 100 },

    nominalFrequency:           { type: Number, default: 50 },
    inertiaConstant:            { type: Number, default: 5 },
    dampingCoefficient:         { type: Number, default: 1 },
    loadSensitivity:            { type: Number, default: 1, },

    batteryCapacityKWh:         { type: Number, default: 13.5 },
    maxChargePowerKW:           { type: Number, default: 5 },
    maxDischargePowerKW:        { type: Number, default: 5 },
    capacityReservedPercent:    { type: Number, default: 20 },
    bidirectionalCharging:      { type: Boolean, default: true },

    autonomousEscalation:       { type: Boolean, default: true },
    isolateCorruptedClusters:   { type: Boolean, default: false },
    cusumThreshold:             { type: Number, default: 5 },
    spectralThreshold:          { type: Number, default: 0.3 },

    forecastHorizon:            { type: Number, default: 30 },
    crpsAlpha:                  { type: Number, default: 0.05 },

    tickIntervalMs:             { type: Number, default: 2000 },
    dbSaveInterval:             { type: Number, default: 50 },
  },
  { timestamps: true }
);

GridConfigSchema.index({ createdAt: -1 });

export const GridConfig: Model<IGridConfig> =
  mongoose.models.GridConfig ||
  mongoose.model<IGridConfig>('GridConfig', GridConfigSchema);
