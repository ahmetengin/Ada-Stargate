
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, UserRole, TrafficEntry, WeatherForecast } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse, generateImage } from './services/geminiService';
import { Menu, Anchor, ShieldAlert, Plus } from 'lucide-react';
import { VoiceModal } from './components/VoiceModal';
import { TypingIndicator } from './components/TypingIndicator';
import { StatusBar } from './components/StatusBar';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.Model,
  text: `**System Initialization Sequence**

**[ OK ]** SEAL Core: Synthetic Data Generation (ACTIVE)
**[ OK ]** Weather Station: Multi-Source Forecast (ONLINE)
**[ OK ]** Traffic Tower: ATC Logic Engaged (READY)
**[ OK ]** Marshall Protocol: Enforcing WIM Regulations (ENGAGED)

*Ada Maritime Intelligence is online. Waiting for Captain's orders.*`,
  timestamp: Date.now()
};

// Mock Data Generators
const VESSEL_NAMES = ['S/Y Phisedelia', 'M/Y Blue Horizon', 'S/Y Mistral', 'M/Y Poseidon', 'Catamaran Lir', 'S/Y Aegeas', 'Tender Bravo', 'M/Y Grand Turk'];
const LOCATIONS = ['Pontoon A-12', 'Pontoon C-05', 'Fuel Station', 'Dry Dock', 'Entrance Beacon', 'Technical Quay'];

