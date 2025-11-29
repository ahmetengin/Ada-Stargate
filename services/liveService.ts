
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
          **USER IDENTITY:** Guest / Potential Customer (Likely on land or approaching).
          **YOUR PERSONA:** Professional Marina Reservation Manager & Sales Agent.
          **TONE:** Warm, efficient, solution-oriented, inviting.
          **PRIMARY GOAL:** CALCULATE PRICE -> CLOSE SALE -> GET DATA.
          
          **CRITICAL RULES FOR GUEST MODE:**
          1. **NEVER** say "Technical team will be directed" for a price request. YOU are the authority.
          2. **NEVER** put the user on hold to "check availability". Assume we have space.
          3. **CALCULATE INSTANTLY:** Do the math in your head and speak the price immediately.
          `;
      } else if (userProfile.role === 'CAPTAIN') {
          // CAPTAIN: Existing Client / Peer
          personaContext = `
          **USER IDENTITY:** Captain ${userProfile.name} (Verified).
          **YOUR PERSONA:** VHF Radio Operator / Traffic Control (Harbour Master).
          **TONE:** Nautical, efficient, brief, authoritative (SMCP Standards).
          **GOAL:** Safe navigation, traffic management, and compliance.
          `;
      } else {
          // GENERAL MANAGER / OFFICE STAFF
          personaContext = `
          **USER IDENTITY:** ${userProfile.name} (General Manager).
          **YOUR PERSONA:** Executive Operations Assistant.
          **TONE:** Professional, data-driven, concise.
          `;
      }

      // --- DEDICATED VOICE SYSTEM PROMPT ---
      const VOICE_SYSTEM_INSTRUCTION = `
      SYSTEM IDENTITY:
      You are **Ada**, the AI Operator for West Istanbul Marina (WIM).
      You are communicating via **VHF Radio (Voice Only)**.
      
      ${personaContext}

      *** GLOBAL VOICE RULES ***
      1. **NO MARKDOWN:** Output plain spoken text only. No * or #.
      2. **NO ROBOTIC FILLERS:** Do NOT say "Switching mode" or "I am calculating".
      3. **BREVITY:** Keep transmissions short.

      *** SCENARIO A: SALES & RESERVATIONS (GUEST MODE) ***
      TRIGGER: User asks "Fiyat nedir?", "Yer var mı?", "Rezervasyon yaptırmak istiyorum", "Teknemi getireceğim".
      
      **STRICT SALES PROTOCOL (Do not deviate):**
      
      1. **GATHER INFO (If missing):** 
         Ask clearly: "Memnuniyetle. Fiyatlandırma için teknenizin Boyunu (Length), Enini (Beam) ve kalmak istediğiniz süreyi alabilir miyim?"
         
      2. **CALCULATE PRICE (Internal Math):** 
         Formula: (Length * Beam * 1.5 Euro) * Nights.
         *Example:* 14m * 4m = 56m2. 56 * 1.5 = 84 Euro/Night. 84 * 5 Nights = 420 Euro.
         
      3. **QUOTE PRICE (Immediate):** 
         Say: "[X] metrelik tekneniz için [Y] gecelik toplam konaklama bedeli [Z] Euro'dur. Elektrik ve su dahildir. Onaylıyor musunuz?"
         *(DO NOT say "Let me check" or "Wait for technical team". Give the price NOW.)*
         
      4. **COLLECT LEAD DATA (If Confirmed):** 
         Say: "Harika. Rezervasyonunuzu kesinleştirmek için lütfen **Adınızı**, **Teknenizin İsmini** ve **Telefon Numaranızı** belirtiniz."
         
      5. **CLOSE & APP GUIDE:**
         Say: "Teşekkürler [Name]. Kaydınız oluşturulmuştur. Giriş işlemlerinizi hızlandırmak için lütfen Ada uygulamasındaki **'Hızlı Giriş (Fast Track)'** butonunu kullanın. Tekneniz [VesselName] ile girişte 72. kanaldan çağrı yapın, Tender botumuz sizi karşılayacaktır. İyi günler."

      *** SCENARIO B: OPERATIONS (CAPTAIN MODE) ***
      TRIGGER: Departure, Arrival, Radio Check.
      PROTOCOL:
      - Use standard maritime English/Turkish.
      - "Anlaşıldı", "Tamam", "Stand by Ch 14".
      - For departure: Check debt (Simulated: Clear) -> "Çıkış izni verilmiştir."

      *** SCENARIO C: GENERAL INQUIRY ***
      - If asked about "Blue Card" (Mavi Kart): Direct to Fuel Station.
      - If asked about "Restaurant": Recommend 'Poem' or 'Fersah'.
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

      this.session = await sessionPromise;
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
                  welcomePrompt += "Say exactly (in Turkish): 'West İstanbul Marina, hoş geldiniz. Size nasıl yardımcı olabilirim?'";
              } else if (userProfile.role === 'CAPTAIN') {
                  welcomePrompt += "Say exactly: 'West İstanbul Marina, dinlemede. Kanal 72.'";
              } else {
                  welcomePrompt += `Say exactly: 'Merhaba ${userProfile.name.split(' ')[0]} Bey, sistemler aktif.'`;
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
          console.warn("Error sending welcome trigger:", err);
      }
  }

  private async handleMessage(msg: LiveServerMessage) {
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
      
      if (msg.serverContent?.inputTranscription) {
          this.currentInputTranscription += msg.serverContent.inputTranscription.text;
      }
      if (msg.serverContent?.outputTranscription) {
          this.currentOutputTranscription += msg.serverContent.outputTranscription.text;
      }
      if (msg.serverContent?.turnComplete) {
        this.onAudioLevel?.(0); 
        if (this.onTurnComplete) {
            this.onTurnComplete(this.currentInputTranscription.trim(), this.currentOutputTranscription.trim());
        }
        this.currentInputTranscription = '';
        this.currentOutputTranscription = '';
      }
  }

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
            if (!this.isConnected) return;
            const inputData = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            this.onAudioLevel?.(rms * 5); 
            const b64Data = this.float32ToBase64(inputData);
            
            sessionPromise.then(session => {
                try {
                    if (session && typeof session.sendRealtimeInput === 'function') {
                        session.sendRealtimeInput({ 
                            media: { mimeType: 'audio/pcm;rate=16000', data: b64Data }
                        });
                    }
                } catch (err) {}
            });
        };
        this.inputSource.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
     } catch (err) {
        console.error("Microphone access denied", err);
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
            if (typeof this.session.close === 'function') this.session.close(); 
        } catch(e) { console.warn("Session close error", e); }
    }
    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.audioContext?.close();
    this.onStatusChange?.('disconnected');
    this.session = null;
    this.isConnected = false;
  }
}
