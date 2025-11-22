
import React, { useState, useCallback, useEffect } from 'react';
import { List, Ship, Cloud, Radar, AlertTriangle, Wind, Sun, CloudRain, BrainCircuit, Printer, X, Wrench, BarChart, Map as MapIcon, DollarSign, Anchor, Radio, Crosshair, Lock, Battery, Gauge, Droplets, CheckCircle2, Bot, Signal, Zap, Thermometer, Fan, Lightbulb, Power, Wifi, Film, Siren, Flame, Stethoscope, LifeBuoy, Megaphone } from 'lucide-react';
import { RegistryEntry, Tender, UserProfile, TrafficEntry, WeatherForecast, VesselIntelligenceProfile, MaintenanceJob, VesselSystemsStatus } from '../types';
import { marinaExpert } from '../services/agents/marinaAgent';
import { technicExpert } from '../services/agents/technicAgent';
import { financeExpert } from '../services/agents/financeAgent';
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
  onGenerateReport: () => void;
  onNodeClick: (nodeId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'feed' | 'fleet' | 'tech' | 'ais' | 'map' | 'weather';
  onTabChange: (tab: 'feed' | 'fleet' | 'tech' | 'ais' | 'map' | 'weather') => void;
  isPanel: boolean; 
  isRedAlert: boolean; // New Prop
}

