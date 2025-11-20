
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType, RegistryEntry, Tender, UserProfile, AgentTraceLog, AgentObservation, WeatherForecast, TrafficEntry } from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse } from './services/geminiService';
import { Menu, Anchor, BrainCircuit } from 'lucide-react';
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

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Pro);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const [agentTraces, setAgentTraces] = useState<AgentTraceLog[]>([]);
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

  // --- Restored Simulation Engine ---
  useEffect(() => {
    const generateLog = () => {
      const sourceNode = ['ada.vhf', 'ada.security', 'ada.finance', 'ada.weather', 'ada.marina'][Math.floor(Math.random() * 5)];
      const vessel = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)];
      let message = '';
      let type = 'info';

      switch (sourceNode) {
        case 'ada.vhf':
          const channel = ['16', '73', '12', '13', '14'][Math.floor(Math.random() * 5)];
          if (activeChannel !== 'SCAN' && activeChannel !== channel) return;
          const actions = ["requesting pilot", "calling security", "at Pontoon C", "routine check"];
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
        case 'ada.weather':
          // This will be fed by the new weather state
          return; // Prevent duplicate weather logs
        case 'ada.marina':
           const op = ['Berth C-14 power restored', 'Blackwater pump-out complete for M/Y Poseidon', 'Guest arrival at main gate'];
           message = op[Math.floor(Math.random() * op.length)];
           break;
      }
      
      const newLog = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: sourceNode,
        message: message,
        type: type,
      };
      setLogs(prev => [newLog, ...prev.slice(0, 199)]);
      setNodeStates(prev => ({...prev, [sourceNode]: 'working' }));
      setTimeout(() => setNodeStates(prev => ({...prev, [sourceNode]: 'connected' })), 500);
    };
    
    const updateRegistryAndTraffic = () => {
        if(Math.random() < 0.1) {
            const isCheckIn = Math.random() > 0.5;
            const newEntry: RegistryEntry = {
                id: `reg_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                vessel: VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)],
                action: isCheckIn ? 'CHECK-IN' : 'CHECK-OUT',
                location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
                status: 'AUTHORIZED'
            };
            setRegistry(prev => [newEntry, ...prev.slice(0, 49)]);
        }

        setTrafficQueue(prev => {
            let queue = [...prev];
            if (Math.random() < 0.2) {
                const newTraffic: TrafficEntry = { id: `tq_${Date.now()}`, vessel: VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)], status: 'INBOUND', priority: 4, sector: 'Entrance' };
                queue.push(newTraffic);
            }
            queue = queue.map(t => Math.random() < 0.1 ? {...t, status: t.status === 'INBOUND' ? 'TAXIING' : 'DOCKED'} : t).filter(t => t.status !== 'DOCKED');
            return queue.slice(0, 10);
        });
    };

    const updateWeatherData = () => {
        const days = ['Today', 'Tomorrow', 'Day 3'];
        const conditions: WeatherForecast['condition'][] = ['Sunny', 'Cloudy', 'Rain', 'Windy', 'Storm'];
        const newForecast = days.map((day, i) => {
            const wind = 10 + Math.floor(Math.random() * 25);
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
    };

    const interval = setInterval(() => {
      if (!isMonitoring) return;
      generateLog();
      updateRegistryAndTraffic();
    }, 1200);

    const weatherInterval = setInterval(updateWeatherData, 5000); // Weather updates less frequently

    return () => {
        clearInterval(interval);
        clearInterval(weatherInterval);
    };
  }, [isMonitoring, activeChannel]);

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

    const observation: AgentObservation = {
      source: 'user',
      payload: { text, attachments: userMessage.attachments },
      timestamp: Date.now(),
    };

    const addTrace = (trace: Omit<AgentTraceLog, 'id' | 'timestamp'>) => {
      const newTrace = { ...trace, id: `trace_${Date.now()}_${Math.random()}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
      setAgentTraces(prev => [newTrace, ...prev]);
    };

    addTrace({ persona: 'ORCHESTRATOR', step: 'PLANNING', content: 'Received user request. Analyzing intent...' });
    
    await new Promise(res => setTimeout(res, 300));
    const actions = await brainRef.current.handleObservation(observation, 'travel_booking_v1');
    
    addTrace({ persona: 'EXPERT', step: 'ANALYSIS', content: `Decomposed task into ${actions.length} steps via MDAP graph. Primary action: '${actions[0]?.name || 'N/A'}'` });

    await new Promise(res => setTimeout(res, 500));
    if (actions.length > 0 && actions[0].kind === 'external') {
      addTrace({ persona: 'EXPERT', step: 'TOOL_CALL', content: `Calling tool: \`${actions[0].name}\`\nParams: ${JSON.stringify(actions[0].params)}` });
      await new Promise(res => setTimeout(res, 800));
      addTrace({ persona: 'WORKER', step: 'CODE_OUTPUT', content: `Tool \`${actions[0].name}\` returned: { "status": "ok", "result": "completed" }` });
      await new Promise(res => setTimeout(res, 400));
    }

    addTrace({ persona: 'ORCHESTRATOR', step: 'FINAL_ANSWER', content: 'Synthesizing final response for user...' });

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
          lastCall: new Date().toLocaleTimeString(),
        });
      }
    );

    setIsLoading(false);
  };
  
  const toggleAuth = async () => {
    // Cinematic Auth Sequence
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar {...{ nodeStates, activeChannel, onChannelChange: setActiveChannel, isMonitoring, onMonitoringToggle: () => setIsMonitoring(!isMonitoring), userProfile }} />
        <div className="flex flex-col flex-1 relative min-w-0 border-r border-zinc-900/50">
          <header className="h-10 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between px-3 flex-shrink-0">
             <div className="flex items-center gap-2">
                <Menu size={16} className="text-zinc-500" />
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
          <div className="p-3 bg-zinc-950 border-t border-zinc-900">
             <InputArea {...{ onSend: handleSend, isLoading, selectedModel, onModelChange: setSelectedModel, useSearch, onToggleSearch: () => setUseSearch(!useSearch), useThinking, onToggleThinking: () => setUseThinking(!useThinking), onStartVoice: () => setIsVoiceModalOpen(true) }} />
          </div>
        </div>
        {isCanvasOpen && (
          <Canvas {...{ logs, registry, tenders, trafficQueue, weatherData, activeChannel, isMonitoring, userProfile }} />
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
        traces={agentTraces}
      />
    </div>
  );
}
