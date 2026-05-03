import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

/**
 * Zod schemas for strict data validation
 */
export const PrescriptionSchema = z.object({
  doctorName: z.string().nullable().optional().transform(v => v ?? "Unknown"),
  patientName: z.string().nullable().optional().transform(v => v ?? "Unknown"),
  medications: z.array(z.object({
    name: z.string().nullable().transform(v => v ?? "Unknown medication"),
    dosage: z.string().nullable().transform(v => v ?? "unreadable"),
    instructions: z.string().nullable().transform(v => v ?? "unreadable"),
    frequency: z.string().nullable().optional().transform(v => v ?? "unreadable"),
  })),
  date: z.string().nullable().optional().transform(v => v ?? "Unknown")
});

export const ScheduleSchema = z.object({
  morning: z.array(z.string()),
  afternoon: z.array(z.string()),
  evening: z.array(z.string()),
  night: z.array(z.string()),
  notes: z.array(z.string())
});

/**
 * LangGraph State Definition
 * This defines the "memory" of our multi-agent workflow.
 */
export const StateAnnotation = Annotation.Root({
  // The raw image data (base64 or buffer)
  prescriptionImage: Annotation<string>(),

  // Digitized data extracted by Vision Agent
  extractedData: Annotation<z.infer<typeof PrescriptionSchema>>({
    reducer: (x: any, y: any) => y ?? x,
  }),

  // Medical context retrieved from ChromaDB (OpenFDA)
  ragContext: Annotation<string>(),

  // Flagged interactions or warnings
  safetyWarnings: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  // Final generated medication schedule
  schedule: Annotation<z.infer<typeof ScheduleSchema>>({
    reducer: (x, y) => y ?? x,
  }),

  // Real-time execution logs to stream via Socket.io
  executionLogs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  // Patient contact information fetched from the DB
  patientEmail: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),

  patientPhone: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),

  // Conversation history for the Chat Engine
  chatHistory: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  // Current status for the UI progress bar
  status: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "idle",
  })
});

export type State = typeof StateAnnotation.State;
