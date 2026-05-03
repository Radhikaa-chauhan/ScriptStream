import { CloudClient, ChromaClient, Collection } from "chromadb";
import drugDataRaw from "./drugData.json";
// Environment loaded by server.ts at startup

/**
 * ChromaDB Drug Database
 *
 * Connection strategy:
 * ─────────────────────────────────────────────────────────────────
 * 1. CHROMA_API_KEY is set → connects to Chroma Cloud via CloudClient
 *    (Requires: CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE)
 *
 * 2. CHROMA_URL is set → connects to a self-hosted server via ChromaClient
 *    (e.g. Docker: `docker run -p 8000:8000 chromadb/chroma`)
 *
 * 3. Neither is set → connects to localhost:8000 by default
 * ─────────────────────────────────────────────────────────────────
 */

let client: CloudClient | ChromaClient | null = null;
let collection: Collection | null = null;

const COLLECTION_NAME = "scriptstream_drugs";

/**
 * Initialize ChromaDB client based on environment
 */
const initClient = async (): Promise<CloudClient | ChromaClient> => {
  if (client) return client;

  const apiKey = process.env.CHROMA_API_KEY;
  const tenant = process.env.CHROMA_TENANT;
  const database = process.env.CHROMA_DATABASE;
  const chromaUrl = process.env.CHROMA_URL;

  if (apiKey && tenant && database) {
    // ─── Chroma Cloud ───────────────────────────────────────────
    console.log(`[ChromaDB] Connecting to Chroma Cloud (tenant: ${tenant}, db: ${database})`);
    client = new CloudClient({
      apiKey,
      tenant,
      database,
    });
  } else if (chromaUrl) {
    // ─── Self-hosted server ─────────────────────────────────────
    console.log(`[ChromaDB] Connecting to self-hosted server at ${chromaUrl}`);
    client = new ChromaClient({ path: chromaUrl });
  } else {
    // ─── Default localhost ──────────────────────────────────────
    console.log("[ChromaDB] No config found. Connecting to http://localhost:8001");
    client = new ChromaClient();
  }

  return client;
};

/**
 * Get or create the drug collection
 */
export const getCollection = async (): Promise<Collection> => {
  if (collection) return collection;

  const chromaClient = await initClient();
  collection = await chromaClient.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { description: "ScriptStream drug information database" },
  });

  return collection;
};

/**
 * Flatten a drug entry into a single searchable text document
 */
const chunkDrugData = (drug: any): string => {
  const parts = [
    `Drug: ${drug.name}`,
    `Brand Names: ${drug.brandNames.join(", ")}`,
    `Category: ${drug.category}`,
    `Side Effects: ${drug.sideEffects.join(", ")}`,
    `Dosage: ${drug.dosageInfo.standard} (Max: ${drug.dosageInfo.max}). ${drug.dosageInfo.frequency}.`,
    `Warnings: ${drug.warnings.join(". ")}`,
    `Food Interactions: ${drug.foodInteractions.join(". ")}`,
    `Drug Interactions:`,
    ...drug.interactions.map(
      (i: any) =>
        `  - ${drug.name} + ${i.drug}: [${i.severity.toUpperCase()}] ${i.description}`
    ),
  ];
  return parts.join("\n");
};

/**
 * Idempotent ingestion — checks if collection already has documents
 * before ingesting to prevent duplicates on server restart.
 */
export const ingestDrugs = async (): Promise<void> => {
  try {
    const col = await getCollection();
    const existingCount = await col.count();

    if (existingCount > 0) {
      console.log(
        `[ChromaDB] Collection "${COLLECTION_NAME}" already seeded with ${existingCount} documents. Skipping ingestion.`
      );
      return;
    }

    const drugs = (drugDataRaw as any).drugs;
    const documents: string[] = [];
    const ids: string[] = [];
    const metadatas: any[] = [];

    for (const drug of drugs) {
      const doc = chunkDrugData(drug);
      documents.push(doc);
      ids.push(`drug_${drug.name.toLowerCase().replace(/\s+/g, "_")}`);
      metadatas.push({
        name: drug.name,
        category: drug.category,
        brandNames: drug.brandNames.join(", "),
      });
    }

    await col.add({
      ids,
      documents,
      metadatas,
    });

    console.log(
      `[ChromaDB] ✅ Successfully ingested ${documents.length} drug documents into "${COLLECTION_NAME}".`
    );
  } catch (error) {
    console.error("[ChromaDB] ❌ Ingestion failed:", error);
    throw error;
  }
};
