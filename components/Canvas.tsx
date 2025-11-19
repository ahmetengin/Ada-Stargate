
import React, { useState, useCallback, useEffect } from 'react';
import { Activity, Server, Radio, Zap, Anchor, Map, List, AlertTriangle, Search, Filter, AlertCircle, ClipboardList, Ship } from 'lucide-react';
import { RegistryEntry, Tender } from '../types';

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
}

export const Canvas: React.FC<CanvasProps> = ({ logs, registry, tenders, activeChannel, isMonitoring }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'fleet'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showWarningOnly, setShowWarningOnly] = useState(false);
  
  // Resizable Canvas State
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        // Calculate new width from the right side of the screen
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
      // Urgent Red: High opacity background, bright red border
      return 'bg-red-900/60 border-l-4 border-red-500 animate-pulse shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]';
    }
    if (log.type === 'alert' || msg.includes('PAN PAN') || msg.includes('PAN-PAN')) {
      // Urgent Orange: Medium-high opacity
      return 'bg-orange-900/50 border-l-4 border-orange-500 shadow-[inset_0_0_10px_rgba(234,88,12,0.2)]';
    }
    if (log.type === 'warning' || msg.includes('SECURITE')) {
      // Warning Yellow: Visible opacity
      return 'bg-yellow-900/40 border-l-4 border-yellow-500';
    }
    return 'hover:bg-zinc-800/50 border-l-4 border-transparent';
  };

  const getTextStyle = (log: SystemLog) => {
    const msg = log.message.toUpperCase();
    // High contrast text for urgent backgrounds
    if (log.type === 'critical' || msg.includes('MAYDAY')) return 'text-white font-bold drop-shadow-md';
    if (log.type === 'alert' || msg.includes('PAN PAN')) return 'text-white font-semibold drop-shadow-sm';
    if (log.type === 'warning' || msg.includes('SECURITE')) return 'text-yellow-100 font-medium';
    return 'text-zinc-400 group-hover:text-zinc-300';
  };

  // Filter Logic: Search + Urgent + Warning Toggle
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
      {/* Resize Handle (Left Side) */}
      <div 
        className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />

      {/* Canvas Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold">
          <Activity size={16} className="text-indigo-500" />
          <span>Operations Deck</span>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-0.5">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`p-1.5 rounded-md transition-all ${activeTab === 'feed' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Live Feed"
          >
            <List size={14} />
          </button>
          <button 
            onClick={() => setActiveTab('fleet')}
            className={`p-1.5 rounded-md transition-all ${activeTab === 'fleet' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Registry & Fleet"
          >
            <Map size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/20">
        
        {activeTab === 'feed' && (
          <>
             {/* Status Banner & Filters */}
            <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between select-none gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider hidden xl:inline">
                  {isMonitoring ? `MONITORING: ${activeChannel === 'SCAN' ? 'ALL' : 'CH ' + activeChannel}` : 'OFFLINE'}
                </span>
              </div>
              
              <div className="flex gap-1">
                {/* Urgent Filter Button */}
                <button 
                  onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                  className={`p-1.5 rounded-md border transition-all flex items-center gap-1.5 ${
                    showUrgentOnly 
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Filter Critical/Urgent Events"
                >
                  <AlertTriangle size={12} className={showUrgentOnly ? "animate-pulse" : ""} />
                  <span className="text-[10px] font-mono font-bold uppercase hidden 2xl:inline">Critical</span>
                </button>

                {/* Warning Filter Button */}
                <button 
                  onClick={() => setShowWarningOnly(!showWarningOnly)}
                  className={`p-1.5 rounded-md border transition-all flex items-center gap-1.5 ${
                    showWarningOnly
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Filter Warning Events"
                >
                  <AlertCircle size={12} />
                  <span className="text-[10px] font-mono font-bold uppercase hidden 2xl:inline">Warning</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-[140px]">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                 <input 
                   type="text" 
                   placeholder="Filter logs..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] rounded pl-7 pr-2 py-1 focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600 font-mono"
                 />
              </div>

              <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0 w-12 text-right">
                {filteredLogs.length}
              </span>
            </div>

            {/* Logs Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar font-mono text-xs">
              {filteredLogs.map((log) => (
                <div key={log.id} className={`flex gap-3 p-2 rounded transition-colors group ${getRowStyle(log)}`}>
                  <span className={`flex-shrink-0 w-14 opacity-70 ${log.type === 'critical' || log.type === 'alert' ? 'text-white/80' : 'text-zinc-600'}`}>
                    {log.timestamp}
                  </span>
                  <div className="flex flex-col min-w-0 w-full">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        log.type === 'critical' ? 'text-red-100' :
                        log.type === 'alert' ? 'text-orange-100' :
                        log.node.includes('sea') ? 'text-blue-400' : 
                        log.node.includes('finance') ? 'text-green-400' :
                        log.node.includes('marina') ? 'text-cyan-400' : 
                        log.node.includes('vhf') ? 'text-indigo-400' : 'text-purple-400'
                      }`}>
                        {log.node}
                      </span>
                      {log.type === 'critical' && <AlertTriangle size={12} className="text-white animate-bounce" />}
                    </div>
                    <span className={`break-words mt-0.5 ${getTextStyle(log)}`}>
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center text-zinc-600 py-8 italic flex flex-col items-center gap-2">
                   <Filter size={24} className="opacity-20" />
                   <span>No events match criteria</span>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'fleet' && (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {/* Fleet Stats */}
             <div className="grid grid-cols-2 gap-4 mb-6 select-none">
               <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col items-center">
                 <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Occupancy</span>
                 <span className="text-2xl font-mono text-indigo-400 font-bold">92%</span>
               </div>
               <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col items-center">
                 <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Active Vessels</span>
                 <span className="text-2xl font-mono text-green-400 font-bold">602</span>
               </div>
             </div>

             {/* Tender Operations (Ch 14) */}
             <div className="mb-6">
                <div className="px-2 mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Ship size={12} /> Tender Ops (Ch 14)
                  </h3>
                </div>
                <div className="grid gap-3">
                  {tenders.map(tender => (
                    <div key={tender.id} className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          tender.status === 'Idle' ? 'bg-green-500' : 
                          tender.status === 'Busy' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                        }`} />
                        <div>
                           <div className="text-xs font-bold text-zinc-200">{tender.name}</div>
                           <div className="text-[10px] text-zinc-500">{tender.status}</div>
                        </div>
                      </div>
                      {tender.assignment && (
                        <div className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                           {tender.assignment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
             </div>

             {/* Port Registry Table */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/50">
                   <ClipboardList size={14} className="text-zinc-400" />
                   <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Daily Port Registry</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-zinc-900/80 text-zinc-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-medium">Time</th>
                        <th className="px-4 py-2 font-medium">Vessel</th>
                        <th className="px-4 py-2 font-medium">Action</th>
                        <th className="px-4 py-2 font-medium">Loc</th>
                        <th className="px-4 py-2 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {registry.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-600 italic">
                            No entries recorded today.
                          </td>
                        </tr>
                      ) : (
                        registry.map((entry) => (
                          <tr key={entry.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-2 text-zinc-400">{entry.timestamp}</td>
                            <td className="px-4 py-2 text-zinc-200 font-semibold">{entry.vessel}</td>
                            <td className="px-4 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                entry.action === 'CHECK-IN' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {entry.action}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-zinc-400">{entry.location}</td>
                            <td className="px-4 py-2 text-right">
                              <span className="text-zinc-500">{entry.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

      </div>
      
      {/* Footer Stats */}
      <div className="p-3 border-t border-zinc-900 bg-zinc-950 grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-500 select-none">
        <div className="flex items-center gap-1 justify-center">
           <Server size={10} />
           <span>LAT: 12ms</span>
        </div>
        <div className="flex items-center gap-1 justify-center">
           <Zap size={10} />
           <span>UP: 99.9%</span>
        </div>
        <div className="flex items-center gap-1 justify-center">
           <Radio size={10} />
           <span>SIG: -45dB</span>
        </div>
      </div>
    </div>
  );
};
