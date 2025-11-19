import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse, generateImage } from './services/geminiService';
import { Menu, Radio } from 'lucide-react';
import { VoiceModal } from './components/VoiceModal';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.Model,
  text: "**System Initialization Sequence**\n\n`[SUCCESS]` Tenant Loaded: **wim.ada.network** (West Istanbul Marina)\n`[SUCCESS]` Node Discovery: 9 Nodes Active\n`[SUCCESS]` Distributed Memory: Synced\n\n---\n\n**Ada Orchestrator Online.**\n\nGreetings, Captain. I am connected to the WIM autonomous cluster.\nNodes `ada.sea.wim`, `ada.finance.wim`, and `ada.marina.wim` are standing by. \n\nHow can we assist your operations today?",
  timestamp: Date.now()
};

interface SystemLog {
  id: string;
  timestamp: string;
  node: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'critical' | 'alert';
}

type NodeStatus = 'connected' | 'working' | 'disconnected';

function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  // Simulation State (Lifted from Sidebar)
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('73');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeStatus>>({
    'ada.sea': 'connected',
    'ada.marina': 'connected',
    'ada.finance': 'connected',
    'ada.customer': 'connected',
    'ada.passkit': 'connected',
    'ada.legal': 'connected',
    'ada.weather': 'connected',
    'ada.vhf': 'connected'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs for interval access
  const monitoringRef = useRef(isMonitoring);
  const channelRef = useRef(activeChannel);

  useEffect(() => {
    monitoringRef.current = isMonitoring;
    channelRef.current = activeChannel;
  }, [isMonitoring, activeChannel]);

  // System Simulation Effect
  useEffect(() => {
    const vesselNames = [
      'phisedelia', 'blue_horizon', 'karayel', 'mistral', 'aegean_queen', 
      'marmara_star', 'sirocco', 'levante', 'poyraz', 'meltem', 
      'odyssey', 'poseidon', 'neptune', 'mermaid', 'atlantis'
    ];

    const serviceNodes = ['ada.marina.wim', 'ada.finance.wim', 'ada.weather.wim', 'ada.customer.wim'];
    const coreNodes = ['ada.vhf', 'ada.sea', 'ada.marina', 'ada.finance', 'ada.customer', 'ada.passkit', 'ada.legal', 'ada.weather'];

    const generateLog = () => {
      const rand = Math.random();
      let nodeFull, nodeBase, msg, type;

      if (rand < 0.30) { // VHF Traffic (Increased frequency)
         if (!monitoringRef.current) return null;
         nodeFull = 'ada.vhf.wim';
         nodeBase = 'ada.vhf';
         
         const currentCh = channelRef.current;
         const msgs16 = ['Securite: Dredging ops.', 'Mayday Relay: Sector 4.', 'All stations: Gale warning.', 'Routine Check.'];
         const msgs73 = ['Phisedelia requesting pilot.', 'M/Y Blue Star at A-Pontoon.', 'Fuel dock status check.'];
         const msgs06 = ['Switching to Ch 06.', 'Radio check, over.'];
         const msgsOps = ['Patrol Bravo check-in.', 'Gate 4 access log verified.'];
         
         // Emergency scenarios
         const emergencies = [
            { m: '[CH 16] MAYDAY MAYDAY MAYDAY - S/Y NORTH STAR SINKING SECTOR 4', t: 'critical' },
            { m: '[CH 16] PAN PAN - ENGINE FAILURE DRIFTING SOUTH', t: 'alert' },
            { m: '[SEC] FIRE ALARM: HANGAR 3 DETECTED', t: 'critical' },
            { m: '[CH 16] COLLISION ALERT - SECTOR 1', t: 'critical' },
            { m: '[CH 16] SECURITE - FLOATING DEBRIS ENTRANCE', t: 'alert' }
         ];

         let selectedMsg = '';
         let prefix = '';
         type = 'info';

         // 5% chance of emergency if scanning or on 16
         if ((currentCh === 'SCAN' || currentCh === '16') && Math.random() < 0.05) {
             const em = emergencies[Math.floor(Math.random() * emergencies.length)];
             msg = em.m;
             type = em.t;
         } else {
             if (currentCh === 'SCAN') {
                const dice = Math.random();
                if (dice < 0.3) { prefix = '[CH 16]'; selectedMsg = msgs16[Math.floor(Math.random() * msgs16.length)]; }
                else if (dice < 0.6) { prefix = '[CH 73]'; selectedMsg = msgs73[Math.floor(Math.random() * msgs73.length)]; }
                else if (dice < 0.8) { prefix = '[CH 06]'; selectedMsg = msgs06[Math.floor(Math.random() * msgs06.length)]; }
                else { prefix = '[SEC]'; selectedMsg = msgsOps[Math.floor(Math.random() * msgsOps.length)]; }
             } else {
                prefix = `[CH ${currentCh}]`;
                if (currentCh === '16') selectedMsg = msgs16[Math.floor(Math.random() * msgs16.length)];
                else if (currentCh === '73') selectedMsg = msgs73[Math.floor(Math.random() * msgs73.length)];
                else if (currentCh === '06') selectedMsg = msgs06[Math.floor(Math.random() * msgs06.length)];
                else return null;
             }
             msg = `${prefix} ${selectedMsg}`;
         }

      } else if (rand < 0.6) {
        const vessel = vesselNames[Math.floor(Math.random() * vesselNames.length)];
        nodeFull = `ada.sea.${vessel}`;
        nodeBase = 'ada.sea';
        const actions = [
          { m: 'NMEA2000 Sync: Wind 12kts', t: 'info' },
          { m: 'Requesting Berth Status', t: 'info' },
          { m: 'Battery Level: 98%', t: 'success' },
          { m: 'Location Update: 40.9N 28.8E', t: 'info' }
        ];
        const a = actions[Math.floor(Math.random() * actions.length)];
        msg = a.m;
        type = a.t;
      } else {
        nodeFull = serviceNodes[Math.floor(Math.random() * serviceNodes.length)];
        nodeBase = nodeFull.split('.').slice(0, 2).join('.');
        const actions = [
          { m: 'Batch Invoice Processing', t: 'info' },
          { m: 'Weather Warning: Gale Force 7', t: 'warning' },
          { m: 'Gate Access Granted', t: 'success' },
          { m: 'Fleet Status: 602 Online', t: 'success' }
        ];
        const a = actions[Math.floor(Math.random() * actions.length)];
        msg = a.m;
        type = a.t;
      }

      // Update Status Colors
      setNodeStates(prev => ({ ...prev, [nodeBase]: 'working' }));
      setTimeout(() => {
        setNodeStates(prev => ({ ...prev, [nodeBase]: 'connected' }));
      }, 600);

      return {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        node: nodeFull,
        message: msg,
        type: type as any
      };
    };

    const logInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const newLog = generateLog();
        if (newLog) {
           setLogs(prev => [...prev.slice(-50), newLog]); // Keep last 50 logs
        }
      }
    }, 1200);

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        const randomNode = coreNodes[Math.floor(Math.random() * coreNodes.length)];
        setNodeStates(prev => ({ ...prev, [randomNode]: 'disconnected' }));
        setTimeout(() => {
           setNodeStates(prev => ({ ...prev, [randomNode]: 'connected' }));
        }, 2000);
      }
    }, 8000);

    return () => {
      clearInterval(logInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendRefined = async (text: string, files: File[]) => {
    const userMsgId = Date.now().toString();
    const fileAttachments = await Promise.all(files.map(async (file) => {
      return new Promise<{mimeType: string, data: string, name: string}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
           const base64 = (reader.result as string).split(',')[1];
           resolve({ mimeType: file.type, data: base64, name: file.name });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }));

    const userMessage: Message = {
      id: userMsgId,
      role: MessageRole.User,
      text,
      attachments: fileAttachments,
      timestamp: Date.now()
    };

    const currentHistory = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (selectedModel === ModelType.Image) {
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: MessageRole.Model, text: '', timestamp: Date.now() }]);
        const imageBase64 = await generateImage(text);
        setMessages(prev => prev.map(m => {
           if (m.id === botMsgId) return { ...m, generatedImage: imageBase64, text: `Generated image for: "${text}"` };
           return m;
        }));
      } else {
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: MessageRole.Model, text: '', timestamp: Date.now() }]);
        let accumulatedText = "";
        
        await streamChatResponse(
          currentHistory,
          text,
          fileAttachments,
          selectedModel,
          useSearch,
          useThinking,
          (chunk, grounding) => {
            accumulatedText += chunk;
            setMessages(prev => prev.map(m => {
              if (m.id === botMsgId) {
                return { ...m, text: accumulatedText, groundingSources: grounding || m.groundingSources };
              }
              return m;
            }));
          }
        );
      }
    } catch (e: any) {
      let errorMsg = "Connection interrupted.";
      if (e.message === 'API_QUOTA_EXCEEDED') {
        errorMsg = "### ⚠️ SYSTEM ALERT: RESOURCE EXHAUSTED\n\nThe Ada Orchestrator has exceeded its API quota for the current cycle.\n\n**Action Required:**\n* Check billing details at Google AI Studio.\n* Wait for quota reset.\n\n*System entered suspend mode.*";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.Model,
        text: errorMsg,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-inter overflow-hidden">
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      {/* Left: Sidebar Controls */}
      <Sidebar 
        onClear={() => setMessages([INITIAL_MESSAGE])}
        nodeStates={nodeStates}
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        isMonitoring={isMonitoring}
        onMonitoringToggle={() => setIsMonitoring(!isMonitoring)}
      />
      
      {/* Mobile Menu */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 transform transition-transform md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
           <span className="font-bold text-lg">Ada Maritime</span>
           <button onClick={() => setMobileMenuOpen(false)}><Menu /></button>
        </div>
        <div className="p-4">
           <button onClick={() => { setMessages([INITIAL_MESSAGE]); setMobileMenuOpen(false); }} className="w-full py-2 bg-indigo-600 rounded-lg">New Session</button>
        </div>
      </div>

      {/* Middle: Main Chat Content */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-900 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-zinc-800 bg-zinc-950">
          <button onClick={() => setMobileMenuOpen(true)} className="mr-3"><Menu /></button>
          <span className="font-semibold">Ada Orchestrator</span>
        </div>

        {/* Desktop Header for Chat Zone */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur">
          <span className="font-mono text-sm text-zinc-400 font-medium uppercase tracking-wider">Bridge Interface</span>
          {/* VHF Status Widget */}
          <div className="flex items-center gap-3 bg-zinc-900/50 rounded-full px-3 py-1 border border-zinc-800/50">
            <div className="flex items-center gap-1.5">
               <Radio size={12} className={isMonitoring ? "text-indigo-400 animate-pulse" : "text-zinc-600"} />
               <span className="text-[10px] font-mono text-zinc-400">
                  {isMonitoring ? activeChannel : 'OFF'}
               </span>
            </div>
            <div className="w-px h-3 bg-zinc-800"></div>
            <button 
              onClick={() => setIsVoiceModalOpen(true)}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              PTT Active
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scroll-smooth custom-scrollbar">
          <div className="max-w-3xl mx-auto pt-4 pb-24">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-10 px-4 pb-4">
          <InputArea 
            onSend={handleSendRefined} 
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            useSearch={useSearch}
            onToggleSearch={() => setUseSearch(!useSearch)}
            useThinking={useThinking}
            onToggleThinking={() => setUseThinking(!useThinking)}
            onStartVoice={() => setIsVoiceModalOpen(true)}
          />
        </div>
      </div>

      {/* Right: Canvas Operations Deck */}
      <Canvas logs={logs} activeChannel={activeChannel} isMonitoring={isMonitoring} />
    </div>
  );
}

export default App;