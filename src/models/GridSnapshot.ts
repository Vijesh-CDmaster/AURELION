import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Periodic snapshot of grid telemetry for historical tracking.
 * Written every N ticks by the snapshot API.
 */
export interface IGridSnapshot extends Document {
  timestamp: Date;
  frequency: number;
  latency: number;
  solarGeneration: number;
  loadDemand: number;
  energySaved: number;
  vppResponse: number;
  dfdt: number;
  status: string;
  activeAgents: number;
  agentSyncRate: number;
  phaseCoherence: number;
  attackStatus: string;
  attackIntensity: number;
  nodesAtRisk: number;
  assetsReachable: number;
  onlineDevices: number;
  offlineDevices: number;
  controllableLoad: number;
}

const GridSnapshotSchema = new Schema<IGridSnapshot>({
  timestamp: { type: Date, default: Date.now, index: true },
  frequency: Number,
  latency: Number,
  solarGeneration: Number,
  loadDemand: Number,
  energySaved: Number,
  vppResponse: Number,
  dfdt: Number,
  status: String,
  activeAgents: Number,
  agentSyncRate: Number,
  phaseCoherence: Number,
  attackStatus: String,
  attackIntensity: Number,
  nodesAtRisk: Number,
  assetsReachable: Number,
  onlineDevices: Number,
  offlineDevices: Number,
  controllableLoad: Number,
});

// TTL index: auto-delete snapshots older than 7 days
GridSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

export const GridSnapshot: Model<IGridSnapshot> =
  mongoose.models.GridSnapshot || mongoose.model<IGridSnapshot>('GridSnapshot', GridSnapshotSchema);
