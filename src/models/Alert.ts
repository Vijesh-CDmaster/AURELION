import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlert extends Document {
  alertId: string;
  time: string;
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'attack';
  message: string;
  status: 'active' | 'resolved';
}

const AlertSchema = new Schema<IAlert>({
  alertId: { type: String, required: true, unique: true },
  time: { type: String, required: true },
  type: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical', 'attack'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
}, { timestamps: true });

export const Alert: Model<IAlert> =
  mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
