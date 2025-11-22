import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole, VesselIntelligenceProfile } from '../types';
import { BrainCircuit, Copy, Check, Volume2, StopCircle, User, Mail, Phone } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { marinaExpert } from '../services/agents/marinaAgent';
import { VESSEL_KEYWORDS } from '../services/constants';
import { maskFullName, maskIdNumber, maskEmail, maskPhone } from '../services/utils';

interface MessageBubbleProps {
  message: Message;
  onAction?: (action: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onAction }) => {
  const isUser = message.role === MessageRole.User;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSystem = message.role === MessageRole.System;

  const [vesselProfiles, setVesselProfiles] = useState<Record<string, VesselIntelligenceProfile>>({});
  const [loadingVessel, setLoadingVessel] = useState<string | null>(null);

  useEffect(() => {
    if (message.role === MessageRole.Model && message.text && !message.isThinking) {
      const lowerText = message.text.toLowerCase();
      const matchedVesselKeyword = VESSEL_KEYWORDS.find(keyword => lowerText.includes(keyword));

      if (matchedVesselKeyword && !vesselProfiles[matchedVesselKeyword] && loadingVessel !== matchedVesselKeyword) {
        setLoadingVessel(matchedVesselKeyword);
        marinaExpert.getVesselIntelligence(matchedVesselKeyword)
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
  
  const getLoyaltyTierStyle = (tier?: VesselIntelligenceProfile['loyaltyTier']) => {
      switch(tier) {
          case 'GOLD': return 'text-amber-500 border-amber-500/50 bg-amber-500/10';
          case 'SILVER': return 'text-slate-400 border-slate-500/50 bg-slate-500/10';
          case 'PROBLEM': return 'text-red-500 border-red-500/50 bg-red-500/10';
          default: return 'text-sky-500 border-sky-500/50 bg-sky-500/10';
      }
  };


  if (isSystem) {
      return (
          <div className="flex w-full mb-6 justify-center animate-in fade-in zoom-in duration-300">
              <div className="bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-full flex items-center gap-3">
                  <BrainCircuit size={14} className="text-indigo-500 dark:text-indigo-400" />
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">{message.text}</span>
              </div>
          </div>
      )
  }

  if (isUser) {
    return (
      <div className="flex w-full mb-8 justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-3xl flex flex-col items-end group">
            {message.attachments && message.attachments.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {message.attachments.map((att, idx) => (
                    att.mimeType.startsWith('image/') ? 
                    <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} className="h-32 rounded-lg shadow-lg" alt="attachment"/> : 
                    <div key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">{att.name || 'Attachment'}</div>
                ))}
             </div>
            )}
            
            <div className="bg-indigo-600 dark:bg-indigo-500 text-white dark:text-white px-5 py-3 rounded-2xl rounded-tr-lg shadow-md font-sans text-sm leading-relaxed">
                {message.text}
            </div>
        </div>
      </div>
    );
  }

  // --- MODEL MESSAGE ---
  return (
    <div className="flex w-full mb-10 gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans">
        
        <div className="flex-shrink-0 flex flex-col items-center pt-1">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-panel-dark shadow-sm border border-border-light dark:border-border-dark">
                <BrainCircuit size={16} className="text-indigo-600 dark:text-indigo-500" />
            </div>
        </div>

        <div className="flex-1 max-w-3xl min-w-0">
             <div className="absolute top-0 right-full mr-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button onClick={copyToClipboard} className="p-1.5 bg-panel-light hover:bg-zinc-200 dark:bg-panel-dark dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors" title="Copy Protocol">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <button onClick={handleSpeak} className={`p-1.5 bg-panel-light hover:bg-zinc-200 dark:bg-panel-dark dark:hover:bg-zinc-800 rounded transition-colors ${isSpeaking ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'}`} title="Read Out">
                     {isSpeaking ? <StopCircle size={12} /> : <Volume2 size={12} />}
                </button>
            </div>


            <div className="prose prose-sm max-w-none 
                text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed
                prose-p:my-2 prose-p:font-normal
                prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-semibold
                prose-headings:text-zinc-800 dark:prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-base prose-headings:mt-6 prose-headings:mb-3
                prose-code:text-indigo-600 dark:prose-code:text-indigo-300 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-xs
                prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-border-light dark:prose-pre:border-border-dark prose-pre:rounded-lg prose-pre:p-3
                prose-ul:my-2 prose-ul:pl-0 prose-li:list-none prose-li:pl-0 prose-li:relative prose-li:before:content-['•'] prose-li:before:absolute prose-li:before:left-0 prose-li:before:text-zinc-400 dark:prose-li:before:text-zinc-600 prose-li:pl-5"
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

            {Object.values(vesselProfiles).map((profile, idx) => {
                const p = profile as VesselIntelligenceProfile;
                return (
                p && (
                    <div key={idx} className="mt-6 pt-4 border-t border-border-light dark:border-border-dark flex flex-col gap-3 font-mono">
                        <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Vessel Intelligence Profile</div>
                        
                        <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-lg border border-sky-200 dark:border-sky-800/50 text-[11px] leading-snug space-y-2">
                           <div>
                                <p className="font-bold text-zinc-800 dark:text-zinc-200">{p.name} (IMO: {p.imo})</p>
                                <p className="text-zinc-600 dark:text-zinc-400">Type: {p.type} | Flag: {p.flag} | {p.loa}m LOA</p>
                           </div>
                           <div>
                                <p><strong>Status:</strong> {p.status} at {p.location}</p>
                                <p><strong>Voyage:</strong> {p.voyage?.lastPort} &rarr; <strong>{p.voyage?.nextPort}</strong> (ETA: {p.voyage?.eta})</p>
                           </div>
                           {(p.ownerName || p.ownerEmail) && (
                            <div className="pt-2 border-t border-sky-200 dark:border-sky-800/50">
                                <p className="flex items-center gap-2"><User size={12} /> Owner: {maskFullName(p.ownerName || 'N/A')} | ID: {maskIdNumber(p.ownerId || 'N/A')}</p>
                                <p className="flex items-center gap-2"><Mail size={12} /> Email: {maskEmail(p.ownerEmail || 'N/A')}</p>
                                <p className="flex items-center gap-2"><Phone size={12} /> Phone: {maskPhone(p.ownerPhone || 'N/A')}</p>
                            </div>
                           )}
                           <div className="flex items-center justify-between pt-2 border-t border-sky-200 dark:border-sky-800/50">
                                <div className="flex items-center gap-2">
                                   <span className="font-bold">Loyalty:</span>
                                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLoyaltyTierStyle(p.loyaltyTier)}`}>
                                     {p.loyaltyTier} ({p.loyaltyScore})
                                   </span>
                                </div>
                                {p.outstandingDebt && p.outstandingDebt > 0 && (
                                  <div className="text-red-500 font-bold">Debt: €{p.outstandingDebt}</div>
                                )}
                           </div>
                        </div>
                    </div>
                )
            )})}


            {message.groundingSources && message.groundingSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 font-mono">
                    {message.groundingSources.map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" rel="noreferrer" className="group flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-md text-[10px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all">
                            <div className="w-1 h-1 rounded-full bg-indigo-500 group-hover:shadow-[0_0_5px_rgba(99,102,241,0.8)] transition-all"></div>
                            <span className="truncate max-w-[200px]">{source.title}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};