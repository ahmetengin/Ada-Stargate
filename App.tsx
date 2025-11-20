
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, AgentTraceLog, AgentObservation, WeatherForecast, TrafficEntry, DecisionStepLog, AgentAction, AgentPersona } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse } from './services/geminiService';
import { BrainCircuit } from 'lucide-react';
import { VoiceModal } from './components/VoiceModal';
import { TypingIndicator } from './components/TypingIndicator';
import { StatusBar } from './components/StatusBar';
import { AdaBrain } from './services/brain/AdaBrain';
import { AgentTraceModal } from './components/AgentTraceModal';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.Model,
  text: `**Ada Stargate v3.0 Initialized**

**[ OK ]** CoALA Brain: Cognitive Loop Active.
**[ OK ]** MDAP Engine: Task Decomposition Ready.
**[ OK ]** SEAL Core: Self-Adaptation Daemon Standing By.

*Ada Multi-Agent Intelligence is online. Awaiting Orchestrator commands.*`,
  timestamp: Date.now()
};

const VESSEL_NAMES = ['S/Y Phisedelia', 'M/Y Blue Horizon', 'S/Y Mistral', 'M/Y Poseidon', 'Catamaran Lir', 'S/Y Aegeas', 'Tender Bravo', 'M/Y Grand Turk'];
const LOCATIONS = ['Pontoon A-12', 'Pontoon C-05', 'Fuel Station', 'Dry Dock', 'Entrance Beacon', 'Technical Quay'];

