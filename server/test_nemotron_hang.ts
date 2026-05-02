import { askAI } from "./src/utils/ai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  console.log("Calling askAI...");
  const t0 = Date.now();
  try {
    const res = await askAI("Test prompt", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");
    console.log("Success! Time:", Date.now() - t0, "ms");
  } catch (e) {
    console.log("Error:", e);
  }
  process.exit(0);
}
run();
