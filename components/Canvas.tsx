
import React, { useState, useEffect } from 'react';
import { 
  Activity, Anchor, AlertTriangle, Ship, Thermometer, Wind, Map as MapIcon, 
  List, X, FileText, BrainCircuit, Droplets, Zap, Gauge, Battery, 
  Clock, Calendar, CloudRain, Sun, Utensils, ShoppingBag, Wifi, Info, 
  Car, PartyPopper, CheckCircle2, Siren, Radio, Lock, Flame, Music, Leaf, Recycle, DollarSign, Flag, Microscope, LifeBuoy, ShieldCheck, Plane,
  Users, Store, TrendingUp, BookOpen 
} from 'lucide-react';
import { RegistryEntry, Tender, TrafficEntry, UserProfile, WeatherForecast, CongressEvent, Delegate, TravelItinerary } from '../types';
import { wimMasterData } from '../services/wimMasterData';
import { marinaExpert } from '../services/agents/marinaAgent';
import { technicExpert } from '../services/agents/technicAgent';
import { congressExpert } from '../services/agents/congressAgent'; 
import { facilityExpert } from '../services/agents/facilityAgent'; 
import { kitesExpert } from '../services/agents/travelAgent';
import { hrExpert } from '../services/agents/hrAgent';
import { commercialExpert } from '../services/agents/commercialAgent';
import { analyticsExpert } from '../services/agents/analyticsAgent';
import { berthExpert } from '../services/agents/berthAgent';
import { reservationsExpert } from '../services/agents/reservationsAgent';


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

            {activeCaptainTab === 'finance' && (
                <div className="space-y-4">
                    {/* Finance content would go here */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck size={64} />
                        </div>
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={12} className="text-blue-500"/> INSURANCE POLICY
                            </div>
                            <div className="bg-emerald-500/10 text-emerald-500 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                                ACTIVE
                            </div>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <div className="text-lg font-bold text-zinc-200">Turk P&I <span className="text-xs font-normal text-zinc-500">Gold Hull & Machinery</span></div>
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>Policy #: TR-99281</span>
                                <span>Exp: 14 Days</span>
                            </div>
                        </div>
                        <button className="mt-4 w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 hover:text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <Zap size={12} /> Get Renewal Quote
                        </button>
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
    const [activeGmTab, setActiveGmTab] = useState<'ops' | 'fleet' | 'facility' | 'congress' | 'hr' | 'commercial' | 'analytics' | 'berths' | 'bookings'>('ops');
    const [zeroWasteStats, setZeroWasteStats] = useState<any>(null);
    const [blueFlagStatus, setBlueFlagStatus] = useState<any>(null);
    const [eventDetails, setEventDetails] = useState<CongressEvent | null>(null);
    const [delegates, setDelegates] = useState<Delegate[]>([]);
    const [hrData, setHrData] = useState<any>(null);
    const [commercialData, setCommercialData] = useState<any[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [berthAllocation, setBerthAllocation] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {
        if (activeGmTab === 'facility') {
            facilityExpert.generateZeroWasteReport(() => {}).then(res => setZeroWasteStats(res));
            facilityExpert.checkSeaWaterQuality(() => {}).then(res => setBlueFlagStatus(res));
        }
        if (activeGmTab === 'congress') {
            congressExpert.getEventDetails().then(setEventDetails);
            congressExpert.getDelegates().then(setDelegates);
        }
        if (activeGmTab === 'hr') {
            hrExpert.getShiftSchedule('Security', () => {}).then(setHrData);
        }
        if (activeGmTab === 'commercial') {
            commercialExpert.getTenantLeases(() => {}).then(setCommercialData);
        }
        if (activeGmTab === 'analytics') {
            analyticsExpert.predictOccupancy('3M', () => {}).then(setAnalyticsData);
        }
        if (activeGmTab === 'berths') {
            // Simulation for Phisedelia
            berthExpert.findOptimalBerth({ loa: 20.4, beam: 5.6, draft: 4.7, type: 'VO65 Racing Yacht' }, () => {}).then(setBerthAllocation);
        }
        if (activeGmTab === 'bookings') {
            // Simulation for new Booking
            reservationsExpert.processBooking({ name: "S/Y Wind Chaser", type: "Sailing Yacht", loa: 16, beam: 4.5 }, { start: "2025-06-10", end: "2025-06-15" }, () => {}).then(res => setBookings([res.proposal]));
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
            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1 flex-shrink-0 overflow-x-auto">
                {['ops', 'fleet', 'facility', 'congress', 'hr', 'commercial', 'analytics', 'berths', 'bookings'].map(tab => (
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
            
            {activeGmTab === 'fleet' && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Ship size={14} /> Fleet Status (Tenders)
                    </h3>
                    <div className="space-y-3">
                        {tenders.map((tender) => {
                            const statusColor = tender.status === 'Idle' ? 'bg-emerald-500' : tender.status === 'Busy' ? 'bg-amber-500' : 'bg-red-500';
                            return (
                                <div key={tender.id} className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                                        <div>
                                            <span className="font-mono font-bold text-sm text-zinc-800 dark:text-zinc-200">{tender.name}</span>
                                            <span className="block text-[10px] text-zinc-500 uppercase">{tender.status}</span>
                                        </div>
                                    </div>
                                    {tender.status === 'Busy' && tender.assignment && (
                                        <div className="text-right">
                                            <span className="text-[10px] text-zinc-500 block">ASSIGNED TO</span>
                                            <span className="font-mono font-bold text-sm text-indigo-500">{tender.assignment}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeGmTab === 'facility' && (
                <div className="space-y-4">
                    {/* BLUE FLAG / SEA WATER HUD */}
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl relative overflow-hidden">
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

            {activeGmTab === 'congress' && eventDetails && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} /> ADA.CONGRESS.KITES
                            </div>
                            <div className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                                {eventDetails.name}
                            </div>
                        </div>
                        <div className="bg-indigo-500/10 text-indigo-500 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-500/20">
                            {eventDetails.status}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Delegate Status */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                                <div className="text-[10px] text-zinc-500 uppercase">Registered</div>
                                <div className="text-xl font-bold">{eventDetails.delegateCount}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                                <div className="text-[10px] text-zinc-500 uppercase">Checked-In</div>
                                <div className="text-xl font-bold text-emerald-500">{delegates.filter(d => d.status === 'CHECKED_IN').length}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                                <div className="text-[10px] text-zinc-500 uppercase">In Transit</div>
                                <div className="text-xl font-bold text-amber-500">{delegates.filter(d => d.status === 'IN_TRANSIT').length}</div>
                            </div>
                        </div>

                        {/* Live Venue Feed */}
                        <div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Delegate Status</div>
                            <div className="space-y-2 text-xs">
                                {delegates.map(del => (
                                     <div key={del.id} className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                                        <div>
                                            <span className="font-bold">{del.name}</span>
                                            <span className="text-zinc-500 ml-2">({del.company})</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            del.status === 'CHECKED_IN' ? 'bg-emerald-500/10 text-emerald-500' :
                                            del.status === 'IN_TRANSIT' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-zinc-700/10 text-zinc-400'
                                        }`}>{del.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeGmTab === 'hr' && hrData && (
                 <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 uppercase tracking-widest">
                        <Users size={14} className="inline-block -mt-1 mr-2"/> HR / Shift Status
                    </h3>
                    <div className="space-y-2 text-xs">
                        {hrData.schedule.map((staff: any) => (
                             <div key={staff.name} className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                                <div>
                                    <span className="font-bold">{staff.name}</span>
                                    <span className="text-zinc-500 ml-2">({hrData.department})</span>
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">{staff.status}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {activeGmTab === 'commercial' && (
                 <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                     <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 uppercase tracking-widest">
                        <Store size={14} className="inline-block -mt-1 mr-2"/> Commercial Tenants
                    </h3>
                     <div className="space-y-2 text-xs">
                        {commercialData.map((tenant: any) => (
                            <div key={tenant.id} className="flex justify-between items-center p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                                <div>
                                    <span className="font-bold">{tenant.name}</span>
                                    <span className="text-zinc-500 ml-2">(Rent: €{tenant.rent})</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tenant.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                                    {tenant.status}
                                </span>
                            </div>
                        ))}
                    </div>
                 </div>
            )}

            {activeGmTab === 'analytics' && analyticsData && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 uppercase tracking-widest">
                        <TrendingUp size={14} className="inline-block -mt-1 mr-2"/> Strategic Analytics
                    </h3>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded text-center">
                        <div className="text-xs text-zinc-500 uppercase">Predicted Occupancy ({analyticsData.period})</div>
                        <div className="text-5xl font-black text-indigo-500 my-2">{analyticsData.prediction}%</div>
                        <div className="text-[10px] text-zinc-400">(Confidence: {analyticsData.confidence}%)</div>
                    </div>
                </div>
            )}

            {activeGmTab === 'berths' && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                            <Anchor size={14} /> Harbormaster Control
                        </h3>
                        <div className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded font-bold">
                            Dynamic Pricing Active
                        </div>
                    </div>

                    {/* Berth Map Visual (Simplified) */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {Object.entries(wimMasterData.assets.berth_map).map(([key, data]) => (
                            <div key={key} className="bg-white dark:bg-zinc-900 p-3 rounded border border-zinc-200 dark:border-zinc-700 relative overflow-hidden">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-xs">{key === 'T' ? 'T-Head' : `Pontoon ${key}`}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${data.tier === 'VIP' ? 'bg-purple-500/10 text-purple-500' : data.tier === 'PREMIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-500/10 text-zinc-500'}`}>{data.tier}</span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full" style={{ width: data.status === 'FULL' ? '100%' : data.status.replace('%', '') + '%' }}></div>
                                </div>
                                <div className="text-[9px] text-zinc-400 mt-1 text-right">{data.status} Occupied</div>
                            </div>
                        ))}
                    </div>

                    {/* Optimal Assignment Card */}
                    {berthAllocation && (
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Inbound Vessel Analysis</div>
                            <div className="bg-white dark:bg-zinc-900 p-3 rounded border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-indigo-500">S/Y Phisedelia</div>
                                        <div className="text-[10px] text-zinc-500">VO65 Racing Yacht (ex-Mapfre) • 20.4m x 5.6m</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-500">€{berthAllocation.priceQuote}</div>
                                        <div className="text-[9px] text-zinc-400">per day (Dynamic)</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-500 font-medium">Optimal Allocation</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{berthAllocation.berth}</span>
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">CONFIRMED</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded text-indigo-700 dark:text-indigo-300 italic border border-indigo-100 dark:border-indigo-800/30">
                                        <span className="font-bold not-italic text-[10px] uppercase text-indigo-400 block mb-1">Logic Trace:</span>
                                        "{berthAllocation.reasoning}"
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                         <span className="text-[9px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500">Reg: Art. E.7.4</span>
                                         <span className="text-[9px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500">Multiplier: {berthAllocation.pontoon === 'VIP' ? '2.5x' : berthAllocation.pontoon === 'T' ? '1.25x' : '1.0x'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeGmTab === 'bookings' && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen size={14} /> Online Reservations
                    </h3>
                    <div className="space-y-3">
                        {bookings.length === 0 ? (
                            <div className="text-xs text-zinc-500 italic text-center p-4">No active booking requests.</div>
                        ) : (
                            bookings.map((booking, i) => (
                                <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold block">S/Y Wind Chaser</span>
                                            <span className="text-[10px] text-zinc-500">June 10 - June 15</span>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-500">€{booking.totalCost.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-2 text-[10px] bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
                                        Auto-Assigned: <strong>{booking.berth}</strong> <span className="text-zinc-500">({booking.reasoning})</span>
                                    </div>
                                </div>
                            ))
                        )}
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