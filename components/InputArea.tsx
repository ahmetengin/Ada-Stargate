
import React, { useState, useRef, KeyboardEvent } from 'react';
import { ArrowUp, Paperclip, Mic, AudioWaveform } from 'lucide-react'; 
import { ModelType, UserRole } from '../types';
import { QuickActions } from './QuickActions';

interface InputAreaProps {
  onSend: (text: string, attachments: File[]) => void;
  isLoading: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  userRole?: UserRole;
  onQuickAction?: (text: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  selectedModel, 
  onModelChange,
  userRole,
  onQuickAction
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="w-full max-w-3xl mx-auto">
      
      <div className="flex items-center justify-between mb-3 ml-4">
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
          <div className="mb-3">
              <QuickActions userRole={userRole} onAction={onQuickAction} />
          </div>
      )}

      {/* Capsule Input */}
      <div className="relative bg-[#0a121e] rounded-full border border-white/10 flex items-center px-2 py-2 shadow-2xl shadow-black/50 ring-1 ring-white/5 focus-within:ring-teal-500/30 transition-all">
          <button className="p-3 text-zinc-600 hover:text-zinc-400 transition-colors">
              <Paperclip size={16} />
          </button>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instructions..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-zinc-300 placeholder:text-zinc-700 resize-none py-3 px-2 font-mono"
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 pr-1">
              <button className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors"><Mic size={16}/></button>
              <button className="p-2 text-red-900/50 hover:text-red-500 transition-colors"><AudioWaveform size={16}/></button>
              
              <button 
                onClick={handleSend}
                className="w-10 h-10 bg-[#151f2e] hover:bg-[#1c2a3d] border border-white/5 text-zinc-400 hover:text-teal-400 rounded-full flex items-center justify-center transition-all shadow-inner"
              >
                  <ArrowUp size={16} />
              </button>
          </div>
      </div>

      {/* Warning Footer */}
      <div className="flex justify-center items-center gap-2 mt-4 text-[8px] font-bold text-zinc-700 uppercase tracking-[0.2em]">
          <div className="w-1 h-1 bg-red-900 rounded-full animate-pulse"></div>
          THIS CONVERSATION IS BEING RECORDED / RECORDED LINE
      </div>

    </div>
  );
};
