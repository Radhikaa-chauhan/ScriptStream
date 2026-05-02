import { analysisQueue } from "./src/workers/graphWorker";

async function run() {
  const jobs = await analysisQueue.getFailed();
  for (const j of jobs) {
    console.log("Failed job:", j.id, "Reason:", j.failedReason);
    if (j.stacktrace && j.stacktrace.length > 0) {
      console.log(j.stacktrace[0].substring(0, 500));
    }
  }
  process.exit(0);
}
run();
