
import React, { useState, useCallback, useEffect } from 'react';
import { List, Ship, Cloud, Radar, Search, AlertTriangle, AlertCircle, Wind, Sun, CloudRain, Thermometer, ArrowDown, ArrowUp, Clock, Navigation, BrainCircuit, LogIn, ExternalLink, Map as MapIcon, Anchor, Wrench, Zap, Droplets } from 'lucide-react';
import { RegistryEntry, Tender, UserProfile, TrafficEntry, WeatherForecast, VesselIntelligenceProfile, MaintenanceJob } from '../types';
import { marinaAgent } from '../services/agents/marinaAgent';
import { technicAgent } from '../services/agents/technicAgent'; // Updated import
import { wimMasterData } from '../services/wimMasterData';


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
  onNodeClick: (nodeId: string) => void; // NEW PROP
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
  onOpenTrace,
  onNodeClick // Destructure
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'feed' | 'cloud' | 'ais' | 'map' | 'tech'>('fleet');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showWarningOnly, setShowWarningOnly] = useState(false);
  
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  
  // NEW: State for live AIS data
  const [aisTargets, setAisTargets] = useState<TrafficEntry[]>([]);
  const [isAisLoading, setIsAisLoading] = useState(false);

  // NEW: State for all fleet vessels and search query for fleet tab
  const [fleetSearchQuery, setFleetSearchQuery] = useState('');
  const [allFleetVessels, setAllFleetVessels] = useState<VesselIntelligenceProfile[]>([]);
  // NEW: State for expanded vessel profile in fleet tab
  const [expandedVesselImo, setExpandedVesselImo] = useState<string | null>(null);
  
  // NEW: State for Maintenance Jobs
  const [activeJobs, setActiveJobs] = useState<MaintenanceJob[]>([]);


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

  // NEW: Effect for fetching all fleet vessels on component mount or tab change
  useEffect(() => {
      const fetchFleet = () => {
          setAllFleetVessels(marinaAgent.getAllFleetVessels());
      };
      if (activeTab === 'fleet' || activeTab === 'map') {
        fetchFleet();
      }
      if (activeTab === 'tech') {
          setActiveJobs(technicAgent.getActiveJobs()); // Updated to technicAgent
      }
  }, [activeTab]); // Fetch when switching to fleet or map tab

  // NEW: Effect for fetching live AIS data when tab is active
  useEffect(() => {
    let intervalId: number | undefined;

    const fetchAisData = async () => {
        setIsAisLoading(true);
        const data = await marinaAgent.fetchLiveAisData();
        setAisTargets(data);
        setIsAisLoading(false);
    };

    if (activeTab === 'ais') {
        fetchAisData(); // Fetch immediately on tab switch
        intervalId = window.setInterval(fetchAisData, 15000); // Then refresh every 15 seconds
    }

    return () => {
        if (intervalId) {
            clearInterval(intervalId); // Cleanup on component unmount or tab change
        }
    };
  }, [activeTab]);
  
  // Flat style: No borders, use text color and weight
  const getRowStyle = (log: any) => {
    const type = log.type || 'info';
    if (type === 'critical') return 'text-red-600 dark:text-red-400 font-bold';
    if (type === 'alert' || type === 'atc_log') return 'text-amber-600 dark:text-amber-400 font-medium';
    if (type === 'warning') return 'text-yellow-600 dark:text-yellow-400';
    if (type === 'intelligence_briefing') return 'text-sky-600 dark:text-sky-400';
    if (type === 'customer_engagement' || type === 'customer_proposal') return 'text-purple-600 dark:text-purple-400';
    if (type === 'ENVIRONMENTAL_ALERT') return 'text-teal-600 dark:text-teal-400 font-bold'; // NEW STYLE
    return 'text-zinc-600 dark:text-zinc-400';
  };

  const getSourceColor = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('security')) return 'text-red-500 dark:text-red-400';
    if (s.includes('marina')) return 'text-indigo-600 dark:text-indigo-400';
    if (s.includes('finance')) return 'text-emerald-600 dark:text-emerald-400';
    if (s.includes('vhf')) return 'text-orange-500 dark:text-orange-400';
    if (s.includes('weather')) return 'text-sky-600 dark:text-sky-400';
    if (s.includes('atc')) return 'text-amber-500 dark:text-amber-400';
    if (s.includes('intelligence')) return 'text-sky-500 dark:text-sky-400';
    if (s.includes('maintenance') || s.includes('technic')) return 'text-blue-500 dark:text-blue-400';
    if (s.includes('sensor') || s.includes('sea')) return 'text-teal-500 dark:text-teal-400';
    if (s.includes('customer')) return 'text-purple-500 dark:text-purple-400';
    return 'text-zinc-500';
  };
  
  const filteredLogs = logs.filter(log => {
    const message = typeof log.message === 'string' ? log.message.toLowerCase() : JSON.stringify(log.message).toLowerCase();
    const source = log.source.toLowerCase();
    const query = searchQuery.toLowerCase();
    const type = log.type || 'info';

    if (showUrgentOnly && type !== 'critical' && type !== 'alert' && type !== 'atc_log' && type !== 'ENVIRONMENTAL_ALERT') return false;
    if (showWarningOnly && type !== 'warning') return false;
    
    return message.includes(query) || source.includes(query);
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return <Sun size={24} className="text-yellow-500 dark:text-yellow-400" />;
      case 'Cloudy': return <Cloud size={24} className="text-zinc-400" />;
      case 'Rain': return <CloudRain size={24} className="text-blue-500 dark:text-blue-400" />;
      case 'Storm': return <CloudRain size={24} className="text-indigo-500 dark:text-indigo-400 animate-pulse" />;
      case 'Windy': return <Wind size={24} className="text-sky-500 dark:text-sky-400" />;
      default: return <Thermometer size={24} className="text-zinc-500" />;
    }
  };

  const getTenderStatusColor = (status: string) => {
    if (status === 'Busy') return { text: 'text-yellow-600 dark:text-yellow-400' };
    if (status === 'Maintenance') return { text: 'text-red-600 dark:text-red-500' };
    return { text: 'text-emerald-600 dark:text-green-400' };
  };

  const getJobStatusColor = (status: string) => {
      if (status === 'COMPLETED') return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10';
      if (status === 'IN_PROGRESS') return 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-50 dark:bg-blue-500/10';
      if (status === 'WAITING_PARTS') return 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-50 dark:bg-amber-500/10';
      return 'text-zinc-600 dark:text-zinc-400 border-zinc-500/20 bg-zinc-50 dark:bg-zinc-500/10';
  };

  const TabButton = ({ tabName, icon: Icon, currentTab }: any) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`p-2 rounded-md transition-all duration-300 ${
        currentTab === tabName ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300'
      }`}
    >
      <Icon size={14} />
    </button>
  );

  // --- Masking Utilities for UI ---
  const maskFullName = (name?: string) => {
      if(!name || name.length < 3) return 'N/A';
      const parts = name.trim().split(' ');
      return parts.map(p => p.length > 2 ? `${p[0]}${'*'.repeat(p.length-2)}${p[p.length-1]}` : p).join(' ');
  };
  const maskId = (id?: string) => id ? `${id.substring(0,2)}******${id.substring(id.length-2)}` : 'N/A';
  const maskContact = (contact?: string) => contact ? `${contact.substring(0,3)}****${contact.substring(contact.length-2)}` : 'N/A';


  const renderMessage = (msg: any, type?: string) => {
      if (type === 'intelligence_briefing' && typeof msg === 'object' && msg !== null && msg.imo) {
        const profile = msg as VesselIntelligenceProfile;
        return (
            <div className="mt-1 text-[10px] leading-relaxed bg-sky-50 dark:bg-sky-900/10 p-2 rounded border border-sky-200 dark:border-sky-900/20">
                <div className="font-bold text-sky-700 dark:text-sky-400">
                    AUTO-PROFILE: {profile.name}
                </div>
                <div className="text-zinc-600 dark:text-zinc-400/80 mt-1">
                    <span>IMO: `{profile.imo}` | </span>
                    <span>Flag: {profile.flag} | </span>
                    <span>Type: {profile.type} ({profile.loa}m)</span>
                </div>
                <div className="text-zinc-500 dark:text-zinc-500 mt-1">
                    Voyage: {profile.voyage?.lastPort} → **{profile.voyage?.nextPort}** (ETA: {profile.voyage?.eta})
                </div>
            </div>
        );
      }
      if ((type === 'customer_engagement' || type === 'customer_proposal') && typeof msg === 'string') {
          return (
              <div className="mt-1 text-[10px] leading-relaxed bg-purple-50 dark:bg-purple-900/10 p-2 rounded border border-purple-200 dark:border-purple-900/20 flex gap-2 items-start">
                  <div className="p-1 bg-purple-100 dark:bg-purple-500/20 rounded-full">
                      <BrainCircuit size={10} className="text-purple-600 dark:text-purple-400"/>
                  </div>
                  <div className="italic text-purple-800 dark:text-purple-300">{msg}</div>
              </div>
          )
      }
      if (typeof msg === 'object') {
          return JSON.stringify(msg);
      }
      return msg;
  };

  const filteredFleetVessels = allFleetVessels.filter(vessel => {
      if (!fleetSearchQuery) return true;
      const query = fleetSearchQuery.toLowerCase();
      return (
          vessel.name.toLowerCase().includes(query) ||
          (vessel.imo && vessel.imo.toLowerCase().includes(query)) ||
          (vessel.flag && vessel.flag.toLowerCase().includes(query))
      );
  });

  // Marina Coordinates for Map
  const marinaLat = wimMasterData.identity.location.coordinates.lat;
  const marinaLng = wimMasterData.identity.location.coordinates.lng;

  const centerX = 50; // 50% from left
  const centerY = 50; // 50% from top

  const toggleVesselPanel = (imo: string) => {
      setExpandedVesselImo(prev => prev === imo ? null : imo);
  };

  return (
    <div 
      className="hidden lg:flex flex-col h-full bg-white dark:bg-[#09090b] border-l border-zinc-200 dark:border-zinc-900 flex-shrink-0 relative transition-colors duration-300"
      style={{ width: width }}
    >
      <div 
        className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
        onMouseDown={startResizing}
      />
      
      {/* Header */}
      <div className="h-12 px-3 mt-1 flex items-center justify-between select-none border-b border-transparent">
        <div className="flex items-center gap-2 text-zinc-400">
           <span className="font-bold tracking-tight text-xs uppercase font-mono text-zinc-500 dark:text-zinc-500">Operations Deck</span>
        </div>
        <div className="flex items-center gap-1">
          <a href="https://www.marinetraffic.com/en/ais/home/centerx:28.665/centery:40.955/zoom:15" target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-indigo-600 dark:text-zinc-600 dark:hover:text-indigo-400 transition-all" aria-label="Open Live Marine Traffic">
              <ExternalLink size={14} />
          </a>
          <button 
            onClick={onOpenTrace}
            className="p-2 text-zinc-400 hover:text-indigo-600 dark:text-zinc-600 dark:hover:text-indigo-400 transition-all" 
            aria-label="View Agent Traces" 
          >
            <BrainCircuit size={14} />
          </button>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <TabButton tabName="feed" icon={List} currentTab={activeTab} />
          <TabButton tabName="fleet" icon={Ship} currentTab={activeTab} />
          <TabButton tabName="tech" icon={Wrench} currentTab={activeTab} />
          <TabButton tabName="cloud" icon={Cloud} currentTab={activeTab} />
          <TabButton tabName="ais" icon={Radar} currentTab={activeTab} />
          <TabButton tabName="map" icon={MapIcon} currentTab={activeTab} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-transparent">
        {activeTab === 'feed' && (
           <>
            <div className="px-3 py-2 flex items-center gap-2">
                <button onClick={() => setShowWarningOnly(!showWarningOnly)} className={`p-1 rounded transition-colors ${showWarningOnly ? 'text-yellow-500' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'}`} title="Warnings Only"><AlertTriangle size={12} /></button>
                <button onClick={() => setShowUrgentOnly(!showUrgentOnly)} className={`p-1 rounded transition-colors ${showUrgentOnly ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400'}`} title="Urgent Only"><AlertCircle size={12} /></button>
                <Search size={12} className="text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
                <input 
                    type="text"
                    placeholder="Filter logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent w-full text-[10px] focus:outline-none text-zinc-700 dark:text-zinc-300 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                />
            </div>
            <div className="flex-1 overflow-y-auto px-3 space-y-2 custom-scrollbar font-mono text-[10px]">
                {filteredLogs.map(log => (
                    <div key={log.id} className="flex gap-3 py-0.5 group border-b border-zinc-100 dark:border-zinc-900/50 last:border-0">
                        <div className="opacity-60 w-12 text-zinc-400 dark:text-zinc-500 flex-shrink-0">{log.timestamp}</div>
                        <div 
                            onClick={() => onNodeClick(log.source)} // CLICK HANDLER
                            className={`font-bold w-24 truncate flex-shrink-0 transition-colors cursor-pointer hover:underline ${getSourceColor(log.source)}`}
                        >
                            {log.source}
                        </div>
                        <div className={`flex-1 break-words leading-relaxed whitespace-pre-wrap ${getRowStyle(log)}`}>
                            {renderMessage(log.message, log.type)}
                        </div>
                    </div>
                ))}
            </div>
           </>
        )}
        {activeTab === 'tech' && (
            <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-4 text-xs font-mono">
                <div>
                    <h3 className="font-bold text-zinc-500 dark:text-zinc-600 text-[9px] uppercase mb-3 tracking-widest flex items-center gap-2">
                        <Wrench size={10} /> Active Maintenance Jobs
                    </h3>
                    {activeJobs.length > 0 ? (
                        <div className="space-y-2">
                            {activeJobs.map(job => (
                                <div key={job.id} className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-transparent rounded-lg p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-zinc-800 dark:text-zinc-200">{job.vesselName}</div>
                                            <div className="text-[9px] text-zinc-500 dark:text-zinc-500">Job ID: {job.id}</div>
                                        </div>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getJobStatusColor(job.status)}`}>
                                            {job.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                                        <div>
                                            <div className="text-zinc-400 dark:text-zinc-600">Service Type</div>
                                            <div className="font-medium">{job.jobType.replace('_', ' ')}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-400 dark:text-zinc-600">Schedule</div>
                                            <div className="font-medium">{job.scheduledDate}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] border-t border-zinc-200 dark:border-zinc-800 pt-2 mt-2">
                                        <span className="text-zinc-400 dark:text-zinc-600">Contractor: </span>
                                        <span className="font-medium">{job.contractor}</span>
                                        {job.partsStatus && job.partsStatus !== 'N/A' && (
                                            <div className="mt-1">
                                                <span className="text-zinc-400 dark:text-zinc-600">Parts Status: </span>
                                                <span className={`font-bold ${job.partsStatus === 'ARRIVED' ? 'text-emerald-500' : 'text-amber-500'}`}>{job.partsStatus}</span>
                                            </div>
                                        )}
                                        <div className="mt-1 text-zinc-500 italic">"{job.notes}"</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-zinc-400 dark:text-zinc-700 text-center py-4 text-[10px]">
                            No active technical service tickets.
                        </div>
                    )}
                </div>
            </div>
        )}
        {activeTab === 'fleet' && (
           <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-6 text-xs font-mono">
              
              {/* KPI Panel - Flat */}
              <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider mb-1">Vessels</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{vesselsInPort}</div>
                  </div>
                   <div className="text-center">
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider mb-1">Movements</div>
                      <div className="2xl font-bold text-zinc-700 dark:text-zinc-300">{registry.length}</div>
                  </div>
                   <div className="text-center">
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider mb-1">Occupancy</div>
                      <div className="2xl font-bold text-emerald-600 dark:text-emerald-400">92%</div>
                  </div>
              </div>

               <div>
                <h3 className="font-bold text-zinc-500 dark:text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Tender Operations</h3>
                <div className="grid grid-cols-1 gap-1">
                    {tenders.map(t => {
                        const { text } = getTenderStatusColor(t.status);
                        return (
                            <div key={t.id} className="flex items-center justify-between py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 px-2 rounded transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                                <div className="flex flex-col">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-300 text-[10px]">{t.name}</span>
                                    <span className="text-[9px] text-zinc-500 dark:text-zinc-600">{t.assignment || 'Station'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {t.serviceCount !== undefined && t.serviceCount > 0 && (
                                        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">Served: {t.serviceCount}</span>
                                    )}
                                    <div className={`text-[9px] font-bold uppercase ${text}`}>{t.status}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-zinc-500 dark:text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Port Activity (Registry)</h3>
                <div className="space-y-2">
                    {registry.map(r => (
                        <div key={r.id} className="flex items-center justify-between text-[10px] py-1 border-b border-zinc-100 dark:border-zinc-900/50 last:border-0">
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-400 dark:text-zinc-600 w-10">{r.timestamp}</span>
                                <span className={`font-bold ${r.action === 'CHECK-IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{r.vessel}</span>
                            </div>
                            <span className="text-zinc-500">{r.location}</span>
                        </div>
                    ))}
                </div>
              </div>

              {/* NEW: Fleet Roster / Searchable Vessel List */}
              <div>
                <h3 className="font-bold text-zinc-500 dark:text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Fleet Roster</h3>
                <div className="relative mb-3 flex items-center">
                    <Search size={12} className="absolute left-2 text-zinc-400 dark:text-zinc-600" />
                    <input 
                        type="text"
                        placeholder="Search vessel by name, IMO, or flag..."
                        value={fleetSearchQuery}
                        onChange={(e) => setFleetSearchQuery(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-900/30 w-full text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md py-1.5 pl-8 pr-2 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 border border-zinc-200 dark:border-zinc-800"
                    />
                </div>
                <div className="space-y-1">
                    {filteredFleetVessels.length > 0 ? (
                        filteredFleetVessels.map(v => (
                            <div key={v.imo} className="flex flex-col rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all overflow-hidden">
                                <div 
                                    className="flex items-center justify-between text-[10px] py-2 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 cursor-pointer"
                                    onClick={() => toggleVesselPanel(v.imo)}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold text-zinc-800 dark:text-zinc-300 text-[10px]">{v.name}</span>
                                        <span className="text-[9px] text-zinc-500 dark:text-zinc-600">IMO: {v.imo} | Flag: {v.flag}</span>
                                        {/* Payment History Status Indicator */}
                                        {v.paymentHistoryStatus && v.paymentHistoryStatus !== 'REGULAR' && (
                                            <span className={`text-[9px] font-bold mt-0.5 ${v.paymentHistoryStatus === 'CHRONICALLY_LATE' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {v.paymentHistoryStatus.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {v.outstandingDebt && v.outstandingDebt > 0 && (
                                            <div className="text-red-500 dark:text-red-400 flex items-center gap-1 text-[9px] font-bold">
                                                <AlertCircle size={10} /> €{v.outstandingDebt}
                                            </div>
                                        )}
                                        <span className="text-[9px] text-zinc-500 dark:text-zinc-600">{v.status}</span>
                                    </div>
                                </div>
                                
                                {/* Expandable Detail Panel */}
                                {expandedVesselImo === v.imo && (
                                    <div className="bg-zinc-50 dark:bg-[#121214] p-3 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                                            <div className="space-y-1">
                                                <div className="text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Specs</div>
                                                <div>{v.type}</div>
                                                <div>LOA: {v.loa}m | Beam: {v.beam}m</div>
                                                <div>DWT: {v.dwt}t</div>
                                                <div className="mt-2 text-indigo-500 hover:text-indigo-400 cursor-pointer flex items-center gap-1">
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${v.coordinates?.lat},${v.coordinates?.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                        <MapIcon size={10} /> Live Location
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Owner (Masked)</div>
                                                <div>{maskFullName(v.ownerName)}</div>
                                                <div>ID: {maskId(v.ownerId)}</div>
                                                <div>{maskContact(v.ownerEmail)}</div>
                                                <div>{maskContact(v.ownerPhone)}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/50">
                                            <div className="flex justify-between items-center">
                                                <div className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Loyalty Tier</div>
                                                <div className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                                    v.loyaltyTier === 'GOLD' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' :
                                                    v.loyaltyTier === 'SILVER' ? 'text-slate-400 border-slate-500/30 bg-slate-500/10' :
                                                    v.loyaltyTier === 'PROBLEM' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                                                    'text-sky-500 border-sky-500/30 bg-sky-500/10'
                                                }`}>
                                                    {v.loyaltyTier} ({v.loyaltyScore})
                                                </div>
                                            </div>
                                        </div>

                                        {/* SMART UTILITY METER */}
                                        {v.utilities && (
                                            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Smart Meter</div>
                                                    <div className={`text-[9px] ${v.utilities.status === 'ACTIVE' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                                        {v.utilities.status}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-yellow-500/5 border border-yellow-500/20 p-2 rounded flex items-center justify-between">
                                                        <Zap size={12} className="text-yellow-500" />
                                                        <span className="font-mono font-bold text-yellow-600 dark:text-yellow-400">{v.utilities.electricityKwh} kWh</span>
                                                    </div>
                                                    <div className="bg-blue-500/5 border border-blue-500/20 p-2 rounded flex items-center justify-between">
                                                        <Droplets size={12} className="text-blue-500" />
                                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{v.utilities.waterM3} m³</span>
                                                    </div>
                                                </div>
                                                <div className="text-[8px] text-zinc-400 text-right mt-1">Last Read: {v.utilities.lastReading}</div>
                                            </div>
                                        )}

                                        <div className="mt-3 text-[9px] text-zinc-400 italic">
                                            Full contract history available in ada.legal node (Restricted Access).
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-zinc-400 dark:text-zinc-700 text-center py-4 text-[10px]">
                            No vessels found matching your search.
                        </div>
                    )}
                </div>
              </div>
           </div>
        )}
        {activeTab === 'cloud' && (
           <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-6 text-xs font-mono">
                <div>
                  <h3 className="font-bold text-zinc-500 dark:text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Forecast</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {weatherData.map((day, i) => (
                        <div key={i} className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-transparent rounded-lg p-3 flex flex-col items-center text-center">
                            <div className="font-bold text-zinc-500 text-[9px] mb-2">{day.day}</div>
                            {getWeatherIcon(day.condition)}
                            <div className="text-xl font-bold text-zinc-700 dark:text-zinc-200 mt-2">{day.temp}°</div>
                            <div className="mt-2 text-[9px] text-sky-500 dark:text-sky-400 flex items-center gap-1">
                                <Wind size={10} /> {day.windSpeed}kn
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-500 dark:text-zinc-600 text-[9px] uppercase mb-3 tracking-widest">Traffic Control (Queue)</h3>
                  <div className="space-y-1">
                      {trafficQueue.map(t => (
                          <div className="flex items-center justify-between py-2 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 rounded group bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900/50">
                              <div className="flex items-center gap-3">
                                {t.status === 'INBOUND' && <ArrowDown size={10} className="text-emerald-500 dark:text-emerald-400"/>}
                                {t.status === 'OUTBOUND' && <ArrowUp size={10} className="text-blue-500 dark:text-blue-400"/>}
                                {t.status === 'HOLDING' && <Clock size={10} className="text-yellow-500 dark:text-yellow-400"/>}
                                {t.status === 'TAXIING' && <Navigation size={10} className="text-sky-500 dark:text-sky-400"/>}
                                
                                <div className="flex flex-col">
                                   <span className="font-bold text-zinc-700 dark:text-zinc-300 text-[10px]">{t.vessel}</span>
                                   <span className="text-[9px] text-zinc-500 dark:text-zinc-600">{t.sector}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">AI PROCESSING</span>
                                </div>
                                <button 
                                    onClick={() => onCheckIn(t.id)}
                                    className="opacity-20 hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1 rounded"
                                    title="Manual Override"
                                >
                                    <LogIn size={10} />
                                </button>
                              </div>
                          </div>
                      ))}
                      {trafficQueue.length === 0 && (
                          <div className="text-zinc-400 dark:text-zinc-700 text-center py-4 text-[10px]">Sector Zulu Clear.</div>
                      )}
                  </div>
                </div>
           </div>
        )}
        {activeTab === 'ais' && (
           <div className="flex-1 flex flex-col bg-indigo-50/30 dark:bg-[#050505] relative overflow-hidden font-mono transition-colors duration-500">
             <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="flex items-center gap-2 text-emerald-600/50 dark:text-emerald-500/50 mb-1">
                    <Radar size={14} className={isAisLoading ? 'animate-spin' : ''} />
                    <span className="text-[10px] font-bold tracking-[0.2em]">AIS LIVE | {aisTargets.length} TARGETS</span>
                </div>
             </div>

             <div className="flex-1 relative flex items-center justify-center">
                {/* Flat Radar - Auto Theme */}
                <div className="relative w-[280px] h-[280px] rounded-full bg-emerald-200/20 dark:bg-emerald-900/5 flex items-center justify-center">
                    <div className="absolute w-[200px] h-[200px] rounded-full bg-emerald-200/20 dark:bg-emerald-900/5" />
                    <div className="absolute w-[120px] h-[120px] rounded-full bg-emerald-200/20 dark:bg-emerald-900/5" />
                    <div className="absolute w-[40px] h-[40px] rounded-full bg-emerald-500/20 dark:bg-emerald-500/10" />
                    
                    <div className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-500 rounded-full z-10 animate-ping" />
                    <div className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-500 rounded-full z-10 absolute" />

                    {aisTargets.map((t) => {
                        // Deterministic positioning based on vessel name hash and live coordinates
                        const hash = t.vessel.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
                        const angle = (t.course || hash % 360) * (Math.PI / 180);
                        const distance = 50 + (hash % 80); 
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;

                        return (
                            <div 
                                key={t.id}
                                className="absolute z-20 group cursor-pointer"
                                title={`${t.vessel}\nStatus: ${t.status}\nSpeed: ${t.speedKnots}kn\nCourse: ${t.course}°`}
                            >
                                {/* The Dot */}
                                <div className="w-2 h-2 bg-emerald-600 dark:bg-white rounded-full shadow-[0_0_5px_rgba(16,185,129,0.8)] hover:scale-150 transition-transform" />
                                
                                {/* The Label (ALWAYS VISIBLE for clarity) */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/60 text-emerald-700 dark:text-emerald-400 text-[9px] px-2 py-1 rounded border border-emerald-100 dark:border-zinc-800 whitespace-nowrap z-50 backdrop-blur-sm flex flex-col items-center shadow-sm">
                                    <div className="font-bold">{t.vessel}</div>
                                    <div className="text-zinc-500 dark:text-zinc-300 text-[8px] flex gap-1">
                                        <span>{t.nextPort}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>

             <div className="h-32 bg-transparent px-4 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-indigo-50/50 dark:bg-[#050505] z-10 backdrop-blur-sm">
                        <tr>
                            <th className="py-1 text-[9px] text-zinc-500 dark:text-zinc-600 font-normal">VESSEL</th>
                            <th className="py-1 text-[9px] text-zinc-500 dark:text-zinc-600 font-normal">STATUS</th>
                            <th className="py-1 text-[9px] text-zinc-500 dark:text-zinc-600 font-normal text-right">SPD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {aisTargets.length > 0 ? aisTargets.map((t) => (
                            <tr key={t.id} className="text-[9px] hover:bg-emerald-100/50 dark:hover:bg-zinc-900/30 group transition-colors">
                                <td className="py-1 text-emerald-700 dark:text-emerald-400 font-bold group-hover:text-emerald-900 dark:group-hover:text-white transition-colors">{t.vessel}</td>
                                 <td className="py-1 text-zinc-500 dark:text-zinc-400 font-mono">{t.status}</td>
                                <td className="py-1 text-zinc-400 dark:text-zinc-500 text-right">{t.speedKnots} kn</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-4 text-zinc-500 text-[9px]">
                                    {isAisLoading ? 'Acquiring targets...' : 'No AIS targets in range.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
           </div>
        )}
        {activeTab === 'map' && ( // NEW: Map Tab Content
            <div className="flex-1 relative flex items-center justify-center bg-zinc-50 dark:bg-[#050505] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
                </div>
                <div className="relative w-[300px] h-[300px] bg-sky-200/20 dark:bg-sky-900/10 rounded-full flex items-center justify-center shadow-lg border border-sky-300/50 dark:border-sky-900/50">
                    {/* Marina Center Marker */}
                    <div className="absolute z-20" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} title="West Istanbul Marina">
                        <Anchor size={20} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    </div>

                    {/* Dedicated Locations (Authority & Fuel) */}
                    {wimMasterData.identity.location.dedicated_locations && Object.values(wimMasterData.identity.location.dedicated_locations).map((loc, idx) => {
                        if (!loc.coordinates) return null;
                        const latDiff = (loc.coordinates.lat - marinaLat) * 10000;
                        const lngDiff = (loc.coordinates.lng - marinaLng) * 10000;
                        const scaleFactor = 1500;
                        const relativeX = centerX + (lngDiff * scaleFactor);
                        const relativeY = centerY - (latDiff * scaleFactor);

                        if (relativeX < 0 || relativeX > 100 || relativeY < 0 || relativeY > 100) return null;

                        return (
                            <div
                                key={`dedicated-${idx}`}
                                className="absolute z-10 group cursor-pointer flex flex-col items-center"
                                style={{
                                    top: `${relativeY}%`,
                                    left: `${relativeX}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                                title={loc.label}
                            >
                                {loc.label.includes("Fuel") ? (
                                    <div className="bg-yellow-500 p-1 rounded-full shadow-sm"><Zap size={8} className="text-white" /></div>
                                ) : (
                                    <div className="bg-red-500 p-1 rounded-full shadow-sm"><Anchor size={8} className="text-white" /></div>
                                )}
                                <span className="text-[7px] bg-white/80 dark:bg-black/80 px-1 rounded mt-0.5 whitespace-nowrap hidden group-hover:block">{loc.label}</span>
                            </div>
                        )
                    })}

                    {/* Pontoons Visuals */}
                    {wimMasterData.identity.location.pontoons && wimMasterData.identity.location.pontoons.map((pontoon, idx) => {
                        const scaleFactor = 1500;
                        // Simplified rendering logic for pontoons based on relative position
                        // This is a visual approximation for the prototype
                        const pX = centerX + (pontoon.relative_position.lng_offset * 100 * scaleFactor / 5); 
                        const pY = centerY - (pontoon.relative_position.lat_offset * 100 * scaleFactor / 5);
                        const width = pontoon.relative_position.width_scale * 30; // Arbitrary scale for visual
                        const height = pontoon.relative_position.length_scale * 30;

                        return (
                            <div
                                key={`pontoon-${idx}`}
                                className="absolute border border-zinc-400/50 bg-zinc-200/30 dark:bg-zinc-800/30 flex items-center justify-center text-[8px] text-zinc-500 select-none"
                                style={{
                                    top: `${pY}%`,
                                    left: `${pX}%`,
                                    width: `${width}px`,
                                    height: `${height}px`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {pontoon.label}
                            </div>
                        )
                    })}


                    {/* Vessel Markers */}
                    {allFleetVessels.map(vessel => {
                        if (!vessel.coordinates || !vessel.coordinates.lat || !vessel.coordinates.lng) return null;

                        // Simple relative positioning based on marina center
                        // Adjusting scale to fit in the 300px circle
                        const latDiff = (vessel.coordinates.lat - marinaLat) * 10000; // Scale factor
                        const lngDiff = (vessel.coordinates.lng - marinaLng) * 10000; // Scale factor

                        // Convert to percentage relative to the 300px container
                        // Assuming max diff of ~0.005 lat/lng covers the marina area (roughly 500m)
                        const scaleFactor = 1500; // Adjust this value to spread out the vessels more or less
                        const relativeX = centerX + (lngDiff * scaleFactor);
                        const relativeY = centerY - (latDiff * scaleFactor); // Y-axis is inverted for north

                        // Ensure markers stay within the map boundaries (0-100%)
                        if (relativeX < 0 || relativeX > 100 || relativeY < 0 || relativeY > 100) return null;

                        return (
                            <div 
                                key={vessel.imo}
                                className="absolute z-10 group cursor-pointer"
                                style={{ 
                                    top: `${relativeY}%`, 
                                    left: `${relativeX}%`, 
                                    transform: 'translate(-50%, -50%)' 
                                }}
                                title={`${vessel.name} (IMO: ${vessel.imo})\nStatus: ${vessel.status}\nLocation: ${vessel.location}`}
                            >
                                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)] group-hover:scale-150 transition-transform" />
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
