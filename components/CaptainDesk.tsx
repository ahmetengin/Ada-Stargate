import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, WeatherForecast, VesselIntelligenceProfile } from '../types';
import { Ship, DollarSign, List, Wind, Sun, CloudRain, Droplets, X, AlertTriangle } from 'lucide-react';
import { marinaExpert } from '../services/agents/marinaAgent';
import { financeExpert } from '../services/agents/financeAgent';

interface CaptainDeskProps {
  userProfile: UserProfile;
  weatherData: WeatherForecast[];
  logs: any[];
  isOpen: boolean;
  onClose: () => void;
}

export const CaptainDesk: React.FC<CaptainDeskProps> = ({ 
    userProfile, 
    weatherData,
    logs,
    isOpen,
    onClose
}) => {
  const [vesselProfile, setVesselProfile] = useState<VesselIntelligenceProfile | null>(null);
  const [financialStatus, setFinancialStatus] = useState<{ amount: number; status: string } | null>(null);
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1280 : false);
  
  // For this demo, we'll hardcode the vessel name associated with Cpt. Barbaros
  const captainVesselName = 'S/Y Phisedelia';

  useEffect(() => {
    if (isOpen) {
        marinaExpert.getVesselIntelligence(captainVesselName).then(setVesselProfile);
        financeExpert.checkDebt(captainVesselName).then(setFinancialStatus);
    }
  }, [isOpen]);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth > 300 && newWidth < 700) setWidth(newWidth);
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

  useEffect(() => {
    const checkScreenSize = () => setIsTabletOrMobile(window.innerWidth < 1280);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const filteredLogs = logs.filter(log => {
      const message = (typeof log.message === 'string' ? log.message : JSON.stringify(log.message)).toLowerCase();
      const isVesselSpecific = message.includes(captainVesselName.toLowerCase());
      const isGeneralSafety = ['atc_log', 'ENVIRONMENTAL_ALERT', 'alert'].includes(log.type) || log.source.includes('weather');
      return isVesselSpecific || isGeneralSafety;
  }).slice(0, 10); // Limit to recent logs

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return <Sun size={24} className="text-yellow-500" />;
      case 'Cloudy': return <CloudRain size={24} className="text-zinc-400" />;
      case 'Rain': return <CloudRain size={24} className="text-blue-400" />;
      default: return <Sun size={24} className="text-yellow-500" />;
    }
  };
  
  if (!isOpen) return null;

  return (
    <div 
      className={`
        flex flex-col h-full border-l border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 
        transition-all duration-300 shadow-2xl
        ${isTabletOrMobile ? 'fixed inset-0 w-full z-[60]' : 'relative flex-shrink-0 z-30'}
      `}
      style={!isTabletOrMobile ? { width: width } : { width: '100%' }}
    >
        {!isTabletOrMobile && (
            <div 
                className={`absolute top-0 left-0 w-[3px] h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-50 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
                onMouseDown={startResizing}
            />
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-900">
            <div className="flex items-center gap-2">
                <Ship size={16} className="text-indigo-500" />
                <span className="font-bold text-xs tracking-widest uppercase">Captain's Desk</span>
            </div>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                <X size={14} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-zinc-50 dark:bg-[#0c0c0e]">
            
            {/* Vessel Profile Card */}
            {vesselProfile && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">{vesselProfile.name}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            vesselProfile.status === 'DOCKED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>{vesselProfile.status}</span>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>IMO: {vesselProfile.imo}</span>
                        <span>Flag: {vesselProfile.flag}</span>
                        <span>Type: {vesselProfile.type}</span>
                        <span>LOA: {vesselProfile.loa}m</span>
                        <span className="col-span-2">Location: {vesselProfile.location}</span>
                    </div>
                </div>
            )}

            {/* Weather & Finance */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{weatherData[0].temp}°</div>
                            <div className="text-xs text-zinc-500">{weatherData[0].condition}</div>
                        </div>
                        {getWeatherIcon(weatherData[0].condition)}
                    </div>
                    <div className="text-xs mt-2 text-zinc-500 flex items-center gap-2 font-mono">
                         <Wind size={12} /> {weatherData[0].windSpeed} kn {weatherData[0].windDir}
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
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
    </div>
  );
};
