
import React, { useState, useCallback, useEffect } from 'react';
import { Activity, List, Map, AlertTriangle, Search, Filter, AlertCircle, ClipboardList, Ship, CloudRain, Wind, Anchor, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { RegistryEntry, Tender, UserProfile } from '../types';

interface SystemLog {
  id: string;
  timestamp: string;
  node: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'critical' | 'alert';
}

interface CanvasProps {
  logs: SystemLog[];
  registry: RegistryEntry[];
  tenders: Tender[];
  activeChannel: string;
  isMonitoring: boolean;
  userProfile: UserProfile;
}

export const Canvas: React.FC<CanvasProps> = ({ logs, registry, tenders, activeChannel, isMonitoring, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'fleet'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showWarningOnly, setShowWarningOnly] = useState(false);
  
  // Resizable Canvas State
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth > 300 && newWidth < 800) {
          setWidth(newWidth);
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

  const getRowStyle = (log: SystemLog) => {
    const msg = log.message.toUpperCase();
    if (log.type === 'critical' || msg.includes('MAYDAY') || msg.includes('COLLISION') || msg.includes('FIRE')) {
      return 'bg-red-900/60 border-l-4 border-red-500 animate-pulse shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]';
    }
    if (log.type === 'alert' || msg.includes('PAN PAN')) {
      return 'bg-orange-900/50 border-l-4 border-orange-500 shadow-[inset_0_0_10px_rgba(234,88,12,0.2)]';
    }
    if (log.type === 'warning' || msg.includes('SECURITE')) {
      return 'bg-yellow-900/40 border-l-4 border-yellow-500';
    }
    return 'hover:bg-zinc-800/50 border-l-4 border-transparent';
  };

  const getTextStyle = (log: SystemLog) => {
    const msg = log.message.toUpperCase();
    if (log.type === 'critical' || msg.includes('MAYDAY')) return 'text-white font-bold drop-shadow-md';
    if (log.type === 'alert' || msg.includes('PAN PAN')) return 'text-white font-semibold drop-shadow-sm';
    if (log.type === 'warning' || msg.includes('SECURITE')) return 'text-yellow-100 font-medium';
    return 'text-zinc-400 group-hover:text-zinc-300';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.node.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isUrgent = log.type === 'critical' || log.type === 'alert' || log.message.includes('MAYDAY') || log.message.includes('PAN PAN');
    const isWarning = log.type === 'warning' || log.message.includes('SECURITE');

    let matchesType = true;
    
    if (showUrgentOnly && showWarningOnly) {
        matchesType = isUrgent || isWarning;
    } else if (showUrgentOnly) {
        matchesType = isUrgent;
    } else if (showWarningOnly) {
        matchesType = isWarning;
    }

    return matchesSearch && matchesType;
  });

  return (
    <div 
      className="hidden lg:flex flex-col h-full bg-zinc-950 border-l border-zinc-900 flex-shrink-0 relative"
      style={{ width: width }}
    >
      {/* Resize Handle */}
      <div 
        className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />

      {/* Header */}
      <div className="p-3 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 text-zinc-300">
          <Activity size={14} />
          <span className="font-bold text-xs uppercase tracking-tight">Live Ops Deck</span>
        </div>
        <div className="flex bg-zinc-900 rounded p-0.5">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`p-1 rounded transition-all ${activeTab === 'feed' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Live Feed"
          >
            <List size={12} />
          </button>
          <button 
            onClick={() => setActiveTab('fleet')}
            className={`p-1 rounded transition-all ${activeTab === 'fleet' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Fleet & Weather"
          >
            <Map size={12} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/10">
        
        {activeTab === 'feed' && (
          <>
             {/* Filters */}
            <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between select-none gap-2">
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                  className={`p-1 rounded border transition-all flex items-center gap-1 ${
                    showUrgentOnly 
                    ? 'bg-red-900/30 border-red-500/50 text-red-400' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                  }`}
                  title="Show Critical Only"
                >
                  <AlertTriangle size={10} />
                </button>
                <button 
                  onClick={() => setShowWarningOnly(!showWarningOnly)}
                  className={`p-1 rounded border transition-all flex items-center gap-1 ${
                    showWarningOnly
                    ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                  }`}
                  title="Show Warnings Only"
                >
                  <AlertCircle size={10} />
                </button>
              </div>

              <div className="relative flex-1">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" size={10} />
                 <input 
                   type="text" 
                   placeholder="Filter log stream..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] rounded pl-6 pr-2 py-1 focus:outline-none focus:border-indigo-500/30 transition-colors placeholder-zinc-700 font-mono"
                 />
              </div>
            </div>

            {/* Logs Stream */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar font-mono text-[10px]">
              {filteredLogs.map((log) => (
                <div key={log.id} className={`flex gap-2 p-1.5 rounded border border-transparent transition-colors group ${getRowStyle(log)}`}>
                  <span className={`flex-shrink-0 w-12 opacity-50 ${log.type === 'critical' ? 'text-white' : 'text-zinc-500'}`}>
                    {log.timestamp}
                  </span>
                  <div className="flex flex-col min-w-0 w-full">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        log.type === 'critical' ? 'text-red-200' :
                        log.type === 'alert' ? 'text-orange-200' :
                        log.node.includes('sea') ? 'text-blue-400' : 
                        log.node.includes('finance') ? 'text-green-400' :
                        log.node.includes('marina') ? 'text-cyan-400' : 
                        log.node.includes('vhf') ? 'text-indigo-400' : 'text-purple-400'
                      }`}>
                        {log.node}
                      </span>
                    </div>
                    <span className={`break-words leading-tight ${getTextStyle(log)}`}>
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'fleet' && (
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
             
             {/* 1. WEATHER STATION (ada.weather.wim) */}
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                     <CloudRain size={12} /> Weather Stn
                   </span>
                   <span className="text-[9px] text-green-500 font-mono">ONLINE</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                   <div className="text-center">
                      <div className="text-[10px] text-zinc-500">TODAY</div>
                      <div className="text-xl text-zinc-200 font-bold">22°C</div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1"><Wind size={10}/> 12kt NW</div>
                   </div>
                   <div className="h-8 w-[1px] bg-zinc-800"></div>
                   <div className="text-center">
                      <div className="text-[10px] text-zinc-500">TOMORROW</div>
                      <div className="text-xl text-yellow-200 font-bold">19°C</div>
                      <div className="text-[10px] text-yellow-500 font-bold flex items-center justify-center gap-1"><AlertTriangle size={8}/> 28kt N</div>
                   </div>
                   <div className="h-8 w-[1px] bg-zinc-800"></div>
                   <div className="text-center">
                      <div className="text-[10px] text-zinc-500">DAY 3</div>
                      <div className="text-xl text-zinc-200 font-bold">20°C</div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1"><Wind size={10}/> 15kt NE</div>
                   </div>
                </div>
             </div>

             {/* 2. TRAFFIC TOWER (ATC Logic) */}
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                     <Anchor size={12} /> Traffic Control (Tower)
                   </span>
                   <span className="text-[9px] text-indigo-400 font-mono">CH 12</span>
                </div>
                <div className="p-2 space-y-1">
                   {/* Inbound */}
                   <div className="flex items-center justify-between bg-zinc-900/50 p-1.5 rounded border border-zinc-800/50">
                      <div className="flex items-center gap-2">
                         <ArrowDown size={12} className="text-green-400" />
                         <span className="text-[10px] text-zinc-300 font-medium">M/Y Blue Horizon</span>
                      </div>
                      <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">CLEARED</span>
                   </div>
                   {/* Outbound */}
                   <div className="flex items-center justify-between bg-zinc-900/50 p-1.5 rounded border border-zinc-800/50">
                      <div className="flex items-center gap-2">
                         <ArrowUp size={12} className="text-blue-400" />
                         <span className="text-[10px] text-zinc-300 font-medium">S/Y Mistral</span>
                      </div>
                      <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">TAXIING</span>
                   </div>
                   {/* Holding */}
                   <div className="flex items-center justify-between bg-yellow-900/10 p-1.5 rounded border border-yellow-500/20">
                      <div className="flex items-center gap-2">
                         <Clock size={12} className="text-yellow-500 animate-pulse" />
                         <span className="text-[10px] text-yellow-200 font-medium">Tender Bravo (Towing)</span>
                      </div>
                      <span className="text-[9px] text-yellow-500 px-1.5 py-0.5 rounded font-bold">HOLDING</span>
                   </div>
                </div>
             </div>

             {/* 3. TENDER STATUS */}
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                    <Ship size={10} /> Tenders (Ch 14)
                  </span>
                </div>
                <div className="grid gap-1 p-2">
                  {tenders.map(tender => (
                    <div key={tender.id} className="bg-zinc-900/30 border border-zinc-800/50 p-1.5 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          tender.status === 'Idle' ? 'bg-green-500' : 
                          tender.status === 'Busy' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                        }`} />
                        <span className="text-[10px] font-medium text-zinc-300">{tender.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">{tender.status}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* 4. REGISTRY TABLE */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/50">
                   <ClipboardList size={12} className="text-zinc-400" />
                   <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">Registry</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-zinc-900/50 text-zinc-500">
                      <tr>
                        <th className="px-2 py-1 font-normal">Time</th>
                        <th className="px-2 py-1 font-normal">Vessel</th>
                        <th className="px-2 py-1 font-normal text-right">Sts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                      {registry.slice(0, 6).map((entry) => (
                        <tr key={entry.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-2 py-1 text-zinc-500">{entry.timestamp}</td>
                          <td className="px-2 py-1 text-zinc-300">{entry.vessel}</td>
                          <td className="px-2 py-1 text-right">
                            <span className={`px-1 py-0.5 rounded-[2px] text-[8px] font-bold ${
                              entry.action === 'CHECK-IN' ? 'text-green-400' : 'text-blue-400'
                            }`}>
                              {entry.action === 'CHECK-IN' ? 'IN' : 'OUT'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

          </div>
        )}

      </div>
    </div>
  );
};
