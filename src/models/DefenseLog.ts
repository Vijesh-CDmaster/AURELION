import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDefenseLog extends Document {
  time: string;
  action: string;
  target: string;
  severity: 'info' | 'warning' | 'critical';
}

const DefenseLogSchema = new Schema<IDefenseLog>({
  time: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
}, { timestamps: true });

export const DefenseLog: Model<IDefenseLog> =
  mongoose.models.DefenseLog || mongoose.model<IDefenseLog>('DefenseLog', DefenseLogSchema);
