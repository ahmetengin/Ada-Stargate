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
import { marinaAgent } from './services/agents/marinaAgent';
import { technicAgent } from './services/agents/technicAgent';
import { VESSEL_KEYWORDS } from './services/constants'; 
import { wimMasterData } from './services/wimMasterData';
import { Sun, Moon, Monitor } from 'lucide-react';
import { persistenceService, STORAGE_KEYS } from './services/persistence';
import { checkBackendHealth } from './services/api';
import { VoiceModal } from './components/VoiceModal';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.Model,
  text: `**Ada Stargate v3.2 Distributed Initialized**

**[ OK ]** Ada Marina: Core System Active.
**[ OK ]** Ada Sea: COLREGs Protocol Online.
**[ OK ]** Ada Finance: Parasut/Iyzico Integrated.
**[ OK ]** Ada Legal: RAG Knowledge Graph Ready.

*System is operating in Distributed Mode via FastRTC Mesh. Authentication required for sensitive nodes.*`,
  timestamp: Date.now()
};

export default function App() {
  // LOAD STATE FROM PERSISTENCE (or Default)
  const [messages, setMessages] = useState<Message[]>(() => persistenceService.load(STORAGE_KEYS.MESSAGES, [INITIAL_MESSAGE]));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Pro);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'operational' | 'degraded'>('degraded');
  
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return persistenceService.load(STORAGE_KEYS.THEME, 'dark');
    }
    return 'dark';
  });

  const [agentTraces, setAgentTraces] = useState<AgentTraceLog[]>([]);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  // Canvas State
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);
  const [activeCanvasTab, setActiveCanvasTab] = useState<'fleet' | 'feed' | 'cloud' | 'ais' | 'map' | 'tech'>('fleet');

  // VHF State
  const [activeChannel, setActiveChannel] = useState('72');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Persistent User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => persistenceService.load(STORAGE_KEYS.USER_PROFILE, {
    id: 'guest-01', name: 'Ahmet Engin', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN'
  }));

  // Persistent Logs & Operations Data
  const [logs, setLogs] = useState<any[]>(() => persistenceService.load(STORAGE_KEYS.LOGS, []));
  const [registry, setRegistry] = useState<RegistryEntry[]>(() => persistenceService.load(STORAGE_KEYS.REGISTRY, []));
  const [tenders, setTenders] = useState<Tender[]>(() => persistenceService.load(STORAGE_KEYS.TENDERS, [
    { id: 't1', name: 'Tender Alpha', status: 'Idle', serviceCount: 0 },
    { id: 't2', name: 'Tender Bravo', status: 'Idle', serviceCount: 0 },
    { id: 't3', name: 'Tender Charlie', status: 'Maintenance', serviceCount: 0 },
  ]));
  const [trafficQueue, setTrafficQueue] = useState<TrafficEntry[]>(() => persistenceService.load(STORAGE_KEYS.TRAFFIC, [
      { id: 'tq1', vessel: 'M/Y Solaris', status: 'INBOUND', priority: 4, sector: 'North Approach' },
      { id: 'tq2', vessel: 'S/Y Vertigo', status: 'HOLDING', priority: 5, sector: 'Sector Zulu' },
      { id: 'tq3', vessel: 'Catamaran 42', status: 'TAXIING', priority: 5, sector: 'Inner Harbour', destination: 'A-12' }
  ]));

  // Non-persistent state
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>([
      { day: 'Today', temp: 24, condition: 'Sunny', windSpeed: 12, windDir: 'NW', alertLevel: 'NONE' },
      { day: 'Tomorrow', temp: 22, condition: 'Windy', windSpeed: 28, windDir: 'N', alertLevel: 'ADVISORY' },
      { day: 'Wed', temp: 19, condition: 'Rain', windSpeed: 15, windDir: 'NE', alertLevel: 'NONE' },
  ]);
  
  const [vesselsInPort, setVesselsInPort] = useState(0); 
  
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({
    'ada.vhf': 'connected', 'ada.sea': 'connected', 'ada.marina': 'connected',
    'ada.finance': 'connected', 'ada.customer': 'connected', 'ada.passkit': 'connected',
    'ada.legal': 'connected', 'ada.security': 'connected', 'ada.weather': 'connected',
  });
  
  const [profiledVessels, setProfiledVessels] = useState<Set<string>>(new Set());
  const [prefillText, setPrefillText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE EFFECTS (Auto-Save) ---
  useEffect(() => { persistenceService.save(STORAGE_KEYS.MESSAGES, messages); }, [messages]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.LOGS, logs); }, [logs]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.REGISTRY, registry); }, [registry]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.TENDERS, tenders); }, [tenders]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.TRAFFIC, trafficQueue); }, [trafficQueue]);
  useEffect(() => { persistenceService.save(STORAGE_KEYS.USER_PROFILE, userProfile); }, [userProfile]);

  useEffect(() => {
      const fleet = marinaAgent.getAllFleetVessels();
      setVesselsInPort(fleet.length);
  }, []);

  useEffect(() => {
      const check = async () => {
          const isHealthy = await checkBackendHealth();
          setBackendStatus(isHealthy ? 'operational' : 'degraded');
      };
      check();
      const interval = setInterval(check, 10000);
      return () => clearInterval(interval);
  }, []);

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
    persistenceService.save(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'auto') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('auto');
  };

  const getThemeIcon = () => {
    switch(theme) {
      case 'light': return <Sun size={14} />;
      case 'dark': return <Moon size={14} />;
      default: return <Monitor size={14} />;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addLog = (log: any) => {
    setLogs(prev => [log, ...prev]);
  };

  const handleAgentAction = async (action: AgentAction) => {
      if (action.name === 'ada.passkit.generated') {
          addLog({
              id: `log_pk_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.passkit',
              message: action.params,
              type: 'passkit_issued'
          });
          setActiveCanvasTab('feed');
      }
      if (action.name === 'ada.marina.tenderDispatched') {
          const { tender, vessel, mission, departurePlan } = action.params;
          setTenders(prev => prev.map(t => t.name === tender ? { ...t, status: 'Busy', assignment: vessel, serviceCount: (t.serviceCount || 0) + 1 } : t));
          
          let msg = `Assigned to ${vessel} for ${mission}.`;
          if (departurePlan) {
              msg += `\nPlan: Berth ${departurePlan.berth}, Pilot: ${departurePlan.pilot}, Linesmen: ${departurePlan.lineHandlers}, Ch: ${departurePlan.coordinationChannel}`;
          }

          addLog({
              id: `log_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.marina (Ops)',
              message: msg,
              type: 'alert'
          });
          setActiveCanvasTab('fleet');

          setTimeout(() => {
              setTenders(prev => prev.map(t => t.name === tender ? { ...t, status: 'Idle', assignment: undefined } : t));
              addLog({
                  id: `log_${Date.now()}_comp`,
                  timestamp: new Date().toLocaleTimeString(),
                  source: 'ada.marina (Ops)',
                  message: `${tender} completed mission. Returning to station.`,
                  type: 'info'
              });
          }, 10000);
      }
      if (action.name === 'ada.finance.invoiceCreated') {
          addLog({
              id: `log_inv_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.finance',
              message: `Invoice ${action.params.invoice.id} generated for ${action.params.invoice.amount} EUR.`,
              type: 'warning'
          });
          setActiveCanvasTab('feed');
      }
      if (action.name === 'ada.finance.paymentLinkGenerated') {
          addLog({
              id: `log_pay_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.finance',
              message: `Payment Link Active: ${action.params.link.url}`,
              type: 'info'
          });
          setActiveCanvasTab('feed');
      }
      if (action.name === 'ada.customer.engage') {
           addLog({
              id: `log_eng_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.customer',
              message: action.params.message,
              type: 'customer_engagement'
          });
      }
      if (action.name === 'ada.finance.proposePaymentPlan') {
           addLog({
              id: `log_prop_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.customer',
              message: `PROPOSAL TO GM: Payment Plan for ${action.params.vesselName} (${action.params.loyaltyTier})\nRecommendation: ${action.params.recommendation}`,
              type: 'customer_proposal'
          });
          setActiveCanvasTab('feed');
      }
      if (action.name === 'ada.customer.deliverCredentials') {
          addLog({
              id: `log_cred_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.customer',
              message: `Credentials delivery initiated for ${action.params.vesselName}. Triggering PassKit...`,
              type: 'info'
          });
      }
      if (action.name === 'ada.marina.updateVesselProfile' || action.name.includes('registerVessel')) {
          const fleet = marinaAgent.getAllFleetVessels();
          setVesselsInPort(fleet.length);
          setActiveCanvasTab('fleet');
      }
      if (action.name === 'technic.service.scheduled' || action.name.includes('schedule_service')) {
          setActiveCanvasTab('tech');
      }
  };

  useEffect(() => {
      const interval = setInterval(() => {
          marinaAgent.fetchLiveAisData().then(targets => {
              targets.forEach(target => {
                  const isContracted = marinaAgent.isContractedVessel(target.imo || '');
                  if (isContracted && !profiledVessels.has(target.vessel)) {
                      setProfiledVessels(prev => new Set(prev).add(target.vessel));
                      marinaAgent.getVesselIntelligence(target.vessel).then(profile => {
                          if (profile) {
                              addLog({
                                  id: `intel_${Date.now()}`,
                                  timestamp: new Date().toLocaleTimeString(),
                                  source: 'ada.intelligence',
                                  message: "AUTO-PROFILE GENERATED",
                                  type: 'intelligence_briefing'
                              });
                          }
                      });
                  }
              });
          });
      }, 30000);
      return () => clearInterval(interval);
  }, [profiledVessels]);

  useEffect(() => {
      const interval = setInterval(() => {
          const allVessels = marinaAgent.getAllFleetVessels();
          allVessels.forEach(vessel => {
              const engagementKey = `engaged_${vessel.name}`;
              if (!profiledVessels.has(engagementKey)) {
                  if (vessel.outstandingDebt && vessel.outstandingDebt > 0 && vessel.paymentHistoryStatus === 'RECENTLY_LATE') {
                       orchestratorService.processRequest(`Evaluate payment plan for ${vessel.name}`, userProfile).then(res => {
                           res.actions.forEach(handleAgentAction);
                       });
                       setProfiledVessels(prev => new Set(prev).add(engagementKey));
                  } 
                  else if (vessel.loyaltyTier === 'GOLD' || vessel.loyaltyTier === 'SILVER') {
                       import('./services/agents/customerAgent').then(({customerAgent}) => {
                           customerAgent.proactiveEngagement(vessel, () => {}).then(res => {
                               if (res.logMessage) {
                                   addLog({
                                      id: `eng_${Date.now()}`,
                                      timestamp: new Date().toLocaleTimeString(),
                                      source: 'ada.customer',
                                      message: res.logMessage,
                                      type: 'customer_engagement'
                                  });
                               }
                           });
                       });
                       setProfiledVessels(prev => new Set(prev).add(engagementKey));
                  }
              }
          });
      }, 60000 * 5);
      return () => clearInterval(interval);
  }, [profiledVessels, userProfile]);

  useEffect(() => {
      const interval = setInterval(() => {
          if (Math.random() > 0.8) {
              const sensors = ['Pontoon A', 'Pontoon C', 'Fuel Station', 'Entrance'];
              const location = sensors[Math.floor(Math.random() * sensors.length)];
              if (Math.random() > 0.7) {
                  addLog({
                      id: `env_${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString(),
                      source: 'ada.sea (Sensor)',
                      message: `Hydrocarbon levels elevated at ${location}. Monitoring...`,
                      type: 'warning'
                  });
              } else if (Math.random() > 0.9) {
                  addLog({
                      id: `env_crit_${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString(),
                      source: 'ada.sea (Sensor)',
                      message: `CRITICAL: Oil spill detected at ${location}. Dispatching response team.`,
                      type: 'ENVIRONMENTAL_ALERT'
                  });
                  setActiveCanvasTab('feed');
              }
          }
      }, 45000);
      return () => clearInterval(interval);
  }, []);


  const handleSend = async (text: string, attachments: File[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      text: text,
      timestamp: Date.now(),
      attachments: await Promise.all(attachments.map(async file => ({
        mimeType: file.type,
        data: await fileToGoogleGenerativeAI(file),
        name: file.name
      })))
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const lowerText = text.toLowerCase();
    if (lowerText.includes('map') || lowerText.includes('location') || lowerText.includes('where')) setActiveCanvasTab('map');
    else if (lowerText.includes('radar') || lowerText.includes('ais') || lowerText.includes('scan')) setActiveCanvasTab('ais');
    else if (lowerText.includes('tech') || lowerText.includes('repair') || lowerText.includes('schedule') || lowerText.includes('lift')) setActiveCanvasTab('tech');
    else if (lowerText.includes('fleet') || lowerText.includes('vessel') || lowerText.includes('boat')) setActiveCanvasTab('fleet');
    else if (lowerText.includes('weather') || lowerText.includes('forecast')) setActiveCanvasTab('cloud');
    else if (lowerText.includes('invoice') || lowerText.includes('pay') || lowerText.includes('log')) setActiveCanvasTab('feed');

    try {
        const result = await orchestratorService.processRequest(text, userProfile);
        
        for (const action of result.actions) {
            await handleAgentAction(action);
        }

        setAgentTraces(result.traces);

        if (result.text) {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: MessageRole.Model,
                text: result.text,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMessage]);
        } 
        else {
            await streamChatResponse(
                [...messages, userMessage],
                selectedModel,
                useSearch,
                useThinking,
                registry,
                tenders,
                userProfile,
                vesselsInPort,
                (text, grounding) => {
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last.role === MessageRole.Model && last.isThinking) {
                            return [...prev.slice(0, -1), { ...last, text, isThinking: false, groundingSources: grounding }];
                        }
                        return [...prev, { id: Date.now().toString(), role: MessageRole.Model, text, timestamp: Date.now(), groundingSources: grounding }];
                    });
                }
            );
        }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.Model,
        text: "**System Error:** Node communication failed. Please retry.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = (id: string) => {
      const entry = trafficQueue.find(t => t.id === id);
      if (entry) {
          setTrafficQueue(prev => prev.filter(t => t.id !== id));
          setRegistry(prev => [{
              id: `reg-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              vessel: entry.vessel,
              action: 'CHECK-IN',
              location: entry.sector,
              status: 'AUTHORIZED'
          }, ...prev]);
          
          addLog({
              id: `log_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: 'ada.marina',
              message: `${entry.vessel} authorized for entry to ${entry.destination || 'Transit Quay'}.`,
              type: 'info'
          });
          setActiveCanvasTab('feed');
      }
  };

  const toggleUserRole = (role: UserRole) => {
      setUserProfile(prev => ({ ...prev, role }));
      setMessages(prev => [...prev, {
          id: `sys-${Date.now()}`,
          role: MessageRole.System,
          text: `USER ROLE UPDATED: ${role}`,
          timestamp: Date.now()
      }]);
  };

  const handleToggleAuth = () => {
      const roles: UserRole[] = ['GUEST', 'CAPTAIN', 'GENERAL_MANAGER'];
      const currentIdx = roles.indexOf(userProfile.role);
      const nextRole = roles[(currentIdx + 1) % roles.length];
      toggleUserRole(nextRole);
  };

  const handleNodeClick = (nodeId: string) => {
      setPrefillText(`@${nodeId} `);
  };

  async function fileToGoogleGenerativeAI(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className={`flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans ${theme}`}>
      <Sidebar 
        nodeStates={nodeStates}
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        isMonitoring={isMonitoring}
        onMonitoringToggle={() => setIsMonitoring(!isMonitoring)}
        userProfile={userProfile}
        onRoleChange={toggleUserRole}
        onNodeClick={handleNodeClick}
      />
      
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#09090b] transition-colors duration-300 relative">
          
          <div className="flex-1 flex overflow-hidden relative">
              
              <main className="flex-1 flex flex-col min-w-0 relative z-0">
                {/* Header */}
                <div className="h-12 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between px-4 flex-shrink-0">
                   <div className="flex items-center gap-3">
                      <div className="text-lg font-bold tracking-widest font-mono text-zinc-800 dark:text-zinc-200">ADA.MARINA</div>
                      <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700"></div>
                      <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                       <div className="flex items-center gap-2">
                           <span className={`text-red-600 dark:text-red-500 font-bold`}>N 40°57’46’’ E 28°39’49’’</span>
                           <span className="text-zinc-300 dark:text-zinc-700">|</span>
                           <span className="text-indigo-500">VHF CH {activeChannel} [AI ACTIVE]</span>
                       </div>
                       <button onClick={cycleTheme} className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                           {getThemeIcon()}
                       </button>
                   </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth relative">
                   <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full pb-4">
                      {messages.map((msg, idx) => (
                        <MessageBubble 
                            key={msg.id} 
                            message={msg} 
                            onAction={(cmd) => handleSend(cmd, [])}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                   </div>
                </div>

                {/* Input Area */}
                <div className="p-4 pt-0 z-20 bg-white dark:bg-[#09090b]">
                   <InputArea 
                      onSend={handleSend} 
                      isLoading={isLoading}
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      onInitiateVhfCall={() => setIsVoiceOpen(true)}
                      isMonitoring={isMonitoring}
                      useSearch={useSearch}
                      onToggleSearch={() => setUseSearch(!useSearch)}
                      useThinking={useThinking}
                      onToggleThinking={() => setUseThinking(!useThinking)}
                      prefillText={prefillText}
                   />
                   <div className="text-center mt-2">
                      <span className="text-[9px] font-mono text-zinc-300 dark:text-zinc-700 tracking-widest uppercase flex items-center justify-center gap-2">
                         <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                         This conversation is being recorded / Recorded Line
                      </span>
                   </div>
                </div>
              </main>

              {isCanvasOpen && (
                <Canvas 
                    activeTab={activeCanvasTab}
                    onTabChange={setActiveCanvasTab}
                    logs={logs} 
                    registry={registry} 
                    tenders={tenders} 
                    trafficQueue={trafficQueue}
                    weatherData={weatherData}
                    activeChannel={activeChannel}
                    isMonitoring={isMonitoring}
                    userProfile={userProfile}
                    vesselsInPort={vesselsInPort}
                    onCheckIn={handleCheckIn}
                    onOpenTrace={() => setIsTraceModalOpen(true)}
                    onNodeClick={handleNodeClick}
                />
              )}
          </div>

          <StatusBar 
              userProfile={userProfile} 
              onToggleAuth={handleToggleAuth} 
              nodeHealth={backendStatus === 'operational' ? 'connected' : 'working'} 
              latency={12}
              activeChannel={activeChannel}
          />
      </div>

      <AgentTraceModal 
        isOpen={isTraceModalOpen} 
        onClose={() => setIsTraceModalOpen(false)} 
        traces={agentTraces} 
      />

      <VoiceModal 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        userProfile={userProfile}
      />

    </div>
  );
}