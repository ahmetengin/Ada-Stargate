

import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { BASE_SYSTEM_INSTRUCTION } from "./prompts";

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
  private nextStartTime = 0;
  private apiKey: string | undefined;

  constructor() {
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
    this.apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || viteKey) as string | undefined;
  }

  async connect() {
    try {
      this.onStatusChange?.('connecting');

      if (!this.apiKey) {
        this.onStatusChange?.('error');
        throw new Error('GEMINI_API_KEY missing');
      }

      this.client = new GoogleGenAI({ apiKey: this.apiKey });
      
      // 1. Initialize Audio Context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
         sampleRate: 16000, // Gemini Live prefers 16kHz input
      });

      // 2. Connect to Gemini Live with Callbacks
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
           responseModalities: [Modality.AUDIO],
           systemInstruction: BASE_SYSTEM_INSTRUCTION + "\nMODE: VHF RADIO. Speak short, tactical, protocol-compliant responses. End transmissions with 'Over'.",
           speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
           }
        },
        callbacks: {
            onopen: async () => {
                this.onStatusChange?.('connected');
                // Start sending audio only after connection is open
                await this.startRecording(sessionPromise);
            },
            onmessage: async (msg: LiveServerMessage) => {
                await this.handleMessage(msg);
            },
            onerror: (e: any) => {
                console.error("Live API Error:", e);
                const errStr = JSON.stringify(e);
                if (errStr.includes('unavailable') || errStr.includes('503')) {
                   alert("Ada VHF Radio is temporarily unavailable (Model overloaded). Please try again in a moment.");
                }
                this.onStatusChange?.('error');
            },
            onclose: () => {
                this.onStatusChange?.('disconnected');
            }
        }
      });

      this.session = await sessionPromise;

    } catch (e) {
      console.error("Connection failed:", e);
      this.onStatusChange?.('error');
    }
  }

  private async handleMessage(msg: LiveServerMessage) {
      // Handle Audio Output
      const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        // Visualize audio level
        this.onAudioLevel?.(Math.random() * 0.5 + 0.3); 
        
        const buffer = await this.decodeAudioData(audioData);
        
        const source = this.audioContext!.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext!.destination);
        
        const now = this.audioContext!.currentTime;
        // Schedule audio to play seamlessly
        const start = Math.max(now, this.nextStartTime);
        source.start(start);
        this.nextStartTime = start + buffer.duration;
      }

      // Handle Turn Complete (Reset visualization)
      if (msg.serverContent?.turnComplete) {
        this.onAudioLevel?.(0); 
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

     // Create buffer at model output rate (usually 24kHz)
     const buffer = this.audioContext!.createBuffer(1, float32.length, 24000);
     buffer.getChannelData(0).set(float32);
     return buffer;
  }

  private async startRecording(sessionPromise: Promise<any>) {
     if (!this.audioContext) return;

     try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.inputSource = this.audioContext.createMediaStreamSource(stream);
        
        // Use ScriptProcessor for audio capturing (Worklets preferred for prod, but this works for single-file demo)
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        
        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Calculate volume for visualization
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            this.onAudioLevel?.(rms * 5); 

            // Convert Float32 to PCM 16-bit Base64
            const b64Data = this.float32ToBase64(inputData);
            
            // Send to Model
            sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                    media: {
                        mimeType: 'audio/pcm;rate=16000', 
                        data: b64Data 
                    }
                });
            }).catch(e => console.error("Send error", e));
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
        // Clamp and scale
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