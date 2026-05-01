import mongoose from "mongoose";

/**
 * MongoDB Connection Utility
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn("MONGO_URI not found in environment. Database features will be disabled.");
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
};
