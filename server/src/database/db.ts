import mongoose from "mongoose";

console.log("[DATABASE] Loading database module...");

/**
 * MongoDB Connection Utility
 */
export const connectDB = async () => {
  console.log("[DATABASE] Attempting to connect to MongoDB...");
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn("[DATABASE] ❌ MONGODB_URI not found in environment. Database features will be disabled.");
    return;
  }

  try {
    console.log("[DATABASE] Connecting to:", mongoURI.split("@")[0] + "***");
    await mongoose.connect(mongoURI);
    console.log("[DATABASE] ✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("[DATABASE] ❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};
