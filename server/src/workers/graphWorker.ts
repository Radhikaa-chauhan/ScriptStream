import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../utils/redis";
import { graph } from "../graph/graph";
import { Prescription } from "../database/models";

console.log("[WORKER] Initializing BullMQ worker...");
const QUEUE_NAME = "analysisQueue";

// Create the Queue
console.log("[WORKER] Creating queue:", QUEUE_NAME);
export const analysisQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});
console.log("[WORKER] ✅ Queue created");

// Job Payload Types
interface StartAnalysisJob {
  type: "start_analysis";
  prescriptionId: string;
  image: string;
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
        const { image } = job.data as StartAnalysisJob;
        
        await graph.invoke({
          prescriptionImage: image,
          status: "started",
          extractedData: { medications: [] },
          safetyWarnings: [],
          schedule: { morning: [], afternoon: [], evening: [], night: [], notes: [] }
        }, config);
        
      } else if (type === "resume_analysis") {
        console.log("[WORKER] Type: RESUME_ANALYSIS - continuing from verification");
        // Resume the graph with null input (it picks up from the interrupted state)
        await graph.invoke(null, config);
      }
      console.log("[WORKER] Graph invocation completed");

      // Check graph state after invocation (it could be interrupted or finished)
      console.log("[WORKER] Checking graph state...");
      const state = await graph.getState(config);
      
      if (state.next && state.next.includes("verification")) {
        // Graph is paused, waiting for human verification
        console.log("[WORKER] ⏸ Graph paused at VERIFICATION node");
        await Prescription.findByIdAndUpdate(prescriptionId, { 
          status: "awaiting_verification",
          extractedData: state.values.extractedData 
        });
      } else {
        // Graph completed fully
        console.log("[WORKER] ✅ Graph completed fully");
        await Prescription.findByIdAndUpdate(prescriptionId, {
          extractedData: state.values.extractedData,
          dailySchedule: state.values.schedule,
          safetyWarnings: state.values.safetyWarnings,
          status: "processed"
        });
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
