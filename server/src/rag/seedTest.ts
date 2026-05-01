/**
 * RAG Seed Test Script
 *
 * Run with: npx ts-node src/rag/seedTest.ts
 *
 * Tests the full ChromaDB pipeline:
 * 1. Ingests drug data (idempotent)
 * 2. Queries for a specific drug
 * 3. Prints retrieved results
 */

import dotenv from "dotenv";
dotenv.config();

import { ingestDrugs, getCollection } from "./drugDatabase";
import { retrieveDrugInfo } from "./retriever";

async function runSeedTest() {
  console.log("═══════════════════════════════════════════");
  console.log("  ScriptStream RAG Seed Test");
  console.log("═══════════════════════════════════════════\n");

  // Step 1: Ingest
  console.log("[1/3] Ingesting drug data into ChromaDB...");
  await ingestDrugs();

  // Step 2: Check count
  const collection = await getCollection();
  const count = await collection.count();
  console.log(`[2/3] Collection now has ${count} documents.\n`);

  // Step 3: Query
  console.log("[3/3] Testing retrieval for: Metformin, Lisinopril\n");
  const result = await retrieveDrugInfo(["Metformin", "Lisinopril"]);
  console.log("──── Retrieved Context ────");
  console.log(result);
  console.log("──── End ────\n");

  // Bonus: single-drug query
  console.log("Bonus: Single-drug query for 'Warfarin':\n");
  const single = await retrieveDrugInfo(["Warfarin"]);
  console.log(single.substring(0, 500) + "...\n");

  console.log("✅ Seed test complete!");
}

runSeedTest().catch((err) => {
  console.error("❌ Seed test failed:", err);
  process.exit(1);
});
