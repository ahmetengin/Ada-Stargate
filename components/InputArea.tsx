
import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { ArrowUp, Loader2, X, Paperclip, Search, Brain, Mic, Radio, ScanLine, Siren } from 'lucide-react'; 
import { ModelType } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: File[]) => void;
  isLoading: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onInitiateVhfCall: () => void; 
  onInitiateScanner: () => void;
  onToggleRedAlert: () => void; // New Prop
  isRedAlert: boolean; // New Prop
  isMonitoring: boolean;
  useSearch: boolean;
  onToggleSearch: () => void;
  useThinking: boolean;
  onToggleThinking: () => void;
  prefillText?: string;
  onPrefillConsumed?: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  selectedModel, 
  onModelChange,
  onInitiateVhfCall,
  onInitiateScanner,
  onToggleRedAlert,
  isRedAlert,
  isMonitoring,
  useSearch,
  onToggleSearch,
  useThinking,
  onToggleThinking,
  prefillText,
  onPrefillConsumed
}) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      if (prefillText) {
          setText(prefillText);
          if (onPrefillConsumed) {
              onPrefillConsumed();
          }
      }
  }, [prefillText, onPrefillConsumed]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!text.trim() && files.length === 0) || isLoading) return;
    onSend(text, files);
    setText('');
    setFiles([]);
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

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const getModelActiveColor = (modelName: string) => {
      switch (modelName) {
          case 'Flash': return 'text-blue-600 dark:text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
          case 'Pro': return 'text-red-600 dark:text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]';
          case 'Image': return 'text-purple-600 dark:text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
          default: return 'text-indigo-600 dark:text-indigo-500';
      }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative pb-4 font-sans">
      
      {/* --- COMMAND DECK HEADER --- */}
      <div className="flex items-center justify-between px-1 mb-2 font-mono">
        <div className="flex items-center gap-4 pl-2">
          {(['Flash', 'Pro', 'Image'] as const).map(modelName => {
            const modelValue = ModelType[modelName];
            const isActive = selectedModel === modelValue;
            return (
              <button
                key={modelValue}
                onClick={() => onModelChange(modelValue)}
                className={`text-[10px] uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? `font-black scale-105 ${getModelActiveColor(modelName)}`
                    : 'font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-600 dark:hover:text-zinc-400'
                }`}
              >
                {modelName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
             <div 
                onClick={onToggleThinking}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 cursor-pointer ${
                    useThinking 
                    ? 'text-cyan-600 dark:text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                    : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400'
                }`}
                title="Toggle Reasoning"
             >
                 <Brain size={16} />
             </div>
             <div 
                onClick={onToggleSearch}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 cursor-pointer ${
                    useSearch 
                    ? 'text-blue-600 dark:text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.2)]' 
                    : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-400'
                }`}
                title="Toggle Web Search"
             >
                 <Search size={16} />
             </div>
        </div>
      </div>

      {/* --- MAIN INPUT CAPSULE --- */}
      <div className={`relative flex items-end bg-white dark:bg-[#121214] border rounded-[26px] p-1.5 pl-4 shadow-xl transition-all duration-300 ${isRedAlert ? 'border-red-500 shadow-red-900/50' : 'border-zinc-200 dark:border-transparent shadow-zinc-200/50 dark:shadow-black/50'}`}>
        
        <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} className="hidden" />
        <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors mb-1.5 -ml-1"
            title="Attach File"
        >
            <Paperclip size={18} />
        </button>

        <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRedAlert ? "EMERGENCY BROADCAST..." : "Instructions..."}
            className={`flex-1 bg-transparent border-none focus:outline-none text-[13px] py-3.5 px-3 resize-none min-h-[48px] max-h-[160px] leading-relaxed tracking-tight font-sans ${isRedAlert ? 'text-red-500 placeholder:text-red-700' : 'text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-700'}`}
            disabled={isLoading}
        />

        {/* Right Controls Group */}
        <div className="flex items-center gap-1 mr-0.5">
             {/* EMERGENCY BUTTON */}
             <button 
               onClick={onToggleRedAlert}
               className={`p-2.5 rounded-full transition-colors ${isRedAlert ? 'bg-red-600 text-white animate-pulse' : 'text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400'}`}
               title="TOGGLE RED ALERT (GUARDIAN PROTOCOL)"
             >
               <Siren size={18} />
             </button>

             {/* Passport Scan Button */}
             <button 
               onClick={onInitiateScanner}
               className="p-2.5 rounded-full text-zinc-400 hover:text-emerald-500 dark:text-zinc-500 dark:hover:text-emerald-400 transition-colors"
               title="Scan ID/Passport"
             >
               <ScanLine size={18} />
             </button>

             {/* Voice Controls */}
             <button 
               onClick={onInitiateVhfCall}
               className={`p-2.5 rounded-full transition-all ${
                  isMonitoring
                  ? 'text-red-500 animate-pulse bg-red-500/10'
                  : 'text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400'
                }`}
               title="VHF Channel Link (CH 72)"
             >
                <Radio size={18} />
             </button>
             <button 
               className="p-2.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
               title="Dictate (Mic)"
             >
               <Mic size={18} />
             </button>

             <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800/50 mx-2"></div>

            <button
                onClick={handleSend}
                disabled={(!text.trim() && files.length === 0) || isLoading}
                className={`
                    w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200
                    ${(!text.trim() && files.length === 0) || isLoading 
                        ? 'bg-zinc-100 dark:bg-zinc-800/30 text-zinc-300 dark:text-zinc-700 cursor-not-allowed' 
                        : isRedAlert 
                            ? 'bg-red-600 hover:bg-red-500 text-white' 
                            : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white'
                    }
                `}
            >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2} />}
            </button>
        </div>

        {files.length > 0 && (
          <div className="absolute bottom-full left-4 mb-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-[#27272a] border border-zinc-200 dark:border-transparent rounded-lg pl-3 pr-2 py-2 shadow-xl">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[11px] text-zinc-800 dark:text-zinc-200 font-mono truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 ml-1 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