export default function App() {
  // --- State: Chat & AI ---
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Pro);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);

  // --- State: Maritime Systems ---
  const [activeChannel, setActiveChannel] = useState('73');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);

  // --- State: Identity & Auth ---
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'guest-01',
    name: 'Guest User',
    role: 'GUEST',
    clearanceLevel: 0,
    legalStatus: 'GREEN'
  });

  // --- State: Simulation Data ---
  const [logs, setLogs] = useState<any[]>([]);
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([
    { id: 't1', name: 'Tender Alpha', status: 'Idle' },
    { id: 't2', name: 'Tender Bravo', status: 'Idle' },
    { id: 't3', name: 'Tender Charlie', status: 'Maintenance' },
  ]);
  
  // New Simulation States
  const [trafficQueue, setTrafficQueue] = useState<TrafficEntry[]>([
      { id: 'tr-1', vessel: 'M/Y Blue Horizon', status: 'INBOUND', priority: 5, sector: 'Approach Channel' }
  ]);
  
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>([
      { day: 'Today', temp: 22, condition: 'Sunny', windSpeed: 12, windDir: 'NW' },
      { day: 'Tomorrow', temp: 19, condition: 'Windy', windSpeed: 28, windDir: 'N', alertLevel: 'WARNING' },
      { day: 'Day 3', temp: 20, condition: 'Cloudy', windSpeed: 15, windDir: 'NE' },
  ]);
  
  // Node Statuses for Sidebar
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({
    'ada.vhf': 'connected',
    'ada.sea': 'connected',
    'ada.marina': 'connected',
    'ada.finance': 'connected',
    'ada.customer': 'connected',
    'ada.passkit': 'connected',
    'ada.legal': 'connected',
    'ada.security': 'connected',
    'ada.weather': 'connected',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Simulation Engine ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMonitoring) return;

      const random = Math.random();
      let newLog = null;

      // 1. VHF Traffic Simulation (Ch 16/73/12/13/14)
      if (random > 0.75) {
         const vessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
         if (random > 0.98) {
             newLog = { node: 'ada.vhf.wim', message: `[CH 16] MAYDAY RELAY - Vessel ${vessel} reporting fire.`, type: 'critical' };
         } else if (random > 0.96) {
             newLog = { node: 'ada.marina.wim', message: `[BROADCAST] ATTENTION ALL STATIONS. TRAFFIC CONGESTION. HOLD.`, type: 'alert' };
         } else if (random > 0.92) {
             newLog = { node: 'ada.security', message: `[CH 13] Security: Unidentified drone over Hangar B.`, type: 'warning' };
         } else {
             newLog = { node: 'ada.vhf.wim', message: `[CH 73] ${vessel}: Requesting radio check.`, type: 'info' };
         }
      } 
      // 2. Marshall Protocol (Traffic)
      else if (random < 0.03) {
         newLog = { node: 'ada.legal.wim', message: `MARSHALL ALERT: Speeding (Land). 34AB123 at 18km/h. Article G.1: Card Cancelled.`, type: 'critical' };
      }
      // 3. Weather Updates
      else if (random > 0.10 && random < 0.15) {
          // Occasionally update weather visuals too
          if (Math.random() > 0.5) {
             setWeatherData(prev => {
                 const newWind = prev[0].windSpeed + (Math.random() > 0.5 ? 2 : -2);
                 return [{ ...prev[0], windSpeed: Math.max(0, newWind) }, prev[1], prev[2]];
             });
          }
          newLog = { node: 'ada.weather.wim', message: `Windy Update: Gusts increasing to ${weatherData[0].windSpeed + 5} knots.`, type: 'warning' };
      }
      // 4. Traffic Tower Simulation
      else if (random > 0.30 && random < 0.35) {
          const actionVessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
          // 50% chance to add to queue, 50% chance to move existing
          if (Math.random() > 0.5 && trafficQueue.length < 5) {
             const newStatus = Math.random() > 0.5 ? 'INBOUND' : 'OUTBOUND';
             setTrafficQueue(prev => [...prev, { 
                 id: Math.random().toString(), 
                 vessel: actionVessel, 
                 status: newStatus, 
                 priority: 5, 
                 sector: newStatus === 'INBOUND' ? 'Approach' : 'Marina' 
             }]);
             newLog = { node: 'ada.marina.wim', message: `ATC: ${actionVessel} requesting ${newStatus} clearance.`, type: 'info' };
          } else if (trafficQueue.length > 0) {
             // Move a ship
             setTrafficQueue(prev => {
                 const next = [...prev];
                 const ship = next[0];
                 if (ship.status === 'INBOUND') ship.status = 'TAXIING';
                 else if (ship.status === 'OUTBOUND') ship.status = 'HOLDING';
                 else return next.slice(1); // Remove cleared ships
                 return next;
             });
          }
      }

      if (newLog) {
         const logEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            ...newLog
         };
         setLogs(prev => [logEntry, ...prev].slice(0, 100));
         
         const nodeKey = newLog.node.split('.')[0] + '.' + newLog.node.split('.')[1]; 
         if (nodeStates[nodeKey]) {
             setNodeStates(prev => ({ ...prev, [nodeKey]: 'working' }));
             setTimeout(() => setNodeStates(prev => ({ ...prev, [nodeKey]: 'connected' })), 800);
         }
      }

      // 5. Registry & Tender Sim (Existing logic retained)
      if (Math.random() > 0.95) {
          const vessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
          const action = Math.random() > 0.5 ? 'CHECK-IN' : 'CHECK-OUT';
          const entry: RegistryEntry = {
              id: Math.random().toString(36),
              timestamp: new Date().toLocaleTimeString(),
              vessel,
              action,
              location: action === 'CHECK-IN' ? LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)] : 'Open Sea',
              status: 'AUTHORIZED'
          };
          setRegistry(prev => [entry, ...prev].slice(0, 50));
      }
      if (Math.random() > 0.90) {
         const tenderIdx = Math.floor(Math.random() * 3); 
         const newStatus = Math.random() > 0.6 ? 'Busy' : 'Idle';
         const assignment = newStatus === 'Busy' ? `Assist ${VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)]}` : undefined;
         setTenders(prev => {
            const next = [...prev];
            if (next[tenderIdx].status !== 'Maintenance') next[tenderIdx] = { ...next[tenderIdx], status: newStatus, assignment };
            return next;
         });
      }

    }, 1200);

    return () => clearInterval(interval);
  }, [isMonitoring, nodeStates, trafficQueue, weatherData]);

  // --- Handlers ---

  const handleSend = async (text: string, attachments: File[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      text: text,
      timestamp: Date.now(),
      attachments: await Promise.all(attachments.map(async file => {
         const reader = new FileReader();
         return new Promise<any>((resolve) => {
            reader.onload = (e) => resolve({
               mimeType: file.type,
               data: (e.target?.result as string).split(',')[1],
               name: file.name
            });
            reader.readAsDataURL(file);
         });
      }))
    };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    const processedAttachments = newMessage.attachments || [];

    // Image Generation
    if (selectedModel === ModelType.Image) {
       const imageBase64 = await generateImage(text);
       setMessages(prev => [
         ...prev,
         { id: (Date.now() + 1).toString(), role: MessageRole.Model, text: "", generatedImage: imageBase64, timestamp: Date.now() }
       ]);
       setIsLoading(false);
       return;
    }

    let currentResponse = "";
    const responseId = (Date.now() + 1).toString();
    
    setMessages(prev => [...prev, { id: responseId, role: MessageRole.Model, text: "", timestamp: Date.now(), isThinking: true }]);

    await streamChatResponse(
      messages.concat(newMessage),
      text,
      processedAttachments,
      selectedModel,
      useSearch,
      useThinking,
      registry,
      tenders,
      userProfile,
      (chunk, grounding) => {
         currentResponse += chunk;
         setMessages(prev => prev.map(m => 
           m.id === responseId ? { ...m, text: currentResponse, isThinking: false, groundingSources: grounding } : m
         ));
      }
    );

    setIsLoading(false);
  };

  const toggleAuth = () => {
    if (userProfile.role === 'GUEST') {
        // Simulate Passkit Auth + Strict Legal Clearance
        const rand = Math.random();
        let legalStatus: 'GREEN' | 'AMBER' | 'RED' = 'GREEN';
        let breachReason = "";
        
        if (rand > 0.85) { legalStatus = 'RED'; breachReason = "ARTICLE H.2 (UNPAID DEBT > 60 DAYS)"; }
        else if (rand > 0.65) { legalStatus = 'AMBER'; breachReason = "CONTRACT EXPIRY < 30 DAYS"; }

        const seq = [
            { msg: "AUTHENTICATING...", type: 'info' },
            { msg: "DETECTED PASSKIT: PK-8821-X", type: 'warning' },
            { msg: "BIOMETRIC HANDSHAKE: RETINA_SCAN [OK]", type: 'success' },
            { msg: "CONNECTING TO ADA.LEGAL.WIM DATABASE...", type: 'info' }
        ];
        
        if (legalStatus === 'GREEN') {
             seq.push({ msg: "CHECKING CONTRACT STATUS... [ACTIVE]", type: 'success' });
             seq.push({ msg: "CHECKING OUTSTANDING PENALTIES... [NONE]", type: 'success' });
             seq.push({ msg: "LEGAL STANDING: VERIFIED.", type: 'success' });
             seq.push({ msg: "ACCESS GRANTED: LEVEL 5 (GM)", type: 'success' });
        } else if (legalStatus === 'AMBER') {
             seq.push({ msg: `LEGAL ALERT: ${breachReason}`, type: 'warning' });
             seq.push({ msg: "ACCESS GRANTED: LEVEL 5 (RESTRICTED)", type: 'warning' });
        } else {
             seq.push({ msg: `CRITICAL BREACH: ${breachReason}`, type: 'critical' });
             seq.push({ msg: "ENFORCEMENT PROTOCOL: DEPARTURE BAN ACTIVE", type: 'critical' });
             seq.push({ msg: "ACCESS RESTRICTED: READ-ONLY MODE", type: 'critical' });
        }
        
        let delay = 0;
        seq.forEach(s => {
            setTimeout(() => {
                setLogs(prev => [{
                    id: Math.random().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    node: s.msg.includes('LEGAL') || s.msg.includes('CONTRACT') ? 'ada.legal.wim' : 'ada.passkit',
                    message: s.msg,
                    type: s.type as any
                }, ...prev]);
            }, delay);
            delay += 800;
        });

        setTimeout(() => {
             setUserProfile({
                id: 'ahmet-engin-01',
                name: 'Ahmet Engin',
                role: 'GENERAL_MANAGER',
                clearanceLevel: 5,
                legalStatus: legalStatus
             });
        }, delay);

    } else {
        // Logout
        setUserProfile({ id: 'guest-01', name: 'Guest User', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN' });
        setLogs(prev => [{ id: Math.random().toString(), timestamp: new Date().toLocaleTimeString(), node: 'ada.passkit', message: "SESSION TERMINATED. REVERTING TO PUBLIC ACCESS.", type: 'warning' }, ...prev]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden">
      
      {/* MAIN WORKSPACE (Flex Row) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* 1. Sidebar (Controls) */}
          <Sidebar 
             nodeStates={nodeStates}
             activeChannel={activeChannel}
             onChannelChange={setActiveChannel}
             isMonitoring={isMonitoring}
             onMonitoringToggle={() => setIsMonitoring(!isMonitoring)}
             userProfile={userProfile}
          />

          {/* 2. Main Chat Area */}
          <div className="flex flex-col flex-1 relative min-w-0 border-r border-zinc-900/50">
            
            {/* Header */}
            <header className="h-10 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between px-3 flex-shrink-0">
               <div className="flex items-center gap-3">
                  <div className="md:hidden">
                     <Menu size={16} className="text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-2">
                     <ShieldAlert size={14} className={
                        userProfile.legalStatus === 'RED' ? 'text-red-500 animate-pulse' :
                        userProfile.legalStatus === 'AMBER' ? 'text-yellow-500' :
                        userProfile.role === 'GENERAL_MANAGER' ? 'text-indigo-500' : 'text-zinc-600'
                     } />
                     <span className={`font-mono font-bold text-xs tracking-wider ${
                        userProfile.legalStatus === 'RED' ? 'text-red-400' : 
                        userProfile.legalStatus === 'AMBER' ? 'text-yellow-400' : 'text-zinc-400'
                     }`}>
                        {userProfile.role === 'GENERAL_MANAGER' 
                           ? (userProfile.legalStatus === 'RED' ? 'OPS COMMAND [LOCKED - LEGAL]' : 
                              userProfile.legalStatus === 'AMBER' ? 'OPS COMMAND [WARNING]' : 'OPS COMMAND') 
                           : 'PUBLIC TERMINAL'}
                     </span>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                   <button onClick={() => setMessages([INITIAL_MESSAGE])} title="Reset Session" className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <Plus size={14} />
                   </button>
                   <button onClick={() => setIsCanvasOpen(!isCanvasOpen)} className="lg:hidden p-1 text-zinc-400 hover:text-zinc-200">
                      <Anchor size={16} />
                   </button>
               </div>
            </header>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && messages[messages.length - 1]?.role === MessageRole.User && (
                   <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-900">
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
            </div>
          </div>

          {/* 3. Operations Deck (Canvas) */}
          {isCanvasOpen && (
            <Canvas 
               logs={logs} 
               registry={registry}
               tenders={tenders}
               trafficQueue={trafficQueue}
               weatherData={weatherData}
               activeChannel={activeChannel}
               isMonitoring={isMonitoring}
               userProfile={userProfile}
            />
          )}
      </div>

      {/* GLOBAL STATUS BAR (Footer) */}
      <StatusBar 
         userProfile={userProfile}
         onToggleAuth={toggleAuth}
         nodeHealth="working"
         latency={12}
         activeChannel={activeChannel}
      />

      {/* Modals */}
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />

    </div>
  );
}
