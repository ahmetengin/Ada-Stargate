
import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { ArrowUp, Paperclip, Mic, Brain, Search } from 'lucide-react'; 
import { ModelType } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: File[]) => void;
  isLoading: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onInitiateVhfCall: () => void; 
  onInitiateScanner: () => void;
  onToggleRedAlert: () => void;
  isRedAlert: boolean;
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
  useThinking,
  onToggleThinking,
  prefillText,
  onPrefillConsumed,
  onInitiateVhfCall
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      if (prefillText) {
          setText(prefillText);
          onPrefillConsumed?.();
      }
  }, [prefillText]);

  const handleSend = () => {
    if (!text.trim()) return;
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
    <div className="w-full font-sans">
      
      {/* Model Selectors */}
      <div className="flex items-center gap-4 px-2 mb-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
          <button onClick={() => onModelChange(ModelType.Flash)} className={`hover:text-zinc-300 ${selectedModel === ModelType.Flash ? 'text-zinc-400' : ''}`}>Flash</button>
          <button onClick={() => onModelChange(ModelType.Pro)} className={`hover:text-red-500 ${selectedModel === ModelType.Pro ? 'text-red-500 bg-red-500/10 px-1 rounded' : ''}`}>PRO</button>
          <button onClick={() => onModelChange(ModelType.Image)} className={`hover:text-zinc-300 ${selectedModel === ModelType.Image ? 'text-zinc-400' : ''}`}>Image</button>
      </div>

      {/* Input Capsule */}
      <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-full px-2 py-1.5 shadow-2xl transition-colors focus-within:border-zinc-700">
        
        <button className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors">
            <Paperclip size={16} />
        </button>

        <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instructions..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-zinc-300 placeholder:text-zinc-700 px-2 font-mono resize-none py-2"
            disabled={isLoading}
        />

        <div className="flex items-center gap-1 pr-1">
             <button 
               onClick={onInitiateVhfCall}
               className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
             >
               <Mic size={16} />
             </button>

             <button 
               onClick={onToggleThinking}
               className={`p-2 transition-colors ${useThinking ? 'text-indigo-400 bg-indigo-500/10 rounded-full' : 'text-zinc-600 hover:text-red-500'}`}
             >
               <Brain size={16} />
             </button>

            <button
                onClick={handleSend}
                disabled={!text.trim() || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${text.trim() ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-800/50 text-zinc-600'}`}
            >
                <ArrowUp size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};
