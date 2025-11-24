import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, AgentAction } from './types';
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

export default function App() {
  // --- STATE ---
  const [isBooting, setIsBooting] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() => persistenceService.load(STORAGE_KEYS.MESSAGES, [INITIAL_MESSAGE]));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  
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
  const [agentTraces, setAgentTraces] = useState<any[]>([]); // For Trace Modal
  
  // UI State
  const [activeChannel, setActiveChannel] = useState('72');
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---

  // Boot Sequence
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Node Heartbeat Simulation (Blinking Lights)
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
    // This connects the "Brain" (Orchestrator) to the "Body" (UI State)
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
    
    if (action.name === 'ada.passkit.generated') {
        // Handle PassKit generation visualization if needed
    }

    // Log operations to the chat or console could go here
  }, []);

  const handleSendMessage = async (text: string, attachments: File[]) => {
    const newMessage: Message = { id: Date.now().toString(), role: MessageRole.User, text, timestamp: Date.now() };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
        // 1. Run Orchestrator (Local Logic Layer)
        const orchestratorResult = await orchestratorService.processRequest(text, userProfile, tenders);
        
        // Capture traces
        if (orchestratorResult.traces) {
            setAgentTraces(prev => [...orchestratorResult.traces, ...prev]);
        }

        // 2. Execute Actions (Side Effects)
        if (orchestratorResult.actions) {
            orchestratorResult.actions.forEach(handleAgentAction);
        }

        // 3. Decide Response Strategy
        if (orchestratorResult.text) {
             // Immediate Local Response (No LLM Cost)
             setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: MessageRole.Model, text: orchestratorResult.text, timestamp: Date.now() }]);
             setIsLoading(false);
        } else {
            // Fallback to Gemini LLM
            await streamChatResponse(
              [...messages, newMessage],
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
                  if (last.role === MessageRole.Model && last.id !== newMessage.id) { // Ensure we append to a model message
                    return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
                  }
                  return [...prev, { id: Date.now().toString(), role: MessageRole.Model, text: chunk, timestamp: Date.now() }];
                });
                setIsLoading(false);
              }
            );
        }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.Model, text: "**SYSTEM ERROR:** Connection lost. Please retry.", timestamp: Date.now() }]);
      setIsLoading(false);
    }
  };

  const handleScanResult = (result: any) => {
      if (result.type === 'PASSPORT') {
          handleSendMessage(`Identity verified: ${result.data.name} (${result.data.id}). Process Check-in.`, []);
      } else if (result.type === 'CARD') {
          handleSendMessage(`Payment Method Verified: ${result.data.network} | ${result.data.number} | Valid: ${result.data.expiry}`, []);
      }
  };

  if (isBooting) return <BootSequence />;

  return (
    <div className="h-screen w-screen bg-black text-zinc-300 overflow-hidden grid grid-cols-[260px_1fr_400px] font-mono gap-1">
        
        {/* COL 1: SIDEBAR (ADA EXPLORER) */}
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

        {/* COL 2: MAIN CHAT (COMMAND CAPSULE) */}
        <div className="flex flex-col h-full relative bg-[#050b14]">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#050b14]/50 backdrop-blur-sm z-10">
                <div className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase cursor-pointer hover:text-teal-500 transition-colors" onClick={() => setIsTraceOpen(true)}>
                    ADA.MARINA <span className="text-zinc-700 mx-2">|</span> <span className="text-teal-500 animate-pulse">READY</span>
                </div>
                <div className="text-[9px] font-bold text-red-500 flex items-center gap-4">
                    <span>N 40°57’46’’ E 28°39’49’’</span>
                    <span className="text-zinc-600">VHF CH {activeChannel} [AI ACTIVE]</span>
                </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar space-y-6">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050b14] via-[#050b14] to-transparent pt-10 pb-6 px-6">
                <InputArea 
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    userRole={userProfile.role}
                    onQuickAction={(text) => handleSendMessage(text, [])}
                />
            </div>
        </div>

        {/* COL 3: OPERATIONS DECK */}
        <Canvas 
            vesselsInPort={vesselsInPort}
            registry={registry}
            tenders={tenders}
        />

        {/* MODALS */}
        <VoiceModal 
            isOpen={isVoiceOpen} 
            onClose={() => setIsVoiceOpen(false)} 
            userProfile={userProfile}
            onTranscriptReceived={(user, model) => {
                setMessages(prev => [
                    ...prev, 
                    { id: Date.now().toString(), role: MessageRole.User, text: user, timestamp: Date.now() },
                    { id: (Date.now()+1).toString(), role: MessageRole.Model, text: model, timestamp: Date.now() }
                ]);
            }}
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
            logs={[]}
            vesselsInPort={vesselsInPort}
            userProfile={userProfile}
            weatherData={[{ day: 'Today', temp: 24, condition: 'Sunny', windSpeed: 12, windDir: 'NW' }]}
        />

    </div>
  );
}