import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../utils/redis";
import { graph } from "../graph/graph";
import { Prescription } from "../database/models";
import { emitStatus, emitResult } from "../sockets/socketEvents";

console.log("[WORKER] Initializing BullMQ worker...");
const QUEUE_NAME = "analysisQueue";

// Create the Queue
console.log("[WORKER] Creating queue:", QUEUE_NAME);
export const analysisQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});
console.log("[WORKER] ✅ Queue created");

(async () => {
  await analysisQueue.obliterate({ force: true });
  console.log("[WORKER] 💣 Queue cleared completely");
})();

// Job Payload Types
interface StartAnalysisJob {
  type: "start_analysis";
  prescriptionId: string;
  image: string;
  userId: string;
}

interface ResumeAnalysisJob {
  type: "resume_analysis";
  prescriptionId: string;
}

type AnalysisJobData = StartAnalysisJob | ResumeAnalysisJob;

// Create the Worker
console.log("[WORKER] Creating worker...");
export const analysisWorker = new Worker<AnalysisJobData>(
  QUEUE_NAME,
  async (job: Job<AnalysisJobData>) => {
    console.log(`[WORKER] 🔄 Processing job ${job.id} of type ${job.data.type}`);
    const { prescriptionId, type } = job.data;
    console.log(`[WORKER] Prescription ID: ${prescriptionId}`);
    const config = { configurable: { thread_id: prescriptionId } };

    try {
      console.log("[WORKER] 🔠 Starting graph invocation for prescription:", prescriptionId);
      if (type === "start_analysis") {
        console.log("[WORKER] Type: START_ANALYSIS - executing full workflow");
        const { image, userId } = job.data as StartAnalysisJob;
        
        let patientEmail = "";
        let patientPhone = "";
        if (userId) {
          const { User } = require("../database/models");
          const user = await User.findById(userId);
          if (user) {
            patientEmail = user.email || "";
            patientPhone = user.phone || "";
            console.log(`[WORKER] Patient email: ${patientEmail}, phone: ${patientPhone || "not set"}`);
          }
        }

        await graph.invoke({
          prescriptionImage: image,
          patientEmail,
          patientPhone,
          status: "started",
          extractedData: {
            doctorName: "Unknown",
            patientName: "Unknown",
            date: "Unknown",
            medications: []
          },
          safetyWarnings: [],
          schedule: { morning: [], afternoon: [], evening: [], night: [], notes: [] }
        }, config);

      } else if (type === "resume_analysis") {
        console.log("[WORKER] Type: RESUME_ANALYSIS - continuing from verification");

        // 1. Check if the memory checkpointer still has the state
        const checkState = await graph.getState(config);

        if (!checkState.values || Object.keys(checkState.values).length === 0) {
          console.warn("[WORKER] ⚠️ Checkpoint memory lost! Injecting verified state from DB...");

          const rx = await Prescription.findById(prescriptionId);
          if (rx && rx.extractedData) {
            // Reconstruct the checkpoint from the verified DB data.
            // asNode:"verification" places the cursor AFTER verification,
            // so the next invoke() will run ragLookup → safety → scheduler.
            await graph.updateState(config, {
              prescriptionImage: rx.originalImage || "",
              extractedData: rx.extractedData,
              status: "ready_for_analysis",
              safetyWarnings: [],
              schedule: { morning: [], afternoon: [], evening: [], night: [], notes: [] },
              executionLogs: ["[RECOVERY] Checkpoint restored from DB. Resuming from RAG lookup..."],
            }, "verification");
            console.log("[WORKER] ✅ State injected. Resuming from ragLookup...");
            await graph.invoke(null, config);
          } else {
            throw new Error("Cannot recover: Prescription or extractedData not found in DB.");
          }
        } else {
          // Normal resume — checkpoint is intact
          await graph.invoke(null, config);
        }
      }
      console.log("[WORKER] Graph invocation completed");

      // Check graph state after invocation (it could be interrupted or finished)
      console.log("[WORKER] Checking graph state...");
      const state = await graph.getState(config);

      if (state.next && state.next.includes("verification")) {
        console.log("[WORKER] ⏸ Graph paused at VERIFICATION node");

        await Prescription.findByIdAndUpdate(prescriptionId, {
          status: "awaiting_verification",
          extractedData: state.values.extractedData
        });

        // CRITICAL: Tell the frontend to stop the animation and show "Waiting"
        emitStatus(
          "awaiting_verification",
          "Vision Agent: Extraction complete. Waiting for Pharmacist verification...",
          prescriptionId
        );
      } else {
        // Graph completed fully
        console.log("[WORKER] ✅ Graph completed fully");
        await Prescription.findByIdAndUpdate(prescriptionId, {
          extractedData: state.values.extractedData,
          dailySchedule: state.values.schedule,
          safetyWarnings: state.values.safetyWarnings,
          status: "processed"
        });

        // Emit the full result to the client so it can navigate to Results
        const resultPayload = {
          extractedData: state.values.extractedData,
          schedule: state.values.schedule,
          safetyWarnings: state.values.safetyWarnings,
        };
        emitResult(resultPayload);
        emitStatus("completed", "Pipeline complete. Redirecting to results...");
      }

    } catch (error) {
      console.error(`[WORKER] ❌ Error processing job ${job.id}:`, error);
      await Prescription.findByIdAndUpdate(prescriptionId, { status: "failed" });
      throw error; // Let BullMQ handle the retry/failure
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process up to 2 analyses concurrently
  }
);
console.log("[WORKER] ✅ Worker created");

analysisWorker.on("completed", (job) => {
  console.log(`[WORKER] ✅ Job ${job?.id} has completed!`);
});

// analysisWorker.on(\"failed\", (job, err) => {
//   console.error(`[WORKER] ❌ Job ${job?.id} has failed with ${err.message}`)
// });

// analysisWorker.on(\"active\", (job) => {
//   console.log(`[WORKER] ▶️ Job ${job?.id} is now active`);
// })
