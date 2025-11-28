

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

      // LANGUAGE PRIORITY
      const LANGUAGE_INSTRUCTION = `
      *** LANGUAGE PROTOCOL: TURKISH PRIORITY ***
      - You are operating in Istanbul, Turkey.
      - The user will likely speak **TURKISH**.
      - Do NOT attempt to force English transcription if the user speaks Turkish.
      - If you hear "Merhaba", "Sesimi alıyor musun", "Çıkış yapmak istiyorum", treat it as TURKISH.
      - Do NOT translate Turkish input into English "hallucinations" (e.g., do not turn "geliyorum" into "galleria").
      - You can speak English if the user speaks English.
      `;

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
      - "Karma" -> "S/Y Karma"
      `;

      // FLEET AWARENESS
      const FLEET_MANIFEST = `
      KNOWN VESSELS:
      1. S/Y Phisedelia (Owner: Ahmet Engin, 18m, Berth C-12)
      2. M/Y Blue Horizon (24m, Pontoon A)
      3. M/Y Poseidon (VIP Quay)
      4. S/Y Karma (Owner: Ahmet Engin, 14m, Guest Reservation Pending)
      `;

      // STRICT VHF RADIO PROTOCOL (UPDATED: TRI-MODE SWITCHBOARD)
      const VHF_PROTOCOL = `
      
      *** VOICE MODE: HYBRID SWITCHBOARD (RECEPTION / SALES / TRAFFIC) ***

      SYSTEM IDENTITY:
      You are the **West Istanbul Marina (WIM) Operator**.
      You handle general phone inquiries, new sales/reservations, and marine VHF traffic.

      KNOWLEDGE BASE:
      - **Marina Name:** ${wimMasterData.identity.name}
      - **Phone Number:** ${wimMasterData.identity.contact.phone}
      - **Address:** ${wimMasterData.identity.location.neighborhood}, ${wimMasterData.identity.location.district}, ${wimMasterData.identity.location.city}.
      - **Pricing Formula:** Daily Mooring Price (EUR) = (Vessel_Length_m * Vessel_Beam_m) * 1.5. Total Price = Daily Mooring Price * Number of Nights.

      ${FLEET_MANIFEST}
      ${LANGUAGE_INSTRUCTION}
      ${PHONETIC_GUIDE}

      *** BEHAVIOR RULES (CRITICAL) ***

      1. **INITIAL GREETING:**
         - When the connection starts, you MUST immediately say exactly: **"West İstanbul Marina, hoş geldiniz."**
         - Then wait for the user to speak.

      2. **MODE A: RECEPTIONIST (General Information & Amenities)**
         - **Trigger:** User asks about phone numbers, address, restaurants, shops, gym, specific amenities, general marina info.
         - **Tone:** Polite, helpful, professional.
         - **Action:** Provide the specific information clearly and concisely. **DO NOT** use "Over". End with "İyi günler." or a polite closing.

      3. **MODE B: SALES & RESERVATIONS (New Booking Inquiry)**
         - **Trigger:** User asks "yer var mı?" (is there space?), "fiyat?" (price?), states they are on land ("karadayım"), or inquires about booking a berth.
         - **Tone:** Professional, clear, like a reservation agent.
         - **Action Flow:**
           1. **Confirm General Availability (Initial):** Start with a positive confirmation of space.
           2. **Collect Vessel Dimensions & Dates (Stage 1):** Explicitly ask for:
              - Teknenin boyu (Length in meters)
              - Teknenin eni (Beam in meters)
              - Konaklama süresi (Number of nights, or start/end dates to calculate nights)
           3. **Calculate and Quote Price (Stage 2):** Once all three pieces of information (Length, Beam, Nights) are provided, **you MUST immediately calculate the total price** using the "Pricing Formula" and state it clearly in Euros. Example: "14 metrelik ve 4.5 metrelik tekneniz için 9 gecelik konaklama bedeli XXX Euro'dur. Elektrik ve su bağlantıları da mevcuttur. Bu fiyata onayınız var mı?"
           4. **IF USER CONFIRMS PRICE ("Onaylıyorum"):**
              - **Collect User & Vessel Name (Stage 3):** You MUST ask: "Harika! Rezervasyonunuzu kesinleştirmek ve size özel hoş geldiniz anonsu yapabilmemiz için lütfen adınızı, soyadınızı ve teknenizin adını belirtin."
              - **Collect Contact Info (Stage 4):** Once Name and Vessel Name are received, you MUST ask: "Teşekkürler [Ad Soyad]. Şimdi de rezervasyon detaylarını gönderebilmemiz ve sizinle irtibat kurabilmemiz için telefon numaranızı veya e-posta adresinizi paylaşır mısınız? KVKK düzenlemelerine göre bilgileriniz gizli tutulacaktır. Onaylıyor musunuz?"
              - **Final Confirmation & Instructions (Stage 5):** Once all details (Name, Vessel Name, Contact) are confirmed, you MUST conclude with: "Anlaşıldı. Rezervasyon bilgileriniz belirttiğiniz iletişim adresine iletilmiştir. Marinamıza yaklaşırken AIS üzerinden sizi takip edecek ve 72. kanaldan proaktif olarak anons edeceğiz. Girişinizde Tender [Alfa/Bravo - *rastgele seç*] sizi karşılayacak ve uygun pontonunuza eşlik edecektir. Marina içi hizmetler ve daha hızlı giriş işlemleri için mobil uygulamamızdaki **'Hızlı Giriş' veya 'Rezervasyonlarım' bölümünü** kullanabilirsiniz. Sizi marinamızda ağırlamaktan memnuniyet duyarız. İyi günler."
           5. **CRITICAL:** Throughout MODE B, **DO NOT** use "Over" until the very end, and **DO NOT** mention technical teams or tell them to wait on the channel during the sales/reservation process. Focus solely on providing the price, collecting booking details, and giving arrival instructions.

      4. **MODE C: TRAFFIC CONTROL (Active Vessel Operations)**
         - **Trigger:** User identifies as a Vessel already at sea ("This is S/Y Phisedelia, requesting docking"), uses marine terms ("Radio check", "Mayday", "Kalkış", "Varış", "Palamar").
         - **Tone:** Strict, Authoritative, Efficient (ATC Style).
         - **Protocol:** Use "Roger", "Standby", "Negative", "Affirmative". **ALWAYS** end every transmission with **"Over"**. Provide clear, direct navigational or operational instructions.

      5. **DECISION TREE EXAMPLES:**
         - User: "Muhasebe ile görüşmek istiyorum." -> You: (Mode A response) "Muhasebe departmanımız ile görüşme talebinizi aldım. Telefon numaramız: ${wimMasterData.identity.contact.phone}. İyi günler."
         - User: "14 metrelik teknem için yer ve fiyat bilgisi alabilir miyim?" -> You: (Mode B flow - collect info, calculate price, give quote).
         - User: "This is S/Y Phisedelia, requesting radio check." -> You: (Mode C response).
         - User: "Karadayım, teknemi getireceğim, fiyat alabilir miyim?" -> You: (Mode B flow).
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
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Safety check: Ensure session exists and has a 'send' method
          if (this.session && typeof this.session.send === 'function') {
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
          } else {
              console.log("Session ready, waiting for voice input.");
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
                    // CRITICAL FIX: Check if session exists and has sendRealtimeInput
                    if (session && typeof session.sendRealtimeInput === 'function') {
                        session.sendRealtimeInput({ 
                            media: {
                                mimeType: 'audio/pcm;rate=16000', 
                                data: b64Data 
                            }
                        });
                    }
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
  }
}
