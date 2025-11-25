
import React, { useEffect, useRef } from 'react';
import { Anchor, CheckCircle2, DollarSign, Radio, Navigation, Ship, AlertTriangle, Clock } from 'lucide-react';
import { RegistryEntry, Tender, VhfLog } from '../../../types';
import { getCurrentMaritimeTime } from '../../../services/utils';

interface OpsTabProps {
  vesselsInPort: number;
  registry: RegistryEntry[];
  criticalLogs: any[];
  tenders: Tender[];
  vhfLogs: VhfLog[];
}

export const OpsTab: React.FC<OpsTabProps> = ({ vesselsInPort, registry, criticalLogs, tenders, vhfLogs }) => {
  const vhfEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll VHF logs
  useEffect(() => {
    vhfEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [vhfLogs]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col">
      
      {/* TOP DECK: KPI HEADERS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><Anchor size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Occupancy</div>
            <div className="text-2xl font-black text-zinc-200">{vesselsInPort} <span className="text-sm font-normal text-zinc-600">/ 600</span></div>
            <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{width: '92%'}}></div></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><Navigation size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Movements (24h)</div>
            <div className="text-2xl font-black text-indigo-400">{registry.length}</div>
            <div className="text-[9px] text-zinc-600">{(registry.length * 1.2).toFixed(0)} Ops Predicted</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Daily Yield</div>
            <div className="text-2xl font-black text-emerald-500">€{(vesselsInPort * 1.5 * 100 / 1000).toFixed(1)}k</div>
            <div className="text-[9px] text-emerald-800">Target: €80k</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={32}/></div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Maritime Time</div>
            <div className="text-xl font-mono font-bold text-amber-500">{getCurrentMaritimeTime().split(' ')[0]}</div>
            <div className="text-[9px] text-zinc-600">ZULU (UTC)</div>
        </div>
      </div>

      {/* MAIN DECK: 3-COLUMN MISSION CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          
          {/* COL 1: LIVE TRAFFIC (RADAR) */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
              <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Navigation size={14} /> Traffic Control
                  </h3>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {registry.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-black/40 border border-zinc-800 rounded hover:border-indigo-500/30 transition-colors group">
                          <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded flex items-center justify-center ${entry.action === 'CHECK-IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                  <Ship size={12} />
                              </div>
                              <div>
                                  <div className="text-xs font-bold text-zinc-200">{entry.vessel}</div>
                                  <div className="text-[9px] text-zinc-500 flex gap-1">
                                      <span>{entry.timestamp}</span> • <span>{entry.location}</span>
                                  </div>
                              </div>
                          </div>
                          <div className="text-[9px] font-mono font-bold text-zinc-600 group-hover:text-zinc-400">
                              {entry.action === 'CHECK-IN' ? 'ARR' : 'DEP'}
                          </div>
                      </div>
                  ))}
                  {registry.length === 0 && <div className="text-center text-xs text-zinc-600 py-10">No active traffic.</div>}
              </div>
          </div>

          {/* COL 2: ASSET TRACKER (TENDERS) */}
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

          {/* COL 3: LIVE VHF STREAM (THE MATRIX) */}
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

      </div>

      {/* BOTTOM DECK: CRITICAL ALERTS */}
      {criticalLogs.length > 0 && (
        <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-3 flex-shrink-0 animate-pulse-slow">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                <AlertTriangle size={14} /> System Critical
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {criticalLogs.slice(0, 2).map((log, i) => (
                    <div key={i} className="text-xs text-red-300 bg-red-950/30 p-1.5 rounded flex justify-between">
                        <span>{typeof log.message === 'string' ? log.message : 'Alert'}</span>
                        <span className="font-mono opacity-50">{log.timestamp}</span>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
