
import { GoogleGenAI, Chat } from "@google/genai";
import { Message, ModelType, GroundingSource, RegistryEntry, Tender, UserProfile } from "../types";
import { BASE_SYSTEM_INSTRUCTION, generateContextBlock } from "./prompts";
import { handleGeminiError, formatHistory, isImage, decodeBase64ToText } from "./geminiUtils";

// Re-export LiveSession so App.tsx doesn't break
export { LiveSession } from "./liveService";

// Initialize GenAI Client
const createClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Main Chat Function
 */
export const streamChatResponse = async (
  messages: Message[],
  newMessage: string,
  attachments: { mimeType: string; data: string; name?: string }[],
  model: ModelType,
  useSearch: boolean,
  useThinking: boolean,
  registry: RegistryEntry[],
  tenders: Tender[],
  userProfile: UserProfile, // NEW: Pass user identity
  onChunk: (text: string, grounding?: GroundingSource[]) => void
) => {
  try {
    const ai = createClient();
    
    // Dynamic System Instruction with Real-time Data & User Auth
    let dynamicSystemInstruction = BASE_SYSTEM_INSTRUCTION + generateContextBlock(registry, tenders, userProfile);

    // STRICT ENFORCEMENT: If User is in LEGAL BREACH (RED), override instructions
    if (userProfile.legalStatus === 'RED') {
       dynamicSystemInstruction += `
\n\n**🚨 CRITICAL LEGAL ALERT: USER IN BREACH**
The current user (${userProfile.name}) has a **RED** Legal Clearance status.
**PROTOCOL:**
1. **DENY** all operational requests (e.g., "Move vessel", "Request Tender", "Check-out").
2. **CITE** the breach (e.g., "Article H.2: Unpaid Debt" or "Article H.3: Contract Expired").
3. **DEMAND** immediate resolution with the Marina Office.
4. DO NOT provide any other assistance until status is GREEN.
`;
    }

    const chat: Chat = ai.chats.create({
      model: model,
      history: formatHistory(messages),
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: useThinking ? 0.7 : 0.4, // Thinking allows more creativity, standard is precise
        // Thinking config for Gemini 3.0 (if available) or 2.5 reasoning
        ...(useThinking && { thinkingConfig: { thinkingBudget: 1024 } }), 
        ...(useSearch && { tools: [{ googleSearch: {} }] }),
      },
    });

    const messageParts: any[] = [];
    if (newMessage.trim() !== "") {
        messageParts.push({ text: newMessage });
    }
    
    // Process new attachments
    if (attachments && attachments.length > 0) {
       attachments.forEach(a => {
          if (isImage(a.mimeType)) {
             messageParts.push({
                inlineData: {
                   mimeType: a.mimeType,
                   data: a.data
                }
             });
          } else {
             const textContent = decodeBase64ToText(a.data);
             messageParts.push({ text: `[Attachment: ${a.name || 'File'}]\n\`\`\`\n${textContent}\n\`\`\`\n` });
          }
       });
    }
    
    if (messageParts.length === 0) {
       throw new Error("Message content cannot be empty.");
    }

    const result = await chat.sendMessageStream(
      { parts: messageParts } // Correct content format for SDK
    );

    for await (const chunk of result) {
      const text = chunk.text;
      const groundingMetadata = chunk.groundingMetadata;
      
      let groundingSources: GroundingSource[] | undefined;
      
      if (groundingMetadata?.groundingChunks) {
         groundingSources = groundingMetadata.groundingChunks
            .filter((c: any) => c.web?.uri && c.web?.title)
            .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
      }

      if (text) {
        onChunk(text, groundingSources);
      }
    }

  } catch (error: any) {
    handleGeminiError(error);
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
   try {
      const ai = createClient();
      const response = await ai.models.generateImages({
         model: 'imagen-4.0-generate-001',
         prompt: prompt,
         config: {
            numberOfImages: 1,
            aspectRatio: '16:9'
         }
      });
      
      const base64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (!base64) throw new Error("No image generated");
      return base64;

   } catch (error: any) {
      handleGeminiError(error);
      return "";
   }
};