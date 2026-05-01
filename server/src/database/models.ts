import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", UserSchema);

export interface IPrescription extends Document {
  userId: mongoose.Types.ObjectId;
  originalImage?: string;
  extractedData: any;
  dailySchedule: any;
  safetyWarnings: any[];
  confidenceScore: number;
  status: "pending" | "processed" | "failed";
  createdAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  originalImage: { type: String }, // Can be a URL or base64
  extractedData: { type: Schema.Types.Mixed, default: {} },
  dailySchedule: { type: Schema.Types.Mixed, default: {} },
  safetyWarnings: { type: [String], default: [] },
  confidenceScore: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "processed", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export const Prescription = mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
