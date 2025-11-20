import React, { useState, useCallback, useEffect } from 'react';
import { List, Ship, Cloud, Radar, Search, AlertTriangle, AlertCircle, Wind, Sun, CloudRain, Thermometer, ArrowDown, ArrowUp, Clock, Navigation, Anchor } from 'lucide-react';
import { RegistryEntry, Tender, UserProfile, TrafficEntry, WeatherForecast } from '../types';

interface CanvasProps {
  logs: any[];
  registry: RegistryEntry[];
  tenders: Tender[];
  trafficQueue: TrafficEntry[];
  weatherData: WeatherForecast[];
  activeChannel: string;
  isMonitoring: boolean;
  userProfile: UserProfile;
  vesselsInPort: number;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  logs, 
  registry, 
  tenders, 
  trafficQueue,
  weatherData,
  activeChannel, 
  isMonitoring, 
  userProfile,
  vesselsInPort
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'feed' | 'cloud' | 'ais'>('fleet');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showWarningOnly, setShowWarningOnly] = useState(false);
  
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth > 300 && newWidth < 900) setWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);
  
  const getRowStyle = (log: any) => {
    const type = log.type || 'info';
    if (type === 'critical') return 'bg-red-900/40 border-l-2 border-red-500 text-red-200';
    if (type === 'alert') return 'bg-amber-900/30 border-l-2 border-amber-500 text-amber-200';
    if (type === 'warning') return 'bg-yellow-900/20 border-l-2 border-yellow-600 text-yellow-200';
    return 'border-l-2 border-transparent hover:bg-zinc-800/50';
  };
  
  const filteredLogs = logs.filter(log => {
    const message = typeof log.message === 'string' ? log.message.toLowerCase() : JSON.stringify(log.message).toLowerCase();
    const source = log.source.toLowerCase();
    const query = searchQuery.toLowerCase();
    const type = log.type || 'info';

    if (showUrgentOnly && type !== 'critical' && type !== 'alert') return false;
    if (showWarningOnly && type !== 'warning') return false;
    
    return message.includes(query) || source.includes(query);
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return <Sun size={24} className="text-yellow-400" />;
      case 'Cloudy': return <Cloud size={24} className="text-zinc-400" />;
      case 'Rain': return <CloudRain size={24} className="text-blue-400" />;
      case 'Storm': return <CloudRain size={24} className="text-indigo-400 animate-pulse" />;
      case 'Windy': return <Wind size={24} className="text-sky-400" />;
      default: return <Thermometer size={24} className="text-zinc-500" />;
    }
  };

  const getTenderStatusColor = (status: string) => {
    if (status === 'Busy') return { dot: 'bg-yellow-400', text: 'text-yellow-300' };
    if (status === 'Maintenance') return { dot: 'bg-red-500', text: 'text-red-400' };
    return { dot: 'bg-green-500', text: 'text-green-400' };
  };

  const TabButton = ({ tabName, icon: Icon, currentTab }: any) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`p-2 rounded-md transition-colors ${
        currentTab === tabName ? 'bg-indigo-600/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Icon size={14} />
    </button>
  );

  const renderMessage = (msg: any) => {
      if (typeof msg === 'object') {
          return JSON.stringify(msg);
      }
      return msg;
  };

  return (
    <div 
      className="hidden lg:flex flex-col h-full bg-zinc-950 border-l border-zinc-900 flex-shrink-0 relative"
      style={{ width: width }}
    >
      <div 
        className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />
      <div className="p-2 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 text-zinc-300">
           <span className="font-bold tracking-tight text-xs uppercase font-mono">Operations Deck</span>
        </div>
        <div className="flex items-center gap-1">
          <TabButton tabName="feed" icon={List} currentTab={activeTab} />
          <TabButton tabName="fleet" icon={Ship} currentTab={activeTab} />
          <TabButton tabName="cloud" icon={Cloud} currentTab={activeTab} />
          <TabButton tabName="ais" icon={Radar} currentTab={activeTab} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/30">
        {activeTab === 'feed' && (
           <>
            <div className="p-2 border-b border-zinc-900 flex items-center gap-2">
                <Search size={12} className="text-zinc-500 flex-shrink-0" />
                <input 
                    type="text"
                    placeholder="Filter logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent w-full text-xs focus:outline-none"
                />
                <button onClick={() => setShowWarningOnly(!showWarningOnly)} className={`p-1 rounded ${showWarningOnly ? 'bg-yellow-500/20 text-yellow-400' : 'text-zinc-500'}`} title="Warnings Only"><AlertTriangle size={12} /></button>
                <button onClick={() => setShowUrgentOnly(!showUrgentOnly)} className={`p-1 rounded ${showUrgentOnly ? 'bg-red-500/20 text-red-400' : 'text-zinc-500'}`} title="Urgent Only"><AlertCircle size={12} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar font-mono text-[10px]">
                {filteredLogs.map(log => (
                    <div key={log.id} className={`flex gap-3 p-1 rounded transition-colors ${getRowStyle(log)}`}>
                        <div className="opacity-50 w-14">{log.timestamp}</div>
                        <div className="font-semibold w-28 truncate">{log.source}</div>
                        <div className="flex-1 text-zinc-300 break-words leading-relaxed whitespace-pre-wrap">
                            {renderMessage(log.message)}
                        </div>
                    </div>
                ))}
            </div>
           </>
        )}
        {activeTab === 'fleet' && (
           <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4 text-xs">
              
              {/* KPI Panel */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase">Vessels in Port</div>
                      <div className="text-xl font-bold text-indigo-400">{vesselsInPort}</div>
                  </div>
                   <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase">Movements Today</div>
                      <div className="text-xl font-bold text-zinc-300">{registry.length}</div>
                  </div>
                   <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase">Occupancy</div>
                      <div className="text-xl font-bold text-green-400">92%</div>
                  </div>
              </div>

               <div>
                <h3 className="font-bold text-zinc-400 text-[10px] uppercase mb-2 tracking-wider">Tender Operations (CH 14)</h3>
                <div className="grid grid-cols-3 gap-2">
                    {tenders.map(t => {
                        const { dot, text } = getTenderStatusColor(t.status);
                        return (
                            <div key={t.id} className="bg-black/20 border border-zinc-800/50 rounded-lg p-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-zinc-300 text-[10px]">{t.name}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                                </div>
                                <div className="text-[10px]">
                                    <div className={`font-mono uppercase font-bold ${text}`}>{t.status}</div>
                                    <div className="text-zinc-500 truncate h-4">{t.assignment || '—'}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-zinc-400 text-[10px] uppercase mb-2 tracking-wider">Today's Port Movements (Last 24h)</h3>
                <div className="bg-black/20 border border-zinc-800/50 rounded-lg p-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {registry.map(r => (
                        <div key={r.id} className="flex items-center gap-3 text-[10px] py-1 border-b border-zinc-800/50 last:border-b-0">
                            <span className="w-14 text-zinc-500">{r.timestamp}</span>
                            <span className={`font-bold w-32 truncate ${r.action === 'CHECK-IN' ? 'text-green-400' : 'text-red-400'}`}>{r.vessel}</span>
                            <span className="w-16">{r.action}</span>
                            <span className="flex-1 text-zinc-400 truncate">{r.location}</span>
                        </div>
                    ))}
                </div>
              </div>
           </div>
        )}
        {activeTab === 'cloud' && (
           <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-zinc-400 text-[10px] uppercase mb-2 tracking-wider">Weather Station: 3-Day Outlook</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {weatherData.map((day, i) => (
                        <div key={i} className={`bg-black/20 border ${day.alertLevel === 'CRITICAL' ? 'border-red-500/50' : day.alertLevel === 'WARNING' ? 'border-amber-500/50' : 'border-zinc-800/50'} rounded-lg p-2`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-zinc-300 text-[10px]">{day.day}</div>
                                    <div className="text-2xl font-bold text-zinc-100">{day.temp}°C</div>
                                </div>
                                {getWeatherIcon(day.condition)}
                            </div>
                            <div className="mt-2 text-[10px] space-y-0.5">
                                <div className="flex items-center gap-1"><Wind size={10} className="text-sky-400"/> <span>{day.windSpeed} knots {day.windDir}</span></div>
                                {day.alertLevel !== 'NONE' && (
                                    <div className={`flex items-center gap-1 font-bold ${day.alertLevel === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                                        <AlertTriangle size={10} /> <span>{day.alertLevel}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-400 text-[10px] uppercase mb-2 tracking-wider">Traffic Tower (CH 73)</h3>
                  <div className="bg-black/20 border border-zinc-800/50 rounded-lg p-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {trafficQueue.map(t => (
                          <div key={t.id} className="flex items-center gap-3 text-[10px] py-1.5 border-b border-zinc-800/50 last:border-b-0">
                              {t.status === 'INBOUND' && <ArrowDown size={10} className="text-green-400 w-4"/>}
                              {t.status === 'OUTBOUND' && <ArrowUp size={10} className="text-blue-400 w-4"/>}
                              {t.status === 'HOLDING' && <Clock size={10} className="text-yellow-400 w-4"/>}
                              {t.status === 'TAXIING' && <Navigation size={10} className="text-sky-400 w-4 animate-pulse"/>}
                              <span className="w-32 font-bold truncate">{t.vessel}</span>
                              <span className="flex-1 font-mono uppercase text-zinc-400">{t.status}</span>
                              <span className="text-zinc-500 flex items-center gap-1">
                                {t.destination ? (
                                    <><span className="text-zinc-600">→</span> {t.destination}</>
                                ) : t.sector}
                              </span>
                          </div>
                      ))}
                  </div>
                </div>
           </div>
        )}
        {activeTab === 'ais' && (
           <div className="flex-1 flex items-center justify-center text-zinc-600 flex-col bg-cover bg-center" style={{backgroundImage: "url('https://i.imgur.com/3Z7wV0g.png')"}}>
             <Radar size={20} className="mb-1 animate-pulse" />
             <p className="text-[10px] font-mono tracking-widest">SCANNING AIS...</p>
           </div>
        )}
      </div>
    </div>
  );
};