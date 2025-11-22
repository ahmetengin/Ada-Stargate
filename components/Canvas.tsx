import React, { useState, useCallback, useEffect } from 'react';
import { List, Ship, Cloud, Radar, AlertTriangle, Wind, Sun, CloudRain, BrainCircuit, Printer, X, Wrench, BarChart, Map as MapIcon } from 'lucide-react';
import { RegistryEntry, Tender, UserProfile, TrafficEntry, WeatherForecast, VesselIntelligenceProfile, MaintenanceJob } from '../types';
import { marinaExpert } from '../services/agents/marinaAgent';
import { technicExpert } from '../services/agents/technicAgent';

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
  isPanel: boolean; // New prop
}

export const Canvas: React.FC<CanvasProps> = ({ 
  logs, 
  trafficQueue,
  weatherData,
  vesselsInPort,
  onOpenTrace,
  onGenerateReport,
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isPanel
}) => {
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  const TABS = [
    { id: 'feed', label: 'Feed', icon: List },
    { id: 'fleet', label: 'Fleet', icon: Ship },
    { id: 'tech', label: 'Tech', icon: Wrench },
    { id: 'ais', label: 'AIS', icon: Radar },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'weather', label: 'Weather', icon: Cloud },
  ];

  const getRowStyle = (log: any) => {
    const type = log.type || 'info';
    if (type === 'critical') return 'bg-red-500/10 text-red-400';
    if (type === 'alert' || type === 'atc_log') return 'bg-amber-500/10 text-amber-400';
    if (type === 'passkit_issued') return 'bg-indigo-500/10 text-indigo-300';
    return 'text-zinc-400';
  };

  const getSourceColor = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('security')) return 'text-red-400';
    if (s.includes('marina')) return 'text-indigo-400';
    if (s.includes('finance')) return 'text-emerald-400';
    if (s.includes('vhf')) return 'text-orange-400';
    if (s.includes('weather')) return 'text-sky-400';
    if (s.includes('atc')) return 'text-amber-400';
    if (s.includes('intelligence')) return 'text-sky-400';
    if (s.includes('maintenance') || s.includes('technic')) return 'text-blue-400';
    if (s.includes('sea')) return 'text-teal-400';
    if (s.includes('customer')) return 'text-purple-400';
    if (s.includes('passkit')) return 'text-pink-400';
    return 'text-zinc-500';
  };

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

  const CanvasContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark flex-shrink-0">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
          <BarChart size={16} className="text-indigo-500" />
          <span className="font-bold text-xs tracking-widest uppercase">Operations Desk</span>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={onGenerateReport} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50" title="Daily Report">
                <Printer size={14} />
            </button>
            <button onClick={onOpenTrace} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50" title="Agent Trace">
                <BrainCircuit size={14} />
            </button>
            {!isPanel && (
                <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-md transition-colors">
                    <X size={14} />
                </button>
            )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-px bg-border-light dark:bg-border-dark flex-shrink-0">
          <div className="p-3 bg-panel-light dark:bg-panel-dark text-center">
              <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-0.5">Fleet</div>
              <div className="text-lg font-bold text-zinc-700 dark:text-zinc-200 font-mono">{vesselsInPort}</div>
          </div>
          <div className="p-3 bg-panel-light dark:bg-panel-dark text-center">
              <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-0.5">Traffic</div>
              <div className="text-lg font-bold text-zinc-700 dark:text-zinc-200 font-mono">{trafficQueue.length}</div>
          </div>
          <div className="p-3 bg-panel-light dark:bg-panel-dark text-center">
              <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-0.5">Alerts</div>
              <div className={`text-lg font-bold font-mono ${logs.filter(l => l.type === 'critical').length > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-700 dark:text-zinc-200'}`}>
                  {logs.filter(l => l.type === 'critical' || l.type === 'warning').length}
              </div>
          </div>
      </div>
      
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
             <div className="font-mono text-[11px] space-y-1">
                 {logs.slice(0, 100).map(log => (
                     <div key={log.id} className={`flex items-start gap-3 p-1.5 rounded-sm ${getRowStyle(log)}`}>
                        <div className="w-16 opacity-70 shrink-0">{log.timestamp}</div>
                        <div className={`w-24 font-bold shrink-0 ${getSourceColor(log.source)}`}>{log.source}</div>
                        <div className="flex-1 break-words leading-relaxed">{typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}</div>
                     </div>
                 ))}
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
  );

  const baseClasses = `flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark select-none transition-all duration-300`;

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