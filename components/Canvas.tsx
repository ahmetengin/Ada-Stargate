
import React from 'react';
import { ExternalLink, RefreshCcw, List, Printer, Cloud, Globe, Map, Search, Ship } from 'lucide-react';
import { RegistryEntry, Tender, TrafficEntry, UserProfile, WeatherForecast, AgentTraceLog } from '../types';

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
  tenders, 
  vesselsInPort
}) => {

  return (
    <div className="flex flex-col h-full font-sans text-zinc-400">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-800/50">
          <div className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">OPERATIONS DECK</div>
          <div className="flex gap-3 text-zinc-600">
              <ExternalLink size={12} className="hover:text-zinc-300 cursor-pointer" />
              <RefreshCcw size={12} className="hover:text-zinc-300 cursor-pointer" />
              <List size={12} className="hover:text-zinc-300 cursor-pointer" />
              <Printer size={12} className="hover:text-indigo-400 cursor-pointer bg-indigo-500/10 rounded p-0.5" />
              <Cloud size={12} className="hover:text-zinc-300 cursor-pointer" />
              <Globe size={12} className="hover:text-zinc-300 cursor-pointer" />
              <Map size={12} className="hover:text-zinc-300 cursor-pointer" />
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">VESSELS</div>
                  <div className="text-4xl font-bold text-indigo-400 font-mono">542</div>
              </div>
              <div className="text-center">
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">MOVEMENTS</div>
                  <div className="text-4xl font-bold text-zinc-200 font-mono">2</div>
              </div>
              <div className="text-center">
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">OCCUPANCY</div>
                  <div className="text-4xl font-bold text-emerald-500 font-mono">92%</div>
              </div>
          </div>

          {/* Tender Ops */}
          <div>
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-4">TENDER OPERATIONS</div>
              <div className="space-y-4">
                  {tenders.map(t => (
                      <div key={t.id} className="flex justify-between items-center group">
                          <div>
                              <div className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">{t.callsign || t.name}</div>
                              <div className="text-[9px] text-zinc-600">Station</div>
                          </div>
                          <div className={`text-[9px] font-bold ${t.status === 'Maintenance' ? 'text-red-500' : 'text-emerald-500'}`}>
                              {t.status.toUpperCase()}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Port Activity */}
          <div>
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-4">PORT ACTIVITY (REGISTRY)</div>
              <div className="space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between items-center">
                      <div className="flex gap-3">
                          <span className="text-zinc-500">13:16</span>
                          <span className="text-emerald-400 font-bold">S/Y Vertigo</span>
                      </div>
                      <span className="text-zinc-500">Transit Quay</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <div className="flex gap-3">
                          <span className="text-zinc-500">13:16</span>
                          <span className="text-emerald-400 font-bold">M/Y Solaris</span>
                      </div>
                      <span className="text-zinc-500">Transit Quay</span>
                  </div>
              </div>
          </div>

          {/* Fleet Roster */}
          <div>
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-4">FLEET ROSTER</div>
              
              {/* Search */}
              <div className="relative mb-4 group">
                  <Search size={12} className="absolute left-3 top-2.5 text-zinc-600 group-focus-within:text-indigo-400" />
                  <input 
                    type="text" 
                    placeholder="Search vessel by name, IMO, or flag..." 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 pl-8 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                  />
              </div>

              <div className="space-y-4">
                  {[
                      { name: "S/Y Phisedelia", imo: "987654321", flag: "MT", status: "DOCKED" },
                      { name: "M/Y Blue Horizon", imo: "123456789", flag: "KY", status: "DOCKED" },
                      { name: "S/Y Mistral", imo: "555666777", flag: "TR", status: "AT_ANCHOR" },
                      { name: "M/Y Poseidon", imo: "888999000", flag: "BS", status: "DOCKED" },
                      { name: "Catamaran Lir", imo: "111222333", flag: "FR", status: "DOCKED" },
                      { name: "S/Y Aegeas", imo: "444555666", flag: "GR", status: "OUTBOUND" },
                      { name: "M/Y Grand Turk", imo: "777888999", flag: "PA", status: "DOCKED" },
                  ].map((v, i) => (
                      <div key={i} className="flex justify-between items-start pb-3 border-b border-zinc-800/30 last:border-0">
                          <div>
                              <div className="text-xs font-bold text-zinc-200 mb-0.5">{v.name}</div>
                              <div className="text-[9px] font-mono text-zinc-600">IMO: {v.imo} | Flag: {v.flag}</div>
                          </div>
                          <div className={`text-[9px] font-mono mt-0.5 ${v.status === 'AT_ANCHOR' ? 'text-zinc-500' : v.status === 'OUTBOUND' ? 'text-amber-600' : 'text-zinc-600'}`}>
                              {v.status}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

      </div>
    </div>
  );
};
