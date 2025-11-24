
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, AgentTraceLog, TrafficEntry, WeatherForecast, AgentAction, UserRole, ThemeMode } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse } from './services/geminiService';
import { TypingIndicator } from './components/TypingIndicator';
import { StatusBar } from './components/StatusBar';
import { AgentTraceModal } from './components/AgentTraceModal';
import { orchestratorService } from './services/orchestratorService';
import { marinaExpert } from './services/agents/marinaAgent';
import { wimMasterData } from './services/wimMasterData';
import { persistenceService, STORAGE_KEYS } from './services/persistence';
import { VoiceModal } from './components/VoiceModal';
import { DailyReportModal } from './components/DailyReportModal';
import { PassportScanner } from './components/PassportScanner';
import { TENANT_CONFIG } from './services/config';
import { Anchor } from 'lucide-react';

// --- SIMULATED USER DATABASE ---
const MOCK_USER_DATABASE: Record<UserRole, UserProfile> = {
  'GUEST': { id: 'usr_anonymous', name: 'Guest', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN' },
  'CAPTAIN': { id: 'usr_cpt_99', name: 'Cpt. Barbaros', role: 'CAPTAIN', clearanceLevel: 3, legalStatus: 'GREEN', contractId: 'CNT-2025-PHISEDELIA' },
  'GENERAL_MANAGER': { id: 'usr_gm_01', name: 'Levent Baktır', role: 'GENERAL_MANAGER', clearanceLevel: 5, legalStatus: 'GREEN' }
};

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.System,
  text: `ADA MARINA —— v3.2
  
Ada Stargate v3.2 Distributed Initialized
[ OK ] Ada Marina: Core System Active. [ OK ] Ada Sea: COLREGs Protocol Online. [ OK ] Ada Finance: Parasut/Iyzico Integrated. [ OK ] Ada Legal: RAG Knowledge Graph Ready.
System is operating in Distributed Mode via FastRTC Mesh. Authentication required for sensitive nodes.`,
  timestamp: Date.now()
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => persistenceService.load(STORAGE_KEYS.MESSAGES, [INITIAL_MESSAGE]));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  
  const [activeChannel, setActiveChannel] = useState('72');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [isRedAlert, setIsRedAlert] = useState(false); 

  const [userProfile, setUserProfile] = useState<UserProfile>(() => 
    persistenceService.load(STORAGE_KEYS.USER_PROFILE, MOCK_USER_DATABASE['GENERAL_MANAGER'])
  );

  const [logs, setLogs] = useState<any[]>(() => persistenceService.load(STORAGE_KEYS.LOGS, []));
  const [registry, setRegistry] = useState<RegistryEntry[]>(() => persistenceService.load(STORAGE_KEYS.REGISTRY, []));
  const [tenders, setTenders] = useState<Tender[]>(() => persistenceService.load(STORAGE_KEYS.TENDERS, wimMasterData.assets.tenders as Tender[]));
  const [trafficQueue, setTrafficQueue] = useState<TrafficEntry[]>(() => persistenceService.load(STORAGE_KEYS.TRAFFIC, []));
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>([]);
  const [vesselsInPort, setVesselsInPort] = useState(0); 
  
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({
      'ada.marina': 'connected', 'ada.sea': 'connected', 'ada.finance': 'connected', 'ada.legal': 'connected'
  });
  
  const [prefillText, setPrefillText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { persistenceService.save(STORAGE_KEYS.MESSAGES, messages); }, [messages]);
  useEffect(() => { 
      setVesselsInPort(542); // Mock based on image
      // Mock Weather
      setWeatherData([{ day: 'Today', temp: 24, condition: 'Sunny', windSpeed: 12, windDir: 'NW', alertLevel: 'NONE' }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string, attachments: File[]) => {
    const newMessage: Message = {
      id: Date.now().toString(), role: MessageRole.User, text, timestamp: Date.now(),
      attachments: [] // Simplified for this view
    };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
        const orchestratorResult = await orchestratorService.processRequest(text, userProfile, tenders);
        if (orchestratorResult.text) {
             setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: MessageRole.Model, text: orchestratorResult.text, timestamp: Date.now() }]);
        } else {
             // Fallback to Gemini
             streamChatResponse(
                [...messages, newMessage], selectedModel, useSearch, useThinking, registry, tenders, userProfile, vesselsInPort,
                (chunk) => {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last.role === MessageRole.Model) {
                            return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
                        }
                        return [...prev, { id: Date.now().toString(), role: MessageRole.Model, text: chunk, timestamp: Date.now() }];
                    });
                    setIsLoading(false);
                }
             );
        }
        setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050b14] text-zinc-300 font-sans overflow-hidden selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* COLUMN 1: SIDEBAR (Fixed Width) */}
      <div className="w-[260px] flex flex-col border-r border-zinc-800/50 bg-[#050b14]">
           <Sidebar 
             nodeStates={nodeStates} 
             activeChannel={activeChannel}
             onChannelChange={setActiveChannel}
             isMonitoring={isMonitoring}
             onMonitoringToggle={() => setIsMonitoring(!isMonitoring)}
             userProfile={userProfile}
             onRoleChange={(role) => setUserProfile(prev => ({ ...prev, role }))}
             onNodeClick={(node) => console.log(node)}
             isOpen={true}
             onClose={() => {}}
             isPanel={true}
           />
      </div>

      {/* COLUMN 2: MAIN CHAT (Fluid) */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#050b14]">
           {/* Tactical Header */}
           <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800/50 bg-[#050b14]">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-[0.2em] text-zinc-100 uppercase">ADA.MARINA</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">READY</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px] tracking-wider">
                    <span className="text-red-500 font-bold">N 40°57’46’’ E 28°39’49’’</span>
                    <span className="text-indigo-400">VHF CH {activeChannel} [AI ACTIVE]</span>
                </div>
           </header>

           {/* Chat Area */}
           <div className="flex-1 overflow-y-auto p-4 relative scroll-smooth custom-scrollbar">
                <div className="max-w-3xl mx-auto pt-10 pb-32">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} onAction={(txt) => handleSendMessage(txt, [])} />
                    ))}
                    {isLoading && <div className="ml-12"><TypingIndicator /></div>}
                    <div ref={messagesEndRef} />
                </div>
           </div>

           {/* Footer Input Deck */}
           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#050b14] via-[#050b14] to-transparent z-20">
                <div className="max-w-3xl mx-auto">
                    <InputArea 
                        onSend={handleSendMessage}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        onInitiateVhfCall={() => setIsVoiceOpen(true)}
                        onInitiateScanner={() => setIsScannerOpen(true)}
                        onToggleRedAlert={() => setIsRedAlert(!isRedAlert)}
                        isRedAlert={isRedAlert}
                        isMonitoring={isMonitoring}
                        useSearch={useSearch}
                        onToggleSearch={() => setUseSearch(!useSearch)}
                        useThinking={useThinking}
                        onToggleThinking={() => setUseThinking(!useThinking)}
                        prefillText={prefillText}
                        onPrefillConsumed={() => setPrefillText('')}
                    />
                    <div className="mt-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-red-900/50 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-red-900/50 rounded-full"></div>
                        THIS CONVERSATION IS BEING RECORDED / RECORDED LINE
                    </div>
                </div>
           </div>
      </main>

      {/* COLUMN 3: OPERATIONS DECK (Fixed Width) */}
      <div className="w-[400px] flex flex-col border-l border-zinc-800/50 bg-[#050b14]">
            <Canvas 
              logs={logs}
              registry={registry}
              tenders={tenders}
              trafficQueue={trafficQueue}
              weatherData={weatherData}
              activeChannel={activeChannel}
              isMonitoring={isMonitoring}
              userProfile={userProfile}
              vesselsInPort={vesselsInPort}
              agentTraces={[]}
              onCheckIn={() => {}}
              onOpenTrace={() => {}}
              onGenerateReport={() => {}}
              onNodeClick={() => {}}
              isOpen={true}
              onClose={() => {}}
              activeTab={'fleet'}
              onTabChange={() => {}}
              isPanel={true}
              isRedAlert={isRedAlert}
            />
            
            {/* Status Footer */}
            <div className="h-8 border-t border-zinc-800/50 flex items-center justify-between px-4 text-[9px] font-mono text-zinc-600 bg-[#050b14]">
                <div className="flex gap-3">
                    <span><span className="text-zinc-400">CH</span> {activeChannel}</span>
                    <span><span className="text-zinc-400">LAT</span> 12ms</span>
                </div>
                <div className="uppercase font-bold tracking-wider text-zinc-500">LOGIN</div>
            </div>
      </div>

      {/* Modals */}
      <VoiceModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} userProfile={userProfile} onTranscriptReceived={(u,m) => handleSendMessage(u, [])} />
      <PassportScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanComplete={(r) => setPrefillText(r.type === 'PASSPORT' ? `Identity Verified: ${r.data.name} (${r.data.id}). Process Check-in.` : `Payment Method Verified: ${r.data.network} ${r.data.number} (${r.data.holder}). Valid: ${r.data.expiry}. Provision required.`)} />
    </div>
  );
}
