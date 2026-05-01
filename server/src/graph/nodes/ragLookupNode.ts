import { State } from "../state";
import { STATUS } from "../constants";
import { emitStatus } from "../../sockets/socketEvents";
import { retrieveDrugInfo } from "../../rag/retriever";

/**
 * RAG Lookup Node
 *
 * Retrieves medical literature from ChromaDB for all extracted medications.
 * Replaces the placeholder in graph.ts.
 *
 * Error Handling: If retrieveDrugInfo() throws, this node catches the error,
 * sets ragContext to an empty string, logs the failure, and returns normally.
 * It NEVER re-throws — the pipeline continues with empty context so the
 * Safety Node can still operate (it already handles missing context).
 */
export const ragLookupNode = async (state: State) => {
  emitStatus("processing", "RAG Lookup: Searching medical database for drug information...");

  // If no medications were extracted, skip RAG lookup
  if (!state.extractedData || state.extractedData.medications.length === 0) {
    emitStatus("warning", "RAG Lookup: No medications to look up. Skipping.");
    return {
      ragContext: "No medications found to retrieve literature for.",
      executionLogs: [
        ...state.executionLogs,
        "RAG Lookup: Skipped (no medications in extracted data).",
      ],
      status: STATUS.RAG_COMPLETE,
    };
  }

  // Extract drug names from the prescription
  const drugNames = state.extractedData.medications.map((m) => m.name);

  emitStatus(
    "processing",
    `RAG Lookup: Querying ChromaDB for ${drugNames.length} medication(s): ${drugNames.join(", ")}`
  );

  try {
    // Call the retriever with all drug names
    const ragContext = await retrieveDrugInfo(drugNames);

    emitStatus(
      "success",
      `RAG Lookup: Successfully retrieved medical context for ${drugNames.length} medication(s).`
    );

    return {
      ragContext,
      executionLogs: [
        ...state.executionLogs,
        `RAG Lookup: Retrieved medical literature for [${drugNames.join(", ")}].`,
      ],
      status: STATUS.RAG_COMPLETE,
    };
  } catch (error: any) {
    // NEVER re-throw — continue with empty context
    const errorMsg = error.message || "Unknown error during RAG retrieval";

    emitStatus(
      "warning",
      `RAG Lookup: Failed to retrieve drug info — ${errorMsg}. Continuing with empty context.`
    );

    console.error("[ragLookupNode] Error:", error);

    return {
      ragContext: "",
      executionLogs: [
        ...state.executionLogs,
        `RAG Lookup: Failed to retrieve drug info — ${errorMsg}. Continuing with empty context.`,
      ],
      status: STATUS.RAG_FALLBACK,
    };
  }
};
