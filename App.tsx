
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, AgentAction, VhfLog, AisTarget } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { BootSequence } from './components/BootSequence';
import { VoiceModal } from './components/VoiceModal';
import { PassportScanner } from './components/PassportScanner';
import { AgentTraceModal } from './components/AgentTraceModal';
import { DailyReportModal } from './components/DailyReportModal';
import { streamChatResponse } from './services/geminiService';
import { orchestratorService } from './services/orchestratorService';
import { marinaExpert } from './services/agents/marinaAgent';
import { wimMasterData } from './services/wimMasterData';
import { persistenceService, STORAGE_KEYS } from './services/persistence';
import { Menu, Radio, Activity, MessageSquare } from 'lucide-react';

// --- SIMULATED USER DATABASE ---
const MOCK_USER_DATABASE: Record<string, UserProfile> = {
  'GUEST': { id: 'usr_anonymous', name: 'Guest', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN' },
  'CAPTAIN': { id: 'usr_cpt_99', name: 'Cpt. Barbaros', role: 'CAPTAIN', clearanceLevel: 3, legalStatus: 'GREEN', contractId: 'CNT-2025-PHISEDELIA' },
  'GENERAL_MANAGER': { id: 'usr_gm_01', name: 'Levent Baktır', role: 'GENERAL_MANAGER', clearanceLevel: 5, legalStatus: 'GREEN' }
};

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.System,
  text: 'SYSTEM READY',
  timestamp: Date.now()
};

// Initial Fake Logs for Observer
const BOOT_TRACES: any[] = [
    { id: 'boot_1', timestamp: '08:00:01', node: 'ada.stargate', step: 'THINKING', content: 'Initializing Distributed Node Mesh...', persona: 'ORCHESTRATOR' },
    { id: 'boot_2', timestamp: '08:00:02', node: 'ada.marina', step: 'TOOL_EXECUTION', content: 'Connecting to Kpler AIS Stream (Region: WIM)...', persona: 'WORKER' },
    { id: 'boot_3', timestamp: '08:00:03', node: 'ada.marina', step: 'OUTPUT', content: 'AIS Stream Active. 12 Vessels tracked in sector.', persona: 'EXPERT' },
    { id: 'boot_4', timestamp: '08:00:04', node: 'ada.finance', step: 'TOOL_EXECUTION', content: 'Syncing with Garanti BBVA API...', persona: 'WORKER' },
    { id: 'boot_5', timestamp: '08:00:05', node: 'ada.vhf', step: 'OUTPUT', content: 'Listening on Ch 72 / 16. Audio Stream Ready.', persona: 'WORKER' },
];

