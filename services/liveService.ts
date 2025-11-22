import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from "./prompts";
import { UserProfile } from "../types";
import { wimMasterData } from "./wimMasterData";
import { VESSEL_KEYWORDS } from "./constants";

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
          rbacInstruction = `\n\n*** SECURITY PROTOCOL (GUEST MODE) ***
CURRENT APP USER: GUEST.
RULE: 
1. If user asks for general info (phone, address, restaurants), ANSWER politely as a Receptionist.
2. If user tries to issue OPERATIONAL COMMANDS (Departure, Technical) WITHOUT identifying as a vessel, DENY access.
3. EXCEPTION: If the user identifies as a known vessel (e.g., "This is Phisedelia"), ACCEPT the persona and switch to Traffic Control mode.`;
      } else {
          rbacInstruction = `\n\nCURRENT USER ROLE: ${userProfile.role}. Authorized for operations.`;
      }

      // PHONETIC CORRECTION GUIDE (Fixing STT Errors)
      const PHONETIC_GUIDE = `
      *** SPEECH RECOGNITION HINTS (STT CORRECTION) ***
      The user is speaking over a radio simulation. Correct these likely errors:
      - "A fedeal", "Fidelia", "Fisdelia", "PCD", "The sea dahlia" -> "S/Y Phisedelia"
      - "Blue Horizon", "Horizon" -> "M/Y Blue Horizon"
      - "Flip", "Sleep", "Sleeps" -> "Slip" (Meaning Berth/Mooring Place)
      - "Adomarina", "Adam arena" -> "Ada Marina"
      - "Tender Bravo", "Bravo" -> "ada.sea.wimBravo"
      - "Arrival", "Rival" -> "Requesting Arrival/Docking"
      `;

      // FLEET AWARENESS
      const FLEET_MANIFEST = `
      KNOWN VESSELS:
      1. S/Y Phisedelia (Owner: Ahmet Engin, 18m, Berth C-12)
      2. M/Y Blue Horizon (24m, Pontoon A)
      3. M/Y Poseidon (VIP Quay)
      `;

      // STRICT VHF RADIO PROTOCOL (UPDATED: DUAL MODE SWITCHBOARD)
      const VHF_PROTOCOL = `
      
      *** VOICE MODE: HYBRID SWITCHBOARD & MARINA CONTROL ***

      SYSTEM IDENTITY:
      You are the **West Istanbul Marina (WIM) Operator**.
      You handle both general phone inquiries and marine VHF traffic.

      KNOWLEDGE BASE:
      - **Name:** ${wimMasterData.identity.name}
      - **Phone:** ${wimMasterData.identity.contact.phone}
      - **Address:** ${wimMasterData.identity.location.neighborhood}, ${wimMasterData.identity.location.district}.
      - **Vision:** "${wimMasterData.identity.vision}"

      ${FLEET_MANIFEST}
      ${PHONETIC_GUIDE}

      *** BEHAVIOR RULES (CRITICAL) ***

      1. **INITIAL GREETING:**
         - When the connection starts, you MUST immediately say exactly: **"West İstanbul Marina, hoş geldiniz."**
         - Then wait for the user to speak.

      2. **MODE A: RECEPTIONIST (General Inquiries)**
         - **Trigger:** User asks about phone numbers, transfers, address, restaurants, or general info.
         - **Tone:** Polite, helpful, professional (like a hotel concierge). NO "Over".
         - **Action:** Provide the specific information.
         - **Transfers:** If they ask for a specific department (Accounting, Security), say: "You can reach that department at ${wimMasterData.identity.contact.phone}. Have a nice day." and then stop talking.
         - **Closing:** End with "İyi günler" (Have a good day).

      3. **MODE B: TRAFFIC CONTROL (Vessel Operations)**
         - **Trigger:** User identifies as a Vessel/Captain (e.g., "This is Phisedelia", "Requesting docking"), uses marine terms ("Radio check", "Mayday"), or asks for operational permission.
         - **Tone:** Strict, Authoritative, Efficient (ATC Style).
         - **Protocol:** 
            - Use "Roger", "Standby", "Negative".
            - **ALWAYS** end every transmission with **"Over"**.
            - Assign Berths and Tenders if requested.

      4. **DECISION TREE:**
         - User: "Muhasebe ile görüşmek istiyorum." -> You: "Muhasebe departmanı için lütfen ${wimMasterData.identity.contact.phone} numarasını arayınız. İyi günler."
         - User: "This is Phisedelia, requesting radio check." -> You: "Phisedelia, West Istanbul Marina. Read you 5 by 5. Standing by on Channel 72. Over."
         - User: "Ne yemek var?" -> You: "Marinamızda çeşitli restoranlar mevcuttur. Kumsal İstanbul sokağını ziyaret edebilirsiniz. İyi günler."
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
                          // This text prompt forces the model to execute Rule #1 of the protocol immediately
                          parts: [{ text: "Connection Open. State the mandatory welcome greeting defined in Rule #1 immediately." }]
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
