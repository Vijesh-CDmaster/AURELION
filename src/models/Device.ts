/**
 * Device Model
 *
 * Persists device state for the /api/grid/devices route.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  type: string;
  status: 'online' | 'offline' | 'responding';
  load: string;
  cluster: string;
  latency: string;
  createdAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: { type: String, required: true, unique: true },
    type:     { type: String, required: true },
    status:   { type: String, enum: ['online', 'offline', 'responding'], default: 'online' },
    load:     { type: String, default: '0kW' },
    cluster:  { type: String, default: '' },
    latency:  { type: String, default: 'N/A' },
  },
  { timestamps: true }
);

export const Device: Model<IDevice> =
  mongoose.models.Device ||
  mongoose.model<IDevice>('Device', DeviceSchema);
