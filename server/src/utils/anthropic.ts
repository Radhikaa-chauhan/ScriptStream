import { gemini, withRetryGemini } from "./gemini";
import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized Gemini AI Client (Replaced Anthropic)
 * Emulates Anthropic API for tool-calling responses using Gemini
 */
export const anthropic = {
  messages: {
    create: async (config: any) => {
      // Convert Anthropic-style tool calling to Gemini JSON parsing
      return await withRetryGemini(async () => {
        const { model, max_tokens, system, tools, tool_choice, messages } = config;
        
        // Extract the user message content
        const userMsg = messages[0]?.content || "";
        const toolName = tool_choice?.name || "";
        
        // Get expected JSON schema from tool definition
        let expectedSchema = "";
        if (tools && tools.length > 0) {
          const tool = tools[0];
          const schema = tool.input_schema?.properties || {};
          expectedSchema = JSON.stringify(schema, null, 2);
        }

        // Build prompt that asks for JSON response
        const prompt = `${system}

User Request: ${userMsg}

IMPORTANT: You MUST respond with ONLY valid JSON matching this schema:
${expectedSchema}

Respond with ONLY JSON, no markdown, no code blocks, no other text.`;

        try {
          const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          const jsonText = response.text || "";
          
          // Parse JSON from response - handle various formats
          let parsedData;
          try {
            // Try direct JSON parsing first
            parsedData = JSON.parse(jsonText);
          } catch {
            // Try extracting JSON from markdown code blocks
            const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                            jsonText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
              const jsonStr = (jsonMatch[1] || jsonMatch[0]) ?? "{}";
              parsedData = JSON.parse(jsonStr);
            } else {
              throw new Error("Could not extract JSON from response");
            }
          }

          // Return in Anthropic format structure for compatibility
          return {
            content: [
              {
                type: "tool_use",
                input: parsedData,
                name: toolName
              }
            ]
          };
        } catch (error: any) {
          console.error("Gemini API Error:", error.message);
          throw new Error(`Failed to process Gemini response: ${error.message}`);
        }
      });
    }
  }
};

/**
 * Re-export withRetry with Gemini retry logic
 */
export const withRetry = withRetryGemini;
