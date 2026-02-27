import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  type: string;
  status: 'online' | 'offline' | 'responding';
  load: string;
  cluster: string;
  latency: string;
}

const DeviceSchema = new Schema<IDevice>({
  deviceId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['online', 'offline', 'responding'], default: 'online' },
  load: { type: String, default: '+0.0kW' },
  cluster: { type: String, required: true },
  latency: { type: String, default: '0ms' },
}, { timestamps: true });

export const Device: Model<IDevice> =
  mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);
