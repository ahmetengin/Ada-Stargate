
import React, { useEffect, useRef } from 'react';
import { Anchor, DollarSign, Radio, Navigation, Ship, Clock } from 'lucide-react';
import { RegistryEntry, Tender, VhfLog, AisTarget } from '../../../types';
import { getCurrentMaritimeTime } from '../../../services/utils';
import { LiveMap } from './LiveMap';
import { BreachRadar } from './BreachRadar';
import { FinanceWidget } from './FinanceWidget';

interface OpsTabProps {
  vesselsInPort: number;
  registry: RegistryEntry[];
  criticalLogs: any[];
  tenders: Tender[];
  vhfLogs: VhfLog[];
  aisTargets?: AisTarget[];
}

export const OpsTab: React.FC<OpsTabProps> = ({ vesselsInPort, registry, criticalLogs, tenders, vhfLogs, aisTargets = [] }) => {
  const vhfEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll VHF logs
  useEffect(() => {
    vhfEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [vhfLogs]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
      
      {/* TOP DECK: KPI HEADERS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><Anchor size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Occupancy</div>
            <div className="text-2xl font-black text-zinc-200">{vesselsInPort} <span className="text-sm font-normal text-zinc-600">/ 600</span></div>
            <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{width: '92%'}}></div></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><Navigation size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Live Targets (AIS)</div>
            <div className="text-2xl font-black text-indigo-400">{aisTargets.length}</div>
            <div className="text-[9px] text-zinc-600">20nm Radius</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Daily Yield</div>
            <div className="text-2xl font-black text-emerald-500">€{(vesselsInPort * 1.5 * 100 / 1000).toFixed(1)}k</div>
            <div className="text-[9px] text-emerald-800">Target: €80k</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Maritime Time</div>
            <div className="text-xl font-mono font-bold text-amber-500">{getCurrentMaritimeTime().split(' ')[0]}</div>
            <div className="text-[9px] text-zinc-600">ZULU (UTC)</div>
        </div>
      </div>

      {/* MAIN DECK: MISSION CONTROL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          
          {/* COL 1 & 2 (Large): DIGITAL TWIN (MAP) */}
          <div className="lg:col-span-2 h-64 lg:h-auto min-h-[300px]">
              <LiveMap />
          </div>

          {/* COL 3: STACK (BREACH & FINANCE) */}
          <div className="grid grid-cols-1 gap-4 h-full min-h-[300px]">
              <div className="h-48 lg:h-1/2 min-h-[200px]">
                  <BreachRadar />
              </div>
              <div className="h-48 lg:h-1/2 min-h-[200px]">
                  <FinanceWidget />
              </div>
          </div>

          {/* BOTTOM ROW: LIVE VHF & ASSETS */}
          <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4 h-64 min-h-[250px]">
              {/* VHF LOGS */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                          <Radio size={14} className="animate-pulse" /> LIVE COMMS (CH 72)
                      </h3>
                      <div className="text-[9px] font-mono text-zinc-500">RX/TX ACTIVE</div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-black font-mono text-[10px]">
                      {vhfLogs.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                              <Radio size={24} className="opacity-20"/>
                              <span>Listening on Channel 72...</span>
                          </div>
                      ) : (
                          vhfLogs.map((log, idx) => (
                              <div key={idx} className={`p-2 rounded border-l-2 ${log.speaker === 'VESSEL' ? 'border-indigo-500 bg-indigo-900/10' : 'border-emerald-500 bg-emerald-900/10'}`}>
                                  <div className="flex justify-between text-zinc-500 mb-0.5">
                                      <span className="font-bold">{log.speaker === 'VESSEL' ? 'UNKNOWN VESSEL' : 'WIM CONTROL'}</span>
                                      <span>{log.timestamp}</span>
                                  </div>
                                  <div className="text-zinc-300 leading-tight">
                                      "{log.message}"
                                  </div>
                              </div>
                          ))
                      )}
                      <div ref={vhfEndRef} />
                  </div>
              </div>

              {/* ASSET TRACKER */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                          <Ship size={14} /> Asset Status
                      </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {tenders.map((tender) => (
                          <div key={tender.id} className="bg-black/40 border border-zinc-800 rounded p-3">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-zinc-300">{tender.name}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${tender.status === 'Busy' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : tender.status === 'Maintenance' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                      {tender.status.toUpperCase()}
                                  </span>
                              </div>
                              {tender.status === 'Busy' ? (
                                  <div className="text-[10px] text-zinc-400 bg-zinc-800/50 p-2 rounded border border-zinc-700/50 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                                      Mission: <span className="text-indigo-400 font-bold">{tender.assignment}</span>
                                  </div>
                              ) : (
                                  <div className="text-[10px] text-zinc-600 italic pl-1">
                                      Standing by at station.
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};
