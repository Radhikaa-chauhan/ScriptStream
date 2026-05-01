import { Router } from "express";
import { register, login, authenticateJWT, AuthRequest } from "./auth";
import { graph } from "../graph/graph";
import { Prescription } from "../database/models";
import mongoose from "mongoose";

const router = Router();

// Auth Routes
router.post("/auth/register", register as any);
router.post("/auth/login", login as any);

// AI Trigger Route
router.post("/analyze", authenticateJWT as any, async (req: AuthRequest, res: any) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const userId = req.user?.id;

    // Create an initial prescription record
    const newPrescription = new Prescription({
      userId,
      originalImage: image, // Ideally this would be stored in S3 and we store the URL
      status: "pending"
    });
    await newPrescription.save();

    // Trigger LangGraph Workflow
    // In a real app, this might be offloaded to a queue (like BullMQ)
    // to prevent holding the HTTP connection open for too long.
    // For V1 MVP, we trigger it directly or asynchronously.
    
    // Fire and forget (async) to not block the response
    const runGraph = async () => {
      try {
        const result = await graph.invoke({
           prescriptionImage: image,
           status: "started",
           extractedData: { medications: [] },
           safetyWarnings: [],
           schedule: { morning: [], afternoon: [], evening: [], night: [], notes: [] }
        });

        // Update prescription with result
        await Prescription.findByIdAndUpdate(newPrescription._id, {
           extractedData: result.extractedData,
           dailySchedule: result.schedule,
           safetyWarnings: result.safetyWarnings,
           status: "processed"
        });

      } catch (error) {
        console.error("Graph execution error:", error);
        await Prescription.findByIdAndUpdate(newPrescription._id, { status: "failed" });
      }
    };

    runGraph();

    return res.status(202).json({
      message: "Analysis started",
      prescriptionId: newPrescription._id
    });

  } catch (error) {
    console.error("Analysis route error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch History Route
router.get("/prescriptions", authenticateJWT as any, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const history = await Prescription.find({ userId }).sort({ createdAt: -1 });
    return res.json({ prescriptions: history });
  } catch (error) {
    console.error("Fetch history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
