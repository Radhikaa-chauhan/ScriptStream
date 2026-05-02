import { Router } from "express";
import { register, login, authenticateJWT, AuthRequest } from "./auth";
import { graph } from "../graph/graph";
import { Prescription } from "../database/models";
import { analysisQueue } from "../workers/graphWorker";
import adminRoutes from "./admin";

const router = Router();

// Mount Admin Routes
router.use("/admin", adminRoutes);

// Auth Routes
router.post("/auth/register", register as any);
router.post("/auth/login", login as any);

// AI Trigger Route
router.post("/analyze", authenticateJWT as any, async (req: AuthRequest, res: any) => {
  try {
    console.log("[ROUTES] /analyze endpoint called");
    const { image } = req.body;
    if (!image) {
      console.log("[ROUTES] ❌ No image provided");
      return res.status(400).json({ message: "Image is required" });
    }

    const userId = req.user?.id;
    console.log("[ROUTES] User ID:", userId);

    // Create an initial prescription record
    const newPrescription = new Prescription({
      userId,
      originalImage: image, // Ideally this would be stored in S3 and we store the URL
      status: "pending"
    });
    await newPrescription.save();

    console.log("[ROUTES] Prescription created:", newPrescription._id);
    // Add job to BullMQ queue
    console.log("[ROUTES] Adding job to BullMQ queue...");
    await analysisQueue.add("analyze-job", {
      type: "start_analysis",
      prescriptionId: newPrescription._id.toString(),
      image,
      userId
    });
    console.log("[ROUTES] ✅ Job added to queue");

    return res.status(202).json({
      message: "Analysis started",
      prescriptionId: newPrescription._id
    });

  } catch (error) {
    console.error("[ROUTES] ❌ Analysis route error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// AI Verify/Resume Route
router.post("/verify", authenticateJWT as any, async (req: AuthRequest, res: any) => {
  try {
    const { prescriptionId, extractedData } = req.body;

    if (!prescriptionId || !extractedData) {
      return res.status(400).json({ message: "prescriptionId and extractedData are required" });
    }

    const config = { configurable: { thread_id: prescriptionId } };

    // Update the state with the human-verified data
    await graph.updateState(config, {
      extractedData: extractedData,
      status: "verified"
    });

    // Enqueue job to resume processing
    await analysisQueue.add("resume-job", {
      type: "resume_analysis",
      prescriptionId
    });

    return res.status(202).json({ message: "Verification received, resuming analysis." });

  } catch (error) {
    console.error("Verify route error:", error);
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

// Fetch Single Prescription Route
router.get("/prescriptions/:id", authenticateJWT as any, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const prescription = await Prescription.findOne({ _id: id, userId });
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    return res.json({ prescription });
  } catch (error) {
    console.error("Fetch single history error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

import { askAI } from "../utils/ai";

// Live Clinical Chat Route
router.post("/chat", authenticateJWT as any, async (req: AuthRequest, res: any) => {
  try {
    const { prescriptionId, message, history } = req.body;
    
    if (!prescriptionId || !message) {
      return res.status(400).json({ message: "prescriptionId and message are required" });
    }

    const userId = req.user?.id;
    const prescription = await Prescription.findOne({ _id: prescriptionId, userId });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found or unauthorized" });
    }

    const systemPrompt = `You are a helpful medical assistant AI named MediScript.
You are answering a patient's questions about their newly generated medication schedule and safety warnings.

CONTEXT:
Medications: ${JSON.stringify(prescription.extractedData?.medications || [])}
Schedule: ${JSON.stringify(prescription.dailySchedule || {})}
Safety Warnings: ${JSON.stringify(prescription.safetyWarnings || [])}

CRITICAL RULES:
1. Base your answers ONLY on the provided context.
2. If the patient asks something outside this context, politely remind them you can only discuss their current prescription.
3. Be empathetic, clear, and concise.
4. Always remind them to consult their actual doctor for medical advice.`;

    // Build conversation history with system prompt
    const prompt = `${systemPrompt}\n\nUser Message: ${message}`;

    const reply = await askAI(prompt);

    return res.json({
      reply: reply || "I'm sorry, I couldn't generate a text response."
    });

  } catch (error) {
    console.error("Chat route error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
