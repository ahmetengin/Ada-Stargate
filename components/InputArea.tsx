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
    recognition.lang = 'en-US';

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
    <div className="w-full max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onModelChange(ModelType.Flash)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors border ${
              selectedModel === ModelType.Flash 
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            Flash
          </button>
          <button 
            onClick={() => onModelChange(ModelType.Pro)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors border ${
              selectedModel === ModelType.Pro 
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/50' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            Pro
          </button>
           <button 
            onClick={() => onModelChange(ModelType.Image)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors border ${
              selectedModel === ModelType.Image 
                ? 'bg-pink-600/20 text-pink-300 border-pink-500/50' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            Image
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
             onClick={onToggleThinking}
             title="Deep Thinking"
             className={`p-1.5 rounded-md transition-colors ${
               useThinking ? 'text-sky-400 bg-sky-400/10' : 'text-zinc-500 hover:text-zinc-300'
             }`}
          >
             <Brain size={14} />
          </button>
          <button
             onClick={onToggleSearch}
             title="Search"
             className={`p-1.5 rounded-md transition-colors ${
               useSearch ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-500 hover:text-zinc-300'
             }`}
          >
             <Search size={14} />
          </button>
        </div>
      </div>

      <div className={`relative bg-zinc-900 border ${isRecording ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-zinc-800'} rounded-xl shadow-2xl p-1.5 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all`}>
        
        {files.length > 0 && (
          <div className="flex gap-2 px-2 py-2 overflow-x-auto custom-scrollbar border-b border-zinc-800 mb-2">
            {files.map((file, idx) => (
              <div key={idx} className="relative group flex-shrink-0">
                <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={16} className="text-zinc-400" />
                  )}
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1 -right-1 bg-zinc-900 text-zinc-400 rounded-full p-0.5 hover:text-red-400 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
            title="Attach"
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*, .csv, .json, .txt, .md, .js, .ts, .tsx, .jsx, .py, .html, .css" 
            multiple 
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "Instructions..."}
            className={`flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none py-2 text-sm max-h-[150px] focus:outline-none custom-scrollbar ${isRecording ? 'animate-pulse text-zinc-300' : ''}`}
            rows={1}
          />

          <button 
            onClick={toggleRecording}
            className={`p-2 transition-colors rounded-lg ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>

          <button 
            onClick={onStartVoice}
            className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-900/20"
          >
             <Radio size={18} />
          </button>

          <button 
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && files.length === 0)}
            className={`p-2 rounded-lg transition-all flex items-center justify-center ${
              isLoading || (!text.trim() && files.length === 0)
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};