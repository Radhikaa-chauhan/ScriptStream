import { gemini, withRetryGemini } from "../../utils/gemini";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { State } from "../state";

/**
 * Chat Engine Node
 * Handles the conversational loop using Gemini instead of Anthropic
 */
export const chatNode = async (state: State) => {
  console.log("[CHAT] Starting chat node...");
  const chatHistory = state.chatHistory || [];
  console.log("[CHAT] Chat history length:", chatHistory.length);

  // We only run the chat if the last message was from the user
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1]._getType() !== "human") {
    console.log("[CHAT] No user message in history, chat idle");
    return { status: "chat_idle" };
  }
  console.log("[CHAT] Processing user message...");

  const systemContext = `You are a helpful medical assistant AI named MediScript.
  You are answering a patient's questions about their newly generated medication schedule and safety warnings.
  
  CONTEXT:
  Medications: ${JSON.stringify(state.extractedData?.medications)}
  Schedule: ${JSON.stringify(state.schedule)}
  Safety Warnings: ${JSON.stringify(state.safetyWarnings)}
  
  CRITICAL RULES:
  1. Base your answers ONLY on the provided context.
  2. If the patient asks something outside this context, politely remind them you can only discuss their current prescription.
  3. Be empathetic, clear, and concise.
  4. Always remind them to consult their actual doctor for medical advice.`;

  try {
    // Extract the last user message
    const lastMessage = chatHistory[chatHistory.length - 1];
    const userQuestion = lastMessage.content || "";

    // Build conversation history for Gemini
    const conversationHistory = chatHistory
      .slice(0, -1)
      .map((msg: any) => {
        const role = msg._getType() === "human" ? "user" : "model";
        return { role, parts: [{ text: msg.content || "" }] };
      });

    // Add system context and user question
    const prompt = `${systemContext}\n\nUser Question: ${userQuestion}`;

    const response = await withRetryGemini(async () => {
      return await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    });

    const assistantReply = response.text || "";

    // Create AIMessage for compatibility with state
    const aiMessage = new AIMessage({
      content: assistantReply || "I apologize, but I couldn't generate a response.",
      additional_kwargs: {}
    });

    return {
      chatHistory: [aiMessage],
      status: "chat_replied"
    };
  } catch (error) {
    console.error("Chat Node Error:", error);
    return {
      error: "Chat engine failed to respond.",
      status: "error"
    };
  }
};
