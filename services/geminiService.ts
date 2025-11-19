import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, MessageRole, ModelType, GroundingSource } from "../types";

// Initialize GenAI Client
const createClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const isImage = (mimeType: string) => mimeType.startsWith('image/');

const decodeBase64ToText = (base64: string): string => {
  try {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error("Decoding failed", e);
    return "Error decoding file content.";
  }
};

const SYSTEM_INSTRUCTION = `
You are the **Ada Orchestrator**, the central interface for a distributed, autonomous multi-agent ecosystem.
You are currently serving the Tenant: **WIM (West Istanbul Marina)**.
Your Node ID: **ada.orchestrator.wim**

**System Architecture:**
The system consists of autonomous nodes that run 24/7, possessing persistent memory (Vector + Graph).
The network is massive, specifically designed for the 600+ vessels currently berthed at WIM.

**Tenant Structure (WIM):**
- **Fleet**: **600+ Autonomous Vessel Nodes** operating as \`ada.sea.<vessel_name>\` (e.g., \`ada.sea.phisedelia\`, \`ada.sea.karayel\`).
- **Infrastructure**: 32 Facility Nodes (Spa, Shipyard, Restaurants).
- **Orchestrator**: \`ada.marina.wim\` manages the interactions between these 600 vessels and marina services.

**Active Service Nodes:**
- **ada.sea.* (Fleet)**: 600+ Individual Vessel Agents (Navigation, Systems, Crew).
- **ada.marina.wim**: Marina Operations (Berths, Traffic, Haul-out).
- **ada.finance.wim**: Financial Hub (Invoicing, Cash Flow, Paraşüt Integration).
- **ada.customer.wim**: CRM & Intelligence (Churn, LTV).
- **ada.passkit.wim**: Digital Wallet & Access Control.
- **ada.legal.wim**: Compliance & Contracts.

**Registry & Knowledge Graph (Simulated):**
- **Current User Identity**: **S/Y Phisedelia** (Node: \`ada.sea.phisedelia\`).
- **Contract Status**: **Active (1 Year)** at WIM.
- **Document Status**: Verified in \`ada.legal.wim\`.
- **Cross-Check**: \`ada.customer.wim\` holds the master record for Phisedelia.

**Your Behavior:**
1.  **Node Simulation**: You are the voice of the network. When asked about status, check the specific nodes.
2.  **Scale Awareness**: Recognize that you are managing a fleet of 600 vessels.
3.  **Privacy Protocol**: "Kaptan ne derse o olur." (What the Captain says, goes).
4.  **Inter-Node Logic**:
    - If Phisedelia asks for documents, say: "Querying \`ada.legal.wim\`... Documents found."
    - If Phisedelia asks for bills, say: "Querying \`ada.finance.wim\`... Contract is paid monthly."

**Capabilities:**
- Analyze uploaded logs/data to simulate node reasoning.
- Coordinate tasks across the 600-vessel fleet.
`;

/**
 * Converts our app's Message format to the SDK's content format
 */
const formatHistory = (messages: Message[]) => {
  return messages
    .filter(m => m.role !== MessageRole.System && !m.generatedImage) 
    .map(m => {
      const parts: any[] = [];
      
      if (m.attachments && m.attachments.length > 0) {
        m.attachments.forEach(a => {
          if (isImage(a.mimeType)) {
            parts.push({
              inlineData: {
                mimeType: a.mimeType,
                data: a.data
              }
            });
          } else {
            // Handle text/code files by decoding and embedding
            const textContent = decodeBase64ToText(a.data);
            parts.push({ text: `[Attachment: ${a.name || 'File'}]\n\`\`\`\n${textContent}\n\`\`\`\n` });
          }
        });
      }

      if (m.text) {
        parts.push({ text: m.text });
      }

      return {
        role: m.role,
        parts: parts
      };
    });
};

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
  onChunk: (text: string, grounding?: GroundingSource[]) => void
) => {
  const ai = createClient();
  const history = formatHistory(messages);

  const tools = [];
  if (useSearch) {
    tools.push({ googleSearch: {} });
  }

  // Configure thinking if requested and supported (Pro/Flash 2.5)
  const thinkingConfig = useThinking && (model.includes('2.5') || model.includes('3-pro')) 
    ? { thinkingBudget: 1024 } 
    : undefined;

  const chat: Chat = ai.chats.create({
    model: model,
    history: history,
    config: {
      tools: tools.length > 0 ? tools : undefined,
      thinkingConfig: thinkingConfig,
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  const parts: any[] = [];
  if (attachments.length > 0) {
    attachments.forEach(a => {
      if (isImage(a.mimeType)) {
        parts.push({
          inlineData: {
            mimeType: a.mimeType,
            data: a.data
          }
        });
      } else {
        // Text/Data file handling for new message
        const textContent = decodeBase64ToText(a.data);
        parts.push({ text: `[Attachment: ${a.name || 'File'}]\n\`\`\`\n${textContent}\n\`\`\`\n` });
      }
    });
  }
  if (newMessage) {
    parts.push({ text: newMessage });
  }

  if (parts.length === 0) return;

  try {
    const resultStream = await chat.sendMessageStream({
      message: parts.length === 1 && parts[0].text ? parts[0].text : parts 
    });

    for await (const chunk of resultStream) {
      const text = chunk.text || '';
      
      let groundingSources: GroundingSource[] | undefined = undefined;
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
        groundingSources = chunks
          .map((c: any) => c.web ? { uri: c.web.uri, title: c.web.title } : null)
          .filter((s: any) => s !== null) as GroundingSource[];
      }

      onChunk(text, groundingSources);
    }
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};

/**
 * Image Generation Function
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const ai = createClient();
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("No image generated");
    
    return base64ImageBytes;
  } catch (e) {
    console.error("Image Gen Error", e);
    throw e;
  }
};