export default function App() {
  // --- STATE ---
  const [isBooting, setIsBooting] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() => persistenceService.load(STORAGE_KEYS.MESSAGES, [INITIAL_MESSAGE]));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  
  // Layout State (Resizable)
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [opsWidth, setOpsWidth] = useState(400);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingOps, setIsResizingOps] = useState(false);
  
  // Mobile Navigation State
  const [activeMobileTab, setActiveMobileTab] = useState<'nav' | 'comms' | 'ops'>('comms');

  // Modals & UI Flags
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Context & Ops Data
  const [userProfile, setUserProfile] = useState<UserProfile>(() => persistenceService.load(STORAGE_KEYS.USER_PROFILE, MOCK_USER_DATABASE['CAPTAIN']));
  const [tenders, setTenders] = useState<Tender[]>(() => persistenceService.load(STORAGE_KEYS.TENDERS, wimMasterData.assets.tenders as Tender[]));
  const [registry, setRegistry] = useState<RegistryEntry[]>(() => persistenceService.load(STORAGE_KEYS.REGISTRY, []));
  const [vesselsInPort, setVesselsInPort] = useState(542);
  const [agentTraces, setAgentTraces] = useState<any[]>(BOOT_TRACES);
  
  // NEW: VHF Traffic Logs
  const [vhfLogs, setVhfLogs] = useState<VhfLog[]>([]); 
  
  // NEW: Live AIS Targets
  const [aisTargets, setAisTargets] = useState<AisTarget[]>([]);

  // UI State
  const [activeChannel, setActiveChannel] = useState('72');
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---

  // Boot Sequence
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  // Smart Auto-Scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Only scroll if user is already near the bottom OR if it's the very first load
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeMobileTab]);

  // AIS Polling (Every 10s)
  useEffect(() => {
    const fetchAis = async () => {
        const lat = wimMasterData.identity.location.coordinates.lat;
        const lng = wimMasterData.identity.location.coordinates.lng;
        const targets = await marinaExpert.scanSector(lat, lng, 20, () => {});
        setAisTargets(targets);
    };
    
    fetchAis(); // Initial fetch
    const interval = setInterval(fetchAis, 10000);
    return () => clearInterval(interval);
  }, []);

  // Resizing Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = Math.max(200, Math.min(400, e.clientX));
        setSidebarWidth(newWidth);
      }
      if (isResizingOps) {
        const newWidth = Math.max(300, Math.min(600, window.innerWidth - e.clientX));
        setOpsWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingOps(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingSidebar || isResizingOps) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingOps]);

  // Node Heartbeat Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const nodes = ['ada.vhf', 'ada.sea', 'ada.marina', 'ada.finance', 'ada.customer', 'ada.passkit', 'ada.legal'];
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      
      setNodeStates(prev => ({
        ...prev,
        [randomNode]: 'working'
      }));

      setTimeout(() => {
        setNodeStates(prev => ({
          ...prev,
          [randomNode]: 'connected'
        }));
      }, 800);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC HANDLERS ---

  const handleAgentAction = useCallback((action: AgentAction) => {
    console.log("Executing Agent Action:", action);

    if (action.name === 'ada.marina.tenderReserved') {
        const { tenderId, mission, vessel } = action.params;
        setTenders(prev => prev.map(t => 
            t.id === tenderId 
            ? { ...t, status: 'Busy', assignment: `${vessel} (${mission})` } 
            : t
        ));
    }
    
    if (action.name === 'ada.marina.updateTrafficStatus') {
        const { vessel, status, destination } = action.params;
        const newEntry: RegistryEntry = {
            id: `reg-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            vessel: vessel,
            action: status === 'INBOUND' ? 'CHECK-IN' : 'CHECK-OUT',
            location: destination || 'SEA',
            status: 'PENDING'
        };
        setRegistry(prev => [newEntry, ...prev].slice(0, 10));
        if (status === 'INBOUND') setVesselsInPort(p => p + 1);
        if (status === 'TAXIING' || status === 'OUTBOUND') setVesselsInPort(p => p - 1);
    }
  }, []);

  const processCommand = async (text: string, addToChat: boolean = true) => {
      setIsLoading(true);
      
      const tempMsgId = Date.now().toString();
      if (addToChat) {
          const newMessage: Message = { id: tempMsgId, role: MessageRole.User, text, timestamp: Date.now() };
          setMessages(prev => [...prev, newMessage]);
      }

      try {
        // 1. Run Orchestrator (The Brain)
        const orchestratorResult = await orchestratorService.processRequest(text, userProfile, tenders);
        
        if (orchestratorResult.traces) {
            setAgentTraces(prev => [...orchestratorResult.traces, ...prev]);
        }

        if (orchestratorResult.actions) {
            orchestratorResult.actions.forEach(handleAgentAction);
        }

        // 3. Response Strategy
        if (orchestratorResult.text) {
             if (addToChat) {
                 setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: MessageRole.Model, text: orchestratorResult.text, timestamp: Date.now() }]);
             }
             setIsLoading(false);
             return orchestratorResult.text; 
        } else {
            // Fallback to LLM Streaming
            if (addToChat) {
                await streamChatResponse(
                  [...messages, { id: tempMsgId, role: MessageRole.User, text, timestamp: Date.now() }],
                  selectedModel,
                  false,
                  false,
                  registry,
                  tenders,
                  userProfile,
                  vesselsInPort,
                  (chunk) => {
                    setMessages(prev => {
                      const last = prev[prev.length - 1];
                      if (last.role === MessageRole.Model && last.id !== tempMsgId) {
                        return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
                      }
                      return [...prev, { id: Date.now().toString(), role: MessageRole.Model, text: chunk, timestamp: Date.now() }];
                    });
                    setIsLoading(false);
                  }
                );
            }
        }

    } catch (error) {
      console.error(error);
      if (addToChat) setMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.Model, text: "**SYSTEM ERROR:** Connection lost.", timestamp: Date.now() }]);
      setIsLoading(false);
    }
  };

  const handleSendMessage = (text: string, attachments: File[]) => {
      processCommand(text, true);
  };

  const handleVoiceTranscript = (userText: string, modelText: string) => {
      const timestamp = new Date().toLocaleTimeString();
      
      const newLogs: VhfLog[] = [
          { id: `vhf-${Date.now()}-u`, timestamp, channel: activeChannel, speaker: 'VESSEL', message: userText },
          { id: `vhf-${Date.now()}-m`, timestamp, channel: activeChannel, speaker: 'CONTROL', message: modelText }
      ];
      setVhfLogs(prev => [...newLogs, ...prev]);

      setMessages(prev => [
          ...prev, 
          { id: Date.now().toString(), role: MessageRole.User, text: `[VHF CH${activeChannel}] ${userText}`, timestamp: Date.now() },
          { id: (Date.now()+1).toString(), role: MessageRole.Model, text: modelText, timestamp: Date.now() }
      ]);

      orchestratorService.processRequest(userText, userProfile, tenders).then(result => {
          if (result.actions) {
              result.actions.forEach(handleAgentAction);
          }
          if (result.traces) {
              setAgentTraces(prev => [...result.traces, ...prev]);
          }
      });
  };

  const handleScanResult = (result: any) => {
      if (result.type === 'PASSPORT') {
          handleSendMessage(`Identity verified: ${result.data.name} (${result.data.id}). Process Check-in.`, []);
      } else if (result.type === 'CARD') {
          handleSendMessage(`Payment Method Verified: ${result.data.network} | ${result.data.number} | Valid: ${result.data.expiry}`, []);
      }
  };

  if (isBooting) return <BootSequence />;

  // --- LAYOUT COMPONENTS ---

  const ChatInterface = () => (
    <div className="flex flex-col h-full relative bg-[#050b14] w-full">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-[#050b14]/50 backdrop-blur-sm z-10 flex-shrink-0">
            <div className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase cursor-pointer hover:text-teal-500 transition-colors" onClick={() => setIsTraceOpen(true)}>
                ADA.MARINA <span className="text-zinc-700 mx-2">|</span> <span className="text-teal-500 animate-pulse">READY</span>
            </div>
            <div className="text-[9px] font-bold text-red-500 flex items-center gap-2 sm:gap-4">
                <span className="hidden sm:inline">N 40°57’46’’ E 28°39’49’’</span>
                <span className="text-zinc-600 bg-zinc-900 px-2 py-1 rounded border border-white/5">VHF {activeChannel}</span>
            </div>
        </div>

        {/* Messages Feed - FLUID SCROLL AREA */}
        <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6" 
            ref={scrollContainerRef}
        >
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area - STATIC BLOCK */}
        <div className="flex-shrink-0 bg-[#050b14] border-t border-white/5 pt-4 pb-6 px-4 sm:px-6 z-20">
            <InputArea 
                onSend={handleSendMessage}
                isLoading={isLoading}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                userRole={userProfile.role}
                onQuickAction={(text) => handleSendMessage(text, [])}
                onScanClick={() => setIsScannerOpen(true)}
                onRadioClick={() => setIsVoiceOpen(true)}
            />
        </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-screen bg-black text-zinc-300 overflow-hidden font-mono flex flex-col lg:flex-row">
        
        {/* --- MOBILE LAYOUT (TABS) --- */}
        <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden relative">
                {/* TAB: NAV */}
                <div className={`absolute inset-0 bg-[#050b14] transition-transform duration-300 ${activeMobileTab === 'nav' ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar 
                        nodeStates={nodeStates}
                        activeChannel={activeChannel}
                        isMonitoring={true}
                        userProfile={userProfile}
                        onRoleChange={(r) => setUserProfile(prev => ({ ...prev, role: r as any }))}
                        onVhfClick={() => setIsVoiceOpen(true)}
                        onScannerClick={() => setIsScannerOpen(true)}
                        onPulseClick={() => setIsReportOpen(true)}
                    />
                </div>

                {/* TAB: COMMS (Chat) */}
                <div className={`absolute inset-0 bg-[#050b14] transition-transform duration-300 ${activeMobileTab === 'comms' ? 'translate-x-0' : activeMobileTab === 'nav' ? 'translate-x-full' : '-translate-x-full'}`}>
                    <ChatInterface />
                </div>

                {/* TAB: OPS */}
                <div className={`absolute inset-0 bg-[#050b14] transition-transform duration-300 ${activeMobileTab === 'ops' ? 'translate-x-0' : 'translate-x-full'}`}>
                    <Canvas 
                        vesselsInPort={vesselsInPort}
                        registry={registry}
                        tenders={tenders}
                        vhfLogs={vhfLogs}
                        aisTargets={aisTargets}
                        userProfile={userProfile}
                        onOpenReport={() => setIsReportOpen(true)}
                        onOpenTrace={() => setIsTraceOpen(true)}
                        agentTraces={agentTraces}
                    />
                </div>
            </div>

            {/* BOTTOM NAV BAR */}
            <div className="h-16 bg-[#0a121e] border-t border-white/5 flex items-center justify-around px-2 z-30 pb-safe">
                <button 
                    onClick={() => setActiveMobileTab('nav')}
                    className={`flex flex-col items-center gap-1 p-2 w-16 ${activeMobileTab === 'nav' ? 'text-teal-400' : 'text-zinc-600'}`}
                >
                    <Menu size={20} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">NAV</span>
                </button>
                <button 
                    onClick={() => setActiveMobileTab('comms')}
                    className={`flex flex-col items-center gap-1 p-2 w-16 ${activeMobileTab === 'comms' ? 'text-teal-400' : 'text-zinc-600'}`}
                >
                    <MessageSquare size={20} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">COMMS</span>
                </button>
                
                {/* Only show OPS for Authorized Roles */}
                {userProfile.role !== 'GUEST' && (
                    <button 
                        onClick={() => setActiveMobileTab('ops')}
                        className={`flex flex-col items-center gap-1 p-2 w-16 ${activeMobileTab === 'ops' ? 'text-teal-400' : 'text-zinc-600'}`}
                    >
                        <Activity size={20} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">OPS</span>
                    </button>
                )}
            </div>
        </div>

        {/* --- DESKTOP LAYOUT (GRID) --- */}
        <div className="hidden lg:flex h-full w-full">
            
            {/* SIDEBAR PANE */}
            <div style={{ width: sidebarWidth }} className="flex-shrink-0 h-full overflow-hidden relative">
                <Sidebar 
                    nodeStates={nodeStates}
                    activeChannel={activeChannel}
                    isMonitoring={true}
                    userProfile={userProfile}
                    onRoleChange={(r) => setUserProfile(prev => ({ ...prev, role: r as any }))}
                    onVhfClick={() => setIsVoiceOpen(true)}
                    onScannerClick={() => setIsScannerOpen(true)}
                    onPulseClick={() => setIsReportOpen(true)}
                />
            </div>

            {/* RESIZE HANDLE 1 */}
            <div 
                className="w-1 h-full bg-[#0a121e] hover:bg-teal-500/50 cursor-col-resize transition-colors z-50"
                onMouseDown={() => setIsResizingSidebar(true)}
            />

            {/* CENTER PANE (Chat) */}
            <div className="flex-1 h-full overflow-hidden min-w-[300px]">
                <ChatInterface />
            </div>

            {/* RESIZE HANDLE 2 */}
            <div 
                className="w-1 h-full bg-[#0a121e] hover:bg-teal-500/50 cursor-col-resize transition-colors z-50"
                onMouseDown={() => setIsResizingOps(true)}
            />

            {/* OPS PANE */}
            <div style={{ width: opsWidth }} className="flex-shrink-0 h-full overflow-hidden">
                <Canvas 
                    vesselsInPort={vesselsInPort}
                    registry={registry}
                    tenders={tenders}
                    vhfLogs={vhfLogs}
                    aisTargets={aisTargets}
                    userProfile={userProfile}
                    onOpenReport={() => setIsReportOpen(true)}
                    onOpenTrace={() => setIsTraceOpen(true)}
                    agentTraces={agentTraces}
                />
            </div>
        </div>

        {/* --- MODALS --- */}
        <VoiceModal 
            isOpen={isVoiceOpen} 
            onClose={() => setIsVoiceOpen(false)} 
            userProfile={userProfile}
            onTranscriptReceived={handleVoiceTranscript}
        />
        
        <PassportScanner 
            isOpen={isScannerOpen} 
            onClose={() => setIsScannerOpen(false)} 
            onScanComplete={handleScanResult}
        />

        <AgentTraceModal 
            isOpen={isTraceOpen}
            onClose={() => setIsTraceOpen(false)}
            traces={agentTraces}
        />

        <DailyReportModal 
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            registry={registry}
            logs={agentTraces} 
            vesselsInPort={vesselsInPort}
            userProfile={userProfile}
            weatherData={[{ day: 'Today', temp: 24, condition: 'Sunny', windSpeed: 12, windDir: 'NW' }]}
        />

    </div>
  );
}
