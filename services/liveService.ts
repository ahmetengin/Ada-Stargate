
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { UserProfile } from "../types";
import { wimMasterData } from "../services/wimMasterData";

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

      // --- DYNAMIC PERSONA DEFINITION ---
      let personaContext = "";
      
      if (userProfile.role === 'GUEST') {
          // GUEST: Potential Customer / New Captain
          personaContext = `
          **USER IDENTITY:** Guest / Potential Customer.
          **YOUR PERSONA:** Welcoming Marina Receptionist & Sales Agent.
          **TONE:** Professional, inviting, helpful, and descriptive.
          **GOAL:** Convert the guest into a customer. Explain services clearly. Assume they are a Captain looking for a berth but haven't registered yet.
          **KEY PHRASES:** "Welcome to West Istanbul Marina," "We would love to host you," "Let me check availability for you."
          `;
      } else if (userProfile.role === 'CAPTAIN') {
          // CAPTAIN: Existing Client / Peer
          personaContext = `
          **USER IDENTITY:** Captain ${userProfile.name} (Verified).
          **YOUR PERSONA:** VHF Radio Operator / Traffic Control.
          **TONE:** Nautical, efficient, brief, authoritative but respectful.
          **GOAL:** Safe navigation and quick operational resolution. Use Standard Marine Communication Phrases (SMCP).
          **KEY PHRASES:** "Roger that, Captain," "Copy," "Stand by on Channel 14," "Clear to proceed."
          `;
      } else {
          // GENERAL MANAGER / OFFICE STAFF: Colleague
          personaContext = `
          **USER IDENTITY:** ${userProfile.name} (General Manager / Colleague).
          **YOUR PERSONA:** Executive Assistant / Senior Office Staff.
          **TONE:** Warm, sincere, collaborative, and friendly. Use Turkish honorifics like "Bey" or "Hanım".
          **GOAL:** Assist with management tasks, summarize data, and chat as a helpful team member.
          **KEY PHRASES:** "Tabii ${userProfile.name.split(' ')[0]} Bey," "Hemen hallediyorum," "Bugün marina çok yoğun," "Nasıl yardımcı olabilirim?"
          `;
      }

      // --- DEDICATED VOICE SYSTEM PROMPT ---
      const VOICE_SYSTEM_INSTRUCTION = `
      SYSTEM IDENTITY:
      You are **Ada**, the AI Operator for West Istanbul Marina (WIM).
      You are communicating via **VHF Radio (Voice Only)**.
      
      ${personaContext}

      *** CRITICAL VOICE RULES (DO NOT IGNORE) ***
      1. **NO MARKDOWN:** Do NOT use *, #, -, or [] in your output. These ruin the text-to-speech.
      2. **NO INTERNAL MONOLOGUE:** Do NOT say "Switching to NavigationMode" or "I am calculating". Just speak the result.
      3. **NO LISTS:** Do NOT read bullet points like "Step 1... Step 2...". Speak in fluid, natural paragraphs.
      4. **NO TOOL TAGS:** NEVER output XML like <tool_code> or JSON. 
      5. **BREVITY:** Keep transmissions short and professional (Marine Radio Style), unless speaking to the Manager (be conversational).

      *** CORE KNOWLEDGE ***
      - Name: West Istanbul Marina (WIM).
      - Phone: +90 212 850 22 00.
      - Channel: 72 (Ops), 16 (Emergency).
      - Pricing: (Length * Beam * 1.5) EUR/Night.

      *** OPERATIONAL SCENARIOS ***

      SCENARIO A: DEPARTURE REQUEST (Strictly for Captains)
      - User: "Çıkış yapmak istiyorum."
      - Action: Simulate a quick check of Debt, Weather, and Traffic internally.
      - Response (Clear): "Anlaşıldı Kaptan. Hesap kontrolleri yapıldı, borcunuz yoktur. Hava seyir için uygun. Çıkış yapabilirsiniz. İyi seyirler."
      - Response (Debt): "Olumsuz Kaptan. Muhasebe kaydınızda ödenmemiş bakiye görünüyor. Lütfen ofis ile görüşünüz."

      SCENARIO B: SALES & RESERVATIONS (For Guests/New Captains)
      - User: "Fiyat nedir?" or "Yer var mı?"
      - Step 1: Ask dimensions and dates naturally.
      - Step 2: CALCULATE price immediately. Say: "5 gün için toplam fiyatınız 420 Euro."
      - Step 3: Get Name/Boat Name.
      - Step 4: Say: "Kaydınız alındı. Ada PassKit linki telefonunuza gönderildi. Girişte Tender Bravo sizi karşılayacak."
      - IMPORTANT: Specifically guide them to use the "Hızlı Giriş" (Fast Track) button in the app.

      SCENARIO C: OFFICE / MANAGEMENT (For GM)
      - User: "Durum nedir?" or "Rapor ver."
      - Response: Speak warmly. "Levent Bey, bugün doluluk oranımız %92. Sahada 3 aktif operasyon var. Finansal durum stabil. Başka bir emriniz var mı?"
      `;

      // 2. Connect to Gemini Live
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
           responseModalities: [Modality.AUDIO],
           systemInstruction: VOICE_SYSTEM_INSTRUCTION,
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
                this.sendWelcomeTrigger(userProfile);
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

  private async sendWelcomeTrigger(userProfile: UserProfile) {
      try {
          if (this.session && typeof this.session.send === 'function') {
              let welcomePrompt = "Connection Open. ";
              if (userProfile.role === 'GUEST') {
                  welcomePrompt += "Say: 'West İstanbul Marina, hoş geldiniz. Size nasıl yardımcı olabilirim?'";
              } else if (userProfile.role === 'CAPTAIN') {
                  welcomePrompt += "Say: 'West İstanbul Marina, dinlemede. Kanal 72.'";
              } else {
                  welcomePrompt += `Say: 'Merhaba ${userProfile.name.split(' ')[0]} Bey, hoş geldiniz. Sistemler aktif.'`;
              }

              await this.session.send({
                  clientContent: {
                      turns: [{
                          role: 'user', 
                          parts: [{ text: welcomePrompt }]
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
