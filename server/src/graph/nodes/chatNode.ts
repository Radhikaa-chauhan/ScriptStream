import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { State } from "../state";

/**
 * Chat Engine Node
 * Handles the conversational loop, allowing patients to ask follow-up questions
 * about their specific prescription. Maintains conversation history using LangChain BaseMessages.
 */
export const chatNode = async (state: State) => {
  const chatHistory = state.chatHistory || [];
  
  // We only run the chat if the last message was from the user
  if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1]._getType() !== "human") {
    return { status: "chat_idle" };
  }

  const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20240620",
    maxTokens: 1000,
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemContext = new SystemMessage(`You are a helpful medical assistant AI named MediScript.
  You are answering a patient's questions about their newly generated medication schedule and safety warnings.
  
  CONTEXT:
  Medications: ${JSON.stringify(state.extractedData?.medications)}
  Schedule: ${JSON.stringify(state.schedule)}
  Safety Warnings: ${JSON.stringify(state.safetyWarnings)}
  
  CRITICAL RULES:
  1. Base your answers ONLY on the provided context.
  2. If the patient asks something outside this context, politely remind them you can only discuss their current prescription.
  3. Be empathetic, clear, and concise.
  4. Always remind them to consult their actual doctor for medical advice.`);

  try {
    // Pass the system message plus the entire chat history
    const response = await model.invoke([systemContext, ...chatHistory]);

    // Append the assistant's reply to the chat history
    return {
      chatHistory: [response], // The reducer in state.ts will concat this to the existing array
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
