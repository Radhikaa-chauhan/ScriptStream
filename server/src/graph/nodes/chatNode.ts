import { askAI, withRetry } from "../../utils/ai";
import { AIMessage } from "@langchain/core/messages";
import { State } from "../state";

/**
 * Chat Engine Node (OpenRouter Edition)
 * Uses Gemma-4 for conversational Q&A about the patient's prescription.
 */
export const chatNode = async (state: State) => {
  console.log("[CHAT] Starting chat node with OpenRouter...");
  const chatHistory = state.chatHistory || [];

  // Only run if the last message is from the user
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1]._getType() !== "human") {
    console.log("[CHAT] No user message in history, chat idle");
    return { status: "chat_idle" };
  }

  const lastMessage = chatHistory[chatHistory.length - 1];
  const userQuestion = lastMessage.content || "";

  const prompt = `You are a helpful medical assistant AI named MediScript.
You are answering a patient's questions about their newly generated medication schedule and safety warnings.

CONTEXT:
Medications: ${JSON.stringify(state.extractedData?.medications)}
Schedule: ${JSON.stringify(state.schedule)}
Safety Warnings: ${JSON.stringify(state.safetyWarnings)}

CRITICAL RULES:
1. Base your answers ONLY on the provided context.
2. If the patient asks something outside this context, politely remind them you can only discuss their current prescription.
3. Be empathetic, clear, and concise.
4. Always remind them to consult their actual doctor for medical advice.

User Question: ${userQuestion}`;

  try {
    const assistantReply = await withRetry(() => askAI(prompt));

    const aiMessage = new AIMessage({
      content: assistantReply || "I apologize, but I couldn't generate a response.",
      additional_kwargs: {}
    });

    return {
      chatHistory: [aiMessage],
      status: "chat_replied"
    };
  } catch (error) {
    console.error("[CHAT] Error:", error);
    return {
      error: "Chat engine failed to respond.",
      status: "error"
    };
  }
};
