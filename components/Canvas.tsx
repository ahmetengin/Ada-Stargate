
import React, { useState, useCallback, useEffect } from 'react';
import { Activity, List, Map, AlertTriangle, Search, Filter, AlertCircle, ClipboardList, Ship, CloudRain, Wind, Anchor, ArrowDown, ArrowUp, Clock, Cloud, Sun, Thermometer, Navigation, Radar } from 'lucide-react';
import { RegistryEntry, Tender, UserProfile, TrafficEntry, WeatherForecast } from '../types';

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
  trafficQueue: TrafficEntry[];
  weatherData: WeatherForecast[];
  activeChannel: string;
  isMonitoring: boolean;
  userProfile: UserProfile;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  logs, 
  registry, 
  tenders, 
  trafficQueue,
  weatherData,
  activeChannel, 
  isMonitoring, 
  userProfile 
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'fleet' | 'cloud' | 'ais'>('feed');
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
        if (newWidth > 300 && newWidth < 900) {
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

  // Icons mapping for weather
  const getWeatherIcon = (condition: string) => {
    switch(condition) {
      case 'Rain': case 'Storm': return <CloudRain size={16} className="text-blue-400" />;
      case 'Cloudy': return <Cloud size={16} className="text-zinc-400" />;
      case 'Windy': return <Wind size={16} className="text-zinc-400" />;
      default: return <Sun size={16} className="text-yellow-400" />;
    }
  };

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
            title="Fleet & Tenders"
          >
            <Ship size={12} />
          </button>
          <button 
            onClick={() => setActiveTab('cloud')}
            className={`p-1 rounded transition-all ${activeTab === 'cloud' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Weather & ATC"
          >
            <Cloud size={12} />
          </button>
          <button 
            onClick={() => setActiveTab('ais')}
            className={`p-1 rounded transition-all ${activeTab === 'ais' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="AIS Radar"
          >
            <Radar size={12} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/10">
        
        {/* --- TAB 1: LIVE FEED --- */}
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

        {/* --- TAB 2: FLEET (Registry & Tenders) --- */}
        {activeTab === 'fleet' && (
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
             
             {/* TENDER OPERATIONS */}
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                    <Anchor size={10} /> Tenders (Ch 14)
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
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">{tender.status}</span>
                        {tender.assignment && <span className="text-[8px] text-indigo-400">{tender.assignment}</span>}
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* REGISTRY TABLE */}
             <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/50">
                   <ClipboardList size={12} className="text-zinc-400" />
                   <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">Port Registry</span>
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
                      {registry.slice(0, 15).map((entry) => (
                        <tr key={entry.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-2 py-1 text-zinc-500">{entry.timestamp}</td>
                          <td className="px-2 py-1 text-zinc-300">{entry.vessel}</td>
                          <td className="px-2 py-1 text-right">
                            <span className={`px-1 py-0.5 rounded-[2px] text-[8px] font-bold ${
                              entry.action === 'CHECK-IN' ? 'text-green-400 bg-green-900/20' : 'text-blue-400 bg-blue-900/20'
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

        {/* --- TAB 3: CLOUD (Weather & Traffic Tower) --- */}
        {activeTab === 'cloud' && (
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
             
             {/* WEATHER STATION DASHBOARD */}
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                     <CloudRain size={12} /> Weather Station
                   </span>
                   <span className="text-[9px] text-green-500 font-mono">LIVE</span>
                </div>
                {/* Main Weather Display */}
                <div className="p-3 flex items-center justify-between">
                   {weatherData.map((w, idx) => (
                     <div key={idx} className="flex flex-col items-center w-1/3 relative">
                        {/* Vertical Separator */}
                        {idx > 0 && <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-zinc-800"></div>}
                        
                        <span className="text-[9px] text-zinc-500 uppercase mb-1">{w.day}</span>
                        <div className="mb-1">{getWeatherIcon(w.condition)}</div>
                        <div className="text-lg font-bold text-zinc-200">{w.temp}°</div>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-1">
                           <Wind size={8} /> 
                           <span className={w.windSpeed > 25 ? 'text-red-400 font-bold' : ''}>{w.windSpeed}kt {w.windDir}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* TRAFFIC CONTROL TOWER (ATC) */}
             <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                     <Navigation size={12} /> Traffic Tower (ATC)
                   </span>
                   <span className="text-[9px] text-indigo-400 font-mono">CH 12</span>
                </div>
                <div className="p-2 space-y-1">
                   {trafficQueue.length === 0 && (
                      <div className="text-center text-[10px] text-zinc-600 py-4">Fairway Clear. No active traffic.</div>
                   )}
                   {trafficQueue.map((t) => (
                      <div key={t.id} className={`flex items-center justify-between p-1.5 rounded border ${
                          t.status === 'HOLDING' ? 'bg-yellow-900/10 border-yellow-500/20' : 
                          t.status === 'TAXIING' ? 'bg-blue-900/10 border-blue-500/20' :
                          'bg-zinc-900/50 border-zinc-800/50'
                      }`}>
                          <div className="flex items-center gap-2">
                             {t.status === 'INBOUND' && <ArrowDown size={12} className="text-green-400" />}
                             {t.status === 'OUTBOUND' && <ArrowUp size={12} className="text-blue-400" />}
                             {t.status === 'HOLDING' && <Clock size={12} className="text-yellow-500 animate-pulse" />}
                             <span className="text-[10px] text-zinc-300 font-medium">{t.vessel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-zinc-500">{t.sector}</span>
                             <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                 t.status === 'HOLDING' ? 'text-yellow-500 bg-yellow-900/20' : 
                                 t.status === 'TAXIING' ? 'text-blue-400 bg-blue-900/20' : 'text-zinc-400 bg-zinc-800'
                             }`}>
                                {t.status}
                             </span>
                          </div>
                      </div>
                   ))}
                </div>
             </div>

          </div>
        )}

        {/* --- TAB 4: AIS MAP (Placeholder) --- */}
        {activeTab === 'ais' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-600">
                <div className="relative w-32 h-32 mb-4">
                    <div className="absolute inset-0 border-2 border-zinc-800 rounded-full"></div>
                    <div className="absolute inset-4 border border-zinc-800 rounded-full opacity-50"></div>
                    <div className="absolute inset-0 border-t-2 border-green-500/50 rounded-full animate-spin duration-[3000ms]"></div>
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-xs font-mono font-bold">AIS RADAR SYSTEM</span>
                <span className="text-[10px] mt-2">Scanning Marine Traffic...</span>
                <span className="text-[10px] text-zinc-700 mt-1">Integration pending valid API Key</span>
            </div>
        )}

      </div>
    </div>
  );
};
