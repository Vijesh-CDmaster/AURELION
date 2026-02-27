/**
 * AgentCluster Model
 *
 * Persists agent cluster metadata for the /api/grid/clusters route.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgentCluster extends Document {
  name: string;
  count: number;
  response: number;
  status: 'active' | 'idle';
  dominantAction?: string;
  avgReward?: number;
  createdAt: Date;
}

const AgentClusterSchema = new Schema<IAgentCluster>(
  {
    name:           { type: String, required: true, unique: true },
    count:          { type: Number, default: 0 },
    response:       { type: Number, default: 0 },
    status:         { type: String, enum: ['active', 'idle'], default: 'active' },
    dominantAction: { type: String },
    avgReward:      { type: Number },
  },
  { timestamps: true }
);

export const AgentCluster: Model<IAgentCluster> =
  mongoose.models.AgentCluster ||
  mongoose.model<IAgentCluster>('AgentCluster', AgentClusterSchema);
