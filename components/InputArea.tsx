import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { Send, Loader2, X, Mic, StopCircle, Paperclip, FileText, Radio } from 'lucide-react';
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setText(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Model Selection */}
      <div className="flex items-center gap-2 mb-2">
         {(['Flash', 'Pro', 'Image'] as const).map(modelName => {
             const modelValue = ModelType[modelName];
             return (
              <button
                key={modelValue}
                onClick={() => onModelChange(modelValue)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  selectedModel === modelValue
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {modelName}
              </button>
             )
         })}
      </div>

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl">
        {/* Attachments Preview */}
        {files.length > 0 && (
          <div className="p-2 border-b border-zinc-800">
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1">
                  <FileText size={14} className="text-indigo-400" />
                  <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-zinc-500 hover:text-zinc-300">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Main Input Area */}
        <div className="flex items-end p-2 gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instructions..."
            className="flex-1 bg-transparent resize-none focus:outline-none placeholder:text-zinc-500 text-sm py-2 px-1 custom-scrollbar"
            disabled={isLoading}
          />
          <div className="flex items-center flex-shrink-0 gap-1">
             <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} className="hidden" />
             <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md" title="Attach Files">
               <Paperclip size={16} />
             </button>
             <button onClick={toggleRecording} className={`p-2 rounded-md ${isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`} title={isRecording ? "Stop Dictation" : "Dictate"}>
               {isRecording ? <StopCircle size={16} /> : <Mic size={16} />}
             </button>
             <button 
                onClick={onInitiateVhfCall}
                disabled={!isMonitoring || isLoading}
                className="p-2 text-red-400 bg-red-900/50 hover:bg-red-900 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                title="Hail Marina on VHF"
              >
                <Radio size={16} />
             </button>
             <button
               onClick={handleSend}
               disabled={(!text.trim() && files.length === 0) || isLoading}
               className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed"
             >
               {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};