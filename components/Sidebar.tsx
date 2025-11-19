import React, { useEffect, useState, useRef } from 'react';
import { Plus, Github, Anchor, Activity } from 'lucide-react';

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
  
  // State to track the status of each core node
  const [nodeStates, setNodeStates] = useState<Record<string, NodeStatus>>({
    'ada.sea': 'connected',
    'ada.marina': 'connected',
    'ada.finance': 'connected',
    'ada.customer': 'connected',
    'ada.passkit': 'connected',
    'ada.legal': 'connected',
    'ada.weather': 'connected'
  });

  // Core nodes definition
  const coreNodes = [
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
      const isVesselAction = Math.random() > 0.4;
      let nodeFull, nodeBase, msg, type;

      if (isVesselAction) {
        const vessel = vesselNames[Math.floor(Math.random() * vesselNames.length)];
        nodeFull = `ada.sea.${vessel}`;
        nodeBase = 'ada.sea';
        
        const vesselActions = [
          { msg: 'VHF Ch 16 Heartbeat', type: 'info' },
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
        setLogs(prev => [...prev.slice(-20), generateLog()]);
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

  return (
    <div className="hidden md:flex w-72 flex-col h-full bg-zinc-950 border-r border-zinc-900 font-mono relative">
      {/* Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Anchor className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Ada</h1>
            <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Orchestrator</span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-zinc-900/80 rounded px-2 py-1.5 border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase">Tenant</span>
          <span className="text-[11px] text-indigo-400 font-semibold">wim.ada.network</span>
        </div>
      </div>

      {/* NEW: Core Services Single Line Ticker */}
      <div className="w-full border-b border-zinc-900 bg-zinc-900/30 py-2 px-3 overflow-x-auto custom-scrollbar whitespace-nowrap">
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

      <div className="p-3">
        <button 
          onClick={onClear}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded transition-all text-xs uppercase font-medium tracking-wide"
        >
          <Plus size={14} />
          Reset Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        
        {/* Live Event Bus */}
        <div className="mb-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
               <Activity size={10} /> Fleet Event Bus
             </span>
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 bg-black/40 rounded border border-zinc-800/50 overflow-hidden relative min-h-[300px]">
            <div className="absolute inset-0 p-2 overflow-y-auto text-[9px] space-y-1.5 custom-scrollbar font-mono">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                  <span className="text-zinc-600 flex-shrink-0">{log.timestamp}</span>
                  <div className="flex flex-col">
                    <span className={`font-semibold ${
                      log.node.includes('sea') ? 'text-blue-400' : 
                      log.node.includes('finance') ? 'text-green-400' :
                      log.node.includes('marina') ? 'text-cyan-400' : 'text-purple-400'
                    }`}>{log.node}</span>
                    <span className="text-zinc-400 break-all">{log.message}</span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-zinc-900">
        <a 
          href="https://github.com/ahmetengin/Ada" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <Github size={12} />
          <span>v2.5.0 / WIM Tenant Active</span>
        </a>
      </div>
    </div>
  );
};
