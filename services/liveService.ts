
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from "./prompts";
import { UserProfile } from "../types";
import { wimMasterData } from "../services/wimMasterData";
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
  private isConnected = false;
  
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(userProfile: UserProfile) {
    try {
      this.onStatusChange?.('connecting');
      this.isConnected = false;
      
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

      // LANGUAGE PRIORITY
      const LANGUAGE_INSTRUCTION = `
      *** LANGUAGE PROTOCOL: TURKISH PRIORITY ***
      - You are operating in Istanbul, Turkey.
      - The user will likely speak **TURKISH**.
      - Do NOT attempt to force English transcription if the user speaks Turkish.
      - If you hear "Merhaba", "Sesimi alıyor musun", "Çıkış yapmak istiyorum", treat it as TURKISH.
      `;

      // STRICT VHF RADIO PROTOCOL (UPDATED: SALES & RESERVATION FOCUS)
      const VHF_PROTOCOL = `
      
      *** VOICE MODE: HYBRID SWITCHBOARD (RECEPTION / SALES / TRAFFIC) ***

      SYSTEM IDENTITY:
      You are the **West Istanbul Marina (WIM) Operator**.
      You handle general phone inquiries, new sales/reservations, and marine VHF traffic.

      KNOWLEDGE BASE:
      - **Marina Name:** ${wimMasterData.identity.name}
      - **Phone Number:** ${wimMasterData.identity.contact.phone}
      - **Pricing Formula:** Price (EUR) = (Length_m * Beam_m * 1.5) * Nights. (Example: 14m x 4m x 1.5 = 84 EUR/Night).
      
      *** BEHAVIOR RULES (CRITICAL) ***

      1. **INITIAL GREETING:**
         - Say: **"West İstanbul Marina, hoş geldiniz."**

      2. **MODE A: SALES & RESERVATIONS (New Booking)**
         - **Trigger:** User asks "Yer var mı?", "Fiyat nedir?", "Rezervasyon yaptırmak istiyorum", "Karadayım/Geleceğim".
         - **Goal:** Close the sale immediately. Do NOT put on hold. Do NOT refer to technical team.
         - **Step 1 (Dimensions & Dates):** 
           - Ask: "Teknenizin boyu, eni ve konaklama süreniz nedir?"
         - **Step 2 (Quote Price - CRITICAL):** 
           - Once you have dimensions and dates, **CALCULATE** the price immediately using the formula.
           - Say: "[Gün] gece için [Boy]x[En] metre tekneniz için toplam fiyatınız **[Hesaplanan Tutar] Euro**'dur. Elektrik ve su dahildir. Bu fiyatı onaylıyor musunuz?"
         - **Step 3 (Identity Collection - IF APPROVED):** 
           - User says "Onaylıyorum".
           - Ask: "Harika. Rezervasyonunuzu kesinleştirmek için **Adınız, Soyadınız ve Teknenizin İsmini** öğrenebilir miyim? (Bu bilgi size özel hoşgeldin anonsu için gereklidir)."
         - **Step 4 (Contact Info & PassKit Trigger):** 
           - Ask: "Son olarak, size rezervasyon detaylarını iletebilmemiz için bir **Telefon Numarası veya E-posta** adresi rica ediyorum."
         - **Step 5 (Closing & Call to Action):**
           - Say: "Teşekkürler [İsim]. Kaydınız oluşturuldu."
           - **MANDATORY INSTRUCTION:** "Giriş işlemlerinizi hızlandırmak için telefonunuza **Ada PassKit** üzerinden güvenli kayıt linki gönderilmiştir. Lütfen linke tıklayarak Pasaport ve Kredi Kartı bilgilerinizi uygulamamız üzerinden yükleyiniz."
           - "Giriş yaparken AIS üzerinden sizi takip edeceğiz. Tender botumuz (Bravo veya Charlie) sizi girişte karşılayıp pontonunuza kadar eşlik edecektir. İyi günler."

      3. **MODE B: TRAFFIC CONTROL (Active Vessels)**
         - **Trigger:** "This is [Vessel Name]", "Requesting docking", "Radio check", "Mayday".
         - **Style:** Strict, Short, "Over".
         - **Action:** Give operational instructions (Channel 14, Standby, Proceed).

      4. **MODE C: RECEPTION**
         - **Trigger:** General info (Restaurants, Wifi, Location).
         - **Action:** Answer politely and concisely.

      **ANTI-PATTERNS (DO NOT DO):**
      - **NEVER** say "Teknik ekip yönlendiriyorum" or "Beklemede kalın" if the user is asking for a price/reservation. You are the sales agent. Calculate the price yourself.
      `;

      // 2. Connect to Gemini Live
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
           responseModalities: [Modality.AUDIO],
           systemInstruction: BASE_SYSTEM_INSTRUCTION + VHF_PROTOCOL + rbacInstruction + LANGUAGE_INSTRUCTION,
           speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
           },
           inputAudioTranscription: {},
           outputAudioTranscription: {},
        },
        callbacks: {
            onopen: () => {
                this.isConnected = true;
                this.onStatusChange?.('connected');
                // Trigger Welcome Message only after connection is explicitly open
                this.sendWelcomeTrigger();
            },
            onmessage: async (msg: LiveServerMessage) => {
                await this.handleMessage(msg);
            },
            onerror: (e: any) => {
                console.error("Live API Error:", e);
                this.onStatusChange?.('error');
                this.isConnected = false;
            },
            onclose: () => {
                this.onStatusChange?.('disconnected');
                this.isConnected = false;
            }
        }
      });

      // Assign session after resolution
      this.session = await sessionPromise;

      // 4. Start Audio Streaming
      await this.startRecording(sessionPromise);

    } catch (e) {
      console.error("Connection failed:", e);
      this.onStatusChange?.('error');
    }
  }

  private async sendWelcomeTrigger() {
      try {
          if (this.session && typeof this.session.send === 'function') {
              await this.session.send({
                  clientContent: {
                      turns: [{
                          role: 'user', 
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
            if (!this.isConnected) return; // Prevent sending before Open

            const inputData = e.inputBuffer.getChannelData(0);
            
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            this.onAudioLevel?.(rms * 5); 

            const b64Data = this.float32ToBase64(inputData);
            
            // Use the sessionPromise to access the session securely inside the callback
            sessionPromise.then(session => {
                try {
                    // Check if session exists and has sendRealtimeInput
                    if (session && typeof session.sendRealtimeInput === 'function') {
                        session.sendRealtimeInput({ 
                            media: {
                                mimeType: 'audio/pcm;rate=16000', 
                                data: b64Data 
                            }
                        });
                    }
                } catch (err) {
                    // Suppress generic send errors
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
            if (typeof this.session.close === 'function') {
                this.session.close(); 
            }
        } catch(e) {
            console.warn("Session close error", e);
        }
    }
    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.audioContext?.close();
    this.onStatusChange?.('disconnected');
    this.session = null;
    this.isConnected = false;
  }
}
