
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole } from '../types';
import { Anchor, Cpu } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
  onAction?: (action: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.User;
  const isSystem = message.role === MessageRole.System;

  if (isSystem) {
      return (
          <div className="mb-8 font-mono text-[10px] text-zinc-500 leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-2 text-indigo-500 mb-1 font-bold tracking-widest">
                  <Anchor size={12} />
                  {message.text.split('\n')[0]}
              </div>
              {message.text.split('\n').slice(1).join('\n')}
          </div>
      )
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-2xl rounded-tr-sm max-w-xl text-sm shadow-lg">
            {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 mb-8 group">
        <div className="flex-shrink-0 mt-1">
            <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <Anchor size={12} className="text-teal-500" />
            </div>
        </div>

        <div className="flex-1 min-w-0">
             <div className="flex items-center gap-3 mb-1">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ADA MARINA</span>
                 <span className="text-[9px] font-mono text-zinc-700 bg-zinc-900 px-1 rounded border border-zinc-800">v3.2</span>
             </div>

            <div className="text-sm text-zinc-300 leading-relaxed font-sans">
                <div className="prose prose-invert prose-sm max-w-none 
                    prose-strong:text-teal-400 prose-strong:font-bold
                    prose-code:text-amber-500 prose-code:font-mono prose-code:bg-zinc-900 prose-code:px-1 prose-code:rounded prose-code:border prose-code:border-zinc-800
                    prose-headings:font-mono prose-headings:uppercase prose-headings:text-zinc-400 prose-headings:text-xs prose-headings:font-bold prose-headings:tracking-widest prose-headings:mb-2
                ">
                    {message.text ? <ReactMarkdown>{message.text}</ReactMarkdown> : <TypingIndicator />}
                </div>
            </div>
        </div>
    </div>
  );
};
