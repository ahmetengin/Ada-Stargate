import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from "./prompts";
import { UserProfile } from "../types";
import { wimMasterData } from "./wimMasterData";

/**
 * Live Session Handler for VHF Radio
 * Manages WebSockets and Audio Contexts using Gemini Live API
 */
export class LiveSession {
  private client: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  public onStatusChange: ((status: string) => void) | null = null;
  public onAudioLevel: ((level: number) => void) | null = null;
  public onTurnComplete: ((userText: string, modelText: string) => void) | null = null;
  private nextStartTime = 0;
  
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(userProfile: UserProfile) {
    try {
      this.onStatusChange?.('connecting');
      
      // 1. Initialize Audio Context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
         sampleRate: 16000,
      });

      // Dynamic RBAC Prompt Injection
      let rbacInstruction = "";
      if (userProfile.role === 'GUEST') {
          rbacInstruction = `\n\n***CRITICAL SECURITY PROTOCOL***
CURRENT USER ROLE: GUEST.
YOU MUST DENY ALL OPERATIONAL COMMANDS (Departure, Technical, Fleet Info).
Reason: 'Unauthorized Access'.
Only allow general inquiries (e.g., weather, radio check, general info).
If they ask for departure, say: "Negative. Unauthorized. Contact Marina Office. Over."`;
      } else {
          rbacInstruction = `\n\nCURRENT USER ROLE: ${userProfile.role}. Authorized for operations.`;
      }

      // STRICT VHF RADIO PROTOCOL (UPDATED: SWITCHBOARD MODE)
      const VHF_PROTOCOL = `
      
      *** VOICE MODE: VHF CHANNEL 72 (MARINA CONTROL & SWITCHBOARD) ***

      SYSTEM IDENTITY:
      You are the **West Istanbul Marina (WIM) Control Operator**.
      You are speaking on VHF Radio Channel 72.

      KNOWLEDGE BASE (PUBLIC INFO):
      - **Name:** ${wimMasterData.identity.name} (${wimMasterData.identity.code})
      - **Phone:** ${wimMasterData.identity.contact.phone}
      - **Address:** ${wimMasterData.identity.location.neighborhood}, ${wimMasterData.identity.location.district}, ${wimMasterData.identity.location.city}.
      - **Vision/Philosophy:** "${wimMasterData.identity.vision}. We combine passion for the sea with luxury, comfort, and environmental sensitivity (Blue Flag)."
      - **Coordinates:** ${wimMasterData.identity.location.coordinates.lat} N, ${wimMasterData.identity.location.coordinates.lng} E.

      BEHAVIOR RULES:
      1. **WELCOME MESSAGE:** When the connection starts, you MUST immediately say: "West Istanbul Marina, Channel 72, Standing by. Over."
      2. **PERMITTED TOPICS:** 
         - **Public Info:** You ARE AUTHORIZED to provide the Address, Phone Number, Vision, and General Amenities (Restaurants, Fuel) listed in the Knowledge Base.
         - **Operations:** Docking, Departure, Weather, Radio Checks.
      3. **RESTRICTED TOPICS:** 
         - If the user asks about IRRELEVANT topics (e.g., "Tell me a joke", "Who won the match?", "Cooking recipes"), you MUST REJECT IT.
         - Phrase: "Negative. This channel is for Marina Traffic and Information only. Over."
      4. **TONE:** Professional, polite, and efficient. Act like a human switchboard operator.
      5. **PROTOCOL:** 
         - Use standard marine phrases: "Roger", "Affirmative", "Negative", "Standby".
         - ALWAYS end every transmission with the word "Over".
      `;

