
import React from 'react';
import { Activity, X, FileText, Ship } from 'lucide-react';
import { RegistryEntry, Tender, TrafficEntry, UserProfile, WeatherForecast, AgentTraceLog } from '../types';
import { GuestDashboard } from './dashboards/GuestDashboard';
import { CaptainDashboard } from './dashboards/CaptainDashboard';
import { GMDashboard } from './dashboards/GMDashboard';
import { EmergencyDashboard } from './dashboards/EmergencyDashboard';

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
  agentTraces: AgentTraceLog[]; 
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
  agentTraces,
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

  if (isRedAlert) {
      return (
        <aside className={`flex flex-col bg-zinc-950 border-l border-red-900 transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[600px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
            <EmergencyDashboard />
        </aside>
      );
  }

  if (userProfile.role === 'GUEST') {
      return (
        <aside className={`flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[360px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
            {!isPanel && (
              <div className="absolute top-2 right-2 z-50 lg:hidden">
                  <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full"><X size={16}/></button>
              </div>
            )}
            <GuestDashboard userProfile={userProfile} />
        </aside>
      );
  }

  if (userProfile.role === 'CAPTAIN') {
      return (
        <aside className={`flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[400px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-zinc-900 text-white">
                <div className="flex items-center gap-2">
                   <Ship size={18} />
                   <span className="font-bold tracking-wider text-xs">VESSEL COMMAND</span>
                </div>
                {!isPanel && <button onClick={onClose} className="text-zinc-400 lg:hidden"><X size={18} /></button>}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
                <CaptainDashboard />
            </div>
        </aside>
      );
  }

  return (
    <aside className={`flex flex-col bg-panel-light dark:bg-panel-dark border-l border-border-light dark:border-border-dark transition-all duration-300 ${isOpen ? 'w-[320px] lg:w-[400px]' : 'w-0 hidden'} ${isPanel ? '' : 'fixed right-0 top-0 h-full z-50'}`}>
      <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
           <Activity size={18} />
           <span className="font-bold tracking-wider text-xs">LIVE OPERATIONS</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onOpenTrace} className="text-indigo-500 hover:text-indigo-400 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded">Brain Trace</button>
            <button onClick={onGenerateReport} className="text-zinc-500 hover:text-zinc-300" title="Daily Report"><FileText size={16} /></button>
            {!isPanel && <button onClick={onClose} className="text-zinc-500 lg:hidden"><X size={18} /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <GMDashboard 
            userProfile={userProfile}
            logs={logs}
            registry={registry}
            tenders={tenders}
            vesselsInPort={vesselsInPort}
            agentTraces={agentTraces}
          />
      </div>
    </aside>
  );
};
