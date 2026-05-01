import { getCollection } from "./drugDatabase";

/**
 * RAG Retriever
 *
 * Performs a single batched query to ChromaDB using all drug names combined,
 * retrieving top 3 results per drug. Deduplicates by document ID before
 * returning formatted medical context.
 *
 * @param drugNames - Array of drug names extracted from the prescription
 * @returns Formatted medical context string for injection into the Safety Node
 */
export async function retrieveDrugInfo(drugNames: string[]): Promise<string> {
  if (!drugNames || drugNames.length === 0) {
    return "No drug names provided for retrieval.";
  }

  const collection = await getCollection();

  // Batched query: combine all drug names, request top N results
  const nResults = Math.min(3 * drugNames.length, 20); // Cap at 20 to avoid excess
  const queryText = drugNames.join(", ");

  const results = await collection.query({
    queryTexts: [queryText],
    nResults,
  });

  if (
    !results.documents ||
    !results.documents[0] ||
    results.documents[0].length === 0
  ) {
    return `No specific medical literature found for: ${drugNames.join(", ")}`;
  }

  // Deduplicate by ID (ChromaDB may return same doc for multiple query terms)
  const seen = new Set<string>();
  const uniqueDocs: string[] = [];

  for (let i = 0; i < results.documents[0].length; i++) {
    const id = results.ids?.[0]?.[i];
    const doc = results.documents[0][i];

    if (id && !seen.has(id) && doc) {
      seen.add(id);
      uniqueDocs.push(doc);
    }
  }

  if (uniqueDocs.length === 0) {
    return `No specific medical literature found for: ${drugNames.join(", ")}`;
  }

  // Format: header + numbered documents
  const header = `═══ Medical Literature Context (${uniqueDocs.length} drugs matched) ═══`;
  const body = uniqueDocs
    .map((doc, idx) => `\n── Drug ${idx + 1} ──\n${doc}`)
    .join("\n");
  const footer = `\n═══ End of RAG Context ═══`;

  return `${header}${body}${footer}`;
}