export const Canvas: React.FC<CanvasProps> = ({ 
  logs, 
  tenders,
  trafficQueue,
  weatherData,
  vesselsInPort,
  onOpenTrace,
  onGenerateReport,
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isPanel,
  userProfile,
  isRedAlert
}) => {
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [aisTargets, setAisTargets] = useState<any[]>([]);

  // --- CAPTAIN SPECIFIC STATE ---
  const [vesselProfile, setVesselProfile] = useState<VesselIntelligenceProfile | null>(null);
  const [financialStatus, setFinancialStatus] = useState<{ amount: number; status: string } | null>(null);
  const [vesselStatus, setVesselStatus] = useState<VesselSystemsStatus | null>(null);
  const captainVesselName = 'S/Y Phisedelia';

  const [isActivatingAdaSeaOne, setIsActivatingAdaSeaOne] = useState(false);
  
  // Remote Control State (Local UI State)
  const [tempSetPoint, setTempSetPoint] = useState(21);
  const [isLightSalon, setIsLightSalon] = useState(false);
  const [isLightDeck, setIsLightDeck] = useState(false);
  const [isLightUnderwater, setIsLightUnderwater] = useState(false);
  const [commandStatus, setCommandStatus] = useState<string | null>(null);

  // Emergency State
  const [casualtyCount, setCasualtyCount] = useState({ safe: 0, missing: 4, total: 4 });

  useEffect(() => {
    if (isOpen && userProfile.role === 'CAPTAIN') {
        marinaExpert.getVesselIntelligence(captainVesselName).then(setVesselProfile);
        financeExpert.checkDebt(captainVesselName).then(setFinancialStatus);
        marinaExpert.getVesselTelemetry(captainVesselName).then(data => {
            setVesselStatus(data);
            // Sync local state if available
            if (data?.comfort) {
                setTempSetPoint(data.comfort.climate.setPoint);
                setIsLightSalon(data.comfort.lighting.salon);
                setIsLightDeck(data.comfort.lighting.deck);
                setIsLightUnderwater(data.comfort.lighting.underwater);
            }
        });
    }
  }, [isOpen, userProfile.role, isActivatingAdaSeaOne]); // Refetch on activation

  // Polling for Radar Scan
  useEffect(() => {
      if (isOpen && activeTab === 'ais') {
          const scan = async () => {
              const targets = await marinaExpert.scanSector(
                  wimMasterData.identity.location.coordinates.lat,
                  wimMasterData.identity.location.coordinates.lng,
                  20,
                  () => {}
              );
              setAisTargets(targets);
          };
          scan();
          const interval = setInterval(scan, 5000); // 5 sec update
          return () => clearInterval(interval);
      }
  }, [isOpen, activeTab]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < 800) {
        setWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleActivateAdaSeaOne = async () => {
      setIsActivatingAdaSeaOne(true);
      // Simulate "Handshake" delay
      setTimeout(async () => {
          await marinaExpert.activateAdaSeaOne(captainVesselName);
          setIsActivatingAdaSeaOne(false);
      }, 3000);
  };

  const handleRemoteCommand = (action: string) => {
      setCommandStatus("Sending...");
      setTimeout(() => {
          setCommandStatus("Uplink Confirmed via Starlink");
          setTimeout(() => setCommandStatus(null), 2000);
      }, 800);
  };

  const getRowStyle = (log: any) => {
    const message = typeof log.message === 'string' ? log.message : '';
    if (message.includes('[OP]')) {
        return 'bg-indigo-500/10 border-l-2 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold my-1 shadow-sm';
    }
    const type = log.type || 'info';
    if (type === 'critical') return 'bg-red-500/10 text-red-400';
    if (type === 'alert' || type === 'atc_log') return 'bg-amber-500/10 text-amber-400';
    if (type === 'passkit_issued') return 'bg-indigo-500/10 text-indigo-300';
    return 'text-zinc-400';
  };

  // --- VIEW 3: EMERGENCY DASHBOARD (Red Alert) ---
  const EmergencyDashboard = () => {
      const currentWind = weatherData[0];
      const rescueTender = tenders.find(t => t.name.includes('Charlie'));

      return (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-red-950/20 relative h-full">
              {/* Red Alert Overlay Effect */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.05)_10px,rgba(220,38,38,0.05)_20px)] pointer-events-none"></div>
              
              <div className="p-4 space-y-6 relative z-10">
                  {/* Situation Header */}
                  <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-4 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 text-red-500">
                              <Siren size={32} className="animate-bounce"/>
                              <div>
                                  <h2 className="text-2xl font-black uppercase tracking-widest">CODE RED</h2>
                                  <div className="text-xs font-mono font-bold text-red-400">GUARDIAN PROTOCOL ACTIVE</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider animate-pulse">
                                  Live Incident
                              </div>
                          </div>
                      </div>
                      <div className="text-red-300 text-sm font-mono border-t border-red-800 pt-2 mt-2">
                          LOCATION: <strong>PONTOON A-05</strong> (Electrical Fire Reported)
                      </div>
                  </div>

                  {/* Critical Environmental Data */}
                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/40 border border-red-900/50 p-3 rounded-lg">
                          <div className="text-[10px] text-red-400 uppercase font-bold mb-1 flex items-center gap-2">
                              <Wind size={12}/> Wind Vector (Smoke)
                          </div>
                          <div className="text-xl font-mono font-bold text-white">
                              {currentWind?.windSpeed} kn <span className="text-red-500">{currentWind?.windDir}</span>
                          </div>
                          <div className="text-[9px] text-zinc-500 mt-1">Smoke drifting towards Pontoon B</div>
                      </div>
                      <div className="bg-black/40 border border-red-900/50 p-3 rounded-lg">
                          <div className="text-[10px] text-red-400 uppercase font-bold mb-1 flex items-center gap-2">
                              <LifeBuoy size={12}/> Rescue Asset
                          </div>
                          <div className="text-sm font-mono font-bold text-white">
                              {rescueTender?.name.toUpperCase()}
                          </div>
                          <div className="text-[9px] font-bold text-emerald-500 mt-1">SCRAMBLED - ETA 2m</div>
                      </div>
                  </div>

                  {/* Muster Station / Casualty Tracking */}
                  <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                              <Stethoscope size={14} className="text-red-500"/>
                              Muster List (Zone A)
                          </h3>
                          <div className="text-xs font-mono">
                              <span className="text-emerald-500">{casualtyCount.safe} OK</span> / <span className="text-red-500">{casualtyCount.missing} MISSING</span>
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          {[
                              { name: 'M/Y Blue Horizon', souls: 4, status: 'NO_CONTACT' },
                              { name: 'S/Y Mistral', souls: 2, status: 'SAFE' },
                              { name: 'M/Y Poseidon', souls: 6, status: 'SAFE' },
                          ].map((v, i) => (
                              <div key={i} className="flex items-center justify-between bg-black/40 p-2 rounded border border-zinc-800">
                                  <div>
                                      <div className="text-xs font-bold text-zinc-200">{v.name}</div>
                                      <div className="text-[10px] text-zinc-500">{v.souls} SOB (Souls On Board)</div>
                                  </div>
                                  {v.status === 'SAFE' ? (
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                                          <CheckCircle2 size={10}/> SAFE
                                      </div>
                                  ) : (
                                      <button 
                                        onClick={() => setCasualtyCount(prev => ({ ...prev, safe: prev.safe + v.souls, missing: Math.max(0, prev.missing - v.souls) }))}
                                        className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-colors animate-pulse"
                                      >
                                          MARK SAFE?
                                      </button>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Broadcast Scripts */}
                  <div className="space-y-2">
                      <button className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-3 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                          <Megaphone size={14}/>
                          Broadcast "PAN PAN" (Ch 16/72)
                      </button>
                      <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-3 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                          <Radio size={14}/>
                          Silence All Traffic
                      </button>
                  </div>

              </div>
          </div>
      );
  };

  // --- VIEW 1: GENERAL MANAGER DASHBOARD ---
  const GMDashboard = () => {
      const TABS = [
        { id: 'feed', label: 'Episode', icon: Film },
        { id: 'fleet', label: 'Fleet', icon: Ship },
        { id: 'tech', label: 'Tech', icon: Wrench },
        { id: 'ais', label: 'Radar', icon: Radar }, 
        { id: 'weather', label: 'Wx', icon: Cloud },
      ];

      return (
        <>
            {/* Tabs */}
            <div className="flex border-b border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark overflow-x-auto flex-shrink-0">
                {TABS.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as any)} 
                        className={`flex items-center justify-center gap-2 py-3 px-1 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all flex-1 ${
                            activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' 
                            : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                        }`}
                    >
                        <tab.icon size={12} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-brand-bg-light dark:bg-brand-bg-dark relative p-2">
                {activeTab === 'feed' && (
                    <>
                        {/* Episode Header */}
                        <div className="flex items-center justify-between mb-3 px-2 py-2 border-b border-zinc-200 dark:border-zinc-800/50">
                            <div className="flex flex-col">
                                <span className="font-mono text-[10px] uppercase text-zinc-400 tracking-[0.2em]">ADA.MARINA LOGBOOK</span>
                                <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">CURRENT EPISODE</span>
                            </div>
                            <div className="text-right">
                                <span className="block font-mono text-[10px] text-indigo-500 font-bold">STARDATE {new Date().toISOString().split('T')[0].replace(/-/g, '.')}</span>
                                <span className="block font-mono text-[9px] text-zinc-500">ID: {Math.floor(Date.now() / 1000000)}</span>
                            </div>
                        </div>

                        <div className="font-mono text-[11px] space-y-1">
                            {logs.slice(0, 100).map(log => (
                                <div key={log.id} className={`flex items-start gap-3 p-1.5 rounded-sm ${getRowStyle(log)}`}>
                                    <div className="w-16 opacity-70 shrink-0">{log.timestamp}</div>
                                    <div className={`w-24 font-bold shrink-0`}>{log.source}</div>
                                    <div className="flex-1 break-words leading-relaxed flex items-center gap-2">
                                        {(typeof log.message === 'string' && log.message.includes('[OP]')) && <Radio size={12} className="text-indigo-500"/>}
                                        {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                
                {activeTab === 'fleet' && (
                    <div className="p-3 space-y-6">
                        {/* Ground Assets (Tenders) */}
                        <div>
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Anchor size={14} />
                                WIM Fleet Assets (Nodes)
                            </h3>
                            <div className="space-y-3">
                                {tenders.map(t => (
                                    <div key={t.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${t.status === 'Busy' ? 'bg-amber-500 animate-pulse' : t.status === 'Maintenance' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                            <div>
                                                <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200 font-mono">{t.name}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{t.status}</div>
                                            </div>
                                        </div>
                                        {t.status === 'Busy' && t.assignment && (
                                            <div className="text-right bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                                                <div className="text-[9px] text-indigo-400 uppercase font-bold tracking-widest">Mission</div>
                                                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono">{t.assignment}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ais' && (
                    <div className="font-mono">
                        <div className="bg-black text-green-500 p-2 text-xs mb-2 rounded border border-green-900 flex justify-between">
                            <span>RADAR: ACTIVE (20nm)</span>
                            <span className="animate-pulse">SCANNING...</span>
                        </div>
                        <div className="space-y-1">
                            <div className="grid grid-cols-12 text-[10px] text-zinc-500 uppercase px-2 mb-1 font-bold">
                                <div className="col-span-4">Target</div>
                                <div className="col-span-2 text-right">RNG (nm)</div>
                                <div className="col-span-2 text-right">SPD</div>
                                <div className="col-span-2 text-center">SQ</div>
                                <div className="col-span-2 text-right">STS</div>
                            </div>
                            {aisTargets.map((t, i) => (
                                <div key={i} className="grid grid-cols-12 text-[11px] p-2 bg-zinc-900/50 border-b border-zinc-800 items-center hover:bg-zinc-800">
                                    <div className="col-span-4 font-bold text-zinc-200 truncate flex items-center gap-2">
                                        {t.type.includes('Container') || t.type.includes('Tanker') ? <AlertTriangle size={10} className="text-amber-500"/> : <Crosshair size={10} className="text-green-500"/>}
                                        {t.name}
                                    </div>
                                    <div className="col-span-2 text-right text-green-400 font-bold">{t.distance}</div>
                                    <div className="col-span-2 text-right text-zinc-400">{t.speed || '0kn'}</div>
                                    <div className="col-span-2 text-center text-amber-500 font-bold">{t.squawk}</div>
                                    <div className="col-span-2 text-right text-xs">{t.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'weather' && (
                    <div className="p-2 space-y-4">
                        {weatherData.map(day => (
                            <div key={day.day} className={`p-4 rounded-lg border ${day.alertLevel !== 'NONE' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-zinc-800 dark:text-zinc-100">{day.day}</span>
                                {day.alertLevel !== 'NONE' && <div className="text-amber-500 flex items-center gap-1 text-xs font-bold"><AlertTriangle size={12}/> {day.alertLevel}</div>}
                            </div>
                            <div className="flex items-end justify-between mt-2">
                                <div className="flex items-center gap-3">
                                {day.condition === 'Rain' ? <CloudRain size={24} className="text-blue-400"/> : <Sun size={24} className="text-yellow-400"/>}
                                <div className="text-3xl font-bold">{day.temp}°C</div>
                                </div>
                                <div className="text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                <div><Wind size={10} className="inline mr-1"/>{day.windSpeed} kn {day.windDir}</div>
                                </div>
                            </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
      )
  };

  // --- VIEW 2: CAPTAIN DASHBOARD (Private) ---
  const CaptainDashboard = () => {
      const filteredLogs = logs.filter(log => {
        const message = (typeof log.message === 'string' ? log.message : JSON.stringify(log.message)).toLowerCase();
        const isVesselSpecific = message.includes(captainVesselName.toLowerCase());
        const isGeneralSafety = ['atc_log', 'ENVIRONMENTAL_ALERT', 'alert'].includes(log.type) || log.source.includes('weather');
        return isVesselSpecific || isGeneralSafety;
      }).slice(0, 10);

      const hasAdaSeaOne = vesselProfile?.adaSeaOneStatus === 'ACTIVE';

      return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-brand-bg-light dark:bg-brand-bg-dark relative">
            
            {/* Ada Sea ONE Activation Overlay */}
            {isActivatingAdaSeaOne && (
                <div className="absolute inset-0 z-50 bg-zinc-950/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <Bot size={64} className="text-emerald-500 animate-bounce mb-6" />
                    <h2 className="text-2xl font-black text-white tracking-wider mb-2">INITIALIZING NEURAL LINK</h2>
                    <p className="text-emerald-400 font-mono text-sm mb-8">Handshake with ada.sea.one in progress...</p>
                    <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>
                </div>
            )}

            {/* Vessel Profile Card */}
            {vesselProfile && (
                <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">{vesselProfile.name}</h3>
                        <div className="flex gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                vesselProfile.status === 'DOCKED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>{vesselProfile.status}</span>
                            {hasAdaSeaOne && <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1"><Bot size={10}/> ADA.SEA.ONE</span>}
                        </div>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>IMO: {vesselProfile.imo}</span>
                        <span>Flag: {vesselProfile.flag}</span>
                        <span className="col-span-2">Location: {vesselProfile.location}</span>
                    </div>
                </div>
            )}

            {/* NEW: Remote Control & Comfort (Ada Sea ONE Exclusive) */}
            <div className="relative">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2"><Wifi size={14}/> Remote Control</div>
                    {commandStatus && <span className="text-emerald-500 animate-pulse">{commandStatus}</span>}
                </h3>

                <div className={`grid grid-cols-1 gap-3 ${!hasAdaSeaOne ? 'opacity-50 pointer-events-none filter blur-[2px]' : ''}`}>
                    {/* Climate Control Card */}
                    <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-500">
                                <Thermometer size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">HVAC (Salon)</div>
                                <div className="text-2xl font-bold font-mono">{tempSetPoint}°C</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setTempSetPoint(p => p-1); handleRemoteCommand('TEMP_DOWN'); }} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center">-</button>
                            <button onClick={() => { setTempSetPoint(p => p+1); handleRemoteCommand('TEMP_UP'); }} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center">+</button>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Salon Lights */}
                        <button 
                            onClick={() => { setIsLightSalon(!isLightSalon); handleRemoteCommand('LIGHTS_SALON'); }}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${isLightSalon ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark text-zinc-500'}`}
                        >
                            <Lightbulb size={20} className={isLightSalon ? 'fill-current' : ''}/>
                            <span className="text-[10px] font-bold uppercase">Salon</span>
                        </button>

                        {/* Deck Lights */}
                        <button 
                            onClick={() => { setIsLightDeck(!isLightDeck); handleRemoteCommand('LIGHTS_DECK'); }}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${isLightDeck ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark text-zinc-500'}`}
                        >
                            <Sun size={20} className={isLightDeck ? 'fill-current' : ''}/>
                            <span className="text-[10px] font-bold uppercase">Deck</span>
                        </button>

                        {/* Underwater Lights */}
                        <button 
                            onClick={() => { setIsLightUnderwater(!isLightUnderwater); handleRemoteCommand('LIGHTS_UNDER'); }}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${isLightUnderwater ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'bg-panel-light dark:bg-panel-dark border-border-light dark:border-border-dark text-zinc-500'}`}
                        >
                            <Droplets size={20} className={isLightUnderwater ? 'fill-current' : ''}/>
                            <span className="text-[10px] font-bold uppercase">U/Water</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ENGINEERING / TELEMETRY SECTION */}
            <div className="relative">
                {/* Header */}
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Gauge size={14}/>
                    Engineering Systems
                </h3>

                {/* Marketing Blur Overlay (If No Ada Sea ONE) */}
                {!hasAdaSeaOne && (
                    <div className="absolute inset-0 top-8 z-10 bg-zinc-100/10 dark:bg-zinc-900/60 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-6">
                        <div className="bg-black/80 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl max-w-xs transform hover:scale-105 transition-transform duration-300">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-indigo-500/20 rounded-full">
                                    <Bot size={32} className="text-indigo-400" />
                                </div>
                            </div>
                            <h4 className="text-xl font-black text-white tracking-tighter mb-2">ADA SEA ONE</h4>
                            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                                Upgrade your vessel with a Digital Twin. Real-time telemetry, AI Co-Pilot, and automated logs.
                            </p>
                            <button 
                                onClick={handleActivateAdaSeaOne}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                            >
                                <Signal size={14} />
                                Connect Vessel
                            </button>
                            <div className="mt-4 text-[10px] text-zinc-600 font-mono">
                                Starting at €499/mo • Cancel anytime
                            </div>
                        </div>
                    </div>
                )}

                {/* Telemetry Gauges (Blurred if inactive) */}
                <div className={`grid grid-cols-2 gap-3 ${!hasAdaSeaOne ? 'opacity-50 pointer-events-none filter blur-[2px]' : ''}`}>
                    {/* Battery */}
                    <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500">
                            <Battery size={14} className={vesselStatus?.battery.status === 'DISCHARGING' ? 'text-amber-500' : 'text-emerald-500'}/>
                            <span className="text-[10px] font-bold uppercase">Battery Banks</span>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-400">Service</span>
                                    <span className="font-mono font-bold">{vesselStatus?.battery.serviceBank}V</span>
                                </div>
                                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[85%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-400">Engine</span>
                                    <span className="font-mono font-bold">{vesselStatus?.battery.engineBank}V</span>
                                </div>
                                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[92%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shore Power */}
                    <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2 text-zinc-500">
                            <Zap size={14} className={vesselStatus?.shorePower.connected ? 'text-yellow-500' : 'text-zinc-600'}/>
                            <span className="text-[10px] font-bold uppercase">Shore Power</span>
                        </div>
                        <div className="flex flex-col items-center justify-center h-20">
                            <div className="text-2xl font-bold font-mono text-zinc-800 dark:text-zinc-200">
                                {vesselStatus?.shorePower.voltage}V
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">
                                {vesselStatus?.shorePower.amperage} Amps
                            </div>
                            <div className={`text-[10px] font-bold mt-2 px-2 py-0.5 rounded ${vesselStatus?.shorePower.connected ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                                {vesselStatus?.shorePower.connected ? 'CONNECTED' : 'OFFLINE'}
                            </div>
                        </div>
                    </div>

                    {/* Tanks */}
                    <div className="col-span-2 bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-3 text-zinc-500">
                            <Droplets size={14}/>
                            <span className="text-[10px] font-bold uppercase">Tank Levels</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="relative w-12 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    <div className="absolute bottom-0 w-full bg-blue-500 transition-all duration-1000" style={{height: `${vesselStatus?.tanks.freshWater}%`}}></div>
                                </div>
                                <div className="text-[10px] mt-1 text-zinc-500">Fresh</div>
                                <div className="text-xs font-bold">{vesselStatus?.tanks.freshWater}%</div>
                            </div>
                            <div className="text-center">
                                <div className="relative w-12 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    <div className="absolute bottom-0 w-full bg-amber-600 transition-all duration-1000" style={{height: `${vesselStatus?.tanks.fuel}%`}}></div>
                                </div>
                                <div className="text-[10px] mt-1 text-zinc-500">Diesel</div>
                                <div className="text-xs font-bold">{vesselStatus?.tanks.fuel}%</div>
                            </div>
                            <div className="text-center">
                                <div className="relative w-12 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    <div className="absolute bottom-0 w-full bg-zinc-700 transition-all duration-1000" style={{height: `${vesselStatus?.tanks.blackWater}%`}}></div>
                                </div>
                                <div className="text-[10px] mt-1 text-zinc-500">Black</div>
                                <div className={`text-xs font-bold ${vesselStatus?.tanks.blackWater && vesselStatus.tanks.blackWater > 80 ? 'text-red-500 animate-pulse' : ''}`}>{vesselStatus?.tanks.blackWater}%</div>
                            </div>
                        </div>
                        {vesselStatus?.tanks.blackWater && vesselStatus.tanks.blackWater > 80 && (
                            <button className="w-full mt-3 bg-red-500/10 text-red-500 border border-red-500/50 py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors">
                                Request Pump-out
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Weather & Finance */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{weatherData[0]?.temp}°</div>
                            <div className="text-xs text-zinc-500">{weatherData[0]?.condition}</div>
                        </div>
                        {weatherData[0] && (weatherData[0].condition === 'Rain' ? <CloudRain size={24} className="text-blue-400"/> : <Sun size={24} className="text-yellow-400"/>)}
                    </div>
                    <div className="text-xs mt-2 text-zinc-500 flex items-center gap-2 font-mono">
                         <Wind size={12} /> {weatherData[0]?.windSpeed} kn
                    </div>
                </div>
                <div className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1 text-zinc-500">
                        <DollarSign size={14}/>
                        <span className="text-xs font-bold uppercase">Account</span>
                    </div>
                    {financialStatus?.status === 'DEBT' ? (
                        <>
                            <div className="text-xl font-bold text-red-500">€{financialStatus.amount}</div>
                            <div className="text-xs text-red-500/80 font-mono">OVERDUE</div>
                        </>
                    ) : (
                         <>
                            <div className="text-xl font-bold text-emerald-500">CLEAR</div>
                            <div className="text-xs text-zinc-500 font-mono">Good Standing</div>
                        </>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <List size={14}/>
                    Recent Vessel Logs
                </h3>
                <div className="space-y-2">
                    {filteredLogs.length > 0 ? filteredLogs.map(log => (
                        <div key={log.id} className="text-xs font-mono p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                           <div className="flex justify-between items-center text-zinc-400 text-[10px] mb-1">
                               <span>{log.source}</span>
                               <span>{log.timestamp}</span>
                           </div>
                           <p className="text-zinc-700 dark:text-zinc-300">
                               {typeof log.message === 'string' ? log.message : 'System event logged.'}
                           </p>
                        </div>
                    )) : (
                        <div className="text-center text-xs text-zinc-500 font-mono py-4">No specific logs for your vessel today.</div>
                    )}
                </div>
            </div>
        </div>
      )
  }

  // --- MAIN RENDER ---
  const baseClasses = `flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark select-none transition-all duration-300`;

  const CanvasContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
          <BarChart size={16} className="text-indigo-500" />
          <span className="font-bold text-xs tracking-widest uppercase">
              {isRedAlert ? "GUARDIAN PROTOCOL" : userProfile.role === 'CAPTAIN' ? "Captain's Desk" : "Operations Desk"}
          </span>
        </div>
        <div className="flex items-center gap-1">
            {userProfile.role === 'GENERAL_MANAGER' && (
                <>
                    <button onClick={onGenerateReport} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50" title="Daily Report">
                        <Printer size={14} />
                    </button>
                    <button onClick={onOpenTrace} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50" title="Agent Trace">
                        <BrainCircuit size={14} />
                    </button>
                </>
            )}
            {!isPanel && (
                <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-md transition-colors">
                    <X size={14} />
                </button>
            )}
        </div>
      </div>

      {/* Internal Route Switcher with Red Alert Override */}
      {isRedAlert ? <EmergencyDashboard /> : (userProfile.role === 'CAPTAIN' ? <CaptainDashboard /> : <GMDashboard />)}
    </>
  );

  if (isPanel) {
    return (
        <aside 
            className={`${baseClasses} relative ${isOpen ? '' : 'w-0 !p-0 !border-0 hidden'}`}
            style={{ width: isOpen ? width : 0 }}
        >
            <div 
            className={`absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/20 transition-colors z-50 ${isResizing ? 'bg-indigo-500/50' : ''}`}
            onMouseDown={startResizing}
            />
            <CanvasContent/>
      </aside>
    );
  }

  // --- DRAWER MODE ---
  return (
     <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className={`
          ${baseClasses}
          fixed top-0 right-0 h-full shadow-2xl w-full max-w-md
          transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <CanvasContent/>
      </div>
    </>
  )
};
