
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { UserProfile } from "../types";
import { wimMasterData } from "../services/wimMasterData";

/**
 * Live Session Handler for VHF Radio
 * Cost-Optimized for $100/month Budget
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
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
         sampleRate: 16000,
      });

      // --- DYNAMIC PERSONA DEFINITION ---
      let roleInstruction = "";
      
      if (userProfile.role === 'GUEST') {
          roleInstruction = `
          ROLE: Receptionist & Sales Agent (West Istanbul Marina).
          TARGET: Potential Customer (Guest).
          
          PRIMARY GOAL: Secure a reservation and get the customer's data.
          
          CRITICAL RULES FOR GUEST:
          1. **IMMEDIATE PRICING:** If asked for a price, CALCULATE IT IMMEDIATELY using: (Length x Beam x 1.5 EUR x Nights). DO NOT ask to wait. DO NOT call a technical team.
          2. **DATA COLLECTION:** After price is approved, you MUST ask for: Name, Vessel Name, and Phone Number.
          3. **CLOSING:** Once data is received, say: "Reservation confirmed. Please use the 'Hızlı Giriş' (Fast Track) button in the Ada App to complete your check-in."
          4. **TONE:** Welcoming, helpful, sales-oriented.
          `;
      } else if (userProfile.role === 'CAPTAIN') {
          roleInstruction = `
          ROLE: VHF Radio Operator / Harbour Master.
          TARGET: Vessel Captain.
          
          PRIMARY GOAL: Safe navigation and traffic control.
          
          CRITICAL RULES FOR CAPTAIN:
          1. **BREVITY:** Use short, nautical phrases (IMO SMCP).
          2. **PROTOCOL:** End transmissions with "Over".
          3. **OPERATIONS:** Handle Departure Requests (Check Debt), Arrival Instructions (Assign Pontoon), and Emergency calls.
          `;
      } else {
          roleInstruction = `
          ROLE: Executive Assistant.
          TARGET: General Manager.
          TONE: Professional, concise, reporting-style.
          `;
      }

      const VOICE_SYSTEM_INSTRUCTION = `
      You are **Ada**, the AI Voice Interface for West Istanbul Marina (WIM).
      
      ${roleInstruction}

      GENERAL KNOWLEDGE:
      - Location: Beylikdüzü, Istanbul.
      - VHF Channel: 72 (Marina), 16 (Emergency).
      - Facilities: 700T Travel Lift, Fuel Dock, Restaurants (Poem, Fersah).
      - Mavi Kart (Blue Card): Pump-out station available at Fuel Dock.

      NEGATIVE CONSTRAINTS:
      - DO NOT use markdown formatting in speech.
      - DO NOT narrate your actions (e.g. "Checking database..."). Just speak.
      - DO NOT hallucinate external technical teams for basic pricing. You have the authority to quote.
      `;

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
              if (userProfile.role === 'GUEST') welcomePrompt += "Greeting: 'West İstanbul Marina, hoş geldiniz.' (Wait for user request).";
              else if (userProfile.role === 'CAPTAIN') welcomePrompt += "Greeting: 'West İstanbul Marina, dinlemede. Kanal 72.'";
              else welcomePrompt += `Greeting: 'Sistemler aktif ${userProfile.name.split(' ')[0]} Bey.'`;

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
