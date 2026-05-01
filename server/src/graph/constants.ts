/**
 * Status Constants
 * Centralized status string literals used across all LangGraph nodes.
 * Import from here instead of using inline magic strings.
 */
export const STATUS = {
  // Shared
  IDLE: "idle",
  STARTED: "started",
  ERROR: "error",

  // Vision Node
  VERIFICATION_PENDING: "verification_pending",

  // Verification Gate
  READY_FOR_ANALYSIS: "ready_for_analysis",

  // RAG Lookup Node
  RAG_COMPLETE: "rag_complete",
  RAG_FALLBACK: "rag_fallback",

  // Safety Node
  SAFETY_CHECK_COMPLETE: "safety_check_complete",

  // Schedule Node
  SCHEDULE_COMPLETE: "schedule_complete",

  // Notification Node
  NOTIFIED: "notified",
  NOTIFY_PARTIAL: "notify_partial",

  // Chat Node
  CHAT_IDLE: "chat_idle",
  CHAT_REPLIED: "chat_replied",
} as const;

export type StatusValue = (typeof STATUS)[keyof typeof STATUS];
