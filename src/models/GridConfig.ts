import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGridConfig extends Document {
  _id: string; // singleton key
  vppEnabled: boolean;
  bidirectionalCharging: boolean;
  responseThreshold: number;
  capacityReserved: number;
  criticalWarningLevel: number;
  detectionSensitivity: 'low' | 'medium' | 'high';
  deceptiveSignalInjection: boolean;
  autonomousEscalation: boolean;
  forecastHorizon: '10s' | '30s' | '60s';
  skyCamEnabled: boolean;
  primaryGridFeed: string;
  marlLearningRate: number;
  marlDiscountFactor: number;
  dataSources: { name: string; status: string }[];
  updatedAt: Date;
}

const GridConfigSchema = new Schema<IGridConfig>({
  _id: { type: String, default: 'default' },
  vppEnabled: { type: Boolean, default: true },
  bidirectionalCharging: { type: Boolean, default: true },
  responseThreshold: { type: Number, default: 0.05 },
  capacityReserved: { type: Number, default: 15 },
  criticalWarningLevel: { type: Number, default: 0.25 },
  detectionSensitivity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  deceptiveSignalInjection: { type: Boolean, default: true },
  autonomousEscalation: { type: Boolean, default: true },
  forecastHorizon: { type: String, enum: ['10s', '30s', '60s'], default: '30s' },
  skyCamEnabled: { type: Boolean, default: true },
  primaryGridFeed: { type: String, default: 'https://api.aura-sentinel.io/v1/feed' },
  marlLearningRate: { type: Number, default: 0.001 },
  marlDiscountFactor: { type: Number, default: 0.95 },
  dataSources: [{ name: String, status: String }],
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const GridConfig: Model<IGridConfig> =
  mongoose.models.GridConfig || mongoose.model<IGridConfig>('GridConfig', GridConfigSchema);
