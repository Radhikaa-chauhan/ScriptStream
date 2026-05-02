import mongoose from "mongoose";
import dotenv from "dotenv";
import { Prescription } from "./src/database/models";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const rx = await Prescription.find().sort({ createdAt: -1 }).limit(10);
  rx.forEach(r => console.log(r._id, r.status, r.extractedData?.doctorName));
  process.exit(0);
}
run();
