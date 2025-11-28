
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { ArrowUp, Paperclip, AudioWaveform, ScanLine, Radio, Sparkles, Zap, Image as ImageIcon } from 'lucide-react'; 
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
        recognition.lang = 'tr-TR'; 
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

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
    // Reset height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 lg:pb-0">
      
      {/* UX Improvement: Segmented Model Selector */}
      <div className="flex items-center justify-between mb-3 ml-2 sm:ml-1">
          <div className="flex bg-[#0a121e] p-1 rounded-full border border-white/5 shadow-inner">
              <button 
                onClick={() => onModelChange(ModelType.Flash)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${selectedModel === ModelType.Flash ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(45,212,191,0.1)]" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"}`}
              >
                  <Zap size={10} /> FLASH
              </button>
              <button 
                onClick={() => onModelChange(ModelType.Pro)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${selectedModel === ModelType.Pro ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"}`}
              >
                  <Sparkles size={10} /> PRO
              </button>
              <button 
                onClick={() => onModelChange(ModelType.Image)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${selectedModel === ModelType.Image ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"}`}
              >
                  <ImageIcon size={10} /> IMAGE
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
      <div className={`relative bg-[#0a121e] rounded-3xl border flex items-end px-2 py-2 shadow-2xl shadow-black/50 ring-1 ring-white/5 transition-all duration-300 ${isLoading ? 'border-teal-500/30 ring-teal-500/10' : 'border-white/10 focus-within:ring-teal-500/30'}`}>
          
          {/* Left Tools (Scan, Radio, Attach) */}
          <div className="flex items-center gap-1 pl-1 border-r border-white/5 pr-2 mr-2 mb-1.5 flex-shrink-0">
              <button 
                onClick={onScanClick}
                className="p-2 text-zinc-500 hover:text-teal-400 transition-colors rounded-full hover:bg-white/5 flex items-center justify-center group relative"
                title="Scan ID / Passport"
              >
                  <ScanLine size={18} />
              </button>
              <button 
                onClick={onRadioClick}
                className="p-2 text-red-600 hover:text-red-500 transition-colors rounded-full hover:bg-white/5 flex items-center justify-center relative"
                title="Open VHF Radio"
              >
                  <Radio size={18} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0a121e]"></span>
              </button>
              <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-full hover:bg-white/5 flex items-center justify-center hidden sm:flex" title="Attach File">
                  <Paperclip size={18} />
              </button>
          </div>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDictating ? "Dinliyorum..." : isLoading ? "İşleniyor..." : "Komut..."}
            className={`flex-1 bg-transparent border-none focus:outline-none text-sm text-zinc-300 placeholder:text-zinc-600 resize-none py-3 font-mono min-w-0 max-h-[120px] overflow-y-auto custom-scrollbar ${isDictating ? 'animate-pulse text-teal-400' : ''}`}
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 pl-2 border-l border-white/5 flex-shrink-0 mb-1">
              <button 
                onClick={toggleDictation}
                className={`p-2 transition-colors rounded-full flex items-center justify-center ${isDictating ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-red-900/50 hover:text-red-500'}`}
                title="Sesli Yazma (TR)"
              >
                  <AudioWaveform size={18}/>
              </button>
              
              <button 
                onClick={handleSend}
                disabled={isLoading || !text.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-inner border border-white/5
                    ${isLoading 
                        ? 'bg-teal-500/20 text-teal-500 cursor-not-allowed animate-pulse' 
                        : text.trim() 
                            ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
                            : 'bg-[#151f2e] text-zinc-600 hover:text-zinc-400'
                    }`}
              >
                  {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                      <ArrowUp size={18} />
                  )}
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
