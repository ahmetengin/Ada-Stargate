
import React, { useState, useCallback, useEffect } from 'react';
import { List, Ship, Cloud, Radar, Search, AlertTriangle, AlertCircle, Wind, Sun, CloudRain, Thermometer, ArrowDown, ArrowUp, Clock, Navigation, Anchor, LogIn, Check, X, BrainCircuit } from 'lucide-react';
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
  onOpenTrace: () => void;
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
  onCheckIn,
  onOpenTrace
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
  
  // Flat style: No borders, use text color and weight
  const getRowStyle = (log: any) => {
    const type = log.type || 'info';
    if (type === 'critical') return 'text-red-400 font-bold';
    if (type === 'alert') return 'text-amber-400 font-medium';
    if (type === 'warning') return 'text-yellow-400';
    return 'text-zinc-400';
  };

  const getSourceColor = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('security')) return 'text-red-400';
    if (s.includes('marina')) return 'text-indigo-400';
    if (s.includes('finance')) return 'text-emerald-400';
    if (s.includes('vhf')) return 'text-orange-400';
    if (s.includes('weather')) return 'text-sky-400';
    return 'text-zinc-500';
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
    if (status === 'Busy') return { text: 'text-yellow-400' };
    if (status === 'Maintenance') return { text: 'text-red-500' };
    return { text: 'text-green-400' };
  };

  const TabButton = ({ tabName, icon: Icon, currentTab }: any) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`p-2 rounded-md transition-all duration-300 ${
        currentTab === tabName ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-600 hover:text-zinc-300'
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
      className="hidden lg:flex flex-col h-full bg-[#09090b] flex-shrink-0 relative"
      style={{ width: width }}
    >
      <div 
        className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />
      
      {/* Header: h-12 to align with Left Panel */}
      <div className="h-12 px-3 mt-1 flex items-center justify-between select-none border-b border-transparent">
        <div className="flex items-center gap-2 text-zinc-400">
           <span className="font-bold tracking-tight text-xs uppercase font-mono text-zinc-500">Operations Deck</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenTrace}
            className="p-2 text-zinc-600 hover:text-indigo-400 transition-all mr-2" 
            title="View Agent Traces"
          >
            <BrainCircuit size={14} />
          </button>
          <div className="h-4 w-px bg-zinc-800 mx-1"></div>
          <TabButton tabName="feed" icon={List} currentTab={activeTab} />
          <TabButton tabName="fleet" icon={Ship} currentTab={activeTab} />
          <TabButton tabName="cloud" icon={Cloud} currentTab={activeTab} />
          <TabButton tabName="ais" icon={Radar} currentTab={activeTab} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-transparent">
        {activeTab === 'feed' && (
           <>
            <div className="px-3 py-2 flex items-center gap-2">
                <Search size={12} className="text-zinc-600 flex-shrink-0" />
                <input 
                    type="text"
                    placeholder="Filter logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent w-full text-[10px] focus:outline-none text-zinc-300 font-mono"
                />
                <button onClick={() => setShowWarningOnly(!showWarningOnly)} className={`p-1 rounded transition-colors ${showWarningOnly ? 'text-yellow-400' : 'text-zinc-600 hover:text-zinc-400'}`} title="Warnings Only"><AlertTriangle size={12} /></button>
                <button onClick={() => setShowUrgentOnly(!showUrgentOnly)} className={`p-1 rounded transition-colors ${showUrgentOnly ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-400'}`} title="Urgent Only"><AlertCircle size={12} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 space-y-2 custom-scrollbar font-mono text-[10px]">
                {filteredLogs.map(log => (
                    <div key={log.id} className="flex gap-3 py-0.5 group">
                        <div className="opacity-40 w-12 text-zinc-500 flex-shrink-0">{log.timestamp}</div>
                        <div className={`font-bold w-24 truncate flex-shrink-0 transition-colors ${getSourceColor(log.source)}`}>{log.source}</div>
                        <div className={`flex-1 break-words leading-relaxed whitespace-pre-wrap ${getRowStyle(log)}`}>
                            {renderMessage(log.message)}
                        </div>
                    </div>
                ))}
            </div>
           </>
        )}
        {activeTab === 'fleet' && (
           <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-6 text-xs font-mono">
              
              {/* KPI Panel - Flat */}
              <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Vessels</div>
                      <div className="text-2xl font-bold text-indigo-400">{vesselsInPort}</div>
                  </div>
                   <div className="text-center">
                      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Movements</div>
                      <div className="text-2xl font-bold text-zinc-300">{registry.length}</div>
                  </div>
                   <div className="text-center">
                      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Occupancy</div>
                      <div className="text-2xl font-bold text-emerald-400">92%</div>
                  </div>
              </div>

               <div>
                <h3 className="font-bold text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Tender Operations</h3>
                <div className="grid grid-cols-1 gap-1">
                    {tenders.map(t => {
                        const { text } = getTenderStatusColor(t.status);
                        return (
                            <div key={t.id} className="flex items-center justify-between py-2 hover:bg-zinc-900/30 px-2 rounded transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold text-zinc-300 text-[10px]">{t.name}</span>
                                    <span className="text-[9px] text-zinc-600">{t.assignment || 'Station'}</span>
                                </div>
                                <div className={`text-[9px] font-bold uppercase ${text}`}>{t.status}</div>
                            </div>
                        )
                    })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Port Activity (Registry)</h3>
                <div className="space-y-2">
                    {registry.map(r => (
                        <div key={r.id} className="flex items-center justify-between text-[10px] py-1">
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-600 w-10">{r.timestamp}</span>
                                <span className={`font-bold ${r.action === 'CHECK-IN' ? 'text-emerald-400' : 'text-red-400'}`}>{r.vessel}</span>
                            </div>
                            <span className="text-zinc-500">{r.location}</span>
                        </div>
                    ))}
                </div>
              </div>
           </div>
        )}
        {activeTab === 'cloud' && (
           <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-6 text-xs font-mono">
                <div>
                  <h3 className="font-bold text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Forecast</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {weatherData.map((day, i) => (
                        <div key={i} className="bg-zinc-900/20 rounded-lg p-3 flex flex-col items-center text-center">
                            <div className="font-bold text-zinc-500 text-[9px] mb-2">{day.day}</div>
                            {getWeatherIcon(day.condition)}
                            <div className="text-xl font-bold text-zinc-200 mt-2">{day.temp}°</div>
                            <div className="mt-2 text-[9px] text-sky-400 flex items-center gap-1">
                                <Wind size={10} /> {day.windSpeed}kn
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Traffic Control (Queue)</h3>
                  <div className="space-y-1">
                      {trafficQueue.map(t => (
                          <div key={t.id} className="flex items-center justify-between py-2 px-2 hover:bg-zinc-900/30 rounded group">
                              <div className="flex items-center gap-3">
                                {t.status === 'INBOUND' && <ArrowDown size={10} className="text-emerald-400"/>}
                                {t.status === 'OUTBOUND' && <ArrowUp size={10} className="text-blue-400"/>}
                                {t.status === 'HOLDING' && <Clock size={10} className="text-yellow-400"/>}
                                {t.status === 'TAXIING' && <Navigation size={10} className="text-sky-400"/>}
                                
                                <div className="flex flex-col">
                                   <span className="font-bold text-zinc-300 text-[10px]">{t.vessel}</span>
                                   <span className="text-[9px] text-zinc-600">{t.sector}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-bold text-zinc-500">{t.status}</span>
                                <div className="flex items-center gap-1">
                                   <span className="text-[8px] text-zinc-700 hidden group-hover:block">AI AUTO</span>
                                   <button 
                                      onClick={() => onCheckIn(t.id)}
                                      className="opacity-50 hover:opacity-100 transition-opacity text-indigo-400 hover:text-white p-1 bg-indigo-500/10 rounded"
                                      title="Manual Override: Authorize Check-In"
                                   >
                                      <LogIn size={12} />
                                   </button>
                                </div>
                              </div>
                          </div>
                      ))}
                      {trafficQueue.length === 0 && (
                          <div className="text-zinc-700 text-center py-4 text-[10px]">Sector Zulu Clear.</div>
                      )}
                  </div>
                </div>
           </div>
        )}
        {activeTab === 'ais' && (
           <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden font-mono">
             <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="flex items-center gap-2 text-emerald-500/50 mb-1">
                    <Radar size={14} />
                    <span className="text-[10px] font-bold tracking-[0.2em]">AIS LIVE | 3 TARGETS</span>
                </div>
             </div>

             <div className="flex-1 relative flex items-center justify-center">
                {/* Flat Radar - No Borders, just faint fills */}
                <div className="relative w-[280px] h-[280px] rounded-full bg-emerald-900/5 flex items-center justify-center">
                    <div className="absolute w-[200px] h-[200px] rounded-full bg-emerald-900/5" />
                    <div className="absolute w-[120px] h-[120px] rounded-full bg-emerald-900/5" />
                    <div className="absolute w-[40px] h-[40px] rounded-full bg-emerald-500/10" />
                    
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full z-10 animate-ping" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full z-10 absolute" />

                    {trafficQueue.map((t, idx) => {
                        // Deterministic positioning based on vessel name hash
                        const hash = t.vessel.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
                        const angle = (hash % 360) * (Math.PI / 180);
                        const distance = 50 + (hash % 80); 
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;

                        return (
                            <div 
                                key={t.id}
                                className="absolute z-20 group cursor-pointer"
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                            >
                                {/* The Dot */}
                                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                                
                                {/* The Label (Tooltip) */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-emerald-400 text-[9px] px-2 py-1 rounded border border-zinc-800 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm">
                                    <div className="font-bold">{t.vessel}</div>
                                    <div className="text-zinc-400 text-[8px]">{t.status} • {t.sector}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             <div className="h-32 bg-transparent px-4 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#050505] z-10">
                        <tr>
                            <th className="py-1 text-[9px] text-zinc-600 font-normal">ID</th>
                            <th className="py-1 text-[9px] text-zinc-600 font-normal">VESSEL</th>
                            <th className="py-1 text-[9px] text-zinc-600 font-normal text-right">DST</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trafficQueue.map((t, idx) => (
                            <tr key={t.id} className="text-[9px] hover:bg-zinc-900/30 group">
                                <td className="py-1 text-zinc-600 font-mono">TRK-{idx + 10}</td>
                                <td className="py-1 text-emerald-400 font-bold group-hover:text-white transition-colors">{t.vessel}</td>
                                <td className="py-1 text-zinc-500 text-right">{((t.vessel.length * 0.8) % 10).toFixed(1)} nm</td>
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
