
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, AgentAction, VhfLog, AisTarget, ThemeMode } from './types';
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
import { passkitExpert } from './services/agents/passkitAgent';
import { wimMasterData } from './services/wimMasterData';
import { persistenceService, STORAGE_KEYS } from './services/persistence';
import { Menu, Radio, Activity, MessageSquare, Sun, Moon, Monitor, Anchor } from 'lucide-react';

// --- SIMULATED USER DATABASE ---
const MOCK_USER_DATABASE: Record<string, UserProfile> = {
  'GUEST': { id: 'usr_anonymous', name: 'Misafir', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN' },
  'CAPTAIN': { id: 'usr_cpt_99', name: 'Kpt. Barbaros', role: 'CAPTAIN', clearanceLevel: 3, legalStatus: 'GREEN', contractId: 'CNT-2025-PHISEDELIA' },
  'GENERAL_MANAGER': { id: 'usr_gm_01', name: 'Levent Baktır', role: 'GENERAL_MANAGER', clearanceLevel: 5, legalStatus: 'GREEN' }
};

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.System,
  text: 'SYSTEM READY',
  timestamp: Date.now()
};

const BOOT_TRACES: any[] = [
    { id: 'boot_1', timestamp: '08:00:01', node: 'ada.stargate', step: 'THINKING', content: 'Initializing Distributed Node Mesh...', persona: 'ORCHESTRATOR' },
    { id: 'boot_2', timestamp: '08:00:02', node: 'ada.marina', step: 'TOOL_EXECUTION', content: 'Connecting to Kpler AIS Stream (Region: WIM)...', persona: 'WORKER' },
];

