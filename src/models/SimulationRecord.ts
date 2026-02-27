import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISimulationRecord extends Document {
  simId: string;
  scenario: string;
  date: string;
  stability: string;
  outcome: string;
  params: {
    intensity: number;
    affectedNodes: number;
    duration: number;
  };
  results: {
    maxDeviation: number;
    recoveryTime: number;
    energyCurtailed: number;
  } | null;
}

const SimulationRecordSchema = new Schema<ISimulationRecord>({
  simId: { type: String, required: true, unique: true },
  scenario: { type: String, required: true },
  date: { type: String, required: true },
  stability: { type: String, required: true },
  outcome: { type: String, enum: ['SUCCESS', 'WARNING', 'FAILURE'], required: true },
  params: {
    intensity: Number,
    affectedNodes: Number,
    duration: Number,
  },
  results: {
    type: {
      maxDeviation: Number,
      recoveryTime: Number,
      energyCurtailed: Number,
    },
    default: null,
  },
}, { timestamps: true });

export const SimulationRecord: Model<ISimulationRecord> =
  mongoose.models.SimulationRecord || mongoose.model<ISimulationRecord>('SimulationRecord', SimulationRecordSchema);
