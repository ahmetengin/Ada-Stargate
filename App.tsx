import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, AgentTraceLog, TrafficEntry, WeatherForecast, AgentAction, UserRole, ThemeMode } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse } from './services/geminiService';
import { VoiceModal } from './components/VoiceModal';
import { TypingIndicator } from './components/TypingIndicator';
import { StatusBar } from './components/StatusBar';
import { AgentTraceModal } from './components/AgentTraceModal';
import { orchestratorService } from './services/orchestratorService';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.Model,
  text: `**Ada Stargate v3.2 Distributed Initialized**

**[ OK ]** Ada Marina: Core System Active.
**[ OK ]** Ada Sea: COLREGs Protocol Online.
**[ OK ]** Ada Finance: Paraşüt/Iyzico Integrated.
**[ OK ]** Ada Legal: RAG Knowledge Graph Ready.

*System is operating in Distributed Mode via FastRTC Mesh. Authentication required for sensitive nodes.*`,
  timestamp: Date.now()
};

const VESSEL_NAMES = ['S/Y Phisedelia', 'M/Y Blue Horizon', 'S/Y Mistral', 'M/Y Poseidon', 'Catamaran Lir', 'S/Y Aegeas', 'Tender Bravo', 'M/Y Grand Turk'];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Pro);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as ThemeMode || 'dark'; // Default to dark if not set
    }
    return 'dark';
  });

  const [agentTraces, setAgentTraces] = useState<AgentTraceLog[]>([]);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  const [activeChannel, setActiveChannel] = useState('73');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'guest-01', name: 'Ahmet Engin', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN'
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([
    { id: 't1', name: 'Tender Alpha', status: 'Idle' },
    { id: 't2', name: 'Tender Bravo', status: 'Idle' },
    { id: 't3', name: 'Tender Charlie', status: 'Maintenance' },
  ]);
  const [trafficQueue, setTrafficQueue] = useState<TrafficEntry[]>([
      { id: 'tq1', vessel: 'M/Y Solaris', status: 'INBOUND', priority: 4, sector: 'North Approach' },
      { id: 'tq2', vessel: 'S/Y Vertigo', status: 'HOLDING', priority: 5, sector: 'Sector Zulu' },
      { id: 'tq3', vessel: 'Catamaran 42', status: 'TAXIING', priority: 5, sector: 'Inner Harbour', destination: 'A-12' }
  ]);
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>([
      { day: 'Today', temp: 24, condition: 'Sunny', windSpeed: 12, windDir: 'NW', alertLevel: 'NONE' },
      { day: 'Tomorrow', temp: 22, condition: 'Windy', windSpeed: 28, windDir: 'N', alertLevel: 'ADVISORY' },
      { day: 'Wed', temp: 19, condition: 'Rain', windSpeed: 15, windDir: 'NE', alertLevel: 'NONE' },
  ]);
  
  const [vesselsInPort, setVesselsInPort] = useState(540); 
  
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({
    'ada.vhf': 'connected', 'ada.sea': 'connected', 'ada.marina': 'connected',
    'ada.finance': 'connected', 'ada.customer': 'connected', 'ada.passkit': 'connected',
    'ada.legal': 'connected', 'ada.security': 'connected', 'ada.weather': 'connected',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- THEME LOGIC ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- AUTONOMOUS AI TRAFFIC CONTROLLER LOGIC ---
  const handleCheckIn = (trafficId: string) => {
      const entry = trafficQueue.find(t => t.id === trafficId);
      if (!entry) return;

      const newRegistryEntry: RegistryEntry = {
        id: `reg-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        vessel: entry.vessel,
        action: 'CHECK-IN',
        location: entry.destination || 'Transit Quay',
        status: 'AUTHORIZED'
      };
      setRegistry(prev => [newRegistryEntry, ...prev]);
      setTrafficQueue(prev => prev.filter(t => t.id !== trafficId));
      setVesselsInPort(prev => prev + 1); 
  };

  useEffect(() => {
    if (!isMonitoring || trafficQueue.length === 0) return;

    const autoAuthInterval = setInterval(() => {
       const target = trafficQueue.find(t => t.status === 'INBOUND' || t.status === 'HOLDING');
       
       if (target && Math.random() > 0.5) { 
          const logId = Date.now();
          setLogs(prev => [{
             id: logId,
             timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
             source: 'ada.marina',
             message: `AI AUTO: ${target.vessel} authorized for docking at ${target.destination || 'Pontoon C'}.`,
             type: 'info'
          }, ...prev]);

          handleCheckIn(target.id);
       }
    }, 5000);

    return () => clearInterval(autoAuthInterval);
  }, [trafficQueue, isMonitoring]);


  // Simulation Logic (Random Chatter)
  useEffect(() => {
    const generateLog = () => {
       const sourceNode = ['ada.vhf', 'ada.security', 'ada.finance', 'ada.marina', 'ada.weather'][Math.floor(Math.random() * 5)];
       const vessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
       let message = '';
       let type = 'info';
       let channel = '';

       switch (sourceNode) {
         case 'ada.vhf':
           if (activeChannel === 'SCAN') {
                channel = ['16', '73', '12', '13', '14'][Math.floor(Math.random() * 5)];
           } else {
                channel = activeChannel;
           }
           const actions = ["requesting pilot", "calling security", "at Pontoon C", "routine check", "technical assist required"];
           message = `[CH ${channel}] ${vessel} ${actions[Math.floor(Math.random() * actions.length)]}.`;
           break;
         case 'ada.security':
           message = `Gate A: Vehicle entry authorized. Plate 34-AD-123.`;
           break;
         case 'ada.finance':
           message = `Paraşüt: Invoice synced for ${vessel}. Iyzico: Payment Pending.`;
           break;
         case 'ada.marina':
            message = 'Berth C-14 power restored';
            break;
        case 'ada.weather':
            message = 'Barometer dropping rapidly.';
            break;
       }
       
       const newLog = {
         id: Date.now() + Math.random(),
         timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
         source: sourceNode,
         message: message,
         type: type,
       };
       setLogs(prev => [newLog, ...prev.slice(0, 199)]);
       setNodeStates(prev => ({...prev, [sourceNode]: 'working' }));
       setTimeout(() => setNodeStates(prev => ({...prev, [sourceNode]: 'connected' })), 500);
    };
    
    const simInterval = setInterval(() => {
      if (!isMonitoring) return;
      generateLog();
    }, 3000);

    return () => clearInterval(simInterval);
  }, [isMonitoring, activeChannel]);

  const handleRoleChange = (newRole: UserRole) => {
      setUserProfile(prev => ({
          ...prev,
          role: newRole,
          clearanceLevel: newRole === 'GENERAL_MANAGER' ? 5 : newRole === 'CAPTAIN' ? 2 : 0
      }));
      const sysMsg: Message = {
          id: `sys-${Date.now()}`,
          role: MessageRole.System,
          text: `**System Auth Updated**: User authenticated as **${newRole}**. Access Control Lists reloaded.`,
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, sysMsg]);
  };

  const handleAgentAction = (action: AgentAction) => {
      if (action.name === 'ada.marina.tenderDispatched') {
          const tenderName = action.params.tender; 
          const tenderId = tenders.find(t => t.name === tenderName)?.id || 't1';
          setTenders(prev => prev.map(t => {
            if (t.id === tenderId) {
                return { ...t, status: 'Busy' as const, assignment: action.params.vessel };
            }
            return t;
          }));
          
          const newLog = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: 'ada.marina',
            message: `Tender Ops: ${tenderName} dispatched to ${action.params.vessel}.`,
            type: 'info',
          };
          setLogs(prev => [newLog, ...prev]);
      }
  };

  const handleSend = async (text: string, attachments: File[]) => {
    const userMessage: Message = {
      id: Date.now().toString(), role: MessageRole.User, text, timestamp: Date.now(),
      attachments: await Promise.all(attachments.map(async file => ({
        mimeType: file.type,
        data: (await new Promise<string>(res => {
          const reader = new FileReader();
          reader.onload = e => res(e.target?.result as string);
          reader.readAsDataURL(file);
        })).split(',')[1],
        name: file.name
      })))
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setAgentTraces([]); 
    
    if (activeChannel === '73') {
        const orchestrationResult = await orchestratorService.processRequest(text, userProfile);
        setAgentTraces(orchestrationResult.traces);
        orchestrationResult.actions.forEach(handleAgentAction);

        const isStandardInquiry = !orchestrationResult.text;

        if (!isStandardInquiry) {
            setTimeout(() => {
                setMessages(prev => [...prev, { 
                    id: `resp-${Date.now()}`, 
                    role: MessageRole.Model, 
                    text: orchestrationResult.text, 
                    timestamp: Date.now() 
                }]);
                setIsLoading(false);
            }, 600);
        } else {
            let currentResponse = "";
            const responseId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: responseId, role: MessageRole.Model, text: "", timestamp: Date.now(), isThinking: true }]);

            await streamChatResponse(
              messages.concat(userMessage),
              selectedModel,
              useSearch,
              useThinking,
              registry,
              tenders,
              userProfile,
              vesselsInPort,
              (chunk, grounding) => {
                 currentResponse += chunk;
                 setMessages(prev => prev.map(m =>
                   m.id === responseId ? { ...m, text: currentResponse, isThinking: false, groundingSources: grounding } : m
                 ));
              }
            );
            setIsLoading(false);
        }
    } 
    else {
        let simulatedResponse = "";
        const delay = 800;

        switch(activeChannel) {
            case '16':
                simulatedResponse = `**[COAST GUARD / CH 16]**\n\nDistress signal received. Identifying Station... \n**Note:** For non-emergency marina operations, switch to Channel 73.`;
                break;
            case '14':
                simulatedResponse = `**[TENDER OPS / CH 14]**\n\nTender Alpha copies. Proceeding to waypoint. \n*(This is a local mesh network message. No AI processing required.)*`;
                break;
            case '06':
                simulatedResponse = `**[ASSIST / CH 06]**\n\nTechnical support team notified via pager system. Stand by.`;
                break;
            case '12':
            case '13':
                 simulatedResponse = `**[VTS TRAFFIC / CH ${activeChannel}]**\n\nSector Kadikoy VTS: Copy. Maintain course and speed.`;
                 break;
            default:
                simulatedResponse = `**[RADIO SILENCE]**\n\nNo active stations on Channel ${activeChannel}.`;
        }

        setTimeout(() => {
            const radioMessage: Message = {
                id: `rtc-${Date.now()}`,
                role: MessageRole.System,
                text: simulatedResponse,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, radioMessage]);
            setIsLoading(false);
        }, delay);
    }
  };
  
  const toggleAuth = async () => {
      handleRoleChange(userProfile.role === 'GUEST' ? 'GENERAL_MANAGER' : 'GUEST');
  };

  const handleInitiateVhfCall = () => {
    if (isMonitoring) {
      setIsVoiceModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar {...{ 
            nodeStates, 
            activeChannel, 
            onChannelChange: setActiveChannel, 
            isMonitoring, 
            onMonitoringToggle: () => setIsMonitoring(!isMonitoring), 
            userProfile, 
            onRoleChange: handleRoleChange,
            theme,
            onThemeChange: setTheme
        }} />
        
        {/* Main Chat Zone */}
        <div className="flex flex-col flex-1 relative min-w-0 border-r border-transparent bg-zinc-50 dark:bg-[#09090b]">
          
          {/* Header */}
          <header className="h-12 flex items-center justify-between px-6 flex-shrink-0 z-10 mt-1 border-b border-transparent">
             <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity select-none">
                <h1 className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase font-mono">Ada.Marina | <span className="text-indigo-600 dark:text-indigo-500">Ready</span></h1>
             </div>
             <div className="flex items-center gap-2">
                {activeChannel !== 'SCAN' && (
                    <span className={`text-[10px] font-mono ${activeChannel === '73' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-zinc-500'}`}>
                        VHF CH {activeChannel} {activeChannel === '73' ? '[AI ACTIVE]' : '[MESH NET]'}
                    </span>
                )}
             </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 md:px-20 custom-scrollbar relative z-10 pb-40">
            <div className="max-w-3xl mx-auto pt-6">
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              {isLoading && messages[messages.length - 1]?.role === MessageRole.User && (
                 <div className="ml-1 mt-4">
                    <TypingIndicator />
                 </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-30 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent dark:from-[#09090b] dark:via-[#09090b] dark:to-transparent pt-12">
             <InputArea 
                onSend={handleSend} 
                isLoading={isLoading} 
                selectedModel={selectedModel} 
                onModelChange={setSelectedModel} 
                onInitiateVhfCall={handleInitiateVhfCall} 
                isMonitoring={isMonitoring}
                useSearch={useSearch}
                onToggleSearch={() => setUseSearch(!useSearch)}
                useThinking={useThinking}
                onToggleThinking={() => setUseThinking(!useThinking)}
             />
          </div>
        </div>

        {isCanvasOpen && (
          <Canvas {...{ 
              logs, 
              registry, 
              tenders, 
              trafficQueue, 
              weatherData, 
              activeChannel, 
              isMonitoring, 
              userProfile, 
              vesselsInPort, 
              onCheckIn: handleCheckIn,
              onOpenTrace: () => setIsTraceModalOpen(true)
          }} />
        )}
      </div>
      <StatusBar {...{ userProfile, onToggleAuth: toggleAuth, nodeHealth: "working", latency: 12, activeChannel }} />
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />
      <AgentTraceModal isOpen={isTraceModalOpen} onClose={() => setIsTraceModalOpen(false)} traces={agentTraces} />
    </div>
  );
}