// --- CHAT INTERFACE COMPONENT ---
interface ChatInterfaceProps {
    messages: Message[];
    activeChannel: string;
    isLoading: boolean;
    selectedModel: ModelType;
    userRole: any;
    theme: ThemeMode;
    onModelChange: (m: ModelType) => void;
    onSend: (text: string, attachments: File[]) => void;
    onQuickAction: (text: string) => void;
    onScanClick: () => void;
    onRadioClick: () => void;
    onTraceClick: () => void;
    onToggleTheme: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    activeChannel,
    isLoading,
    selectedModel,
    userRole,
    theme,
    onModelChange,
    onSend,
    onQuickAction,
    onScanClick,
    onRadioClick,
    onTraceClick,
    onToggleTheme
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isUserAtBottomRef = useRef(true);

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const threshold = 100;
        const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        isUserAtBottomRef.current = distanceToBottom < threshold;
    }, []);

    useLayoutEffect(() => {
        if (isUserAtBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-[#050b14] relative">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-[#050b14]/80 backdrop-blur-md z-10 flex-shrink-0">
                <div className="flex items-center gap-2 cursor-pointer" onClick={onTraceClick}>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 tracking-[0.2em] uppercase">
                        ADA.MARINA
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-zinc-100 dark:bg-white/5 rounded border border-zinc-200 dark:border-white/10">
                        <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">VHF {activeChannel}</span>
                    </div>
                    <button 
                        onClick={onToggleTheme}
                        className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 transition-colors"
                    >
                        {theme === 'light' ? <Sun size={14} /> : theme === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
                    </button>
                </div>
            </div>

            {/* Messages Area - Flex Grow to fill space */}
            <div 
                className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-6 custom-scrollbar scroll-smooth" 
                ref={scrollContainerRef}
                onScroll={handleScroll}
            >
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area - Fixed at bottom of flex container */}
            <div className="flex-shrink-0 bg-zinc-50 dark:bg-[#050b14] border-t border-zinc-200 dark:border-white/5 p-2 sm:p-4 pb-4 sm:pb-6 z-20">
                <InputArea 
                    onSend={onSend}
                    isLoading={isLoading}
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    userRole={userRole}
                    onQuickAction={onQuickAction}
                    onScanClick={onScanClick}
                    onRadioClick={onRadioClick}
                />
            </div>
        </div>
    );
};

export default function App() {
  // --- STATE ---
  const [isBooting, setIsBooting] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() => persistenceService.load(STORAGE_KEYS.MESSAGES, [INITIAL_MESSAGE]));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  const [theme, setTheme] = useState<ThemeMode>(() => persistenceService.load(STORAGE_KEYS.THEME, 'dark'));
  
  // Layout
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [opsWidth, setOpsWidth] = useState(400);
  const [activeMobileTab, setActiveMobileTab] = useState<'nav' | 'comms' | 'ops'>('comms');

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Data
  const [userProfile, setUserProfile] = useState<UserProfile>(() => persistenceService.load(STORAGE_KEYS.USER_PROFILE, MOCK_USER_DATABASE['CAPTAIN']));
  const [tenders, setTenders] = useState<Tender[]>(() => persistenceService.load(STORAGE_KEYS.TENDERS, wimMasterData.assets.tenders as Tender[]));
  const [registry, setRegistry] = useState<RegistryEntry[]>(() => persistenceService.load(STORAGE_KEYS.REGISTRY, []));
  const [vesselsInPort, setVesselsInPort] = useState(542);
  const [agentTraces, setAgentTraces] = useState<any[]>(BOOT_TRACES);
  const [vhfLogs, setVhfLogs] = useState<VhfLog[]>([]); 
  const [aisTargets, setAisTargets] = useState<AisTarget[]>([]);
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({});
  const [activeChannel, setActiveChannel] = useState('72');

  // --- INITIALIZATION ---
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2000); // Faster boot
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'auto') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(systemDark ? 'dark' : 'light');
    } else {
        root.classList.add(theme);
    }
    persistenceService.save(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Node Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      const nodes = ['ada.vhf', 'ada.sea', 'ada.marina', 'ada.finance'];
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      setNodeStates(prev => ({ ...prev, [randomNode]: 'working' }));
      setTimeout(() => setNodeStates(prev => ({ ...prev, [randomNode]: 'connected' })), 800);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---
  const toggleTheme = () => {
      setTheme(curr => curr === 'auto' ? 'light' : curr === 'light' ? 'dark' : 'auto');
  };

  const handleRoleChange = (newRole: string) => {
      const profile = MOCK_USER_DATABASE[newRole];
      if (profile) {
          setUserProfile(profile);
          persistenceService.save(STORAGE_KEYS.USER_PROFILE, profile);
          // Auto-switch tabs based on role capability
          if (newRole === 'GUEST' && activeMobileTab === 'nav') setActiveMobileTab('ops');
      }
  };

  const handleVhfClick = (channel: string) => {
      setActiveChannel(channel);
      setIsVoiceOpen(true);
  };

  const handleSendMessage = (text: string, attachments: File[]) => {
      setIsLoading(true);
      const tempMsg: Message = { id: Date.now().toString(), role: MessageRole.User, text, timestamp: Date.now() };
      setMessages(prev => [...prev, tempMsg]);

      // Process
      orchestratorService.processRequest(text, userProfile, tenders).then(res => {
          if (res.traces) setAgentTraces(prev => [...res.traces, ...prev]);
          if (res.actions) {
              res.actions.forEach(act => {
                  if (act.name === 'ada.ui.openModal') {
                      if (act.params.modal === 'SCANNER') setIsScannerOpen(true);
                  }
              });
          }
          
          const responseMsg: Message = { id: (Date.now()+1).toString(), role: MessageRole.Model, text: res.text, timestamp: Date.now() };
          setMessages(prev => [...prev, responseMsg]);
          setIsLoading(false);
      }).catch(() => setIsLoading(false));
  };

  const handleVoiceTranscript = (userText: string, modelText: string) => {
      const newLogs: VhfLog[] = [
          { id: `vhf-${Date.now()}-u`, timestamp: new Date().toLocaleTimeString(), channel: activeChannel, speaker: 'VESSEL', message: userText },
          { id: `vhf-${Date.now()}-m`, timestamp: new Date().toLocaleTimeString(), channel: activeChannel, speaker: 'CONTROL', message: modelText }
      ];
      setVhfLogs(prev => [...newLogs, ...prev]);
      
      setMessages(prev => [
          ...prev, 
          { id: Date.now().toString(), role: MessageRole.User, text: `[VHF CH${activeChannel}] ${userText}`, timestamp: Date.now() },
          { id: (Date.now()+1).toString(), role: MessageRole.Model, text: modelText, timestamp: Date.now() }
      ]);
  };

  if (isBooting) return <BootSequence />;

  return (
    // MAIN CONTAINER: 100dvh handles mobile browser bars correctly
    <div className="h-[100dvh] w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-300 font-sans overflow-hidden flex flex-col lg:flex-row">
        
        {/* --- MOBILE VIEW --- */}
        <div className="lg:hidden flex flex-col h-full w-full relative overflow-hidden">
            
            {/* CONTENT AREA (Dynamic based on Tab) */}
            <div className="flex-1 overflow-hidden relative">
                {activeMobileTab === 'nav' && (
                    <div className="h-full w-full overflow-y-auto">
                        <Sidebar 
                            nodeStates={nodeStates}
                            activeChannel={activeChannel}
                            isMonitoring={true}
                            userProfile={userProfile}
                            onRoleChange={handleRoleChange}
                            onVhfClick={handleVhfClick}
                            onScannerClick={() => setIsScannerOpen(true)}
                            onPulseClick={() => setIsReportOpen(true)}
                        />
                    </div>
                )}
                
                {activeMobileTab === 'comms' && (
                    <ChatInterface 
                        messages={messages}
                        activeChannel={activeChannel}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        userRole={userProfile.role}
                        theme={theme}
                        onModelChange={setSelectedModel}
                        onSend={handleSendMessage}
                        onQuickAction={(text) => handleSendMessage(text, [])}
                        onScanClick={() => setIsScannerOpen(true)}
                        onRadioClick={() => setIsVoiceOpen(true)}
                        onTraceClick={() => setIsTraceOpen(true)}
                        onToggleTheme={toggleTheme}
                    />
                )}

                {activeMobileTab === 'ops' && (
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
                )}
            </div>

            {/* BOTTOM NAV BAR (Fixed Height) */}
            <div className="h-16 flex-shrink-0 bg-white dark:bg-[#0a121e] border-t border-zinc-200 dark:border-white/5 flex items-center justify-around px-2 z-50 pb-safe">
                <button 
                    onClick={() => setActiveMobileTab('nav')}
                    className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${activeMobileTab === 'nav' ? 'text-teal-500' : 'text-zinc-400'}`}
                >
                    <Menu size={20} />
                    <span className="text-[9px] font-bold">NAV</span>
                </button>
                <button 
                    onClick={() => setActiveMobileTab('comms')}
                    className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${activeMobileTab === 'comms' ? 'text-teal-500' : 'text-zinc-400'}`}
                >
                    <MessageSquare size={20} />
                    <span className="text-[9px] font-bold">CHAT</span>
                </button>
                <button 
                    onClick={() => setActiveMobileTab('ops')}
                    className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${activeMobileTab === 'ops' ? 'text-teal-500' : 'text-zinc-400'}`}
                >
                    <Activity size={20} />
                    <span className="text-[9px] font-bold">OPS</span>
                </button>
            </div>
        </div>

        {/* --- DESKTOP VIEW --- */}
        <div className="hidden lg:flex h-full w-full">
            {/* LEFT SIDEBAR */}
            <div style={{ width: sidebarWidth }} className="flex-shrink-0 h-full border-r border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#050b14]">
                <Sidebar 
                    nodeStates={nodeStates}
                    activeChannel={activeChannel}
                    isMonitoring={true}
                    userProfile={userProfile}
                    onRoleChange={handleRoleChange}
                    onVhfClick={handleVhfClick}
                    onScannerClick={() => setIsScannerOpen(true)}
                    onPulseClick={() => setIsReportOpen(true)}
                />
            </div>

            {/* CENTER CHAT */}
            <div className="flex-1 h-full min-w-[400px] border-r border-zinc-200 dark:border-white/5">
                <ChatInterface 
                    messages={messages}
                    activeChannel={activeChannel}
                    isLoading={isLoading}
                    selectedModel={selectedModel}
                    userRole={userProfile.role}
                    theme={theme}
                    onModelChange={setSelectedModel}
                    onSend={handleSendMessage}
                    onQuickAction={(text) => handleSendMessage(text, [])}
                    onScanClick={() => setIsScannerOpen(true)}
                    onRadioClick={() => setIsVoiceOpen(true)}
                    onTraceClick={() => setIsTraceOpen(true)}
                    onToggleTheme={toggleTheme}
                />
            </div>

            {/* RIGHT OPS CANVAS */}
            <div style={{ width: opsWidth }} className="flex-shrink-0 h-full bg-zinc-100 dark:bg-black">
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

        {/* MODALS */}
        <VoiceModal 
            isOpen={isVoiceOpen} 
            onClose={() => setIsVoiceOpen(false)} 
            userProfile={userProfile} 
            onTranscriptReceived={handleVoiceTranscript} 
            channel={activeChannel}
        />
        <PassportScanner 
            isOpen={isScannerOpen} 
            onClose={() => setIsScannerOpen(false)} 
            onScanComplete={(res) => handleSendMessage(`Identity Verified: ${res.data.name}`, [])} 
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
