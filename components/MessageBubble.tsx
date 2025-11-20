
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole } from '../types';
import { Anchor, Copy, Check, Volume2, StopCircle, Terminal } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.User;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- USER MESSAGE (Minimalist Pill) ---
  if (isUser) {
    return (
      <div className="flex w-full mb-6 justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-2xl flex flex-col items-end group">
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {message.attachments.map((att, idx) => (
                    att.mimeType.startsWith('image/') ? 
                    <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} className="h-32 rounded-lg border border-zinc-700 shadow-lg" alt="attachment"/> : 
                    <div key={idx} className="bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400">{att.name || 'Attachment'}</div>
                ))}
             </div>
            )}
            
            <div className="bg-[#27272a] text-zinc-100 px-5 py-2.5 rounded-[20px] rounded-tr-sm text-[14px] font-normal leading-relaxed shadow-md border border-zinc-800/50">
                {message.text}
            </div>
        </div>
      </div>
    );
  }

  // --- MODEL MESSAGE (Tech Stream) ---
  return (
    <div className="flex w-full mb-8 gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Identity Icon */}
        <div className="flex-shrink-0 mt-0.5">
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-transparent">
                <Anchor size={18} className="text-indigo-500" />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl min-w-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-1 h-7">
               <span className="text-[10px] font-mono font-medium text-indigo-400/80 tracking-wider uppercase flex items-center gap-2">
                  Ada Orchestrator
               </span>
               
               {/* Hover Actions */}
               <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={copyToClipboard} className="text-zinc-600 hover:text-zinc-300 transition-colors" title="Copy">
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button onClick={handleSpeak} className={`transition-colors ${isSpeaking ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-300'}`} title="Read Aloud">
                         {isSpeaking ? <StopCircle size={12} /> : <Volume2 size={12} />}
                    </button>
                </div>
            </div>

            {/* Markdown Content */}
            <div className="prose prose-invert prose-sm max-w-none 
                text-zinc-300 
                prose-p:leading-7 prose-p:my-2 prose-p:text-[14px] prose-p:font-light
                prose-strong:text-zinc-100 prose-strong:font-semibold
                prose-headings:text-zinc-200 prose-headings:font-medium prose-headings:text-sm prose-headings:uppercase prose-headings:tracking-wide prose-headings:mt-6 prose-headings:mb-2
                prose-code:text-indigo-300 prose-code:bg-[#18181b] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[12px] prose-code:border prose-code:border-zinc-800
                prose-pre:bg-[#121214] prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:p-4
                prose-ul:my-2 prose-ul:pl-4 prose-li:text-zinc-400 prose-li:marker:text-zinc-600
                selection:bg-indigo-500/30 selection:text-indigo-100"
            >
                {message.text ? (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                ) : message.generatedImage ? (
                    <div className="rounded-xl overflow-hidden border border-zinc-800 mt-2 max-w-md shadow-2xl">
                        <img src={`data:image/jpeg;base64,${message.generatedImage}`} alt="Generated" className="w-full h-auto hover:scale-[1.02] transition-transform duration-500" />
                    </div>
                ) : (
                    <TypingIndicator />
                )}
            </div>

            {/* Grounding / Sources */}
            {message.groundingSources && message.groundingSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-900 flex flex-wrap gap-2">
                    {message.groundingSources.map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" rel="noreferrer" className="group flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5 rounded-md text-[11px] text-zinc-500 hover:text-zinc-300 transition-all">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-900 group-hover:bg-indigo-500 transition-colors"></span>
                            <span className="truncate max-w-[200px]">{source.title}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
