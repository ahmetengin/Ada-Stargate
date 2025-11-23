
import React, { useState, useEffect } from 'react';
import { 
  Activity, Anchor, AlertTriangle, Ship, Thermometer, Wind, Map as MapIcon, 
  List, X, FileText, BrainCircuit, Droplets, Zap, Gauge, Battery, 
  Clock, Calendar, CloudRain, Sun, Utensils, ShoppingBag, Wifi, Info, 
  Car, PartyPopper, CheckCircle2, Siren, Radio, Lock, Flame, Music, Leaf, Recycle, DollarSign, Flag, Microscope, LifeBuoy, ShieldCheck
} from 'lucide-react';
import { RegistryEntry, Tender, TrafficEntry, UserProfile, WeatherForecast } from '../types';
import { wimMasterData } from '../services/wimMasterData';
import { marinaExpert } from '../services/agents/marinaExpert'; // Corrected import
import { technicExpert } from '../services/agents/technicAgent';
import { congressExpert } from '../services/agents/congressAgent'; 
import { facilityExpert } from '../services/agents/facilityAgent'; 

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
  isRedAlert: boolean;
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
  onGenerateReport, 
  onNodeClick, 
  isOpen, 
  onClose,
  activeTab,
  onTabChange,
  isPanel,
  isRedAlert
}) => {

  // --- 1. GUEST UI (Lifestyle & Tourism) ---
  const GuestDashboard = () => {
      const [activeVehicle, setActiveVehicle] = useState("34 XX 99 (Porsche)");
      const upcomingEvents = wimMasterData.event_calendar || [];

      return (
        <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-200 p-4">
            {/* Welcome & Status */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Welcome Back</div>
                    <div className="text-xl font-bold">{userProfile.name}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Membership</div>
                    <div className="text-sm font-bold text-indigo-500">PLATINUM</div>
                </div>
            </div>

            {/* ISPARK Validation Widget */}
            <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Car size={12} /> MY GARAGE (ISPARK INTEGRATION)
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                        ACTIVE
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer ring-1 ring-indigo-500">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="font-mono font-bold">34 XX 99</span>
                            <span className="text-xs text-zinc-500">Porsche 911</span>
                        </div>
                        <CheckCircle2 size={14} className="text-indigo-500"/>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                            <span className="font-mono font-bold">34 AA 01</span>
                            <span className="text-xs text-zinc-500">Range Rover</span>
                        </div>
                    </div>
                </div>

                <button className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Zap size={12} /> Validate Exit (Free)
                </button>
            </div>

            {/* Active Dining Reservation */}
            <div className="bg-zinc-900 text-white p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Utensils size={64} />
                </div>
                <div className="relative z-10">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Utensils size={12} /> DINING RESERVATION
                    </div>
                    <div className="text-lg font-bold text-white mb-1">Poem Restaurant</div>
                    <div className="flex justify-between text-xs text-zinc-300 mb-3">
                        <span>Today, 19:30</span>
                        <span>4 Guests</span>
                    </div>
                    <div className="bg-white/10 p-2 rounded border border-white/10 text-[10px] space-y-1">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Pre-Order:</span>
                            <span className="text-emerald-400">Sea Bass x2</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Kitchen Status:</span>
                            <span className="text-yellow-400 animate-pulse">PREPARING</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Calendar */}
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Calendar size={12} /> Upcoming Events
                </h3>
                <div className="space-y-2">
                    {upcomingEvents.map((evt: any) => (
                        <div key={evt.id} className="flex gap-3 p-3 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                            <div className="flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-700 rounded p-2 min-w-[50px]">
                                <span className="text-xs font-bold text-zinc-500 uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{new Date(evt.date).getDate()}</span>
                            </div>
                            <div>
                                <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{evt.name}</div>
                                <div className="text-[10px] text-zinc-500 uppercase mt-1 flex items-center gap-1">
                                    {evt.type === 'Race' ? <Wind size={10}/> : <PartyPopper size={10}/>}
                                    {evt.type} • {evt.location || 'Marina'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  }

  // --- 2. CAPTAIN UI (Navigation & Safety) ---
  const CaptainDashboard = () => {
      const [telemetry, setTelemetry] = useState<any>(null);
      const [activeCaptainTab, setActiveCaptainTab] = useState<'overview' | 'engineering' | 'finance' | 'bluecard'>('overview');

      useEffect(() => {
          marinaExpert.getVesselTelemetry("S/Y Phisedelia").then(setTelemetry);
      }, []);

      return (
        <div className="space-y-4 font-mono text-zinc-800 dark:text-zinc-300 p-4">
            
            {/* Captain Tabs */}
            <div className="flex gap-1 border-b border-zinc-800 pb-2 overflow-x-auto">
                {['overview', 'engineering', 'finance', 'bluecard'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveCaptainTab(tab as any)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${activeCaptainTab === tab ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeCaptainTab === 'overview' && (
                <>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vessel Status</div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-emerald-500">SECURE</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] text-zinc-500">Location</div>
                                <div className="text-sm font-bold text-white">Pontoon C-12</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-500">Shore Power</div>
                                <div className="text-sm font-bold text-emerald-400">CONNECTED</div>
                            </div>
                        </div>
                    </div>

                    {/* Ada Sea ONE Control */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <Wifi size={12} /> ADA SEA ONE
                                </div>
                                <div className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                    CONNECTED
                                </div>
                            </div>
                            
                            {/* Remote Controls */}
                            <div className="grid grid-cols-2 gap-2">
                                <button className="bg-black/40 hover:bg-indigo-600/20 border border-zinc-700 hover:border-indigo-500/50 p-2 rounded flex flex-col items-center gap-1 transition-all">
                                    <Thermometer size={16} className="text-zinc-400" />
                                    <span className="text-[9px] uppercase text-zinc-500">AC: 24°C</span>
                                </button>
                                <button className="bg-black/40 hover:bg-indigo-600/20 border border-zinc-700 hover:border-indigo-500/50 p-2 rounded flex flex-col items-center gap-1 transition-all">
                                    <Zap size={16} className="text-yellow-500/70" />
                                    <span className="text-[9px] uppercase text-zinc-500">Lights</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeCaptainTab === 'engineering' && (
                <div className="space-y-4">
                    {/* Battery Gauge */}
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase">Service Bank</span>
                            <span className="text-xs font-bold text-white">25.4 V</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[85%]"></div>
                        </div>
                    </div>
                    
                    {/* Tank Levels */}
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                        <div className="text-[10px] text-zinc-500 uppercase mb-3">Fluid Levels</div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-zinc-400">Fuel</span>
                                    <span className="text-white">45%</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full w-[45%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-zinc-400">Fresh Water</span>
                                    <span className="text-white">80%</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full w-[80%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-zinc-400">Black Water</span>
                                    <span className="text-red-400">95%</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full w-[95%] animate-pulse"></div>
                                </div>
                                <div className="mt-2 text-right">
                                    <span className="text-[9px] text-red-500 font-bold uppercase">PUMP-OUT REQUIRED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeCaptainTab === 'bluecard' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest flex items-center gap-2">
                            <Droplets size={12} /> DIGITAL BLUE KART (MAVİ KART)
                        </div>
                        <div className="bg-sky-500/10 text-sky-500 text-[9px] font-bold px-2 py-0.5 rounded border border-sky-500/20">
                            COMPLIANT
                        </div>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                        {/* QR Code Placeholder */}
                        <div className="w-16 h-16 bg-white p-1 rounded">
                            <div className="w-full h-full bg-black/10 flex items-center justify-center text-[8px] text-black font-mono text-center leading-none">
                                TR-CSB<br/>DIGITAL<br/>VERIFIED
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-[10px] border-b border-zinc-800 pb-1">
                                <span className="text-zinc-500">Card ID</span>
                                <span className="font-mono text-zinc-300">WIM-99281-25</span>
                            </div>
                            <div className="flex justify-between text-[10px] border-b border-zinc-800 pb-1">
                                <span className="text-zinc-500">Last Discharge</span>
                                <span className="font-mono text-emerald-500">2 Days Ago</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">Next Mandatory</span>
                                <span className="font-mono text-amber-500">12 Days</span>
                            </div>
                        </div>
                    </div>
                    
                    <button className="w-full mt-4 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/50 text-sky-400 hover:text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <Recycle size={12} /> Request Pump-out
                    </button>
                </div>
            )}
        </div>
      );
  }

  // --- 3. GENERAL MANAGER UI (Ops & Finance) ---
  const GMDashboard = () => {
    const criticalLogs = logs.filter(log => log.type === 'critical' || log.type === 'alert');
    const [activeGmTab, setActiveGmTab] = useState<'ops' | 'facility' | 'congress'>('ops');
    const [zeroWasteStats, setZeroWasteStats] = useState<any>(null);
    const [blueFlagStatus, setBlueFlagStatus] = useState<any>(null);

    useEffect(() => {
        // Simulate fetching Facility data
        if (activeGmTab === 'facility') {
            facilityExpert.generateZeroWasteReport(() => {}).then(res => setZeroWasteStats(res));
            facilityExpert.checkSeaWaterQuality(() => {}).then(res => setBlueFlagStatus(res));
        }
    }, [activeGmTab]);
    
    return (
        <div className="space-y-6 text-zinc-800 dark:text-zinc-200 font-sans h-full flex flex-col p-4">
             {/* Executive Header */}
             <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-100 pb-4 flex-shrink-0">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Executive Operations</h2>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">CONFIDENTIAL • EYES ONLY</div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold bg-zinc-900 text-white px-2 py-1 rounded">GM: {userProfile.name}</div>
                </div>
            </div>

            {/* GM Sub-Tabs */}
            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1 flex-shrink-0">
                {['ops', 'facility', 'congress'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveGmTab(tab as any)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeGmTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            
            {activeGmTab === 'ops' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                <Anchor size={14} />
                                <span className="text-[10px] uppercase font-bold">Occupancy</span>
                            </div>
                            <div className="text-2xl font-bold">{vesselsInPort} <span className="text-sm font-normal text-zinc-400">/ 600</span></div>
                            <div className="text-[10px] text-emerald-600 font-bold mt-1">↑ 4% vs last week</div>
                        </div>
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                <CheckCircle2 size={14} />
                                <span className="text-[10px] uppercase font-bold">Movements</span>
                            </div>
                            <div className="text-2xl font-bold">{registry.length}</div>
                            <div className="text-[10px] text-zinc-400 mt-1">Today's traffic</div>
                        </div>
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                <DollarSign size={14} />
                                <span className="text-[10px] uppercase font-bold">Revenue (Est)</span>
                            </div>
                            <div className="text-2xl font-bold">€{(vesselsInPort * 1.5 * 100).toFixed(0)}</div>
                            <div className="text-[10px] text-zinc-400 mt-1">Daily Mooring Accrual</div>
                        </div>
                    </div>

                    {/* Critical Issues */}
                    <div>
                        <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-3">Critical Incidents</h3>
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg overflow-hidden">
                            {criticalLogs.length > 0 ? (
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                        <tr>
                                            <th className="p-2">Time</th>
                                            <th className="p-2">Source</th>
                                            <th className="p-2">Event</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                                        {criticalLogs.slice(0,5).map((log, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-mono text-zinc-500">{log.timestamp}</td>
                                                <td className="p-2 font-bold text-red-700 dark:text-red-400">{log.source}</td>
                                                <td className="p-2">{typeof log.message === 'string' ? log.message : 'System Alert'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-4 text-center text-zinc-500 text-sm">System Green. No critical anomalies.</div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {activeGmTab === 'facility' && (
                <div className="space-y-4">
                    {/* BLUE FLAG / SEA WATER HUD */}
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl relative overflow-hidden">
                        {/* Background Wave Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Flag size={14} className={blueFlagStatus?.status === 'BLUE' ? "text-blue-500 fill-blue-500 animate-pulse" : "text-red-500"} />
                                BLUE FLAG STATUS
                            </div>
                            <div className={`text-[9px] font-bold px-2 py-0.5 rounded border ${blueFlagStatus?.status === 'BLUE' ? 'bg-blue-500 text-white border-blue-400' : 'bg-red-500 text-white border-red-400'}`}>
                                {blueFlagStatus?.status === 'BLUE' ? 'FLYING' : 'LOWERED'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-black/40 p-3 rounded border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Microscope size={12} className="text-blue-400"/>
                                    <span className="text-[10px] text-blue-300 uppercase font-bold">E. Coli Analysis</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{blueFlagStatus?.data?.e_coli || '--'} <span className="text-[10px] text-zinc-400 font-normal">cfu/100ml</span></div>
                                <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                                    <div className={`h-full ${blueFlagStatus?.data?.e_coli < 100 ? 'bg-emerald-500' : 'bg-amber-500'} w-[15%]`}></div>
                                </div>
                            </div>
                            
                            <div className="bg-black/40 p-3 rounded border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck size={12} className="text-emerald-400"/>
                                    <span className="text-[10px] text-emerald-300 uppercase font-bold">HSE Compliance</span>
                                </div>
                                <div className="text-2xl font-bold text-white">100%</div>
                                <div className="text-[10px] text-zinc-400">Lifeguard On Duty</div>
                            </div>
                        </div>
                    </div>

                    {/* ZERO WASTE HUD */}
                    <div className="bg-emerald-900/10 border border-emerald-500/30 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <Recycle size={14} /> ZERO WASTE COMPLIANCE (SIFIR ATIK)
                            </div>
                            <div className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                                {wimMasterData.facility_management?.environmental_compliance.zero_waste_certificate}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-zinc-200 dark:border-zinc-700">
                                <div className="text-xs text-zinc-500 mb-1">Recycling Rate</div>
                                <div className="text-2xl font-bold text-emerald-500">{zeroWasteStats?.recyclingRate || 45}%</div>
                                <div className="text-[9px] text-zinc-400">Target: >40%</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-zinc-200 dark:border-zinc-700">
                                <div className="text-xs text-zinc-500 mb-1">Next Audit</div>
                                <div className="text-xl font-bold text-zinc-800 dark:text-zinc-200">{zeroWasteStats?.nextAudit || '2025-12-15'}</div>
                                <div className="text-[9px] text-orange-500">Ministry of Env. (EÇBS)</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[9px] font-bold text-zinc-500 uppercase">Waste Separation Stream (Kg)</div>
                            <div className="flex gap-1 h-4 rounded overflow-hidden">
                                <div className="bg-blue-500 w-[35%]" title="Paper (Blue)"></div>
                                <div className="bg-yellow-400 w-[25%]" title="Plastic (Yellow)"></div>
                                <div className="bg-green-500 w-[15%]" title="Glass (Green)"></div>
                                <div className="bg-gray-400 w-[10%]" title="Metal (Grey)"></div>
                                <div className="bg-orange-500 w-[5%]" title="Hazardous (Orange)"></div>
                                <div className="bg-zinc-800 w-[10%]" title="Domestic (Black)"></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-zinc-400">
                                <span>Paper</span>
                                <span>Plastic</span>
                                <span>Glass</span>
                                <span>Haz.</span>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Alerts */}
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Infrastructure Health</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-red-500/10 border border-red-500/20 rounded">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
                                    <AlertTriangle size={12} /> Pedestal B-12
                                </div>
                                <span className="text-[9px] text-red-500">BREAKER TRIP</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-xs">
                                    <Droplets size={12} /> Main Water Line C
                                </div>
                                <span className="text-[9px] text-emerald-500">PRESSURE NORMAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeGmTab === 'congress' && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
                    <Activity size={32} className="mx-auto text-zinc-400 mb-2"/>
                    <div className="text-sm text-zinc-500 italic">
                        Congress Management Module Active.
                        <br/>See "ADA.CONGRESS" in Sidebar for full details.
                    </div>
                </div>
            )}

            </div>
        </div>
    );
  }

  // --- EMERGENCY DASHBOARD (RED ALERT) ---
  const EmergencyDashboard = () => (
      <div className="h-full flex flex-col bg-zinc-950 border-l-4 border-red-600 p-6 animate-pulse-slow">
          <div className="flex items-center justify-between border-b border-red-900/50 pb-6 mb-6">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-600 rounded-lg animate-pulse">
                      <Siren size={32} className="text-white" />
                  </div>
                  <div>
                      <h1 className="text-3xl font-black text-red-500 tracking-tighter">GUARDIAN PROTOCOL</h1>
                      <div className="text-xs font-mono text-red-400/70">CODE RED ACTIVE • SILENCE PROTOCOL IN EFFECT</div>
                  </div>
              </div>
              <div className="text-right">
                  <div className="text-4xl font-black text-red-600">00:04:12</div>
                  <div className="text-[10px] uppercase tracking-widest text-red-800">Time Elapsed</div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-6 flex-1">
              <div className="space-y-6">
                  <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <MapIcon size={14} /> Incident Zone
                      </h3>
                      <div className="text-2xl font-bold text-white mb-1">Pontoon A-05</div>
                      <div className="text-sm text-red-400">Type: Collision / Fire Risk</div>
                  </div>

                  <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Wind size={14} /> Environmental Factors
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <div className="text-[10px] text-red-400 uppercase">Wind Dir</div>
                              <div className="text-xl font-bold text-white">NW (310°)</div>
                              <div className="text-[10px] text-zinc-500">Pushing smoke to sea</div>
                          </div>
                          <div>
                              <div className="text-[10px] text-red-400 uppercase">Speed</div>
                              <div className="text-xl font-bold text-white">18 kn</div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="space-y-6">
                  <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl h-full">
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Anchor size={14} /> Asset Status
                      </h3>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 bg-red-900/20 rounded border border-red-900/30">
                              <span className="text-sm font-bold text-white">wimCharlie (Fire)</span>
                              <span className="text-xs font-bold text-emerald-500 bg-emerald-900/20 px-2 py-1 rounded">ON SCENE</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-red-900/20 rounded border border-red-900/30">
                              <span className="text-sm font-bold text-white">wimAlfa (Rescue)</span>
                              <span className="text-xs font-bold text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">EN ROUTE (2m)</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-red-900/20 rounded border border-red-900/30">
                              <span className="text-sm font-bold text-white">Security Patrol</span>
                              <span className="text-xs font-bold text-emerald-500 bg-emerald-900/20 px-2 py-1 rounded">PERIMETER SECURE</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  // --- MAIN RENDER LOGIC ---
  if (isRedAlert) {
      return (
        <aside className={`flex flex-col bg-zinc-950 border-l border-red-900 transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[600px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
            <EmergencyDashboard />
        </aside>
      );
  }

  if (userProfile.role === 'GUEST' && isOpen) {
      return (
        <aside className={`flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[360px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
            {!isPanel && (
              <div className="absolute top-2 right-2 z-50 lg:hidden">
                  <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full"><X size={16}/></button>
              </div>
            )}
            <GuestDashboard />
        </aside>
      );
  }

  if (userProfile.role === 'CAPTAIN' && isOpen) {
      return (
        <aside className={`flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[400px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
            {/* CAPTAIN HEADER */}
            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-zinc-900 text-white">
                <div className="flex items-center gap-2">
                   <Ship size={18} />
                   <span className="font-bold tracking-wider text-xs">VESSEL COMMAND</span>
                </div>
                {!isPanel && (
                    <button onClick={onClose} className="text-zinc-400 lg:hidden">
                        <X size={18} />
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
                <CaptainDashboard />
            </div>
        </aside>
      );
  }

  return (
    <aside className={`flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[400px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
      
      {/* HEADER */}
      <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
           <Activity size={18} />
           <span className="font-bold tracking-wider text-xs">LIVE OPERATIONS</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onOpenTrace} className="text-indigo-500 hover:text-indigo-400 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded">
                Brain Trace
            </button>
            <button onClick={onGenerateReport} className="text-zinc-500 hover:text-zinc-300" title="Daily Report">
                <FileText size={16} />
            </button>
            {!isPanel && (
                <button onClick={onClose} className="text-zinc-500 lg:hidden">
                    <X size={18} />
                </button>
            )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <GMDashboard />
      </div>
    </aside>
  );
};
