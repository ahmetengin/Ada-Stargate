import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Github, Anchor, Activity, Radio, Power, Sliders } from 'lucide-react';

interface SidebarProps {
  onClear: () => void;
}

interface SystemLog {
  id: string;
  timestamp: string;
  node: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

type NodeStatus = 'connected' | 'working' | 'disconnected';

export const Sidebar: React.FC<SidebarProps> = ({ onClear }) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(288); // Default w-72 (288px)
  const [isResizing, setIsResizing] = useState(false);

  // VHF Control State
  const [activeChannel, setActiveChannel] = useState<string>('SCAN');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  
  // State to track the status of each core node
  const [nodeStates, setNodeStates] = useState<Record<string, NodeStatus>>({
    'ada.sea': 'connected',
    'ada.marina': 'connected',
    'ada.finance': 'connected',
    'ada.customer': 'connected',
    'ada.passkit': 'connected',
    'ada.legal': 'connected',
    'ada.weather': 'connected',
    'ada.vhf': 'connected'
  });

  // Refs to access state inside intervals
  const monitoringRef = useRef(isMonitoring);
  const channelRef = useRef(activeChannel);

  // Resize Logic
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        // Constraints: Min 200px, Max 600px
        if (newWidth > 200 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);


  useEffect(() => {
    monitoringRef.current = isMonitoring;
    channelRef.current = activeChannel;
  }, [isMonitoring, activeChannel]);

  // Core nodes definition
  const coreNodes = [
    { id: 'ada.vhf', label: 'VHF' },
    { id: 'ada.sea', label: 'SEA' },
    { id: 'ada.marina', label: 'MARINA' },
    { id: 'ada.finance', label: 'FINANCE' },
    { id: 'ada.customer', label: 'CRM' },
    { id: 'ada.passkit', label: 'PASS' },
    { id: 'ada.legal', label: 'LEGAL' },
    { id: 'ada.weather', label: 'WX' },
  ];

