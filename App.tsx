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
import { technicExpert } from './services/agents/technicAgent';
import { wimMasterData } from './services/wimMasterData';
import { Sun, Moon, Monitor, PanelLeft, PanelRight, AlertTriangle } from 'lucide-react';
import { persistenceService, STORAGE_KEYS } from './services/persistence';
import { VoiceModal } from './components/VoiceModal';
import { DailyReportModal } from './components/DailyReportModal';
import { TENANT_CONFIG } from './services/config';
import { formatCoordinate } from './services/utils';

// --- SIMULATED USER DATABASE (BACKEND REPLACEMENT) ---
const MOCK_USER_DATABASE: Record<UserRole, UserProfile> = {
  'GUEST': {
    id: 'usr_anonymous',
    name: 'Guest',
    role: 'GUEST',
    clearanceLevel: 0,
    legalStatus: 'GREEN'
  },
  'CAPTAIN': {
    id: 'usr_cpt_99',
    name: 'Cpt. Barbaros',
    role: 'CAPTAIN',
    clearanceLevel: 3,
    legalStatus: 'GREEN',
    contractId: 'CNT-2025-PHISEDELIA'
  },
  'GENERAL_MANAGER': {
    id: 'usr_gm_01',
    name: 'Levent Baktır',
    role: 'GENERAL_MANAGER',
    clearanceLevel: 5,
    legalStatus: 'GREEN'
  }
};

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.System,
  text: `Ada Stargate v3.2 Distributed Initialized

[ OK ] Ada Marina: Core System Active. [ OK ] Ada Sea: COLREGs Protocol Online. [ OK ] Ada Finance: Parasut/Iyzico Integrated. [ OK ] Ada Legal: RAG Knowledge Graph Ready.

System is operating in Distributed Mode via FastRTC Mesh. Authentication required for sensitive nodes.`,
  timestamp: Date.now()
};

const BootScreen = () => {
    const lines = [
        "INITIATING ADA STARGATE v3.2...",
        "ENCRYPTION HANDSHAKE WITH CORE...",
        "SYNCING DISTRIBUTED NODE STATES...",
        "AUTHENTICATING IDENTITY...",
        "CORE SYSTEMS ONLINE. WELCOME."
    ];
    const [visibleLines, setVisibleLines] = useState<string[]>([]);

    useEffect(() => {
        lines.forEach((line, index) => {
            setTimeout(() => {
                setVisibleLines(prev => [...prev, line]);
            }, (index + 1) * 400);
        });
    }, []);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-bg-dark font-mono text-emerald-400">
            <div className="text-left w-full max-w-md p-8">
                {visibleLines.map((line, index) => (
                    <p key={index} className="animate-in fade-in duration-500 text-sm">
                        <span className="text-zinc-600 mr-2">&gt;</span>{line}
                    </p>
                ))}
            </div>
        </div>
    );
};

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};