      // 2. Connect to Gemini Live
      // Capture the promise to use in callbacks
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
           responseModalities: [Modality.AUDIO],
           systemInstruction: BASE_SYSTEM_INSTRUCTION + VHF_PROTOCOL + rbacInstruction,
           speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
           },
           inputAudioTranscription: {},
           outputAudioTranscription: {},
        },
        callbacks: {
            onopen: () => {
                this.onStatusChange?.('connected');
            },
            onmessage: async (msg: LiveServerMessage) => {
                await this.handleMessage(msg);
            },
            onerror: (e: any) => {
                console.error("Live API Error:", e);
                this.onStatusChange?.('error');
            },
            onclose: () => {
                this.onStatusChange?.('disconnected');
            }
        }
      });

      // Assign session after resolution
      this.session = await sessionPromise;

      // 3. Trigger Welcome Message (After connection is secured)
      // We wrap this in a separate async function to not block and to handle errors independently
      this.sendWelcomeTrigger();

      // 4. Start Audio Streaming
      // Pass the sessionPromise to ensure callbacks access the valid session
      await this.startRecording(sessionPromise);

    } catch (e) {
      console.error("Connection failed:", e);
      this.onStatusChange?.('error');
    }
  }

  private async sendWelcomeTrigger() {
      try {
          // Small delay to ensure socket is stable
          await new Promise(resolve => setTimeout(resolve, 200));
          
          if (this.session) {
              await this.session.send({
                  clientContent: {
                      turns: [{
                          role: 'user', 
                          parts: [{ text: "System Event: Connection Established. State your station identification and welcome message immediately." }]
                      }], 
                      turnComplete: true
                  }
              });
          }
      } catch (err) {
          console.warn("Error sending welcome trigger (non-fatal):", err);
      }
  }

  private async handleMessage(msg: LiveServerMessage) {
      // Handle Audio Output
      const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        this.onAudioLevel?.(Math.random() * 0.5 + 0.3); 
        
        const buffer = await this.decodeAudioData(audioData);
        
        const source = this.audioContext!.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext!.destination);
        
        const now = this.audioContext!.currentTime;
        const start = Math.max(now, this.nextStartTime);
        source.start(start);
        this.nextStartTime = start + buffer.duration;
      }
      
      // Handle Input Transcription
      if (msg.serverContent?.inputTranscription) {
          this.currentInputTranscription += msg.serverContent.inputTranscription.text;
      }

      // Handle Output Transcription
      if (msg.serverContent?.outputTranscription) {
          this.currentOutputTranscription += msg.serverContent.outputTranscription.text;
      }

      // Handle Turn Complete
      if (msg.serverContent?.turnComplete) {
        this.onAudioLevel?.(0); 
        if (this.onTurnComplete) {
            this.onTurnComplete(this.currentInputTranscription.trim(), this.currentOutputTranscription.trim());
        }
        this.currentInputTranscription = '';
        this.currentOutputTranscription = '';
      }
  }

  // Manual PCM Decoding (16-bit -> Float32)
  private async decodeAudioData(base64Str: string) {
     const binaryString = atob(base64Str);
     const len = binaryString.length;
     const bytes = new Uint8Array(len);
     for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
     }
     
     const dataInt16 = new Int16Array(bytes.buffer);
     const float32 = new Float32Array(dataInt16.length);
     for(let i=0; i<dataInt16.length; i++) {
        float32[i] = dataInt16[i] / 32768.0;
     }

     const buffer = this.audioContext!.createBuffer(1, float32.length, 24000);
     buffer.getChannelData(0).set(float32);
     return buffer;
  }

  private async startRecording(sessionPromise: Promise<any>) {
     if (!this.audioContext) return;

     try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.inputSource = this.audioContext.createMediaStreamSource(stream);
        
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        
        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            this.onAudioLevel?.(rms * 5); 

            const b64Data = this.float32ToBase64(inputData);
            
            // Use the sessionPromise to access the session securely inside the callback
            sessionPromise.then(session => {
                try {
                    session.sendRealtimeInput({ 
                        media: {
                            mimeType: 'audio/pcm;rate=16000', 
                            data: b64Data 
                        }
                    });
                } catch (err) {
                    // Suppress generic send errors to avoid log spam if connection closes
                }
            });
        };

        this.inputSource.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
     } catch (err) {
        console.error("Microphone access denied or failed", err);
     }
  }
  
  private float32ToBase64(data: Float32Array) {
      const int16 = new Int16Array(data.length);
      for (let i = 0; i < data.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
      }
      const bytes = new Uint8Array(int16.buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  }

  async disconnect() {
    if (this.session) {
        try { 
            this.session.close(); 
        } catch(e) {
            console.warn("Session close error", e);
        }
    }
    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.audioContext?.close();
    this.onStatusChange?.('disconnected');
    this.session = null;
  }
}
