import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, X, Mic, StopCircle, Search, Brain, Paperclip, FileText, Radio } from 'lucide-react';
import { ModelType } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: File[]) => void;
  isLoading: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  useSearch: boolean;
  onToggleSearch: () => void;
  useThinking: boolean;
  onToggleThinking: () => void;
  onStartVoice: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  selectedModel, 
  onModelChange,
  useSearch,
  onToggleSearch,
  useThinking,
  onToggleThinking,
  onStartVoice
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Can be configurable

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }
      if (finalTranscript) {
        setText(prev => prev + finalTranscript);
        adjustHeight();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onModelChange(ModelType.Flash)}
            className={`text-xs px-3 py-1 rounded-full transition-colors border ${
              selectedModel === ModelType.Flash 
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            Ada Flash
          </button>
          <button 
            onClick={() => onModelChange(ModelType.Pro)}
            className={`text-xs px-3 py-1 rounded-full transition-colors border ${
              selectedModel === ModelType.Pro 
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/50' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            Ada Pro
          </button>
           <button 
            onClick={() => onModelChange(ModelType.Image)}
            className={`text-xs px-3 py-1 rounded-full transition-colors border ${
              selectedModel === ModelType.Image 
                ? 'bg-pink-600/20 text-pink-300 border-pink-500/50' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            Generate Image
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
             onClick={onToggleThinking}
             title="Deep Thinking (Gemini 2.5)"
             className={`p-1.5 rounded-md transition-colors ${
               useThinking ? 'text-sky-400 bg-sky-400/10' : 'text-zinc-500 hover:text-zinc-300'
             }`}
          >
             <Brain size={16} />
          </button>
          <button
             onClick={onToggleSearch}
             title="Google Search Grounding"
             className={`p-1.5 rounded-md transition-colors ${
               useSearch ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-500 hover:text-zinc-300'
             }`}
          >
             <Search size={16} />
          </button>
        </div>
      </div>

      <div className={`relative bg-zinc-800/50 backdrop-blur-md border ${isRecording ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-zinc-700'} rounded-2xl shadow-2xl p-2 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all`}>
        
        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex gap-2 px-2 py-2 overflow-x-auto custom-scrollbar border-b border-zinc-700/50 mb-2">
            {files.map((file, idx) => (
              <div key={idx} className="relative group flex-shrink-0">
                <div className="w-16 h-16 rounded-lg bg-zinc-700 flex items-center justify-center overflow-hidden border border-zinc-600">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full p-1">
                       <div className="text-zinc-400 mb-1"><FileText size={20} /></div>
                       <span className="text-[8px] text-zinc-400 text-center leading-tight break-all w-full overflow-hidden line-clamp-2">
                         {file.name}
                       </span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1 -right-1 bg-zinc-900 text-zinc-400 rounded-full p-0.5 hover:text-red-400 border border-zinc-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-zinc-400 hover:text-zinc-200 transition-colors rounded-xl hover:bg-zinc-700/50"
            title="Attach image, code, or data file"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*, .csv, .json, .txt, .md, .js, .ts, .tsx, .jsx, .py, .html, .css, .xml, .yml, .yaml" 
            multiple 
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : (selectedModel === ModelType.Image ? "Describe the image you want to create..." : "Ask Ada, attach files, or use Radio...")}
            className={`flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none py-3 max-h-[200px] focus:outline-none custom-scrollbar ${isRecording ? 'animate-pulse text-zinc-300' : ''}`}
            rows={1}
          />

          {/* Dictation Button */}
          <button 
            onClick={toggleRecording}
            className={`p-3 transition-colors rounded-xl ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'}`}
            title={isRecording ? "Stop Recording" : "Dictation (STT)"}
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>

          {/* VHF Radio Button */}
          <button 
            onClick={onStartVoice}
            className="p-3 text-red-400 hover:text-red-300 transition-colors rounded-xl hover:bg-red-900/20"
            title="VHF Radio (Gemini Live S2S)"
          >
             <Radio size={20} />
          </button>

          <button 
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && files.length === 0)}
            className={`p-3 rounded-xl transition-all flex items-center justify-center ${
              isLoading || (!text.trim() && files.length === 0)
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
      
      <div className="text-center mt-2">
         <p className="text-[10px] text-zinc-600">
           Ada can make mistakes. Check important info.
         </p>
      </div>
    </div>
  );
};