
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { ArrowUp, Paperclip, Mic, AudioWaveform, ScanLine, Radio } from 'lucide-react'; 
import { ModelType, UserRole } from '../types';
import { QuickActions } from './QuickActions';

interface InputAreaProps {
  onSend: (text: string, attachments: File[]) => void;
  isLoading: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  userRole?: UserRole;
  onQuickAction?: (text: string) => void;
  onScanClick?: () => void;
  onRadioClick?: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  selectedModel, 
  onModelChange,
  userRole,
  onQuickAction,
  onScanClick,
  onRadioClick
}) => {
  const [text, setText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setText(prev => prev + (prev ? ' ' : '') + transcript);
            setIsDictating(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Dictation error", event.error);
            setIsDictating(false);
        };

        recognition.onend = () => {
            setIsDictating(false);
        };

        recognitionRef.current = recognition;
    }
  }, []);

  const toggleDictation = () => {
      if (!recognitionRef.current) {
          alert("Voice dictation not supported in this browser.");
          return;
      }

      if (isDictating) {
          recognitionRef.current.stop();
      } else {
          recognitionRef.current.start();
          setIsDictating(true);
      }
  };

  const handleSend = () => {
    if ((!text.trim()) || isLoading) return;
    onSend(text, []);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 lg:pb-0">
      
      <div className="flex items-center justify-between mb-2 sm:mb-3 ml-2 sm:ml-4">
          {/* Model Selectors */}
          <div className="flex gap-4 text-[9px] font-bold uppercase tracking-[0.2em]">
              <button 
                onClick={() => onModelChange(ModelType.Flash)}
                className={`transition-colors ${selectedModel === ModelType.Flash ? "text-teal-400" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                  FLASH
              </button>
              <button 
                onClick={() => onModelChange(ModelType.Pro)}
                className={`transition-colors ${selectedModel === ModelType.Pro ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                  PRO
              </button>
              <button 
                onClick={() => onModelChange(ModelType.Image)}
                className={`transition-colors ${selectedModel === ModelType.Image ? "text-zinc-300" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                  IMAGE
              </button>
          </div>
      </div>

      {/* Quick Actions Overlay */}
      {userRole && onQuickAction && (
          <div className="mb-2 sm:mb-3">
              <QuickActions userRole={userRole} onAction={onQuickAction} />
          </div>
      )}

      {/* Capsule Input */}
      <div className="relative bg-[#0a121e] rounded-full border border-white/10 flex items-center px-2 py-2 shadow-2xl shadow-black/50 ring-1 ring-white/5 focus-within:ring-teal-500/30 transition-all">
          
          {/* Left Tools (Scan, Radio, Attach) */}
          <div className="flex items-center gap-1 pl-1 border-r border-white/5 pr-2 mr-2 flex-shrink-0">
              <button 
                onClick={onScanClick}
                className="p-2 text-zinc-500 hover:text-teal-400 transition-colors rounded-full hover:bg-white/5 flex items-center justify-center"
                title="Scan ID/Card"
              >
                  <ScanLine size={18} />
              </button>
              <button 
                onClick={onRadioClick}
                className="p-2 text-red-600 hover:text-red-500 transition-colors rounded-full hover:bg-white/5 flex items-center justify-center"
                title="VHF Radio"
              >
                  <Radio size={18} />
              </button>
              <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-full hover:bg-white/5 flex items-center justify-center hidden sm:flex">
                  <Paperclip size={18} />
              </button>
          </div>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDictating ? "Listening..." : "Command..."}
            className={`flex-1 bg-transparent border-none focus:outline-none text-sm text-zinc-300 placeholder:text-zinc-600 resize-none py-3 font-mono min-w-0 ${isDictating ? 'animate-pulse text-teal-400' : ''}`}
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 pl-2 border-l border-white/5 flex-shrink-0">
              <button 
                onClick={toggleDictation}
                className={`p-2 transition-colors rounded-full flex items-center justify-center ${isDictating ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-red-900/50 hover:text-red-500'}`}
                title="Voice Dictation"
              >
                  <AudioWaveform size={18}/>
              </button>
              
              <button 
                onClick={handleSend}
                className="w-10 h-10 bg-[#151f2e] hover:bg-[#1c2a3d] border border-white/5 text-zinc-400 hover:text-teal-400 rounded-full flex items-center justify-center transition-all shadow-inner"
              >
                  <ArrowUp size={18} />
              </button>
          </div>
      </div>

      {/* Warning Footer - Hidden on Mobile to save space */}
      <div className="hidden sm:flex justify-center items-center gap-2 mt-4 text-[8px] font-bold text-zinc-700 uppercase tracking-[0.2em]">
          <div className="w-1 h-1 bg-red-900 rounded-full animate-pulse"></div>
          THIS CONVERSATION IS BEING RECORDED
      </div>

    </div>
  );
};
