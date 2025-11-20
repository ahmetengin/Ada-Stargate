
import React, { useState, useCallback, useEffect } from 'react';
import { List, Ship, Cloud, Radar, Search, AlertTriangle, AlertCircle, Wind, Sun, CloudRain, Thermometer, ArrowDown, ArrowUp, Clock, Navigation, Anchor, LogIn } from 'lucide-react';
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
  onCheckIn: (id: string) => void;
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
  vesselsInPort,
  onCheckIn
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
                          <div key={t.id} className="flex items-center gap-3 text-[10px] py-1.5 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors group px-1">
                              {t.status === 'INBOUND' && <ArrowDown size={10} className="text-green-400 w-4"/>}
                              {t.status === 'OUTBOUND' && <ArrowUp size={10} className="text-blue-400 w-4"/>}
                              {t.status === 'HOLDING' && <Clock size={10} className="text-yellow-400 w-4"/>}
                              {t.status === 'TAXIING' && <Navigation size={10} className="text-sky-400 w-4 animate-pulse"/>}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                   <span className="font-bold truncate text-zinc-200">{t.vessel}</span>
                                   <span className="font-mono uppercase text-zinc-500 text-[9px]">{t.status}</span>
                                </div>
                                <div className="text-zinc-500 flex items-center gap-1 text-[9px] truncate">
                                  {t.destination ? (
                                      <><span className="text-zinc-600">→</span> {t.destination}</>
                                  ) : t.sector}
                                </div>
                              </div>

                              {/* Check-In Action Button */}
                              <button 
                                onClick={() => onCheckIn(t.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded"
                                title="Check-In Vessel"
                              >
                                <LogIn size={12} />
                              </button>
                          </div>
                      ))}
                      {trafficQueue.length === 0 && (
                          <div className="text-zinc-600 text-center py-4 italic">No active traffic in sector.</div>
                      )}
                  </div>
                </div>
           </div>
        )}
        {activeTab === 'ais' && (
           <div className="flex-1 flex flex-col bg-black relative overflow-hidden font-mono">
             
             {/* Radar Header */}
             <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                    <Radar size={14} className="animate-pulse" />
                    <span className="text-[10px] font-bold tracking-[0.2em]">AIS TACTICAL DISPLAY</span>
                </div>
                <div className="text-[9px] text-zinc-600 space-y-0.5">
                    <div>SECTOR: ZULU-ALPHA</div>
                    <div>RANGE: 12 NM</div>
                    <div>TARGETS: {trafficQueue.length}</div>
                </div>
             </div>

             {/* Main Radar View */}
             <div className="flex-1 relative flex items-center justify-center bg-[#050505]">
                
                {/* Grid Lines */}
                <div className="absolute inset-0" 
                     style={{
                        backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                     }} 
                />

                {/* Radar Circles */}
                <div className="relative w-[320px] h-[320px] rounded-full border border-emerald-900/40 flex items-center justify-center">
                    <div className="absolute w-[240px] h-[240px] rounded-full border border-emerald-900/30" />
                    <div className="absolute w-[160px] h-[160px] rounded-full border border-emerald-900/20" />
                    <div className="absolute w-[80px] h-[80px] rounded-full border border-emerald-900/10" />
                    
                    {/* Crosshair */}
                    <div className="absolute w-full h-px bg-emerald-900/30" />
                    <div className="absolute h-full w-px bg-emerald-900/30" />

                    {/* Sweep */}
                    <div className="absolute w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.1)_360deg)] animate-[spin_4s_linear_infinite]" />

                    {/* Center Node */}
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10" />

                    {/* Simulated Targets based on TrafficQueue */}
                    {trafficQueue.map((t, idx) => {
                        // Pseudo-random position based on vessel name hash
                        const hash = t.vessel.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
                        const angle = (hash % 360) * (Math.PI / 180);
                        const distance = 60 + (hash % 80); // Keep roughly in middle rings
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;

                        return (
                            <div 
                                key={t.id}
                                className="absolute w-2 h-2 bg-white rounded-full group cursor-pointer hover:scale-150 transition-transform z-20"
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                <div className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-ping" />
                                
                                {/* Tooltip */}
                                <div className="hidden group-hover:block absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 border border-emerald-500/50 p-2 rounded min-w-[120px] z-50 shadow-xl">
                                    <div className="text-[10px] font-bold text-emerald-400 mb-1">{t.vessel}</div>
                                    <div className="text-[8px] text-zinc-400 grid grid-cols-2 gap-x-2 gap-y-1">
                                        <span>STS:</span><span className="text-white">{t.status}</span>
                                        <span>SPD:</span><span className="text-white">{(hash % 15) + 5}kn</span>
                                        <span>BRG:</span><span className="text-white">{hash % 360}°</span>
                                        <span>DST:</span><span className="text-white">{(distance / 40).toFixed(1)}nm</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             {/* Target Data Table */}
             <div className="h-40 bg-zinc-900/80 border-t border-zinc-800 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-950/50 sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th className="p-2 text-[9px] font-normal text-zinc-500 border-b border-zinc-800">ID</th>
                            <th className="p-2 text-[9px] font-normal text-zinc-500 border-b border-zinc-800">VESSEL</th>
                            <th className="p-2 text-[9px] font-normal text-zinc-500 border-b border-zinc-800">STATUS</th>
                            <th className="p-2 text-[9px] font-normal text-zinc-500 border-b border-zinc-800 text-right">DISTANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trafficQueue.map((t, idx) => (
                            <tr key={t.id} className="hover:bg-emerald-900/10 transition-colors border-b border-zinc-800/50 text-[10px]">
                                <td className="p-2 text-zinc-600 font-mono">TRK-{idx + 10}</td>
                                <td className="p-2 text-zinc-200 font-bold">{t.vessel}</td>
                                <td className="p-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                                        t.status === 'INBOUND' ? 'bg-emerald-500/10 text-emerald-400' :
                                        t.status === 'OUTBOUND' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="p-2 text-zinc-400 font-mono text-right">{((t.vessel.length * 0.8) % 10).toFixed(1)} nm</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
