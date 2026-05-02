import { analysisQueue } from "./src/workers/graphWorker";

async function run() {
  const waiting = await analysisQueue.getWaitingCount();
  const active = await analysisQueue.getActiveCount();
  const delayed = await analysisQueue.getDelayedCount();
  const failed = await analysisQueue.getFailedCount();
  console.log(`Waiting: ${waiting}, Active: ${active}, Delayed: ${delayed}, Failed: ${failed}`);
  
  const failedJobs = await analysisQueue.getFailed();
  if (failedJobs.length > 0) {
    console.log("Failed Job 1:", failedJobs[0].failedReason);
  }
  process.exit(0);
}
run();
