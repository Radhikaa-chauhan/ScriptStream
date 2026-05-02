import { Router, Request, Response } from "express";
import { Prescription } from "../database/models";
import { graph } from "../graph/graph";
import { analysisQueue } from "../workers/graphWorker";
import { emitStatus } from "../sockets/socketEvents";

const router = Router();

/**
 * GET /api/admin/pending
 * Returns all prescriptions waiting for human verification
 */
router.get("/pending", async (req: Request, res: Response) => {
  try {
    const pending = await Prescription.find({ status: "awaiting_verification" })
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/verify/:id
 * Admin approves or edits the extracted data. 
 * This triggers the graph to RESUME.
 */
router.post("/verify/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { verifiedData } = req.body;

  try {
    console.log(`[ADMIN] Verifying prescription ${id}...`);

    // 1. Update the MongoDB record with the verified data
    const prescription = await Prescription.findByIdAndUpdate(
      id,
      { 
        extractedData: verifiedData,
        status: "verifying" 
      },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // 2. Update the LangGraph state with the verified data.
    // This injects the Admin's corrections into the AI's memory.
    const config = { configurable: { thread_id: id } };
    
    console.log(`[ADMIN] Updating graph state for thread: ${id}...`);
    try {
      // "verification" as the third arg (asNode) is CRITICAL.
      // It tells LangGraph that the verification node has just completed,
      // so the next graph.invoke(null) will resume from ragLookup onward.
      await graph.updateState(config, {
        extractedData: verifiedData,
        status: "ready_for_analysis"
      }, "verification");
      console.log("[ADMIN] ✅ Graph state updated. Next node: ragLookup");
    } catch (graphError: any) {
      console.error("[ADMIN] ❌ LangGraph state update failed:", graphError.message);
      // Don't throw yet — worker fallback will handle it
    }

    // 3. Re-add the job to the queue as a "resume_analysis" type.
    console.log("[ADMIN] Adding resume job to queue...");
    try {
      await analysisQueue.add("resume-job", {
        type: "resume_analysis",
        prescriptionId: id
      });
    } catch (queueError: any) {
      console.error("[ADMIN] ❌ BullMQ queueing failed:", queueError.message);
      throw new Error(`Queueing failed: ${queueError.message}`);
    }

    emitStatus("processing", "Admin: Verification complete. Resuming Safety & RAG agents...", id);

    res.json({ message: "Verification submitted, pipeline resumed.", prescription });
  } catch (error: any) {
    console.error("[ADMIN] Verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/prescription/:id
 * Allows admin to remove a prescription entirely
 */
router.delete("/prescription/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await Prescription.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Prescription not found" });
    res.json({ message: "Prescription deleted by admin" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
