import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole, VesselIntelligenceProfile } from '../types';
import { Anchor, Copy, Check, Volume2, StopCircle, Cpu } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { marinaAgent } from '../services/agents/marinaAgent';
import { VESSEL_KEYWORDS } from '../services/constants';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.User;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSystem = message.role === MessageRole.System;

  // State for vessel intelligence profiles
  const [vesselProfiles, setVesselProfiles] = useState<Record<string, VesselIntelligenceProfile>>({});
  const [loadingVessel, setLoadingVessel] = useState<string | null>(null);

  useEffect(() => {
    // Only process model messages that have text and are not currently thinking
    if (message.role === MessageRole.Model && message.text && !message.isThinking) {
      const lowerText = message.text.toLowerCase();
      // Find a vessel name from our keywords in the message text
      const matchedVesselKeyword = VESSEL_KEYWORDS.find(keyword => lowerText.includes(keyword));

      if (matchedVesselKeyword && !vesselProfiles[matchedVesselKeyword] && loadingVessel !== matchedVesselKeyword) {
        setLoadingVessel(matchedVesselKeyword);
        marinaAgent.getVesselIntelligence(matchedVesselKeyword)
          .then(profile => {
            if (profile) {
              setVesselProfiles(prev => ({ ...prev, [matchedVesselKeyword]: profile }));
            }
          })
          .finally(() => {
            setLoadingVessel(null);
          });
      }
    }
  }, [message, vesselProfiles, loadingVessel]);


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

  // --- SYSTEM MESSAGE (Notification Style) ---
  if (isSystem) {
      return (
          <div className="flex w-full mb-6 justify-center animate-in fade-in zoom-in duration-300">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 px-4 py-2 rounded-full flex items-center gap-3">
                  <Cpu size={14} className="text-indigo-500 dark:text-indigo-400" />
                  <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-200 uppercase tracking-wider">{message.text}</span>
              </div>
          </div>
      )
  }

  // --- USER MESSAGE (Command Pill) ---
  if (isUser) {
    return (
      <div className="flex w-full mb-8 justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-2xl flex flex-col items-end group">
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {message.attachments.map((att, idx) => (
                    att.mimeType.startsWith('image/') ? 
                    <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} className="h-32 rounded-lg shadow-lg" alt="attachment"/> : 
                    <div key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">{att.name || 'Attachment'}</div>
                ))}
             </div>
            )}
            
            <div className="bg-white dark:bg-[#27272a] text-zinc-800 dark:text-zinc-100 px-5 py-2.5 rounded-[18px] rounded-tr-sm text-[13px] font-medium shadow-sm font-mono tracking-tight border border-zinc-200 dark:border-zinc-700/50">
                {message.text}
            </div>
        </div>
      </div>
    );
  }

  // --- MODEL MESSAGE (The "Magnificent" Tech Report Style - Flat) ---
  return (
    <div className="flex w-full mb-10 gap-5 group animate-in fade-in slide-in-from-bottom-2 duration-500 font-mono">
        
        {/* Identity Column */}
        <div className="flex-shrink-0 flex flex-col items-center pt-1">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900/50 shadow-sm border border-zinc-200 dark:border-transparent">
                <Anchor size={16} className="text-indigo-600 dark:text-indigo-500" />
            </div>
        </div>

        {/* Content Card */}
        <div className="flex-1 max-w-3xl min-w-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
               <div className="flex items-center gap-3">
                   <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 tracking-widest uppercase">ADA MARINA</span>
                   <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800"></div>
                   <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">v3.2</span>
               </div>
               
               {/* Action Tray */}
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button onClick={copyToClipboard} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors" title="Copy Protocol">
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button onClick={handleSpeak} className={`p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors ${isSpeaking ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`} title="Read Out">
                         {isSpeaking ? <StopCircle size={12} /> : <Volume2 size={12} />}
                    </button>
                </div>
            </div>

            {/* Markdown Content Area */}
            <div className="prose prose-invert prose-sm max-w-none 
                text-zinc-600 dark:text-zinc-400/90 text-[12px] leading-relaxed
                prose-p:my-2 prose-p:font-normal
                prose-strong:text-zinc-900 dark:prose-strong:text-zinc-200 prose-strong:font-bold
                prose-headings:text-zinc-800 dark:prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:tracking-wide prose-headings:uppercase prose-headings:text-[13px] prose-headings:mt-6 prose-headings:mb-2
                prose-code:text-indigo-600 dark:prose-code:text-indigo-300 prose-code:bg-zinc-100 dark:prose-code:bg-[#121214] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[11px]
                prose-pre:bg-zinc-50 dark:prose-pre:bg-[#121214] prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-pre:rounded-lg prose-pre:p-3
                prose-ul:my-2 prose-ul:pl-0 prose-li:list-none prose-li:pl-0 prose-li:relative prose-li:before:content-['>'] prose-li:before:absolute prose-li:before:left-0 prose-li:before:text-zinc-400 dark:prose-li:before:text-zinc-600 prose-li:pl-4"
            >
                {message.text ? (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                ) : message.generatedImage ? (
                    <div className="rounded-xl overflow-hidden mt-2 max-w-md shadow-2xl relative group/img">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                             <span className="text-xs font-mono text-white/80">IMG_GEN_V4.0</span>
                        </div>
                        <img src={`data:image/jpeg;base64,${message.generatedImage}`} alt="Generated" className="w-full h-auto" />
                    </div>
                ) : (
                    <TypingIndicator />
                )}
            </div>

            {/* Vessel Intelligence Profile Display */}
            {Object.values(vesselProfiles).map((profile, idx) => (
                profile && (
                    <div key={idx} className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-900 flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Vessel Intelligence Profile</div>
                        <div className="bg-sky-50 dark:bg-sky-900/10 p-3 rounded-lg border border-sky-200 dark:border-sky-900/20 text-[11px] leading-snug">
                            <p className="mb-1"><strong>Name:</strong> {profile.name} (IMO: {profile.imo})</p>
                            <p className="mb-1"><strong>Type:</strong> {profile.type} | <strong>Flag:</strong> {profile.flag}</p>
                            <p className="mb-1"><strong>Dimensions:</strong> {profile.loa}m LOA x {profile.beam}m Beam | {profile.dwt} DWT</p>
                            <p className="mb-1"><strong>Status:</strong> {profile.status} at {profile.location}</p>
                            <p className="mb-0"><strong>Voyage:</strong> {profile.voyage.lastPort} &rarr; <strong>{profile.voyage.nextPort}</strong> (ETA: {profile.voyage.eta})</p>
                        </div>
                    </div>
                )
            ))}

            {/* Grounding / Sources Footer */}
            {message.groundingSources && message.groundingSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-900 flex flex-wrap gap-2">
                    {message.groundingSources.map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" rel="noreferrer" className="group flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#121214] dark:hover:bg-zinc-900 px-3 py-1.5 rounded-md text-[10px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all">
                            <div className="w-1 h-1 rounded-full bg-indigo-500 group-hover:shadow-[0_0_5px_rgba(99,102,241,0.8)] transition-all"></div>
                            <span className="truncate max-w-[200px] font-mono">{source.title}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};