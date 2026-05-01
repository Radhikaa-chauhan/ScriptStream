import drugDataRaw from "./drugData.json";

/**
 * In-Memory Drug Database (No-ChromaDB Mode)
 *
 * This module replaces the ChromaDB integration with a lightweight,
 * zero-dependency in-memory search over the bundled drugData.json.
 *
 * Strategy:
 *   1. On first call, build a flattened "document" string per drug (same
 *      format the original ChromaDB ingestion used).
 *   2. retrieveDrugInfo() does a case-insensitive name/brand-name match,
 *      then falls back to a keyword frequency score if no exact match found.
 *
 * This gives the Safety Agent rich medical context without requiring Docker
 * or any external vector DB.  Drop-in replacement: same exports, same API.
 */

interface DrugDoc {
  id: string;
  name: string;
  aliases: string[]; // brandNames lowercased
  text: string;      // full document for context injection
}

// ─── Build in-memory index once at module load ───────────────────────────────

const drugs: any[] = (drugDataRaw as any).drugs;

const drugDocs: DrugDoc[] = drugs.map((drug) => {
  const text = [
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
  ].join("\n");

  return {
    id: `drug_${drug.name.toLowerCase().replace(/\s+/g, "_")}`,
    name: drug.name.toLowerCase(),
    aliases: drug.brandNames.map((b: string) => b.toLowerCase()),
    text,
  };
});

console.log(
  `[DrugDB] ✅ In-memory drug index loaded: ${drugDocs.length} drugs indexed.`
);

// ─── Lookup helpers ──────────────────────────────────────────────────────────

/**
 * Score a drug doc against a query string.
 * Returns a numeric score (higher = better match).
 */
function score(doc: DrugDoc, query: string): number {
  const q = query.toLowerCase();
  // Exact name match: highest priority
  if (doc.name === q) return 1000;
  // Exact brand name match
  if (doc.aliases.some((a) => a === q)) return 900;
  // Name contains query or query contains name
  if (doc.name.includes(q) || q.includes(doc.name)) return 500;
  // Brand name partial match
  if (doc.aliases.some((a) => a.includes(q) || q.includes(a))) return 400;
  // Keyword frequency in the full text
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const textLower = doc.text.toLowerCase();
  return words.reduce((acc, w) => acc + (textLower.includes(w) ? 10 : 0), 0);
}

// ─── Public API (same as original drugDatabase.ts exports) ──────────────────

/**
 * ingestDrugs — no-op in in-memory mode (data is ready at import time).
 * Kept for API compatibility with server.ts.
 */
export const ingestDrugs = async (): Promise<void> => {
  console.log(
    `[DrugDB] In-memory mode: ${drugDocs.length} drug documents ready. No ingestion needed.`
  );
};

/**
 * retrieveDrugInfo — look up one or more drug names and return a
 * formatted medical context string for injection into the Safety Agent.
 */
export async function retrieveDrugInfo(drugNames: string[]): Promise<string> {
  if (!drugNames || drugNames.length === 0) {
    return "No drug names provided for retrieval.";
  }

  const matched: DrugDoc[] = [];
  const seen = new Set<string>();

  for (const name of drugNames) {
    // Score all docs, pick the best match above a minimum threshold
    const scored = drugDocs
      .map((doc) => ({ doc, s: score(doc, name.trim()) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    if (scored.length > 0 && !seen.has(scored[0].doc.id)) {
      seen.add(scored[0].doc.id);
      matched.push(scored[0].doc);
    }
  }

  if (matched.length === 0) {
    return `No specific medical literature found for: ${drugNames.join(", ")}`;
  }

  const header = `═══ Medical Literature Context (${matched.length} drug(s) matched) ═══`;
  const body = matched
    .map((doc, idx) => `\n── Drug ${idx + 1}: ${drugs[drugDocs.indexOf(doc)]?.name || doc.name} ──\n${doc.text}`)
    .join("\n");
  const footer = `\n═══ End of RAG Context ═══`;

  return `${header}${body}${footer}`;
}

// Keep getCollection as a stub so nothing that imports it breaks at compile time
export const getCollection = async () => {
  throw new Error("ChromaDB is not used. Use retrieveDrugInfo() directly.");
};