const transformDecisionLogsToAgentTraces = (logs: DecisionStepLog[]): AgentTraceLog[] => {
    return logs
        .filter(log => log.chosenAction) // Guard against missing actions
        .map((log) => {
        const action = log.chosenAction;
        // Defensive check
        if (!action || !action.name) {
             return {
                id: `err_${Math.random()}`,
                timestamp: new Date().toLocaleTimeString([], { hour12: false }),
                persona: 'WORKER',
                step: 'CODE_OUTPUT',
                content: 'Error: Malformed action log',
                isError: true
             };
        }
        
        const [module] = action.name.split('.');

        let persona: AgentPersona = 'EXPERT';
        if (module === 'generic') {
            persona = 'ORCHESTRATOR';
        }

        let step: AgentTraceLog['step'] = 'ANALYSIS';
        if (action.kind === 'external') {
            step = 'TOOL_CALL';
        }
        if (action.name === 'generic.llmQuery') {
            step = 'FINAL_ANSWER';
        }

        return {
            id: action.id,
            timestamp: new Date(log.observation.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            persona: persona,
            step: step,
            content: `Action: ${action.name}\nParameters: ${JSON.stringify(action.params, null, 2)}${log.reasoningTrace ? `\nReasoning: ${log.reasoningTrace}` : ''}`,
            isError: false,
        };
    });
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Pro);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  
  const [decisionLogs, setDecisionLogs] = useState<DecisionStepLog[]>([]);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  const [activeChannel, setActiveChannel] = useState('73');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'guest-01', name: 'Guest User', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN'
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([
    { id: 't1', name: 'Tender Alpha', status: 'Idle' },
    { id: 't2', name: 'Tender Bravo', status: 'Idle' },
    { id: 't3', name: 'Tender Charlie', status: 'Maintenance' },
  ]);
  const [trafficQueue, setTrafficQueue] = useState<TrafficEntry[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>([]);
  const [vesselsInPort, setVesselsInPort] = useState(602); 
  
  const [nodeStates, setNodeStates] = useState<Record<string, 'connected' | 'working' | 'disconnected'>>({
    'ada.vhf': 'connected', 'ada.sea': 'connected', 'ada.marina': 'connected',
    'ada.finance': 'connected', 'ada.customer': 'connected', 'ada.passkit': 'connected',
    'ada.legal': 'connected', 'ada.security': 'connected', 'ada.weather': 'connected',
  });

  const [tokenStats, setTokenStats] = useState<any>({ input: 0, output: 0, total: 0, costUsd: 0, lastCall: null });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const brainRef = useRef(new AdaBrain());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const generateLog = () => {
       const sourceNode = ['ada.vhf', 'ada.security', 'ada.finance', 'ada.marina', 'ada.weather'][Math.floor(Math.random() * 5)];
       const vessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
       let message = '';
       let type = 'info';
       let channel = '';

       switch (sourceNode) {
         case 'ada.vhf':
           channel = ['16', '73', '12', '13', '14', '69', '06'][Math.floor(Math.random() * 7)];
           if (activeChannel !== 'SCAN' && activeChannel !== channel) return;
           const actions = ["requesting pilot", "calling security", "at Pontoon C", "routine check", "management update", "technical assist required"];
           message = `[CH ${channel}] ${vessel} ${actions[Math.floor(Math.random() * actions.length)]}.`;
           if (Math.random() < 0.05) {
              message = `[CH 16] MAYDAY MAYDAY MAYDAY. Fire on board ${vessel}.`;
              type = 'critical';
           }
           break;
         case 'ada.security':
           message = `Gate A: Vehicle entry authorized. Plate 34-AD-123.`;
           if (Math.random() < 0.1) {
              message = `Camera-04: Speed violation detected (18 km/h). Plate 34-XY-456. Marshall notified.`;
              type = 'warning';
           }
           break;
         case 'ada.finance':
           message = `Invoice #83721 paid by ${vessel}.`;
           break;
         case 'ada.marina':
            const op = ['Berth C-14 power restored', 'Blackwater pump-out complete for M/Y Poseidon', 'Guest arrival at main gate'];
            message = op[Math.floor(Math.random() * op.length)];
            break;
        case 'ada.weather':
            const weatherEvents = ['Barometer dropping rapidly.', 'Sea state has changed to moderate.', 'Visibility reduced to 2nm.'];
            message = weatherEvents[Math.floor(Math.random() * weatherEvents.length)];
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
    
    const updateRegistryAndTraffic = () => {
        if(Math.random() < 0.15) {
            const isCheckIn = Math.random() > 0.4;
            const vesselName = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
            const newEntry: RegistryEntry = {
                id: `reg_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
                vessel: vesselName,
                action: isCheckIn ? 'CHECK-IN' : 'CHECK-OUT',
                location: isCheckIn ? 'Main Gate' : 'Sea Passage',
                status: 'AUTHORIZED'
            };
            setRegistry(prev => [newEntry, ...prev.slice(0, 49)]);
            setVesselsInPort(p => isCheckIn ? p + 1 : Math.max(0, p - 1));
        }

        setTrafficQueue(prev => {
            let queue = [...prev];
            if (Math.random() < 0.1) {
                const newTraffic: TrafficEntry = { id: `tq_${Date.now()}`, vessel: VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)], status: 'INBOUND', priority: 4, sector: 'Entrance', destination: 'Waiting Assignment' };
                if (!queue.find(v => v.vessel === newTraffic.vessel)) queue.push(newTraffic);
            }
            queue = queue.map((t): TrafficEntry => {
                if (t.status === 'INBOUND' && Math.random() < 0.2) {
                    return {...t, status: 'TAXIING', destination: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]};
                }
                if (t.status === 'TAXIING' && Math.random() < 0.15) {
                    return {...t, status: 'DOCKED'};
                }
                return t;
            }).filter(t => t.status !== 'DOCKED');
            return queue.slice(0, 10);
        });

        setTenders(prev => prev.map(t => {
            if(t.status === 'Idle' && Math.random() < 0.1) {
                return {...t, status: 'Busy', assignment: `Assist ${VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)]}`};
            }
            if(t.status === 'Busy' && Math.random() < 0.2) {
                return {...t, status: 'Idle', assignment: undefined};
            }
            return t;
        }));
    };

    const updateWeatherData = () => {
        const days = ['Today', 'Tomorrow', 'Day 3'];
        const conditions: WeatherForecast['condition'][] = ['Sunny', 'Cloudy', 'Rain', 'Windy', 'Storm'];
        const newForecast = days.map((day, i) => {
            const wind = 5 + Math.floor(Math.random() * 30);
            let alert: WeatherForecast['alertLevel'] = 'NONE';
            if (wind > 34) alert = 'CRITICAL';
            else if (wind > 22) alert = 'WARNING';
            
            return {
                day,
                temp: 18 + Math.floor(Math.random() * 10),
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                windSpeed: wind,
                windDir: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random()*8)],
                alertLevel: alert,
            };
        });
        setWeatherData(newForecast);

        const newLog = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
          source: 'ada.weather.wim',
          message: `3-Day Forecast Updated. Today: ${newForecast[0].windSpeed}kts ${newForecast[0].windDir}, ${newForecast[0].condition}.`,
          type: newForecast[0].alertLevel !== 'NONE' ? 'warning' : 'info',
        };
        setLogs(prev => [newLog, ...prev.slice(0, 199)]);
    };

    const simInterval = setInterval(() => {
      if (!isMonitoring) return;
      generateLog();
      updateRegistryAndTraffic();
    }, 1200);

    const weatherInterval = setInterval(updateWeatherData, 60000);
    updateWeatherData();

    return () => {
        clearInterval(simInterval);
        clearInterval(weatherInterval);
    };
  }, [isMonitoring, activeChannel]);

  const executeAction = (action: AgentAction) => {
    console.log("Executing Action:", action);
    
    const newLog = {
         id: Date.now() + Math.random(),
         timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
         source: 'ada.brain',
         message: `Executing: ${action.name} with params ${JSON.stringify(action.params)}`,
         type: 'info',
       };
    setLogs(prev => [newLog, ...prev.slice(0, 199)]);
    
    if (action.name === 'marina.dispatchTender') {
        setTenders(prev => prev.map(t => t.id === action.params.tenderId ? {...t, status: 'Busy', assignment: `Assisting ${action.params.vessel}`} : t));
    }
    if (action.name === 'weather.broadcastWarning') {
        const warningLog = {
         id: Date.now() + Math.random(),
         timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
         source: 'ada.weather.wim',
         message: action.params.message,
         type: 'critical',
       };
       setLogs(prev => [warningLog, ...prev.slice(0, 199)]);
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
    setDecisionLogs([]);

    const observation: AgentObservation = {
      source: 'user',
      payload: { text, attachments: userMessage.attachments },
      timestamp: Date.now(),
    };
    
    brainRef.current.getLogs().length = 0; // Clear previous logs
    const actions = await brainRef.current.handleObservation(observation, 'marina_docking_assist_v1');
    setDecisionLogs(brainRef.current.getLogs());
    
    actions.forEach(executeAction);
    
    const llmQueryAction = actions.find(a => a.name === 'generic.llmQuery');
    
    if (llmQueryAction) {
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
          },
          (usage) => {
            if (!usage) return;
            const INPUT_PER_M = selectedModel === ModelType.Pro ? 3.50 : 0.35;
            const OUTPUT_PER_M = selectedModel === ModelType.Pro ? 10.50 : 1.05;
            const input = usage.promptTokenCount ?? 0;
            const output = usage.candidatesTokenCount ?? 0;
            setTokenStats({
              input, output, total: input + output,
              costUsd: ((input / 1_000_000) * INPUT_PER_M) + ((output / 1_000_000) * OUTPUT_PER_M),
              lastCall: new Date().toLocaleTimeString([], { hour12: false }),
            });
          }
        );
    }

    setIsLoading(false);
  };
  
  const toggleAuth = async () => {
    if (userProfile.role !== 'GUEST') {
      setUserProfile({ id: 'guest-01', name: 'Guest User', role: 'GUEST', clearanceLevel: 0, legalStatus: 'GREEN' });
      const logoutLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: 'ada.passkit',
        message: 'GM Session Terminated. Reverted to Guest access.',
        type: 'info',
      };
      setLogs(prev => [logoutLog, ...prev.slice(0, 199)]);
      return;
    }

    const addSystemLog = (source: string, message: string, type: 'info' | 'warning' | 'critical') => {
      const newLog = {
        id: `log_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source,
        message,
        type,
      };
      setLogs(prev => [newLog, ...prev.slice(0, 199)]);
    };

    addSystemLog('ada.passkit', 'Authentication sequence initiated...', 'info');
    await new Promise(res => setTimeout(res, 500));
    addSystemLog('ada.passkit', 'Validating Passkit... [OK]', 'info');
    await new Promise(res => setTimeout(res, 800));
    addSystemLog('ada.legal', 'Querying for legal clearance...', 'warning');
    await new Promise(res => setTimeout(res, 1000));

    const hasBreach = Math.random() < 0.3;

    if (hasBreach) {
      addSystemLog('ada.legal', 'BREACH DETECTED. Article H.2: Outstanding Debt.', 'critical');
      await new Promise(res => setTimeout(res, 500));
      setUserProfile({
        id: 'ahmet-engin-gm', name: 'Ahmet Engin', role: 'GENERAL_MANAGER',
        clearanceLevel: 2, legalStatus: 'RED', contractId: 'WIM-01'
      });
      addSystemLog('ada.passkit', 'Access granted with RESTRICTED clearance. Operational commands denied.', 'critical');
    } else {
      addSystemLog('ada.legal', 'Legal Standing: GREEN. No breaches found.', 'info');
      await new Promise(res => setTimeout(res, 500));
      setUserProfile({
        id: 'ahmet-engin-gm', name: 'Ahmet Engin', role: 'GENERAL_MANAGER',
        clearanceLevel: 5, legalStatus: 'GREEN', contractId: 'WIM-01'
      });
      addSystemLog('ada.passkit', 'Level 5 Clearance Granted. Welcome, General Manager.', 'info');
    }
  };

  const handleInitiateVhfCall = () => {
    if (isMonitoring) {
      setIsVoiceModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden">
      <header className="h-10 flex-shrink-0 flex items-center justify-center border-b border-zinc-900">
        <h1 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Ada stargate</h1>
      </header>
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar {...{ nodeStates, activeChannel, onChannelChange: setActiveChannel, isMonitoring, onMonitoringToggle: () => setIsMonitoring(!isMonitoring), userProfile }} />
        <div className="flex flex-col flex-1 relative min-w-0 border-r border-zinc-900/50">
          <header className="h-10 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between px-3 flex-shrink-0">
             <div className="flex items-center gap-2">
                <h1 className="text-xs font-semibold text-zinc-300">Ada Orchestrator</h1>
             </div>
             <button onClick={() => setIsTraceModalOpen(true)} className="p-1 rounded-md text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="View Agent Traces">
                <BrainCircuit size={16} />
             </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="max-w-3xl mx-auto">
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              {isLoading && messages[messages.length - 1]?.role === MessageRole.User && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="p-3 bg-zinc-950/50 border-t border-zinc-900">
             <InputArea {...{ onSend: handleSend, isLoading, selectedModel, onModelChange: setSelectedModel, onInitiateVhfCall: handleInitiateVhfCall, isMonitoring }} />
          </div>
        </div>
        {isCanvasOpen && (
          <Canvas {...{ logs, registry, tenders, trafficQueue, weatherData, activeChannel, isMonitoring, userProfile, vesselsInPort }} />
        )}
      </div>
      <StatusBar {...{ userProfile, onToggleAuth: toggleAuth, nodeHealth: "working", latency: 12, activeChannel }} />
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />
      {tokenStats.total > 0 && (
        <div className="fixed bottom-8 right-3 bg-zinc-950/90 border border-zinc-800 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg text-[10px] font-mono text-zinc-200 z-50">
            <div>In: {tokenStats.input} / Out: {tokenStats.output}</div>
            <div>Cost: ${tokenStats.costUsd.toFixed(4)}</div>
        </div>
      )}
      <AgentTraceModal 
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        traces={transformDecisionLogsToAgentTraces(decisionLogs)}
      />
    </div>
  );
}
