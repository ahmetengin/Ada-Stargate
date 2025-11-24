
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
import { PassportScanner } from './components/PassportScanner';
import { TENANT_CONFIG } from './services/config';
import { formatCoordinate } from './services/utils';
import { QuickActions } from './components/QuickActions';

// --- SIMULATED USER DATABASE ---
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
  text: `ADA STARGATE V3.2 DISTRIBUTED INITIALIZED
[ OK ] ADA MARINA: CORE SYSTEM ACTIVE.
[ OK ] ADA SEA: COLREGS PROTOCOL ONLINE.
[ OK ] ADA FINANCE: PARASUT/IYZICO INTEGRATED.
[ OK ] ADA LEGAL: RAG KNOWLEDGE GRAPH READY.
SYSTEM IS OPERATING IN DISTRIBUTED MODE VIA FASTRTC MESH. AUTHENTICATION REQUIRED FOR SENSITIVE NODES.
<b class="text-red-500 font-bold">N 40°57’46" E 28°39’49" VHF 72</b>`,
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
  // Default to Flash for stability, Thinking disabled by default to prevent 500 errors
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [isRedAlert, setIsRedAlert] = useState(false); 

  const [userProfile, setUserProfile] = useState<UserProfile>(() => 
    persistenceService.load(STORAGE_KEYS.USER_PROFILE, MOCK_USER_DATABASE['GUEST'])
  );

  const [logs, setLogs] = useState<any[]>(() => persistenceService.load(STORAGE_KEYS.LOGS, []));
  const [registry, setRegistry] = useState<RegistryEntry[]>(() => persistenceService.load(STORAGE_KEYS.REGISTRY, []));
  const [tenders, setTenders] = useState<Tender[]>(() => persistenceService.load(STORAGE_KEYS.TENDERS, wimMasterData.assets.tenders as Tender[]));
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
    setLogs(prev => [log, ...prev].slice(0, 200));
  };

  const handleAgentAction = async (action: AgentAction) => {
      if (action.name === 'ada.marina.tenderDispatched' || action.name === 'ada.marina.tenderReserved') {
          setTenders(prev => prev.map(t => 
              t.id === action.params.tenderId ? { 
                  ...t, 
                  status: 'Busy',
                  assignment: action.params.vessel
              } : t
          ));
      }
      if (action.name === 'ada.marina.log_operation') {
          addLog({
              id: `op_log_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.marina',
              type: action.params.type || 'info',
              message: action.params.message
          });
      }
      if (action.name === 'ada.marina.updateTrafficStatus') {
          setTrafficQueue(prev => {
              const { vessel, status, destination } = action.params;
              const others = prev.filter(t => t.vessel !== vessel);
              return [{
                  id: `trf_${Date.now()}`,
                  vessel: vessel,
                  status: status,
                  destination: destination,
                  priority: 3,
                  sector: 'WIM'
              }, ...others];
          });
      }
  };

  const handleToggleRedAlert = () => {
      const newState = !isRedAlert;
      setIsRedAlert(newState);
      
      if (newState) {
          setIsCanvasOpen(true);
          addLog({
              id: `alert_log_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.security',
              type: 'critical',
              message: '**GUARDIAN PROTOCOL ACTIVATED.** CODE RED.'
          });
          setMessages(prev => [...prev, { 
              id: `sys_alert_${Date.now()}`, 
              role: MessageRole.Model, 
              text: "**⚠️ EMERGENCY BROADCAST INITIATED.** \n\nALL STATIONS STANDBY. SYSTEM SWITCHING TO GUARDIAN PROTOCOL.\n\n**STATUS: CODE RED**", 
              timestamp: Date.now() 
          }]);
      } else {
          addLog({
              id: `alert_log_end_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.security',
              type: 'info',
              message: 'Guardian Protocol Deactivated. Returning to Standard Ops.'
          });
      }
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
        const orchestratorResult = await orchestratorService.processRequest(text, userProfile, tenders);
        
        if (orchestratorResult.traces) {
            setAgentTraces(orchestratorResult.traces);
        }
        
        if (orchestratorResult.actions) {
            orchestratorResult.actions.forEach(handleAgentAction);
        }

        if (orchestratorResult.text) {
             setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: MessageRole.Model, text: orchestratorResult.text, timestamp: Date.now() }]);
             setIsLoading(false);
             return;
        }

        // Fallback to Gemini if Orchestrator returns empty text (Conversational Mode)
        if (text.trim() !== "") {
            streamChatResponse(
              [...messages, newMessage],
              selectedModel,
              useSearch,
              useThinking,
              registry,
              tenders,
              userProfile,
              vesselsInPort,
              (chunk, grounding) => {
                