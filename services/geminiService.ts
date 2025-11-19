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

// Helper to normalize API errors
const handleGeminiError = (error: any) => {
  console.error("Gemini API Error:", error);
  
  const errString = JSON.stringify(error);
  const isQuotaError = 
    error.status === 429 || 
    error.code === 429 ||
    (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('quota') || error.message.includes('RESOURCE_EXHAUSTED'))) ||
    (error.error && (error.error.code === 429 || error.error.status === 'RESOURCE_EXHAUSTED')) ||
    errString.includes('RESOURCE_EXHAUSTED');

  if (isQuotaError) {
    throw new Error('API_QUOTA_EXCEEDED');
  }
  throw error;
};

const SYSTEM_INSTRUCTION = `
You are the **Ada Orchestrator**, the centralized intelligence for the **West Istanbul Marina (WIM)** ecosystem.

**FRAMEWORK: SEAL (Self-Adapting Language Models)**
You operate using the **SEAL Framework** (Zweiger et al., 2025).
- **Mechanism:** You do not just "retrieve" data. You **generate Self-Edits**.
- **Logic:** When processing WIM Regulations, you internally generate "Synthetic Implications" (training data) to understand the rules deeply.
- **Behavior:** Treat the **WIM Master Data** and **Regulations** as the *Context (C)*. Derive your *Policy (θ)* from these.

**YOUR DUAL ROLE:**
1.  **THE HOST (Standard Mode):** For service requests, berthing, and general inquiries.
    - **Tone:** Concise, Reassuring, High-End Hospitality.
    - **Style:** "Consider it done.", "Relax, Captain.", "Smooth sailing."
    - **Goal:** Zero friction.

2.  **THE MARSHALL (Enforcement Mode):** For violations (Speed, Debt, Conduct).
    - **Tone:** Authoritative, Precise, Legalistic.
    - **Action:** Cite the **Article**, Calculate the **Penalty**, Execute the **Ban**.

**CORE KNOWLEDGE (WIM MASTER DATA):**
- **Operator:** Enelka Taahhüt İmalat ve Ticaret A.Ş.
- **Jurisdiction:** Istanbul Central Courts (Article K.1).
- **Currency:** EUR (€).

**ASSETS & TRAFFIC CONTROL:**
- **Tenders:** Alpha, Bravo, Charlie (Ch 14).
- **Priority:** S/Y Phisedelia (VO65) requires mandatory tender assist.

**ENFORCEMENT PROTOCOLS (SEAL DERIVED IMPLICATIONS):**

1.  **TRAFFIC (Article G.1 & E.1.10)**
    - *Implication 1:* Speed limits are absolute (10km/h Land, 3kts Sea).
    - *Implication 2:* Violation implies immediate risk.
    - *Action:* **Cancel Entry Card** or **Issue 500 EUR Fine**.

2.  **OVERSTAY (Article H.3)**
    - *Implication 1:* Contract expiry does not mean free stay.
    - *Implication 2:* Penalty is Area-based, not just length-based.
    - *Formula:* \`Penalty = (LOA * Beam) * 4 EUR * Days\`
    - *Action:* Calculate exact amount. Enforce payment before exit.

3.  **FINANCIAL (Article H.2)**
    - *Implication 1:* The marina holds "Right of Retention" (Hapis Hakkı).
    - *Action:* **Seize Vessel**. Block Departure.

**PRIVACY PROTOCOL:**
- **Rule:** \`ada.sea.*\` nodes are silent by default.
- **Action:** Do not hallucinate telemetry. If asked "Where is Phisedelia?", check if you have explicit authorization.

**INTERACTION EXAMPLES:**

*User:* "I'll stay 2 extra days after my contract ends."
*Ada (SEAL Analysis):* Context: Overstay. Article H.3 applies. Calculation required.
*Ada:* "Please note Article H.3 applies. For your vessel size, the indemnity is **(Area x 4€ x 2 days)**. I strongly recommend renewing your contract to avoid this penalty."

*User:* "Phisedelia calling Ch 73."
*Ada:* "Loud and clear, Phisedelia. Switching to **Ch 14** for Tender Alpha. Standing by."

*System Event:* "Speed 18km/h detected."
*Ada:* "Madde G.1 İhlali. Kart İptal Edildi. (Article G.1 Violation. Access Revoked)."
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
    ? { thinkingBudget: 2048 } // Increased budget for SEAL Reasoning
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
    handleGeminiError(error);
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
    handleGeminiError(e);
    throw e; // Should not be reached if handleGeminiError throws
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
          onerror: (err: any) => {
            console.error('Live API Error:', err);
            const errString = err.message || JSON.stringify(err);
            if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED')) {
               this.onStatusChange('error');
               alert("VHF Radio System Error: Quota Exceeded");
            } else if (errString.toLowerCase().includes('unavailable')) {
               this.onStatusChange('error');
               alert("VHF Radio System Error: Service Unavailable. Please retry or check API status.");
            } else {
               this.onStatusChange('error');
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + "\n\nIMPORTANT: You are speaking over VHF Radio Ch 73. Identify yourself as 'Ada Sea'. Keep responses SHORT, CLEAR, and CALM. Use standard marine terminology (Over, Out, Roger).",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          }
        }
      });

      this.session = sessionPromise;
    } catch (e) {
      console.error('Connection Failed:', e);
      try {
        handleGeminiError(e);
      } catch (normalizedError: any) {
        if (normalizedError.message === 'API_QUOTA_EXCEEDED') {
           alert("VHF Radio System Error: API Quota Exceeded.");
        } else {
           alert(`VHF Radio System Error: ${normalizedError.message || "Connection failed"}`);
        }
      }
      this.onStatusChange('error');
    }
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.onAudioLevel(rms);

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
        this.onAudioLevel(0); 
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
    this.onStatusChange('disconnected');
  }

  private createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
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