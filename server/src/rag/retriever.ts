import { retrieveDrugInfo as _retrieveDrugInfo } from "./drugDatabase";

/**
 * RAG Retriever (In-Memory Mode)
 *
 * Thin wrapper around the in-memory drug database.
 * Signature is unchanged so ragLookupNode works without modification.
 */
export async function retrieveDrugInfo(drugNames: string[]): Promise<string> {
  return _retrieveDrugInfo(drugNames);
}