  // Simulate autonomous background activity
  useEffect(() => {
    const vesselNames = [
      'phisedelia', 'blue_horizon', 'karayel', 'mistral', 'aegean_queen', 
      'marmara_star', 'sirocco', 'levante', 'poyraz', 'meltem', 
      'odyssey', 'poseidon', 'neptune', 'mermaid', 'atlantis'
    ];

    const serviceNodes = ['ada.marina.wim', 'ada.finance.wim', 'ada.weather.wim', 'ada.customer.wim'];

    const generateLog = () => {
      const rand = Math.random();
      let nodeFull, nodeBase, msg, type;

      // 25% Chance of VHF Radio Traffic
      if (rand < 0.25) {
         // Skip if monitoring is disabled
         if (!monitoringRef.current) return null;

         nodeFull = 'ada.vhf.wim';
         nodeBase = 'ada.vhf';
         
         const currentCh = channelRef.current;
         
         // Define message pools per channel
         const msgs16 = [
            'Securite: Dredging ops at marina entrance.',
            'Mayday Relay: Vessel requiring tow near sector 4.',
            'All stations: Weather warning gale force 8.',
            'Radio check, 1-2-3. Over.'
         ];
         const msgs73 = [
            'Phisedelia requesting pilot for exit.',
            'M/Y Blue Star approaching A-Pontoon.',
            'Marina control, requesting fuel dock status.',
            'Palamar boat requested at berth B-14.',
            'Berthing assistance complete.'
         ];
         const msgs06 = [
            'Intership: Switching to Ch 06.',
            'S/Y Mistral calling S/Y Karayel.',
            'Regatta start sequence in 5 minutes.'
         ];
         const msgsOps = [
            'Patrol Bravo: Perimeter check clear.',
            'Water pressure alert on Pontoon C.',
            'Gate 4 access log verified.'
         ];

         let selectedChLabel = '';
         let selectedMsg = '';

         // If SCAN mode, pick any
         if (currentCh === 'SCAN') {
            const dice = Math.random();
            if (dice < 0.3) { selectedChLabel = 'CH 16'; selectedMsg = msgs16[Math.floor(Math.random() * msgs16.length)]; }
            else if (dice < 0.6) { selectedChLabel = 'CH 73'; selectedMsg = msgs73[Math.floor(Math.random() * msgs73.length)]; }
            else if (dice < 0.8) { selectedChLabel = 'CH 06'; selectedMsg = msgs06[Math.floor(Math.random() * msgs06.length)]; }
            else { selectedChLabel = 'SEC'; selectedMsg = msgsOps[Math.floor(Math.random() * msgsOps.length)]; }
         } else {
            // Specific Channel Mode
            selectedChLabel = `CH ${currentCh}`;
            if (currentCh === '16') selectedMsg = msgs16[Math.floor(Math.random() * msgs16.length)];
            else if (currentCh === '73') selectedMsg = msgs73[Math.floor(Math.random() * msgs73.length)];
            else if (currentCh === '06') selectedMsg = msgs06[Math.floor(Math.random() * msgs06.length)];
            else return null; // Should not happen based on UI options
         }

         msg = `[${selectedChLabel}] ${selectedMsg}`;
         type = 'info';

      } else if (rand < 0.6) {
        // Vessel Node Activity
        const vessel = vesselNames[Math.floor(Math.random() * vesselNames.length)];
        nodeFull = `ada.sea.${vessel}`;
        nodeBase = 'ada.sea';
        
        const vesselActions = [
          { msg: 'NMEA2000 Sync: Wind 12kts', type: 'info' },
          { msg: 'Requesting Berth Status', type: 'info' },
          { msg: 'Battery Level: 98%', type: 'success' },
          { msg: 'Bilge Pump: Standby', type: 'info' },
          { msg: 'Location Update: 40.9N 28.8E', type: 'info' }
        ];
        const action = vesselActions[Math.floor(Math.random() * vesselActions.length)];
        msg = action.msg;
        type = action.type;
      } else {
        // Service Node Activity
        nodeFull = serviceNodes[Math.floor(Math.random() * serviceNodes.length)];
        // Extract base like 'ada.marina'
        nodeBase = nodeFull.split('.').slice(0, 2).join('.');
        
        const serviceActions = [
          { msg: 'Batch Invoice Processing', type: 'info' },
          { msg: 'Weather Warning: Gale Force 7', type: 'warning' },
          { msg: 'Gate Access Granted', type: 'success' },
          { msg: 'Churn Prediction Model Update', type: 'info' },
          { msg: 'Fleet Status: 602 Online', type: 'success' }
        ];
        const action = serviceActions[Math.floor(Math.random() * serviceActions.length)];
        msg = action.msg;
        type = action.type;
      }

      // 1. Trigger "Working" (Yellow) state for the relevant node
      setNodeStates(prev => ({ ...prev, [nodeBase]: 'working' }));

      // 2. Revert to "Connected" (Green) after a short delay
      setTimeout(() => {
        setNodeStates(prev => ({ ...prev, [nodeBase]: 'connected' }));
      }, 600);

      return {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        node: nodeFull,
        message: msg,
        type: type as 'info' | 'success' | 'warning'
      };
    };

    // Traffic Interval
    const logInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const newLog = generateLog();
        if (newLog) {
           setLogs(prev => [...prev.slice(-20), newLog]);
        }
      }
    }, 1200);

    // Random Disconnect Simulation (Red)
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        const randomNode = coreNodes[Math.floor(Math.random() * coreNodes.length)].id;
        setNodeStates(prev => ({ ...prev, [randomNode]: 'disconnected' }));
        setTimeout(() => {
           setNodeStates(prev => ({ ...prev, [randomNode]: 'connected' }));
        }, 2000);
      }
    }, 5000);

    return () => {
      clearInterval(logInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'working': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
      case 'disconnected': return 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'connected': default: return 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]';
    }
  };

  const channels = ['16', '73', '06', 'SCAN'];

  return (
    <div 
      className="hidden md:flex flex-col h-full bg-zinc-950 border-r border-zinc-900 font-mono relative flex-shrink-0"
      style={{ width: sidebarWidth }}
    >
      {/* Resize Handle */}
      <div 
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />

      {/* Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/50 select-none">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Anchor className="text-white" size={20} />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none whitespace-nowrap">Ada</h1>
            <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase whitespace-nowrap">Orchestrator</span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-zinc-900/80 rounded px-2 py-1.5 border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase">Tenant</span>
          <span className="text-[11px] text-indigo-400 font-semibold truncate ml-2">wim.ada.network</span>
        </div>
      </div>

      {/* Core Services Single Line Ticker */}
      <div className="w-full border-b border-zinc-900 bg-zinc-900/30 py-2 px-3 overflow-x-auto custom-scrollbar whitespace-nowrap select-none">
        <div className="flex items-center gap-4">
          {coreNodes.map((node) => (
            <div key={node.id} className="flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${getStatusColor(nodeStates[node.id] || 'connected')}`} />
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                nodeStates[node.id] === 'working' ? 'text-yellow-200' :
                nodeStates[node.id] === 'disconnected' ? 'text-red-400' : 'text-zinc-500'
              }`}>
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Session Button */}
      <div className="p-3">
        <button 
          onClick={onClear}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded transition-all text-xs uppercase font-medium tracking-wide whitespace-nowrap"
        >
          <Plus size={14} />
          Reset Session
        </button>
      </div>
      
      {/* VHF Control Panel */}
      <div className="px-3 pb-3">
        <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <Radio size={12} className={isMonitoring ? "text-green-400 animate-pulse" : "text-zinc-600"} />
               <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase whitespace-nowrap">VHF Monitoring</span>
             </div>
             <button 
               onClick={() => setIsMonitoring(!isMonitoring)}
               className={`p-1 rounded-full transition-all ${isMonitoring ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'text-red-400 bg-red-400/10 hover:bg-red-400/20'}`}
               title={isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
             >
               <Power size={12} />
             </button>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5">
             {channels.map(ch => (
               <button
                 key={ch}
                 disabled={!isMonitoring}
                 onClick={() => setActiveChannel(ch)}
                 className={`text-[10px] font-mono py-1.5 rounded border transition-all ${
                    activeChannel === ch 
                    ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                 } ${!isMonitoring ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {ch}
               </button>
             ))}
          </div>
          
          <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-600 font-mono">
             <span>Status: {isMonitoring ? 'LISTENING' : 'OFFLINE'}</span>
             <span>{activeChannel === 'SCAN' ? 'ALL CH' : `CH ${activeChannel}`}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        
        {/* Live Event Bus */}
        <div className="mb-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
               <Activity size={10} /> Fleet Event Bus
             </span>
             <div className={`w-1.5 h-1.5 rounded-full transition-all ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`}></div>
          </div>
          <div className="flex-1 bg-black/40 rounded border border-zinc-800/50 overflow-hidden relative min-h-[200px]">
            <div className="absolute inset-0 p-2 overflow-y-auto text-[9px] space-y-1.5 custom-scrollbar font-mono">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                  <span className="text-zinc-600 flex-shrink-0">{log.timestamp}</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-semibold truncate ${
                      log.node.includes('sea') ? 'text-blue-400' : 
                      log.node.includes('finance') ? 'text-green-400' :
                      log.node.includes('marina') ? 'text-cyan-400' : 
                      log.node.includes('vhf') ? 'text-red-400' : 'text-purple-400'
                    }`}>{log.node}</span>
                    <span className={`break-words ${log.node.includes('vhf') ? 'text-red-200/70 italic' : 'text-zinc-400'}`}>
                       {log.message}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-zinc-900 select-none">
        <a 
          href="https://github.com/ahmetengin/Ada" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <Github size={12} />
          <span className="whitespace-nowrap">v2.5.0 / WIM Tenant Active</span>
        </a>
      </div>
    </div>
  );
};