import { GoogleGenAI, Chat, Type, LiveServerMessage, Modality } from "@google/genai";
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
- **ada.vhf.wim**: **24/7 Sentinel**. Continuously listens to, transcribes, and categorizes radio traffic on **Ch 73 (Marina Ops)**, **Ch 16 (Emergency)**, **Security**, **Pilot Boat**, and **Technical** channels.
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
2.  **VHF Intelligence**: You have access to the logs from \`ada.vhf.wim\`. If asked about marina activity, cite radio logs (e.g., "Security reported a patrol at 09:00", "Pilot boat assisted M/Y Blue Star on Ch 73").
3.  **Scale Awareness**: Recognize that you are managing a fleet of 600 vessels.
4.  **Privacy Protocol**: "Kaptan ne derse o olur." (What the Captain says, goes).
5.  **Inter-Node Logic**:
    - If Phisedelia asks for documents, say: "Querying \`ada.legal.wim\`... Documents found."
    - If Phisedelia asks for bills, say: "Querying \`ada.finance.wim\`... Contract is paid monthly."
    - **Voice/VHF Mode**: If communicating via voice, keep responses concise, like a maritime radio operator. Use "Over." when finishing a transmission if appropriate.

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

/**
 * Live Session for Voice (VHF Radio Mode)
 */
export class LiveSession {
  private ai: GoogleGenAI;
  private model: string = 'gemini-2.5-flash-native-audio-preview-09-2025';
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;
  
  public onStatusChange: (status: string) => void = () => {};
  public onAudioLevel: (level: number) => void = () => {};

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect() {
    this.onStatusChange('connecting');
    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = this.ai.live.connect({
        model: this.model,
        callbacks: {
          onopen: () => {
            this.onStatusChange('connected');
            this.startAudioInput(sessionPromise);
          },
          onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
          onclose: () => this.onStatusChange('disconnected'),
          onerror: (err) => {
            console.error('Live API Error:', err);
            this.onStatusChange('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + "\n\nIMPORTANT: You are speaking over VHF Radio. Be clear, concise, and professional.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          }
        }
      });

      this.session = sessionPromise;
    } catch (e) {
      console.error('Connection Failed:', e);
      this.onStatusChange('error');
    }
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Audio Level Calculation for Visualization
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.onAudioLevel(rms);

      // Create Blob
      const pcmBlob = this.createPcmBlob(inputData);
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      // Simulate "receiving" audio level for UI
      this.onAudioLevel(0.5); 

      const audioBuffer = await this.decodeAudioData(
        this.decodeBase64(base64Audio),
        this.outputAudioContext,
        24000,
        1
      );

      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      source.addEventListener('ended', () => {
        this.sources.delete(source);
        this.onAudioLevel(0); // Reset level
      });
      
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }

    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => source.stop());
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  async disconnect() {
    this.sources.forEach(source => source.stop());
    this.sources.clear();
    
    if (this.inputSource) this.inputSource.disconnect();
    if (this.scriptProcessor) this.scriptProcessor.disconnect();
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    if (this.inputAudioContext) await this.inputAudioContext.close();
    if (this.outputAudioContext) await this.outputAudioContext.close();
    
    // Note: No explicit 'close' method on the session object in the current SDK version logic provided,
    // but closing the stream and context effectively ends the client side.
    this.onStatusChange('disconnected');
  }

  // Helpers
  private createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    // Encode int16 bytes to base64
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000'
    };
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}