export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => persistenceService.load(STORAGE_KEYS.MESSAGES, [INITIAL_MESSAGE]));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Pro);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const [isBooting, setIsBooting] = useState(true);

  const [theme, setTheme] = useState<ThemeMode>(() => persistenceService.load(STORAGE_KEYS.THEME, 'dark'));

  const [agentTraces, setAgentTraces] = useState<AgentTraceLog[]>([]);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop); 
  const [isCanvasOpen, setIsCanvasOpen] = useState(isDesktop);
  const [activeCanvasTab, setActiveCanvasTab] = useState<'feed' | 'fleet' | 'tech' | 'ais' | 'map' | 'weather'>('feed');

  const [activeChannel, setActiveChannel] = useState('72');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => 
    persistenceService.load(STORAGE_KEYS.USER_PROFILE, MOCK_USER_DATABASE['GUEST'])
  );

  const [logs, setLogs] = useState<any[]>(() => persistenceService.load(STORAGE_KEYS.LOGS, []));
  const [registry, setRegistry] = useState<RegistryEntry[]>(() => persistenceService.load(STORAGE_KEYS.REGISTRY, []));
  const [tenders, setTenders] = useState<Tender[]>(() => persistenceService.load(STORAGE_KEYS.TENDERS, []));
  const [trafficQueue, setTrafficQueue] = useState<TrafficEntry[]>(() => persistenceService.load(STORAGE_KEYS.TRAFFIC, []));
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>([]);
  const [vesselsInPort, setVesselsInPort] = useState(0); 
  
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({});
  
  const [prefillText, setPrefillText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { persistenceService.save(STORAGE_KEYS.MESSAGES, messages); }, [messages]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.LOGS, logs); }, [logs]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.USER_PROFILE, userProfile); }, [userProfile]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.THEME, theme); }, [theme]);

  useEffect(() => {
      setVesselsInPort(marinaExpert.getAllFleetVessels().length);
      setWeatherData([
          { day: 'Today', temp: 24, condition: 'Sunny', windSpeed: 12, windDir: 'NW', alertLevel: 'NONE' },
          { day: 'Tomorrow', temp: 22, condition: 'Windy', windSpeed: 28, windDir: 'N', alertLevel: 'ADVISORY' },
          { day: 'Wed', temp: 19, condition: 'Rain', windSpeed: 15, windDir: 'NE', alertLevel: 'NONE' },
      ]);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    const effectiveTheme = theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
      : theme;
    root.classList.add(effectiveTheme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(current => (current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto'));
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={16} />;
    if (theme === 'dark') return <Moon size={16} />;
    return <Monitor size={16} />;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addLog = (log: any) => {
    setLogs(prev => [log, ...prev].slice(0, 200)); // Keep logs capped
  };

  const handleAgentAction = async (action: AgentAction) => {
      // (Implementation remains the same)
  };

  const handleSendMessage = async (text: string, attachments: File[]) => {
    const newMessage: Message = {
      id: Date.now().toString(), role: MessageRole.User, text, timestamp: Date.now(),
      attachments: await Promise.all(attachments.map(async (file) => ({
        mimeType: file.type,
        data: await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        }), name: file.name
      })))
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
        const orchestratorResult = await orchestratorService.processRequest(text, userProfile);
        setAgentTraces(orchestratorResult.traces);
        if (orchestratorResult.text) {
             setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: MessageRole.Model, text: orchestratorResult.text, timestamp: Date.now() }]);
             setIsLoading(false);
             return;
        }
    } catch (e) {
        console.error("Orchestrator Error:", e);
    }

    // Fallback to direct LLM call if orchestrator doesn't produce text
    const updatedMessages = [...messages, newMessage];
    let responseText = '';
    let currentMessageId = (Date.now() + 1).toString();
    
    setMessages(prev => [...prev, {
      id: currentMessageId, role: MessageRole.Model, text: '',
      timestamp: Date.now(), isThinking: useThinking
    }]);

    try {
      await streamChatResponse(
        updatedMessages, selectedModel, useSearch, useThinking, registry, tenders, userProfile, vesselsInPort,
        (chunk, grounding) => {
          responseText += chunk;
          setMessages(prev => prev.map(m => 
            m.id === currentMessageId ? { ...m, text: responseText, isThinking: false, groundingSources: grounding } : m
          ));
        }
      );
    } catch (error) {
      console.error("LLM Error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.Model, text: "**System Alert:** Connection to Ada Core interrupted. Please retry.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptReceived = (userText: string, modelText: string) => {
    if (!userText && !modelText) return;
    const timestamp = Date.now();
    const newMessages: Message[] = [];
    if (userText) newMessages.push({ id: `vhf-user-${timestamp}`, role: MessageRole.User, text: `[VHF] ${userText}`, timestamp });
    if (modelText) newMessages.push({ id: `vhf-model-${timestamp}`, role: MessageRole.Model, text: `[VHF] ${modelText}`, timestamp: timestamp + 1 });
    setMessages(prev => [...prev, ...newMessages]);
  };

  const handleNodeClick = (nodeId: string) => {
      setNodeStates(prev => ({ ...prev, [nodeId]: 'working' }));
      setTimeout(() => setNodeStates(prev => ({ ...prev, [nodeId]: 'connected' })), 800);
      const commands: Record<string, string> = { 'ada.finance': 'Generate an invoice for ' };
      if (commands[nodeId]) { setPrefillText(commands[nodeId]); if (!isDesktop) setIsSidebarOpen(false); }
  };

  const handleRoleChange = (role: UserRole) => {
      const newUser = MOCK_USER_DATABASE[role];
      setUserProfile(newUser);
      addLog({ id: `sys_auth_${Date.now()}`, timestamp: new Date().toLocaleTimeString(), source: 'ada.passkit', message: `Identity Switched: ${newUser.name} (${role}). Permissions updated.`, type: 'info' });
      if (!isDesktop) setIsSidebarOpen(false); 
  };

  const { lat, lng } = wimMasterData.identity.location.coordinates;
  const displayCoordinates = `${formatCoordinate(lat, 'lat')} / ${formatCoordinate(lng, 'lng')}`;
  const isGM = userProfile.role === 'GENERAL_MANAGER';
  
  if (isBooting) return <BootScreen />;

  return (
    <div className={`flex h-screen bg-brand-bg-light dark:bg-brand-bg-dark text-zinc-800 dark:text-zinc-200 font-sans overflow-hidden transition-colors duration-300`}>
      <div className="absolute inset-0 bg-grid-zinc-300/[0.2] dark:bg-grid-zinc-700/[0.2] [mask-image:linear-gradient(to_bottom,white_5%,transparent_50%)] dark:[mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)]"></div>
      
      {isGM && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isPanel={isDesktop} {...{ nodeStates, activeChannel, onChannelChange: setActiveChannel, isMonitoring, onMonitoringToggle: () => setIsMonitoring(!isMonitoring), userProfile, onRoleChange: handleRoleChange, onNodeClick: handleNodeClick }} />}
      
      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="h-14 border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 bg-panel-light/80 dark:bg-panel-dark/80 backdrop-blur-sm flex-shrink-0 z-20 font-mono">
           <div className="flex items-center gap-4">
              {isGM && (
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 -ml-2 text-zinc-500 dark:text-zinc-400" aria-label="Toggle Explorer">
                      <PanelLeft size={20} />
                  </button>
              )}
              <div>
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm tracking-widest">{TENANT_CONFIG.fullName}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Core Status: Operational" />
                  </div>
                   <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                      CTRL: CH 72
                   </div>
              </div>
          </div>

          <div className="hidden lg:block text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">
              {displayCoordinates}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={cycleTheme} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors">
                {getThemeIcon()}
            </button>
            
            {isGM && (
                <button onClick={() => setIsCanvasOpen(!isCanvasOpen)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors" title="Toggle Operations Desk">
                    <PanelRight size={20} />
                </button>
            )}
          </div>
        </header>
        
        {isGM && (
            <div className="h-1 bg-accent-amber/80 flex items-center justify-center z-[19] relative group">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full hidden group-hover:block bg-zinc-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                   DEV MODE: GM ROLE ACTIVE. DO NOT HANDLE LIVE SENSITIVE DATA.
                </div>
            </div>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar">
            <div className="max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onAction={(action) => setPrefillText(action)} />
              ))}
              {isLoading && !messages[messages.length - 1]?.isThinking && (
                 <div className="flex w-full mb-8 gap-4 animate-in fade-in zoom-in duration-300">
                    <TypingIndicator />
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="w-full pt-2 pb-0 px-2 sm:px-4 bg-gradient-to-t from-brand-bg-light dark:from-brand-bg-dark z-10">
            <InputArea 
              onSend={handleSendMessage} isLoading={isLoading} selectedModel={selectedModel} onModelChange={setSelectedModel}
              onInitiateVhfCall={() => setIsVoiceOpen(true)} isMonitoring={isMonitoring}
              useSearch={useSearch} onToggleSearch={() => setUseSearch(!useSearch)}
              useThinking={useThinking} onToggleThinking={() => setUseThinking(!useThinking)}
              prefillText={prefillText} onPrefillConsumed={() => setPrefillText('')}
            />
          </div>
        </main>
        
        <StatusBar userProfile={userProfile} onToggleAuth={() => handleRoleChange(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'][(['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'].indexOf(userProfile.role) + 1) % 3] as UserRole)} nodeHealth="connected" latency={12} activeChannel={activeChannel} />
      </div>

      {isGM && <Canvas isOpen={isCanvasOpen} onClose={() => setIsCanvasOpen(false)} isPanel={isDesktop} {...{ logs, registry, tenders, trafficQueue, weatherData, activeChannel, isMonitoring, userProfile, vesselsInPort, onCheckIn: () => {}, onOpenTrace: () => setIsTraceModalOpen(true), onGenerateReport: () => setIsReportModalOpen(true), onNodeClick: handleNodeClick, activeTab: activeCanvasTab, onTabChange: setActiveCanvasTab }} />}
      <AgentTraceModal isOpen={isTraceModalOpen} onClose={() => setIsTraceModalOpen(false)} traces={agentTraces} />
      <VoiceModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} userProfile={userProfile} onTranscriptReceived={handleTranscriptReceived} />
      <DailyReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} {...{ registry, logs, vesselsInPort, userProfile, weatherData }} />
    </div>
  );
}