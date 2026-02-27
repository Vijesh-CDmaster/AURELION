/**
 * TrainingSnapshot Model
 *
 * Persists the Q-tables and per-agent metadata so that MARL training
 * survives page refreshes and server restarts.
 *
 * Each document stores a single point-in-time snapshot of ALL 100 agents.
 * Q-tables are stored as base64-encoded Float32Array buffers for compactness
 * (~100 agents × 4,950 states × 5 actions × 4 bytes ≈ 9.4 MB per snapshot).
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgentSnapshot {
  agentId: string;
  clusterId: number;
  qTableBase64: string;       // base64-encoded Float32Array
  epsilon: number;
  cumulativeReward: number;
  lastAction: number;
  lastState: number;
  totalLoad: number;
  devices: {
    type: string;
    ratedPower: number;
    currentPower: number;
    stateOfCharge: number;
    isControllable: boolean;
    comfortCost: number;
  }[];
}

export interface ITrainingSnapshot extends Document {
  snapshotId: string;          // unique label, e.g. "auto-ep-500"
  createdAt: Date;
  episodeCount: number;
  avgReward: number;
  convergenceRate: number;
  frequencyTrackingError: number;
  qTableStats: {
    avgQ: number;
    maxQ: number;
    minQ: number;
    nonZeroPercent: number;
  };
  hyperparams: {
    learningRate: number;
    discountFactor: number;
    epsilonDecay: number;
    minEpsilon: number;
  };
  agents: IAgentSnapshot[];
}

const AgentSnapshotSchema = new Schema<IAgentSnapshot>(
  {
    agentId:          { type: String, required: true },
    clusterId:        { type: Number, required: true },
    qTableBase64:     { type: String, required: true },
    epsilon:          { type: Number, required: true },
    cumulativeReward: { type: Number, required: true },
    lastAction:       { type: Number, required: true },
    lastState:        { type: Number, required: true },
    totalLoad:        { type: Number, required: true },
    devices:          [{
      type:            { type: String },
      ratedPower:      Number,
      currentPower:    Number,
      stateOfCharge:   Number,
      isControllable:  Boolean,
      comfortCost:     Number,
    }],
  },
  { _id: false }
);

const TrainingSnapshotSchema = new Schema<ITrainingSnapshot>(
  {
    snapshotId:             { type: String, required: true, unique: true },
    episodeCount:           { type: Number, required: true },
    avgReward:              { type: Number, required: true },
    convergenceRate:        { type: Number, required: true },
    frequencyTrackingError: { type: Number, default: 0 },
    qTableStats: {
      avgQ:           { type: Number, default: 0 },
      maxQ:           { type: Number, default: 0 },
      minQ:           { type: Number, default: 0 },
      nonZeroPercent: { type: Number, default: 0 },
    },
    hyperparams: {
      learningRate:   { type: Number, default: 0.001 },
      discountFactor: { type: Number, default: 0.95 },
      epsilonDecay:   { type: Number, default: 0.9995 },
      minEpsilon:     { type: Number, default: 0.05 },
    },
    agents: [AgentSnapshotSchema],
  },
  { timestamps: true }
);

// Index for fast "latest" queries
TrainingSnapshotSchema.index({ createdAt: -1 });

export const TrainingSnapshot: Model<ITrainingSnapshot> =
  mongoose.models.TrainingSnapshot ||
  mongoose.model<ITrainingSnapshot>('TrainingSnapshot', TrainingSnapshotSchema);
