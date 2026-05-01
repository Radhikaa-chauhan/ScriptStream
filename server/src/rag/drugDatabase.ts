import { ChromaClient, Collection } from "chromadb";
import drugDataRaw from "./drugData.json";
import dotenv from "dotenv";

dotenv.config();

/**
 * ChromaDB Drug Database
 *
 * Client initialization strategy:
 * - When CHROMA_URL is NOT set (or empty) → uses ephemeral in-memory mode
 *   (no Docker required, ideal for development)
 * - When CHROMA_URL IS set (e.g., http://localhost:8000) → connects via
 *   ChromaClient in HTTP mode for production/staging
 */

let client: ChromaClient | null = null;
let collection: Collection | null = null;

const COLLECTION_NAME = "scriptstream_drugs";

/**
 * Initialize ChromaDB client based on environment
 */
const initClient = async (): Promise<ChromaClient> => {
  if (client) return client;

  const chromaUrl = process.env.CHROMA_URL;

  if (chromaUrl) {
    console.log(`[ChromaDB] Connecting to server at ${chromaUrl}`);
    client = new ChromaClient({ path: chromaUrl });
  } else {
    console.log("[ChromaDB] Running in ephemeral in-memory mode (no CHROMA_URL set)");
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
      `[ChromaDB] Successfully ingested ${documents.length} drug documents into "${COLLECTION_NAME}".`
    );
  } catch (error) {
    console.error("[ChromaDB] Ingestion failed:", error);
    throw error;
  }
};
