
import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { ArrowUp, Loader2, X, AudioLines, Paperclip, Mic, Search, Brain, Sparkles } from 'lucide-react';
import { ModelType } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: File[]) => void;
  isLoading: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onInitiateVhfCall: () => void;
  isMonitoring: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  selectedModel, 
  onModelChange,
  onInitiateVhfCall,
  isMonitoring
}) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

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

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Sorry, your browser doesn't support speech recognition.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setText(prev => prev + event.results[i][0].transcript + ' ');
          }
        }
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative pb-2">
      
      {/* Floating Controls Row */}
      <div className="flex items-center justify-between px-2 mb-3">
        {/* Left: Model Selectors */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800/50">
          {(['Flash', 'Pro', 'Image'] as const).map(modelName => {
            const modelValue = ModelType[modelName];
            const isActive = selectedModel === modelValue;
            return (
              <button
                key={modelValue}
                onClick={() => onModelChange(modelValue)}
                className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {modelName}
              </button>
            );
          })}
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-2">
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#18181b] border border-zinc-800/50 text-cyan-400 hover:bg-zinc-800 transition-colors">
                 <Brain size={14} />
             </button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#18181b] border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                 <Search size={14} />
             </button>
        </div>
      </div>

      {/* Main Input Capsule */}
      <div className="relative flex items-end bg-[#18181b] border border-zinc-800 rounded-[28px] p-1.5 pl-4 shadow-xl shadow-black/20 focus-within:border-zinc-700 transition-colors">
        
        {/* Left: Attach */}
        <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} className="hidden" />
        <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors mb-0.5"
            title="Attach File"
        >
            <Paperclip size={18} className="-rotate-45" />
        </button>

        {/* Center: Text Input */}
        <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Orchestrate..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[14px] text-zinc-200 placeholder:text-zinc-600 py-3 px-3 resize-none min-h-[44px] max-h-[120px] leading-relaxed font-light"
            disabled={isLoading}
        />

        {/* Right: Actions Group */}
        <div className="flex items-center gap-1 pr-1 mb-0.5">
             
             {/* Mic */}
             <button 
                onClick={toggleRecording} 
                className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-200'}`}
            >
                <Mic size={18} />
            </button>

            {/* VHF Signal */}
            <button 
                onClick={onInitiateVhfCall}
                className={`p-2 rounded-full transition-colors ${isMonitoring ? 'text-red-500/80 hover:text-red-500' : 'text-zinc-600'}`}
                title="VHF Radio Link"
            >
                <AudioLines size={18} />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-zinc-800 mx-1"></div>

            {/* Send Button */}
            <button
                onClick={handleSend}
                disabled={(!text.trim() && files.length === 0) || isLoading}
                className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all
                    ${(!text.trim() && files.length === 0) || isLoading 
                        ? 'bg-zinc-800 text-zinc-600' 
                        : 'bg-zinc-200 text-zinc-900 hover:bg-white hover:scale-105 shadow-lg shadow-zinc-900/50'
                    }
                `}
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
            </button>
        </div>

        {/* File Preview Overlay */}
        {files.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 px-4 flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#27272a] border border-zinc-700 rounded-lg pl-3 pr-2 py-1.5 shadow-lg">
                <span className="text-[11px] text-zinc-300 truncate max-w-[120px]">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-zinc-500 hover:text-zinc-300"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
