import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgentCluster extends Document {
  name: string;
  count: number;
  response: number;
  status: 'active' | 'idle';
}

const AgentClusterSchema = new Schema<IAgentCluster>({
  name: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  response: { type: Number, default: 95 },
  status: { type: String, enum: ['active', 'idle'], default: 'active' },
}, { timestamps: true });

export const AgentCluster: Model<IAgentCluster> =
  mongoose.models.AgentCluster || mongoose.model<IAgentCluster>('AgentCluster', AgentClusterSchema);
