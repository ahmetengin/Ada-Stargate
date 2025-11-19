
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType, GroundingSource } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse, generateImage } from './services/geminiService';
import { Menu, Radio } from 'lucide-react';
import { VoiceModal } from './components/VoiceModal';
import { TypingIndicator } from './components/TypingIndicator';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.Model,
  text: "**System Initialization Sequence**\n\n`[SUCCESS]` Tenant Loaded: **wim.ada.network** (West Istanbul Marina)\n`[SUCCESS]` SEAL Core: **Synthetic Data Generation Active**\n`[SUCCESS]` Knowledge Base: WIM Regulations (Arts. E-H) Ingested\n`[SUCCESS]` Marshall Protocol: **ENFORCING**\n\n---\n\n**Ada Orchestrator Online.**\n\nGreetings, Captain. I am connected to the WIM autonomous cluster.\n\n**Operational Status:**\n- **🧠 SEAL Engine:** Learning from interactions (Self-Edit Mode)\n- **👮 Marshall:** Monitoring Speed (G.1) & Contracts (H.3)\n- **🚤 Assets:** Tenders Alpha, Bravo, Charlie (Ch 14) Standing By\n- **📡 VHF Sentinel:** Scanning Ch 16/73/12/13/14\n\n*State: Ready. Privacy Protocol Active.*",
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
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Pro);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  // Simulation State
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
    'ada.security': 'connected',
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // System Simulation Effect
  useEffect(() => {
    const vesselNames = [
      'phisedelia', 'blue_horizon', 'karayel', 'mistral', 'aegean_queen', 
      'marmara_star', 'sirocco', 'levante', 'poyraz', 'meltem', 
      'odyssey', 'poseidon', 'neptune', 'mermaid', 'atlantis'
    ];

    const serviceNodes = ['ada.marina.wim', 'ada.finance.wim', 'ada.weather.wim', 'ada.customer.wim', 'ada.legal.wim', 'ada.security.wim'];

    const generateLog = () => {
      const rand = Math.random();
      let nodeFull = '';
      let nodeBase = '';
      let msg = '';
      let type: SystemLog['type'] = 'info';

      if (rand < 0.30) { // VHF Traffic (High frequency)
         if (!monitoringRef.current) return null;
         nodeFull = 'ada.vhf.wim';
         nodeBase = 'ada.vhf';
         
         const currentCh = channelRef.current;
         const msgs16 = ['Securite: Dredging ops.', 'Mayday Relay: Sector 4.', 'All stations: Gale warning.', 'Routine Check.'];
         const msgs73 = ['Phisedelia requesting pilot.', 'M/Y Blue Star at A-Pontoon.', 'Fuel dock status check.', 'Tender boat returning.'];
         const msgs06 = ['Switching to Ch 06.', 'Radio check, over.'];
         const msgs12 = ['Port Control: Operations normal.', 'Manager to Office.', 'Shift change acknowledged.'];
         const msgs13 = ['Security Patrol: Sector B clear.', 'Gate 1: Access verified.', 'CCTV 4: Motion detected.'];
         const msgs14 = ['Tender Alpha: Lines secured.', 'Travel Lift: Haul-out complete.', 'Technical team to Hangar 2.'];

         // Emergency scenarios
         if (rand < 0.02) {
             msg = `[CH 16] MAYDAY MAYDAY: Engine fire on ${vesselNames[Math.floor(Math.random() * vesselNames.length)]}.`;
             type = 'critical';
         } else if (currentCh === 'SCAN' || currentCh === '16') {
             msg = `[CH 16] ${msgs16[Math.floor(Math.random() * msgs16.length)]}`;
             type = 'warning';
         } else if (currentCh === '73') {
             msg = `[CH 73] ${msgs73[Math.floor(Math.random() * msgs73.length)]}`;
         } else if (currentCh === '12') {
             msg = `[CH 12] ${msgs12[Math.floor(Math.random() * msgs12.length)]}`;
         } else if (currentCh === '13') {
             msg = `[CH 13] ${msgs13[Math.floor(Math.random() * msgs13.length)]}`;
         } else if (currentCh === '14') {
             msg = `[CH 14] ${msgs14[Math.floor(Math.random() * msgs14.length)]}`;
         } else {
             msg = `[CH ${currentCh}] ${msgs06[Math.floor(Math.random() * msgs06.length)]}`;
         }

      } else if (rand < 0.45) { // Vessel Ops (Privacy First)
         // Vessels don't broadcast telemetry anymore unless critical
         const vName = vesselNames[Math.floor(Math.random() * vesselNames.length)];
         nodeFull = `ada.sea.${vName}`;
         nodeBase = 'ada.sea';
         
         // Simulation of Local Data Processing
         const privacyActs = ['Local DB: Encrypted.', 'Privacy Shield: Query Blocked.', 'Auth Request: Check-in.', 'Handshake: ada.marina.wim'];
         msg = privacyActs[Math.floor(Math.random() * privacyActs.length)];
         type = 'info';

      } else { // Marshall / Infrastructure Events
         const sNode = serviceNodes[Math.floor(Math.random() * serviceNodes.length)];
         nodeFull = sNode;
         nodeBase = sNode.split('.')[1] ? `ada.${sNode.split('.')[1]}` : 'ada.marina';
         
         if (nodeBase === 'ada.legal' || nodeBase === 'ada.security') {
            // Marshall Logic: Speeding Simulation
            if (Math.random() < 0.15) {
               const plate = Math.floor(Math.random() * 99) + 'AB' + Math.floor(Math.random() * 999);
               msg = `CAM-04: Land Speed Violation [Plate: 34${plate}] 18km/h. (Limit: 10km/h)`;
               type = 'critical';
            } else {
               msg = 'Contract Audit: Compliance 99%.';
               type = 'success';
            }
         } else if (nodeBase === 'ada.finance') {
            msg = `Ledger Sync: ${Math.floor(Math.random() * 5000)} EUR processed.`;
         } else if (nodeBase === 'ada.marina') {
             // Tender Ops Simulation (Ch 14)
             if (Math.random() < 0.4) {
                 const tenders = ['Tender Alpha', 'Tender Bravo', 'Tender Charlie'];
                 const tName = tenders[Math.floor(Math.random() * tenders.length)];
                 const vName = vesselNames[Math.floor(Math.random() * vesselNames.length)];
                 msg = `[CH 14] ${tName}: Assisting ${vName} at Pontoon C.`;
                 type = 'info';
             } else {
                 msg = 'Gate sensor triggered.';
             }
         } else {
            const sActs = ['Transaction verified.', 'Weather update: 15kt NW.', 'CRM Sync.'];
            msg = sActs[Math.floor(Math.random() * sActs.length)];
         }
      }

      // Update Node Status visually
      setNodeStates(prev => ({
        ...prev,
        [nodeBase]: 'working'
      }));
      setTimeout(() => {
        setNodeStates(prev => ({
          ...prev,
          [nodeBase]: 'connected'
        }));
      }, 400); // Faster blink for Enterprise Mode

      return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        node: nodeFull,
        message: msg,
        type
      };
    };

    const interval = setInterval(() => {
      const newLog = generateLog();
      if (newLog) {
        // Removed .slice() to prevent data loss in Canvas for short sessions, keep last 200
        setLogs(prev => [newLog, ...prev].slice(0, 200)); 
      }
    }, 600); // Turbo Mode (600ms)

    return () => clearInterval(interval);
  }, []);

  const handleSend = async (text: string, attachments: File[]) => {
    const formattedAttachments = await Promise.all(attachments.map(async (file) => {
      const reader = new FileReader();
      return new Promise<{mimeType: string, data: string, name: string}>((resolve) => {
        reader.onload = (e) => resolve({
          mimeType: file.type,
          data: (e.target?.result as string).split(',')[1],
          name: file.name
        });
        reader.readAsDataURL(file);
      });
    }));

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      text,
      timestamp: Date.now(),
      attachments: formattedAttachments
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      if (selectedModel === ModelType.Image) {
        // Image Generation Flow
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: botMsgId,
            role: MessageRole.Model,
            text: '',
            timestamp: Date.now(),
            isThinking: true
        }]);

        const imageBase64 = await generateImage(text);
        
        setMessages(prev => prev.map(m => m.id === botMsgId ? {
            ...m,
            isThinking: false,
            generatedImage: imageBase64,
            text: `Generated image for: "${text}"`
        } : m));

      } else {
        // Chat Flow
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: botMsgId,
            role: MessageRole.Model,
            text: '',
            timestamp: Date.now(),
            isThinking: true
        }]);

        let fullText = '';
        await streamChatResponse(
          messages,
          text,
          formattedAttachments,
          selectedModel,
          useSearch,
          useThinking,
          (chunkText, grounding) => {
            fullText += chunkText;
            setMessages(prev => prev.map(m => m.id === botMsgId ? {
                ...m,
                text: fullText,
                isThinking: false,
                groundingSources: grounding || m.groundingSources
            } : m));
          }
        );
      }

    } catch (error: any) {
        console.error(error);
        let errorMessage = "Error: Could not connect to Ada Orchestrator.";
        if (error.message === 'API_QUOTA_EXCEEDED') {
           errorMessage = "⚠️ **SYSTEM ALERT: RESOURCE EXHAUSTED**\n\nThe API quota has been exceeded. Please check billing or wait before sending new requests.\n\n*Status: Standby Mode*";
        }

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: MessageRole.System,
            text: errorMessage,
            timestamp: Date.now()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setLogs([]);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-40">
        <div className="font-bold text-lg">Ada Orchestrator</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
           <Menu />
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <div className={`${mobileMenuOpen ? 'absolute inset-0 z-50 bg-zinc-950' : 'hidden'} md:relative md:block`}>
        <div className="md:hidden absolute top-4 right-4">
           <button onClick={() => setMobileMenuOpen(false)}><Menu /></button>
        </div>
        <Sidebar 
           onClear={handleClear} 
           nodeStates={nodeStates}
           activeChannel={activeChannel}
           onChannelChange={setActiveChannel}
           isMonitoring={isMonitoring}
           onMonitoringToggle={() => setIsMonitoring(!isMonitoring)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Header with VHF Status */}
        <div className="h-14 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-end px-4 gap-4">
           <div className="flex items-center gap-2">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Scanning</div>
              <div className="flex gap-1">
                 {['16', '73', '06'].map(ch => (
                    <div key={ch} className={`w-1.5 h-1.5 rounded-full ${activeChannel === 'SCAN' ? 'bg-green-500 animate-pulse' : activeChannel === ch ? 'bg-green-500' : 'bg-zinc-800'}`} style={{ animationDelay: ch === '73' ? '100ms' : ch === '06' ? '200ms' : '0ms' }} />
                 ))}
              </div>
           </div>
           <div className="h-4 w-px bg-zinc-800" />
           <button 
             onClick={() => setIsVoiceModalOpen(true)}
             className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded text-xs font-bold font-mono tracking-wide transition-colors"
           >
             <Radio size={12} />
             VHF {activeChannel === 'SCAN' ? 'SCAN' : activeChannel}
           </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
             <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === MessageRole.User && (
             <div className="flex justify-start w-full mb-6">
                <TypingIndicator />
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
           <InputArea 
              onSend={handleSend} 
              isLoading={isLoading}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              useSearch={useSearch}
              onToggleSearch={() => setUseSearch(!useSearch)}
              useThinking={useThinking}
              onToggleThinking={() => setUseThinking(!useThinking)}
              onStartVoice={() => setIsVoiceModalOpen(true)}
           />
           <div className="text-center text-[10px] text-zinc-600 mt-2 select-none">
              MARSHALL PROTOCOL ACTIVE. VIOLATIONS ARE LOGGED AUTOMATICALLY.
           </div>
        </div>
      </div>

      {/* Canvas (Operations Deck) */}
      <Canvas 
        logs={logs} 
        activeChannel={activeChannel}
        isMonitoring={isMonitoring}
      />

      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />

    </div>
  );
}

export default App;
