/**
 * AlertLog Model
 *
 * Persists every system alert (frequency excursions, attacks, ramp events)
 * so the Event Log / Audit Trail page shows historical data even after refresh.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlertLog extends Document {
  alertId: string;
  time: string;
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'attack';
  message: string;
  status: 'active' | 'resolved';
  frequency?: number;
  dfdt?: number;
  attackIntensity?: number;
  resolvedAt?: Date;
  createdAt: Date;
}

const AlertLogSchema = new Schema<IAlertLog>(
  {
    alertId:         { type: String, required: true, unique: true },
    time:            { type: String, required: true },
    type:            { type: String, required: true },
    severity:        { type: String, enum: ['info', 'warning', 'critical', 'attack'], required: true },
    message:         { type: String, required: true },
    status:          { type: String, enum: ['active', 'resolved'], default: 'active' },
    frequency:       { type: Number },
    dfdt:            { type: Number },
    attackIntensity: { type: Number },
    resolvedAt:      { type: Date },
  },
  { timestamps: true }
);

AlertLogSchema.index({ createdAt: -1 });
AlertLogSchema.index({ type: 1, createdAt: -1 });

export const AlertLog: Model<IAlertLog> =
  mongoose.models.AlertLog ||
  mongoose.model<IAlertLog>('AlertLog', AlertLogSchema);
