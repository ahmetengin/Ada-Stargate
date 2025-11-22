
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageRole, VesselIntelligenceProfile } from '../types';
import { Anchor, Copy, Check, Volume2, StopCircle, User, Mail, Phone, Lock, Zap, Droplets, ShieldCheck, Eye } from 'lucide-react';
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
              <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">{message.text}</span>
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
            
            <div className="bg-indigo-600 dark:bg-indigo-500 text-white dark:text-white px-5 py-3 rounded-2xl rounded-tr-lg shadow-md font-sans text-sm leading-relaxed flex items-start gap-3">
                <Anchor size={16} className="text-white/70 flex-shrink-0 mt-0.5" />
                <div>{message.text}</div>
            </div>
        </div>
      </div>
    );
  }

  // --- MODEL MESSAGE ---
  return (
    <div className="flex w-full mb-10 gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans">
        
        <div className="flex-shrink-0 flex flex-col items-center pt-1">
            <Anchor size={16} className="text-indigo-600 dark:text-indigo-500" />
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
                        
                        {/* Header */}
                        <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-t-lg border-b border-zinc-200 dark:border-zinc-700">
                            <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={12} className="text-indigo-500"/>
                                VESSEL INTELLIGENCE
                            </div>
                            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                <Lock size={10} />
                                <span>KVKK/GDPR PROTOCOLS ACTIVE</span>
                            </div>
                        </div>
                        
                        <div className="bg-zinc-50 dark:bg-zinc-900/20 p-3 rounded-b-lg border border-zinc-200 dark:border-zinc-800 text-[11px] leading-snug space-y-4">
                           
                           {/* SECTION 1: PUBLIC AIS DATA (Visible) */}
                           <div>
                                <div className="text-[9px] text-sky-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                                    <Eye size={10} /> PUBLIC AIS DATA (GLOBAL)
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-100 dark:border-zinc-700">
                                    <div>
                                        <p className="font-bold text-zinc-800 dark:text-zinc-200">{p.name}</p>
                                        <p className="text-zinc-500">IMO: {p.imo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-600 dark:text-zinc-400">{p.type} | {p.flag}</p>
                                        <p className="text-zinc-500">LOA: {p.loa}m | Beam: {p.beam}m</p>
                                    </div>
                                    <div className="col-span-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
                                        <span>Voyage: {p.voyage?.lastPort} &rarr; {p.voyage?.nextPort}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">ETA: {p.voyage?.eta}</span>
                                    </div>
                                </div>
                           </div>

                           {/* SECTION 2: SHORE INFRASTRUCTURE (Marina Owned - Visible) */}
                           <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-[9px] text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                                        <Zap size={10} /> SHORE UTILITIES (WIM)
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded border border-indigo-100 dark:border-indigo-800/50">
                                        <p className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"><Zap size={10} className="text-yellow-500"/> {p.utilities?.electricityKwh} kWh</p>
                                        <p className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"><Droplets size={10} className="text-blue-500"/> {p.utilities?.waterM3} m3</p>
                                    </div>
                                </div>

                                {/* SECTION 3: VESSEL TELEMETRY (Captain Owned - Private) */}
                                <div>
                                    <div className="text-[9px] text-red-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                                        <Lock size={10} /> VESSEL TELEMETRY (ada.sea)
                                    </div>
                                    <div className="bg-zinc-200 dark:bg-black/40 border border-zinc-300 dark:border-zinc-700 p-2 rounded flex flex-col items-center justify-center h-full text-center">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
                                            <Lock size={10} /> ENCRYPTED
                                        </div>
                                        <span className="text-[9px] text-zinc-400">Captain Authorization Req.</span>
                                    </div>
                                </div>
                           </div>
                           
                           {/* SECTION 4: PII (Masked) */}
                           {(p.ownerName || p.ownerEmail) && (
                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 opacity-70">
                                <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-1">Contract Holder (Masked)</div>
                                <p className="flex items-center gap-2"><User size={10} /> {maskFullName(p.ownerName || 'N/A')} | ID: {maskIdNumber(p.ownerId || 'N/A')}</p>
                                <div className="flex justify-between">
                                    <p className="flex items-center gap-2"><Mail size={10} /> {maskEmail(p.ownerEmail || 'N/A')}</p>
                                    {p.outstandingDebt && p.outstandingDebt > 0 && (
                                      <span className="text-red-500 font-bold">DEBT: €{p.outstandingDebt}</span>
                                    )}
                                </div>
                            </div>
                           )}

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
